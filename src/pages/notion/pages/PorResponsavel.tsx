import { Users, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { formatNumber } from '@/lib/utils';
import type { ResumoExecutor } from '../hooks/useNotionFilters';

interface PorResponsavelProps {
  resumoPorExecutor: ResumoExecutor[];
}

export function PorResponsavel({ resumoPorExecutor }: PorResponsavelProps) {
  if (resumoPorExecutor.length === 0) {
    return (
      <Card>
        <CardContent>
          <div className="flex items-center justify-center h-32 text-gray-400">
            Nenhuma tarefa ativa no periodo
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary-500" />
          Tarefas por Responsavel
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-white/[0.06]">
                <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400">Responsavel</th>
                <th className="text-right py-3 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400">Total</th>
                <th className="text-right py-3 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400">Vencidas</th>
                <th className="text-right py-3 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400">Vence Hoje</th>
                <th className="text-right py-3 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400">No Prazo</th>
                <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 w-48">Distribuicao</th>
              </tr>
            </thead>
            <tbody>
              {resumoPorExecutor.map((exec) => {
                const percentVencidas = exec.total > 0 ? (exec.vencidas / exec.total) * 100 : 0;
                const percentHoje = exec.total > 0 ? (exec.hoje / exec.total) * 100 : 0;
                const percentPrazo = exec.total > 0 ? (exec.noPrazo / exec.total) * 100 : 0;

                return (
                  <tr
                    key={exec.nome}
                    className="border-b border-gray-100 dark:border-white/[0.03] hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-3 px-3">
                      <span className="font-medium text-gray-800 dark:text-gray-200">{exec.nome}</span>
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-gray-900 dark:text-gray-100">
                      {exec.total}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {exec.vencidas > 0 ? (
                        <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 font-semibold">
                          <AlertTriangle className="h-3 w-3" />
                          {exec.vencidas}
                        </span>
                      ) : (
                        <span className="text-gray-300 dark:text-gray-600">0</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {exec.hoje > 0 ? (
                        <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                          <Clock className="h-3 w-3" />
                          {exec.hoje}
                        </span>
                      ) : (
                        <span className="text-gray-300 dark:text-gray-600">0</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {exec.noPrazo > 0 ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle className="h-3 w-3" />
                          {exec.noPrazo}
                        </span>
                      ) : (
                        <span className="text-gray-300 dark:text-gray-600">0</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex h-2 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                        {percentVencidas > 0 && (
                          <div className="bg-red-500" style={{ width: `${percentVencidas}%` }} />
                        )}
                        {percentHoje > 0 && (
                          <div className="bg-amber-500" style={{ width: `${percentHoje}%` }} />
                        )}
                        {percentPrazo > 0 && (
                          <div className="bg-emerald-500" style={{ width: `${percentPrazo}%` }} />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
