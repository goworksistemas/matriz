import { useMemo } from 'react';
import {
  Users,
  UserCheck,
  TrendingUp,
  RotateCcw,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Line,
  ComposedChart,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Select, SelectItem } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { KPICard } from '@/components/KPICard';
import { PieChartComponent } from '@/components/charts/PieChartComponent';
import { formatNumber } from '@/lib/utils';
import type {
  LeadProcessado,
  FiltrosMarketing,
  KPIsMarketing,
  EvolucaoLeads,
  DadosGrafico,
} from '@/types';

// Nomes dos meses abreviados
const MESES_CURTO = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

interface DashboardMarketingProps {
  leadsFiltrados: LeadProcessado[];
  filtrosMarketing: FiltrosMarketing;
  updateFiltroMarketing: <K extends keyof FiltrosMarketing>(key: K, value: FiltrosMarketing[K]) => void;
  resetFiltrosMarketing: () => void;
  vendedoresUnicos: string[];
}

export function DashboardMarketing({
  leadsFiltrados,
  filtrosMarketing,
  updateFiltroMarketing,
  resetFiltrosMarketing,
  vendedoresUnicos,
}: DashboardMarketingProps) {
  // Verificar se há filtros ativos
  const hasActiveFilters = useMemo(() => {
    return filtrosMarketing.periodo !== 12 || filtrosMarketing.owner !== '';
  }, [filtrosMarketing]);

  // KPIs de Marketing
  const kpis = useMemo<KPIsMarketing>(() => {
    const leadsGerados = leadsFiltrados.length;
    const leadsValidos = leadsFiltrados.filter(l => l.isValido).length;
    const taxaConversao = leadsGerados > 0 ? (leadsValidos / leadsGerados) : 0;

    return {
      leadsGerados,
      leadsValidos,
      taxaConversao,
    };
  }, [leadsFiltrados]);

  // Evolução mensal de leads (últimos N meses)
  const evolucaoMensal = useMemo<EvolucaoLeads[]>(() => {
    const agora = new Date();
    const meses: EvolucaoLeads[] = [];

    for (let i = filtrosMarketing.periodo - 1; i >= 0; i--) {
      const data = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
      const mes = data.getMonth() + 1;
      const ano = data.getFullYear();
      const label = `${MESES_CURTO[mes - 1]}/${String(ano).slice(2)}`;

      const leadsDoMes = leadsFiltrados.filter(l => l.mes === mes && l.ano === ano);
      const total = leadsDoMes.length;
      const validos = leadsDoMes.filter(l => l.isValido).length;

      meses.push({ mes: label, total, validos });
    }

    return meses;
  }, [leadsFiltrados, filtrosMarketing.periodo]);

  // Distribuição por lifecycle stage
  const porLifecycleStage = useMemo<DadosGrafico[]>(() => {
    const mapa = new Map<string, number>();
    leadsFiltrados.forEach(l => {
      const stage = l.lifecycleStage || 'Não definido';
      const label = stageLabel(stage);
      mapa.set(label, (mapa.get(label) || 0) + 1);
    });
    return Array.from(mapa.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [leadsFiltrados]);

  // Top responsáveis por leads
  const topResponsaveis = useMemo<DadosGrafico[]>(() => {
    const mapa = new Map<string, number>();
    leadsFiltrados.forEach(l => {
      mapa.set(l.ownerNome, (mapa.get(l.ownerNome) || 0) + 1);
    });
    return Array.from(mapa.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [leadsFiltrados]);

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card className="!p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Período</label>
            <Select
              value={String(filtrosMarketing.periodo)}
              onValueChange={(v) => updateFiltroMarketing('periodo', Number(v))}
              placeholder="Período"
            >
              <SelectItem value="3">Últimos 3 meses</SelectItem>
              <SelectItem value="6">Últimos 6 meses</SelectItem>
              <SelectItem value="12">Últimos 12 meses</SelectItem>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Responsável</label>
            <Select
              value={filtrosMarketing.owner}
              onValueChange={(v) => updateFiltroMarketing('owner', v)}
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

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFiltrosMarketing}
              className="mb-0.5"
            >
              <RotateCcw className="h-4 w-4 mr-1.5" />
              Limpar
            </Button>
          )}

          <div className="ml-auto text-sm text-gray-400">
            {leadsFiltrados.length} leads
          </div>
        </div>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard
          title="Leads Gerados"
          value={formatNumber(kpis.leadsGerados)}
          icon={Users}
          variant="primary"
        />
        <KPICard
          title="Leads Válidos"
          value={formatNumber(kpis.leadsValidos)}
          subtitle="Opportunity, Customer, Qualificados"
          icon={UserCheck}
          variant="success"
        />
        <KPICard
          title="Taxa de Conversão"
          value={`${formatNumber(kpis.taxaConversao * 100, 1)}%`}
          subtitle="Válidos / Gerados"
          icon={TrendingUp}
          variant={kpis.taxaConversao >= 0.1 ? 'success' : 'warning'}
        />
      </div>

      {/* Gráfico: Evolução Mensal de Leads */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução Mensal de Leads</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={evolucaoMensal} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
              <XAxis dataKey="mes" stroke="var(--chart-axis)" fontSize={11} />
              <YAxis stroke="var(--chart-axis)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--chart-tooltip-bg)',
                  border: '1px solid var(--chart-tooltip-border)',
                  borderRadius: '8px',
                  color: 'var(--chart-tooltip-text)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
                labelStyle={{ color: 'var(--chart-tooltip-label)' }}
                formatter={(value: number, name: string) => [
                  formatNumber(value),
                  name === 'total' ? 'Total' : 'Válidos',
                ]}
              />
              <Legend
                formatter={(value: string) => (
                  <span style={{ color: 'var(--chart-legend-text)', fontSize: '12px' }}>
                    {value === 'total' ? 'Total de Leads' : 'Leads Válidos'}
                  </span>
                )}
              />
              <Bar dataKey="total" fill="#0ea5e9" radius={[4, 4, 0, 0]} opacity={0.6} />
              <Bar dataKey="validos" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Line
                type="monotone"
                dataKey="validos"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: '#10b981', r: 3 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráficos secundários */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição por Lifecycle Stage */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Estágio</CardTitle>
          </CardHeader>
          <CardContent>
            <PieChartComponent
              data={porLifecycleStage}
              height={350}
              innerRadius={70}
              outerRadius={110}
            />
          </CardContent>
        </Card>

        {/* Top Responsáveis */}
        <Card>
          <CardHeader>
            <CardTitle>Leads por Responsável</CardTitle>
          </CardHeader>
          <CardContent>
            {topResponsaveis.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart
                  data={topResponsaveis}
                  layout="vertical"
                  margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                  <XAxis type="number" stroke="var(--chart-axis)" fontSize={12} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="var(--chart-axis)"
                    fontSize={11}
                    width={120}
                    tickFormatter={(value: string) =>
                      value.length > 15 ? value.slice(0, 15) + '...' : value
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--chart-tooltip-bg)',
                      border: '1px solid var(--chart-tooltip-border)',
                      borderRadius: '8px',
                      color: 'var(--chart-tooltip-text)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[350px] text-gray-400">
                Sem dados para exibir
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ============================================
// HELPERS
// ============================================

/** Traduz o lifecycle_stage para label amigável */
function stageLabel(stage: string): string {
  const labels: Record<string, string> = {
    lead: 'Lead',
    opportunity: 'Oportunidade',
    customer: 'Cliente',
    '165518199': 'Qualificado (Custom)',
    salesqualifiedlead: 'SQL',
    marketingqualifiedlead: 'MQL',
    subscriber: 'Subscriber',
    evangelist: 'Evangelist',
    other: 'Outro',
    'Não definido': 'Não definido',
  };
  return labels[stage] || stage;
}
