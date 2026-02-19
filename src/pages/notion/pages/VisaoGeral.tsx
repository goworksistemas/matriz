import {
  AlertTriangle,
  CheckCircle,
  Clock,
  ListTodo,
  CalendarClock,
  Layers,
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
}

export function VisaoGeral({
  kpis,
  dadosGraficoStatus,
  dadosGraficoPrioridade,
  dadosGraficoDepartamento,
}: VisaoGeralProps) {
  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
      </div>

      {/* Graficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Por Departamento</CardTitle>
        </CardHeader>
        <CardContent>
          <BarChartComponent
            data={dadosGraficoDepartamento}
            height={300}
            layout="vertical"
          />
        </CardContent>
      </Card>
    </div>
  );
}
