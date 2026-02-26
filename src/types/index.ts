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
  etapa: string;
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
// TIPOS DA APLICAÇÃO - RANKING (Meta Global + Competição)
// ============================================

// Deal processado (negócio ganho)
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

// Line item enriquecido com dados do deal (para cálculos de seats)
export interface LineItemEnriquecido {
  id: string;
  dealHubspotId: string;
  ownerId: string;
  ownerNome: string;
  name: string;
  quantity: number;
  quantityCapped: number; // min(quantity, 30) — para competição
  amount: number;
  closeDate: string | null;
  mes: number;
  ano: number;
}

// Meta de vendas processada (com 3 tipos de meta)
export interface MetaVendas {
  id: string;
  year: number;
  month: number;
  monthlyGoal: number;       // receita R$
  annualGoal: number;        // receita R$
  monthlyGoalSeats: number;  // seats mensal
  annualGoalSeats: number;   // seats anual
  monthlyGoalDeals: number;  // deals mensal
  annualGoalDeals: number;   // deals anual
}

// KPIs do Dashboard Meta Global
export interface KPIsMetaGlobal {
  // Atingido no ano
  revenueAno: number;
  seatsAno: number;
  dealsAno: number;
  // Atingido no mês
  revenueMes: number;
  seatsMes: number;
  dealsMes: number;
  // Metas
  metaAnualRevenue: number;
  metaAnualSeats: number;
  metaAnualDeals: number;
  metaMensalRevenue: number;
  metaMensalSeats: number;
  metaMensalDeals: number;
}

// Dados do gráfico mensal (Meta vs Realizado)
export interface DadoGraficoMensal {
  mes: string;
  mesNumero: number;
  realizado: number;
  meta: number;
}

// Dados para gráfico mensal de seats
export interface DadoGraficoMensalSeats {
  mes: string;
  mesNumero: number;
  seats: number;
  meta: number;
}

// Vendedor no ranking da competição
export interface VendedorCompeticao {
  ownerId: string;
  ownerNome: string;
  seatsCapped: number;      // soma de min(quantity, 30) por line item
  seatsRaw: number;          // soma bruta de quantity
  dealsCount: number;
  ranking: number;
  metaMinima: number;
  status: string;            // "Dentro da Competição" ou "Faltam X seats"
}

// Filtros do Dashboard Meta Global
export interface FiltrosMetaGlobal {
  ano: number;
  mes: number; // 0 = todos os meses
}

// Dados do Dashboard de Ranking
export interface DadosRanking {
  deals: DealProcessado[];
  lineItems: LineItemEnriquecido[];
  metas: MetaVendas[];
  proprietarios: Proprietario[];
  vendedoresUnicos: string[];
  ultimaAtualizacao: string | null;
}
