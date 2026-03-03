import { DollarSign, Target } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils';
import type { KPIsMetaGlobal, FiltrosMetaGlobal } from '@/types';

const META_RECEITA_ANUAL = 5_000_000;

function GaugeChart({ value, max }: { value: number; max: number }) {
  const percent = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const atingiu = max > 0 && value >= max;

  const r = 90;
  const stroke = 32;
  const cx = 150;
  const cy = 130;
  const circumference = Math.PI * r;
  const filled = (percent / 100) * circumference;

  const activeColor = atingiu ? '#10b981' : '#0ea5e9';

  const needleAngle = Math.PI - (percent / 100) * Math.PI;
  const needleLen = r - stroke / 2 - 8;
  const nx = cx + needleLen * Math.cos(needleAngle);
  const ny = cy - needleLen * Math.sin(needleAngle);

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 300 200" className="w-full max-w-[460px]">
        <defs>
          <linearGradient id="gFill" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0369a1" />
            <stop offset="50%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
          <linearGradient id="gFillOk" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#059669" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
        </defs>

        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          className="text-gray-200 dark:text-white/[0.08]"
        />

        {percent > 0 && (
          <path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            fill="none"
            stroke={atingiu ? 'url(#gFillOk)' : 'url(#gFill)'}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${circumference}`}
            strokeDashoffset={`${circumference - filled}`}
          />
        )}

        {[0, 25, 50, 75, 100].map((t) => {
          const a = Math.PI - (t / 100) * Math.PI;
          const lr = r + stroke / 2 + 14;
          const lx = cx + lr * Math.cos(a);
          const ly = cy - lr * Math.sin(a);
          return (
            <text key={t} x={lx} y={ly + 4} textAnchor="middle" fontSize={11} fill="currentColor" className="text-gray-400 dark:text-gray-500">
              {t}%
            </text>
          );
        })}

        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={activeColor} strokeWidth={2.5} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={6} fill={activeColor} />
        <circle cx={cx} cy={cy} r={2.5} fill="white" className="dark:fill-gray-900" />

        <text x={cx} y={cy + 45} textAnchor="middle" fontSize={38} fontWeight="bold" fill={activeColor}>
          {formatNumber(percent, 1)}%
        </text>
      </svg>
    </div>
  );
}

interface DashboardVelocimetroProps {
  kpisMetaGlobal: KPIsMetaGlobal;
  filtrosGlobal: FiltrosMetaGlobal;
}

export function DashboardVelocimetro({ kpisMetaGlobal, filtrosGlobal }: DashboardVelocimetroProps) {
  const faltam = Math.max(META_RECEITA_ANUAL - kpisMetaGlobal.revenueAno, 0);
  const percent = META_RECEITA_ANUAL > 0 ? Math.min((kpisMetaGlobal.revenueAno / META_RECEITA_ANUAL) * 100, 100) : 0;
  const atingiu = kpisMetaGlobal.revenueAno >= META_RECEITA_ANUAL;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-primary-200/60 dark:border-primary-500/20 bg-gradient-to-r from-primary-50 to-white dark:from-primary-500/10 dark:to-gray-900/40 p-4">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-primary-500" />
          <div>
            <p className="text-xs uppercase tracking-wide text-primary-700 dark:text-primary-300">Velocimetro de Meta</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">Progresso da receita anual — {filtrosGlobal.ano}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-gray-900/50 p-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <DollarSign className="h-5 w-5 text-primary-500" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Receita Anual — {filtrosGlobal.ano}</h3>
        </div>

        <GaugeChart value={kpisMetaGlobal.revenueAno} max={META_RECEITA_ANUAL} />

        <div className="grid grid-cols-3 gap-4 mt-4 max-w-lg mx-auto">
          <div className="text-center rounded-lg border border-gray-100 dark:border-white/[0.06] p-3">
            <p className="text-[11px] text-gray-400 mb-1">Realizado</p>
            <p className="text-base font-bold text-primary-600 dark:text-primary-400 truncate">{formatCurrency(kpisMetaGlobal.revenueAno)}</p>
          </div>
          <div className="text-center rounded-lg border border-gray-100 dark:border-white/[0.06] p-3">
            <p className="text-[11px] text-gray-400 mb-1">Meta</p>
            <p className="text-base font-bold text-gray-900 dark:text-gray-100 truncate">{formatCurrency(META_RECEITA_ANUAL)}</p>
          </div>
          <div className="text-center rounded-lg border border-gray-100 dark:border-white/[0.06] p-3">
            <p className="text-[11px] text-gray-400 mb-1">{atingiu ? 'Excedente' : 'Faltam'}</p>
            <p className={`text-base font-bold truncate ${atingiu ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
              {formatCurrency(faltam)}
            </p>
          </div>
        </div>

        {!atingiu && (
          <div className="mt-6 max-w-lg mx-auto">
            <div className="flex justify-between text-[11px] text-gray-400 mb-1.5">
              <span>Progresso</span>
              <span>{formatNumber(percent, 1)}%</span>
            </div>
            <div className="h-3 rounded-full bg-gray-100 dark:bg-white/[0.06] overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-primary-600 via-primary-500 to-primary-400 transition-all duration-700" style={{ width: `${percent}%` }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
