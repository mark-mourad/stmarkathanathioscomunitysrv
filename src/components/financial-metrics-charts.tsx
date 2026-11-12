import { Pencil } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type FinancialMetricChartRow = {
  id: string;
  sector: string;
  monthly: number;
  study: number;
  therapeutic: number;
};

export function SectorBarChart({
  metrics,
  editable,
  onEdit,
}: {
  metrics: FinancialMetricChartRow[];
  editable: boolean;
  onEdit?: () => void;
}) {
  return (
    <article className="paper-card !p-4 sm:!p-6 min-w-0">
      <div className="flex items-center justify-between gap-2 mb-4">
        <h2 className="display text-sm text-muted-foreground min-w-0">مصاريف القطاعات</h2>
        {editable && (
          <button
            type="button"
            onClick={onEdit}
            className="shrink-0 flex items-center justify-center gap-1 min-h-11 min-w-11 px-2 rounded-full text-xs text-muted-foreground hover:text-primary hover:bg-primary/10 transition"
          >
            <Pencil size={12} /> تعديل
          </button>
        )}
      </div>
      {metrics.length === 0 ? (
        <p className="text-center text-muted-foreground py-10">لا توجد قيم مالية مسجلة</p>
      ) : (
        <div className="h-56 sm:h-72 relative z-0">
          <ResponsiveContainer>
            <BarChart
              data={metrics}
              layout="vertical"
              margin={{ top: 20, right: 20, left: 10, bottom: 20 }}
            >
              <CartesianGrid horizontal={false} stroke="var(--color-border)" />
              <XAxis type="number" stroke="var(--color-muted-foreground)" fontSize={11} />
              <YAxis
                type="category"
                dataKey="sector"
                stroke="var(--color-muted-foreground)"
                fontSize={12}
                width={10}
                tick={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--color-paper-2)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 12,
                }}
              />
              <Legend content={renderChartLegend} />
              <Bar
                dataKey="monthly"
                stackId="a"
                name="شهريات"
                fill="var(--color-sky)"
                radius={[0, 0, 0, 0]}
              />
              <Bar dataKey="study" stackId="a" name="مساعدات دراسية" fill="var(--color-teal)" />
              <Bar
                dataKey="therapeutic"
                stackId="a"
                name="مساعدات علاجية"
                fill="var(--color-chart-3)"
                radius={[0, 8, 8, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </article>
  );
}

export function HiddenFamiliesPieCard({
  metric,
  editable,
  onEdit,
}: {
  metric: FinancialMetricChartRow | null;
  editable: boolean;
  onEdit?: () => void;
}) {
  const pieData = metric
    ? [
        { name: "شهريات", value: Number(metric.monthly) },
        { name: "مساعدات دراسية", value: Number(metric.study) },
        { name: "مساعدات علاجية", value: Number(metric.therapeutic) },
      ]
    : [];
  const pieColors = ["var(--color-sky)", "var(--color-teal)", "var(--color-chart-3)"];

  return (
    <article className="paper-card !p-4 sm:!p-6 min-w-0">
      <div className="flex items-center justify-between gap-2 mb-4">
        <h2 className="display text-sm text-muted-foreground min-w-0">الأسر المستترة</h2>
        {editable && (
          <button
            type="button"
            onClick={onEdit}
            className="shrink-0 flex items-center justify-center gap-1 min-h-11 min-w-11 px-2 rounded-full text-xs text-muted-foreground hover:text-primary hover:bg-primary/10 transition"
          >
            <Pencil size={12} /> تعديل
          </button>
        )}
      </div>
      <div className="h-[220px] sm:h-64">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={pieData} dataKey="value" nameKey="name" outerRadius="68%" label>
              {pieData.map((_, index) => (
                <Cell key={index} fill={pieColors[index]} />
              ))}
            </Pie>
            <Legend content={renderChartLegend} />
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}

type ChartLegendPayloadItem = { value?: string; color?: string };

function ChartLegend({ payload }: { payload?: ChartLegendPayloadItem[] }) {
  if (!payload?.length) return null;
  return (
    <ul className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5">
      {payload.map((item, index) => (
        <li
          key={`${item.value}-${index}`}
          className="flex items-center gap-1.5 text-xs text-muted-foreground"
        >
          <span
            className="size-2.5 shrink-0 rounded-[2px]"
            style={{ backgroundColor: item.color }}
          />
          <span className="min-w-0">{item.value}</span>
        </li>
      ))}
    </ul>
  );
}

function renderChartLegend(props: { payload?: ChartLegendPayloadItem[] }) {
  return <ChartLegend payload={props?.payload} />;
}
