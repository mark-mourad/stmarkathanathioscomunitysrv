import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  getPharmacyInventory,
  addPharmacyInventoryItem,
  updatePharmacyInventoryItem,
  deletePharmacyInventoryItem,
  getPharmacyRequests,
  getMyPharmacyRequests,
  createPharmacyRequest,
  updatePharmacyRequestStatus,
  deletePharmacyRequest,
  getPharmacyBeneficiaries,
} from "@/lib/church.functions";
import { useAuth } from "@/hooks/use-auth";
import { getVisibleSaintFamilyValues } from "@/lib/permissions";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X, Check, Ban, Pill, Package, ClipboardList } from "lucide-react";
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

export const Route = createFileRoute("/_authenticated/pharmacy")({
  head: () => ({ meta: [{ title: "الصيدلية" }] }),
  component: PharmacyPage,
});

const SAINT_FAMILIES = [
  { value: "متى", label: "أسرة القديس متى" },
  { value: "مرقس", label: "أسرة القديس مرقس" },
  { value: "لوقا", label: "أسرة القديس لوقا" },
  { value: "يوحنا", label: "أسرة القديس يوحنا" },
  { value: "أسر مستترة", label: "الأسرة المستترة" },
];

const DISEASE_CATEGORIES = [
  { value: "قلب", label: "أمراض القلب" },
  { value: "سكر", label: "أمراض السكر" },
  { value: "ضغط", label: "أمراض الضغط" },
  { value: "صدر", label: "أمراض الصدر" },
  { value: "كلى", label: "أمراض الكلى" },
  { value: "عظام", label: "أمراض العظام" },
  { value: "جلدية", label: "أمراض جلدية" },
  { value: "عيون", label: "أمراض العيون" },
  { value: "نفسي", label: "أمراض نفسية" },
  { value: "أخرى", label: "أخرى" },
];

const UNIT_TYPES = [
  { value: "علبة", label: "علبة" },
  { value: "شريط", label: "شريط" },
  { value: "حقنة/أمبول", label: "حقنة/أمبول" },
  { value: "أخرى", label: "أخرى" },
];

const STATUS_STYLES: Record<string, string> = {
  "تحت المراجعة": "bg-amber-100 text-amber-700 border border-amber-200",
  مقبول: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  مرفوض: "bg-red-100 text-red-700 border border-red-200",
};

type Beneficiary = { id: string; full_name: string; display_name: string };

type InventoryItem = {
  id: string;
  disease_category: string;
  custom_disease_name: string | null;
  medicine_name: string;
  quantity: number;
  unit_type: string;
  details: string | null;
  created_at: string;
};

type RequestItem = {
  id: string;
  family_name: string;
  beneficiary_id: string | null;
  beneficiary_name: string;
  disease_category: string;
  custom_disease_name: string | null;
  medicine_name: string;
  requested_quantity: number;
  status: string;
  details: string | null;
  requested_by: string | null;
  created_at: string;
};

function PharmacyPage() {
  const { can, role } = useAuth();
  const router = useRouter();
  const pharmRestricted = ["SUPPLY_WAREHOUSE_MANAGER", "FURNITURE_WAREHOUSE_MANAGER", "BRIDE_AND_MEDICAL_AIDS_MANAGER", "BLESSING_DISTRIBUTOR"];

  useEffect(() => {
    if (pharmRestricted.includes(role as any)) {
      toast.error("غير مصرح لك بهذا الحقل");
      router.navigate({ to: "/" });
    }
  }, [role]);

  if (pharmRestricted.includes(role as any)) {
    return <div className="text-center py-8 text-muted-foreground">جاري التوجيه...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="display text-2xl text-ink flex items-center gap-2">
        <Pill size={28} /> الصيدلية
      </h1>
      {role !== "PHARMACY_WAREHOUSE_MANAGER" && <ViewerRequestSection />}
      {can("manage:pharmacy") && <AdminSection />}
    </div>
  );
}

// ──────────────── Viewer: Medication Request + Tracking ────────────────

function ViewerRequestSection() {
  const { role } = useAuth();
  const fetchMyRequests = useServerFn(getMyPharmacyRequests);
  const createReq = useServerFn(createPharmacyRequest);
  const fetchBeneficiaries = useServerFn(getPharmacyBeneficiaries);

  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formFamily, setFormFamily] = useState("");
  const [formBeneficiary, setFormBeneficiary] = useState("");
  const [formDiseaseCategory, setFormDiseaseCategory] = useState("");
  const [formCustomDisease, setFormCustomDisease] = useState("");
  const [formMedicineName, setFormMedicineName] = useState("");
  const [formQuantity, setFormQuantity] = useState(1);
  const [formDetails, setFormDetails] = useState("");
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [benefLoading, setBenefLoading] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchMyRequests();
      setRequests(data as RequestItem[]);
    } catch {
      toast.error("خطأ في جلب طلباتك");
    } finally {
      setLoading(false);
    }
  }, [fetchMyRequests]);

  useEffect(() => {
    reload();
  }, [reload]);

  async function handleFamilyChange(val: string) {
    setFormFamily(val);
    setFormBeneficiary("");
    setBeneficiaries([]);
    if (!val) return;
    setBenefLoading(true);
    try {
      const data = await fetchBeneficiaries({ data: { family_name: val } });
      setBeneficiaries(data as Beneficiary[]);
    } catch {
      setBeneficiaries([]);
    } finally {
      setBenefLoading(false);
    }
  }

  const visibleFamilies = SAINT_FAMILIES.filter((f) =>
    getVisibleSaintFamilyValues(role).includes(f.value),
  );
  const familyLocked = visibleFamilies.length === 1;

  function openForm() {
    setFormBeneficiary("");
    setFormDiseaseCategory("");
    setFormCustomDisease("");
    setFormMedicineName("");
    setFormQuantity(1);
    setFormDetails("");
    setBeneficiaries([]);
    setFormOpen(true);
    if (familyLocked) {
      handleFamilyChange(visibleFamilies[0].value);
    } else {
      setFormFamily("");
    }
  }

  async function handleSubmit() {
    if (!formFamily) return toast.error("يرجى اختيار الأسرة");
    if (!formBeneficiary) return toast.error("يرجى اختيار المخدوم");
    if (!formDiseaseCategory) return toast.error("يرجى اختيار التصنيف المرضي");
    if (formDiseaseCategory === "أخرى" && !formCustomDisease)
      return toast.error("يرجى إدخال اسم المرض");
    if (!formMedicineName) return toast.error("يرجى إدخال اسم الدواء");
    if (formQuantity < 1) return toast.error("الكمية يجب أن تكون 1 على الأقل");

    const benef = beneficiaries.find((b) => b.id === formBeneficiary);
    setBusy(true);
    try {
      await createReq({
        data: {
          family_name: formFamily,
          beneficiary_id: formBeneficiary,
          beneficiary_name: benef?.full_name ?? "",
          disease_category: formDiseaseCategory,
          custom_disease_name: formDiseaseCategory === "أخرى" ? formCustomDisease : null,
          medicine_name: formMedicineName,
          requested_quantity: formQuantity,
          details: formDetails || null,
        },
      });
      toast.success("تم إرسال الطلب بنجاح");
      setFormOpen(false);
      await reload();
    } catch (err: any) {
      toast.error(err?.message ?? "حدث خطأ");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="display text-lg text-ink flex items-center gap-2">
          <ClipboardList size={20} /> طلب الأدوية
        </h2>
        <button onClick={openForm} className="chip-green px-5 py-2 text-sm flex items-center gap-1">
          <Plus size={16} /> طلب دواء
        </button>
      </div>

      <div className="paper-card">
        {loading ? (
          <p className="text-center text-muted-foreground py-8">جارٍ التحميل...</p>
        ) : requests.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">لم تقم بإرسال أي طلبات بعد</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-muted-foreground">
                  {[
                    "م",
                    "الأسرة",
                    "المخدوم",
                    "المرض",
                    "الدواء",
                    "الكمية",
                    "الحالة",
                    "التاريخ",
                  ].map((h) => (
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
                {requests.map((r, i) => (
                  <tr key={r.id} className="border-b border-border/60 hover:bg-primary/5">
                    <td className="px-2 py-2 text-muted-foreground">{i + 1}</td>
                    <td className="px-2 py-2">
                      {SAINT_FAMILIES.find((f) => f.value === r.family_name)?.label ??
                        r.family_name}
                    </td>
                    <td className="px-2 py-2">{r.beneficiary_name}</td>
                    <td className="px-2 py-2">
                      {r.disease_category === "أخرى"
                        ? r.custom_disease_name ?? "أخرى"
                        : DISEASE_CATEGORIES.find((d) => d.value === r.disease_category)
                            ?.label ?? r.disease_category}
                    </td>
                    <td className="px-2 py-2 font-semibold">{r.medicine_name}</td>
                    <td className="px-2 py-2">{r.requested_quantity}</td>
                    <td className="px-2 py-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[r.status] ?? ""}`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-muted-foreground text-xs whitespace-nowrap">
                      {new Date(r.created_at).toLocaleDateString("ar-EG")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {formOpen && (
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="paper-card w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="display text-xl">طلب دواء</h3>
              <button onClick={() => setFormOpen(false)} className="p-1 rounded hover:bg-muted">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-semibold text-muted-foreground">
                  الأسرة <span className="text-destructive">*</span>
                </span>
                <select
                  value={formFamily}
                  onChange={(e) => handleFamilyChange(e.target.value)}
                  disabled={familyLocked}
                  className="mt-1 w-full rounded-xl bg-paper border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">{familyLocked ? "" : "اختر الأسرة..."}</option>
                  {visibleFamilies.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-muted-foreground">
                  المخدوم <span className="text-destructive">*</span>
                </span>
                <select
                  value={formBeneficiary}
                  onChange={(e) => setFormBeneficiary(e.target.value)}
                  disabled={!formFamily}
                  className="mt-1 w-full rounded-xl bg-paper border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">
                    {benefLoading
                      ? "جارٍ التحميل..."
                      : !formFamily
                        ? "اختر الأسرة أولاً"
                        : "اختر المخدوم..."}
                  </option>
                  {beneficiaries.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.display_name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-muted-foreground">
                  التصنيف المرضي <span className="text-destructive">*</span>
                </span>
                <select
                  value={formDiseaseCategory}
                  onChange={(e) => {
                    setFormDiseaseCategory(e.target.value);
                    setFormCustomDisease("");
                  }}
                  className="mt-1 w-full rounded-xl bg-paper border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">اختر التصنيف...</option>
                  {DISEASE_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>

              {formDiseaseCategory === "أخرى" && (
                <label className="block">
                  <span className="text-sm font-semibold text-muted-foreground">
                    اسم المرض <span className="text-destructive">*</span>
                  </span>
                  <input
                    type="text"
                    value={formCustomDisease}
                    onChange={(e) => setFormCustomDisease(e.target.value)}
                    placeholder="أدخل اسم المرض..."
                    className="mt-1 w-full rounded-xl bg-paper border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </label>
              )}

              <label className="block">
                <span className="text-sm font-semibold text-muted-foreground">
                  اسم الدواء <span className="text-destructive">*</span>
                </span>
                <input
                  type="text"
                  value={formMedicineName}
                  onChange={(e) => setFormMedicineName(e.target.value)}
                  placeholder="أدخل اسم الدواء..."
                  className="mt-1 w-full rounded-xl bg-paper border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-muted-foreground">
                  الكمية المطلوبة <span className="text-destructive">*</span>
                </span>
                <input
                  type="number"
                  min={1}
                  value={formQuantity}
                  onChange={(e) => setFormQuantity(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl bg-paper border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-muted-foreground">
                  التفاصيل / ملاحظات
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
                onClick={() => setFormOpen(false)}
                className="px-4 py-2 rounded-full bg-muted text-foreground text-sm"
              >
                إلغاء
              </button>
              <button
                onClick={handleSubmit}
                disabled={busy}
                className="chip-green px-6 py-2 text-sm disabled:opacity-60"
              >
                {busy ? "جارٍ الإرسال..." : "إرسال الطلب"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

// ──────────────── Admin: Pharmacy Management (Tabs) ────────────────

function AdminSection() {
  const [tab, setTab] = useState<"inventory" | "requests">("inventory");
  return (
    <section className="space-y-4">
      <div className="flex gap-2 border-b border-border pb-2">
        <button
          onClick={() => setTab("inventory")}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
            tab === "inventory"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-foreground hover:bg-primary/10"
          }`}
        >
          <Package size={14} className="inline ms-1" />
          إدارة المخزون
        </button>
        <button
          onClick={() => setTab("requests")}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
            tab === "requests"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-foreground hover:bg-primary/10"
          }`}
        >
          <ClipboardList size={14} className="inline ms-1" />
          طلبات العلاج
        </button>
      </div>
      {tab === "inventory" ? <InventoryTab /> : <RequestsTab />}
    </section>
  );
}

// ────── Tab 1: Stock Inventory Management ──────

function InventoryTab() {
  const fetchItems = useServerFn(getPharmacyInventory);
  const addItem = useServerFn(addPharmacyInventoryItem);
  const updateItem = useServerFn(updatePharmacyInventoryItem);
  const deleteItem = useServerFn(deletePharmacyInventoryItem);

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [formDiseaseCategory, setFormDiseaseCategory] = useState("");
  const [formCustomDisease, setFormCustomDisease] = useState("");
  const [formMedicineName, setFormMedicineName] = useState("");
  const [formQuantity, setFormQuantity] = useState(1);
  const [formUnitType, setFormUnitType] = useState("علبة");
  const [formDetails, setFormDetails] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchItems();
      setItems(data as InventoryItem[]);
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
    setFormDiseaseCategory("");
    setFormCustomDisease("");
    setFormMedicineName("");
    setFormQuantity(1);
    setFormUnitType("علبة");
    setFormDetails("");
    setModalOpen(true);
  }

  function openEdit(item: InventoryItem) {
    setModalMode("edit");
    setEditingId(item.id);
    setFormDiseaseCategory(item.disease_category);
    setFormCustomDisease(item.custom_disease_name ?? "");
    setFormMedicineName(item.medicine_name);
    setFormQuantity(item.quantity);
    setFormUnitType(item.unit_type);
    setFormDetails(item.details ?? "");
    setModalOpen(true);
  }

  async function handleSubmit() {
    if (!formDiseaseCategory) return toast.error("يرجى اختيار التصنيف المرضي");
    if (formDiseaseCategory === "أخرى" && !formCustomDisease)
      return toast.error("يرجى إدخال اسم المرض");
    if (!formMedicineName) return toast.error("يرجى إدخال اسم الدواء");
    if (formQuantity < 0) return toast.error("العدد لا يمكن أن يكون سالباً");

    setBusy(true);
    try {
      const payload = {
        disease_category: formDiseaseCategory,
        custom_disease_name: formDiseaseCategory === "أخرى" ? formCustomDisease : null,
        medicine_name: formMedicineName,
        quantity: formQuantity,
        unit_type: formUnitType as "علبة" | "شريط" | "حقنة/أمبول" | "أخرى",
        details: formDetails || null,
      };

      if (modalMode === "add") {
        await addItem({ data: payload });
        toast.success("تم إضافة الصنف بنجاح");
      } else if (editingId) {
        await updateItem({ data: { ...payload, id: editingId } });
        toast.success("تم تحديث الصنف بنجاح");
      }
      setModalOpen(false);
      await reload();
    } catch (err: any) {
      toast.error(err?.message ?? "حدث خطأ");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteItem({ data: { id } });
      toast.success("تم حذف الصنف");
      await reload();
    } catch (err: any) {
      toast.error(err?.message ?? "فشل الحذف");
    }
  }

  const diseaseLabel = (cat: string, custom: string | null) => {
    if (cat === "أخرى") return custom ?? "أخرى";
    return DISEASE_CATEGORIES.find((d) => d.value === cat)?.label ?? cat;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="display text-lg text-ink">إدارة المخزون</h3>
        <button onClick={openAdd} className="chip-green px-5 py-2 text-sm flex items-center gap-1">
          <Plus size={16} /> إضافة صنف
        </button>
      </div>

      <div className="paper-card">
        {loading ? (
          <p className="text-center text-muted-foreground py-8">جارٍ التحميل...</p>
        ) : items.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">لا توجد أصناف في مخزن الصيدلية</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-muted-foreground">
                  {["م", "المرض", "اسم الدواء", "العدد", "نوع الوحدة", "التفاصيل", ""].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-2 py-2 text-start font-semibold border-b border-border whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={item.id} className="border-b border-border/60 hover:bg-primary/5">
                    <td className="px-2 py-2 text-muted-foreground">{i + 1}</td>
                    <td className="px-2 py-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-bold ${
                          item.disease_category === "أخرى"
                            ? "bg-gray-100 text-gray-700"
                            : "bg-sky/20 text-sky"
                        }`}
                      >
                        {diseaseLabel(item.disease_category, item.custom_disease_name)}
                      </span>
                    </td>
                    <td className="px-2 py-2 font-semibold">{item.medicine_name}</td>
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
                    <td className="px-2 py-2 text-muted-foreground">{item.unit_type}</td>
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
                                سيتم حذف "{item.medicine_name}" من مخزن الصيدلية نهائياً. لا يمكن
                                التراجع عن هذا الإجراء.
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
      </div>

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
              <label className="block">
                <span className="text-sm font-semibold text-muted-foreground">
                  التصنيف المرضي <span className="text-destructive">*</span>
                </span>
                <select
                  value={formDiseaseCategory}
                  onChange={(e) => {
                    setFormDiseaseCategory(e.target.value);
                    setFormCustomDisease("");
                  }}
                  className="mt-1 w-full rounded-xl bg-paper border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">اختر التصنيف...</option>
                  {DISEASE_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>

              {formDiseaseCategory === "أخرى" && (
                <label className="block">
                  <span className="text-sm font-semibold text-muted-foreground">
                    اسم المرض <span className="text-destructive">*</span>
                  </span>
                  <input
                    type="text"
                    value={formCustomDisease}
                    onChange={(e) => setFormCustomDisease(e.target.value)}
                    placeholder="أدخل اسم المرض..."
                    className="mt-1 w-full rounded-xl bg-paper border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </label>
              )}

              <label className="block">
                <span className="text-sm font-semibold text-muted-foreground">
                  اسم الدواء <span className="text-destructive">*</span>
                </span>
                <input
                  type="text"
                  value={formMedicineName}
                  onChange={(e) => setFormMedicineName(e.target.value)}
                  placeholder="أدخل اسم الدواء..."
                  className="mt-1 w-full rounded-xl bg-paper border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-muted-foreground">
                  العدد <span className="text-destructive">*</span>
                </span>
                <input
                  type="number"
                  min={0}
                  value={formQuantity}
                  onChange={(e) => setFormQuantity(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl bg-paper border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring tabular-nums"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-muted-foreground">
                  نوع الوحدة <span className="text-destructive">*</span>
                </span>
                <select
                  value={formUnitType}
                  onChange={(e) => setFormUnitType(e.target.value)}
                  className="mt-1 w-full rounded-xl bg-paper border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  {UNIT_TYPES.map((u) => (
                    <option key={u.value} value={u.value}>
                      {u.label}
                    </option>
                  ))}
                </select>
              </label>

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
                {busy ? "جارٍ الحفظ..." : modalMode === "add" ? "إضافة" : "حفظ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ────── Tab 2: Pending Requests (Approvals) ──────

function RequestsTab() {
  const { role } = useAuth();
  const fetchRequests = useServerFn(getPharmacyRequests);
  const updateStatus = useServerFn(updatePharmacyRequestStatus);
  const deleteReq = useServerFn(deletePharmacyRequest);

  const visibleFamilies = SAINT_FAMILIES.filter((f) =>
    getVisibleSaintFamilyValues(role).includes(f.value),
  );

  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterFamily, setFilterFamily] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchRequests();
      setRequests(data as RequestItem[]);
    } catch {
      toast.error("خطأ في جلب الطلبات");
    } finally {
      setLoading(false);
    }
  }, [fetchRequests]);

  useEffect(() => {
    reload();
  }, [reload]);

  async function handleStatusUpdate(id: string, status: "مقبول" | "مرفوض") {
    try {
      await updateStatus({ data: { id, status } });
      toast.success(status === "مقبول" ? "تم قبول الطلب" : "تم رفض الطلب");
      await reload();
    } catch (err: any) {
      toast.error(err?.message ?? "حدث خطأ");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteReq({ data: { id } });
      toast.success("تم حذف الطلب");
      await reload();
    } catch (err: any) {
      toast.error(err?.message ?? "فشل الحذف");
    }
  }

  const filtered = requests.filter((r) => {
    if (filterStatus && r.status !== filterStatus) return false;
    if (filterFamily && r.family_name !== filterFamily) return false;
    return true;
  });

  const diseaseLabel = (cat: string, custom: string | null) => {
    if (cat === "أخرى") return custom ?? "أخرى";
    return DISEASE_CATEGORIES.find((d) => d.value === cat)?.label ?? cat;
  };

  return (
    <div className="space-y-4">
      <h3 className="display text-lg text-ink">طلبات العلاج</h3>

      <div className="paper-card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className="block">
            <span className="text-xs font-semibold text-muted-foreground">الحالة</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="mt-1 w-full rounded-xl bg-paper border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">الكل</option>
              <option value="تحت المراجعة">تحت المراجعة</option>
              <option value="مقبول">مقبول</option>
              <option value="مرفوض">مرفوض</option>
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-muted-foreground">الأسرة</span>
            <select
              value={filterFamily}
              onChange={(e) => setFilterFamily(e.target.value)}
              className="mt-1 w-full rounded-xl bg-paper border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">الكل</option>
              {visibleFamilies.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end">
            <span className="text-sm text-muted-foreground">{filtered.length} طلب</span>
          </div>
        </div>
      </div>

      <div className="paper-card">
        {loading ? (
          <p className="text-center text-muted-foreground py-8">جارٍ التحميل...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">لا توجد طلبات</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-muted-foreground">
                  {[
                    "م",
                    "الأسرة",
                    "المخدوم",
                    "المرض",
                    "الدواء",
                    "الكمية",
                    "الحالة",
                    "التاريخ",
                    "",
                  ].map((h) => (
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
                {filtered.map((r, i) => (
                  <tr key={r.id} className="border-b border-border/60 hover:bg-primary/5">
                    <td className="px-2 py-2 text-muted-foreground">{i + 1}</td>
                    <td className="px-2 py-2">
                      {SAINT_FAMILIES.find((f) => f.value === r.family_name)?.label ??
                        r.family_name}
                    </td>
                    <td className="px-2 py-2">{r.beneficiary_name}</td>
                    <td className="px-2 py-2">
                      <span className="px-2 py-1 rounded-full text-xs font-bold bg-sky/20 text-sky">
                        {diseaseLabel(r.disease_category, r.custom_disease_name)}
                      </span>
                    </td>
                    <td className="px-2 py-2 font-semibold">{r.medicine_name}</td>
                    <td className="px-2 py-2">{r.requested_quantity}</td>
                    <td className="px-2 py-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[r.status] ?? ""}`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-muted-foreground text-xs whitespace-nowrap">
                      {new Date(r.created_at).toLocaleDateString("ar-EG")}
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex items-center gap-1">
                        {r.status === "تحت المراجعة" && (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(r.id, "مقبول")}
                              className="p-1 rounded hover:bg-emerald-100 text-emerald-600"
                              title="قبول"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(r.id, "مرفوض")}
                              className="p-1 rounded hover:bg-red-100 text-red-600"
                              title="رفض"
                            >
                              <Ban size={14} />
                            </button>
                          </>
                        )}
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
                              <AlertDialogTitle>حذف الطلب</AlertDialogTitle>
                              <AlertDialogDescription>
                                سيتم حذف طلب "{r.medicine_name}" نهائياً. لا يمكن التراجع عن هذا
                                الإجراء.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>إلغاء</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(r.id)}
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
      </div>
    </div>
  );
}
