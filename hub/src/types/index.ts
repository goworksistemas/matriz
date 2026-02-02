export interface Relatorio {
  id: string
  nome: string
  descricao: string
  icone: string
  url: string
  categoria: 'vendas' | 'financeiro' | 'operacional' | 'rh'
  ativo: boolean
}

export interface CategoriaRelatorio {
  id: string
  nome: string
  icone: string
}
