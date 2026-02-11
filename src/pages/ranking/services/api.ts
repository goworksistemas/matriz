// ============================================
// SERVIÇO DE API - RANKING (Vendas + Marketing)
// ============================================

import { supabase } from './supabase';
import type {
  HubspotOwner,
  HubspotDeal,
  HubspotLineItem,
  HubspotContact,
  HubspotPipeline,
  SalesGoal,
} from '@/types/database';
import type {
  Proprietario,
  DealProcessado,
  LeadProcessado,
  MetaVendas,
  DadosRanking,
} from '@/types';

// ============================================
// PROPRIETÁRIOS (VENDEDORES)
// ============================================

async function fetchOwners(): Promise<HubspotOwner[]> {
  const { data, error } = await supabase
    .from('hubspot_owners')
    .select('*')
    .eq('archived', false)
    .order('first_name');

  if (error) throw error;
  return data || [];
}

function processOwners(owners: HubspotOwner[]): Proprietario[] {
  return owners.map(o => ({
    id: o.id,
    hubspotId: o.hubspot_id,
    email: o.email || '',
    firstName: o.first_name || '',
    lastName: o.last_name || '',
    nome: `${o.first_name || ''} ${o.last_name || ''}`.trim() || 'Desconhecido',
  }));
}

function createOwnersMap(owners: Proprietario[]): Map<string, Proprietario> {
  return new Map(owners.map(o => [o.hubspotId, o]));
}

// ============================================
// PIPELINES
// ============================================

async function fetchPipelines(): Promise<HubspotPipeline[]> {
  const { data, error } = await supabase
    .from('hubspot_pipelines')
    .select('*')
    .eq('archived', false);

  if (error) throw error;
  return data || [];
}

function createPipelinesMap(pipelines: HubspotPipeline[]): Map<string, string> {
  return new Map(pipelines.map(p => [p.hubspot_id, p.label || 'Sem nome']));
}

// ============================================
// DATA MÍNIMA — só busca dados de 2025 em diante
// ============================================
const DATA_MINIMA = '2025-01-01';

// ============================================
// DEALS (VENDAS) — paginação por cursor + filtro de data
// ============================================

const DEALS_COLUMNS = 'id, hubspot_id, deal_name, amount, close_date, create_date, pipeline_id, owner_id, raw_data';

async function fetchDeals(): Promise<HubspotDeal[]> {
  const allRows: HubspotDeal[] = [];
  const pageSize = 1000;
  let lastId: string | null = null;

  while (true) {
    let query = supabase
      .from('hubspot_deals')
      .select(DEALS_COLUMNS)
      .eq('archived', false)
      .gte('close_date', DATA_MINIMA)
      .order('id', { ascending: true })
      .limit(pageSize);

    if (lastId) {
      query = query.gt('id', lastId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar deals:', error);
      throw error;
    }
    if (!data || data.length === 0) break;
    allRows.push(...(data as HubspotDeal[]));
    lastId = data[data.length - 1].id;
    if (data.length < pageSize) break;
  }

  return allRows;
}

// ============================================
// LINE ITEMS — paginação por cursor + filtro de data
// ============================================

const LINE_ITEMS_COLUMNS = 'id, deal_id, amount';

async function fetchLineItems(): Promise<HubspotLineItem[]> {
  const allRows: HubspotLineItem[] = [];
  const pageSize = 1000;
  let lastId: string | null = null;

  while (true) {
    let query = supabase
      .from('hubspot_line_items')
      .select(LINE_ITEMS_COLUMNS)
      .eq('archived', false)
      .gte('created_at', `${DATA_MINIMA}T00:00:00Z`)
      .order('id', { ascending: true })
      .limit(pageSize);

    if (lastId) {
      query = query.gt('id', lastId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar line items:', error);
      throw error;
    }
    if (!data || data.length === 0) break;
    allRows.push(...(data as HubspotLineItem[]));
    lastId = data[data.length - 1].id;
    if (data.length < pageSize) break;
  }

  return allRows;
}

// ============================================
// CONTACTS (LEADS) — paginação por cursor + filtro de data
// ============================================

const CONTACTS_COLUMNS = 'id, hubspot_id, email, first_name, last_name, lifecycle_stage, owner_id, created_at';

async function fetchContacts(): Promise<HubspotContact[]> {
  const allRows: HubspotContact[] = [];
  const pageSize = 1000;
  let lastId: string | null = null;

  while (true) {
    let query = supabase
      .from('hubspot_contacts')
      .select(CONTACTS_COLUMNS)
      .eq('archived', false)
      .gte('created_at', `${DATA_MINIMA}T00:00:00Z`)
      .order('id', { ascending: true })
      .limit(pageSize);

    if (lastId) {
      query = query.gt('id', lastId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar contacts:', error);
      throw error;
    }
    if (!data || data.length === 0) break;
    allRows.push(...(data as HubspotContact[]));
    lastId = data[data.length - 1].id;
    if (data.length < pageSize) break;
  }

  return allRows;
}

// ============================================
// METAS DE VENDAS
// ============================================

async function fetchSalesGoals(): Promise<SalesGoal[]> {
  const { data, error } = await supabase
    .from('sales_goals')
    .select('*')
    .order('year', { ascending: true })
    .order('month', { ascending: true });

  if (error) {
    console.error('Erro ao buscar metas (tabela pode não existir):', error);
    return [];
  }
  return data || [];
}

// ============================================
// FUNÇÕES DE PROCESSAMENTO
// ============================================

/**
 * Verifica se um deal é "ganho" usando raw_data.hs_is_closed_won
 * CRÍTICO: NÃO confiar em pipeline_stages.is_won (sempre false)
 * 
 * raw_data é JSONB double-stringified. O Supabase client pode retornar:
 * - string: '{"hs_is_closed_won": "true"}' (precisa JSON.parse)
 * - object: já parseado pelo client { hs_is_closed_won: "true" }
 */
function isDealWon(rawData: unknown): boolean {
  try {
    // Se é null/undefined
    if (!rawData) return false;

    // Se já é um objeto (Supabase client pode parsear o JSONB automaticamente)
    if (typeof rawData === 'object' && rawData !== null) {
      const obj = rawData as Record<string, unknown>;
      // Pode estar no primeiro nível
      if (obj.hs_is_closed_won === 'true') return true;
      // Ou pode ser double-stringified: o objeto contém uma chave com a string JSON
      return false;
    }

    // Se é uma string (double-stringified)
    if (typeof rawData === 'string') {
      let parsed: unknown = rawData;
      // Parsear até 3 vezes para lidar com múltiplos escapes
      for (let i = 0; i < 3; i++) {
        if (typeof parsed !== 'string') break;
        try {
          parsed = JSON.parse(parsed);
        } catch {
          break;
        }
      }
      if (typeof parsed === 'object' && parsed !== null) {
        return (parsed as Record<string, unknown>).hs_is_closed_won === 'true';
      }
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Resolve o valor real de um deal:
 * 1. Se deal.amount não é null e > 0, usa esse valor
 * 2. Senão, soma os line_items.amount do deal
 */
function resolveDealAmount(
  dealAmount: number | null,
  dealHubspotId: string,
  lineItemsByDeal: Map<string, HubspotLineItem[]>,
): number {
  if (dealAmount !== null && dealAmount > 0) {
    return Number(dealAmount);
  }

  const items = lineItemsByDeal.get(dealHubspotId) || [];
  return items.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
}

/**
 * Processa deals brutos para o formato da aplicação
 */
function processDeals(
  deals: HubspotDeal[],
  ownersMap: Map<string, Proprietario>,
  pipelinesMap: Map<string, string>,
  lineItemsByDeal: Map<string, HubspotLineItem[]>,
): DealProcessado[] {
  return deals.map(d => {
    const closeDate = d.close_date || null;
    const closeDateObj = closeDate ? new Date(closeDate) : null;

    return {
      id: d.id,
      hubspotId: d.hubspot_id,
      dealName: d.deal_name || 'Sem nome',
      amount: resolveDealAmount(d.amount, d.hubspot_id, lineItemsByDeal),
      closeDate,
      createDate: d.create_date || null,
      pipelineId: d.pipeline_id || null,
      pipelineNome: d.pipeline_id ? (pipelinesMap.get(d.pipeline_id) || 'Desconhecido') : 'Sem pipeline',
      ownerId: d.owner_id || null,
      ownerNome: d.owner_id ? (ownersMap.get(d.owner_id)?.nome || 'Desconhecido') : 'Sem responsável',
      isClosedWon: isDealWon(d.raw_data),
      mes: closeDateObj ? closeDateObj.getMonth() + 1 : 0,
      ano: closeDateObj ? closeDateObj.getFullYear() : 0,
    };
  });
}

// Lifecycle stages considerados "válidos" (leads qualificados)
const LIFECYCLE_STAGES_VALIDOS = [
  'opportunity',
  'customer',
  '165518199',
  'salesqualifiedlead',
  'marketingqualifiedlead',
];

/**
 * Processa contatos brutos para o formato de leads
 */
function processContacts(
  contacts: HubspotContact[],
  ownersMap: Map<string, Proprietario>,
): LeadProcessado[] {
  return contacts.map(c => {
    const createdAt = c.created_at || null;
    const createdAtObj = createdAt ? new Date(createdAt) : null;
    const firstName = c.first_name || '';
    const lastName = c.last_name || '';

    return {
      id: c.id,
      hubspotId: c.hubspot_id,
      email: c.email || null,
      nome: `${firstName} ${lastName}`.trim() || 'Sem nome',
      lifecycleStage: c.lifecycle_stage || null,
      ownerId: c.owner_id || null,
      ownerNome: c.owner_id ? (ownersMap.get(c.owner_id)?.nome || 'Desconhecido') : 'Sem responsável',
      createdAt,
      isValido: c.lifecycle_stage !== null && LIFECYCLE_STAGES_VALIDOS.includes(c.lifecycle_stage),
      mes: createdAtObj ? createdAtObj.getMonth() + 1 : 0,
      ano: createdAtObj ? createdAtObj.getFullYear() : 0,
    };
  });
}

/**
 * Processa metas de vendas
 */
function processSalesGoals(goals: SalesGoal[]): MetaVendas[] {
  return goals.map(g => ({
    id: g.id,
    year: g.year,
    month: g.month,
    monthlyGoal: Number(g.monthly_goal) || 0,
    annualGoal: Number(g.annual_goal) || 0,
  }));
}

// ============================================
// ÚLTIMA DATA DE ATUALIZAÇÃO
// ============================================

async function fetchUltimaAtualizacao(): Promise<string | null> {
  const tabelas = [
    'hubspot_deals',
    'hubspot_contacts',
    'hubspot_owners',
    'hubspot_line_items',
  ];

  const promises = tabelas.map(async (tabela) => {
    const { data } = await supabase
      .from(tabela)
      .select('_extracted_at')
      .order('_extracted_at', { ascending: false })
      .limit(1);

    if (data && data.length > 0) {
      const row = data[0] as { _extracted_at: string };
      return row._extracted_at;
    }
    return null;
  });

  try {
    const resultados = await Promise.all(promises);
    const datas = resultados
      .filter((d): d is string => d !== null)
      .map(d => new Date(d).getTime());

    if (datas.length > 0) {
      return new Date(Math.max(...datas)).toISOString();
    }
  } catch (error) {
    console.error('Erro ao buscar última atualização:', error);
  }

  return null;
}

// ============================================
// UPSERT DE METAS (edição pelo usuário)
// ============================================

export async function upsertSalesGoal(
  year: number,
  month: number,
  monthlyGoal: number,
  annualGoal: number,
): Promise<void> {
  const { error } = await supabase
    .from('sales_goals')
    .upsert(
      {
        year,
        month,
        monthly_goal: monthlyGoal,
        annual_goal: annualGoal,
      },
      { onConflict: 'year,month' },
    );

  if (error) {
    console.error('Erro ao salvar meta:', error);
    throw error;
  }
}

// ============================================
// DADOS AGREGADOS PARA DASHBOARD
// ============================================

export interface DadosRankingResult extends DadosRanking {}

export async function fetchDadosRanking(): Promise<DadosRankingResult> {
  // Buscar tudo em paralelo
  const [
    ownersRaw,
    pipelinesRaw,
    dealsRaw,
    lineItemsRaw,
    contactsRaw,
    salesGoalsRaw,
    ultimaAtualizacao,
  ] = await Promise.all([
    fetchOwners(),
    fetchPipelines(),
    fetchDeals(),
    fetchLineItems(),
    fetchContacts(),
    fetchSalesGoals(),
    fetchUltimaAtualizacao(),
  ]);

  // Processar owners e criar mapa
  const proprietarios = processOwners(ownersRaw);
  const ownersMap = createOwnersMap(proprietarios);

  // Processar pipelines
  const pipelinesMap = createPipelinesMap(pipelinesRaw);

  // Agrupar line items por deal_id para resolver valor
  const lineItemsByDeal = new Map<string, HubspotLineItem[]>();
  lineItemsRaw.forEach(item => {
    if (item.deal_id) {
      const lista = lineItemsByDeal.get(item.deal_id) || [];
      lista.push(item);
      lineItemsByDeal.set(item.deal_id, lista);
    }
  });

  // Processar deals
  const deals = processDeals(dealsRaw, ownersMap, pipelinesMap, lineItemsByDeal);

  // Processar leads
  const leads = processContacts(contactsRaw, ownersMap);

  // Processar metas
  const metas = processSalesGoals(salesGoalsRaw);

  // Extrair listas únicas para filtros
  const pipelinesUnicos = [...new Set(deals.map(d => d.pipelineNome).filter(Boolean))].sort();
  const vendedoresUnicos = [...new Set([
    ...deals.map(d => d.ownerNome),
    ...leads.map(l => l.ownerNome),
  ].filter(n => n !== 'Sem responsável' && n !== 'Desconhecido'))].sort();

  return {
    deals,
    leads,
    metas,
    proprietarios,
    pipelinesUnicos,
    vendedoresUnicos,
    ultimaAtualizacao,
  };
}
