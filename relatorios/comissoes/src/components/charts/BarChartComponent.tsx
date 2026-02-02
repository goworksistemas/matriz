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
      <div className="flex items-center justify-center h-[300px] text-gray-500">
        Sem dados para exibir
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout={layout}
        margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        {layout === 'vertical' ? (
          <>
            <XAxis type="number" stroke="#9ca3af" fontSize={12} />
            <YAxis
              type="category"
              dataKey="name"
              stroke="#9ca3af"
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
              stroke="#9ca3af"
              fontSize={11}
              tickFormatter={(value: string) => 
                value.length > 10 ? value.slice(0, 10) + '...' : value
              }
            />
            <YAxis type="number" stroke="#9ca3af" fontSize={12} />
          </>
        )}
        <Tooltip
          contentStyle={{
            backgroundColor: '#1f2937',
            border: '1px solid #374151',
            borderRadius: '8px',
            color: '#f3f4f6',
          }}
          labelStyle={{ color: '#9ca3af' }}
          cursor={{ fill: 'rgba(55, 65, 81, 0.3)' }}
        />
        <Bar
          dataKey={dataKey}
          radius={[4, 4, 4, 4]}
        >
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
