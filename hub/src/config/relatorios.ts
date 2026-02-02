import type { Relatorio } from '@/types'

export const RELATORIOS: Relatorio[] = [
  {
    id: 'comissoes',
    nome: 'Dashboard de Comissões',
    descricao: 'Análise e gestão de comissões de vendedores e SDRs',
    icone: 'coins',
    url: 'http://localhost:5173',
    categoria: 'vendas',
    ativo: true,
  },
  // Futuros relatórios serão adicionados aqui
]

export const CATEGORIAS = {
  vendas: { nome: 'Vendas', icone: 'trending-up' },
  financeiro: { nome: 'Financeiro', icone: 'wallet' },
  operacional: { nome: 'Operacional', icone: 'settings' },
  rh: { nome: 'RH', icone: 'users' },
}
