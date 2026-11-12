import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getClothesManagerRequests } from "@/lib/church.functions";
import { useAuth } from "@/hooks/use-auth";
import {
  CLOTHES_CATEGORIES,
  CLOTHES_ITEM_TYPES,
  CLOTHES_ITEM_TYPE_VALUES,
  CLOTHES_SAINT_FAMILIES,
  buildClothesDistribution,
  buildClothesManagerCsv,
  buildClothesSummary,
  countDistributionPieces,
  downloadClothesCsv,
  getClothesCategoryLabel,
  getClothesFamilyLabel,
  getClothesItemTypeLabel,
  type ClothesCategory,
  type ClothesItemType,
  type ClothesManagerRow,
} from "@/lib/clothes";
import { toast } from "sonner";
import { Download, FilterX, Loader2, Package, RefreshCw, Search, Shirt, Users } from "lucide-react";

export const Route = createFileRoute("/_authenticated/clothes-manager")({
  head: () => ({ meta: [{ title: "مسؤول ملابس الأعياد والمدارس" }] }),
  component: ClothesManagerPage,
});

type CategoryFilter = "all" | ClothesCategory;
type ItemTypeFilter = "all" | ClothesItemType;

function ClothesManagerPage() {
  const { role, loading: authLoading } = useAuth();
  const router = useRouter();
  const fetchRows = useServerFn(getClothesManagerRequests);

  const canAccess = role === "CLOTHES_MANAGER" || role === "SUPER_ADMIN" || role === "ADMIN";

  const [rows, setRows] = useState<ClothesManagerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<CategoryFilter>("all");
  const [filterFamily, setFilterFamily] = useState("all");
  const [filterItemType, setFilterItemType] = useState<ItemTypeFilter>("all");
  const [filterSize, setFilterSize] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!canAccess) {
      toast.error("غير مصرح لك بهذا الحقل");
      router.navigate({ to: "/" });
    }
  }, [authLoading, canAccess, router]);

  const reload = useCallback(async () => {
    if (!canAccess) return;
    setLoading(true);
    try {
      const data = await fetchRows();
      setRows((data ?? []) as ClothesManagerRow[]);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "خطأ في جلب بيانات الملابس");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [canAccess, fetchRows]);

  useEffect(() => {
    if (!authLoading && canAccess) reload();
  }, [authLoading, canAccess, reload]);

  // Size options depend on the selected item type. "all" item types means no
  // single size dimension can be selected, so the size filter is disabled.
  const sizeOptions = filterItemType === "all" ? [] : CLOTHES_ITEM_TYPES[filterItemType].sizes;

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (filterCategory !== "all" && row.request_category !== filterCategory) return false;
      if (filterFamily !== "all" && row.saint_family !== filterFamily) return false;

      if (filterItemType !== "all") {
        const size = row[CLOTHES_ITEM_TYPES[filterItemType].sizeField];
        if (!size) return false;
        if (filterSize !== "all" && size !== filterSize) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const parent = row.individuals?.full_name?.toLowerCase() ?? "";
        const child = row.family_members?.full_name?.toLowerCase() ?? "";
        if (!parent.includes(q) && !child.includes(q)) return false;
      }

      return true;
    });
  }, [rows, filterCategory, filterFamily, filterItemType, filterSize, searchQuery]);

  const summary = useMemo(() => buildClothesSummary(filteredRows), [filteredRows]);

  const distributions = useMemo(() => {
    const types: ClothesItemType[] =
      filterItemType === "all" ? CLOTHES_ITEM_TYPE_VALUES : [filterItemType];
    return types.map((itemType) => buildClothesDistribution(filteredRows, itemType));
  }, [filteredRows, filterItemType]);

  const totalPieces = useMemo(() => countDistributionPieces(distributions), [distributions]);

  function handleItemTypeChange(value: ItemTypeFilter) {
    setFilterItemType(value);
    setFilterSize("all");
  }

  function resetFilters() {
    setFilterCategory("all");
    setFilterFamily("all");
    setFilterItemType("all");
    setFilterSize("all");
    setSearchQuery("");
  }

  function handleExportCsv() {
    if (filteredRows.length === 0) {
      toast.error("لا توجد بيانات للتصدير بهذه الفلاتر");
      return;
    }

    const csv = buildClothesManagerCsv({
      rows: filteredRows,
      summary,
      distributions,
      filters: {
        categoryLabel:
          filterCategory === "all" ? "كل أنواع الطلبات" : getClothesCategoryLabel(filterCategory),
        familyLabel: filterFamily === "all" ? "كل الأسر" : getClothesFamilyLabel(filterFamily),
        itemTypeLabel: getClothesItemTypeLabel(filterItemType),
        sizeLabel: filterSize === "all" ? "كل المقاسات" : filterSize,
        searchLabel: searchQuery.trim() || undefined,
      },
    });

    downloadClothesCsv(csv, `clothes-manager-${new Date().toISOString().slice(0, 10)}.csv`);
    toast.success(`تم تصدير ${filteredRows.length} طلب إلى CSV`);
  }

  if (authLoading || !canAccess) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {authLoading ? "جارٍ التحقق من الصلاحيات..." : "جاري التوجيه..."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="display text-2xl text-ink flex items-center gap-2">
            <Shirt size={26} /> مسؤول ملابس الأعياد والمدارس
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            جدول شامل لكل الأبناء المسجلين، مع فلاتر متعددة وتجميع كميات المقاسات لطلبات المصنع.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={reload}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-full bg-muted px-4 py-2 text-sm font-semibold text-foreground disabled:opacity-60"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
            تحديث
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="chip-green flex items-center gap-1.5 px-5 py-2 text-sm"
          >
            <Download size={16} /> تصدير CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <section className="paper-card">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="display text-lg text-ink flex items-center gap-2">
            <Search size={17} /> فلاتر التجميع
          </h2>
          <button
            type="button"
            onClick={resetFilters}
            className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-primary"
          >
            <FilterX size={14} /> مسح الفلاتر
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <label className="block">
            <span className="text-xs font-semibold text-muted-foreground">بحث بالاسم</span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="اسم الابن أو ولي الأمر..."
              className="mt-1 w-full rounded-xl bg-paper border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-muted-foreground">نوع الطلب</span>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as CategoryFilter)}
              className="mt-1 w-full rounded-xl bg-paper border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">كل الأنواع</option>
              {CLOTHES_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-muted-foreground">الأسرة</span>
            <select
              value={filterFamily}
              onChange={(e) => setFilterFamily(e.target.value)}
              className="mt-1 w-full rounded-xl bg-paper border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">كل الأسر</option>
              {CLOTHES_SAINT_FAMILIES.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-muted-foreground">نوع الصنف</span>
            <select
              value={filterItemType}
              onChange={(e) => handleItemTypeChange(e.target.value as ItemTypeFilter)}
              className="mt-1 w-full rounded-xl bg-paper border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">كل الأصناف</option>
              {CLOTHES_ITEM_TYPE_VALUES.map((itemType) => (
                <option key={itemType} value={itemType}>
                  {CLOTHES_ITEM_TYPES[itemType].label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-muted-foreground">المقاس</span>
            <select
              value={filterSize}
              onChange={(e) => setFilterSize(e.target.value)}
              disabled={filterItemType === "all"}
              className="mt-1 w-full rounded-xl bg-paper border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
            >
              <option value="all">
                {filterItemType === "all" ? "اختر الصنف أولًا" : "كل المقاسات"}
              </option>
              {sizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {/* Summary */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <SummaryCard label="إجمالي الطلبات" value={summary.total} icon={<Package size={18} />} />
        <SummaryCard label="عدد الأبناء" value={summary.children} icon={<Users size={18} />} />
        <SummaryCard label="عدد الأسر" value={summary.families} icon={<Shirt size={18} />} />
        <SummaryCard label="طلبات العيد" value={summary.holiday} icon={<Shirt size={18} />} />
        <SummaryCard label="طلبات المدرسة" value={summary.school} icon={<Shirt size={18} />} />
        <SummaryCard label="إجمالي القطع" value={totalPieces} icon={<Package size={18} />} />
      </section>

      {/* Size distribution for factory orders */}
      <section className="paper-card">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="display text-lg text-ink">تجميع المقاسات للمصنع</h2>
          <span className="text-sm text-muted-foreground">
            {filteredRows.length} طلب في النتيجة الحالية
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {distributions.map((group) => (
            <div key={group.itemType} className="rounded-xl border border-border bg-paper-2 p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="font-semibold text-ink">
                  {CLOTHES_ITEM_TYPES[group.itemType].label}
                </h3>
                <span className="text-xs text-muted-foreground">
                  {group.entries.reduce((sum, entry) => sum + entry.count, 0)} قطعة
                </span>
              </div>

              {group.entries.length === 0 ? (
                <p className="text-sm text-muted-foreground">لا توجد بيانات</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {group.entries.map((entry) => (
                    <span
                      key={entry.size}
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold ${
                        entry.size === "غير محدد"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-primary/10 text-primary"
                      }`}
                    >
                      <span>{entry.size}</span>
                      <span className="rounded-full bg-paper px-1.5 text-xs tabular-nums">
                        {entry.count}
                      </span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Detailed table */}
      <section className="paper-card">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="display text-lg text-ink">جدول الأبناء المسجلين</h2>
          <span className="text-sm text-muted-foreground">
            {filteredRows.length} من أصل {rows.length} طلب
          </span>
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground py-10">جارٍ تحميل البيانات...</p>
        ) : filteredRows.length === 0 ? (
          <p className="text-center text-muted-foreground py-10">
            لا توجد طلبات مطابقة للفلاتر الحالية
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-muted-foreground">
                  {[
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
                  ].map((header) => (
                    <th
                      key={header}
                      className="whitespace-nowrap border-b border-border px-2 py-2 text-start font-semibold"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row, index) => (
                  <tr key={row.id} className="border-b border-border/60 hover:bg-primary/5">
                    <td className="px-2 py-2 text-muted-foreground">{index + 1}</td>
                    <td className="whitespace-nowrap px-2 py-2">{row.saint_family}</td>
                    <td className="whitespace-nowrap px-2 py-2">
                      {row.individuals?.full_name ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-2 py-2">
                      {row.family_members?.full_name ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-2 py-2">
                      {row.family_members?.relation ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-2 py-2">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          row.request_category === "holiday"
                            ? "bg-sky/20 text-sky"
                            : "bg-teal/20 text-teal"
                        }`}
                      >
                        {getClothesCategoryLabel(row.request_category)}
                      </span>
                    </td>
                    <td className="px-2 py-2">{row.school_name ?? "—"}</td>
                    <td className="px-2 py-2">{row.t_shirt_size ?? "—"}</td>
                    <td className="px-2 py-2">{row.pants_size ?? "—"}</td>
                    <td className="px-2 py-2">{row.shoe_size ?? "—"}</td>
                    <td className="max-w-[180px] truncate px-2 py-2 text-muted-foreground">
                      {row.notes ?? ""}
                    </td>
                    <td className="whitespace-nowrap px-2 py-2 text-muted-foreground">
                      {row.created_at ? new Date(row.created_at).toLocaleDateString("ar-EG") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="paper-card !p-3">
      <div className="flex items-center gap-2 text-muted-foreground">
        <span className="rounded-lg bg-primary/10 p-1.5 text-primary">{icon}</span>
        <span className="text-xs font-semibold">{label}</span>
      </div>
      <p className="display mt-2 text-xl text-ink tabular-nums">{value.toLocaleString("ar-EG")}</p>
    </div>
  );
}
