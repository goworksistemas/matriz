import { useMemo, useState, useEffect, useRef, type ImgHTMLAttributes } from 'react';
import {
  Trophy,
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
  ShieldCheck,
  Ban,
  TrendingUp,
  Laptop,
  Watch,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { cn, formatNumber } from '@/lib/utils';
import type { VendedorCompeticao, Proprietario } from '@/types';

const MACBOOK_INICIO = new Date('2026-03-17T00:00:00');
const MACBOOK_FIM = new Date('2026-12-15T23:59:59');
const MACBOOK_META_MINIMA = 250;

interface DashboardCompeticaoMacbookProps {
  rankingMacbook: VendedorCompeticao[];
  proprietarios: Proprietario[];
}

function getAvatarUrl(name: string, size = 128, bg = '0ea5e9'): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name.trim() || '?')}&size=${size}&background=${bg}&color=fff&bold=true&format=svg`;
}

const PODIUM_AVATAR_COLORS: Record<number, string> = {
  1: '6366f1',
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

  const hasStarted = now >= MACBOOK_INICIO;
  const hasEnded = now > MACBOOK_FIM;

  if (!hasStarted) {
    const diff = MACBOOK_INICIO.getTime() - now.getTime();
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((diff % (1000 * 60)) / 1000),
      status: 'upcoming', label: 'Inicia em',
    };
  }

  if (hasEnded) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, status: 'ended', label: 'Campanha encerrada' };
  }

  const diff = MACBOOK_FIM.getTime() - now.getTime();
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
    status: 'active', label: 'Tempo restante',
  };
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

function Podium({ ranking }: { ranking: VendedorCompeticao[] }) {
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
    { gradient: 'from-violet-100 via-violet-50 to-white dark:from-violet-500/15 dark:via-violet-500/5 dark:to-transparent', border: 'border-violet-300 dark:border-violet-500/40', ring: 'ring-violet-400', shadow: 'shadow-violet-200/50 dark:shadow-violet-500/10', height: 'h-36', avatarSize: 72, rank: 1, badge: 'bg-gradient-to-r from-violet-500 to-purple-400', textColor: 'text-violet-600 dark:text-violet-400' },
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
            {config.rank === 1 && <Crown className="absolute -top-5 left-1/2 -translate-x-1/2 h-7 w-7 text-violet-500 drop-shadow-lg z-10" />}
            <OwnerAvatar
              name={v.ownerNome}
              size={config.avatarSize}
              rank={config.rank}
              className={cn(
                'ring-[3px] ring-offset-[3px] ring-offset-white dark:ring-offset-gray-900',
                config.ring,
                config.rank === 1 && 'shadow-xl shadow-violet-200/60 dark:shadow-violet-500/20',
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
              {formatNumber(v.seatsCapped)}
            </span>
            <p className="text-[11px] text-gray-400 font-medium -mt-0.5">seats</p>
          </div>
          <span className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            {v.dealsCount} contratos
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

const RANKING_BAR_COLORS = [
  '#8b5cf6', '#9ca3af', '#f97316',
  '#6366f1', '#0ea5e9', '#10b981', '#ec4899', '#f59e0b',
  '#14b8a6', '#f43f5e', '#a855f7', '#06b6d4',
];

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

export function DashboardCompeticaoMacbook({ rankingMacbook, proprietarios }: DashboardCompeticaoMacbookProps) {
  const countdown = useCountdown();

  const rankingCompleto = useMemo<VendedorCompeticao[]>(() => {
    const existentes = new Set(rankingMacbook.map(v => v.ownerId));

    const vendedoresFixosZero: VendedorCompeticao[] = proprietarios
      .filter(p => !existentes.has(p.hubspotId) && isVendedorFixo(p.nome))
      .map(p => ({
        ownerId: p.hubspotId,
        ownerNome: p.nome,
        seatsCapped: 0,
        seatsRaw: 0,
        dealsCount: 0,
        ranking: 0,
        metaMinima: MACBOOK_META_MINIMA,
        status: `Faltam ${MACBOOK_META_MINIMA} seats`,
      }));

    const todos = [...rankingMacbook, ...vendedoresFixosZero]
      .sort((a, b) => b.seatsCapped - a.seatsCapped || b.dealsCount - a.dealsCount);

    todos.forEach((v, i) => { v.ranking = i + 1; });

    return todos;
  }, [rankingMacbook, proprietarios]);

  const kpis = useMemo(() => {
    const totalSeats = rankingMacbook.reduce((acc, v) => acc + v.seatsCapped, 0);
    const totalSeatsRaw = rankingMacbook.reduce((acc, v) => acc + v.seatsRaw, 0);
    const totalDeals = rankingMacbook.reduce((acc, v) => acc + v.dealsCount, 0);
    const vendedoresCompetindo = rankingMacbook.filter(v => v.seatsCapped >= v.metaMinima).length;
    const totalVendedores = rankingCompleto.length;
    const seatsPerDeal = totalDeals > 0 ? totalSeats / totalDeals : 0;
    const melhorVendedor = rankingMacbook.length > 0 ? rankingMacbook[0] : null;

    return { totalSeats, totalSeatsRaw, totalDeals, vendedoresCompetindo, totalVendedores, seatsPerDeal, melhorVendedor };
  }, [rankingMacbook, rankingCompleto]);

  const dadosGraficoRanking = useMemo(() => {
    return rankingMacbook.slice(0, 15).map((v) => ({
      name: v.ownerNome.length > 18 ? v.ownerNome.slice(0, 18) + '...' : v.ownerNome,
      seats: v.seatsCapped,
      meta: v.metaMinima,
    }));
  }, [rankingMacbook]);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="rounded-xl border border-violet-200/60 dark:border-violet-500/20 bg-gradient-to-r from-violet-50 via-white to-violet-50 dark:from-violet-500/10 dark:via-gray-900/40 dark:to-violet-500/10 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Laptop className="h-5 w-5 text-violet-500" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Competicao MacBook — Vendas</h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 max-w-xl">
              Essa campanha tem foco mais macro e vai acompanhar a performance ao longo de um periodo maior.
              Premiado sera quem vender o maior numero de seats.
            </p>
            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 pt-1">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5 text-violet-500" />
                17/03/2026 a 15/12/2026
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

          <div className="flex gap-3">
            <div className="rounded-xl border border-violet-200 dark:border-violet-500/30 bg-gradient-to-b from-violet-50 to-white dark:from-violet-500/10 dark:to-gray-900/50 p-3 text-center min-w-[110px]">
              <Laptop className="h-5 w-5 text-violet-500 mx-auto mb-1" />
              <p className="text-[10px] uppercase tracking-wide text-violet-600 dark:text-violet-400 font-semibold">1o Lugar</p>
              <p className="text-sm font-bold text-violet-700 dark:text-violet-300">MacBook</p>
            </div>
            <div className="rounded-xl border border-gray-200 dark:border-gray-500/30 bg-gradient-to-b from-gray-50 to-white dark:from-gray-500/10 dark:to-gray-900/50 p-3 text-center min-w-[110px]">
              <Watch className="h-5 w-5 text-gray-400 mx-auto mb-1" />
              <p className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400 font-semibold">2o Lugar</p>
              <p className="text-sm font-bold text-gray-600 dark:text-gray-300">Apple Watch</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-gray-900/50 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Layers className="h-4 w-4 text-violet-500" />
            <span className="text-xs font-medium text-gray-500">Seats (c/ cap)</span>
          </div>
          <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {formatNumber(kpis.totalSeats)}
          </span>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-gray-900/50 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Layers className="h-4 w-4 text-sky-500" />
            <span className="text-xs font-medium text-gray-500">Seats (bruto)</span>
          </div>
          <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {formatNumber(kpis.totalSeatsRaw)}
          </span>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-gray-900/50 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Briefcase className="h-4 w-4 text-amber-500" />
            <span className="text-xs font-medium text-gray-500">Contratos</span>
          </div>
          <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {kpis.totalDeals}
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
          <span className="text-[11px] text-gray-400 ml-1">/ {kpis.totalVendedores}</span>
        </div>
      </div>

      {/* Líder */}
      {kpis.melhorVendedor && (
        <div className="rounded-xl border border-violet-200/60 dark:border-violet-500/20 bg-gradient-to-r from-violet-50 to-white dark:from-violet-500/10 dark:to-gray-900/40 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <OwnerAvatar name={kpis.melhorVendedor.ownerNome} size={44} rank={1} className="ring-2 ring-violet-400 ring-offset-2 ring-offset-white dark:ring-offset-gray-900" />
                <Crown className="absolute -top-2 -right-2 h-4 w-4 text-violet-500 drop-shadow" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-violet-700 dark:text-violet-300">Lider da Competicao</p>
                <p className="text-base font-semibold text-gray-900 dark:text-gray-100">{kpis.melhorVendedor.ownerNome}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-violet-600 dark:text-violet-400">{formatNumber(kpis.melhorVendedor.seatsCapped)} seats</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{kpis.melhorVendedor.dealsCount} contratos | {formatNumber(kpis.melhorVendedor.seatsRaw)} bruto</p>
            </div>
          </div>
        </div>
      )}

      {/* Pódio */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-b from-violet-50/50 via-white to-white dark:from-violet-500/5 dark:via-gray-900/50 dark:to-gray-900/50">
          <CardHeader className="text-center pb-0">
            <CardTitle className="flex items-center justify-center gap-2 text-lg">
              <Trophy className="h-5 w-5 text-violet-500" />
              Podio da Competicao
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Podium ranking={rankingMacbook} />
          </CardContent>
        </div>
      </Card>

      {/* Gráfico */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-violet-500" />
            Ranking por Seats
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dadosGraficoRanking.length === 0 ? (
            <div className="h-[350px] flex items-center justify-center text-sm text-gray-400">
              Nenhum dado no periodo da campanha
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(350, dadosGraficoRanking.length * 40)}>
              <BarChart data={dadosGraficoRanking} layout="vertical" margin={{ top: 5, right: 50, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                <XAxis type="number" stroke="var(--chart-axis)" fontSize={11} />
                <YAxis type="category" dataKey="name" stroke="var(--chart-axis)" fontSize={11} width={140} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--chart-tooltip-bg)',
                    border: '1px solid var(--chart-tooltip-border)',
                    borderRadius: '8px',
                    color: 'var(--chart-tooltip-text)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                  formatter={(value: number, name: string) => [
                    formatNumber(value),
                    name === 'seats' ? 'Seats (c/ cap)' : 'Meta Minima',
                  ]}
                />
                <Bar dataKey="seats" radius={[0, 4, 4, 0]}>
                  <LabelList dataKey="seats" position="right" offset={8} fill="var(--chart-axis)" fontSize={11} formatter={(v: number) => formatNumber(v)} />
                  {dadosGraficoRanking.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={RANKING_BAR_COLORS[index % RANKING_BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Tabela Completa */}
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
                  <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 min-w-[200px]">Progresso</th>
                  <th className="text-right py-3 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400">Seats (c/ cap)</th>
                  <th className="text-right py-3 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400">Seats (bruto)</th>
                  <th className="text-right py-3 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400">Contratos</th>
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
                            ? 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400'
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
                                dentroCompeticao ? 'bg-emerald-500' : progressPercent > 0 ? 'bg-violet-500' : ''
                              }`}
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                          <span className="text-[11px] text-gray-400 w-10 text-right">{formatNumber(progressPercent, 0)}%</span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <span className={cn('font-semibold', isZero ? 'text-gray-300 dark:text-gray-600' : 'text-gray-900 dark:text-gray-100')}>
                          {formatNumber(v.seatsCapped)}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <span className={isZero ? 'text-gray-300 dark:text-gray-600' : 'text-gray-400 dark:text-gray-500'}>
                          {formatNumber(v.seatsRaw)}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <span className={isZero ? 'text-gray-300 dark:text-gray-600' : 'text-gray-600 dark:text-gray-300'}>
                          {v.dealsCount}
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
                            {['De olho no MacBook...', 'O primeiro seat ta vindo!', 'Aquecendo os motores!', 'Bora acumular seats!', 'Apple Watch na mira!', 'Corrida so comecou!', 'Foco nos 250 seats!'][v.ranking % 7]}
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

      {/* Regras */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Info className="h-4 w-4 text-gray-400" />
            Regras da Competicao
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="text-xs uppercase tracking-wide font-semibold text-gray-500 dark:text-gray-400">Criterios de Participacao</h4>
              <ul className="space-y-2">
                {[
                  { icon: ShieldCheck, text: 'Minimo de 250 seats acumulados para competir', color: 'text-emerald-500' },
                  { icon: Briefcase, text: 'Produtos: BTG, Homeflex, Hotdesk, Open Space, Sala Privativa', color: 'text-violet-500' },
                  { icon: Ban, text: 'Cada contrato tem cap de 20 seats na contagem', color: 'text-red-500' },
                  { icon: CalendarDays, text: 'Periodo: 17/03/2026 a 15/12/2026', color: 'text-primary-500' },
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
                  { icon: Trophy, text: 'Ranking ordenado por total de seats (com cap)', color: 'text-violet-500' },
                  { icon: TrendingUp, text: 'Desempate por quantidade de contratos', color: 'text-sky-500' },
                  { icon: Laptop, text: '1o lugar: MacBook', color: 'text-violet-500' },
                  { icon: Watch, text: '2o lugar: Apple Watch', color: 'text-gray-500' },
                ].map((rule, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-gray-400">
                    <rule.icon className={cn('h-4 w-4 mt-0.5 flex-shrink-0', rule.color)} />
                    {rule.text}
                  </li>
                ))}
              </ul>

              <div className="mt-4 p-3 rounded-lg bg-violet-50 dark:bg-violet-500/5 border border-violet-100 dark:border-violet-500/10">
                <p className="text-xs text-violet-700 dark:text-violet-400">
                  <span className="font-semibold">Exemplo:</span> Se vender um contrato de 70 seats, contara <span className="font-semibold">20 seats</span> na competicao.
                  Se vender um de 50 seats, contara <span className="font-semibold">20 seats</span>. O cap e por contrato (line item).
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
