import {
  AlertTriangle,
  CheckCircle,
  Clock,
  ListTodo,
  CalendarClock,
  Layers,
  UserCircle2,
  CalendarRange,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { PieChartComponent } from '@/components/charts/PieChartComponent';
import { BarChartComponent } from '@/components/charts/BarChartComponent';
import type { KPIsNotion } from '../hooks/useNotionFilters';
import type { DadosGrafico } from '@/types';

interface VisaoGeralProps {
  kpis: KPIsNotion;
  dadosGraficoStatus: DadosGrafico[];
  dadosGraficoPrioridade: DadosGrafico[];
  dadosGraficoDepartamento: DadosGrafico[];
  dadosGraficoPrazo: DadosGrafico[];
  dadosGraficoExecutores: DadosGrafico[];
}

export function VisaoGeral({
  kpis,
  dadosGraficoStatus,
  dadosGraficoPrioridade,
  dadosGraficoDepartamento,
  dadosGraficoPrazo,
  dadosGraficoExecutores,
}: VisaoGeralProps) {
  const totalMonitorado = kpis.vencidas + kpis.venceHoje + kpis.noPrazo + kpis.semData;
  const indiceRisco = totalMonitorado > 0 ? Math.round(((kpis.vencidas + kpis.venceHoje) / totalMonitorado) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
        <div className="rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-gray-900/50 p-4">
          <div className="flex items-center gap-2 mb-1">
            <ListTodo className="h-4 w-4 text-primary-500" />
            <span className="text-xs font-medium text-gray-500">Tarefas Ativas</span>
          </div>
          <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {kpis.tarefasAtivas}
          </span>
          <span className="text-[11px] text-gray-400 ml-1.5">/ {kpis.totalTarefas} total</span>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-gray-900/50 p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-xs font-medium text-gray-500">Vencidas</span>
          </div>
          <span className="text-xl font-bold text-red-600 dark:text-red-400">
            {kpis.vencidas}
          </span>
          {kpis.venceHoje > 0 && (
            <span className="text-[11px] text-amber-500 ml-1.5">+{kpis.venceHoje} hoje</span>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-gray-900/50 p-4">
          <div className="flex items-center gap-2 mb-1">
            <CalendarClock className="h-4 w-4 text-emerald-500" />
            <span className="text-xs font-medium text-gray-500">No Prazo</span>
          </div>
          <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
            {kpis.noPrazo}
          </span>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-gray-900/50 p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="h-4 w-4 text-sky-500" />
            <span className="text-xs font-medium text-gray-500">Concluidas</span>
          </div>
          <span className="text-xl font-bold text-sky-600 dark:text-sky-400">
            {kpis.percentConcluidas}%
          </span>
          <span className="text-[11px] text-gray-400 ml-1.5">({kpis.concluidas})</span>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-gray-900/50 p-4">
          <div className="flex items-center gap-2 mb-1">
            <CalendarRange className="h-4 w-4 text-violet-500" />
            <span className="text-xs font-medium text-gray-500">Sem Prazo</span>
          </div>
          <span className="text-xl font-bold text-violet-600 dark:text-violet-400">
            {kpis.semData}
          </span>
          <span className="text-[11px] text-gray-400 ml-1.5">tarefas ativas</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary-500" />
              Por Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PieChartComponent data={dadosGraficoStatus} height={280} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary-500" />
              Por Prioridade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PieChartComponent data={dadosGraficoPrioridade} height={280} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-primary-500" />
              Saude dos Prazos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BarChartComponent data={dadosGraficoPrazo} height={280} layout="horizontal" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Por Departamento</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChartComponent
              data={dadosGraficoDepartamento}
              height={320}
              layout="vertical"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCircle2 className="h-4 w-4 text-primary-500" />
              Top Responsaveis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BarChartComponent
              data={dadosGraficoExecutores}
              height={320}
              layout="vertical"
            />
          </CardContent>
        </Card>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-gray-900/50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Termometro do Quadro</p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Risco atual: <span className="font-semibold text-gray-900 dark:text-white">{indiceRisco}%</span> das tarefas ativas estao vencidas ou vencem hoje.
            </p>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {kpis.vencidas} vencidas • {kpis.venceHoje} vencem hoje • {kpis.noPrazo} no prazo
          </div>
        </div>
      </div>
    </div>
  );
}
