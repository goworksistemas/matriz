import { DollarSign, Layers, Briefcase, Target, TrendingUp } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { formatCurrency, formatNumber, cn } from '@/lib/utils';
import type { KPIsMetaGlobal, FiltrosMetaGlobal } from '@/types';

const MESES_COMPLETO = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function GaugeChart({
  value,
  max,
  label,
  formatFn,
  color,
  icon: Icon,
}: {
  value: number;
  max: number;
  label: string;
  formatFn: (v: number) => string;
  color: string;
  icon: React.ElementType;
}) {
  const percent = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const atingiu = max > 0 && value >= max;

  const radius = 80;
  const strokeWidth = 14;
  const cx = 100;
  const cy = 95;
  const startAngle = Math.PI;
  const endAngle = 0;
  const totalArc = Math.PI;

  const arcPath = (r: number, startA: number, endA: number) => {
    const x1 = cx + r * Math.cos(startA);
    const y1 = cy - r * Math.sin(startA);
    const x2 = cx + r * Math.cos(endA);
    const y2 = cy - r * Math.sin(endA);
    return `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`;
  };

  const progressAngle = startAngle - (percent / 100) * totalArc;
  const bgPath = arcPath(radius, startAngle, endAngle);
  const valuePath = arcPath(radius, startAngle, progressAngle);

  const needleAngle = startAngle - (percent / 100) * totalArc;
  const needleLength = radius - 20;
  const nx = cx + needleLength * Math.cos(needleAngle);
  const ny = cy - needleLength * Math.sin(needleAngle);

  const displayColor = atingiu ? '#10b981' : color;

  return (
    <div className="rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-gray-900/50 p-5 text-center">
      <div className="flex items-center justify-center gap-2 mb-3">
        <Icon className="h-4 w-4" style={{ color: displayColor }} />
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</span>
      </div>

      <svg viewBox="0 0 200 110" className="w-full max-w-[220px] mx-auto">
        <path d={bgPath} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" className="text-gray-100 dark:text-white/[0.06]" />
        {percent > 0 && (
          <path d={valuePath} fill="none" stroke={displayColor} strokeWidth={strokeWidth} strokeLinecap="round" />
        )}
        <circle cx={nx} cy={ny} r={4} fill={displayColor} />
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={displayColor} strokeWidth={2} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={5} fill={displayColor} />
      </svg>

      <div className="-mt-2">
        <p className="text-2xl font-bold" style={{ color: displayColor }}>
          {formatNumber(percent, 1)}%
        </p>
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-1 truncate">{formatFn(value)}</p>
        <p className="text-[11px] text-gray-400 truncate">
          {max > 0 ? `Meta: ${formatFn(max)}` : 'Sem meta definida'}
        </p>
        {atingiu && (
          <span className="inline-block mt-1.5 text-[11px] font-semibold text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full">
            Meta atingida
          </span>
        )}
      </div>
    </div>
  );
}

interface DashboardVelocimetroProps {
  kpisMetaGlobal: KPIsMetaGlobal;
  filtrosGlobal: FiltrosMetaGlobal;
}

export function DashboardVelocimetro({ kpisMetaGlobal, filtrosGlobal }: DashboardVelocimetroProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-primary-200/60 dark:border-primary-500/20 bg-gradient-to-r from-primary-50 to-white dark:from-primary-500/10 dark:to-gray-900/40 p-4">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-primary-500" />
          <div>
            <p className="text-xs uppercase tracking-wide text-primary-700 dark:text-primary-300">Velocimetro de Metas</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Progresso visual de receita, seats e deals — {filtrosGlobal.ano}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
          <Target className="h-3.5 w-3.5 text-primary-500" />
          Meta Anual — {filtrosGlobal.ano}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GaugeChart
            value={kpisMetaGlobal.revenueAno}
            max={kpisMetaGlobal.metaAnualRevenue}
            label="Receita"
            formatFn={formatCurrency}
            color="#10b981"
            icon={DollarSign}
          />
          <GaugeChart
            value={kpisMetaGlobal.seatsAno}
            max={kpisMetaGlobal.metaAnualSeats}
            label="Seats"
            formatFn={(v) => formatNumber(v)}
            color="#0ea5e9"
            icon={Layers}
          />
          <GaugeChart
            value={kpisMetaGlobal.dealsAno}
            max={kpisMetaGlobal.metaAnualDeals}
            label="Deals"
            formatFn={(v) => formatNumber(v)}
            color="#8b5cf6"
            icon={Briefcase}
          />
        </div>
      </div>

      {filtrosGlobal.mes > 0 && (
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-primary-500" />
            Meta Mensal — {MESES_COMPLETO[filtrosGlobal.mes - 1]} {filtrosGlobal.ano}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <GaugeChart
              value={kpisMetaGlobal.revenueMes}
              max={kpisMetaGlobal.metaMensalRevenue}
              label="Receita"
              formatFn={formatCurrency}
              color="#10b981"
              icon={DollarSign}
            />
            <GaugeChart
              value={kpisMetaGlobal.seatsMes}
              max={kpisMetaGlobal.metaMensalSeats}
              label="Seats"
              formatFn={(v) => formatNumber(v)}
              color="#0ea5e9"
              icon={Layers}
            />
            <GaugeChart
              value={kpisMetaGlobal.dealsMes}
              max={kpisMetaGlobal.metaMensalDeals}
              label="Deals"
              formatFn={(v) => formatNumber(v)}
              color="#8b5cf6"
              icon={Briefcase}
            />
          </div>
        </div>
      )}
    </div>
  );
}
