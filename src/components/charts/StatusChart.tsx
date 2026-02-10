import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { DadosGrafico } from '@/types';

interface StatusChartProps {
  comercial: DadosGrafico[];
  financeiro: DadosGrafico[];
  juridico: DadosGrafico[];
  height?: number;
}

const STATUS_COLORS: Record<string, string> = {
  Aprovado: '#10b981',
  Pendente: '#f59e0b',
  Reprovado: '#ef4444',
};

export function StatusChart({
  comercial,
  financeiro,
  juridico,
  height = 250,
}: StatusChartProps) {
  const combinedData = [
    { name: 'Comercial', ...Object.fromEntries(comercial.map(d => [d.name, d.value])) },
    { name: 'Financeiro', ...Object.fromEntries(financeiro.map(d => [d.name, d.value])) },
    { name: 'Jurídico', ...Object.fromEntries(juridico.map(d => [d.name, d.value])) },
  ];

  const allStatus = [...new Set([
    ...comercial.map(d => d.name),
    ...financeiro.map(d => d.name),
    ...juridico.map(d => d.name),
  ])];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={combinedData}
        layout="vertical"
        margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
        <XAxis type="number" stroke="var(--chart-axis)" fontSize={12} />
        <YAxis
          type="category"
          dataKey="name"
          stroke="var(--chart-axis)"
          fontSize={12}
          width={80}
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
          itemStyle={{ color: 'var(--chart-tooltip-text)' }}
        />
        {allStatus.map((status) => (
          <Bar key={status} dataKey={status} stackId="a" radius={[0, 0, 0, 0]}>
            {combinedData.map((_, index) => (
              <Cell
                key={`cell-${status}-${index}`}
                fill={STATUS_COLORS[status] || '#6b7280'}
              />
            ))}
          </Bar>
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
