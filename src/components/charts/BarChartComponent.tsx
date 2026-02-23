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
import { CHART_COLORS } from '@/lib/utils';
import type { DadosGrafico } from '@/types';

interface BarChartComponentProps {
  data: DadosGrafico[];
  title?: string;
  dataKey?: string;
  layout?: 'horizontal' | 'vertical';
  showLegend?: boolean;
  height?: number;
  colorByIndex?: boolean;
}

export function BarChartComponent({
  data,
  dataKey = 'value',
  layout = 'vertical',
  height = 300,
  colorByIndex = true,
}: BarChartComponentProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-gray-400">
        Sem dados para exibir
      </div>
    );
  }

  const margin = layout === 'vertical'
    ? { top: 10, right: 40, left: 20, bottom: 5 }
    : { top: 24, right: 16, left: 12, bottom: 5 };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout={layout}
        margin={margin}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
        {layout === 'vertical' ? (
          <>
            <XAxis type="number" stroke="var(--chart-axis)" fontSize={12} />
            <YAxis
              type="category"
              dataKey="name"
              stroke="var(--chart-axis)"
              fontSize={11}
              width={120}
              tickFormatter={(value: string) => 
                value.length > 15 ? value.slice(0, 15) + '...' : value
              }
            />
          </>
        ) : (
          <>
            <XAxis
              type="category"
              dataKey="name"
              stroke="var(--chart-axis)"
              fontSize={11}
              tickFormatter={(value: string) => 
                value.length > 10 ? value.slice(0, 10) + '...' : value
              }
            />
            <YAxis type="number" stroke="var(--chart-axis)" fontSize={12} />
          </>
        )}
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
          cursor={{ fill: 'var(--chart-cursor)' }}
        />
        <Bar dataKey={dataKey} radius={[4, 4, 4, 4]}>
          <LabelList
            dataKey={dataKey}
            position={layout === 'vertical' ? 'right' : 'top'}
            offset={8}
            fill="var(--chart-axis)"
            fontSize={11}
          />
          {colorByIndex &&
            data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={CHART_COLORS[index % CHART_COLORS.length]}
              />
            ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
