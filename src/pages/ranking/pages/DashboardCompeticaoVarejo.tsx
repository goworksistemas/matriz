import { Fragment, useMemo, useState, useEffect, useRef, type ImgHTMLAttributes } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getExpandedRowModel,
  flexRender,
  type ColumnDef,
  type ExpandedState,
} from '@tanstack/react-table';
import {
  Trophy,
  Medal,
  Users,
  Info,
  CheckCircle,
  XCircle,
  Flame,
  Layers,
  Crown,
  Briefcase,
  CalendarDays,
  Clock,
  Award,
  ShieldCheck,
  Ban,
  TrendingUp,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { cn, formatNumber, formatCurrency } from '@/lib/utils';
import type { VendedorCompeticao, Proprietario, NegocioVarejo } from '@/types';

const VAREJO_INICIO = new Date('2026-03-17T00:00:00');
const VAREJO_FIM = new Date('2026-05-18T23:59:59');

interface DashboardCompeticaoVarejoProps {
  rankingVarejo: VendedorCompeticao[];
  proprietarios: Proprietario[];
  negociosVarejo: NegocioVarejo[];
}

function getAvatarUrl(name: string, size = 128, bg = '0ea5e9'): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name.trim() || '?')}&size=${size}&background=${bg}&color=fff&bold=true&format=svg`;
}

const PODIUM_AVATAR_COLORS: Record<number, string> = {
  1: 'f59e0b',
  2: '9ca3af',
  3: 'f97316',
};

function OwnerAvatar({ name, size = 32, className, rank, ...rest }: { name: string; size?: number; rank?: number; className?: string } & Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt' | 'className'>) {
  const [errored, setErrored] = useState(false);
  const bg = rank ? (PODIUM_AVATAR_COLORS[rank] || '0ea5e9') : '0ea5e9';
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  if (errored) {
    return (
      <div className={cn('rounded-full flex items-center justify-center text-white font-bold', className)} style={{ width: size, height: size, backgroundColor: `#${bg}`, fontSize: size * 0.35 }}>
        {initials}
      </div>
    );
  }

  return (
    <img
      src={getAvatarUrl(name, size * 2, bg)}
      alt={name}
      className={cn('rounded-full object-cover', className)}
      style={{ width: size, height: size }}
      onError={() => setErrored(true)}
      loading="lazy"
      {...rest}
    />
  );
}

interface CountdownValue {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  status: 'upcoming' | 'active' | 'ended';
  label: string;
}

function useCountdown(): CountdownValue {
  const [now, setNow] = useState(() => new Date());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => setNow(new Date()), 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const hasStarted = now >= VAREJO_INICIO;
  const hasEnded = now > VAREJO_FIM;

  if (!hasStarted) {
    const diff = VAREJO_INICIO.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return { days, hours, minutes, seconds, status: 'upcoming', label: 'Inicia em' };
  }

  if (hasEnded) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, status: 'ended', label: 'Campanha encerrada' };
  }

  const diff = VAREJO_FIM.getTime() - now.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return { days, hours, minutes, seconds, status: 'active', label: 'Tempo restante' };
}

function CountdownTimer({ countdown }: { countdown: CountdownValue }) {
  if (countdown.status === 'ended') {
    return <span className="text-xs font-medium">Campanha encerrada</span>;
  }

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] text-gray-500 dark:text-gray-400 mr-1">{countdown.label}</span>
      {[
        { value: countdown.days, unit: 'd' },
        { value: countdown.hours, unit: 'h' },
        { value: countdown.minutes, unit: 'm' },
        { value: countdown.seconds, unit: 's' },
      ].map(({ value, unit }) => (
        <div key={unit} className="flex items-baseline gap-0.5">
          <span className="text-sm font-bold font-mono tabular-nums text-gray-900 dark:text-gray-100">{pad(value)}</span>
          <span className="text-[10px] text-gray-400">{unit}</span>
        </div>
      ))}
    </div>
  );
}

function Podium({ ranking, metrica }: { ranking: VendedorCompeticao[]; metrica: 'deals' | 'seats' }) {
  const top3 = ranking.slice(0, 3);

  if (top3.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 dark:text-gray-600">
        <div className="text-center">
          <Trophy className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhum vendedor com dados no periodo</p>
        </div>
      </div>
    );
  }

  const podiumConfig = [
    { gradient: 'from-amber-100 via-amber-50 to-white dark:from-amber-500/15 dark:via-amber-500/5 dark:to-transparent', border: 'border-amber-300 dark:border-amber-500/40', ring: 'ring-amber-400', shadow: 'shadow-amber-200/50 dark:shadow-amber-500/10', height: 'h-36', avatarSize: 72, rank: 1, badge: 'bg-gradient-to-r from-amber-500 to-yellow-400', textColor: 'text-amber-600 dark:text-amber-400' },
    { gradient: 'from-gray-100 via-gray-50 to-white dark:from-gray-500/15 dark:via-gray-500/5 dark:to-transparent', border: 'border-gray-300 dark:border-gray-500/40', ring: 'ring-gray-400', shadow: 'shadow-gray-200/50 dark:shadow-gray-500/10', height: 'h-24', avatarSize: 56, rank: 2, badge: 'bg-gradient-to-r from-gray-400 to-gray-300', textColor: 'text-gray-600 dark:text-gray-400' },
    { gradient: 'from-orange-100 via-orange-50 to-white dark:from-orange-500/15 dark:via-orange-500/5 dark:to-transparent', border: 'border-orange-300 dark:border-orange-500/40', ring: 'ring-orange-400', shadow: 'shadow-orange-200/50 dark:shadow-orange-500/10', height: 'h-20', avatarSize: 48, rank: 3, badge: 'bg-gradient-to-r from-orange-500 to-amber-400', textColor: 'text-orange-600 dark:text-orange-400' },
  ];

  const displayOrder = top3.length >= 3
    ? [{ data: top3[1], config: podiumConfig[1] }, { data: top3[0], config: podiumConfig[0] }, { data: top3[2], config: podiumConfig[2] }]
    : top3.length === 2
    ? [{ data: top3[1], config: podiumConfig[1] }, { data: top3[0], config: podiumConfig[0] }]
    : [{ data: top3[0], config: podiumConfig[0] }];

  return (
    <div className="flex items-end justify-center gap-6 py-8">
      {displayOrder.map(({ data: v, config }) => (
        <div key={v.ownerId} className="flex flex-col items-center">
          <div className="relative mb-3">
            {config.rank === 1 && <Crown className="absolute -top-5 left-1/2 -translate-x-1/2 h-7 w-7 text-amber-500 drop-shadow-lg z-10" />}
            <OwnerAvatar
              name={v.ownerNome}
              size={config.avatarSize}
              rank={config.rank}
              className={cn(
                'ring-[3px] ring-offset-[3px] ring-offset-white dark:ring-offset-gray-900',
                config.ring,
                config.rank === 1 && 'shadow-xl shadow-amber-200/60 dark:shadow-amber-500/20',
              )}
            />
            <span className={cn(
              'absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white shadow-lg',
              config.badge,
            )}>
              {config.rank}
            </span>
          </div>

          <span className={cn(
            'font-bold text-center max-w-[140px] truncate',
            config.rank === 1 ? 'text-base text-gray-900 dark:text-gray-100' : 'text-sm text-gray-700 dark:text-gray-300',
          )}>
            {v.ownerNome}
          </span>

          <div className="mt-2 text-center">
            <span className={cn('text-2xl font-black', config.textColor)}>
              {metrica === 'deals' ? v.dealsCount : formatNumber(v.seatsCapped)}
            </span>
            <p className="text-[11px] text-gray-400 font-medium -mt-0.5">
              {metrica === 'deals' ? 'contratos' : 'seats'}
            </p>
          </div>
          <span className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            {metrica === 'deals' ? `${formatNumber(v.seatsCapped)} seats` : `${v.dealsCount} contratos`}
          </span>

          <div className={cn(
            'w-28 rounded-t-xl border-2 flex items-center justify-center mt-3 shadow-lg',
            config.height, config.border,
            `bg-gradient-to-b ${config.gradient}`,
            config.shadow,
          )}>
            <span className={cn('text-lg font-black', config.textColor)}>
              #{config.rank}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

const VAREJO_META_MINIMA = 60;

const VENDEDORES_COMPETICAO = [
  'camila carvalho',
  'maria cristina',
  'vitor ortega',
  'laleska fernanda',
  'petherson castro',
  'jailson borges',
  'jaqueline menezes',
];

function isVendedorFixo(nome: string): boolean {
  const lower = nome.toLowerCase().trim();
  return VENDEDORES_COMPETICAO.some(v => lower.includes(v));
}

/** Agrupa negócios da competição por vendedor para a matriz expandível */
interface VarejoMatrizRow {
  ownerId: string;
  ownerNome: string;
  negocios: NegocioVarejo[];
  totalNegocios: number;
  validosCount: number;
  invalidosCount: number;
  semItemCount: number;
  seatsTotal: number;
  valorTotal: number;
}

function buildMatrizVarejoPorVendedor(negocios: NegocioVarejo[]): VarejoMatrizRow[] {
  const map = new Map<string, NegocioVarejo[]>();
  negocios.forEach(n => {
    const list = map.get(n.ownerId) || [];
    list.push(n);
    map.set(n.ownerId, list);
  });

  return Array.from(map.entries())
    .map(([ownerId, lista]) => {
      const ownerNome = lista[0]?.ownerNome ?? '';
      const validos = lista.filter(x => x.valido);
      const invalidos = lista.filter(x => !x.valido);
      const semItem = lista.filter(x => !x.temLineItem);
      const seatsTotal = validos.reduce((acc, x) => acc + (x.seats ?? 0), 0);
      const valorTotal = lista.reduce((acc, x) => acc + x.amount, 0);
      return {
        ownerId,
        ownerNome,
        negocios: lista.sort((a, b) => b.closeDate.localeCompare(a.closeDate)),
        totalNegocios: lista.length,
        validosCount: validos.length,
        invalidosCount: invalidos.length,
        semItemCount: semItem.length,
        seatsTotal,
        valorTotal,
      };
    })
    .sort((a, b) => b.validosCount - a.validosCount || b.seatsTotal - a.seatsTotal || a.ownerNome.localeCompare(b.ownerNome));
}

export function DashboardCompeticaoVarejo({ rankingVarejo, proprietarios, negociosVarejo }: DashboardCompeticaoVarejoProps) {
  const countdown = useCountdown();
  const [regrasAbertas, setRegrasAbertas] = useState(false);
  const [expandedMatrizVarejo, setExpandedMatrizVarejo] = useState<ExpandedState>({});

  const matrizNegociosVarejo = useMemo(
    () => buildMatrizVarejoPorVendedor(negociosVarejo),
    [negociosVarejo],
  );

  const colunasMatrizVarejo = useMemo<ColumnDef<VarejoMatrizRow>[]>(
    () => [
      {
        id: 'expander',
        header: () => null,
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => row.toggleExpanded()}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            aria-expanded={row.getIsExpanded()}
          >
            {row.getIsExpanded() ? (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-400" />
            )}
          </button>
        ),
        size: 40,
      },
      {
        accessorKey: 'ownerNome',
        header: 'Vendedor',
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5">
            <OwnerAvatar name={row.original.ownerNome} size={28} className="flex-shrink-0" />
            <span className="font-medium text-gray-900 dark:text-gray-100">{row.original.ownerNome}</span>
          </div>
        ),
      },
      {
        id: 'totalNegocios',
        header: 'Negócios',
        cell: ({ row }) => (
          <span className="text-gray-600 dark:text-gray-300 tabular-nums">{row.original.totalNegocios}</span>
        ),
        size: 80,
      },
      {
        id: 'validos',
        header: 'Válidos',
        cell: ({ row }) => (
          <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">{row.original.validosCount}</span>
        ),
        size: 72,
      },
      {
        id: 'invalidos',
        header: '>20 seats',
        cell: ({ row }) => (
          <span className={cn('tabular-nums', row.original.invalidosCount > 0 ? 'text-red-500' : 'text-gray-400')}>
            {row.original.invalidosCount}
          </span>
        ),
        size: 88,
      },
      {
        id: 'semItem',
        header: 'Sem item',
        cell: ({ row }) => (
          <span className={cn('tabular-nums', row.original.semItemCount > 0 ? 'text-amber-500' : 'text-gray-400')}>
            {row.original.semItemCount}
          </span>
        ),
        size: 80,
      },
      {
        id: 'seats',
        header: 'Seats (comp.)',
        cell: ({ row }) => (
          <span className="text-gray-800 dark:text-gray-200 tabular-nums">{formatNumber(row.original.seatsTotal)}</span>
        ),
      },
      {
        id: 'valor',
        header: 'Valor total',
        cell: ({ row }) => (
          <span className="text-gray-600 dark:text-gray-300">{formatCurrency(row.original.valorTotal)}</span>
        ),
      },
    ],
    [],
  );

  const tableMatrizVarejo = useReactTable({
    data: matrizNegociosVarejo,
    columns: colunasMatrizVarejo,
    state: { expanded: expandedMatrizVarejo },
    onExpandedChange: setExpandedMatrizVarejo,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowId: row => row.ownerId,
    getRowCanExpand: row => row.original.negocios.length > 0,
  });

  const rankingCompleto = useMemo<VendedorCompeticao[]>(() => {
    const existentes = new Set(rankingVarejo.map(v => v.ownerId));

    const vendedoresFixosZero: VendedorCompeticao[] = proprietarios
      .filter(p => !existentes.has(p.hubspotId) && isVendedorFixo(p.nome))
      .map(p => ({
        ownerId: p.hubspotId,
        ownerNome: p.nome,
        seatsCapped: 0,
        seatsRaw: 0,
        dealsCount: 0,
        ranking: 0,
        metaMinima: VAREJO_META_MINIMA,
        status: `Faltam ${VAREJO_META_MINIMA} seats`,
      }));

    const todos = [...rankingVarejo, ...vendedoresFixosZero]
      .sort((a, b) => b.dealsCount - a.dealsCount || b.seatsCapped - a.seatsCapped);

    todos.forEach((v, i) => { v.ranking = i + 1; });

    return todos;
  }, [rankingVarejo, proprietarios]);

  const kpis = useMemo(() => {
    const totalSeats = rankingVarejo.reduce((acc, v) => acc + v.seatsCapped, 0);
    const totalDeals = rankingVarejo.reduce((acc, v) => acc + v.dealsCount, 0);
    const vendedoresCompetindo = rankingVarejo.filter(v => v.seatsCapped >= v.metaMinima).length;
    const totalVendedores = rankingCompleto.length;
    const mediaDeals = totalVendedores > 0 ? totalDeals / totalVendedores : 0;
    const seatsPerDeal = totalDeals > 0 ? totalSeats / totalDeals : 0;
    const melhorVendedor = rankingVarejo.length > 0 ? rankingVarejo[0] : null;

    return { totalSeats, totalDeals, vendedoresCompetindo, totalVendedores, mediaDeals, seatsPerDeal, melhorVendedor };
  }, [rankingVarejo, rankingCompleto]);

  return (
    <div className="space-y-6">
      {/* Banner da Campanha */}
      <div className="rounded-xl border border-amber-200/60 dark:border-amber-500/20 bg-gradient-to-r from-amber-50 via-white to-amber-50 dark:from-amber-500/10 dark:via-gray-900/40 dark:to-amber-500/10 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Competicao Varejo — Vendas</h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 max-w-xl">
              Essa campanha foi pensada para conseguirmos vender o que nos resta de varejo.
              O foco e constancia, ritmo e quantidade de fechamentos de sala privativa.
            </p>
            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 pt-1">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5 text-amber-500" />
                17/03/2026 a 18/05/2026
              </span>
              <div className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-xl',
                countdown.status === 'active'
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 ring-1 ring-emerald-200 dark:ring-emerald-500/20'
                  : countdown.status === 'upcoming'
                  ? 'bg-blue-50 dark:bg-blue-500/10 ring-1 ring-blue-200 dark:ring-blue-500/20'
                  : 'bg-gray-100 dark:bg-gray-800 ring-1 ring-gray-200 dark:ring-gray-700',
              )}>
                <Clock className={cn('h-3.5 w-3.5', countdown.status === 'active' ? 'text-emerald-500' : countdown.status === 'upcoming' ? 'text-blue-500' : 'text-gray-400')} />
                <CountdownTimer countdown={countdown} />
              </div>
            </div>
          </div>

          {/* Premiação mini-cards */}
          <div className="flex gap-3">
            <div className="rounded-xl border border-amber-200 dark:border-amber-500/30 bg-gradient-to-b from-amber-50 to-white dark:from-amber-500/10 dark:to-gray-900/50 p-3 text-center min-w-[100px]">
              <Award className="h-5 w-5 text-amber-500 mx-auto mb-1" />
              <p className="text-[10px] uppercase tracking-wide text-amber-600 dark:text-amber-400 font-semibold">1o Lugar</p>
              <p className="text-base font-bold text-amber-700 dark:text-amber-300">{formatCurrency(1500)}</p>
            </div>
            <div className="rounded-xl border border-gray-200 dark:border-gray-500/30 bg-gradient-to-b from-gray-50 to-white dark:from-gray-500/10 dark:to-gray-900/50 p-3 text-center min-w-[100px]">
              <Medal className="h-5 w-5 text-gray-400 mx-auto mb-1" />
              <p className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400 font-semibold">2o Lugar</p>
              <p className="text-base font-bold text-gray-600 dark:text-gray-300">{formatCurrency(750)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-gray-900/50 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Briefcase className="h-4 w-4 text-amber-500" />
            <span className="text-xs font-medium text-gray-500">Total Contratos</span>
          </div>
          <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {kpis.totalDeals}
          </span>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-gray-900/50 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Layers className="h-4 w-4 text-sky-500" />
            <span className="text-xs font-medium text-gray-500">Total Seats</span>
          </div>
          <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {formatNumber(kpis.totalSeats)}
          </span>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-gray-900/50 p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-violet-500" />
            <span className="text-xs font-medium text-gray-500">Seats/Contrato</span>
          </div>
          <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {formatNumber(kpis.seatsPerDeal, 1)}
          </span>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-gray-900/50 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-4 w-4 text-primary-500" />
            <span className="text-xs font-medium text-gray-500">Vendedores</span>
          </div>
          <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {kpis.totalVendedores}
          </span>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-gray-900/50 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Flame className="h-4 w-4 text-emerald-500" />
            <span className="text-xs font-medium text-gray-500">Competindo</span>
          </div>
          <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
            {kpis.vendedoresCompetindo}
          </span>
          <span className="text-[11px] text-gray-400 ml-1">
            / {kpis.totalVendedores}
          </span>
        </div>
      </div>

      {/* Líder */}
      {kpis.melhorVendedor && (
        <div className="rounded-xl border border-amber-200/60 dark:border-amber-500/20 bg-gradient-to-r from-amber-50 to-white dark:from-amber-500/10 dark:to-gray-900/40 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <OwnerAvatar name={kpis.melhorVendedor.ownerNome} size={44} rank={1} className="ring-2 ring-amber-400 ring-offset-2 ring-offset-white dark:ring-offset-gray-900" />
                <Crown className="absolute -top-2 -right-2 h-4 w-4 text-amber-500 drop-shadow" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-amber-700 dark:text-amber-300">Lider da Competicao</p>
                <p className="text-base font-semibold text-gray-900 dark:text-gray-100">{kpis.melhorVendedor.ownerNome}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{kpis.melhorVendedor.dealsCount} contratos</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{formatNumber(kpis.melhorVendedor.seatsCapped)} seats acumulados</p>
            </div>
          </div>
        </div>
      )}

      {/* Pódio */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-b from-amber-50/50 via-white to-white dark:from-amber-500/5 dark:via-gray-900/50 dark:to-gray-900/50">
          <CardHeader className="text-center pb-0">
            <CardTitle className="flex items-center justify-center gap-2 text-lg">
              <Trophy className="h-5 w-5 text-amber-500" />
              Podio da Competicao
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Podium ranking={rankingVarejo} metrica="deals" />
          </CardContent>
        </div>
      </Card>

      {/* Matriz de negócios por vendedor (expandir = detalhe por deal) */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-sky-500" />
              Matriz de Negócios por Vendedor
            </CardTitle>
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
              <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-emerald-500" />{negociosVarejo.filter(n => n.valido).length} válidos</span>
              {negociosVarejo.filter(n => !n.valido).length > 0 && (
                <span className="flex items-center gap-1"><Ban className="h-3 w-3 text-red-400" />{negociosVarejo.filter(n => !n.valido).length} descartados</span>
              )}
              {negociosVarejo.filter(n => !n.temLineItem).length > 0 && (
                <span className="flex items-center gap-1 text-amber-500"><Info className="h-3 w-3" />{negociosVarejo.filter(n => !n.temLineItem).length} sem line item</span>
              )}
              <span>{negociosVarejo.length} negócios · {matrizNegociosVarejo.length} vendedores</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {negociosVarejo.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-400 px-6">
              Nenhum negócio de Sala Privativa fechado no período da campanha
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
                  {tableMatrizVarejo.getHeaderGroups().map(hg => (
                    <tr key={hg.id}>
                      {hg.headers.map(header => (
                        <th
                          key={header.id}
                          className="px-4 py-3 text-left font-semibold text-gray-500 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700"
                          style={{ width: header.getSize() }}
                        >
                          {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {tableMatrizVarejo.getRowModel().rows.map(row => (
                    <Fragment key={row.id}>
                      <tr className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        {row.getVisibleCells().map(cell => (
                          <td key={cell.id} className="px-4 py-3 align-middle">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                      {row.getIsExpanded() && (
                        <tr>
                          <td colSpan={colunasMatrizVarejo.length} className="p-0">
                            <div className="px-4 py-4 bg-gray-50 dark:bg-gray-900/50 border-y border-gray-200 dark:border-gray-700">
                              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                Negócios — {row.original.ownerNome}
                              </h4>
                              <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                  <thead className="bg-gray-100 dark:bg-gray-800">
                                    <tr>
                                      <th className="px-3 py-2 text-left text-gray-500 dark:text-gray-400 font-semibold">Status</th>
                                      <th className="px-3 py-2 text-left text-gray-500 dark:text-gray-400 font-semibold">Negócio</th>
                                      <th className="px-3 py-2 text-left text-gray-500 dark:text-gray-400 font-semibold">Produto</th>
                                      <th className="px-3 py-2 text-right text-gray-500 dark:text-gray-400 font-semibold">Seats</th>
                                      <th className="px-3 py-2 text-right text-gray-500 dark:text-gray-400 font-semibold">Valor</th>
                                      <th className="px-3 py-2 text-left text-gray-500 dark:text-gray-400 font-semibold">Fechamento</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {row.original.negocios.map(n => (
                                      <tr
                                        key={n.dealHubspotId}
                                        className={cn(
                                          'border-b border-gray-100 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800/30',
                                          !n.valido && 'opacity-70',
                                        )}
                                      >
                                        <td className="px-3 py-2 whitespace-nowrap">
                                          {!n.temLineItem ? (
                                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-500">
                                              <Info className="h-3 w-3" />
                                              Sem item
                                            </span>
                                          ) : n.valido ? (
                                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                                              <CheckCircle className="h-3 w-3" />
                                              Válido
                                            </span>
                                          ) : (
                                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-500">
                                              <Ban className="h-3 w-3" />
                                              {'>20 seats'}
                                            </span>
                                          )}
                                        </td>
                                        <td className="px-3 py-2 text-gray-800 dark:text-gray-200 max-w-[220px]">
                                          <span className="block truncate" title={n.dealName}>{n.dealName}</span>
                                        </td>
                                        <td className="px-3 py-2 text-gray-500 dark:text-gray-400 max-w-[180px] truncate" title={n.produto}>
                                          {n.produto || '—'}
                                        </td>
                                        <td className="px-3 py-2 text-right whitespace-nowrap">
                                          {n.seats !== null ? (
                                            <span className={cn('font-semibold', n.valido ? 'text-gray-900 dark:text-gray-100' : 'text-red-500')}>
                                              {formatNumber(n.seats)}
                                            </span>
                                          ) : (
                                            <span className="text-amber-500 italic">pendente</span>
                                          )}
                                        </td>
                                        <td className="px-3 py-2 text-right text-gray-600 dark:text-gray-300 whitespace-nowrap">
                                          {formatCurrency(n.amount)}
                                        </td>
                                        <td className="px-3 py-2 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                          {new Date(n.closeDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabela Completa — todos os vendedores */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Ranking Completo</CardTitle>
            <span className="text-xs text-gray-400">{rankingCompleto.length} vendedores</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-white/[0.06]">
                  <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 w-12">#</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400">Vendedor</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 min-w-[200px]">Progresso (seats)</th>
                  <th className="text-right py-3 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400">Contratos</th>
                  <th className="text-right py-3 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400">Seats</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400">Status</th>
                </tr>
              </thead>
              <tbody>
                {rankingCompleto.map((v) => {
                  const dentroCompeticao = v.seatsCapped >= v.metaMinima;
                  const progressPercent = Math.min((v.seatsCapped / v.metaMinima) * 100, 100);
                  const isZero = v.dealsCount === 0 && v.seatsCapped === 0;

                  return (
                    <tr
                      key={v.ownerId}
                      className={cn(
                        'border-b border-gray-100 dark:border-white/[0.03] hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors',
                        isZero && 'opacity-50',
                      )}
                    >
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                          v.ranking === 1 && !isZero
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                            : v.ranking === 2 && !isZero
                            ? 'bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400'
                            : v.ranking === 3 && !isZero
                            ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400'
                            : 'bg-gray-50 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
                        }`}>
                          {v.ranking}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <OwnerAvatar name={v.ownerNome} size={28} className="flex-shrink-0" />
                          <span className={cn('font-medium', isZero ? 'text-gray-400 dark:text-gray-500' : 'text-gray-800 dark:text-gray-200')}>{v.ownerNome}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-white/[0.06] overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                dentroCompeticao ? 'bg-emerald-500' : progressPercent > 0 ? 'bg-amber-500' : ''
                              }`}
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                          <span className="text-[11px] text-gray-400 w-10 text-right">{formatNumber(progressPercent, 0)}%</span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <span className={cn('font-semibold', isZero ? 'text-gray-300 dark:text-gray-600' : 'text-gray-900 dark:text-gray-100')}>
                          {v.dealsCount}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <span className={isZero ? 'text-gray-300 dark:text-gray-600' : 'text-gray-600 dark:text-gray-300'}>
                          {formatNumber(v.seatsCapped)}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        {dentroCompeticao ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            <CheckCircle className="h-3.5 w-3.5" />
                            Competindo
                          </span>
                        ) : isZero ? (
                          <span className="text-[11px] italic text-gray-400 dark:text-gray-500">
                            {['Aguardando primeiro fechamento...', 'Hora de abrir as salas!', 'A primeira venda ta chegando!', 'Bora fechar contrato!', 'Em busca do primeiro deal!', 'Pronto pra competir!', 'So falta comecar!'][v.ranking % 7]}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-400 dark:text-gray-500">
                            <XCircle className="h-3.5 w-3.5" />
                            {v.status}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Regras da Competição — retrátil */}
      <Card>
        <button
          onClick={() => setRegrasAbertas(p => !p)}
          className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors rounded-xl"
        >
          <span className="text-sm font-semibold flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <Info className="h-4 w-4 text-gray-400" />
            Regras da Competicao
          </span>
          <svg className={cn('h-4 w-4 text-gray-400 transition-transform duration-200', regrasAbertas && 'rotate-180')} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
        </button>
        {regrasAbertas && (
          <CardContent className="pt-0 pb-5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="text-xs uppercase tracking-wide font-semibold text-gray-500 dark:text-gray-400">Criterios de Participacao</h4>
                <ul className="space-y-2">
                  {[
                    { icon: ShieldCheck, text: 'Minimo de 60 seats acumulados para competir', color: 'text-emerald-500' },
                    { icon: Briefcase, text: 'Apenas contratos de Sala Privativa', color: 'text-amber-500' },
                    { icon: Ban, text: 'Contratos com mais de 20 seats sao descartados', color: 'text-red-500' },
                    { icon: CalendarDays, text: 'Periodo: 17/03/2026 a 18/05/2026', color: 'text-primary-500' },
                  ].map((rule, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-gray-400">
                      <rule.icon className={cn('h-4 w-4 mt-0.5 flex-shrink-0', rule.color)} />
                      {rule.text}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs uppercase tracking-wide font-semibold text-gray-500 dark:text-gray-400">Criterio de Classificacao</h4>
                <ul className="space-y-2">
                  {[
                    { icon: Trophy, text: 'Ranking ordenado por quantidade de contratos fechados', color: 'text-amber-500' },
                    { icon: Layers, text: 'Desempate por total de seats acumulados', color: 'text-sky-500' },
                    { icon: Award, text: '1o lugar: R$ 1.500,00 / 2o lugar: R$ 750,00', color: 'text-violet-500' },
                  ].map((rule, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-gray-400">
                      <rule.icon className={cn('h-4 w-4 mt-0.5 flex-shrink-0', rule.color)} />
                      {rule.text}
                    </li>
                  ))}
                </ul>

                <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/10">
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    <span className="font-semibold">Exemplo:</span> Se um vendedor fechar um contrato de 30 seats de sala privativa,
                    esse contrato <span className="font-semibold">nao sera contabilizado</span> na competicao (excede o limite de 20 seats por contrato).
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
