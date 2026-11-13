/**
 * Treasury & Fund Manager (الخزنة / صندوق الخدمة) shared helpers.
 *
 * Financial records are stored per `saint_family` so the same values used by
 * RLS (`get_user_saint_family()`) and the beneficiary modules keep working.
 * Chart rows keep using the `dashboard_metrics.sector` labels.
 *
 * Accounting model:
 * - Income is general treasury income (`saint_family = null`) and increases the
 *   church service pool.
 * - Expenses are targeted at one family + one support category, are deducted
 *   from the general pool, and increase that family's category total.
 */

export type TreasuryTransactionType = "income" | "expense";

export const HIDDEN_FAMILIES_SECTOR = "الأسر المستترة";
export const HIDDEN_FAMILY_VALUE = "أسر مستترة";

export type TreasuryFamilyOption = {
  value: string;
  label: string;
  sector: string;
};

/** The four saint families + the hidden families, in the requested order. */
export const TREASURY_FAMILIES: TreasuryFamilyOption[] = [
  { value: "مرقس", label: "أسرة القديس مرقس", sector: "القديس مرقس" },
  { value: "يوحنا", label: "أسرة القديس يوحنا", sector: "القديس يوحنا" },
  { value: "لوقا", label: "أسرة القديس لوقا", sector: "القديس لوقا" },
  { value: "متى", label: "أسرة القديس متى", sector: "القديس متى" },
  {
    value: HIDDEN_FAMILY_VALUE,
    label: "الأسر المستترة",
    sector: HIDDEN_FAMILIES_SECTOR,
  },
];

export const TREASURY_FAMILY_VALUES = TREASURY_FAMILIES.map((f) => f.value);

export function getTreasuryFamilyLabel(value: string | null | undefined): string {
  if (!value) return "كل الأسر";
  return TREASURY_FAMILIES.find((f) => f.value === value)?.label ?? value;
}

export function getTreasurySectorForFamily(value: string | null | undefined): string | null {
  if (!value) return null;
  return TREASURY_FAMILIES.find((f) => f.value === value)?.sector ?? null;
}

export function getTreasuryFamilyForSector(sector: string | null | undefined): string | null {
  if (!sector) return null;
  return TREASURY_FAMILIES.find((f) => f.sector === sector)?.value ?? null;
}

/** Family/ledger label for a transaction row (general income has no family). */
export function getTreasuryTransactionFamilyLabel(
  value: string | null | undefined,
  type: TreasuryTransactionType | string,
): string {
  if (!value) return type === "income" ? "الخزنة العامة" : "غير محددة";
  return getTreasuryFamilyLabel(value);
}

export const TREASURY_TRANSACTION_TYPES: Array<{
  value: TreasuryTransactionType;
  label: string;
}> = [
  { value: "income", label: "إيراد عام للخزنة" },
  { value: "expense", label: "مصروف مخصص لأسرة" },
];

export function getTreasuryTypeLabel(type: string): string {
  return type === "income" ? "إيراد" : type === "expense" ? "مصروف" : type;
}

/**
 * Targeted expense categories. These map 1:1 to the financial metric columns
 * used by the main dashboard charts (monthly / therapeutic / study).
 */
export type TreasuryExpenseCategory = "شهريات" | "مساعدات علاجية" | "مساعدات دراسية";
export type TreasuryMetricKey = "monthly" | "study" | "therapeutic";

export const TREASURY_EXPENSE_CATEGORY_VALUES = [
  "شهريات",
  "مساعدات علاجية",
  "مساعدات دراسية",
] as const;

export const TREASURY_EXPENSE_CATEGORIES: Array<{
  value: TreasuryExpenseCategory;
  label: string;
  metricKey: TreasuryMetricKey;
}> = [
  { value: "شهريات", label: "شهريات", metricKey: "monthly" },
  { value: "مساعدات علاجية", label: "مساعدات علاجية", metricKey: "therapeutic" },
  { value: "مساعدات دراسية", label: "مساعدات دراسية", metricKey: "study" },
];

/** General treasury income sources (not tied to any family). */
export const TREASURY_INCOME_CATEGORIES = [
  "تبرعات",
  "تبرعات عامة",
  "عشور",
  "صندوق الخدمة",
  "إيراد آخر",
] as const;

/** The three support categories shown on the dashboard cards. */
export const FINANCIAL_METRIC_CATEGORIES: Array<{
  key: TreasuryMetricKey;
  label: string;
  shortLabel: string;
  className: string;
}> = [
  { key: "monthly", label: "الشهريات", shortLabel: "شهريات", className: "text-sky" },
  { key: "study", label: "مساعدات دراسية", shortLabel: "دراسية", className: "text-teal" },
  {
    key: "therapeutic",
    label: "مساعدات علاجية",
    shortLabel: "علاجية",
    className: "text-chart-3",
  },
];

/** Normalise legacy category labels to the canonical workflow values. */
export function normalizeTreasuryCategory(value: string): string {
  const trimmed = value.trim();
  if (trimmed === "مساعدات شهرية" || trimmed === "الشهريات") return "شهريات";
  return trimmed;
}

export function isTreasuryExpenseCategory(value: string): value is TreasuryExpenseCategory {
  return (TREASURY_EXPENSE_CATEGORY_VALUES as readonly string[]).includes(
    normalizeTreasuryCategory(value),
  );
}

export function getTreasuryExpenseMetricKey(
  category: string | null | undefined,
): TreasuryMetricKey | null {
  if (!category) return null;
  const normalized = normalizeTreasuryCategory(category);
  return TREASURY_EXPENSE_CATEGORIES.find((c) => c.value === normalized)?.metricKey ?? null;
}

export function getTreasuryCategoriesForType(type: TreasuryTransactionType | "all"): string[] {
  if (type === "income") return [...TREASURY_INCOME_CATEGORIES];
  if (type === "expense") return [...TREASURY_EXPENSE_CATEGORY_VALUES];
  return Array.from(
    new Set<string>([...TREASURY_INCOME_CATEGORIES, ...TREASURY_EXPENSE_CATEGORY_VALUES]),
  );
}

export type TreasuryMetric = {
  id: string;
  sector: string;
  monthly: number;
  study: number;
  therapeutic: number;
  display_order?: number | null;
  updated_at?: string | null;
  updated_by?: string | null;
};

export type FinancialMetricLike = {
  id?: string;
  sector: string;
  monthly: number | string;
  study: number | string;
  therapeutic: number | string;
};

export type FinancialTotals = {
  monthly: number;
  study: number;
  therapeutic: number;
  total: number;
};

/** Sum the dashboard metrics, optionally including the hidden families row. */
export function sumFinancialMetrics(
  metrics: readonly FinancialMetricLike[],
  hidden?: FinancialMetricLike | null,
): FinancialTotals {
  const rows = [...metrics];
  if (
    hidden &&
    !rows.some(
      (row) =>
        (row.id !== undefined && row.id === hidden.id) ||
        (row.sector && row.sector === hidden.sector),
    )
  ) {
    rows.push(hidden);
  }

  return rows.reduce<FinancialTotals>(
    (totals, row) => ({
      monthly: totals.monthly + Number(row.monthly ?? 0),
      study: totals.study + Number(row.study ?? 0),
      therapeutic: totals.therapeutic + Number(row.therapeutic ?? 0),
      total:
        totals.total +
        Number(row.monthly ?? 0) +
        Number(row.study ?? 0) +
        Number(row.therapeutic ?? 0),
    }),
    { monthly: 0, study: 0, therapeutic: 0, total: 0 },
  );
}

export type TreasuryTransaction = {
  id: string;
  saint_family: string | null;
  recipient_name: string | null;
  transaction_date: string;
  transaction_type: TreasuryTransactionType;
  category: string;
  amount: number;
  description: string | null;
  reference: string | null;
  created_by: string | null;
  created_by_email: string | null;
  created_at: string;
  updated_at: string;
};

export type TreasurySummary = {
  income: number;
  expense: number;
  balance: number;
  count: number;
};

export type TreasuryFamilySummary = TreasurySummary;

export type TreasuryScope = {
  kind: "all" | "family";
  saintFamily: string | null;
  sector: string | null;
};

export type TreasuryDashboardData = {
  metrics: TreasuryMetric[];
  hiddenFamilies: TreasuryMetric | null;
  transactions: TreasuryTransaction[];
  summary: TreasurySummary;
  familySummary: Record<string, TreasuryFamilySummary>;
  canManage: boolean;
  scope: TreasuryScope;
  hiddenPersisted: boolean;
};

export function emptyTreasurySummary(): TreasurySummary {
  return { income: 0, expense: 0, balance: 0, count: 0 };
}

export function formatTreasuryAmount(value: number | string | null | undefined): string {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount)
    ? amount.toLocaleString("ar-EG", { maximumFractionDigits: 2 })
    : "0";
}

function csvCell(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value);
  if (/[",\r\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function csvRow(values: unknown[]): string {
  return values.map(csvCell).join(",");
}

function formatExportDate(value: Date): string {
  return value.toLocaleString("ar-EG", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export type TreasuryCsvFilters = {
  dateFrom?: string;
  dateTo?: string;
  typeLabel: string;
  categoryLabel: string;
  familyLabel: string;
};

/** Build the UTF-8 (BOM-prefixed) CSV used by the export button. */
export function buildTreasuryCsv({
  transactions,
  summary,
  familySummary,
  filters,
  generatedAt = new Date(),
}: {
  transactions: TreasuryTransaction[];
  summary: TreasurySummary;
  familySummary: Record<string, TreasuryFamilySummary>;
  filters: TreasuryCsvFilters;
  generatedAt?: Date;
}): string {
  const lines: string[] = [];

  lines.push(csvRow(["تقرير الخزنة وصندوق الخدمة"]));
  lines.push(csvRow(["تاريخ التصدير", formatExportDate(generatedAt)]));
  lines.push(csvRow(["من تاريخ", filters.dateFrom || "البداية"]));
  lines.push(csvRow(["إلى تاريخ", filters.dateTo || "النهاية"]));
  lines.push(csvRow(["نوع الحركة", filters.typeLabel]));
  lines.push(csvRow(["البند", filters.categoryLabel]));
  lines.push(csvRow(["الأسرة / الجهة", filters.familyLabel]));
  lines.push(csvRow([]));

  lines.push(csvRow(["ملخص الفترة"]));
  lines.push(csvRow(["إجمالي الإيرادات العامة", summary.income]));
  lines.push(csvRow(["إجمالي المصروفات المخصصة", summary.expense]));
  lines.push(csvRow(["رصيد الخزنة العامة", summary.balance]));
  lines.push(csvRow(["عدد الحركات", summary.count]));
  lines.push(csvRow([]));

  lines.push(csvRow(["ملخص الأسر"]));
  lines.push(csvRow(["الأسرة", "الإيرادات المخصصة", "المصروفات", "الرصيد", "عدد الحركات"]));
  for (const family of TREASURY_FAMILIES) {
    const totals = familySummary[family.value] ?? emptyTreasurySummary();
    lines.push(csvRow([family.label, totals.income, totals.expense, totals.balance, totals.count]));
  }
  lines.push(csvRow([]));

  lines.push(csvRow(["تفاصيل الحركات"]));
  lines.push(
    csvRow([
      "م",
      "التاريخ",
      "النوع",
      "الأسرة / الجهة",
      "البند",
      "المستلم",
      "المبلغ",
      "ملاحظات الحركة",
      "المرجع",
      "أنشأها",
      "تاريخ التسجيل",
    ]),
  );

  transactions.forEach((row, index) => {
    lines.push(
      csvRow([
        index + 1,
        row.transaction_date,
        getTreasuryTypeLabel(row.transaction_type),
        getTreasuryTransactionFamilyLabel(row.saint_family, row.transaction_type),
        row.category,
        row.recipient_name ?? "",
        row.amount,
        row.description ?? "",
        row.reference ?? "",
        row.created_by_email ?? "",
        row.created_at ? new Date(row.created_at).toLocaleString("ar-EG") : "",
      ]),
    );
  });

  // Excel on Windows needs the BOM to detect UTF-8 and render Arabic correctly.
  return "\uFEFF" + lines.join("\r\n");
}

export function downloadTreasuryCsv(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
