import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { deleteIndividual, getIndividual, updateIndividual } from "@/lib/church.functions";
import { useAuth } from "@/hooks/use-auth";
import { z } from "zod";
import { ArrowRight, Pencil, Trash2, HeartHandshake, Printer } from "lucide-react";
import { toast } from "sonner";
import {
  IndividualForm,
  buildIndividualPayload,
  cleanHouseholdGoods,
  cleanFamilyConditions,
  buildInitialCustomFinancials,
  STANDARD_REVENUE_KEYS,
  STANDARD_EXPENSE_KEYS,
  type FamilyRow,
  type ChurchSupportRow,
  type HouseholdGood,
  type FamilyCondition,
  type CustomFinancialRow,
} from "@/components/individual-form";
import { AssistanceForm } from "@/components/assistance-form";
import { AssistanceHistory } from "@/components/assistance-history";
import { createAssistanceLog, getAssistanceLogs } from "@/lib/church.functions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BarcodeDisplay } from "@/components/barcode-display";
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

const individualSearchSchema = z.object({
  highlightFamilyId: z.string().uuid().optional(),
});

export const Route = createFileRoute("/_authenticated/individual/$id")({
  head: () => ({ meta: [{ title: "ملف المخدوم" }] }),
  validateSearch: (s) => individualSearchSchema.parse(s),
  component: IndividualPage,
});

const APPL = [
  ["has_washing_machine", "غسالة"],
  ["has_fridge", "ثلاجة"],
  ["has_stove", "بوتاجاز"],
  ["has_mattress", "مرتبة"],
  ["has_computer", "كمبيوتر"],
  ["has_sofa", "كنبة"],
  ["has_dining", "سفرة"],
  ["has_tv", "تلفزيون"],
  ["has_wardrobe", "دولاب"],
] as const;

function getHouseholdGoods(ind: Record<string, unknown>): HouseholdGood[] {
  const stored = cleanHouseholdGoods(ind?.household_goods);
  if (stored.length) return stored.filter((g) => g.exists);
  return APPL.filter(([k]) => ind?.[k]).map(([, l]) => ({
    item_name: l,
    exists: true,
    quantity: 1,
  }));
}

const CONDITION_CATEGORY_LABELS: Record<string, string> = {
  diseases: "أمراض",
  disabilities: "إعاقة",
  other: "ظروف أخرى",
};

function conditionCategoryLabel(category: string): string {
  return CONDITION_CATEGORY_LABELS[category] ?? "أخرى";
}

function groupConditionsByMember(items: FamilyCondition[]): Array<{ member: string; items: FamilyCondition[] }> {
  const groups: Array<{ member: string; items: FamilyCondition[] }> = [];
  const index = new Map<string, number>();
  items.forEach((c) => {
    const member = c.member_name?.trim() || "غير محدد";
    if (!index.has(member)) {
      index.set(member, groups.length);
      groups.push({ member, items: [] });
    }
    groups[index.get(member)!].items.push(c);
  });
  return groups;
}

const FIN_KEYS = [
  "church_monthly",
  "therapeutic_aid",
  "study_aid",
  "basic_salary",
  "extra_income",
  "electricity_gas_water",
  "phone_bill",
  "rent",
  "treatment_cost",
  "education_cost",
] as const;

function IndividualPage() {
  const { id } = Route.useParams();
  const { highlightFamilyId } = Route.useSearch();
  const { can, role, isAdmin } = useAuth();
  const router = useRouter();

  const individualRestrictedRoles = [
    "SUPPLY_WAREHOUSE_MANAGER",
    "FURNITURE_WAREHOUSE_MANAGER",
    "PHARMACY_WAREHOUSE_MANAGER",
    "BLESSING_DISTRIBUTOR",
  ];
  useEffect(() => {
    if (individualRestrictedRoles.includes(role as any)) {
      toast.error("غير مصرح لك بهذا الحقل");
      router.navigate({ to: "/" });
    }
  }, [role]);
  if (individualRestrictedRoles.includes(role as any)) {
    return <div className="text-center py-8 text-muted-foreground">جاري التوجيه...</div>;
  }
  const fetchOne = useServerFn(getIndividual);
  const saveOne = useServerFn(updateIndividual);
  const removeOne = useServerFn(deleteIndividual);
  const [data, setData] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [assistanceDialog, setAssistanceDialog] = useState(false);
  const [showAssistanceForm, setShowAssistanceForm] = useState(false);
  const [assistanceLogs, setAssistanceLogs] = useState<any>([]);
  const fetchAssistanceLogs = useServerFn(getAssistanceLogs);

  async function reload() {
    const d = await fetchOne({ data: { id } });
    setData(d);
  }

  useEffect(() => {
    fetchOne({ data: { id } }).then(setData).catch(() => setData(null));
  }, [id]);

  async function loadAssistanceLogs() {
    const logs = await fetchAssistanceLogs({ data: { individual_id: id } });
    setAssistanceLogs(logs);
  }

  async function handleAssistanceDialogOpen(open: boolean) {
    setAssistanceDialog(open);
    if (open) {
      setShowAssistanceForm(false);
      await loadAssistanceLogs();
    }
  }

  if (!data) return <p className="text-center text-muted-foreground">جارٍ التحميل...</p>;

  const { individual: ind, family, financials: f, churchSupport } = data;
  const householdGoods = getHouseholdGoods(ind);
  const familyConditions = cleanFamilyConditions(ind?.family_conditions);
  const conditionGroups = groupConditionsByMember(familyConditions);

  const customRevenues: CustomFinancialRow[] = buildInitialCustomFinancials(
    f?.custom_revenues,
  ).filter((r) => r.name || r.amount);
  const customExpenses: CustomFinancialRow[] = buildInitialCustomFinancials(
    f?.custom_expenses,
  ).filter((r) => r.name || r.amount);
  const totalIncome =
    sumOf(f, [...STANDARD_REVENUE_KEYS]) +
    customRevenues.reduce((s, r) => s + Number(r.amount || 0), 0);
  const totalExpenses =
    sumOf(f, [...STANDARD_EXPENSE_KEYS]) +
    customExpenses.reduce((s, r) => s + Number(r.amount || 0), 0);
  const netIncome = totalIncome - totalExpenses;

  if (editing && can("edit:beneficiary")) {
    const initialFamily: FamilyRow[] = family.length
      ? family.map((m: any) => ({
          id: m.id,
          full_name: m.full_name,
          national_id: m.national_id ?? undefined,
          relation: m.relation ?? undefined,
          relation_custom: undefined,
          insurance_number: m.insurance_number ?? undefined,
          marital_status: m.marital_status ?? undefined,
          confession_father: m.confession_father ?? undefined,
          school_or_job: m.school_or_job ?? undefined,
          income: m.income != null ? Number(m.income) : undefined,
          notes: m.notes ?? undefined,
        }))
      : [{ full_name: "" }];

    const initialFin: Record<string, number> = {};
    for (const k of FIN_KEYS) {
      initialFin[k] = Number(f?.[k] || 0);
    }

    const initialChurchSupport: ChurchSupportRow[] = churchSupport?.length
      ? churchSupport.map((cs: any) => ({
          id: cs.id,
          church_name: cs.church_name,
          amount: Number(cs.amount),
        }))
      : [];

    const initialCustomRevenues: CustomFinancialRow[] = buildInitialCustomFinancials(
      f?.custom_revenues,
    );
    const initialCustomExpenses: CustomFinancialRow[] = buildInitialCustomFinancials(
      f?.custom_expenses,
    );

    const applianceKeys = [
      "has_washing_machine", "has_fridge", "has_stove", "has_mattress",
      "has_computer", "has_sofa", "has_dining", "has_tv", "has_wardrobe",
    ] as const;
    const initialInd: Record<string, any> = {
      full_name: ind.full_name,
      nickname: ind.nickname,
      mother_name: ind.mother_name,
      gender: ind.gender,
      national_id: ind.national_id,
      birth_date: ind.birth_date,
      birth_governorate: ind.birth_governorate,
      calculated_age: ind.birth_date ? ((): number | null => {
        const parts = String(ind.birth_date).split("-");
        if (parts.length !== 3) return null;
        const y = parseInt(parts[0], 10), m = parseInt(parts[1], 10), d = parseInt(parts[2], 10);
        const birth = new Date(y, m - 1, d);
        const now = new Date();
        let age = now.getFullYear() - birth.getFullYear();
        const md = now.getMonth() - birth.getMonth();
        if (md < 0 || (md === 0 && now.getDate() < birth.getDate())) age--;
        return age;
      })() : null,
      job: ind.job,
      salary: ind.salary,
      wife_mobile: ind.wife_mobile,
      husband_mobile: ind.husband_mobile,
      landline: ind.landline,
      confession_father: ind.confession_father,
      saint_family: ind.saint_family,
      address: ind.address,
      household_count: ind.household_count,
      housing_type: ind.housing_type,
      rooms: ind.rooms,
      has_alt_address: ind.has_alt_address,
      alt_address: ind.alt_address,
      alt_governorate: ind.alt_governorate,
      household_goods: Array.isArray(ind.household_goods) ? ind.household_goods : undefined,
      family_conditions: Array.isArray(ind.family_conditions) ? ind.family_conditions : [],
    };
    for (const k of applianceKeys) {
      initialInd[k] = ind[k];
    }

    return (
      <div className="space-y-4">
        <h2 className="display text-xl text-ink">تعديل ملف: {ind.full_name}</h2>
        <IndividualForm
          initialInd={initialInd}
          initialFamily={initialFamily}
          initialFin={initialFin}
          initialFinancialNotes={f?.financial_notes ?? ""}
          initialChurchSupport={initialChurchSupport}
          initialCustomRevenues={initialCustomRevenues}
          initialCustomExpenses={initialCustomExpenses}
          submitLabel="حفظ التعديلات"
          busy={busy}
          role={role}
          onCancel={() => setEditing(false)}
          onSubmit={async (formData) => {
            if (!formData.ind.full_name) {
              toast.error("الاسم مطلوب");
              return;
            }
            setBusy(true);
            try {
              await saveOne({ data: { id, ...buildIndividualPayload(formData) } });
              toast.success("تم حفظ التعديلات");
              setEditing(false);
              await reload();
            } catch (err: any) {
              toast.error(err?.message ?? "حدث خطأ");
            } finally {
              setBusy(false);
            }
          }}
        />
      </div>
    );
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await removeOne({ data: { id } });
      toast.success("تم حذف الملف");
      router.navigate({ to: "/search", search: { mode: "name" } });
    } catch (err: any) {
      toast.error(err?.message ?? "فشل الحذف");
      setDeleting(false);
    }
  }

  return (
    <div className="flex w-full max-w-full flex-col space-y-6 overflow-x-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/search" search={{ mode: "name" }} className="text-sm flex items-center gap-1 text-muted-foreground hover:text-primary">
          <ArrowRight size={16} /> رجوع للبحث
        </Link>
          <div className="flex flex-wrap items-center gap-2 max-w-full">
            {/* Delete button — visible to all but guarded */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={(e) => { if (!can("delete:beneficiary")) { e.preventDefault(); toast.error("غير مصرح لك بهذا الحقل"); } }}
                  className="bg-destructive text-destructive-foreground px-5 py-2 text-sm rounded-full font-semibold hover:bg-destructive/90 transition disabled:opacity-60 flex items-center gap-1"
                >
                  <Trash2 size={14} /> حذف
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>حذف ملف المخدوم</AlertDialogTitle>
                  <AlertDialogDescription>
                    سيتم حذف ملف <strong>{ind.full_name}</strong> نهائياً مع جميع بيانات الأسرة والمالية. لا يمكن التراجع عن هذا الإجراء.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>إلغاء</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleting ? "جارٍ الحذف..." : "حذف نهائياً"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            {/* مساعدات button — visible to all but guarded */}
            <button
              type="button"
              onClick={() => { if (!can("view:sensitive")) { toast.error("غير مصرح لك بهذا الحقل"); return; } handleAssistanceDialogOpen(true); }}
              className="bg-primary text-primary-foreground px-5 py-2 text-sm rounded-full font-semibold hover:bg-primary/90 transition flex items-center gap-1"
            >
              <HeartHandshake size={14} className="inline-block ms-1" /> مساعدات
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="bg-muted text-muted-foreground px-5 py-2 text-sm rounded-full font-semibold hover:bg-muted/80 transition flex items-center gap-1"
            >
              <Printer size={14} className="inline-block ms-1" /> طباعة الملف
            </button>
            {/* Edit button — visible to all but guarded */}
            <button
              type="button"
              onClick={() => { if (!can("edit:beneficiary")) { toast.error("غير مصرح لك بهذا الحقل"); return; } setEditing(true); }}
              className="chip-green px-5 py-2 text-sm"
            >
              <Pencil size={14} className="inline-block ms-1" /> تعديل
            </button>
          </div>
      </div>

      {/* Header card with name pill */}
      <div className="paper-card relative w-full max-w-full">
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 max-w-[calc(100%-2rem)] truncate bg-paper-2 px-5 sm:px-8 py-2 rounded-full shadow-soft display text-xl sm:text-2xl text-muted-foreground/80 text-center">
          {ind.full_name}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 pt-6 text-sm">
          <Info label="الاسم" v={ind.full_name} />
          <Info label="اسم الشهرة" v={ind.nickname} />
          <Info label="اسم الأم" v={ind.mother_name} />
          <Info label="الرقم القومي" v={ind.national_id} />
          <Info label="تاريخ الميلاد" v={ind.birth_date} />
          <Info label="وظيفة الزوج" v={ind.job} />
          <Info label="وظيفة الزوجة" v={ind.salary} />
          <Info label="رقم موبايل الزوجة" v={ind.wife_mobile} />
          <Info label="أب الاعتراف" v={ind.confession_father} />
          <Info label="أسرة القديس" v={ind.saint_family} />
          <Info label="العنوان بالتفصيل" v={ind.address} className="md:col-span-2" />
          <Info label="عدد الأفراد" v={ind.household_count} />
          <Info label="نوع السكن" v={ind.housing_type} />
          <Info label="الغرف" v={ind.rooms} />
          <Info label="رقم موبايل الزوج" v={ind.husband_mobile} />
          <Info label="تلفون" v={ind.landline} />
        </div>

        {/* Alternative Address Section */}
        {ind.has_alt_address && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="text-sm font-semibold text-muted-foreground mb-2">سكن آخر</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 text-sm">
              <Info label="عنوان السكن الآخر" v={ind.alt_address} className="md:col-span-2" />
              <Info label="محافظة السكن الآخر" v={ind.alt_governorate} />
            </div>
          </div>
        )}
        {/* Family Condition Notes */}
        <div className="mt-5 pt-4 border-t border-border">
          <div className="text-sm font-semibold text-muted-foreground mb-2">ملحوظات عن حالة الأسرة</div>
          {familyConditions.length === 0 ? (
            <div className="text-sm text-muted-foreground">لا توجد ملاحظات مسجلة</div>
          ) : (
            <div className="space-y-3">
              {conditionGroups.map((group) => (
                <div key={group.member} className="rounded-xl border border-border bg-paper-2/40 p-3">
                  <div className="font-semibold text-foreground mb-2">{group.member}</div>
                  <div className="space-y-2">
                    {group.items.map((c, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <span className="shrink-0 rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[11px] font-semibold">
                          {conditionCategoryLabel(c.category)}
                        </span>
                        <div className="min-w-0">
                          {c.title && <div className="font-semibold">{c.title}</div>}
                          {c.notes && <div className="text-muted-foreground whitespace-pre-wrap">{c.notes}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-5 pt-4 border-t border-border">
          <div className="text-sm font-semibold text-muted-foreground mb-2">المنقولات المنزلية</div>
          {householdGoods.length === 0 ? (
            <div className="text-sm text-muted-foreground">لا توجد منقولات مسجلة</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {householdGoods.map((g, i) => (
                <div
                  key={i}
                  className="flex min-w-0 items-center justify-between gap-2 text-xs px-3 py-2 rounded-lg border bg-success/15 border-success/40 text-success"
                >
                  <span className="min-w-0 truncate font-semibold">{g.item_name}</span>
                  <span className="shrink-0 tabular-nums">العدد: {g.quantity}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Barcode - visible only to SUPER_ADMIN and ADMIN */}
      {ind.national_id && (role === "SUPER_ADMIN" || role === "ADMIN") && (
        <BarcodeDisplay value={ind.national_id} label="باركود الرقم القومي" />
      )}

      {/* Family table */}
      <div className="paper-card">
        <h3 className="display text-lg mb-3">أفراد الأسرة</h3>
        {highlightFamilyId && (
          <div className="mb-4 rounded-xl bg-emerald-100 border border-emerald-200 p-4 text-sm text-emerald-900">
            تم تمييز فرد الأسرة المطابق باللون الأخضر داخل القائمة أدناه.
          </div>
        )}
        <div className="max-w-full overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-muted-foreground">
              <tr>
                {["م","الاسم","الرقم القومي","صلة القرابة","الحالة الاجتماعية","أب الاعتراف","الوظيفة/الدراسة","الدخل","ملاحظات"].map((h) => (
                  <th key={h} className="px-2 py-2 text-start border-b border-border font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {family.length === 0 && (
                <tr><td colSpan={9} className="text-center py-6 text-muted-foreground">لا يوجد أفراد مسجلون</td></tr>
              )}
              {family.map((m: any, i: number) => (
                <tr
                  key={m.id}
                  className={`border-b border-border/60 ${m.id === highlightFamilyId ? 'bg-emerald-100 ring-1 ring-emerald-200' : ''}`}
                >
                  <td className="px-2 py-2">{i + 1}</td>
                  <td className="px-2 py-2">{m.full_name}</td>
                  <td className="px-2 py-2" dir="ltr">{m.national_id || "—"}</td>
                  <td className="px-2 py-2">{m.relation || "—"}</td>
                  <td className="px-2 py-2">{m.marital_status || "—"}</td>
                  <td className="px-2 py-2">{m.confession_father || "—"}</td>
                  <td className="px-2 py-2">{m.school_or_job || "—"}</td>
                  <td className="px-2 py-2 tabular-nums">{m.income ?? "—"}</td>
                  <td className="px-2 py-2 text-muted-foreground">{m.notes || ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Financials & Church Support — Admin only */}
      {isAdmin && (
        <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="paper-card">
          <h3 className="display text-lg mb-3 text-success">الإيرادات</h3>
          <FinRow label="شهريات كنايس" v={f?.church_monthly} />
          <FinRow label="مرتب أساسي" v={f?.basic_salary} />
          <FinRow label="مصدر إضافي للدخل" v={f?.extra_income} />
          <FinRow label="مساعدات علاجية" v={f?.therapeutic_aid} />
          <FinRow label="مساعدات خلال دراسة" v={f?.study_aid} />
          {customRevenues.map((r, i) => (
            <FinRow key={i} label={r.name || "إيراد آخر"} v={r.amount} />
          ))}
          <Total label="إجمالي الإيرادات" v={totalIncome} />
        </div>
        <div className="paper-card">
          <h3 className="display text-lg mb-3 text-destructive">المصروفات</h3>
          <FinRow label="كهرباء – غاز – مياه" v={f?.electricity_gas_water} />
          <FinRow label="تليفون" v={f?.phone_bill} />
          <FinRow label="إيجار" v={f?.rent} />
          <FinRow label="علاج" v={f?.treatment_cost} />
          <FinRow label="دراسة" v={f?.education_cost} />
          {customExpenses.map((r, i) => (
            <FinRow key={i} label={r.name || "مصروف آخر"} v={r.amount} />
          ))}
          <Total label="إجمالي المصروفات" v={totalExpenses} />
        </div>
      </div>

      <div className="paper-card">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="display text-lg">صافي الدخل</h3>
          <span
            className={`display text-2xl tabular-nums ${netIncome < 0 ? "text-destructive" : "text-success"}`}
          >
            {netIncome.toLocaleString("ar-EG")} ج.م
          </span>
        </div>
      </div>

      {/* Financial Notes (ملاحظات مالية) */}
      {f?.financial_notes ? (
        <div className="paper-card">
          <h3 className="display text-lg mb-3">ملاحظات مالية</h3>
          <p className="text-sm text-foreground whitespace-pre-wrap">{f.financial_notes}</p>
        </div>
      ) : null}

      {/* Church Support from Other Churches */}
      {churchSupport && churchSupport.length > 0 && (
        <div className="paper-card">
          <h3 className="display text-lg mb-3">شهريات كنائس أخرى</h3>
          <div className="max-w-full overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-muted-foreground">
                <tr>
                  {["م","اسم الكنيسة","المبلغ"].map((h) => (
                    <th key={h} className="px-2 py-2 text-start border-b border-border font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {churchSupport.map((cs: any, i: number) => (
                  <tr key={i} className="border-b border-border/60">
                    <td className="px-2 py-2">{i + 1}</td>
                    <td className="px-2 py-2">{cs.church_name}</td>
                    <td className="px-2 py-2 tabular-nums">{Number(cs.amount).toLocaleString("ar-EG")} ج.م</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-primary font-bold display">
                  <td colSpan={2} className="px-2 py-2">الإجمالي</td>
                  <td className="px-2 py-2 tabular-nums">
                    {churchSupport.reduce((sum: number, cs: any) => sum + Number(cs.amount), 0).toLocaleString("ar-EG")} ج.م
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
        </>
      )}

      {/* Assistance Dialog */}
      <Dialog open={assistanceDialog} onOpenChange={handleAssistanceDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>مساعدات - {ind.full_name}</DialogTitle>
          </DialogHeader>
          {!showAssistanceForm ? (
            <AssistanceHistory
              individualId={id}
              individualName={ind.full_name}
              familyMembers={[
                { id: ind.id, full_name: ind.full_name },
                ...family.map((f: any) => ({ id: f.id, full_name: f.full_name })),
              ]}
              logs={assistanceLogs}
              onAddNew={() => setShowAssistanceForm(true)}
              onRefresh={loadAssistanceLogs}
            />
          ) : (
            <AssistanceForm
              individualId={id}
              familyMembers={[
                { id: ind.id, full_name: ind.full_name },
                ...family.map((f: any) => ({ id: f.id, full_name: f.full_name })),
              ]}
              onClose={() => {
                setShowAssistanceForm(false);
              }}
              onSubmit={async (formData) => {
                await createAssistanceLog({ data: { individual_id: id, ...formData } });
                await loadAssistanceLogs();
                setShowAssistanceForm(false);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function sumOf(f: any, keys: string[]) {
  if (!f) return 0;
  return keys.reduce((s, k) => s + Number(f[k] || 0), 0);
}
function Info({ label, v, className = "" }: { label: string; v: any; className?: string }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="font-semibold text-foreground break-words">{v ?? "—"}</div>
    </div>
  );
}
function FinRow({ label, v }: { label: string; v: any }) {
  return (
    <div className="flex justify-between border-b border-border/60 py-2 text-sm">
      <span>{label}</span>
      <span className="tabular-nums">{(Number(v) || 0).toLocaleString("ar-EG")}</span>
    </div>
  );
}
function Total({ label, v }: { label: string; v: number }) {
  return (
    <div className="flex justify-between mt-3 pt-3 border-t-2 border-primary font-bold display">
      <span>{label}</span>
      <span className="tabular-nums">{v.toLocaleString("ar-EG")}</span>
    </div>
  );
}
