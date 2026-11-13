import { BookOpen, DollarSign, Stethoscope, TrendingUp } from "lucide-react";
import {
  HiddenFamiliesPieCard,
  SectorBarChart,
  type FinancialMetricChartRow,
} from "@/components/financial-metrics-charts";
import { sumFinancialMetrics } from "@/lib/treasury";

/**
 * The four financial metric cards shown on the main dashboard.
 * Used by both `index.tsx` and `/treasury` so the figures can never drift.
 */
export function FinancialSummaryCards({
  metrics,
  hidden,
  onTotalDoubleClick,
  className,
}: {
  metrics: FinancialMetricChartRow[];
  hidden?: FinancialMetricChartRow | null;
  onTotalDoubleClick?: () => void;
  className?: string;
}) {
  const totals = sumFinancialMetrics(metrics, hidden);

  const cards = [
    {
      label: "إجمالي الخارج",
      value: totals.total,
      icon: DollarSign,
      color: "bg-primary/10 text-primary",
    },
    {
      label: "الشهريات",
      value: totals.monthly,
      icon: TrendingUp,
      color: "bg-sky/15 text-sky",
    },
    {
      label: "مساعدات دراسية",
      value: totals.study,
      icon: BookOpen,
      color: "bg-teal/15 text-teal",
    },
    {
      label: "مساعدات علاجية",
      value: totals.therapeutic,
      icon: Stethoscope,
      color: "bg-chart-3/15 text-foreground",
    },
  ];

  return (
    <section className={`grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 ${className ?? ""}`}>
      {cards.map((card) => (
        <article
          key={card.label}
          className="paper-card !p-3 sm:!p-6 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-4"
          onDoubleClick={card.label === "إجمالي الخارج" ? onTotalDoubleClick : undefined}
        >
          <div className={`rounded-xl p-2 sm:p-3 shrink-0 ${card.color}`}>
            <card.icon size={22} className="size-[18px] sm:size-[22px]" />
          </div>
          <div className="min-w-0 w-full sm:w-auto">
            <p className="text-[11px] sm:text-xs text-muted-foreground truncate">{card.label}</p>
            <p className="display text-lg sm:text-xl text-ink tabular-nums truncate">
              {card.value.toLocaleString("ar-EG")}
            </p>
          </div>
        </article>
      ))}
    </section>
  );
}

/**
 * Sector bar chart + hidden families pie, shared by the main dashboard and the
 * treasury module. `hidden` is rendered as the dedicated hidden-families card
 * when `showHidden` is true (church-wide roles only).
 */
export function FinancialCharts({
  metrics,
  hidden,
  editable = false,
  onEditMetric,
  onEditHidden,
  showHidden = true,
  className,
}: {
  metrics: FinancialMetricChartRow[];
  hidden?: FinancialMetricChartRow | null;
  editable?: boolean;
  onEditMetric?: () => void;
  onEditHidden?: () => void;
  showHidden?: boolean;
  className?: string;
}) {
  return (
    <section
      className={`grid grid-cols-1 gap-4 sm:gap-6 ${
        showHidden ? "lg:grid-cols-2" : ""
      } ${className ?? ""}`}
    >
      <SectorBarChart metrics={metrics} editable={editable} onEdit={onEditMetric} />
      {showHidden && (
        <HiddenFamiliesPieCard metric={hidden ?? null} editable={editable} onEdit={onEditHidden} />
      )}
    </section>
  );
}
