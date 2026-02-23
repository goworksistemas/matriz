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
  categoryLabelMaxChars?: number;
  categoryAxisWidth?: number;
  onItemClick?: (name: string) => void;
  activeItem?: string;
}

export function BarChartComponent({
  data,
  dataKey = 'value',
  layout = 'vertical',
  height = 300,
  colorByIndex = true,
  categoryLabelMaxChars = 15,
  categoryAxisWidth = 120,
  onItemClick,
  activeItem,
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

  const isClickable = !!onItemClick;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout={layout}
        margin={margin}
        style={isClickable ? { cursor: 'pointer' } : undefined}
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
              width={categoryAxisWidth}
              tickFormatter={(value: string) => 
                value.length > categoryLabelMaxChars ? value.slice(0, categoryLabelMaxChars) + '...' : value
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
        <Bar
          dataKey={dataKey}
          radius={[4, 4, 4, 4]}
          onClick={onItemClick ? (entry) => onItemClick(entry.name) : undefined}
        >
          <LabelList
            dataKey={dataKey}
            position={layout === 'vertical' ? 'right' : 'top'}
            offset={8}
            fill="var(--chart-axis)"
            fontSize={11}
          />
          {colorByIndex &&
            data.map((item, index) => {
              const baseColor = CHART_COLORS[index % CHART_COLORS.length];
              const dimmed = activeItem && item.name !== activeItem;
              return (
                <Cell
                  key={`cell-${index}`}
                  fill={baseColor}
                  fillOpacity={dimmed ? 0.25 : 1}
                />
              );
            })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
