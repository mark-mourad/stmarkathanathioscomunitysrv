import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  createTreasuryTransaction,
  deleteTreasuryTransaction,
  getTreasuryDashboard,
  updateMetric,
  updateTreasuryTransaction,
} from "@/lib/church.functions";
import { useAuth } from "@/hooks/use-auth";
import {
  HIDDEN_FAMILY_VALUE,
  HIDDEN_FAMILIES_SECTOR,
  TREASURY_CATEGORIES,
  TREASURY_FAMILIES,
  TREASURY_TRANSACTION_TYPES,
  buildTreasuryCsv,
  downloadTreasuryCsv,
  emptyTreasurySummary,
  formatTreasuryAmount,
  getTreasuryCategoriesForType,
  getTreasuryFamilyForSector,
  getTreasuryFamilyLabel,
  getTreasuryTypeLabel,
  type TreasuryFamilySummary,
  type TreasuryMetric,
  type TreasurySummary,
  type TreasuryTransaction,
  type TreasuryTransactionType,
} from "@/lib/treasury";
import {
  BookOpen,
  DollarSign,
  Download,
  FilterX,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Stethoscope,
  Trash2,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { HiddenFamiliesPieCard, SectorBarChart } from "@/components/financial-metrics-charts";

export const Route = createFileRoute("/_authenticated/treasury")({
  head: () => ({ meta: [{ title: "الخزنة وصندوق الخدمة" }] }),
  component: TreasuryPage,
});

type Metric = TreasuryMetric & { sector: string };

type DashboardData = {
  metrics: Metric[];
  hiddenFamilies: Metric | null;
  transactions: TreasuryTransaction[];
  summary: TreasurySummary;
  familySummary: Record<string, TreasuryFamilySummary>;
  canManage: boolean;
  scope: { kind: "all" | "family"; saintFamily: string | null; sector: string | null };
  hiddenPersisted: boolean;
};

type TransactionFormState = {
  id: string | null;
  saint_family: string;
  transaction_date: string;
  transaction_type: TreasuryTransactionType;
  category: string;
  amount: string;
  description: string;
  reference: string;
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function emptyForm(saintFamily = "مرقس"): TransactionFormState {
  return {
    id: null,
    saint_family: saintFamily,
    transaction_date: todayIso(),
    transaction_type: "income",
    category: getTreasuryCategoriesForType("income")[0] ?? "تبرعات",
    amount: "",
    description: "",
    reference: "",
  };
}

function formatDate(value: string): string {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" });
}

function sumTransactions(rows: TreasuryTransaction[]): TreasurySummary {
  const summary = emptyTreasurySummary();
  for (const row of rows) {
    const amount = Number(row.amount ?? 0);
    summary.count += 1;
    if (row.transaction_type === "income") summary.income += amount;
    else summary.expense += amount;
  }
  summary.balance = summary.income - summary.expense;
  return summary;
}

function mergeMetrics(metrics: Metric[], hidden: Metric | null, canSeeHidden: boolean): Metric[] {
  const standard = metrics.filter((m) => m.sector !== HIDDEN_FAMILIES_SECTOR);
  if (!canSeeHidden) return standard;
  return hidden ? [...standard, hidden] : standard;
}

function TreasuryPage() {
  const { role, can, loading: authLoading } = useAuth();
  const router = useRouter();
  const fetchDashboard = useServerFn(getTreasuryDashboard);

  const canAccess = can("view:treasury");
  const isAdmin = role === "SUPER_ADMIN" || role === "ADMIN";
  const isTreasurerRole = role === "TREASURER";
  const canSeeHidden = isAdmin || isTreasurerRole;

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<TransactionFormState>(() => emptyForm());
  const [saving, setSaving] = useState(false);
  const [editMetricsOpen, setEditMetricsOpen] = useState(false);

  const [filterFamily, setFilterFamily] = useState("all");
  const [filterType, setFilterType] = useState<"all" | TreasuryTransactionType>("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
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
      const result = (await fetchDashboard()) as DashboardData;
      setData(result);
      setForm((current) => {
        if (current.id) return current;
        const family = result.scope.saintFamily ?? current.saint_family;
        return { ...current, saint_family: family };
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "خطأ في جلب بيانات الخزنة");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [canAccess, fetchDashboard]);

  useEffect(() => {
    if (!authLoading && canAccess) reload();
  }, [authLoading, canAccess, reload]);

  const scopedFamily = data?.scope.saintFamily ?? null;
  const canManage = Boolean(data?.canManage);

  const filteredTransactions = useMemo(() => {
    const rows = data?.transactions ?? [];
    const query = searchQuery.trim().toLowerCase();
    return rows.filter((row) => {
      if (filterFamily !== "all" && row.saint_family !== filterFamily) return false;
      if (filterType !== "all" && row.transaction_type !== filterType) return false;
      if (filterCategory !== "all" && row.category !== filterCategory) return false;
      if (filterFrom && row.transaction_date < filterFrom) return false;
      if (filterTo && row.transaction_date > filterTo) return false;
      if (query) {
        const haystack = [
          row.category,
          row.description ?? "",
          row.reference ?? "",
          getTreasuryFamilyLabel(row.saint_family),
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [data, filterFamily, filterType, filterCategory, filterFrom, filterTo, searchQuery]);

  const filteredSummary = useMemo(
    () => sumTransactions(filteredTransactions),
    [filteredTransactions],
  );

  const filteredFamilySummary = useMemo(() => {
    const result: Record<string, TreasuryFamilySummary> = {};
    TREASURY_FAMILIES.forEach((family) => {
      result[family.value] = emptyTreasurySummary();
    });
    for (const row of filteredTransactions) {
      const totals = result[row.saint_family] ?? emptyTreasurySummary();
      result[row.saint_family] = totals;
      const amount = Number(row.amount ?? 0);
      totals.count += 1;
      if (row.transaction_type === "income") totals.income += amount;
      else totals.expense += amount;
    }
    Object.values(result).forEach((totals) => {
      totals.balance = totals.income - totals.expense;
    });
    return result;
  }, [filteredTransactions]);

  const categoryOptions = useMemo(() => {
    if (filterType === "all") {
      return Array.from(new Set(TREASURY_CATEGORIES.map((c) => c.value)));
    }
    return getTreasuryCategoriesForType(filterType);
  }, [filterType]);

  const formCategoryOptions = useMemo(
    () => getTreasuryCategoriesForType(form.transaction_type),
    [form.transaction_type],
  );

  const metricsForCharts = useMemo(
    () =>
      mergeMetrics(
        data?.metrics ?? [],
        data?.hiddenFamilies ?? null,
        canSeeHidden || scopedFamily === HIDDEN_FAMILY_VALUE,
      ),
    [data, canSeeHidden, scopedFamily],
  );

  const sectorMetrics = metricsForCharts.filter(
    (metric) => metric.sector !== HIDDEN_FAMILIES_SECTOR,
  );

  const categoryTotals = useMemo(
    () =>
      metricsForCharts.reduce(
        (totals, metric) => ({
          monthly: totals.monthly + Number(metric.monthly ?? 0),
          therapeutic: totals.therapeutic + Number(metric.therapeutic ?? 0),
          study: totals.study + Number(metric.study ?? 0),
        }),
        { monthly: 0, therapeutic: 0, study: 0 },
      ),
    [metricsForCharts],
  );

  const summaryCards = [
    {
      label: "إجمالي الخارج",
      value: categoryTotals.monthly + categoryTotals.study + categoryTotals.therapeutic,
      icon: DollarSign,
      color: "bg-primary/10 text-primary",
    },
    {
      label: "الشهريات",
      value: categoryTotals.monthly,
      icon: TrendingUp,
      color: "bg-sky/15 text-sky",
    },
    {
      label: "مساعدات دراسية",
      value: categoryTotals.study,
      icon: BookOpen,
      color: "bg-teal/15 text-teal",
    },
    {
      label: "مساعدات علاجية",
      value: categoryTotals.therapeutic,
      icon: Stethoscope,
      color: "bg-chart-3/15 text-foreground",
    },
  ];

  const showHiddenFamiliesChart = canManage || scopedFamily === HIDDEN_FAMILY_VALUE;

  const visibleFamilySummary = useMemo(
    () => (canManage ? filteredFamilySummary : (data?.familySummary ?? {})),
    [canManage, data?.familySummary, filteredFamilySummary],
  );

  function resetFilters() {
    setFilterFamily("all");
    setFilterType("all");
    setFilterCategory("all");
    setFilterFrom("");
    setFilterTo("");
    setSearchQuery("");
  }

  function resetForm() {
    setForm(emptyForm(scopedFamily ?? "مرقس"));
  }

  function handleTypeChange(type: TreasuryTransactionType) {
    const categories = getTreasuryCategoriesForType(type);
    setForm((current) => ({
      ...current,
      transaction_type: type,
      category: categories.includes(current.category) ? current.category : (categories[0] ?? ""),
    }));
  }

  async function submitForm(event: React.FormEvent) {
    event.preventDefault();
    if (!data?.canManage) return;

    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("برجاء إدخال مبلغ صحيح أكبر من صفر");
      return;
    }
    if (!form.category.trim()) {
      toast.error("برجاء إدخال التصنيف");
      return;
    }
    if (!form.description.trim()) {
      toast.error("برجاء إدخال ملاحظات / وصف الحركة");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        saint_family: form.saint_family,
        transaction_date: form.transaction_date,
        transaction_type: form.transaction_type,
        category: form.category.trim(),
        amount,
        description: form.description.trim(),
        reference: form.reference.trim() || null,
      } as const;

      if (form.id) {
        await updateTreasuryTransaction({ data: { id: form.id, ...payload } });
        toast.success("تم تحديث الحركة المالية");
      } else {
        await createTreasuryTransaction({ data: payload });
        toast.success("تم تسجيل الحركة المالية");
      }
      resetForm();
      await reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "فشل حفظ الحركة المالية");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(row: TreasuryTransaction) {
    setForm({
      id: row.id,
      saint_family: row.saint_family,
      transaction_date: row.transaction_date,
      transaction_type: row.transaction_type,
      category: row.category,
      amount: String(row.amount),
      description: row.description ?? "",
      reference: row.reference ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function removeTransaction(row: TreasuryTransaction) {
    if (!data?.canManage) return;
    const confirmed = window.confirm(
      `هل تريد حذف حركة «${row.category}» بقيمة ${formatTreasuryAmount(row.amount)}؟`,
    );
    if (!confirmed) return;
    try {
      await deleteTreasuryTransaction({ data: { id: row.id } });
      toast.success("تم حذف الحركة المالية");
      if (form.id === row.id) resetForm();
      await reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "فشل حذف الحركة المالية");
    }
  }

  function handleExport() {
    if (filteredTransactions.length === 0) {
      toast.error("لا توجد بيانات للتصدير بهذه الفلاتر");
      return;
    }
    const csv = buildTreasuryCsv({
      transactions: filteredTransactions,
      summary: filteredSummary,
      familySummary: filteredFamilySummary,
      filters: {
        dateFrom: filterFrom,
        dateTo: filterTo,
        typeLabel: filterType === "all" ? "كل الحركات" : getTreasuryTypeLabel(filterType),
        categoryLabel: filterCategory === "all" ? "كل التصنيفات" : filterCategory,
        familyLabel: filterFamily === "all" ? "كل الأسر" : getTreasuryFamilyLabel(filterFamily),
      },
    });
    downloadTreasuryCsv(csv, `treasury-${new Date().toISOString().slice(0, 10)}.csv`);
    toast.success(`تم تصدير ${filteredTransactions.length} حركة إلى CSV`);
  }

  if (authLoading || !canAccess) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {authLoading ? "جارٍ التحقق من الصلاحيات..." : "جاري التوجيه..."}
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="display text-2xl text-ink flex items-center gap-2">
            <Wallet size={26} /> الخزنة وصندوق الخدمة
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {canManage
              ? "تسجيل ومتابعة إيرادات ومصروفات صندوق الخدمة لكل الأسر، مع الفلاتر والتقارير."
              : "عرض مالي خاص بأسرة واحدة فقط (قراءة فقط)."}
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
          {canManage && (
            <button
              type="button"
              onClick={handleExport}
              className="chip-green flex items-center gap-1.5 px-5 py-2 text-sm"
            >
              <Download size={16} /> تصدير CSV
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards — same layout and categories as the Admin dashboard */}
      <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <article
            key={card.label}
            className="paper-card !p-3 sm:!p-6 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-4"
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

      {/* Charts — shared with the Admin dashboard */}
      <section
        className={`grid grid-cols-1 gap-4 sm:gap-6 ${showHiddenFamiliesChart ? "lg:grid-cols-2" : ""}`}
      >
        <SectorBarChart
          metrics={sectorMetrics}
          editable={canManage}
          onEdit={() => setEditMetricsOpen(true)}
        />
        {showHiddenFamiliesChart && (
          <HiddenFamiliesPieCard
            metric={data?.hiddenFamilies ?? null}
            editable={canManage}
            onEdit={() => setEditMetricsOpen(true)}
          />
        )}
      </section>

      {/* Family totals */}
      <h2 className="display text-lg text-ink">تفصيل المساعدات حسب الأسرة</h2>
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {TREASURY_FAMILIES.filter((family) => !scopedFamily || family.value === scopedFamily).map(
          (family) => {
            const totals = visibleFamilySummary[family.value] ?? emptyTreasurySummary();
            const metric = metricsForCharts.find(
              (row) => getTreasuryFamilyForSector(row.sector) === family.value,
            );
            return (
              <article key={family.value} className="paper-card !p-4">
                <p className="text-sm font-semibold text-ink">{family.label}</p>
                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center justify-between gap-2">
                    <span>شهريات</span>
                    <span className="tabular-nums font-semibold text-primary">
                      {formatTreasuryAmount(metric?.monthly ?? 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span>علاجية</span>
                    <span className="tabular-nums font-semibold text-chart-3">
                      {formatTreasuryAmount(metric?.therapeutic ?? 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span>دراسية</span>
                    <span className="tabular-nums font-semibold text-teal">
                      {formatTreasuryAmount(metric?.study ?? 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span>إيرادات</span>
                    <span className="tabular-nums font-semibold text-teal">
                      {formatTreasuryAmount(totals.income)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span>مصروفات</span>
                    <span className="tabular-nums font-semibold text-foreground">
                      {formatTreasuryAmount(totals.expense)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 border-t border-border/50 pt-1">
                    <span>الرصيد</span>
                    <span className="tabular-nums font-bold text-primary">
                      {formatTreasuryAmount(totals.balance)}
                    </span>
                  </div>
                </div>
              </article>
            );
          },
        )}
      </section>

      {/* Transaction form */}
      {canManage && (
        <section className="paper-card">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="display text-lg text-ink flex items-center gap-2">
              {form.id ? <Pencil size={18} /> : <Plus size={18} />}
              {form.id ? "تعديل حركة مالية" : "تسجيل حركة مالية جديدة"}
            </h2>
            {form.id && (
              <button
                type="button"
                onClick={resetForm}
                className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-primary"
              >
                <X size={14} /> إلغاء التعديل
              </button>
            )}
          </div>

          <form
            onSubmit={submitForm}
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
          >
            <label className="block">
              <span className="text-xs font-semibold text-muted-foreground">الأسرة</span>
              <select
                value={form.saint_family}
                onChange={(e) =>
                  setForm((current) => ({ ...current, saint_family: e.target.value }))
                }
                disabled={Boolean(scopedFamily)}
                className="mt-1 w-full rounded-xl bg-paper border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
              >
                {TREASURY_FAMILIES.map((family) => (
                  <option key={family.value} value={family.value}>
                    {family.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-muted-foreground">التاريخ</span>
              <input
                type="date"
                value={form.transaction_date}
                onChange={(e) =>
                  setForm((current) => ({ ...current, transaction_date: e.target.value }))
                }
                className="mt-1 w-full rounded-xl bg-paper border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                required
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-muted-foreground">نوع الحركة</span>
              <select
                value={form.transaction_type}
                onChange={(e) => handleTypeChange(e.target.value as TreasuryTransactionType)}
                className="mt-1 w-full rounded-xl bg-paper border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              >
                {TREASURY_TRANSACTION_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-muted-foreground">التصنيف</span>
              <input
                list="treasury-categories"
                value={form.category}
                onChange={(e) => setForm((current) => ({ ...current, category: e.target.value }))}
                className="mt-1 w-full rounded-xl bg-paper border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                placeholder="اختر أو اكتب التصنيف"
                required
              />
              <datalist id="treasury-categories">
                {formCategoryOptions.map((category) => (
                  <option key={category} value={category} />
                ))}
              </datalist>
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-muted-foreground">المبلغ</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm((current) => ({ ...current, amount: e.target.value }))}
                className="mt-1 w-full rounded-xl bg-paper border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                placeholder="0.00"
                required
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-muted-foreground">المرجع (اختياري)</span>
              <input
                value={form.reference}
                onChange={(e) => setForm((current) => ({ ...current, reference: e.target.value }))}
                className="mt-1 w-full rounded-xl bg-paper border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                placeholder="رقم إيصال / مستند"
              />
            </label>

            <label className="block sm:col-span-2">
              <span className="text-xs font-semibold text-muted-foreground">
                ملاحظات / وصف الحركة <span className="text-destructive">*</span>
              </span>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm((current) => ({ ...current, description: e.target.value }))
                }
                className="mt-1 min-h-20 w-full rounded-xl bg-paper border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                placeholder="سبب الحركة، المستفيد، أو رقم الفاتورة"
                maxLength={2000}
                required
              />
            </label>

            <div className="sm:col-span-2 xl:col-span-4 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="chip-green flex items-center gap-1.5 px-6 py-2 text-sm disabled:opacity-60"
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                {form.id ? "حفظ التعديل" : "تسجيل الحركة"}
              </button>
            </div>
          </form>
        </section>
      )}

      {canManage && (
        <>
          {/* Filters */}
          <section className="paper-card">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="display text-lg text-ink">فلاتر البحث</h2>
              <button
                type="button"
                onClick={resetFilters}
                className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-primary"
              >
                <FilterX size={14} /> مسح الفلاتر
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
              <label className="block">
                <span className="text-xs font-semibold text-muted-foreground">من تاريخ</span>
                <input
                  type="date"
                  value={filterFrom}
                  onChange={(e) => setFilterFrom(e.target.value)}
                  className="mt-1 w-full rounded-xl bg-paper border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-muted-foreground">إلى تاريخ</span>
                <input
                  type="date"
                  value={filterTo}
                  onChange={(e) => setFilterTo(e.target.value)}
                  className="mt-1 w-full rounded-xl bg-paper border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-muted-foreground">الأسرة</span>
                <select
                  value={filterFamily}
                  onChange={(e) => setFilterFamily(e.target.value)}
                  className="mt-1 w-full rounded-xl bg-paper border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="all">كل الأسر</option>
                  {TREASURY_FAMILIES.filter(
                    (family) => !scopedFamily || family.value === scopedFamily,
                  ).map((family) => (
                    <option key={family.value} value={family.value}>
                      {family.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-muted-foreground">نوع الحركة</span>
                <select
                  value={filterType}
                  onChange={(e) => {
                    setFilterType(e.target.value as "all" | TreasuryTransactionType);
                    setFilterCategory("all");
                  }}
                  className="mt-1 w-full rounded-xl bg-paper border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="all">كل الحركات</option>
                  {TREASURY_TRANSACTION_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-muted-foreground">التصنيف</span>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="mt-1 w-full rounded-xl bg-paper border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="all">كل التصنيفات</option>
                  {categoryOptions.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-muted-foreground">بحث</span>
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="mt-1 w-full rounded-xl bg-paper border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  placeholder="تصنيف / وصف / مرجع..."
                />
              </label>
            </div>
          </section>

          {/* Transactions table */}
          <section className="paper-card">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="display text-lg text-ink">سجل الحركات المالية</h2>
              <span className="text-sm text-muted-foreground">
                {filteredTransactions.length} من أصل {data?.transactions.length ?? 0} حركة
              </span>
            </div>

            {loading ? (
              <p className="text-center text-muted-foreground py-10">
                جارٍ تحميل الحركات المالية...
              </p>
            ) : filteredTransactions.length === 0 ? (
              <p className="text-center text-muted-foreground py-10">
                لا توجد حركات مطابقة للفلاتر الحالية
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse min-w-[720px]">
                  <thead>
                    <tr className="text-muted-foreground">
                      {[
                        "م",
                        "التاريخ",
                        "الأسرة",
                        "النوع",
                        "التصنيف",
                        "المبلغ",
                        "ملاحظات / الوصف / المرجع",
                        ...(canManage ? ["إجراءات"] : []),
                      ].map((header) => (
                        <th key={header} className="text-start px-2 py-2 whitespace-nowrap">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((row, index) => (
                      <tr key={row.id} className="border-t border-border/50">
                        <td className="px-2 py-2 text-muted-foreground">{index + 1}</td>
                        <td className="px-2 py-2 whitespace-nowrap tabular-nums">
                          {formatDate(row.transaction_date)}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          {getTreasuryFamilyLabel(row.saint_family)}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                              row.transaction_type === "income"
                                ? "bg-teal/15 text-teal"
                                : "bg-chart-3/15 text-foreground"
                            }`}
                          >
                            {getTreasuryTypeLabel(row.transaction_type)}
                          </span>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap">{row.category}</td>
                        <td className="px-2 py-2 whitespace-nowrap tabular-nums font-semibold">
                          {formatTreasuryAmount(row.amount)}
                        </td>
                        <td className="px-2 py-2 text-muted-foreground">
                          <div
                            className="max-w-[16rem] whitespace-normal break-words"
                            title={row.description ?? ""}
                          >
                            {row.description || "—"}
                          </div>
                          {row.reference && (
                            <div className="text-[11px] text-muted-foreground/80 truncate">
                              مرجع: {row.reference}
                            </div>
                          )}
                        </td>
                        {canManage && (
                          <td className="px-2 py-2">
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => startEdit(row)}
                                className="flex items-center justify-center min-h-8 min-w-8 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10"
                                aria-label="تعديل الحركة"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeTransaction(row)}
                                className="flex items-center justify-center min-h-8 min-w-8 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                aria-label="حذف الحركة"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {editMetricsOpen && canManage && (
        <EditMetricsDialog
          metrics={metricsForCharts}
          onClose={() => setEditMetricsOpen(false)}
          onSaved={async () => {
            setEditMetricsOpen(false);
            await reload();
          }}
        />
      )}

      {!canManage && (
        <p className="text-center text-xs text-muted-foreground">
          هذه الواجهة للعرض فقط لخادم الأسرة. تسجيل وتعديل الحركات متاح لخادم الصندوق والمسؤولين.
        </p>
      )}
    </div>
  );
}

function EditMetricsDialog({
  metrics,
  onClose,
  onSaved,
}: {
  metrics: Metric[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const saveMetric = useServerFn(updateMetric);
  const [selectedId, setSelectedId] = useState(metrics[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [description, setDescription] = useState("");

  const selected = metrics.find((metric) => metric.id === selectedId) ?? metrics[0];
  const [monthly, setMonthly] = useState(Number(selected?.monthly ?? 0));
  const [study, setStudy] = useState(Number(selected?.study ?? 0));
  const [therapeutic, setTherapeutic] = useState(Number(selected?.therapeutic ?? 0));

  function selectMetric(id: string) {
    const metric = metrics.find((item) => item.id === id);
    if (!metric) return;
    setSelectedId(id);
    setMonthly(Number(metric.monthly));
    setStudy(Number(metric.study));
    setTherapeutic(Number(metric.therapeutic));
  }

  async function save() {
    if (!selected) {
      toast.error("لا توجد قيمة مالية للتعديل");
      return;
    }
    if (!description.trim()) {
      toast.error("برجاء إدخال ملاحظات / وصف الحركة");
      return;
    }
    setBusy(true);
    try {
      await saveMetric({
        data: { id: selected.id, monthly, study, therapeutic, description: description.trim() },
      });
      toast.success("تم تحديث القيم المالية");
      onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "فشل تحديث القيم المالية");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-paper p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h3 className="display text-lg text-ink">تعديل القيم المالية</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center min-h-8 min-w-8 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10"
            aria-label="إغلاق"
          >
            <X size={16} />
          </button>
        </div>

        <label className="block">
          <span className="text-xs font-semibold text-muted-foreground">الأسرة / القطاع</span>
          <select
            value={selectedId}
            onChange={(e) => selectMetric(e.target.value)}
            className="mt-1 w-full rounded-xl bg-paper-2 border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            {metrics.map((metric) => (
              <option key={metric.id} value={metric.id}>
                {metric.sector}
                {getTreasuryFamilyForSector(metric.sector)
                  ? ` — ${getTreasuryFamilyLabel(getTreasuryFamilyForSector(metric.sector))}`
                  : ""}
              </option>
            ))}
          </select>
        </label>

        <div className="mt-3 grid grid-cols-1 gap-3">
          <label className="block">
            <span className="text-xs font-semibold text-muted-foreground">الشهريات</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={monthly}
              onChange={(e) => setMonthly(Number(e.target.value))}
              className="mt-1 w-full rounded-xl bg-paper-2 border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-muted-foreground">مساعدات دراسية</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={study}
              onChange={(e) => setStudy(Number(e.target.value))}
              className="mt-1 w-full rounded-xl bg-paper-2 border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-muted-foreground">مساعدات علاجية</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={therapeutic}
              onChange={(e) => setTherapeutic(Number(e.target.value))}
              className="mt-1 w-full rounded-xl bg-paper-2 border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
        </div>

        <label className="mt-3 block">
          <span className="text-xs font-semibold text-muted-foreground">
            ملاحظات / وصف التعديل <span className="text-destructive">*</span>
          </span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 min-h-20 w-full rounded-xl bg-paper-2 border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            placeholder="سبب التعديل أو تفاصيل المستفيد / المستند"
            maxLength={2000}
            required
          />
        </label>

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-muted px-4 py-2 text-sm font-semibold text-foreground"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={save}
            disabled={busy}
            className="chip-green flex items-center gap-1.5 px-5 py-2 text-sm disabled:opacity-60"
          >
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            حفظ
          </button>
        </div>
      </div>
    </div>
  );
}
