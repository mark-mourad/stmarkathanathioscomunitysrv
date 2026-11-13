import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  createTreasuryTransaction,
  deleteTreasuryTransaction,
  getTreasuryDashboard,
  updateTreasuryTransaction,
} from "@/lib/church.functions";
import { useAuth } from "@/hooks/use-auth";
import {
  FINANCIAL_METRIC_CATEGORIES,
  HIDDEN_FAMILIES_SECTOR,
  TREASURY_EXPENSE_CATEGORIES,
  TREASURY_EXPENSE_CATEGORY_VALUES,
  TREASURY_FAMILIES,
  TREASURY_INCOME_CATEGORIES,
  TREASURY_TRANSACTION_TYPES,
  buildTreasuryCsv,
  downloadTreasuryCsv,
  emptyTreasurySummary,
  formatTreasuryAmount,
  getTreasuryFamilyLabel,
  getTreasurySectorForFamily,
  getTreasuryTransactionFamilyLabel,
  getTreasuryTypeLabel,
  isTreasuryExpenseCategory,
  normalizeTreasuryCategory,
  type TreasuryFamilySummary,
  type TreasuryMetric,
  type TreasurySummary,
  type TreasuryTransaction,
  type TreasuryTransactionType,
} from "@/lib/treasury";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Download,
  FilterX,
  Landmark,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { FinancialCharts, FinancialSummaryCards } from "@/components/financial-overview";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/treasury")({
  head: () => ({ meta: [{ title: "الخزنة وصندوق الخدمة" }] }),
  component: TreasuryPage,
});

type Metric = TreasuryMetric;

/** Pseudo-family filter used for untied general-treasury income rows. */
const GENERAL_TREASURY_FILTER = "__general__";

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
  recipient_name: string;
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
    recipient_name: "",
    transaction_date: todayIso(),
    transaction_type: "income",
    category: "",
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

function formatDateTime(value: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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

function findFamilyMetric(metrics: Metric[], family: string): Metric | null {
  const sector = getTreasurySectorForFamily(family);
  if (!sector) return null;
  return metrics.find((metric) => metric.sector === sector) ?? null;
}

function canEditTransaction(row: TreasuryTransaction): boolean {
  if (row.transaction_type === "income") return true;
  return isTreasuryExpenseCategory(row.category);
}

function TreasuryPage() {
  const { role, loading: authLoading } = useAuth();
  const router = useRouter();
  const fetchDashboard = useServerFn(getTreasuryDashboard);

  const isAdmin = role === "SUPER_ADMIN" || role === "ADMIN";
  const isTreasurerRole = role === "TREASURER";
  // Strict access: only System Admins and the Treasurer may open /treasury.
  const canAccess = isAdmin || isTreasurerRole;
  const isChurchWideRole = isAdmin || isTreasurerRole;

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<TransactionFormState>(() => emptyForm());
  const [saving, setSaving] = useState(false);

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

  const allMetricRows = useMemo(() => {
    const rows = data?.metrics ?? [];
    const hidden = data?.hiddenFamilies ?? null;
    if (hidden && !rows.some((row) => row.id === hidden.id || row.sector === hidden.sector)) {
      return [...rows, hidden];
    }
    return rows;
  }, [data]);

  const sectorChartMetrics = useMemo(
    () =>
      canManage
        ? allMetricRows.filter((metric) => metric.sector !== HIDDEN_FAMILIES_SECTOR)
        : allMetricRows,
    [allMetricRows, canManage],
  );

  const summaryCardHidden = canManage ? (data?.hiddenFamilies ?? null) : null;

  const visibleFamilies = TREASURY_FAMILIES.filter(
    (family) => !scopedFamily || family.value === scopedFamily,
  );
  const filteredTransactions = useMemo(() => {
    const rows = data?.transactions ?? [];
    const query = searchQuery.trim().toLowerCase();
    return rows.filter((row) => {
      if (filterFamily === GENERAL_TREASURY_FILTER) {
        if (row.saint_family !== null) return false;
      } else if (filterFamily !== "all" && row.saint_family !== filterFamily) {
        return false;
      }
      if (filterType !== "all" && row.transaction_type !== filterType) return false;
      if (filterCategory !== "all" && normalizeTreasuryCategory(row.category) !== filterCategory) {
        return false;
      }
      if (filterFrom && row.transaction_date < filterFrom) return false;
      if (filterTo && row.transaction_date > filterTo) return false;
      if (query) {
        const haystack = [
          row.category,
          row.recipient_name ?? "",
          row.description ?? "",
          row.reference ?? "",
          row.created_by_email ?? "",
          getTreasuryTransactionFamilyLabel(row.saint_family, row.transaction_type),
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
      if (!row.saint_family) continue;
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
    const base =
      filterType === "all"
        ? [...TREASURY_INCOME_CATEGORIES, ...TREASURY_EXPENSE_CATEGORY_VALUES]
        : filterType === "income"
          ? [...TREASURY_INCOME_CATEGORIES]
          : [...TREASURY_EXPENSE_CATEGORY_VALUES];
    const recorded = (data?.transactions ?? []).map((row) =>
      normalizeTreasuryCategory(row.category),
    );
    return Array.from(new Set<string>([...base, ...recorded]));
  }, [data, filterType]);

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
    setForm((current) => {
      if (type === "income") {
        return {
          ...current,
          transaction_type: type,
          category: "",
          recipient_name: "",
        };
      }
      const categories = formCategoryValues();
      return {
        ...current,
        transaction_type: type,
        category: categories.includes(current.category) ? current.category : (categories[0] ?? ""),
      };
    });
  }

  async function submitForm(event: React.FormEvent) {
    event.preventDefault();
    if (!data?.canManage) return;

    const amount = Number(form.amount);
    const isExpense = form.transaction_type === "expense";
    const category = isExpense
      ? normalizeTreasuryCategory(form.category.trim())
      : form.category.trim();
    const recipientName = form.recipient_name.trim();

    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("برجاء إدخال مبلغ صحيح أكبر من صفر");
      return;
    }
    if (!category) {
      toast.error(isExpense ? "برجاء اختيار البند" : "برجاء إدخال مصدر الإيراد");
      return;
    }
    if (isExpense && !isTreasuryExpenseCategory(category)) {
      toast.error("برجاء اختيار البند: شهريات أو مساعدات علاجية أو مساعدات دراسية");
      return;
    }
    if (isExpense && !form.saint_family) {
      toast.error("برجاء اختيار الأسرة المستفيدة");
      return;
    }
    if (isExpense && !recipientName) {
      toast.error("برجاء إدخال اسم المستلم");
      return;
    }
    if (!form.description.trim()) {
      toast.error("برجاء إدخال ملاحظات / وصف الحركة");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        saint_family: isExpense ? form.saint_family : null,
        recipient_name: isExpense ? recipientName : null,
        transaction_date: form.transaction_date,
        transaction_type: form.transaction_type,
        category,
        amount,
        description: form.description.trim(),
        reference: form.reference.trim() || null,
      };

      if (form.id) {
        await updateTreasuryTransaction({ data: { id: form.id, ...payload } });
        toast.success("تم تحديث الحركة المالية");
      } else {
        await createTreasuryTransaction({ data: payload });
        toast.success(
          isExpense
            ? "تم تسجيل المصروف وخصمه من الخزنة وإضافته لبند الأسرة"
            : "تم تسجيل الإيراد العام للخزنة",
        );
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
    if (!canEditTransaction(row)) {
      toast.error("هذا البند القديم غير مرتبط ببنود الخزنة الحالية. يمكنك حذفه وإعادة تسجيله.");
      return;
    }
    setForm({
      id: row.id,
      saint_family: row.saint_family ?? "مرقس",
      recipient_name: row.recipient_name ?? "",
      transaction_date: row.transaction_date,
      transaction_type: row.transaction_type,
      category: normalizeTreasuryCategory(row.category),
      amount: String(row.amount),
      description: row.description ?? "",
      reference: row.reference ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function removeTransaction(row: TreasuryTransaction) {
    if (!data?.canManage) return;
    const confirmed = window.confirm(
      `هل تريد حذف حركة «${row.category}» بقيمة ${formatTreasuryAmount(row.amount)}؟${
        row.transaction_type === "expense"
          ? "\nسيتم إرجاع المبلغ إلى رصيد الخزنة وخصمه من بند الأسرة."
          : ""
      }`,
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
        categoryLabel: filterCategory === "all" ? "كل البنود" : filterCategory,
        familyLabel:
          filterFamily === "all"
            ? "كل الأسر"
            : filterFamily === GENERAL_TREASURY_FILTER
              ? "الخزنة العامة (إيراد عام)"
              : getTreasuryFamilyLabel(filterFamily),
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
              ? "تسجيل الإيرادات العامة والمصروفات المخصصة، مع مزامنة فورية للقيم مع لوحة التحكم."
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

      {/* General treasury pool — church-wide roles only */}
      {canManage && (
        <section className="paper-card">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="display text-lg text-ink flex items-center gap-2">
                <Landmark size={18} /> الخزنة العامة
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                الإيراد العام يزيد رصيد الخزنة دون ارتباط بأسرة. المصروف المخصص يخصم منه ويضاف
                تلقائيًا لبند الأسرة المستفيدة.
              </p>
            </div>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {formatTreasuryAmount(data?.summary.count ?? 0)} حركة
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <article className="rounded-xl border border-border/50 bg-paper-2/60 p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ArrowUpCircle size={15} className="text-teal" /> إجمالي الإيرادات العامة
              </div>
              <p className="display mt-2 text-xl text-teal tabular-nums">
                {formatTreasuryAmount(data?.summary.income ?? 0)}
              </p>
            </article>
            <article className="rounded-xl border border-border/50 bg-paper-2/60 p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ArrowDownCircle size={15} className="text-chart-3" /> إجمالي المصروفات المخصصة
              </div>
              <p className="display mt-2 text-xl text-chart-3 tabular-nums">
                {formatTreasuryAmount(data?.summary.expense ?? 0)}
              </p>
            </article>
            <article className="rounded-xl border border-border/50 bg-paper-2/60 p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Wallet size={15} className="text-primary" /> رصيد الخزنة العام
              </div>
              <p
                className={`display mt-2 text-xl tabular-nums ${
                  (data?.summary.balance ?? 0) < 0 ? "text-destructive" : "text-primary"
                }`}
              >
                {formatTreasuryAmount(data?.summary.balance ?? 0)}
              </p>
            </article>
          </div>
        </section>
      )}

      {/* Shared metric cards — exactly the same cards as the main dashboard */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="display text-lg text-ink">ملخص المصروفات حسب البنود</h2>
          <span className="text-xs text-muted-foreground">
            {isChurchWideRole ? "نفس أرقام لوحة التحكم الرئيسية" : "أرقام أسرتك فقط وفق صلاحياتك"}
          </span>
        </div>
        <FinancialSummaryCards metrics={data?.metrics ?? []} hidden={summaryCardHidden} />
      </section>

      {/* Same sector bar chart + hidden families pie as the main dashboard */}
      <FinancialCharts
        metrics={sectorChartMetrics}
        hidden={data?.hiddenFamilies ?? null}
        editable={false}
        showHidden={canManage}
      />

      {/* Family/category breakdown (read-only, scoped for family servants) */}
      <section className="space-y-3">
        <h2 className="display text-lg text-ink">تفصيل البنود حسب الأسرة</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {visibleFamilies.map((family) => {
            const metric = findFamilyMetric(allMetricRows, family.value);
            const total =
              Number(metric?.monthly ?? 0) +
              Number(metric?.study ?? 0) +
              Number(metric?.therapeutic ?? 0);
            return (
              <article key={family.value} className="paper-card !p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-ink">{family.label}</p>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                    {formatTreasuryAmount(total)}
                  </span>
                </div>
                <div className="mt-3 space-y-1.5 text-xs">
                  {FINANCIAL_METRIC_CATEGORIES.map((category) => (
                    <div
                      key={category.key}
                      className="flex items-center justify-between gap-2 text-muted-foreground"
                    >
                      <span>{category.shortLabel}</span>
                      <span className={`tabular-nums font-semibold ${category.className}`}>
                        {formatTreasuryAmount(metric?.[category.key] ?? 0)}
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between gap-2 border-t border-border/50 pt-1.5 text-muted-foreground">
                    <span>إجمالي المصروفات</span>
                    <span className="tabular-nums font-bold text-primary">
                      {formatTreasuryAmount(total)}
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Transaction form — treasurer/admin only */}
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

            {form.transaction_type === "expense" && (
              <label className="block">
                <span className="text-xs font-semibold text-muted-foreground">
                  الأسرة المستفيدة <span className="text-destructive">*</span>
                </span>
                <Select
                  value={form.saint_family}
                  onValueChange={(value) =>
                    setForm((current) => ({ ...current, saint_family: value }))
                  }
                >
                  <SelectTrigger className="mt-1 w-full rounded-xl bg-paper border border-border px-3 py-2 text-sm">
                    <SelectValue placeholder="اختر الأسرة المستفيدة" />
                  </SelectTrigger>
                  <SelectContent>
                    {TREASURY_FAMILIES.map((family) => (
                      <SelectItem key={family.value} value={family.value}>
                        {family.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
            )}

            {form.transaction_type === "income" ? (
              <label className="block">
                <span className="text-xs font-semibold text-muted-foreground">
                  التصنيف <span className="text-destructive">*</span>
                </span>
                <Input
                  value={form.category}
                  onChange={(e) =>
                    setForm((current) => ({ ...current, category: e.target.value }))
                  }
                  className="mt-1 w-full rounded-xl bg-paper border border-border px-3 py-2 text-sm"
                  placeholder="مثال: تبرعات، عشور، صندوق الخدمة..."
                  maxLength={120}
                  required
                />
              </label>
            ) : (
              <label className="block">
                <span className="text-xs font-semibold text-muted-foreground">
                  البند <span className="text-destructive">*</span>
                </span>
                <Select
                  value={form.category}
                  onValueChange={(value) =>
                    setForm((current) => ({ ...current, category: value }))
                  }
                >
                  <SelectTrigger className="mt-1 w-full rounded-xl bg-paper border border-border px-3 py-2 text-sm">
                    <SelectValue placeholder="اختر البند" />
                  </SelectTrigger>
                  <SelectContent>
                    {TREASURY_EXPENSE_CATEGORIES.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
            )}

            {form.transaction_type === "expense" && (
              <label className="block">
                <span className="text-xs font-semibold text-muted-foreground">
                  اسم الخادم / المستلم <span className="text-destructive">*</span>
                </span>
                <Input
                  value={form.recipient_name}
                  onChange={(e) =>
                    setForm((current) => ({ ...current, recipient_name: e.target.value }))
                  }
                  className="mt-1 w-full rounded-xl bg-paper border border-border px-3 py-2 text-sm"
                  placeholder="من استلم مبلغ المصروف؟"
                  maxLength={200}
                  required
                />
              </label>
            )}

            <label className="block">
              <span className="text-xs font-semibold text-muted-foreground">
                المبلغ <span className="text-destructive">*</span>
              </span>
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

            <label className="block sm:col-span-2 xl:col-span-3">
              <span className="text-xs font-semibold text-muted-foreground">
                ملاحظات الحركة - إجباري <span className="text-destructive">*</span>
              </span>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm((current) => ({ ...current, description: e.target.value }))
                }
                className="mt-1 min-h-20 w-full rounded-xl bg-paper border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                placeholder="سبب الحركة، تفاصيل المستفيد، أو مرجع المستند لمراجعة القيادة"
                maxLength={2000}
                required
              />
            </label>

            <div className="sm:col-span-2 xl:col-span-4 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                {form.transaction_type === "expense"
                  ? "سيتم خصم المبلغ من رصيد الخزنة العامة وإضافته إلى بند الأسرة تلقائيًا."
                  : "سيتم إضافة المبلغ إلى رصيد الخزنة العامة دون ربطه بأي أسرة."}
              </p>
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
            <span className="text-xs font-semibold text-muted-foreground">الأسرة / الجهة</span>
            <select
              value={filterFamily}
              onChange={(e) => setFilterFamily(e.target.value)}
              className="mt-1 w-full rounded-xl bg-paper border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">كل الأسر</option>
              {!scopedFamily && (
                <option value={GENERAL_TREASURY_FILTER}>الخزنة العامة (إيراد عام)</option>
              )}
              {visibleFamilies.map((family) => (
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
            <span className="text-xs font-semibold text-muted-foreground">البند</span>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="mt-1 w-full rounded-xl bg-paper border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">كل البنود</option>
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
              placeholder="بند / وصف / مرجع / منشئ..."
            />
          </label>
        </div>
      </section>

      {/* Transaction audit log */}
      <section className="paper-card">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="display text-lg text-ink">سجل الحركات المالية</h2>
          <span className="text-sm text-muted-foreground">
            {filteredTransactions.length} من أصل {data?.transactions.length ?? 0} حركة
          </span>
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground py-10">جارٍ تحميل الحركات المالية...</p>
        ) : filteredTransactions.length === 0 ? (
          <p className="text-center text-muted-foreground py-10">
            لا توجد حركات مطابقة للفلاتر الحالية
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[980px]">
              <thead>
                <tr className="text-muted-foreground">
                  {[
                    "م",
                    "التاريخ",
                    "النوع",
                    "الأسرة / الجهة",
                    "البند",
                    "المستلم",
                    "المبلغ",
                    "ملاحظات الحركة",
                    "بواسطة",
                    "تاريخ التسجيل",
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
                  <tr key={row.id} className="border-t border-border/50 align-top">
                    <td className="px-2 py-2 text-muted-foreground">{index + 1}</td>
                    <td className="px-2 py-2 whitespace-nowrap tabular-nums">
                      {formatDate(row.transaction_date)}
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
                    <td className="px-2 py-2 whitespace-nowrap">
                      {getTreasuryTransactionFamilyLabel(row.saint_family, row.transaction_type)}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">{row.category}</td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      {row.transaction_type === "expense" ? row.recipient_name || "—" : "—"}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap tabular-nums font-semibold">
                      {formatTreasuryAmount(row.amount)}
                    </td>
                    <td className="px-2 py-2 text-muted-foreground">
                      <div
                        className="max-w-[18rem] whitespace-normal break-words"
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
                    <td className="px-2 py-2 whitespace-nowrap text-muted-foreground">
                      {row.created_by_email || "—"}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-muted-foreground text-xs">
                      {formatDateTime(row.created_at)}
                    </td>
                    {canManage && (
                      <td className="px-2 py-2">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => startEdit(row)}
                            disabled={!canEditTransaction(row)}
                            className="flex items-center justify-center min-h-8 min-w-8 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 disabled:opacity-40"
                            aria-label="تعديل الحركة"
                            title={
                              canEditTransaction(row)
                                ? "تعديل الحركة"
                                : "بند قديم غير مرتبط ببنود الخزنة الحالية"
                            }
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

      {!canManage && (
        <p className="text-center text-xs text-muted-foreground">
          هذه الواجهة للعرض فقط لخادم الأسرة. تسجيل وتعديل الحركات متاح لخادم الصندوق والمسؤولين.
        </p>
      )}
    </div>
  );
}

function formCategoryValues(): string[] {
  return TREASURY_EXPENSE_CATEGORIES.map((category) => category.value);
}
