import { useMemo } from 'react';
import {
  Briefcase,
  LayoutGrid,
  DollarSign,
  TrendingUp,
  RotateCcw,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Select, SelectItem } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { DatePicker } from '@/components/ui/DatePicker';
import { KPICard } from '@/components/KPICard';
import { BarChartComponent } from '@/components/charts/BarChartComponent';
import { PieChartComponent } from '@/components/charts/PieChartComponent';
import { StatusChart } from '@/components/charts/StatusChart';
import { formatCurrency, formatNumber } from '@/lib/utils';
import type { Comissao, FiltrosGlobais, DadosGrafico } from '@/types';

interface VisaoGeralProps {
  comissoesFiltradas: Comissao[];
  filtrosGlobais: FiltrosGlobais;
  updateFiltroGlobal: <K extends keyof FiltrosGlobais>(
    key: K,
    value: FiltrosGlobais[K]
  ) => void;
  resetFiltrosGlobais: () => void;
  dadosGraficos: {
    contagemPorProprietario: DadosGrafico[];
    contagemPorProduto: DadosGrafico[];
    contagemPorStatusComercial: DadosGrafico[];
    contagemPorStatusFinanceiro: DadosGrafico[];
    contagemPorStatusJuridico: DadosGrafico[];
  };
  kpis: {
    totalNegocios: number;
    totalPosicoes: number;
    totalValor: number;
    totalComissoes: number;
  };
  vendedoresUnicos: string[];
  produtosUnicos: string[];
}

export function VisaoGeral({
  comissoesFiltradas,
  filtrosGlobais,
  updateFiltroGlobal,
  resetFiltrosGlobais,
  dadosGraficos,
  kpis,
  vendedoresUnicos,
  produtosUnicos,
}: VisaoGeralProps) {
  // Verificar se há filtros ativos
  const hasActiveFilters = useMemo(() => {
    return (
      filtrosGlobais.proprietario !== '' ||
      filtrosGlobais.produto !== '' ||
      filtrosGlobais.dataInicio !== null ||
      filtrosGlobais.dataFim !== null
    );
  }, [filtrosGlobais]);

  return (
    <div className="space-y-6">
      {/* Filtros Globais */}
      <Card className="!p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Proprietário</label>
            <Select
              value={filtrosGlobais.proprietario}
              onValueChange={(v) => updateFiltroGlobal('proprietario', v)}
              placeholder="Todos"
            >
              <SelectItem value="">Todos</SelectItem>
              {vendedoresUnicos.map((v) => (
                <SelectItem key={v} value={v}>
                  {v}
                </SelectItem>
              ))}
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Produto</label>
            <Select
              value={filtrosGlobais.produto}
              onValueChange={(v) => updateFiltroGlobal('produto', v)}
              placeholder="Todos"
            >
              <SelectItem value="">Todos</SelectItem>
              {produtosUnicos.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Data Início</label>
            <DatePicker
              value={filtrosGlobais.dataInicio}
              onChange={(d) => updateFiltroGlobal('dataInicio', d)}
              placeholder="Início"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Data Fim</label>
            <DatePicker
              value={filtrosGlobais.dataFim}
              onChange={(d) => updateFiltroGlobal('dataFim', d)}
              placeholder="Fim"
            />
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFiltrosGlobais}
              className="mb-0.5"
            >
              <RotateCcw className="h-4 w-4 mr-1.5" />
              Limpar
            </Button>
          )}

          <div className="ml-auto text-sm text-gray-400">
            {comissoesFiltradas.length} registros
          </div>
        </div>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total de Negócios"
          value={formatNumber(kpis.totalNegocios)}
          icon={Briefcase}
          variant="primary"
        />
        <KPICard
          title="Total de Posições"
          value={formatNumber(kpis.totalPosicoes)}
          icon={LayoutGrid}
          variant="default"
        />
        <KPICard
          title="Valor Total"
          value={formatCurrency(kpis.totalValor)}
          icon={DollarSign}
          variant="success"
        />
        <KPICard
          title="Total Comissões"
          value={formatCurrency(kpis.totalComissoes)}
          icon={TrendingUp}
          variant="warning"
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contagem por Proprietário */}
        <Card>
          <CardHeader>
            <CardTitle>Negócios por Proprietário</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChartComponent
              data={dadosGraficos.contagemPorProprietario}
              height={350}
            />
          </CardContent>
        </Card>

        {/* Contagem por Produto */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Produto</CardTitle>
          </CardHeader>
          <CardContent>
            <PieChartComponent
              data={dadosGraficos.contagemPorProduto}
              height={350}
              innerRadius={70}
              outerRadius={110}
            />
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Status */}
      <Card>
        <CardHeader>
          <CardTitle>Status das Comissões</CardTitle>
        </CardHeader>
        <CardContent>
          <StatusChart
            comercial={dadosGraficos.contagemPorStatusComercial}
            financeiro={dadosGraficos.contagemPorStatusFinanceiro}
            juridico={dadosGraficos.contagemPorStatusJuridico}
            height={200}
          />
        </CardContent>
      </Card>
    </div>
  );
}
