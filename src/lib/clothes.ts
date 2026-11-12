/**
 * Shared domain helpers for the "Holiday & School Clothes" module.
 *
 * Keeping the constants and pure aggregation/CSV helpers here means the family
 * servant screen and the dedicated clothes-manager screen always speak the same
 * language (categories, item types, sizes, labels, CSV format).
 */

export type ClothesCategory = "holiday" | "school";
export type ClothesItemType = "t_shirt" | "pants" | "shoes";

export const CLOTHES_CATEGORIES: ReadonlyArray<{
  value: ClothesCategory;
  label: string;
  shortLabel: string;
}> = [
  { value: "holiday", label: "لبس عيد", shortLabel: "عيد" },
  { value: "school", label: "لبس مدرسة", shortLabel: "مدرسة" },
];

export const CLOTHES_SAINT_FAMILIES: ReadonlyArray<{ value: string; label: string }> = [
  { value: "متى", label: "أسرة القديس متى" },
  { value: "مرقس", label: "أسرة القديس مرقس" },
  { value: "لوقا", label: "أسرة القديس لوقا" },
  { value: "يوحنا", label: "أسرة القديس يوحنا" },
  { value: "أسر مستترة", label: "الأسر المستترة" },
];

export const T_SHIRT_SIZES: readonly string[] = [
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "3XL",
  "24",
  "26",
  "28",
  "30",
  "32",
  "34",
  "36",
  "38",
  "40",
];

export const PANTS_SIZES: readonly string[] = [
  "24",
  "26",
  "28",
  "30",
  "32",
  "34",
  "36",
  "38",
  "40",
  "42",
  "44",
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
];

export const SHOE_SIZES: readonly string[] = Array.from({ length: 27 }, (_, i) => String(i + 20));

export const CLOTHES_ITEM_TYPES: Record<
  ClothesItemType,
  {
    label: string;
    columnLabel: string;
    sizeField: "t_shirt_size" | "pants_size" | "shoe_size";
    sizes: readonly string[];
  }
> = {
  t_shirt: {
    label: "تي شيرت",
    columnLabel: "مقاس التي شيرت",
    sizeField: "t_shirt_size",
    sizes: T_SHIRT_SIZES,
  },
  pants: {
    label: "بنطلون",
    columnLabel: "مقاس البنطلون",
    sizeField: "pants_size",
    sizes: PANTS_SIZES,
  },
  shoes: {
    label: "كوتشي",
    columnLabel: "مقاس الكوتشي",
    sizeField: "shoe_size",
    sizes: SHOE_SIZES,
  },
};

export const CLOTHES_ITEM_TYPE_VALUES = Object.keys(CLOTHES_ITEM_TYPES) as ClothesItemType[];

export type ClothesManagerRow = {
  id: string;
  individual_id: string;
  family_member_id: string | null;
  saint_family: string;
  request_category: ClothesCategory | string;
  school_name: string | null;
  t_shirt_size: string | null;
  pants_size: string | null;
  shoe_size: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  individuals?: {
    id: string;
    full_name: string;
    nickname: string | null;
    saint_family: string | null;
  } | null;
  family_members?: {
    id: string;
    full_name: string;
    relation: string | null;
    school_or_job: string | null;
    insurance_number: string | null;
  } | null;
};

export type ClothesSummary = {
  total: number;
  children: number;
  families: number;
  holiday: number;
  school: number;
};

export type ClothesSizeCount = {
  size: string;
  count: number;
};

export type ClothesDistribution = {
  itemType: ClothesItemType;
  entries: ClothesSizeCount[];
};

export type ClothesCsvFilters = {
  categoryLabel: string;
  familyLabel: string;
  itemTypeLabel: string;
  sizeLabel: string;
  searchLabel?: string;
};

export function getClothesCategoryLabel(category: string): string {
  return CLOTHES_CATEGORIES.find((c) => c.value === category)?.label ?? category;
}

export function getClothesFamilyLabel(family: string): string {
  return CLOTHES_SAINT_FAMILIES.find((f) => f.value === family)?.label ?? family;
}

export function getClothesItemTypeLabel(itemType: ClothesItemType | "all"): string {
  if (itemType === "all") return "كل الأصناف";
  return CLOTHES_ITEM_TYPES[itemType].label;
}

function compareSizes(a: string, b: string, itemType: ClothesItemType): number {
  const order = CLOTHES_ITEM_TYPES[itemType].sizes;
  const aIndex = order.indexOf(a);
  const bIndex = order.indexOf(b);

  // Known sizes always come before the "unspecified" bucket.
  if (aIndex === -1 && bIndex === -1) return a.localeCompare(b, "ar-EG", { numeric: true });
  if (aIndex === -1) return 1;
  if (bIndex === -1) return -1;
  return aIndex - bIndex;
}

/**
 * Aggregate quantity per size for one item type. Requests with a missing size
 * are surfaced as "غير محدد" so the manager can follow them up before placing
 * a factory order instead of silently losing those pieces.
 */
export function buildClothesDistribution(
  rows: ClothesManagerRow[],
  itemType: ClothesItemType,
): ClothesDistribution {
  const { sizeField } = CLOTHES_ITEM_TYPES[itemType];
  const counts = new Map<string, number>();

  for (const row of rows) {
    const rawSize = row[sizeField];
    const size = rawSize && rawSize.trim() ? rawSize.trim() : "غير محدد";
    counts.set(size, (counts.get(size) ?? 0) + 1);
  }

  return {
    itemType,
    entries: [...counts.entries()]
      .sort(([a], [b]) => compareSizes(a, b, itemType))
      .map(([size, count]) => ({ size, count })),
  };
}

export function buildClothesSummary(rows: ClothesManagerRow[]): ClothesSummary {
  return {
    total: rows.length,
    children: new Set(rows.map((r) => r.family_member_id ?? r.id)).size,
    families: new Set(rows.map((r) => r.saint_family)).size,
    holiday: rows.filter((r) => r.request_category === "holiday").length,
    school: rows.filter((r) => r.request_category === "school").length,
  };
}

export function countDistributionPieces(distributions: ClothesDistribution[]): number {
  return distributions.reduce(
    (total, group) => total + group.entries.reduce((sum, entry) => sum + entry.count, 0),
    0,
  );
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

/**
 * Build the UTF-8 (BOM-prefixed) CSV used by the manager export button.
 * The report intentionally contains three sections:
 *   1. applied filters + summary counts
 *   2. aggregated size distribution for factory orders
 *   3. the detailed filtered rows
 */
export function buildClothesManagerCsv({
  rows,
  summary,
  distributions,
  filters,
  generatedAt = new Date(),
}: {
  rows: ClothesManagerRow[];
  summary: ClothesSummary;
  distributions: ClothesDistribution[];
  filters: ClothesCsvFilters;
  generatedAt?: Date;
}): string {
  const lines: string[] = [];

  lines.push(csvRow(["تقرير ملابس الأعياد والمدارس"]));
  lines.push(csvRow(["تاريخ التصدير", formatExportDate(generatedAt)]));
  lines.push(csvRow(["نوع الطلب", filters.categoryLabel]));
  lines.push(csvRow(["الأسرة", filters.familyLabel]));
  lines.push(csvRow(["نوع الصنف", filters.itemTypeLabel]));
  lines.push(csvRow(["المقاس", filters.sizeLabel]));
  if (filters.searchLabel) lines.push(csvRow(["بحث بالاسم", filters.searchLabel]));
  lines.push(csvRow([]));

  lines.push(csvRow(["الملخص"]));
  lines.push(csvRow(["إجمالي الطلبات", summary.total]));
  lines.push(csvRow(["عدد الأبناء المسجلين", summary.children]));
  lines.push(csvRow(["عدد الأسر", summary.families]));
  lines.push(csvRow(["طلبات لبس العيد", summary.holiday]));
  lines.push(csvRow(["طلبات لبس المدرسة", summary.school]));
  lines.push(csvRow([]));

  lines.push(csvRow(["توزيع المقاسات (تجميع للمصنع)"]));
  lines.push(csvRow(["نوع الصنف", "المقاس", "العدد"]));
  for (const group of distributions) {
    const label = CLOTHES_ITEM_TYPES[group.itemType].label;
    if (group.entries.length === 0) {
      lines.push(csvRow([label, "لا توجد بيانات", 0]));
      continue;
    }
    for (const entry of group.entries) {
      lines.push(csvRow([label, entry.size, entry.count]));
    }
  }
  lines.push(csvRow([]));

  lines.push(csvRow(["تفاصيل الطلبات"]));
  lines.push(
    csvRow([
      "م",
      "الأسرة",
      "ولي الأمر",
      "الابن/الابنة",
      "صلة القرابة",
      "نوع الطلب",
      "اسم المدرسة",
      "تي شيرت",
      "بنطلون",
      "كوتشي",
      "ملاحظات",
      "تاريخ التسجيل",
    ]),
  );

  rows.forEach((row, index) => {
    lines.push(
      csvRow([
        index + 1,
        row.saint_family,
        row.individuals?.full_name ?? "",
        row.family_members?.full_name ?? "",
        row.family_members?.relation ?? "",
        getClothesCategoryLabel(row.request_category),
        row.school_name ?? "",
        row.t_shirt_size ?? "",
        row.pants_size ?? "",
        row.shoe_size ?? "",
        row.notes ?? "",
        row.created_at ? new Date(row.created_at).toLocaleDateString("ar-EG") : "",
      ]),
    );
  });

  // Excel on Windows needs the BOM to detect UTF-8 and render Arabic correctly.
  return "\uFEFF" + lines.join("\r\n");
}

export function downloadClothesCsv(csv: string, filename: string): void {
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
