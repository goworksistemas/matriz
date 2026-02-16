// ============================================
// SERVIÇO DE API - RANKING (Meta Global + Competição)
// ============================================

import { supabase } from './supabase';
import type {
  HubspotOwner,
  HubspotDeal,
  HubspotLineItem,
  HubspotPipeline,
  SalesGoal,
} from '@/types/database';
import type {
  Proprietario,
  DealProcessado,
  LineItemEnriquecido,
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
// DEALS — paginação por cursor + filtro de data
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
// LINE ITEMS — paginação por cursor
// ============================================

const LINE_ITEMS_COLUMNS = 'id, hubspot_id, deal_id, quantity, amount, name';

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
 */
function isDealWon(rawData: unknown): boolean {
  try {
    if (!rawData) return false;

    if (typeof rawData === 'object' && rawData !== null) {
      const obj = rawData as Record<string, unknown>;
      if (obj.hs_is_closed_won === 'true') return true;
      return false;
    }

    if (typeof rawData === 'string') {
      let parsed: unknown = rawData;
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
 * Processa deals brutos para o formato da aplicação
 */
function processDeals(
  deals: HubspotDeal[],
  ownersMap: Map<string, Proprietario>,
  pipelinesMap: Map<string, string>,
): DealProcessado[] {
  return deals.map(d => {
    const closeDate = d.close_date || null;
    const closeDateObj = closeDate ? new Date(closeDate) : null;

    return {
      id: d.id,
      hubspotId: d.hubspot_id,
      dealName: d.deal_name || 'Sem nome',
      amount: Number(d.amount) || 0,
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

/**
 * Enriquece line items com dados do deal (owner, close_date).
 * Retorna apenas line items de deals ganhos.
 */
function processLineItems(
  lineItems: HubspotLineItem[],
  wonDealsMap: Map<string, DealProcessado>,
): LineItemEnriquecido[] {
  const enriched: LineItemEnriquecido[] = [];

  for (const li of lineItems) {
    if (!li.deal_id) continue;

    const deal = wonDealsMap.get(li.deal_id);
    if (!deal) continue; // pula line items de deals não-ganhos

    const quantity = Number(li.quantity) || 0;

    enriched.push({
      id: li.id,
      dealHubspotId: li.deal_id,
      ownerId: deal.ownerId || '',
      ownerNome: deal.ownerNome,
      quantity,
      quantityCapped: Math.min(quantity, 30),
      amount: Number(li.amount) || 0,
      closeDate: deal.closeDate,
      mes: deal.mes,
      ano: deal.ano,
    });
  }

  return enriched;
}

/**
 * Processa metas de vendas (com 3 tipos de métrica)
 */
function processSalesGoals(goals: SalesGoal[]): MetaVendas[] {
  return goals.map(g => ({
    id: g.id,
    year: g.year,
    month: g.month,
    monthlyGoal: Number(g.monthly_goal) || 0,
    annualGoal: Number(g.annual_goal) || 0,
    monthlyGoalSeats: Number(g.monthly_goal_seats) || 0,
    annualGoalSeats: Number(g.annual_goal_seats) || 0,
    monthlyGoalDeals: Number(g.monthly_goal_deals) || 0,
    annualGoalDeals: Number(g.annual_goal_deals) || 0,
  }));
}

// ============================================
// ÚLTIMA DATA DE ATUALIZAÇÃO
// ============================================

async function fetchUltimaAtualizacao(): Promise<string | null> {
  const tabelas = [
    'hubspot_deals',
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
  goals: {
    monthlyGoal: number;
    annualGoal: number;
    monthlyGoalSeats: number;
    annualGoalSeats: number;
    monthlyGoalDeals: number;
    annualGoalDeals: number;
  },
): Promise<void> {
  const { error } = await supabase
    .from('sales_goals')
    .upsert(
      {
        year,
        month,
        monthly_goal: goals.monthlyGoal,
        annual_goal: goals.annualGoal,
        monthly_goal_seats: goals.monthlyGoalSeats,
        annual_goal_seats: goals.annualGoalSeats,
        monthly_goal_deals: goals.monthlyGoalDeals,
        annual_goal_deals: goals.annualGoalDeals,
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
  const [
    ownersRaw,
    pipelinesRaw,
    dealsRaw,
    lineItemsRaw,
    salesGoalsRaw,
    ultimaAtualizacao,
  ] = await Promise.all([
    fetchOwners(),
    fetchPipelines(),
    fetchDeals(),
    fetchLineItems(),
    fetchSalesGoals(),
    fetchUltimaAtualizacao(),
  ]);

  // Processar owners e criar mapa
  const proprietarios = processOwners(ownersRaw);
  const ownersMap = createOwnersMap(proprietarios);

  // Processar pipelines
  const pipelinesMap = createPipelinesMap(pipelinesRaw);

  // Processar deals
  const deals = processDeals(dealsRaw, ownersMap, pipelinesMap);

  // Criar mapa de deals ganhos por hubspot_id (para enriquecer line items)
  const wonDealsMap = new Map<string, DealProcessado>();
  deals.forEach(d => {
    if (d.isClosedWon) {
      wonDealsMap.set(d.hubspotId, d);
    }
  });

  // Enriquecer line items (apenas de deals ganhos)
  const lineItems = processLineItems(lineItemsRaw, wonDealsMap);

  // Processar metas
  const metas = processSalesGoals(salesGoalsRaw);

  // Vendedores únicos (dos deals ganhos)
  const vendedoresUnicos = [...new Set(
    deals
      .filter(d => d.isClosedWon)
      .map(d => d.ownerNome)
      .filter(n => n !== 'Sem responsável' && n !== 'Desconhecido')
  )].sort();

  return {
    deals,
    lineItems,
    metas,
    proprietarios,
    vendedoresUnicos,
    ultimaAtualizacao,
  };
}
