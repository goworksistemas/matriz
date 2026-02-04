#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ETL HubSpot API → Supabase (Incremental + Low Memory)
=====================================================
Script otimizado que busca APENAS registros novos/modificados.

Modo de operação:
- Primeira execução: Full Sync (busca tudo)
- Execuções seguintes: Incremental (apenas modificados desde última execução)

Autor: GoWork Sistemas
Data: 2026-02-04
"""

import requests
import json
import sys
import gc
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional, Set, Generator, List
from supabase import create_client, Client

# ==============================================================================
# CONFIGURAÇÃO
# ==============================================================================

HUBSPOT_API_KEY = "pat-na1-c07bb41c-5c57-48e5-bbb3-bde56e0296ec"
SUPABASE_URL = "https://xggqzueehfvautkmaojy.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnZ3F6dWVlaGZ2YXV0a21hb2p5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTE5ODI0NSwiZXhwIjoyMDg0Nzc0MjQ1fQ.VfB3yazurvRfPNyfRZK3vYijUu3pPUebixpwAsni-ho"

HUBSPOT_HEADERS = {
    "Authorization": f"Bearer {HUBSPOT_API_KEY}",
    "Content-Type": "application/json"
}

SOURCE_SYSTEM = "HubSpot"
BATCH_SIZE = 200
API_PAGE_SIZE = 100

# ==============================================================================
# FUNÇÕES UTILITÁRIAS
# ==============================================================================

def get_timestamp() -> str:
    return datetime.now(timezone.utc).isoformat()

def safe_float(value: Any) -> Optional[float]:
    if value is None or value == '':
        return None
    try:
        return float(value)
    except:
        return None

def safe_str(value: Any) -> Optional[str]:
    if value is None or value == '':
        return None
    return str(value)

def free_memory():
    gc.collect()

def parse_iso_date(date_str: str) -> Optional[datetime]:
    """Converte string ISO para datetime"""
    if not date_str:
        return None
    try:
        # Remove timezone info para comparação
        if '+' in date_str:
            date_str = date_str.split('+')[0]
        if '.' in date_str:
            return datetime.strptime(date_str[:23], "%Y-%m-%dT%H:%M:%S.%f")
        return datetime.strptime(date_str[:19], "%Y-%m-%dT%H:%M:%S")
    except:
        return None

# ==============================================================================
# CLASSE ETL INCREMENTAL
# ==============================================================================

class HubSpotETL:
    def __init__(self):
        print("🚀 ETL HubSpot → Supabase (Incremental)")
        print("=" * 55)
        print(f"📅 Início: {get_timestamp()}")
        
        self.supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        
        # Sets para validação de FK
        self.valid_owner_ids: Set[str] = set()
        self.valid_pipeline_ids: Set[str] = set()
        self.valid_stage_ids: Set[str] = set()
        self.valid_contact_ids: Set[str] = set()
        self.valid_deal_ids: Set[str] = set()
        
        self.results: Dict[str, Dict] = {}
        self.is_incremental = False
        self.last_sync: Optional[datetime] = None
        
        print("✅ Conexão estabelecida\n")
    
    def get_last_extraction(self, table: str) -> Optional[datetime]:
        """Busca a data da última extração de uma tabela"""
        try:
            result = self.supabase.table(table)\
                .select("_extracted_at")\
                .order("_extracted_at", desc=True)\
                .limit(1)\
                .execute()
            
            if result.data and len(result.data) > 0:
                return parse_iso_date(result.data[0].get("_extracted_at"))
        except:
            pass
        return None
    
    def get_existing_ids(self, table: str, id_column: str = "hubspot_id") -> Set[str]:
        """Busca IDs existentes no banco para validação de FK"""
        ids = set()
        try:
            # Busca em lotes para não sobrecarregar memória
            offset = 0
            batch_size = 1000
            
            while True:
                result = self.supabase.table(table)\
                    .select(id_column)\
                    .range(offset, offset + batch_size - 1)\
                    .execute()
                
                if not result.data:
                    break
                
                for row in result.data:
                    val = row.get(id_column)
                    if val:
                        ids.add(str(val))
                
                if len(result.data) < batch_size:
                    break
                
                offset += batch_size
                
        except Exception as e:
            print(f"   ⚠️ Erro ao buscar IDs de {table}: {str(e)[:40]}")
        
        return ids
    
    def check_sync_mode(self):
        """Determina se é full sync ou incremental"""
        print("🔍 Verificando modo de sincronização...")
        
        # Verifica se já existe dados no banco
        last_contacts = self.get_last_extraction("hubspot_contacts")
        last_deals = self.get_last_extraction("hubspot_deals")
        
        if last_contacts and last_deals:
            # Usa a data mais antiga como referência
            self.last_sync = min(last_contacts, last_deals)
            # Subtrai 1 hora como margem de segurança
            self.last_sync = self.last_sync - timedelta(hours=1)
            self.is_incremental = True
            print(f"   📊 Modo: INCREMENTAL")
            print(f"   📅 Última sync: {self.last_sync.isoformat()}")
            print(f"   ⚡ Buscando apenas registros modificados após essa data")
        else:
            self.is_incremental = False
            print(f"   📊 Modo: FULL SYNC (primeira execução)")
        
        print()
    
    def load_existing_fk_ids(self):
        """Carrega IDs existentes para validação de FK"""
        print("🔗 Carregando IDs para validação de FK...")
        
        self.valid_owner_ids = self.get_existing_ids("hubspot_owners")
        print(f"   ✅ {len(self.valid_owner_ids)} owners")
        
        self.valid_pipeline_ids = self.get_existing_ids("hubspot_pipelines")
        print(f"   ✅ {len(self.valid_pipeline_ids)} pipelines")
        
        self.valid_stage_ids = self.get_existing_ids("hubspot_pipeline_stages", "stage_id")
        print(f"   ✅ {len(self.valid_stage_ids)} stages")
        
        self.valid_contact_ids = self.get_existing_ids("hubspot_contacts")
        print(f"   ✅ {len(self.valid_contact_ids)} contacts")
        
        self.valid_deal_ids = self.get_existing_ids("hubspot_deals")
        print(f"   ✅ {len(self.valid_deal_ids)} deals")
        
        print()
    
    def fetch_paginated(self, url: str, params: Dict, name: str) -> Generator:
        """Generator para busca paginada"""
        after = None
        total = 0
        
        print(f"🔎 Buscando {name}...")
        
        while True:
            req_params = params.copy()
            if after:
                req_params['after'] = after
            
            try:
                response = requests.get(url, headers=HUBSPOT_HEADERS, params=req_params, timeout=30)
                response.raise_for_status()
                data = response.json()
                
                for item in data.get("results", []):
                    total += 1
                    yield item
                
                print(f"\r   📥 {total} registros...", end="", flush=True)
                
                paging = data.get("paging")
                if paging and "next" in paging:
                    after = paging["next"]["after"]
                else:
                    break
                
                del data
                    
            except Exception as e:
                print(f"\n   ❌ Erro: {str(e)[:50]}")
                break
        
        print(f"\r   ✅ {total} {name} extraídos          ")
    
    def fetch_incremental(self, object_type: str, properties: List[str], name: str, associations: str = None) -> Generator:
        """
        Busca incremental usando Search API com filtro por lastmodifieddate
        """
        url = f"https://api.hubapi.com/crm/v3/objects/{object_type}/search"
        total = 0
        after = 0
        
        # Timestamp em milissegundos para a API
        since_timestamp = int(self.last_sync.timestamp() * 1000)
        
        print(f"🔎 Buscando {name} (modificados desde {self.last_sync.strftime('%Y-%m-%d %H:%M')})...")
        
        while True:
            body = {
                "filterGroups": [
                    {
                        "filters": [
                            {
                                "propertyName": "hs_lastmodifieddate",
                                "operator": "GTE",
                                "value": str(since_timestamp)
                            }
                        ]
                    }
                ],
                "properties": properties,
                "limit": API_PAGE_SIZE,
                "after": str(after) if after > 0 else None
            }
            
            # Remove after se for 0
            if after == 0:
                del body["after"]
            
            try:
                response = requests.post(url, headers=HUBSPOT_HEADERS, json=body, timeout=30)
                response.raise_for_status()
                data = response.json()
                
                results = data.get("results", [])
                
                # Se precisar de associações, busca separadamente
                if associations and results:
                    ids = [r.get("id") for r in results]
                    results = self.fetch_associations(object_type, ids, associations, results)
                
                for item in results:
                    total += 1
                    yield item
                
                print(f"\r   📥 {total} modificados...", end="", flush=True)
                
                paging = data.get("paging")
                if paging and "next" in paging:
                    after = int(paging["next"]["after"])
                else:
                    break
                
                del data, results
                    
            except Exception as e:
                print(f"\n   ❌ Erro: {str(e)[:50]}")
                break
        
        print(f"\r   ✅ {total} {name} modificados          ")
    
    def fetch_associations(self, object_type: str, ids: List[str], assoc_type: str, results: List[Dict]) -> List[Dict]:
        """Busca associações para uma lista de IDs"""
        if not ids:
            return results
        
        try:
            url = f"https://api.hubapi.com/crm/v3/objects/{object_type}/batch/read"
            body = {
                "inputs": [{"id": str(id)} for id in ids],
                "properties": [],
                "associations": [assoc_type]
            }
            
            response = requests.post(url, headers=HUBSPOT_HEADERS, json=body, timeout=30)
            response.raise_for_status()
            data = response.json()
            
            # Mapeia associações por ID
            assoc_map = {}
            for r in data.get("results", []):
                assoc_map[r.get("id")] = r.get("associations", {})
            
            # Adiciona associações aos resultados originais
            for r in results:
                r["associations"] = assoc_map.get(r.get("id"), {})
            
        except Exception as e:
            print(f"\n   ⚠️ Erro ao buscar associações: {str(e)[:40]}")
        
        return results
    
    def upsert_streaming(self, table: str, generator: Generator, transform_fn, conflict_col: str = "hubspot_id") -> Dict:
        """Processa e insere em streaming"""
        batch = []
        total = 0
        success = 0
        errors = 0
        
        print(f"   📤 Inserindo em {table}...")
        
        for item in generator:
            record = transform_fn(item)
            if record:
                batch.append(record)
                total += 1
            
            if len(batch) >= BATCH_SIZE:
                try:
                    self.supabase.table(table).upsert(batch, on_conflict=conflict_col).execute()
                    success += len(batch)
                    print(f"\r      ✅ {success}/{total} processados", end="", flush=True)
                except Exception as e:
                    errors += len(batch)
                    print(f"\n      ❌ Erro: {str(e)[:60]}")
                
                batch.clear()
                free_memory()
        
        if batch:
            try:
                self.supabase.table(table).upsert(batch, on_conflict=conflict_col).execute()
                success += len(batch)
            except Exception as e:
                errors += len(batch)
                print(f"\n      ❌ Erro final: {str(e)[:60]}")
            batch.clear()
        
        if total > 0:
            print(f"\r   📊 {table}: {success} ok, {errors} erros" + " " * 20)
        else:
            print(f"\r   📊 {table}: nenhum registro modificado" + " " * 20)
        
        result = {"total": total, "success": success, "errors": errors}
        self.results[table] = result
        free_memory()
        return result
    
    # ==========================================================================
    # OWNERS (sempre full - são poucos)
    # ==========================================================================
    def extract_owners(self):
        print("=" * 55)
        print("👤 1/7 - OWNERS")
        print("=" * 55)
        
        extracted_at = get_timestamp()
        
        def transform(owner):
            hid = safe_str(owner.get('id'))
            if hid:
                self.valid_owner_ids.add(hid)
            return {
                "hubspot_id": hid,
                "email": owner.get('email'),
                "first_name": owner.get('firstName'),
                "last_name": owner.get('lastName'),
                "_extracted_at": extracted_at,
                "_source_system": SOURCE_SYSTEM
            }
        
        gen = self.fetch_paginated(
            "https://api.hubapi.com/crm/v3/owners/",
            {'limit': API_PAGE_SIZE},
            "owners"
        )
        self.upsert_streaming("hubspot_owners", gen, transform)
        print()
    
    # ==========================================================================
    # PIPELINES (sempre full - são poucos)
    # ==========================================================================
    def extract_pipelines_and_stages(self):
        print("=" * 55)
        print("🔀 2/7 - PIPELINES E STAGES")
        print("=" * 55)
        
        extracted_at = get_timestamp()
        
        print("🔎 Buscando pipelines...")
        try:
            response = requests.get(
                "https://api.hubapi.com/crm/v3/pipelines/deals",
                headers=HUBSPOT_HEADERS,
                timeout=30
            )
            response.raise_for_status()
            pipelines_raw = response.json().get("results", [])
            print(f"   ✅ {len(pipelines_raw)} pipelines")
        except Exception as e:
            print(f"   ❌ Erro: {e}")
            pipelines_raw = []
        
        pipelines_data = []
        stages_data = []
        
        for p in pipelines_raw:
            pid = safe_str(p.get('id'))
            if pid:
                self.valid_pipeline_ids.add(pid)
            
            pipelines_data.append({
                "hubspot_id": pid,
                "label": p.get('label'),
                "object_type": "deals",
                "_extracted_at": extracted_at,
                "_source_system": SOURCE_SYSTEM
            })
            
            for s in p.get('stages', []):
                sid = safe_str(s.get('id'))
                if sid:
                    self.valid_stage_ids.add(sid)
                
                stages_data.append({
                    "stage_id": sid,
                    "pipeline_id": pid,
                    "label": s.get('label'),
                    "_extracted_at": extracted_at,
                    "_source_system": SOURCE_SYSTEM
                })
        
        print(f"   ✅ {len(stages_data)} stages")
        
        if pipelines_data:
            try:
                self.supabase.table("hubspot_pipelines").upsert(pipelines_data, on_conflict="hubspot_id").execute()
                self.results["hubspot_pipelines"] = {"total": len(pipelines_data), "success": len(pipelines_data), "errors": 0}
                print(f"   📊 hubspot_pipelines: {len(pipelines_data)} ok")
            except Exception as e:
                print(f"   ❌ Erro: {str(e)[:50]}")
        
        if stages_data:
            try:
                self.supabase.table("hubspot_pipeline_stages").upsert(stages_data, on_conflict="stage_id").execute()
                self.results["hubspot_pipeline_stages"] = {"total": len(stages_data), "success": len(stages_data), "errors": 0}
                print(f"   📊 hubspot_pipeline_stages: {len(stages_data)} ok")
            except Exception as e:
                print(f"   ❌ Erro: {str(e)[:50]}")
        
        del pipelines_raw, pipelines_data, stages_data
        free_memory()
        print()
    
    # ==========================================================================
    # CONTACTS (incremental)
    # ==========================================================================
    def extract_contacts(self):
        print("=" * 55)
        print("👥 3/7 - CONTACTS")
        print("=" * 55)
        
        extracted_at = get_timestamp()
        valid_owners = self.valid_owner_ids
        valid_contacts = self.valid_contact_ids
        
        properties = ["firstname", "lastname", "email", "phone", "lifecyclestage", "hubspot_owner_id", "hs_lastmodifieddate"]
        
        def transform(contact):
            props = contact.get("properties", {})
            hid = safe_str(contact.get("id"))
            
            if hid:
                valid_contacts.add(hid)
            
            owner_id = safe_str(props.get("hubspot_owner_id"))
            if owner_id and owner_id not in valid_owners:
                owner_id = None
            
            return {
                "hubspot_id": hid,
                "email": props.get("email"),
                "first_name": props.get("firstname"),
                "last_name": props.get("lastname"),
                "phone": props.get("phone"),
                "lifecycle_stage": props.get("lifecyclestage"),
                "owner_id": owner_id,
                "created_at": contact.get("createdAt"),
                "updated_at": contact.get("updatedAt"),
                "archived": contact.get("archived", False),
                "_extracted_at": extracted_at,
                "_source_system": SOURCE_SYSTEM
            }
        
        if self.is_incremental:
            gen = self.fetch_incremental("contacts", properties, "contacts")
        else:
            gen = self.fetch_paginated(
                "https://api.hubapi.com/crm/v3/objects/contacts",
                {'limit': API_PAGE_SIZE, 'properties': ",".join(properties)},
                "contacts"
            )
        
        self.upsert_streaming("hubspot_contacts", gen, transform)
        print()
    
    # ==========================================================================
    # DEALS (incremental)
    # ==========================================================================
    def extract_deals(self):
        print("=" * 55)
        print("💼 4/7 - DEALS")
        print("=" * 55)
        
        extracted_at = get_timestamp()
        valid_owners = self.valid_owner_ids
        valid_contacts = self.valid_contact_ids
        valid_pipelines = self.valid_pipeline_ids
        valid_stages = self.valid_stage_ids
        valid_deals = self.valid_deal_ids
        
        properties = [
            "dealname", "amount", "closedate", "createdate", "pipeline", "dealstage",
            "hubspot_owner_id", "produto", "unidade", "segmento", "tempo_de_contrato",
            "tipo_de_fechamento", "e_venda_de_impacto_", "hs_lastmodifieddate"
        ]
        
        def transform(deal):
            props = deal.get("properties", {})
            hid = safe_str(deal.get("id"))
            
            if hid:
                valid_deals.add(hid)
            
            contact_id = None
            assocs = deal.get('associations', {})
            if 'contacts' in assocs:
                clist = assocs['contacts'].get('results')
                if clist:
                    cid = safe_str(clist[0].get('id'))
                    if cid in valid_contacts:
                        contact_id = cid
            
            owner_id = safe_str(props.get("hubspot_owner_id"))
            if owner_id and owner_id not in valid_owners:
                owner_id = None
            
            pipeline_id = safe_str(props.get("pipeline"))
            if pipeline_id and pipeline_id not in valid_pipelines:
                pipeline_id = None
            
            stage_id = safe_str(props.get("dealstage"))
            if stage_id and stage_id not in valid_stages:
                stage_id = None
            
            close_date = props.get("closedate")
            if close_date and len(close_date) >= 10:
                close_date = close_date[:10]
            else:
                close_date = None
            
            return {
                "hubspot_id": hid,
                "deal_name": props.get("dealname"),
                "amount": safe_float(props.get("amount")),
                "close_date": close_date,
                "create_date": props.get("createdate"),
                "pipeline_id": pipeline_id,
                "pipeline_stage_id": stage_id,
                "deal_stage": props.get("dealstage"),
                "owner_id": owner_id,
                "contact_id": contact_id,
                "created_at": deal.get("createdAt"),
                "updated_at": deal.get("updatedAt"),
                "archived": deal.get("archived", False),
                "raw_data": json.dumps(props, ensure_ascii=False),
                "_extracted_at": extracted_at,
                "_source_system": SOURCE_SYSTEM
            }
        
        if self.is_incremental:
            gen = self.fetch_incremental("deals", properties, "deals", associations="contacts")
        else:
            gen = self.fetch_paginated(
                "https://api.hubapi.com/crm/v3/objects/deals",
                {'limit': API_PAGE_SIZE, 'properties': ",".join(properties), 'associations': 'contacts'},
                "deals"
            )
        
        self.upsert_streaming("hubspot_deals", gen, transform)
        print()
    
    # ==========================================================================
    # LINE ITEMS (incremental)
    # ==========================================================================
    def extract_line_items(self):
        print("=" * 55)
        print("📦 5/7 - LINE ITEMS")
        print("=" * 55)
        
        extracted_at = get_timestamp()
        valid_deals = self.valid_deal_ids
        
        properties = ["quantity", "price", "hs_product_id", "name", "amount", "description", "hs_lastmodifieddate"]
        
        def transform(item):
            props = item.get("properties", {})
            hid = safe_str(item.get("id"))
            
            deal_id = None
            assocs = item.get('associations', {})
            if 'deals' in assocs:
                dlist = assocs['deals'].get('results')
                if dlist:
                    did = safe_str(dlist[0].get('id'))
                    if did in valid_deals:
                        deal_id = did
            
            return {
                "hubspot_id": hid,
                "deal_id": deal_id,
                "product_id": safe_str(props.get("hs_product_id")),
                "name": props.get("name"),
                "quantity": safe_float(props.get("quantity")),
                "unit_price": safe_float(props.get("price")),
                "amount": safe_float(props.get("amount")),
                "description": props.get("description"),
                "_extracted_at": extracted_at,
                "_source_system": SOURCE_SYSTEM
            }
        
        if self.is_incremental:
            gen = self.fetch_incremental("line_items", properties, "line items", associations="deals")
        else:
            gen = self.fetch_paginated(
                "https://api.hubapi.com/crm/v3/objects/line_item",
                {'limit': API_PAGE_SIZE, 'properties': ",".join(properties), 'associations': 'deal'},
                "line items"
            )
        
        self.upsert_streaming("hubspot_line_items", gen, transform)
        print()
    
    # ==========================================================================
    # COMMISSIONS (incremental)
    # ==========================================================================
    def extract_commissions(self):
        print("=" * 55)
        print("💰 6/7 - COMMISSIONS")
        print("=" * 55)
        
        OBJECT_TYPE_ID = "2-45314755"
        extracted_at = get_timestamp()
        valid_owners = self.valid_owner_ids
        
        properties = [
            "hubspot_owner_id", "data_de_fechamento", "valor_do_negocio", "item",
            "posicoes", "peso", "porcentagem", "status_financeiro", "status_comercial",
            "status_juridico", "hs_pipeline", "hs_pipeline_stage", "nome_do_cliente",
            "sdr_responsavel", "venda_de_impacto_", "hs_lastmodifieddate"
        ]
        
        def transform(comm):
            props = comm.get("properties", {})
            hid = safe_str(comm.get("id"))
            
            owner_id = safe_str(props.get("hubspot_owner_id"))
            if owner_id and owner_id not in valid_owners:
                owner_id = None
            
            return {
                "hubspot_id": hid,
                "object_type_id": OBJECT_TYPE_ID,
                "name": props.get("nome_do_cliente"),
                "owner_id": owner_id,
                "commission_amount": safe_float(props.get("valor_do_negocio")),
                "commission_percentage": safe_float(props.get("porcentagem")),
                "commission_type": props.get("item"),
                "payment_status": props.get("status_financeiro"),
                "created_at": comm.get("createdAt"),
                "updated_at": comm.get("updatedAt"),
                "archived": comm.get("archived", False),
                "raw_properties": json.dumps({
                    "data_de_fechamento": props.get("data_de_fechamento"),
                    "valor_do_negocio": props.get("valor_do_negocio"),
                    "item": props.get("item"),
                    "posicoes": props.get("posicoes"),
                    "peso": props.get("peso"),
                    "porcentagem": props.get("porcentagem"),
                    "status_financeiro": props.get("status_financeiro"),
                    "status_comercial": props.get("status_comercial"),
                    "status_juridico": props.get("status_juridico"),
                    "hs_pipeline": props.get("hs_pipeline"),
                    "hs_pipeline_stage": props.get("hs_pipeline_stage"),
                    "nome_do_cliente": props.get("nome_do_cliente"),
                    "sdr_responsavel": props.get("sdr_responsavel"),
                    "venda_de_impacto_": props.get("venda_de_impacto_")
                }, ensure_ascii=False),
                "_extracted_at": extracted_at,
                "_source_system": SOURCE_SYSTEM
            }
        
        if self.is_incremental:
            gen = self.fetch_incremental(OBJECT_TYPE_ID, properties, "commissions")
        else:
            gen = self.fetch_paginated(
                f"https://api.hubapi.com/crm/v3/objects/{OBJECT_TYPE_ID}",
                {'limit': API_PAGE_SIZE, 'properties': ",".join(properties)},
                "commissions"
            )
        
        self.upsert_streaming("hubspot_commissions_obj", gen, transform)
        print()
    
    # ==========================================================================
    # RESUMO
    # ==========================================================================
    def print_summary(self) -> int:
        print("=" * 55)
        print("📊 7/7 - RESUMO")
        print("=" * 55)
        print(f"📅 Fim: {get_timestamp()}")
        print(f"📊 Modo: {'INCREMENTAL' if self.is_incremental else 'FULL SYNC'}\n")
        
        total_ok = 0
        total_err = 0
        
        print(f"{'Tabela':<30} {'OK':>8} {'Erro':>8}")
        print("-" * 50)
        
        for table, r in self.results.items():
            ok = r.get('success', 0)
            err = r.get('errors', 0)
            total_ok += ok
            total_err += err
            icon = "✅" if err == 0 else "⚠️"
            print(f"{icon} {table:<28} {ok:>8} {err:>8}")
        
        print("-" * 50)
        print(f"{'TOTAL':<30} {total_ok:>8} {total_err:>8}")
        print()
        
        if total_err == 0:
            print("🎉 ETL concluído com SUCESSO!")
            return 0
        else:
            print(f"⚠️ ETL concluído com {total_err} erros.")
            return 1
    
    # ==========================================================================
    # RUN
    # ==========================================================================
    def run(self) -> int:
        try:
            # Determina modo de sync
            self.check_sync_mode()
            
            # Se incremental, carrega IDs existentes para validação de FK
            if self.is_incremental:
                self.load_existing_fk_ids()
            
            # Extração na ordem correta
            self.extract_owners()
            self.extract_pipelines_and_stages()
            self.extract_contacts()
            
            free_memory()
            
            self.extract_deals()
            
            self.valid_contact_ids.clear()
            free_memory()
            
            self.extract_line_items()
            
            self.valid_deal_ids.clear()
            free_memory()
            
            self.extract_commissions()
            
            return self.print_summary()
            
        except Exception as e:
            print(f"\n💥 ERRO: {e}")
            import traceback
            traceback.print_exc()
            return 1


# ==============================================================================
# MAIN
# ==============================================================================

if __name__ == "__main__":
    etl = HubSpotETL()
    code = etl.run()
    sys.exit(code)
