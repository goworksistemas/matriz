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

async function fetchWonStageIds(): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('hubspot_pipeline_stages')
    .select('stage_id')
    .eq('is_won', true);

  if (error) {
    console.error('Erro ao buscar stages ganhos:', error);
    return new Set();
  }

  return new Set((data || []).map(s => s.stage_id));
}

// ============================================
// DATA MÍNIMA — só busca dados de 2025 em diante
// ============================================
const DATA_MINIMA = '2025-01-01';

// ============================================
// DEALS — paginação por cursor + filtro de data
// ============================================

const DEALS_COLUMNS = 'id, hubspot_id, deal_name, amount, close_date, create_date, pipeline_id, pipeline_stage_id, deal_stage, owner_id';

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

async function fetchLineItemsByDealIds(dealIds: string[]): Promise<HubspotLineItem[]> {
  if (dealIds.length === 0) return [];

  const BATCH_SIZE = 200;
  const batches: string[][] = [];
  for (let i = 0; i < dealIds.length; i += BATCH_SIZE) {
    batches.push(dealIds.slice(i, i + BATCH_SIZE));
  }

  const results = await Promise.all(
    batches.map(async (batch) => {
      const allRows: HubspotLineItem[] = [];
      const pageSize = 1000;
      let lastId: string | null = null;

      while (true) {
        let query = supabase
          .from('hubspot_line_items')
          .select(LINE_ITEMS_COLUMNS)
          .eq('archived', false)
          .in('deal_id', batch)
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
    })
  );

  return results.flat();
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

function parseDateParts(dateStr: string | null): { mes: number; ano: number } {
  if (!dateStr || dateStr.length < 10) return { mes: 0, ano: 0 };
  const ano = parseInt(dateStr.substring(0, 4), 10);
  const mes = parseInt(dateStr.substring(5, 7), 10);
  return { mes: isNaN(mes) ? 0 : mes, ano: isNaN(ano) ? 0 : ano };
}

function processDeals(
  deals: HubspotDeal[],
  ownersMap: Map<string, Proprietario>,
  pipelinesMap: Map<string, string>,
  wonStageIds: Set<string>,
): DealProcessado[] {
  return deals.map(d => {
    const closeDate = d.close_date || null;
    const { mes, ano } = parseDateParts(closeDate);
    const stageId = d.pipeline_stage_id || d.deal_stage || '';

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
      isClosedWon: wonStageIds.has(stageId),
      mes,
      ano,
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
      name: li.name || '',
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
  try {
    const { data } = await supabase
      .from('hubspot_deals')
      .select('_extracted_at')
      .order('_extracted_at', { ascending: false })
      .limit(1);

    if (data && data.length > 0) {
      return (data[0] as { _extracted_at: string })._extracted_at;
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

export interface DadosRankingBase {
  deals: DealProcessado[];
  metas: MetaVendas[];
  proprietarios: Proprietario[];
  vendedoresUnicos: string[];
  ultimaAtualizacao: string | null;
  wonDealsMap: Map<string, DealProcessado>;
}

export async function fetchDadosRankingBase(): Promise<DadosRankingBase> {
  const [
    ownersRaw,
    pipelinesRaw,
    wonStageIds,
    dealsRaw,
    salesGoalsRaw,
    ultimaAtualizacao,
  ] = await Promise.all([
    fetchOwners(),
    fetchPipelines(),
    fetchWonStageIds(),
    fetchDeals(),
    fetchSalesGoals(),
    fetchUltimaAtualizacao(),
  ]);

  const proprietarios = processOwners(ownersRaw);
  const ownersMap = createOwnersMap(proprietarios);
  const pipelinesMap = createPipelinesMap(pipelinesRaw);
  const deals = processDeals(dealsRaw, ownersMap, pipelinesMap, wonStageIds);

  const wonDealsMap = new Map<string, DealProcessado>();
  deals.forEach(d => {
    if (d.isClosedWon) {
      wonDealsMap.set(d.hubspotId, d);
    }
  });

  const metas = processSalesGoals(salesGoalsRaw);

  const vendedoresUnicos = [...new Set(
    deals
      .filter(d => d.isClosedWon)
      .map(d => d.ownerNome)
      .filter(n => n !== 'Sem responsável' && n !== 'Desconhecido')
  )].sort();

  return {
    deals,
    metas,
    proprietarios,
    vendedoresUnicos,
    ultimaAtualizacao,
    wonDealsMap,
  };
}

export async function fetchLineItemsEnriquecidos(
  wonDealsMap: Map<string, DealProcessado>,
): Promise<LineItemEnriquecido[]> {
  const wonDealIds = [...wonDealsMap.keys()];
  if (wonDealIds.length === 0) return [];

  const lineItemsRaw = await fetchLineItemsByDealIds(wonDealIds);
  return processLineItems(lineItemsRaw, wonDealsMap);
}
