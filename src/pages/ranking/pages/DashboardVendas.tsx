import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  Target,
  Award,
  RotateCcw,
  Save,
  Loader2,
  CheckCircle,
  Settings2,
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
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Select, SelectItem } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { KPICard } from '@/components/KPICard';
import { BarChartComponent } from '@/components/charts/BarChartComponent';
import { PieChartComponent } from '@/components/charts/PieChartComponent';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { upsertSalesGoal } from '../services/api';
import type {
  DealProcessado,
  MetaVendas,
  FiltrosVendas,
  KPIsVendas,
  DadoGraficoMensal,
  DadosGrafico,
} from '@/types';

// Nomes dos meses
const MESES = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

const MESES_COMPLETO = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

interface DashboardVendasProps {
  dealsGanhosAno: DealProcessado[];
  dealsGanhosMes: DealProcessado[];
  metas: MetaVendas[];
  filtrosVendas: FiltrosVendas;
  updateFiltroVendas: <K extends keyof FiltrosVendas>(key: K, value: FiltrosVendas[K]) => void;
  resetFiltrosVendas: () => void;
  vendedoresUnicos: string[];
  pipelinesUnicos: string[];
  onMetaSaved: () => void;
}

export function DashboardVendas({
  dealsGanhosAno,
  dealsGanhosMes,
  metas,
  filtrosVendas,
  updateFiltroVendas,
  resetFiltrosVendas,
  vendedoresUnicos,
  pipelinesUnicos,
  onMetaSaved,
}: DashboardVendasProps) {
  // ============================================
  // ESTADO DO EDITOR DE METAS
  // ============================================
  const [showMetaEditor, setShowMetaEditor] = useState(false);
  const [metaMensalInput, setMetaMensalInput] = useState('');
  const [metaAnualInput, setMetaAnualInput] = useState('');
  const [savingMeta, setSavingMeta] = useState(false);
  const [metaSaved, setMetaSaved] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Preencher inputs quando muda o mês/ano ou as metas carregam
  useEffect(() => {
    const metaAtual = metas.find(
      m => m.year === filtrosVendas.ano && m.month === filtrosVendas.mes
    );
    setMetaMensalInput(metaAtual?.monthlyGoal ? String(metaAtual.monthlyGoal) : '');

    const metaAno = metas.find(m => m.year === filtrosVendas.ano);
    setMetaAnualInput(metaAno?.annualGoal ? String(metaAno.annualGoal) : '');
  }, [metas, filtrosVendas.ano, filtrosVendas.mes]);

  const handleSaveMeta = useCallback(async () => {
    if (filtrosVendas.mes === 0) return; // Não salvar se "Todos" está selecionado

    const monthly = parseFloat(metaMensalInput.replace(',', '.')) || 0;
    const annual = parseFloat(metaAnualInput.replace(',', '.')) || 0;

    setSavingMeta(true);
    setMetaSaved(false);
    try {
      await upsertSalesGoal(filtrosVendas.ano, filtrosVendas.mes, monthly, annual);
      setMetaSaved(true);
      onMetaSaved();
      // Limpar indicador de "salvo" após 3s
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => setMetaSaved(false), 3000);
    } catch (err) {
      console.error('Erro ao salvar meta:', err);
    } finally {
      setSavingMeta(false);
    }
  }, [filtrosVendas.ano, filtrosVendas.mes, metaMensalInput, metaAnualInput, onMetaSaved]);

  // Verificar se há filtros ativos
  const hasActiveFilters = useMemo(() => {
    const anoAtual = new Date().getFullYear();
    const mesAtual = new Date().getMonth() + 1;
    return (
      filtrosVendas.ano !== anoAtual ||
      filtrosVendas.mes !== mesAtual ||
      filtrosVendas.vendedor !== '' ||
      filtrosVendas.pipeline !== ''
    );
  }, [filtrosVendas]);

  // Anos disponíveis para o filtro (dos deals + ano do filtro atual)
  const anosDisponiveis = useMemo(() => {
    const anosDeals = new Set(dealsGanhosAno.map(d => d.ano).filter(a => a > 0));
    // Adicionar também anos dos deals NÃO filtrados (para não perder anos quando não há ganhos)
    anosDeals.add(filtrosVendas.ano);
    // Adicionar últimos 3 anos como opção
    const anoAtual = new Date().getFullYear();
    for (let i = 0; i < 3; i++) anosDeals.add(anoAtual - i);
    return [...anosDeals].sort((a, b) => b - a);
  }, [dealsGanhosAno, filtrosVendas.ano]);

  // KPIs de Vendas
  const kpis = useMemo<KPIsVendas>(() => {
    const totalVendidoMes = dealsGanhosMes.reduce((acc, d) => acc + d.amount, 0);
    const totalVendidoAno = dealsGanhosAno.reduce((acc, d) => acc + d.amount, 0);

    // Buscar meta do mês e ano selecionados
    const metaDoMes = metas.find(
      m => m.year === filtrosVendas.ano && m.month === filtrosVendas.mes
    );
    const metaMensal = metaDoMes?.monthlyGoal || 0;

    // Meta anual: pegar de qualquer registro do ano
    const metaDoAno = metas.find(m => m.year === filtrosVendas.ano);
    const metaAnual = metaDoAno?.annualGoal || 0;

    const atingimentoMensal = metaMensal > 0 ? (totalVendidoMes / metaMensal) : 0;
    const atingimentoAnual = metaAnual > 0 ? (totalVendidoAno / metaAnual) : 0;

    return {
      totalVendidoMes,
      totalVendidoAno,
      metaMensal,
      metaAnual,
      atingimentoMensal,
      atingimentoAnual,
      totalDealsGanhosMes: dealsGanhosMes.length,
      totalDealsGanhosAno: dealsGanhosAno.length,
    };
  }, [dealsGanhosMes, dealsGanhosAno, metas, filtrosVendas]);

  // Gráfico mensal: Meta vs Realizado (12 barras)
  const dadosGraficoMensal = useMemo<DadoGraficoMensal[]>(() => {
    return MESES.map((mes, index) => {
      const mesNumero = index + 1;
      const realizado = dealsGanhosAno
        .filter(d => d.mes === mesNumero)
        .reduce((acc, d) => acc + d.amount, 0);

      const metaDoMes = metas.find(
        m => m.year === filtrosVendas.ano && m.month === mesNumero
      );

      return {
        mes,
        mesNumero,
        realizado,
        meta: metaDoMes?.monthlyGoal || 0,
      };
    });
  }, [dealsGanhosAno, metas, filtrosVendas.ano]);

  // Top vendedores por valor
  const topVendedores = useMemo<DadosGrafico[]>(() => {
    const porVendedor = new Map<string, number>();
    dealsGanhosAno.forEach(d => {
      porVendedor.set(d.ownerNome, (porVendedor.get(d.ownerNome) || 0) + d.amount);
    });
    return Array.from(porVendedor.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [dealsGanhosAno]);

  // Distribuição por pipeline
  const porPipeline = useMemo<DadosGrafico[]>(() => {
    const mapa = new Map<string, number>();
    dealsGanhosAno.forEach(d => {
      mapa.set(d.pipelineNome, (mapa.get(d.pipelineNome) || 0) + 1);
    });
    return Array.from(mapa.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [dealsGanhosAno]);

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card className="!p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Ano</label>
            <Select
              value={String(filtrosVendas.ano)}
              onValueChange={(v) => updateFiltroVendas('ano', Number(v))}
              placeholder="Ano"
            >
              {anosDisponiveis.map((a) => (
                <SelectItem key={a} value={String(a)}>
                  {a}
                </SelectItem>
              ))}
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Mês</label>
            <Select
              value={String(filtrosVendas.mes)}
              onValueChange={(v) => updateFiltroVendas('mes', Number(v))}
              placeholder="Mês"
            >
              <SelectItem value="0">Todos</SelectItem>
              {MESES.map((m, i) => (
                <SelectItem key={i + 1} value={String(i + 1)}>
                  {m}
                </SelectItem>
              ))}
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Vendedor</label>
            <Select
              value={filtrosVendas.vendedor}
              onValueChange={(v) => updateFiltroVendas('vendedor', v)}
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
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Pipeline</label>
            <Select
              value={filtrosVendas.pipeline}
              onValueChange={(v) => updateFiltroVendas('pipeline', v)}
              placeholder="Todos"
            >
              <SelectItem value="">Todos</SelectItem>
              {pipelinesUnicos.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </Select>
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFiltrosVendas}
              className="mb-0.5"
            >
              <RotateCcw className="h-4 w-4 mr-1.5" />
              Limpar
            </Button>
          )}

          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm text-gray-400">
              {dealsGanhosMes.length} deals ganhos
            </span>
            <Button
              variant={showMetaEditor ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setShowMetaEditor(prev => !prev)}
              title="Editar metas"
            >
              <Settings2 className="h-3.5 w-3.5 mr-1.5" />
              <span className="text-xs">Metas</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Editor de Metas */}
      {showMetaEditor && (
        <Card className="!p-4 border-primary-200 dark:border-primary-500/30 bg-gradient-to-r from-primary-50/50 dark:from-primary-500/5 to-transparent">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex items-center gap-2 mr-2">
              <Target className="h-4 w-4 text-primary-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Definir Metas — {filtrosVendas.mes > 0 ? `${MESES_COMPLETO[filtrosVendas.mes - 1]} ${filtrosVendas.ano}` : 'Selecione um mês'}
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Meta Mensal (R$)</label>
              <input
                type="text"
                inputMode="decimal"
                value={metaMensalInput}
                onChange={(e) => setMetaMensalInput(e.target.value)}
                disabled={filtrosVendas.mes === 0}
                placeholder="0,00"
                className="h-9 w-40 rounded-lg border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-gray-900 px-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 disabled:opacity-50"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Meta Anual (R$)</label>
              <input
                type="text"
                inputMode="decimal"
                value={metaAnualInput}
                onChange={(e) => setMetaAnualInput(e.target.value)}
                disabled={filtrosVendas.mes === 0}
                placeholder="0,00"
                className="h-9 w-40 rounded-lg border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-gray-900 px-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 disabled:opacity-50"
              />
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveMeta}
              disabled={savingMeta || filtrosVendas.mes === 0}
              className="mb-0.5"
            >
              {savingMeta ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : metaSaved ? (
                <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
              ) : (
                <Save className="h-3.5 w-3.5 mr-1.5" />
              )}
              <span className="text-xs">{metaSaved ? 'Salvo!' : 'Salvar'}</span>
            </Button>

            {filtrosVendas.mes === 0 && (
              <span className="text-xs text-amber-500 dark:text-amber-400">
                Selecione um mês específico para editar a meta
              </span>
            )}
          </div>
        </Card>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title={`Vendido (${filtrosVendas.mes > 0 ? MESES[filtrosVendas.mes - 1] : 'Ano'})`}
          value={formatCurrency(kpis.totalVendidoMes)}
          subtitle={`${formatNumber(kpis.totalDealsGanhosMes)} deals`}
          icon={DollarSign}
          variant="success"
        />
        <KPICard
          title={`Vendido (${filtrosVendas.ano})`}
          value={formatCurrency(kpis.totalVendidoAno)}
          subtitle={`${formatNumber(kpis.totalDealsGanhosAno)} deals`}
          icon={TrendingUp}
          variant="primary"
        />
        <KPICard
          title="Atingimento Mensal"
          value={kpis.metaMensal > 0 ? `${formatNumber(kpis.atingimentoMensal * 100, 1)}%` : 'Sem meta'}
          subtitle={kpis.metaMensal > 0 ? `Meta: ${formatCurrency(kpis.metaMensal)}` : 'Defina no botão Metas'}
          icon={Target}
          variant={kpis.atingimentoMensal >= 1 ? 'success' : 'warning'}
        />
        <KPICard
          title="Atingimento Anual"
          value={kpis.metaAnual > 0 ? `${formatNumber(kpis.atingimentoAnual * 100, 1)}%` : 'Sem meta'}
          subtitle={kpis.metaAnual > 0 ? `Meta: ${formatCurrency(kpis.metaAnual)}` : 'Defina no botão Metas'}
          icon={Award}
          variant={kpis.atingimentoAnual >= 1 ? 'success' : 'warning'}
        />
      </div>

      {/* Gráfico Mensal: Meta vs Realizado */}
      <Card>
        <CardHeader>
          <CardTitle>Meta vs Realizado — {filtrosVendas.ano}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={dadosGraficoMensal} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
              <XAxis dataKey="mes" stroke="var(--chart-axis)" fontSize={12} />
              <YAxis
                stroke="var(--chart-axis)"
                fontSize={12}
                tickFormatter={(v: number) =>
                  v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
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
                labelStyle={{ color: 'var(--chart-tooltip-label)' }}
                formatter={(value: number, name: string) => [
                  formatCurrency(value),
                  name === 'realizado' ? 'Realizado' : 'Meta',
                ]}
              />
              <Legend
                formatter={(value: string) => (
                  <span style={{ color: 'var(--chart-legend-text)', fontSize: '12px' }}>
                    {value === 'realizado' ? 'Realizado' : 'Meta'}
                  </span>
                )}
              />
              <Bar dataKey="meta" fill="#6366f1" radius={[4, 4, 0, 0]} opacity={0.4} />
              <Bar dataKey="realizado" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráficos secundários */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Vendedores por valor */}
        <Card>
          <CardHeader>
            <CardTitle>Top Vendedores por Valor</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChartComponent
              data={topVendedores}
              height={350}
            />
          </CardContent>
        </Card>

        {/* Distribuição por Pipeline */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <PieChartComponent
              data={porPipeline}
              height={350}
              innerRadius={70}
              outerRadius={110}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
