// ============================================
// SERVIÇO DE API - CONSULTAS SUPABASE
// ============================================

import { supabase } from './supabase';
import type { 
  HubspotOwner, 
  HubspotCommission 
} from '@/types/database';
import type { 
  Proprietario, 
  Comissao, 
  TipoProduto 
} from '@/types';

// ============================================
// MAPEAMENTO DE STAGES DE COMISSÕES
// (não existem na tabela hubspot_pipeline_stages)
// ============================================

const COMMISSION_STAGES: Record<string, string> = {
  '1081973925': 'Comissão Aprovada',
  '1095088530': 'Aguardando Aprovação',
  '1082066475': 'Em Análise',
  '1230818823': 'Comissão Reprovada',
};

// ============================================
// PROPRIETÁRIOS (VENDEDORES)
// ============================================

export async function fetchOwners(): Promise<HubspotOwner[]> {
  const { data, error } = await supabase
    .from('hubspot_owners')
    .select('*')
    .eq('archived', false)
    .order('first_name');

  if (error) {
    console.error('Erro ao buscar owners:', error);
    throw error;
  }

  return data || [];
}

// Processar owners para o formato da aplicação
export function processOwners(owners: HubspotOwner[]): Proprietario[] {
  return owners.map(o => ({
    id: o.id,
    hubspotId: o.hubspot_id,
    email: o.email || '',
    firstName: o.first_name || '',
    lastName: o.last_name || '',
    nome: `${o.first_name || ''} ${o.last_name || ''}`.trim() || 'Desconhecido',
  }));
}

// Mapa de owners por hubspot_id para lookup rápido
export function createOwnersMap(owners: Proprietario[]): Map<string, Proprietario> {
  return new Map(owners.map(o => [o.hubspotId, o]));
}

// ============================================
// COMISSÕES
// ============================================

export async function fetchCommissions(): Promise<HubspotCommission[]> {
  const { data, error } = await supabase
    .from('hubspot_commissions_obj')
    .select('*')
    .eq('archived', false)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar comissões:', error);
    throw error;
  }

  return data || [];
}

// ============================================
// FUNÇÕES DE PROCESSAMENTO
// ============================================

// Determinar tipo do produto (físico ou virtual)
function getTipoProduto(produto: string): TipoProduto {
  const produtosVirtuais = [
    'virtual office',
    'homeflex',
    'hotdesk'
  ];
  
  const produtoLower = produto.toLowerCase();
  return produtosVirtuais.some(p => produtoLower.includes(p)) 
    ? 'virtual' 
    : 'fisico';
}

// Calcular posições conforme regras de negócio
function calcularPosicoesCalculadas(produto: string, posicoes: number | null): number {
  const pos = posicoes ?? 0;
  const produtoLower = produto.toLowerCase();
  
  if (produtoLower.includes('homeflex')) {
    return pos * 0.33;
  }
  if (produtoLower.includes('hotdesk')) {
    return pos * 0.5;
  }
  
  const tipo = getTipoProduto(produto);
  if (tipo === 'fisico') {
    return pos;
  }
  
  return 0;
}

// Extrair valor numérico (pode vir como string)
function parseNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    // Substituir vírgula por ponto e converter
    const cleaned = value.replace(',', '.').replace(/[^\d.-]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? null : parsed;
  }
  return null;
}

// Parsear raw_properties (pode estar DUPLAMENTE escapado como string)
function parseRawProperties(raw: unknown): Record<string, unknown> {
  if (!raw) return {};
  
  // Se já é um objeto, retornar diretamente
  if (typeof raw === 'object' && raw !== null && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  
  // Se é uma string, pode precisar de múltiplos parses
  if (typeof raw === 'string') {
    let parsed: unknown = raw;
    
    // Tentar parsear até 3 vezes (caso de escape múltiplo)
    for (let i = 0; i < 3; i++) {
      if (typeof parsed !== 'string') break;
      
      try {
        parsed = JSON.parse(parsed);
      } catch {
        break;
      }
    }
    
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  }
  
  return {};
}

// Resolver nome da etapa
function resolveNomeEtapa(hsPipelineStage: string, paymentStatus: string | null): string {
  // Primeiro tentar o mapeamento de stages de comissões
  if (hsPipelineStage && COMMISSION_STAGES[hsPipelineStage]) {
    return COMMISSION_STAGES[hsPipelineStage];
  }
  
  // Fallback para payment_status da tabela
  if (paymentStatus) {
    // Mapear status para nomes mais descritivos
    if (paymentStatus.toLowerCase() === 'aprovado') return 'Comissão Aprovada';
    if (paymentStatus.toLowerCase() === 'aguardando') return 'Aguardando Aprovação';
    if (paymentStatus.toLowerCase() === 'reprovado') return 'Comissão Reprovada';
    return paymentStatus;
  }
  
  return 'Não Definido';
}

// Processar comissões do Supabase para o formato da aplicação
export function processCommissions(
  commissions: HubspotCommission[],
  ownersMap: Map<string, Proprietario>
): Comissao[] {
  return commissions.map((c) => {
    // Parsear raw_properties (pode estar duplamente escapado)
    const raw = parseRawProperties(c.raw_properties);
    
    // ============================================
    // EXTRAIR CAMPOS DO raw_properties
    // ============================================
    
    const dataFechamento = (raw['data_de_fechamento'] || c.payment_date || null) as string | null;
    const valorNegocio = parseNumber(raw['valor_do_negocio']) || 0;
    const produto = (raw['item'] || c.commission_type || '') as string;
    const posicoes = parseNumber(raw['posicoes']);
    const peso = parseNumber(raw['peso']);
    const porcentagem = parseNumber(raw['porcentagem']) || 0;
    const statusFinanceiro = (raw['status_financeiro'] || '') as string;
    const statusComercial = (raw['status_comercial'] || '') as string;
    const statusJuridico = (raw['status_juridico'] || '') as string;
    const hsPipelineStage = String(raw['hs_pipeline_stage'] || '');
    const nomeCliente = (raw['nome_do_cliente'] || c.name || '') as string;
    const sdrResponsavel = (raw['sdr_responsavel'] || '') as string;
    const vendaImpactoRaw = raw['venda_de_impacto_'];
    
    // Venda de impacto - pode ser null, "Sim", "Não", "SIM", "NÃO", true, false
    let vendaImpacto = false;
    if (vendaImpactoRaw !== null && vendaImpactoRaw !== undefined) {
      if (typeof vendaImpactoRaw === 'boolean') {
        vendaImpacto = vendaImpactoRaw;
      } else if (typeof vendaImpactoRaw === 'string') {
        const valor = vendaImpactoRaw.toLowerCase();
        vendaImpacto = valor === 'sim' || valor === 'true';
      }
    }
    
    // Resolver nome da etapa (usando mapeamento ou payment_status)
    const nomeEtapa = resolveNomeEtapa(hsPipelineStage, c.payment_status);
    
    // Resolver proprietário pelo owner_id
    const proprietarioId = c.owner_id || '';
    const proprietario = ownersMap.get(proprietarioId);
    const proprietarioNome = proprietario?.nome || 'Desconhecido';
    
    // SDR - resolver nome se não for "Não e aplica"
    let sdrNome = 'Não Aplicável';
    let sdrEmail = sdrResponsavel;
    if (sdrResponsavel && sdrResponsavel !== 'Não e aplica' && sdrResponsavel !== '') {
      // Se for um email, tentar encontrar o owner
      if (sdrResponsavel.includes('@')) {
        const sdr = Array.from(ownersMap.values()).find(o => 
          o.email.toLowerCase() === sdrResponsavel.toLowerCase()
        );
        sdrNome = sdr?.nome || sdrResponsavel;
        sdrEmail = sdrResponsavel;
      } else {
        // Se for um ID, buscar no mapa
        const sdr = ownersMap.get(sdrResponsavel);
        if (sdr) {
          sdrNome = sdr.nome;
          sdrEmail = sdr.email || sdrResponsavel;
        } else {
          sdrNome = sdrResponsavel;
        }
      }
    }
    
    // Cálculos
    const tipoProduto = getTipoProduto(produto);
    const posicoesCalculadas = calcularPosicoesCalculadas(produto, posicoes);
    const comissaoSimples = valorNegocio * porcentagem;
    const comissaoSimplesSDR = valorNegocio * 0.015; // 1.5%
    
    return {
      id: c.id,
      hubspotId: c.hubspot_id,
      createdAt: c.created_at || '',
      updatedAt: c.updated_at || '',
      archived: c.archived || false,
      dataFechamento,
      proprietarioId,
      produto,
      nomeCliente,
      peso,
      porcentagem,
      posicoes,
      sdrEmail,
      statusComercial,
      statusFinanceiro,
      statusJuridico,
      valorNegocio,
      vendaImpacto,
      nomeEtapa,
      nomePipeline: 'Comissões',
      proprietarioNome,
      sdrNome,
      tipoProduto,
      posicoesCalculadas,
      comissaoSimples,
      comissaoSimplesSDR,
    };
  });
}

// ============================================
// DADOS AGREGADOS PARA DASHBOARD
// ============================================

export interface DadosDashboardResult {
  comissoes: Comissao[];
  proprietarios: Proprietario[];
  produtosUnicos: string[];
  etapasUnicas: string[];
  vendedoresUnicos: string[];
  sdrsUnicos: string[];
  ultimaAtualizacao: string | null;
}

// ============================================
// ÚLTIMA DATA DE ATUALIZAÇÃO
// ============================================

export async function fetchUltimaAtualizacao(): Promise<string | null> {
  const { data, error } = await supabase
    .from('hubspot_commissions_obj')
    .select('_extracted_at')
    .order('_extracted_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Erro ao buscar última atualização:', error);
    return null;
  }

  return data?.[0]?._extracted_at || null;
}

export async function fetchDadosDashboard(): Promise<DadosDashboardResult> {
  // Buscar dados em paralelo
  const [ownersRaw, commissionsRaw, ultimaAtualizacao] = await Promise.all([
    fetchOwners(),
    fetchCommissions(),
    fetchUltimaAtualizacao(),
  ]);

  // Processar owners
  const proprietarios = processOwners(ownersRaw);
  const ownersMap = createOwnersMap(proprietarios);

  // Processar comissões
  const comissoes = processCommissions(commissionsRaw, ownersMap);

  // Extrair listas únicas para filtros
  const produtosUnicos = [...new Set(comissoes.map(c => c.produto).filter(Boolean))].sort();
  const etapasUnicas = [...new Set(comissoes.map(c => c.nomeEtapa).filter(Boolean))].sort();
  const vendedoresUnicos = [...new Set(comissoes.map(c => c.proprietarioNome).filter(Boolean))].sort();
  const sdrsUnicos = [...new Set(
    comissoes
      .filter(c => c.sdrNome !== 'Não Aplicável')
      .map(c => c.sdrNome)
  )].sort();

  return {
    comissoes,
    proprietarios,
    produtosUnicos,
    etapasUnicas,
    vendedoresUnicos,
    sdrsUnicos,
    ultimaAtualizacao,
  };
}
