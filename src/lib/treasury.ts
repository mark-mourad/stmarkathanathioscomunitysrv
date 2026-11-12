/**
 * Treasury & Fund Manager (الخزنة / صندوق الخدمة) shared helpers.
 *
 * Financial records are stored per `saint_family` so the same values used by
 * RLS (`get_user_saint_family()`) and the beneficiary modules keep working.
 * Chart rows keep using the `dashboard_metrics.sector` labels.
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

export const TREASURY_TRANSACTION_TYPES: Array<{
  value: TreasuryTransactionType;
  label: string;
}> = [
  { value: "income", label: "إيراد" },
  { value: "expense", label: "مصروف" },
];

export function getTreasuryTypeLabel(type: string): string {
  return type === "income" ? "إيراد" : type === "expense" ? "مصروف" : type;
}

/**
 * Suggested categories. The database stores the Arabic value directly so
 * exports and filters remain readable without a lookup table.
 */
export const TREASURY_CATEGORIES: Array<{
  value: string;
  label: string;
  type: TreasuryTransactionType;
}> = [
  { value: "تبرعات", label: "تبرعات", type: "income" },
  { value: "عشور", label: "عشور", type: "income" },
  { value: "صندوق الخدمة", label: "صندوق الخدمة", type: "income" },
  { value: "إيراد آخر", label: "إيراد آخر", type: "income" },
  { value: "مساعدات شهرية", label: "مساعدات شهرية", type: "expense" },
  { value: "مساعدات دراسية", label: "مساعدات دراسية", type: "expense" },
  { value: "مساعدات علاجية", label: "مساعدات علاجية", type: "expense" },
  { value: "مصاريف خدمة", label: "مصاريف خدمة", type: "expense" },
  { value: "مصروف آخر", label: "مصروف آخر", type: "expense" },
];

export function getTreasuryCategoriesForType(type: TreasuryTransactionType | "all"): string[] {
  if (type === "all") return Array.from(new Set(TREASURY_CATEGORIES.map((c) => c.value)));
  return TREASURY_CATEGORIES.filter((c) => c.type === type).map((c) => c.value);
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

export type TreasuryTransaction = {
  id: string;
  saint_family: string;
  transaction_date: string;
  transaction_type: TreasuryTransactionType;
  category: string;
  amount: number;
  description: string | null;
  reference: string | null;
  created_by: string | null;
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
  lines.push(csvRow(["التصنيف", filters.categoryLabel]));
  lines.push(csvRow(["الأسرة", filters.familyLabel]));
  lines.push(csvRow([]));

  lines.push(csvRow(["ملخص الفترة"]));
  lines.push(csvRow(["إجمالي الإيرادات", summary.income]));
  lines.push(csvRow(["إجمالي المصروفات", summary.expense]));
  lines.push(csvRow(["الرصيد", summary.balance]));
  lines.push(csvRow(["عدد الحركات", summary.count]));
  lines.push(csvRow([]));

  lines.push(csvRow(["ملخص الأسر"]));
  lines.push(csvRow(["الأسرة", "الإيرادات", "المصروفات", "الرصيد", "عدد الحركات"]));
  for (const family of TREASURY_FAMILIES) {
    const totals = familySummary[family.value] ?? emptyTreasurySummary();
    lines.push(
      csvRow([
        family.label,
        totals.income,
        totals.expense,
        totals.balance,
        totals.count,
      ]),
    );
  }
  lines.push(csvRow([]));

  lines.push(csvRow(["تفاصيل الحركات"]));
  lines.push(
    csvRow([
      "م",
      "التاريخ",
      "الأسرة",
      "النوع",
      "التصنيف",
      "المبلغ",
      "الوصف",
      "المرجع",
      "تاريخ التسجيل",
    ]),
  );

  transactions.forEach((row, index) => {
    lines.push(
      csvRow([
        index + 1,
        row.transaction_date,
        getTreasuryFamilyLabel(row.saint_family),
        getTreasuryTypeLabel(row.transaction_type),
        row.category,
        row.amount,
        row.description ?? "",
        row.reference ?? "",
        row.created_at ? new Date(row.created_at).toLocaleDateString("ar-EG") : "",
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
