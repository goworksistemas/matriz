import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Target, Save, Loader2, CheckCircle, DollarSign, Layers, Briefcase, Copy, TrendingUp, ScrollText, Clock, User, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { upsertSalesGoal } from '../services/api';
import { supabase } from '@/lib/supabase';
import { cn, formatCurrency, formatNumber } from '@/lib/utils';
import { useAuditLog } from '@/hooks/useAuditLog';
import type { MetaVendas, FiltrosMetaGlobal } from '@/types';

const MESES_COMPLETO = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const MESES_CURTO = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

interface AnnualGoals {
  revenue: string;
  seats: string;
  deals: string;
}

interface MonthlyRow {
  month: number;
  revenue: string;
  seats: string;
  deals: string;
}

interface PainelMetasProps {
  metas: MetaVendas[];
  filtrosGlobal: FiltrosMetaGlobal;
  onMetaSaved: () => void;
}

const parseVal = (v: string) => parseFloat(v.replace(',', '.')) || 0;

const inputBase = 'h-8 w-full rounded-md border bg-white dark:bg-gray-900 px-2.5 text-xs text-right text-gray-900 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none focus:ring-1 transition-colors';
const inputNormal = `${inputBase} border-gray-200 dark:border-white/[0.08] focus:ring-primary-500/40 focus:border-primary-500/40`;
const inputAnnual = `${inputBase} border-gray-300 dark:border-white/[0.12] focus:ring-primary-500/50 focus:border-primary-500/50 font-medium`;

interface MetaLogEntry {
  id: string;
  userName: string;
  action: string;
  details: Record<string, unknown> | null;
  createdAt: string;
}

function useMetaLogs(ano: number, refreshKey: number) {
  const [logs, setLogs] = useState<MetaLogEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    (async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('id, user_id, action, details, created_at')
        .eq('resource_type', 'sales_goals')
        .order('created_at', { ascending: false })
        .limit(50);

      if (cancelled || error) {
        setLoading(false);
        return;
      }

      const userIds = [...new Set((data || []).map((l: { user_id: string }) => l.user_id).filter(Boolean))];
      let profilesMap = new Map<string, string>();

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds);

        if (profiles) {
          profilesMap = new Map(profiles.map((p: { id: string; full_name: string | null; email: string }) => [
            p.id,
            p.full_name || p.email || 'Desconhecido',
          ]));
        }
      }

      if (!cancelled) {
        setLogs((data || []).map((l: { id: string; user_id: string; action: string; details: Record<string, unknown> | null; created_at: string }) => ({
          id: l.id,
          userName: profilesMap.get(l.user_id) || 'Desconhecido',
          action: l.action,
          details: l.details,
          createdAt: l.created_at,
        })));
        setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [ano, refreshKey]);

  return { logs, loading };
}

export function PainelMetas({ metas, filtrosGlobal, onMetaSaved }: PainelMetasProps) {
  const { log } = useAuditLog();
  const [annual, setAnnual] = useState<AnnualGoals>({ revenue: '', seats: '', deals: '' });
  const [rows, setRows] = useState<MonthlyRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const savedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [logRefreshKey, setLogRefreshKey] = useState(0);
  const { logs: metaLogs, loading: logsLoading } = useMetaLogs(filtrosGlobal.ano, logRefreshKey);

  const initialValuesRef = useRef<{ annual: AnnualGoals; rows: MonthlyRow[] } | null>(null);

  useEffect(() => {
    log('view_report', 'report', 'ranking-metas', { ano: filtrosGlobal.ano });
  }, [log, filtrosGlobal.ano]);

  useEffect(() => {
    const metasDoAno = metas.filter(mt => mt.year === filtrosGlobal.ano);

    const annualRevenue = Math.max(0, ...metasDoAno.map(m => m.annualGoal));
    const annualSeats = Math.max(0, ...metasDoAno.map(m => m.annualGoalSeats));
    const annualDeals = Math.max(0, ...metasDoAno.map(m => m.annualGoalDeals));

    setAnnual({
      revenue: annualRevenue > 0 ? String(annualRevenue) : '',
      seats: annualSeats > 0 ? String(annualSeats) : '',
      deals: annualDeals > 0 ? String(annualDeals) : '',
    });

    const newRows: MonthlyRow[] = [];
    for (let m = 1; m <= 12; m++) {
      const meta = metasDoAno.find(mt => mt.month === m);
      newRows.push({
        month: m,
        revenue: meta?.monthlyGoal ? String(meta.monthlyGoal) : '',
        seats: meta?.monthlyGoalSeats ? String(meta.monthlyGoalSeats) : '',
        deals: meta?.monthlyGoalDeals ? String(meta.monthlyGoalDeals) : '',
      });
    }
    setRows(newRows);

    const annualSnap = {
      revenue: annualRevenue > 0 ? String(annualRevenue) : '',
      seats: annualSeats > 0 ? String(annualSeats) : '',
      deals: annualDeals > 0 ? String(annualDeals) : '',
    };
    initialValuesRef.current = { annual: annualSnap, rows: newRows.map(r => ({ ...r })) };
  }, [metas, filtrosGlobal.ano]);

  const updateRow = useCallback((month: number, field: keyof Omit<MonthlyRow, 'month'>, value: string) => {
    setRows(prev => prev.map(r => r.month === month ? { ...r, [field]: value } : r));
  }, []);

  const fillAllMonths = useCallback((field: keyof Omit<MonthlyRow, 'month'>) => {
    const annualVal = parseVal(field === 'revenue' ? annual.revenue : field === 'seats' ? annual.seats : annual.deals);
    if (annualVal <= 0) return;

    const perMonth = field === 'deals'
      ? String(Math.ceil(annualVal / 12))
      : String(Math.round((annualVal / 12) * 100) / 100);

    setRows(prev => prev.map(r => ({ ...r, [field]: perMonth })));

    log('fill_monthly_goals', 'sales_goals', String(filtrosGlobal.ano), {
      ano: filtrosGlobal.ano,
      tipo: field,
      metaAnual: annualVal,
      valorMensal: parseVal(perMonth),
    });
  }, [annual, log, filtrosGlobal.ano]);

  const handleSaveAll = useCallback(async () => {
    setSaving(true);
    setSaved(false);
    try {
      const annualRevenue = parseVal(annual.revenue);
      const annualSeats = parseVal(annual.seats);
      const annualDeals = parseVal(annual.deals);

      const promises = rows.map(row =>
        upsertSalesGoal(filtrosGlobal.ano, row.month, {
          monthlyGoal: parseVal(row.revenue),
          annualGoal: annualRevenue,
          monthlyGoalSeats: parseVal(row.seats),
          annualGoalSeats: annualSeats,
          monthlyGoalDeals: parseVal(row.deals),
          annualGoalDeals: annualDeals,
        })
      );
      await Promise.all(promises);
      setSaved(true);
      onMetaSaved();

      const prev = initialValuesRef.current;
      const changes: Record<string, unknown> = { ano: filtrosGlobal.ano };

      if (prev) {
        if (prev.annual.revenue !== annual.revenue) changes.metaAnualReceita = { de: parseVal(prev.annual.revenue), para: annualRevenue };
        if (prev.annual.seats !== annual.seats) changes.metaAnualSeats = { de: parseVal(prev.annual.seats), para: annualSeats };
        if (prev.annual.deals !== annual.deals) changes.metaAnualDeals = { de: parseVal(prev.annual.deals), para: annualDeals };

        const mesesAlterados: Record<string, unknown>[] = [];
        rows.forEach((row, i) => {
          const old = prev.rows[i];
          if (!old) return;
          const mesNome = MESES_CURTO[row.month - 1];
          const diff: Record<string, { de: number; para: number }> = {};
          if (old.revenue !== row.revenue) diff.receita = { de: parseVal(old.revenue), para: parseVal(row.revenue) };
          if (old.seats !== row.seats) diff.seats = { de: parseVal(old.seats), para: parseVal(row.seats) };
          if (old.deals !== row.deals) diff.deals = { de: parseVal(old.deals), para: parseVal(row.deals) };
          if (Object.keys(diff).length > 0) {
            mesesAlterados.push({ mes: mesNome, ...diff });
          }
        });
        if (mesesAlterados.length > 0) changes.mesesAlterados = mesesAlterados;
      }

      changes.resumo = {
        metaAnual: { receita: annualRevenue, seats: annualSeats, deals: annualDeals },
        somaMensal: { receita: totals.revenue, seats: totals.seats, deals: totals.deals },
      };

      log('update_metas', 'sales_goals', String(filtrosGlobal.ano), changes);
      setLogRefreshKey(k => k + 1);

      if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);
      savedTimeoutRef.current = setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Erro ao salvar metas:', err);
    } finally {
      setSaving(false);
    }
  }, [rows, annual, filtrosGlobal.ano, onMetaSaved, log]);

  const mesAtual = new Date().getMonth() + 1;
  const isAnoAtual = filtrosGlobal.ano === new Date().getFullYear();

  const totals = useMemo(() => ({
    revenue: rows.reduce((acc, r) => acc + parseVal(r.revenue), 0),
    seats: rows.reduce((acc, r) => acc + parseVal(r.seats), 0),
    deals: rows.reduce((acc, r) => acc + parseVal(r.deals), 0),
  }), [rows]);

  const annualParsed = useMemo(() => ({
    revenue: parseVal(annual.revenue),
    seats: parseVal(annual.seats),
    deals: parseVal(annual.deals),
  }), [annual]);

  const progressRevenue = annualParsed.revenue > 0 ? Math.min((totals.revenue / annualParsed.revenue) * 100, 150) : 0;
  const progressSeats = annualParsed.seats > 0 ? Math.min((totals.seats / annualParsed.seats) * 100, 150) : 0;
  const progressDeals = annualParsed.deals > 0 ? Math.min((totals.deals / annualParsed.deals) * 100, 150) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-primary-200/60 dark:border-primary-500/20 bg-gradient-to-r from-primary-50 to-white dark:from-primary-500/10 dark:to-gray-900/40 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary-500" />
            <div>
              <p className="text-xs uppercase tracking-wide font-semibold text-primary-700 dark:text-primary-300">Painel de Metas</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Configure as metas de {filtrosGlobal.ano}
              </p>
            </div>
          </div>
          <Button variant="primary" size="sm" onClick={handleSaveAll} disabled={saving}>
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : saved ? (
              <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
            ) : (
              <Save className="h-3.5 w-3.5 mr-1.5" />
            )}
            <span className="text-xs">{saved ? 'Salvo!' : 'Salvar Tudo'}</span>
          </Button>
        </div>
      </div>

      {/* Metas Anuais */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <AnnualCard
          icon={<DollarSign className="h-4 w-4" />}
          label="Meta Anual de Receita"
          color="emerald"
          value={annual.revenue}
          onChange={(v) => setAnnual(prev => ({ ...prev, revenue: v }))}
          placeholder="0,00"
          inputMode="decimal"
          total={totals.revenue}
          progress={progressRevenue}
          formatFn={(v) => formatCurrency(v)}
          onFill={() => fillAllMonths('revenue')}
        />
        <AnnualCard
          icon={<Layers className="h-4 w-4" />}
          label="Meta Anual de Seats"
          color="sky"
          value={annual.seats}
          onChange={(v) => setAnnual(prev => ({ ...prev, seats: v }))}
          placeholder="0"
          inputMode="decimal"
          total={totals.seats}
          progress={progressSeats}
          formatFn={(v) => formatNumber(v)}
          onFill={() => fillAllMonths('seats')}
        />
        <AnnualCard
          icon={<Briefcase className="h-4 w-4" />}
          label="Meta Anual de Deals"
          color="violet"
          value={annual.deals}
          onChange={(v) => setAnnual(prev => ({ ...prev, deals: v }))}
          placeholder="0"
          inputMode="numeric"
          total={totals.deals}
          progress={progressDeals}
          formatFn={(v) => formatNumber(v)}
          onFill={() => fillAllMonths('deals')}
        />
      </div>

      {/* Tabela Mensal */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary-500" />
            Metas Mensais — {filtrosGlobal.ano}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200 dark:border-white/[0.06]">
                  <th className="text-left py-3 px-4 font-semibold text-gray-500 dark:text-gray-400 w-28">Mês</th>
                  <th className="text-center py-3 px-2 font-semibold text-emerald-600 dark:text-emerald-400">
                    <span className="flex items-center justify-center gap-1"><DollarSign className="h-3 w-3" /> Receita (R$)</span>
                  </th>
                  <th className="text-center py-3 px-2 font-semibold text-sky-600 dark:text-sky-400">
                    <span className="flex items-center justify-center gap-1"><Layers className="h-3 w-3" /> Seats</span>
                  </th>
                  <th className="text-center py-3 px-2 font-semibold text-violet-600 dark:text-violet-400">
                    <span className="flex items-center justify-center gap-1"><Briefcase className="h-3 w-3" /> Deals</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const isCurrent = isAnoAtual && row.month === mesAtual;
                  return (
                    <tr
                      key={row.month}
                      className={cn(
                        'border-b border-gray-100 dark:border-white/[0.03] transition-colors',
                        isCurrent
                          ? 'bg-primary-50/40 dark:bg-primary-500/5'
                          : 'hover:bg-gray-50 dark:hover:bg-white/[0.02]',
                      )}
                    >
                      <td className="py-2.5 px-4">
                        <span className={cn('font-medium', isCurrent ? 'text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300')}>
                          {MESES_COMPLETO[row.month - 1]}
                        </span>
                        {isCurrent && <span className="ml-1.5 text-[10px] text-primary-500 font-medium">(atual)</span>}
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={row.revenue}
                          onChange={(e) => updateRow(row.month, 'revenue', e.target.value)}
                          placeholder="0,00"
                          className={inputNormal}
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={row.seats}
                          onChange={(e) => updateRow(row.month, 'seats', e.target.value)}
                          placeholder="0"
                          className={inputNormal}
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={row.deals}
                          onChange={(e) => updateRow(row.month, 'deals', e.target.value)}
                          placeholder="0"
                          className={inputNormal}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Totais */}
              <tfoot>
                <tr className="border-t-2 border-gray-200 dark:border-white/[0.08] bg-gray-50/50 dark:bg-white/[0.02]">
                  <td className="py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 text-xs">
                    Soma Mensal
                  </td>
                  <td className="py-3 px-2 text-center">
                    <SumCell value={totals.revenue} target={annualParsed.revenue} formatFn={formatCurrency} color="emerald" />
                  </td>
                  <td className="py-3 px-2 text-center">
                    <SumCell value={totals.seats} target={annualParsed.seats} formatFn={formatNumber} color="sky" />
                  </td>
                  <td className="py-3 px-2 text-center">
                    <SumCell value={totals.deals} target={annualParsed.deals} formatFn={formatNumber} color="violet" />
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Histórico de Alterações */}
      <MetaLogsPanel logs={metaLogs} loading={logsLoading} />
    </div>
  );
}

// ============================================
// COMPONENTES AUXILIARES
// ============================================

const COLOR_MAP = {
  emerald: {
    border: 'border-emerald-200 dark:border-emerald-500/20',
    iconBg: 'bg-emerald-100 dark:bg-emerald-500/20',
    iconText: 'text-emerald-600 dark:text-emerald-400',
    barBg: 'bg-emerald-100 dark:bg-emerald-500/10',
    barFill: 'bg-emerald-500',
    text: 'text-emerald-600 dark:text-emerald-400',
    labelBg: 'bg-emerald-50 dark:bg-emerald-500/10',
  },
  sky: {
    border: 'border-sky-200 dark:border-sky-500/20',
    iconBg: 'bg-sky-100 dark:bg-sky-500/20',
    iconText: 'text-sky-600 dark:text-sky-400',
    barBg: 'bg-sky-100 dark:bg-sky-500/10',
    barFill: 'bg-sky-500',
    text: 'text-sky-600 dark:text-sky-400',
    labelBg: 'bg-sky-50 dark:bg-sky-500/10',
  },
  violet: {
    border: 'border-violet-200 dark:border-violet-500/20',
    iconBg: 'bg-violet-100 dark:bg-violet-500/20',
    iconText: 'text-violet-600 dark:text-violet-400',
    barBg: 'bg-violet-100 dark:bg-violet-500/10',
    barFill: 'bg-violet-500',
    text: 'text-violet-600 dark:text-violet-400',
    labelBg: 'bg-violet-50 dark:bg-violet-500/10',
  },
} as const;

type ColorKey = keyof typeof COLOR_MAP;

interface AnnualCardProps {
  icon: React.ReactNode;
  label: string;
  color: ColorKey;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  inputMode: 'decimal' | 'numeric';
  total: number;
  progress: number;
  formatFn: (v: number) => string;
  onFill: () => void;
}

function AnnualCard({ icon, label, color, value, onChange, placeholder, inputMode, total, progress, formatFn, onFill }: AnnualCardProps) {
  const c = COLOR_MAP[color];
  const annualVal = parseVal(value);
  const hasAnnual = annualVal > 0;
  const overBudget = hasAnnual && total > annualVal;

  return (
    <div className={cn('rounded-xl border p-4 space-y-3', c.border, 'bg-white dark:bg-gray-900/50')}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn('p-1.5 rounded-lg', c.iconBg, c.iconText)}>{icon}</div>
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{label}</span>
        </div>
        <button
          onClick={onFill}
          title="Dividir meta anual por 12 meses"
          className={cn('p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors', !hasAnnual && 'opacity-30 pointer-events-none')}
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
      </div>

      <input
        type="text"
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputAnnual}
      />

      {hasAnnual && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-gray-500">Soma mensal: <span className={cn('font-medium', overBudget ? 'text-amber-500' : c.text)}>{formatFn(total)}</span></span>
            <span className={cn('font-medium', overBudget ? 'text-amber-500' : c.text)}>
              {formatNumber(Math.min(progress, 100))}%
            </span>
          </div>
          <div className={cn('h-1.5 rounded-full overflow-hidden', c.barBg)}>
            <div
              className={cn('h-full rounded-full transition-all duration-500', overBudget ? 'bg-amber-500' : c.barFill)}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

interface SumCellProps {
  value: number;
  target: number;
  formatFn: (v: number) => string;
  color: ColorKey;
}

function SumCell({ value, target, formatFn, color }: SumCellProps) {
  const c = COLOR_MAP[color];
  const hasTarget = target > 0;
  const pct = hasTarget ? (value / target) * 100 : 0;
  const over = hasTarget && value > target;

  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className={cn('text-xs font-bold', over ? 'text-amber-500' : 'text-gray-800 dark:text-gray-200')}>
        {formatFn(value)}
      </span>
      {hasTarget && (
        <span className={cn('text-[10px] font-medium', over ? 'text-amber-500' : pct >= 90 ? c.text : 'text-gray-400')}>
          {formatNumber(pct, 0)}% da meta anual
        </span>
      )}
    </div>
  );
}

// ============================================
// PAINEL DE LOGS
// ============================================

const ACTION_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  update_metas: { label: 'Metas atualizadas', color: 'text-primary-500', icon: '💾' },
  fill_monthly_goals: { label: 'Preenchimento automático', color: 'text-violet-500', icon: '📋' },
  view_report: { label: 'Visualização', color: 'text-gray-400', icon: '👁' },
};

function MetaLogsPanel({ logs, loading }: { logs: MetaLogEntry[]; loading: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const [showDetails, setShowDetails] = useState<string | null>(null);

  const relevantLogs = useMemo(
    () => logs.filter(l => l.action !== 'view_report'),
    [logs],
  );

  if (loading && relevantLogs.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 flex items-center justify-center gap-2 text-sm text-gray-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando histórico...
        </CardContent>
      </Card>
    );
  }

  if (relevantLogs.length === 0) return null;

  const visibleLogs = expanded ? relevantLogs : relevantLogs.slice(0, 5);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <ScrollText className="h-4 w-4 text-gray-400" />
          Histórico de Alterações
          <span className="text-[10px] font-normal text-gray-400 ml-1">
            ({relevantLogs.length} registro{relevantLogs.length !== 1 ? 's' : ''})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-0">
          {visibleLogs.map((entry) => {
            const config = ACTION_LABELS[entry.action] || { label: entry.action, color: 'text-gray-500', icon: '📝' };
            const isOpen = showDetails === entry.id;
            const details = entry.details;
            const ano = details?.ano;
            const rawMeses = details?.mesesAlterados as unknown;
            const mesesAlterados = Array.isArray(rawMeses) ? rawMeses : undefined;
            const resumo = details?.resumo as { metaAnual?: Record<string, number>; somaMensal?: Record<string, number> } | undefined;
            const tipo = details?.tipo as string | undefined;
            const totalMesesAlterados = mesesAlterados?.length || 0;
            const isNewFormat = totalMesesAlterados > 0 && typeof mesesAlterados![0] === 'object';
            const isOldFormat = totalMesesAlterados > 0 && typeof mesesAlterados![0] === 'string';

            return (
              <div key={entry.id} className="border-b border-gray-100 dark:border-white/[0.03] last:border-0">
                <button
                  onClick={() => setShowDetails(isOpen ? null : entry.id)}
                  className="w-full flex items-center gap-3 py-2.5 px-1 text-left hover:bg-gray-50 dark:hover:bg-white/[0.02] rounded-md transition-colors"
                >
                  <span className="text-sm flex-shrink-0">{config.icon}</span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn('text-xs font-medium', config.color)}>{config.label}</span>
                      {ano && <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-white/[0.06] px-1.5 py-0.5 rounded">{String(ano)}</span>}
                      {tipo && <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-white/[0.06] px-1.5 py-0.5 rounded capitalize">{tipo}</span>}
                      {totalMesesAlterados > 0 && (
                        <span className="text-[10px] text-gray-400">
                          {totalMesesAlterados === 12
                            ? 'todos os meses'
                            : isOldFormat
                            ? (mesesAlterados as string[]).join(', ')
                            : `${totalMesesAlterados} ${totalMesesAlterados === 1 ? 'mês' : 'meses'}`
                          }
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-400">
                      <span className="flex items-center gap-1">
                        <User className="h-2.5 w-2.5" />
                        {entry.userName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {format(new Date(entry.createdAt), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                  </div>

                  {details && Object.keys(details).length > 1 && (
                    <ChevronDown className={cn('h-3.5 w-3.5 text-gray-400 flex-shrink-0 transition-transform', isOpen && 'rotate-180')} />
                  )}
                </button>

                {isOpen && details && (
                  <div className="ml-8 mb-2.5 p-2.5 rounded-lg bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.04] text-[10px] space-y-2">
                    {/* Alterações nas metas anuais */}
                    {(details.metaAnualReceita || details.metaAnualSeats || details.metaAnualDeals) && (
                      <div className="space-y-1">
                        <span className="font-semibold text-gray-500">Metas anuais alteradas:</span>
                        {details.metaAnualReceita && (
                          <LogDiffRow label="Receita" diff={details.metaAnualReceita as { de: number; para: number }} format="currency" />
                        )}
                        {details.metaAnualSeats && (
                          <LogDiffRow label="Seats" diff={details.metaAnualSeats as { de: number; para: number }} format="number" />
                        )}
                        {details.metaAnualDeals && (
                          <LogDiffRow label="Deals" diff={details.metaAnualDeals as { de: number; para: number }} format="number" />
                        )}
                      </div>
                    )}

                    {/* Alterações nas metas mensais */}
                    {totalMesesAlterados > 0 && (
                      <div className="space-y-1">
                        {(details.metaAnualReceita || details.metaAnualSeats || details.metaAnualDeals) && (
                          <div className="border-t border-gray-100 dark:border-white/[0.04] pt-1.5" />
                        )}
                        <span className="font-semibold text-gray-500">Metas mensais alteradas:</span>

                        {/* Formato antigo: string[] — só mostra nomes */}
                        {isOldFormat && (
                          <p className="text-gray-400 mt-0.5">{(mesesAlterados as string[]).join(', ')}</p>
                        )}

                        {/* Formato novo: objeto[] — mostra diff detalhado */}
                        {isNewFormat && (
                          <div className="space-y-0.5 mt-1">
                            {(mesesAlterados as Record<string, unknown>[]).map((m, idx) => {
                              const mesNome = (m.mes as string) || `Mês ${idx + 1}`;
                              const receitaDiff = m.receita as { de: number; para: number } | undefined;
                              const seatsDiff = m.seats as { de: number; para: number } | undefined;
                              const dealsDiff = m.deals as { de: number; para: number } | undefined;
                              return (
                                <div key={idx} className="flex flex-wrap items-center gap-x-3 gap-y-0.5 py-0.5 border-b border-gray-100/50 dark:border-white/[0.02] last:border-0">
                                  <span className="font-semibold text-gray-600 dark:text-gray-300 min-w-[32px]">{mesNome}</span>
                                  {receitaDiff && (
                                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                      <DollarSign className="h-2.5 w-2.5 flex-shrink-0" />
                                      <span className="line-through text-red-400/70">{formatCurrency(receitaDiff.de)}</span>
                                      <span className="text-gray-400">→</span>
                                      <span className="font-medium">{formatCurrency(receitaDiff.para)}</span>
                                    </span>
                                  )}
                                  {seatsDiff && (
                                    <span className="flex items-center gap-1 text-sky-600 dark:text-sky-400">
                                      <Layers className="h-2.5 w-2.5 flex-shrink-0" />
                                      <span className="line-through text-red-400/70">{formatNumber(seatsDiff.de)}</span>
                                      <span className="text-gray-400">→</span>
                                      <span className="font-medium">{formatNumber(seatsDiff.para)}</span>
                                    </span>
                                  )}
                                  {dealsDiff && (
                                    <span className="flex items-center gap-1 text-violet-600 dark:text-violet-400">
                                      <Briefcase className="h-2.5 w-2.5 flex-shrink-0" />
                                      <span className="line-through text-red-400/70">{formatNumber(dealsDiff.de)}</span>
                                      <span className="text-gray-400">→</span>
                                      <span className="font-medium">{formatNumber(dealsDiff.para)}</span>
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Resumo */}
                    {resumo?.metaAnual && (
                      <div className="border-t border-gray-100 dark:border-white/[0.04] pt-1.5 space-y-0.5">
                        <span className="font-semibold text-gray-500">Resumo final:</span>
                        <div className="grid grid-cols-3 gap-2 mt-1">
                          <div>
                            <span className="text-gray-400">Receita anual</span>
                            <p className="font-medium text-emerald-600 dark:text-emerald-400">{formatCurrency(resumo.metaAnual.receita || 0)}</p>
                          </div>
                          <div>
                            <span className="text-gray-400">Seats anual</span>
                            <p className="font-medium text-sky-600 dark:text-sky-400">{formatNumber(resumo.metaAnual.seats || 0)}</p>
                          </div>
                          <div>
                            <span className="text-gray-400">Deals anual</span>
                            <p className="font-medium text-violet-600 dark:text-violet-400">{formatNumber(resumo.metaAnual.deals || 0)}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Fallback para log de fill */}
                    {details.metaAnual && !resumo && (
                      <div className="text-gray-500">
                        Meta anual: {formatNumber(details.metaAnual as number)} → Mensal: {formatNumber(details.valorMensal as number)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {relevantLogs.length > 5 && (
          <button
            onClick={() => setExpanded(p => !p)}
            className="w-full mt-2 flex items-center justify-center gap-1 py-2 text-[11px] font-medium text-primary-500 hover:text-primary-600 transition-colors"
          >
            {expanded ? (
              <>
                <ChevronUp className="h-3 w-3" />
                Mostrar menos
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3" />
                Ver todos ({relevantLogs.length})
              </>
            )}
          </button>
        )}
      </CardContent>
    </Card>
  );
}

function LogDiffRow({ label, diff, format: fmt }: { label: string; diff: { de: number; para: number }; format: 'currency' | 'number' }) {
  const formatFn = fmt === 'currency' ? formatCurrency : formatNumber;
  return (
    <div className="flex items-center gap-1.5 text-gray-500">
      <span className="font-medium">{label}:</span>
      <span className="text-red-400 line-through">{formatFn(diff.de)}</span>
      <span className="text-gray-400">→</span>
      <span className="text-emerald-500 font-medium">{formatFn(diff.para)}</span>
    </div>
  );
}
