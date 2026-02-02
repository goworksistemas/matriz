// ============================================
// INTERFACES TYPESCRIPT - DASHBOARD COMISSÕES
// ============================================

// Re-exportar tipos do banco de dados
export * from './database';

// ============================================
// TIPOS DA APLICAÇÃO
// ============================================

// Proprietário (Vendedor) - dados processados
export interface Proprietario {
  id: string;
  hubspotId: string;
  email: string;
  firstName: string;
  lastName: string;
  nome: string; // firstName + lastName
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
