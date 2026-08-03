import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  getClothesRequests,
  createClothesRequest,
  updateClothesRequest,
  deleteClothesRequest,
  getChildrenByFamily,
} from "@/lib/church.functions";
import { useAuth } from "@/hooks/use-auth";
import { getVisibleSaintFamilyValues } from "@/lib/permissions";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Eye, X } from "lucide-react";
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

export const Route = createFileRoute("/_authenticated/clothes")({
  head: () => ({ meta: [{ title: "ملابس الأعياد والمدارس" }] }),
  component: ClothesPage,
});

const SAINT_FAMILIES = [
  { value: "مرقس", label: "أسرة القديس مرقس" },
  { value: "يوحنا", label: "أسرة القديس يوحنا" },
  { value: "لوقا", label: "أسرة القديس لوقا" },
  { value: "متى", label: "أسرة القديس متى" },
  { value: "أسر مستترة", label: "الأسر المستترة" },
];

const REQUEST_CATEGORIES = [
  { value: "holiday", label: "لبس عيد" },
  { value: "school", label: "لبس مدرسة" },
];

const T_SHIRT_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL", "24", "26", "28", "30", "32", "34", "36", "38", "40"];
const PANTS_SIZES = ["24", "26", "28", "30", "32", "34", "36", "38", "40", "42", "44", "XS", "S", "M", "L", "XL", "XXL"];
const SHOE_SIZES = Array.from({ length: 27 }, (_, i) => String(i + 20));

type ClothesRequest = {
  id: string;
  individual_id: string;
  family_member_id: string | null;
  saint_family: string;
  request_category: string;
  school_name: string | null;
  t_shirt_size: string | null;
  pants_size: string | null;
  shoe_size: string | null;
  notes: string | null;
  created_at: string;
  individuals?: { id: string; full_name: string; saint_family: string } | null;
  family_members?: { id: string; full_name: string; relation: string } | null;
};

type ChildOption = {
  id: string;
  full_name: string;
  relation: string;
  parent_name: string;
  individual_id: string;
};

function ClothesPage() {
  const { can, role } = useAuth();
  const router = useRouter();
  const clothesRestricted = ["SUPPLY_WAREHOUSE_MANAGER", "FURNITURE_WAREHOUSE_MANAGER", "PHARMACY_WAREHOUSE_MANAGER", "BRIDE_AND_MEDICAL_AIDS_MANAGER", "BLESSING_DISTRIBUTOR"];

  useEffect(() => {
    if (clothesRestricted.includes(role as any)) {
      toast.error("غير مصرح لك بهذا الحقل");
      router.navigate({ to: "/" });
    }
  }, [role]);

  if (clothesRestricted.includes(role as any)) {
    return <div className="text-center py-8 text-muted-foreground">جاري التوجيه...</div>;
  }
  const fetchRequests = useServerFn(getClothesRequests);
  const createReq = useServerFn(createClothesRequest);
  const updateReq = useServerFn(updateClothesRequest);
  const deleteReq = useServerFn(deleteClothesRequest);
  const fetchChildren = useServerFn(getChildrenByFamily);

  const visibleFamilies = SAINT_FAMILIES.filter((f) =>
    getVisibleSaintFamilyValues(role).includes(f.value),
  );
  const familyLocked = visibleFamilies.length === 1;

  const [requests, setRequests] = useState<ClothesRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterFamily, setFilterFamily] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Form state
  const [formFamily, setFormFamily] = useState("");
  const [formChild, setFormChild] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formSchoolName, setFormSchoolName] = useState("");
  const [formTShirtSize, setFormTShirtSize] = useState("");
  const [formPantsSize, setFormPantsSize] = useState("");
  const [formShoeSize, setFormShoeSize] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [children, setChildren] = useState<ChildOption[]>([]);
  const [childrenLoading, setChildrenLoading] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchRequests();
      setRequests(data as ClothesRequest[]);
    } catch {
      toast.error("خطأ في جلب طلبات الملابس");
    } finally {
      setLoading(false);
    }
  }, [fetchRequests]);

  useEffect(() => {
    reload();
  }, [reload]);

  async function handleFamilyChange(family: string) {
    setFormFamily(family);
    setFormChild("");
    if (!family) {
      setChildren([]);
      return;
    }
    setChildrenLoading(true);
    try {
      const data = await fetchChildren({ data: { saint_family: family } });
      setChildren(data as ChildOption[]);
    } catch {
      setChildren([]);
    } finally {
      setChildrenLoading(false);
    }
  }

  function openAddModal() {
    setModalMode("add");
    setEditingId(null);
    setFormChild("");
    setFormCategory("");
    setFormSchoolName("");
    setFormTShirtSize("");
    setFormPantsSize("");
    setFormShoeSize("");
    setFormNotes("");
    setChildren([]);
    setModalOpen(true);
    if (familyLocked) {
      handleFamilyChange(visibleFamilies[0].value);
    } else {
      setFormFamily("");
    }
  }

  function openEditModal(req: ClothesRequest) {
    setModalMode("edit");
    setEditingId(req.id);
    setFormFamily(req.saint_family);
    setFormCategory(req.request_category);
    setFormSchoolName(req.school_name ?? "");
    setFormTShirtSize(req.t_shirt_size ?? "");
    setFormPantsSize(req.pants_size ?? "");
    setFormShoeSize(req.shoe_size ?? "");
    setFormNotes(req.notes ?? "");
    // Load children for this family first
    handleFamilyChange(req.saint_family).then(() => {
      setFormChild(req.family_member_id ?? req.individual_id);
    });
    setModalOpen(true);
  }

  function openViewModal(req: ClothesRequest) {
    setModalMode("view");
    setEditingId(req.id);
    setFormFamily(req.saint_family);
    setFormCategory(req.request_category);
    setFormSchoolName(req.school_name ?? "");
    setFormTShirtSize(req.t_shirt_size ?? "");
    setFormPantsSize(req.pants_size ?? "");
    setFormShoeSize(req.shoe_size ?? "");
    setFormNotes(req.notes ?? "");
    setFormChild(req.family_member_id ?? req.individual_id);
    setChildren([]);
    setModalOpen(true);
  }

  async function handleSubmit() {
    if (!formFamily) return toast.error("يرجى اختيار الأسرة");
    if (!formCategory) return toast.error("يرجى اختيار نوع الطلب");
    if (!formChild) return toast.error("يرجى اختيار الابن/الابنة");

    setBusy(true);
    try {
      const payload = {
        saint_family: formFamily,
        request_category: formCategory as "holiday" | "school",
        school_name: formCategory === "school" ? formSchoolName : null,
        t_shirt_size: formTShirtSize || null,
        pants_size: formPantsSize || null,
        shoe_size: formShoeSize || null,
        notes: formNotes || null,
        individual_id: children.find((c) => c.id === formChild)?.individual_id ?? "",
        family_member_id: formChild,
      };

      if (modalMode === "add") {
        await createReq({ data: payload });
        toast.success("تم حفظ طلب الملابس");
      } else if (modalMode === "edit" && editingId) {
        await updateReq({ data: { ...payload, id: editingId } });
        toast.success("تم تحديث طلب الملابس");
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
      await deleteReq({ data: { id } });
      toast.success("تم حذف طلب الملابس");
      await reload();
    } catch (err: any) {
      toast.error(err?.message ?? "فشل الحذف");
    }
  }

  // Filter requests
  const filtered = requests.filter((r) => {
    if (filterFamily && r.saint_family !== filterFamily) return false;
    if (filterCategory && r.request_category !== filterCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const name = r.individuals?.full_name?.toLowerCase() ?? "";
      const childName = r.family_members?.full_name?.toLowerCase() ?? "";
      if (!name.includes(q) && !childName.includes(q)) return false;
    }
    return true;
  });

  const categoryLabel = (cat: string) => cat === "holiday" ? "لبس عيد" : "لبس مدرسة";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="display text-2xl text-ink">ملابس الأعياد والمدارس</h1>
        <button onClick={openAddModal} className="chip-green px-5 py-2 text-sm flex items-center gap-1">
          <Plus size={16} /> إضافة طلب ملابس
        </button>
      </div>

      {/* Filters */}
      <div className="paper-card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <label className="block">
            <span className="text-xs font-semibold text-muted-foreground">بحث بالاسم</span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="اسم المخدوم أو الابن..."
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
              <option value="">الكل</option>
              {visibleFamilies.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-muted-foreground">نوع الطلب</span>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="mt-1 w-full rounded-xl bg-paper border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">الكل</option>
              {REQUEST_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </label>
          <div className="flex items-end">
            <span className="text-sm text-muted-foreground">{filtered.length} طلب</span>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="paper-card">
        {loading ? (
          <p className="text-center text-muted-foreground py-8">جارٍ التحميل...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">لا توجد طلبات مسجلة</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-muted-foreground">
                  {["م", "الأسرة", "المخدوم", "الابن/الابنة", "صلة القرابة", "نوع الطلب", "اسم المدرسة", "تي شيرت", "بنطلون", "كوتشي", "ملاحظات", ""].map((h) => (
                    <th key={h} className="px-2 py-2 text-start font-semibold border-b border-border whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={r.id} className="border-b border-border/60 hover:bg-primary/5">
                    <td className="px-2 py-2 text-muted-foreground">{i + 1}</td>
                    <td className="px-2 py-2">{r.saint_family}</td>
                    <td className="px-2 py-2">{r.individuals?.full_name ?? "—"}</td>
                    <td className="px-2 py-2">{r.family_members?.full_name ?? "—"}</td>
                    <td className="px-2 py-2">{r.family_members?.relation ?? "—"}</td>
                    <td className="px-2 py-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${r.request_category === "holiday" ? "bg-sky/20 text-sky" : "bg-teal/20 text-teal"}`}>
                        {categoryLabel(r.request_category)}
                      </span>
                    </td>
                    <td className="px-2 py-2">{r.school_name ?? "—"}</td>
                    <td className="px-2 py-2">{r.t_shirt_size ?? "—"}</td>
                    <td className="px-2 py-2">{r.pants_size ?? "—"}</td>
                    <td className="px-2 py-2">{r.shoe_size ?? "—"}</td>
                    <td className="px-2 py-2 text-muted-foreground max-w-[120px] truncate">{r.notes ?? ""}</td>
                    <td className="px-2 py-2">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openViewModal(r)} className="p-1 rounded hover:bg-primary/10 text-muted-foreground" title="عرض">
                          <Eye size={14} />
                        </button>
                        <>
                          <button onClick={() => openEditModal(r)} className="p-1 rounded hover:bg-primary/10 text-muted-foreground" title="تعديل">
                            <Pencil size={14} />
                          </button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button className="p-1 rounded hover:bg-destructive/10 text-destructive" title="حذف">
                                <Trash2 size={14} />
                              </button>
                            </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>حذف طلب الملابس</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    سيتم حذف هذا الطلب نهائياً. لا يمكن التراجع عن هذا الإجراء.
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
                          </>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit/View Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="paper-card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="display text-xl">
                {modalMode === "add" ? "إضافة طلب ملابس" : modalMode === "edit" ? "تعديل طلب ملابس" : "عرض طلب الملابس"}
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded hover:bg-muted">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Family Selection */}
              <label className="block">
                <span className="text-sm font-semibold text-muted-foreground">
                  الأسرة <span className="text-destructive">*</span>
                </span>
                <select
                  value={formFamily}
                  onChange={(e) => handleFamilyChange(e.target.value)}
                  disabled={modalMode === "view" || familyLocked}
                  className="mt-1 w-full rounded-xl bg-paper border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">{familyLocked ? "" : "اختر الأسرة..."}</option>
                  {visibleFamilies.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </label>

              {/* Child Selection */}
              <label className="block">
                <span className="text-sm font-semibold text-muted-foreground">
                  الابن/الابنة <span className="text-destructive">*</span>
                </span>
                <select
                  value={formChild}
                  onChange={(e) => setFormChild(e.target.value)}
                  disabled={modalMode === "view" || !formFamily}
                  className="mt-1 w-full rounded-xl bg-paper border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">
                    {childrenLoading ? "جارٍ التحميل..." : !formFamily ? "اختر الأسرة أولاً" : "اختر الابن/الابنة..."}
                  </option>
                  {children.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name} ({c.parent_name} - {c.relation})
                    </option>
                  ))}
                </select>
              </label>

              {/* Category Selection */}
              <div>
                <span className="text-sm font-semibold text-muted-foreground">
                  نوع الطلب <span className="text-destructive">*</span>
                </span>
                <div className="mt-2 flex gap-4">
                  {REQUEST_CATEGORIES.map((c) => (
                    <label
                      key={c.value}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl border cursor-pointer transition ${
                        formCategory === c.value
                          ? "bg-primary/10 border-primary text-primary"
                          : "bg-paper border-border hover:bg-primary/5"
                      } ${modalMode === "view" ? "pointer-events-none opacity-70" : ""}`}
                    >
                      <input
                        type="radio"
                        name="category"
                        value={c.value}
                        checked={formCategory === c.value}
                        onChange={(e) => setFormCategory(e.target.value)}
                        disabled={modalMode === "view"}
                        className="accent-[color:var(--color-primary)]"
                      />
                      <span className="text-sm font-semibold">{c.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Conditional School Name */}
              {formCategory === "school" && (
                <label className="block">
                  <span className="text-sm font-semibold text-muted-foreground">اسم المدرسة</span>
                  <input
                    value={formSchoolName}
                    onChange={(e) => setFormSchoolName(e.target.value)}
                    disabled={modalMode === "view"}
                    placeholder="أدخل اسم المدرسة"
                    className="mt-1 w-full rounded-xl bg-paper border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </label>
              )}

              {/* Size Dropdowns */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className="block">
                  <span className="text-sm font-semibold text-muted-foreground">مقاس التي شيرت</span>
                  <select
                    value={formTShirtSize}
                    onChange={(e) => setFormTShirtSize(e.target.value)}
                    disabled={modalMode === "view"}
                    className="mt-1 w-full rounded-xl bg-paper border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">اختر المقاس...</option>
                    {T_SHIRT_SIZES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-muted-foreground">مقاس البنطلون</span>
                  <select
                    value={formPantsSize}
                    onChange={(e) => setFormPantsSize(e.target.value)}
                    disabled={modalMode === "view"}
                    className="mt-1 w-full rounded-xl bg-paper border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">اختر المقاس...</option>
                    {PANTS_SIZES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-muted-foreground">مقاس الكوتشي</span>
                  <select
                    value={formShoeSize}
                    onChange={(e) => setFormShoeSize(e.target.value)}
                    disabled={modalMode === "view"}
                    className="mt-1 w-full rounded-xl bg-paper border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">اختر المقاس...</option>
                    {SHOE_SIZES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </label>
              </div>

              {/* Notes */}
              <label className="block">
                <span className="text-sm font-semibold text-muted-foreground">ملاحظات</span>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  disabled={modalMode === "view"}
                  rows={2}
                  className="mt-1 w-full rounded-xl bg-paper border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </label>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6 justify-end">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-full bg-muted text-foreground text-sm">
                {modalMode === "view" ? "إغلاق" : "إلغاء"}
              </button>
              {modalMode !== "view" && (
                <button
                  onClick={handleSubmit}
                  disabled={busy}
                  className="chip-green px-6 py-2 text-sm disabled:opacity-60"
                >
                  {busy ? "جارٍ الحفظ..." : modalMode === "add" ? "حفظ" : "تحديث"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
