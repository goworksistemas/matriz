// ============================================
// INTERFACES TYPESCRIPT - CENTRAL DE RELATÓRIOS
// ============================================

// Re-exportar tipos do banco de dados
export * from './database';

// ============================================
// TIPOS DO HUB (Relatórios)
// ============================================

export interface Relatorio {
  id: string
  nome: string
  descricao: string
  icone: string
  categoria: 'vendas' | 'financeiro' | 'operacional' | 'rh'
  ativo: boolean
}

export interface CategoriaRelatorio {
  id: string
  nome: string
  icone: string
}

// ============================================
// TIPOS DA APLICAÇÃO - COMISSÕES
// ============================================

// Proprietário (Vendedor) - dados processados
export interface Proprietario {
  id: string;
  hubspotId: string;
  email: string;
  firstName: string;
  lastName: string;
  nome: string;
}

// Comissão - dados processados do raw_properties
export interface Comissao {
  id: string;
  hubspotId: string;
  createdAt: string;
  updatedAt: string;
  archived: boolean;
  
  // Dados do negócio
  dataFechamento: string | null;
  proprietarioId: string | null;
  produto: string;
  nomeCliente: string;
  peso: number | null;
  porcentagem: number;
  posicoes: number | null;
  sdrEmail: string;
  statusComercial: string;
  statusFinanceiro: string;
  statusJuridico: string;
  valorNegocio: number;
  vendaImpacto: boolean;
  nomeEtapa: string;
  nomePipeline: string;
  
  // Relacionamentos resolvidos
  proprietarioNome: string;
  sdrNome: string;
  
  // Campos calculados
  tipoProduto: TipoProduto;
  posicoesCalculadas: number;
  comissaoSimples: number;
  comissaoSimplesSDR: number;
}

// Tipo de Produto (físico ou virtual)
export type TipoProduto = 'fisico' | 'virtual';

// Filtros globais da aplicação
export interface FiltrosGlobais {
  proprietario: string;
  produto: string;
  dataInicio: Date | null;
  dataFim: Date | null;
}

// Filtros específicos de vendedores
export interface FiltrosVendedor {
  vendedor: string;
  vendaImpacto: boolean | null;
  etapa: string;
  tipoProduto: string;
  cliente: string;
  dataFechamento: Date | null;
}

// Filtros SDR
export interface FiltrosSDR {
  sdr: string;
  etapa: string;
  tipoProduto: string;
  dataFechamento: Date | null;
}

// Resumo por Vendedor (para a matriz)
export interface ResumoVendedor {
  vendedorId: string;
  vendedorNome: string;
  comissoes: Comissao[];
  
  // Métricas agregadas
  totalPosicoesCalc: number;
  totalPeso: number;
  totalComissaoSimples: number;
  
  // Métricas para prêmios - Físico
  posicoesCalcFisico: number;
  comissaoSimplesFisico: number;
  premioFisico: number;
  faixaFisico: string;
  
  // Métricas para prêmios - Virtual
  somaPesoPosicoesVirtual: number;
  comissaoSimplesVirtual: number;
  premioVirtual: number;
  faixaVirtual: string;
  
  // Totais
  premioTotal: number;
  totalAReceber: number;
}

// KPIs Gerais
export interface KPIsGerais {
  totalNegocios: number;
  totalPosicoes: number;
  totalValor: number;
  totalComissoes: number;
}

// Dados para gráficos
export interface DadosGrafico {
  name: string;
  value: number;
  color?: string;
}

// Resumo SDR
export interface ResumoSDR {
  sdrEmail: string;
  sdrNome: string;
  comissoes: Comissao[];
  totalComissaoSDR: number;
}

// Status possíveis
export type StatusType = 'Aprovado' | 'Reprovado' | 'Pendente' | string;

// Props para componentes de tabela
export interface ColunaTabelaVendedor {
  key: keyof Comissao | 'vendaImpactoDisplay';
  label: string;
  align?: 'left' | 'center' | 'right';
  format?: (value: unknown) => string;
}

// Estado de carregamento
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

// Dados do Dashboard
export interface DadosDashboard {
  comissoes: Comissao[];
  proprietarios: Proprietario[];
  isLoading: boolean;
  error: string | null;
}

// ============================================
// TIPOS DA APLICAÇÃO - RANKING (Vendas + Marketing)
// ============================================

// Deal processado para o dashboard de vendas
export interface DealProcessado {
  id: string;
  hubspotId: string;
  dealName: string;
  amount: number;
  closeDate: string | null;
  createDate: string | null;
  pipelineId: string | null;
  pipelineNome: string;
  ownerId: string | null;
  ownerNome: string;
  isClosedWon: boolean;
  mes: number;
  ano: number;
}

// Meta de vendas processada
export interface MetaVendas {
  id: string;
  year: number;
  month: number;
  monthlyGoal: number;
  annualGoal: number;
}

// Lead processado para o dashboard de marketing
export interface LeadProcessado {
  id: string;
  hubspotId: string;
  email: string | null;
  nome: string;
  lifecycleStage: string | null;
  ownerId: string | null;
  ownerNome: string;
  createdAt: string | null;
  isValido: boolean;
  mes: number;
  ano: number;
}

// KPIs de Vendas
export interface KPIsVendas {
  totalVendidoMes: number;
  totalVendidoAno: number;
  metaMensal: number;
  metaAnual: number;
  atingimentoMensal: number;
  atingimentoAnual: number;
  totalDealsGanhosMes: number;
  totalDealsGanhosAno: number;
}

// KPIs de Marketing
export interface KPIsMarketing {
  leadsGerados: number;
  leadsValidos: number;
  taxaConversao: number;
}

// Dados do gráfico mensal de vendas (Meta vs Realizado)
export interface DadoGraficoMensal {
  mes: string;
  mesNumero: number;
  realizado: number;
  meta: number;
}

// Evolução de leads por mês
export interface EvolucaoLeads {
  mes: string;
  total: number;
  validos: number;
}

// Filtros do Dashboard de Vendas
export interface FiltrosVendas {
  ano: number;
  mes: number; // 0 = todos os meses
  vendedor: string;
  pipeline: string;
}

// Filtros do Dashboard de Marketing
export interface FiltrosMarketing {
  periodo: number; // meses para trás (12, 6, 3)
  owner: string;
}

// Dados do Dashboard de Ranking
export interface DadosRanking {
  deals: DealProcessado[];
  leads: LeadProcessado[];
  metas: MetaVendas[];
  proprietarios: Proprietario[];
  pipelinesUnicos: string[];
  vendedoresUnicos: string[];
  ultimaAtualizacao: string | null;
}
