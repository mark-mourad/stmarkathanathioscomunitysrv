import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  getInventory,
  updateInventory,
  getSuppliesInventory,
  addSupplyItem,
  updateSupplyItem,
  deleteSupplyItem,
} from "@/lib/church.functions";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Package, Save, Plus, Pencil, Trash2, X, Wheat } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/inventory")({
  beforeLoad: async () => {
    return {};
  },
  head: () => ({ meta: [{ title: "المخزن" }] }),
  component: InventoryPage,
});

// ---- Food Supplies Constants ----

const SUPPLIES_CATEGORIES = [
  { value: "بروتين", label: "بروتين" },
  { value: "نشويات", label: "نشويات" },
  { value: "دهون", label: "دهون" },
  { value: "أخرى", label: "أخرى" },
];

const SUPPLIES_ITEMS: Record<string, string[]> = {
  بروتين: ["فراخ", "سمك", "لحوم"],
  نشويات: ["أرز", "مكرونة", "شعرية", "عدس", "لسان عصفور", "فاصوليا بيضاء"],
  دهون: ["زيت", "سمن"],
  أخرى: [],
};

const WEIGHT_OPTIONS = [
  "250 جرام",
  "500 جرام",
  "800 جرام",
  "1 كيلو",
  "2 كيلو",
  "5 كيلو",
  "10 كيلو",
  "20 كيلو",
  "25 كيلو",
];

// ---- Types ----

type InventoryData = {
  id: string;
  weekly_total: number;
  details: string | null;
  created_at: string;
  updated_at: string;
};

type SupplyItem = {
  id: string;
  category: string;
  item_name: string;
  quantity: number;
  weight: string | null;
  details: string | null;
  created_at: string;
  updated_at: string;
};

// ---- Main Page ----

function InventoryPage() {
  const { can, role, loading: authLoading } = useAuth();
  const canManageInventory = can("manage:inventory");
  const canManageSupplies = can("manage:supplies");
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!["SUPER_ADMIN", "ADMIN", "SUPPLY_WAREHOUSE_MANAGER"].includes(role as any)) {
      toast.error("غير مصرح لك بهذا الحقل");
      router.navigate({ to: "/" });
    }
  }, [role, authLoading]);

  if (authLoading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="paper-card">
          <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
        </div>
      </div>
    );
  }

  if (!["SUPER_ADMIN", "ADMIN", "SUPPLY_WAREHOUSE_MANAGER"].includes(role as any)) {
    return <div className="text-center py-8 text-muted-foreground">جاري التوجيه...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <h1 className="display text-2xl flex items-center gap-2">
        <Package size={28} />
        المخزن
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* RIGHT SIDE: البركة */}
        <div className="order-1">
          <BlessingSection canManageInventory={canManageInventory} />
        </div>

        {/* LEFT SIDE: مخزن التموين */}
        <div className="order-2">
          <SuppliesSection />
        </div>
      </div>
    </div>
  );
}

// ──────────────── Right Side: البركة (Existing) ────────────────

function BlessingSection({ canManageInventory }: { canManageInventory: boolean }) {
  const queryClient = useQueryClient();
  const fetchInventory = useServerFn(getInventory);
  const saveInventory = useServerFn(updateInventory);

  const [weeklyTotal, setWeeklyTotal] = useState<number>(0);
  const [details, setDetails] = useState<string>("");

  const {
    data: inventory,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<InventoryData | null>({
    queryKey: ["blessing-batch"],
    queryFn: () => fetchInventory(),
    staleTime: 0,
    refetchOnMount: "always",
  });

  useEffect(() => {
    if (inventory) {
      setWeeklyTotal(inventory.weekly_total);
      setDetails(inventory.details || "");
    } else {
      setWeeklyTotal(0);
      setDetails("");
    }
  }, [inventory]);

  const saveMutation = useMutation({
    mutationFn: (vars: { weekly_total: number; details: string | null }) =>
      saveInventory({ data: vars }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["blessing-batch"],
        refetchType: "all",
      });
      toast.success("تم حفظ البركة بنجاح");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "خطأ في الحفظ");
    },
  });

  const handleSave = () =>
    saveMutation.mutate({ weekly_total: weeklyTotal, details: details || null });

  const errorMessage = isError
    ? error instanceof Error
      ? error.message
      : "خطأ في تحميل المخزون"
    : null;

  if (isLoading) {
    return (
      <div className="paper-card">
        <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="paper-card">
      <h2 className="display text-xl mb-6 flex items-center gap-2">
        <Wheat size={24} />
        البركة
      </h2>

      {errorMessage && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 mb-6 text-center">
          <p className="text-destructive mb-3">{errorMessage}</p>
          <button onClick={() => refetch()} className="chip-dark px-6 py-2">
            إعادة المحاولة
          </button>
        </div>
      )}

      {!inventory && !errorMessage && (
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 mb-6 text-center">
          <p className="text-sm text-primary">
            لم يتم إعداد البركة بعد. يرجى إدخال البيانات أدناه.
          </p>
        </div>
      )}

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-muted-foreground mb-2">
            توتال البركة
          </label>
          <input
            type="number"
            value={weeklyTotal}
            onChange={(e) => setWeeklyTotal(Number(e.target.value))}
            min="0"
            disabled={!canManageInventory}
            className="w-full rounded-xl bg-paper px-4 py-3 outline-none focus:ring-2 focus:ring-ring text-2xl font-bold tabular-nums disabled:opacity-60"
            placeholder="أدخل العدد"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-muted-foreground mb-2">
            تفاصيل ومكونات البركة
          </label>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={5}
            disabled={!canManageInventory}
            className="w-full rounded-xl bg-paper px-4 py-3 outline-none focus:ring-2 focus:ring-ring resize-none disabled:opacity-60"
            placeholder="أدخل التفاصيل والمكونات..."
          />
        </div>

        {inventory && (
          <div className="bg-paper-2 rounded-xl p-3 text-xs text-muted-foreground">
            آخر تحديث: {new Date(inventory.updated_at).toLocaleString("ar-EG")}
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saveMutation.isPending || !canManageInventory}
            className="chip-green px-8 py-3 flex items-center gap-2 text-lg disabled:opacity-60"
          >
            <Save size={20} />
            {saveMutation.isPending ? "جاري الحفظ..." : "حفظ"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ──────────────── Left Side: مخزن التموين ────────────────

function SuppliesSection() {
  const fetchItems = useServerFn(getSuppliesInventory);
  const addItem = useServerFn(addSupplyItem);
  const updateItem = useServerFn(updateSupplyItem);
  const deleteItem = useServerFn(deleteSupplyItem);

  const [items, setItems] = useState<SupplyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [formCategory, setFormCategory] = useState("");
  const [formItem, setFormItem] = useState("");
  const [formQuantity, setFormQuantity] = useState(1);
  const [formWeight, setFormWeight] = useState("");
  const [formDetails, setFormDetails] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchItems();
      setItems(data as SupplyItem[]);
    } catch {
      toast.error("خطأ في جلب المخزون");
    } finally {
      setLoading(false);
    }
  }, [fetchItems]);

  useEffect(() => {
    reload();
  }, [reload]);

  function openAdd() {
    setModalMode("add");
    setEditingId(null);
    setFormCategory("");
    setFormItem("");
    setFormQuantity(1);
    setFormWeight("");
    setFormDetails("");
    setModalOpen(true);
  }

  function openEdit(item: SupplyItem) {
    setModalMode("edit");
    setEditingId(item.id);
    setFormCategory(item.category);
    setFormItem(item.item_name);
    setFormQuantity(item.quantity);
    setFormWeight(item.weight ?? "");
    setFormDetails(item.details ?? "");
    setModalOpen(true);
  }

  async function handleSubmit() {
    if (!formCategory) return toast.error("يرجى اختيار التصنيف");
    if (!formItem) return toast.error("يرجى اختيار اسم الصنف");
    if (formQuantity < 0) return toast.error("العدد لا يمكن أن يكون سالباً");

    setBusy(true);
    try {
      if (modalMode === "add") {
        await addItem({
          data: {
            category: formCategory,
            item_name: formItem,
            quantity: formQuantity,
            weight: formWeight || null,
            details: formDetails || null,
          },
        });
        toast.success("تم إضافة الصنف بنجاح");
      } else if (editingId) {
        await updateItem({
          data: {
            id: editingId,
            category: formCategory,
            item_name: formItem,
            quantity: formQuantity,
            weight: formWeight || null,
            details: formDetails || null,
          },
        });
        toast.success("تم تحديث الصنف بنجاح");
      }
      setModalOpen(false);
      await reload();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteItem({ data: { id } });
      toast.success("تم حذف الصنف");
      await reload();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "فشل الحذف");
    }
  }

  return (
    <div className="paper-card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="display text-xl flex items-center gap-2">
          <Package size={24} />
          مخزن التموين
        </h2>
        <button onClick={openAdd} className="chip-green px-5 py-2 text-sm flex items-center gap-1">
          <Plus size={16} /> إضافة صنف
        </button>
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground py-8">جارٍ التحميل...</p>
      ) : items.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-3">لا توجد أصناف في مخزن التموين</p>
          <button
            onClick={openAdd}
            className="chip-green px-5 py-2 text-sm flex items-center gap-1 mx-auto"
          >
            <Plus size={16} /> إضافة أول صنف
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-muted-foreground">
                {["م", "التصنيف", "اسم الصنف", "العدد", "الوزن", "التفاصيل", ""].map((h) => (
                  <th
                    key={h}
                    className="px-2 py-2 text-start font-semibold border-b border-border whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={item.id} className="border-b border-border/60 hover:bg-primary/5">
                  <td className="px-2 py-2 text-muted-foreground">{i + 1}</td>
                  <td className="px-2 py-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-bold ${
                        item.category === "بروتين"
                          ? "bg-red-100 text-red-700"
                          : item.category === "نشويات"
                            ? "bg-amber-100 text-amber-700"
                            : item.category === "دهون"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {item.category}
                    </span>
                  </td>
                  <td className="px-2 py-2 font-semibold">{item.item_name}</td>
                  <td className="px-2 py-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-bold ${
                        item.quantity > 0
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {item.quantity}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-muted-foreground">{item.weight ?? "—"}</td>
                  <td className="px-2 py-2 text-muted-foreground max-w-[120px] truncate">
                    {item.details ?? "—"}
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(item)}
                        className="p-1 rounded hover:bg-primary/10 text-muted-foreground"
                        title="تعديل"
                      >
                        <Pencil size={14} />
                      </button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
                            className="p-1 rounded hover:bg-destructive/10 text-destructive"
                            title="حذف"
                          >
                            <Trash2 size={14} />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>حذف الصنف</AlertDialogTitle>
                            <AlertDialogDescription>
                              سيتم حذف "{item.item_name}" من مخزن التموين نهائياً. لا يمكن التراجع
                              عن هذا الإجراء.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(item.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              حذف
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="paper-card w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="display text-xl">
                {modalMode === "add" ? "إضافة صنف جديد" : "تعديل الصنف"}
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded hover:bg-muted">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              {/* Category */}
              <label className="block">
                <span className="text-sm font-semibold text-muted-foreground">
                  التصنيف <span className="text-destructive">*</span>
                </span>
                <select
                  value={formCategory}
                  onChange={(e) => {
                    setFormCategory(e.target.value);
                    setFormItem("");
                  }}
                  className="mt-1 w-full rounded-xl bg-paper border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">اختر التصنيف...</option>
                  {SUPPLIES_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>

              {/* Item (cascading) */}
              <label className="block">
                <span className="text-sm font-semibold text-muted-foreground">
                  اسم الصنف <span className="text-destructive">*</span>
                </span>
                {formCategory && SUPPLIES_ITEMS[formCategory]?.length > 0 ? (
                  <select
                    value={formItem}
                    onChange={(e) => setFormItem(e.target.value)}
                    className="mt-1 w-full rounded-xl bg-paper border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">اختر الصنف...</option>
                    {SUPPLIES_ITEMS[formCategory].map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={formItem}
                    onChange={(e) => setFormItem(e.target.value)}
                    placeholder={formCategory ? "أدخل اسم الصنف..." : "اختر التصنيف أولاً"}
                    disabled={!formCategory}
                    className="mt-1 w-full rounded-xl bg-paper border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                  />
                )}
              </label>

              {/* Quantity */}
              <label className="block">
                <span className="text-sm font-semibold text-muted-foreground">
                  العدد <span className="text-destructive">*</span>
                </span>
                <input
                  type="number"
                  value={formQuantity}
                  onChange={(e) => setFormQuantity(Number(e.target.value))}
                  min="0"
                  className="mt-1 w-full rounded-xl bg-paper border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring tabular-nums"
                  placeholder="أدخل العدد"
                />
              </label>

              {/* Weight */}
              <label className="block">
                <span className="text-sm font-semibold text-muted-foreground">الوزن / الكمية</span>
                <select
                  value={formWeight}
                  onChange={(e) => setFormWeight(e.target.value)}
                  className="mt-1 w-full rounded-xl bg-paper border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">اختر الوزن...</option>
                  {WEIGHT_OPTIONS.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </label>

              {/* Details */}
              <label className="block">
                <span className="text-sm font-semibold text-muted-foreground">
                  ملاحظات (اختياري)
                </span>
                <textarea
                  value={formDetails}
                  onChange={(e) => setFormDetails(e.target.value)}
                  rows={2}
                  placeholder="أي ملاحظات أو تفاصيل إضافية..."
                  className="mt-1 w-full rounded-xl bg-paper border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </label>
            </div>

            <div className="flex gap-3 mt-6 justify-end">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-full bg-muted text-foreground text-sm"
              >
                إلغاء
              </button>
              <button
                onClick={handleSubmit}
                disabled={busy}
                className="chip-green px-6 py-2 text-sm disabled:opacity-60"
              >
                {busy ? "جارٍ الحفظ..." : modalMode === "add" ? "إضافة" : "تحديث"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
