import { useState, useCallback, useEffect, useRef } from 'react';
import { Target, Save, Loader2, CheckCircle, DollarSign, Layers, Briefcase } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { upsertSalesGoal } from '../services/api';
import { cn } from '@/lib/utils';
import type { MetaVendas, FiltrosMetaGlobal } from '@/types';

const MESES_COMPLETO = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

interface MetaRow {
  month: number;
  monthlyRevenue: string;
  annualRevenue: string;
  monthlySeats: string;
  annualSeats: string;
  monthlyDeals: string;
  annualDeals: string;
}

interface PainelMetasProps {
  metas: MetaVendas[];
  filtrosGlobal: FiltrosMetaGlobal;
  anosDisponiveis: number[];
  onMetaSaved: () => void;
}

export function PainelMetas({
  metas,
  filtrosGlobal,
  anosDisponiveis,
  onMetaSaved,
}: PainelMetasProps) {
  const [rows, setRows] = useState<MetaRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const savedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const newRows: MetaRow[] = [];
    for (let m = 1; m <= 12; m++) {
      const meta = metas.find(mt => mt.year === filtrosGlobal.ano && mt.month === m);
      newRows.push({
        month: m,
        monthlyRevenue: meta?.monthlyGoal ? String(meta.monthlyGoal) : '',
        annualRevenue: meta?.annualGoal ? String(meta.annualGoal) : '',
        monthlySeats: meta?.monthlyGoalSeats ? String(meta.monthlyGoalSeats) : '',
        annualSeats: meta?.annualGoalSeats ? String(meta.annualGoalSeats) : '',
        monthlyDeals: meta?.monthlyGoalDeals ? String(meta.monthlyGoalDeals) : '',
        annualDeals: meta?.annualGoalDeals ? String(meta.annualGoalDeals) : '',
      });
    }
    setRows(newRows);
  }, [metas, filtrosGlobal.ano]);

  const updateRow = useCallback((month: number, field: keyof Omit<MetaRow, 'month'>, value: string) => {
    setRows(prev => prev.map(r => r.month === month ? { ...r, [field]: value } : r));
  }, []);

  const handleSaveAll = useCallback(async () => {
    const parseVal = (v: string) => parseFloat(v.replace(',', '.')) || 0;

    setSaving(true);
    setSaved(false);
    try {
      const promises = rows.map(row =>
        upsertSalesGoal(filtrosGlobal.ano, row.month, {
          monthlyGoal: parseVal(row.monthlyRevenue),
          annualGoal: parseVal(row.annualRevenue),
          monthlyGoalSeats: parseVal(row.monthlySeats),
          annualGoalSeats: parseVal(row.annualSeats),
          monthlyGoalDeals: parseVal(row.monthlyDeals),
          annualGoalDeals: parseVal(row.annualDeals),
        })
      );
      await Promise.all(promises);
      setSaved(true);
      onMetaSaved();
      if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);
      savedTimeoutRef.current = setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Erro ao salvar metas:', err);
    } finally {
      setSaving(false);
    }
  }, [rows, filtrosGlobal.ano, onMetaSaved]);

  const mesAtual = new Date().getMonth() + 1;
  const isAnoAtual = filtrosGlobal.ano === new Date().getFullYear();

  const inputClass = 'h-8 w-full rounded border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-gray-900 px-2 text-xs text-gray-900 dark:text-gray-100 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-primary-500/40 text-right';

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-primary-200/60 dark:border-primary-500/20 bg-gradient-to-r from-primary-50 to-white dark:from-primary-500/10 dark:to-gray-900/40 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary-500" />
            <div>
              <p className="text-xs uppercase tracking-wide text-primary-700 dark:text-primary-300">Painel de Metas</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Edite as metas mensais e anuais para {filtrosGlobal.ano}
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
            <span className="text-xs">{saved ? 'Salvo!' : 'Salvar Todas'}</span>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Metas por Mes — {filtrosGlobal.ano}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200 dark:border-white/[0.06]">
                  <th className="text-left py-3 px-3 font-semibold text-gray-500 dark:text-gray-400 w-28">Mes</th>
                  <th colSpan={2} className="text-center py-2 px-1 font-semibold text-emerald-600 dark:text-emerald-400 border-b border-emerald-200 dark:border-emerald-500/20">
                    <span className="flex items-center justify-center gap-1"><DollarSign className="h-3 w-3" /> Receita (R$)</span>
                  </th>
                  <th colSpan={2} className="text-center py-2 px-1 font-semibold text-sky-600 dark:text-sky-400 border-b border-sky-200 dark:border-sky-500/20">
                    <span className="flex items-center justify-center gap-1"><Layers className="h-3 w-3" /> Seats</span>
                  </th>
                  <th colSpan={2} className="text-center py-2 px-1 font-semibold text-violet-600 dark:text-violet-400 border-b border-violet-200 dark:border-violet-500/20">
                    <span className="flex items-center justify-center gap-1"><Briefcase className="h-3 w-3" /> Deals</span>
                  </th>
                </tr>
                <tr className="border-b border-gray-200 dark:border-white/[0.06]">
                  <th />
                  <th className="text-center py-2 px-1 text-[10px] text-gray-400 font-medium w-28">Mensal</th>
                  <th className="text-center py-2 px-1 text-[10px] text-gray-400 font-medium w-28">Anual</th>
                  <th className="text-center py-2 px-1 text-[10px] text-gray-400 font-medium w-24">Mensal</th>
                  <th className="text-center py-2 px-1 text-[10px] text-gray-400 font-medium w-24">Anual</th>
                  <th className="text-center py-2 px-1 text-[10px] text-gray-400 font-medium w-20">Mensal</th>
                  <th className="text-center py-2 px-1 text-[10px] text-gray-400 font-medium w-20">Anual</th>
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
                      <td className="py-2 px-3">
                        <span className={cn('font-medium', isCurrent ? 'text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300')}>
                          {MESES_COMPLETO[row.month - 1]}
                        </span>
                        {isCurrent && <span className="ml-1 text-[10px] text-primary-500">(atual)</span>}
                      </td>
                      <td className="py-2 px-1">
                        <input type="text" inputMode="decimal" value={row.monthlyRevenue} onChange={(e) => updateRow(row.month, 'monthlyRevenue', e.target.value)} placeholder="0,00" className={inputClass} />
                      </td>
                      <td className="py-2 px-1">
                        <input type="text" inputMode="decimal" value={row.annualRevenue} onChange={(e) => updateRow(row.month, 'annualRevenue', e.target.value)} placeholder="0,00" className={inputClass} />
                      </td>
                      <td className="py-2 px-1">
                        <input type="text" inputMode="decimal" value={row.monthlySeats} onChange={(e) => updateRow(row.month, 'monthlySeats', e.target.value)} placeholder="0" className={inputClass} />
                      </td>
                      <td className="py-2 px-1">
                        <input type="text" inputMode="decimal" value={row.annualSeats} onChange={(e) => updateRow(row.month, 'annualSeats', e.target.value)} placeholder="0" className={inputClass} />
                      </td>
                      <td className="py-2 px-1">
                        <input type="text" inputMode="numeric" value={row.monthlyDeals} onChange={(e) => updateRow(row.month, 'monthlyDeals', e.target.value)} placeholder="0" className={inputClass} />
                      </td>
                      <td className="py-2 px-1">
                        <input type="text" inputMode="numeric" value={row.annualDeals} onChange={(e) => updateRow(row.month, 'annualDeals', e.target.value)} placeholder="0" className={inputClass} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
