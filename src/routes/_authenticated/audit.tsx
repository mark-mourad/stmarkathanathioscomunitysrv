import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getAuditLog, deleteAuditLog } from "@/lib/church.functions";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Eye, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/audit")({
  head: () => ({ meta: [{ title: "سجل التعديلات" }] }),
  component: AuditPage,
});

type AuditRow = {
  id: string | number;
  user_email: string | null;
  action: string;
  table_name: string;
  record_id: string | null;
  entity_label?: string | null;
  changes: unknown;
  created_at: string;
};

type JsonRecord = Record<string, unknown>;

type AuditChangeSet = {
  before?: JsonRecord;
  after?: JsonRecord;
  changed?: string[];
};

type DetailRow = {
  key: string;
  label: string;
  before?: unknown;
  after?: unknown;
};

type DetailView = {
  rows: DetailRow[];
  mode: "diff" | "snapshot";
  snapshotLabel: string;
};

const auditRestricted = [
  "SUPPLY_WAREHOUSE_MANAGER",
  "FURNITURE_WAREHOUSE_MANAGER",
  "PHARMACY_WAREHOUSE_MANAGER",
  "BRIDE_AND_MEDICAL_AIDS_MANAGER",
  "BLESSING_DISTRIBUTOR",
  "CLOTHES_MANAGER",
  "TREASURER",
];

const ACTION_LABELS: Record<string, string> = {
  INSERT: "إضافة",
  UPDATE: "تعديل",
  DELETE: "حذف",
};

const TABLE_LABELS: Record<string, string> = {
  individuals: "مخدوم",
  family_members: "فرد أسرة",
  financials: "بيانات مالية",
  monthly_church_support: "دعم شهري",
  dashboard_metrics: "قيم اللوحة",
  inventory: "مخزن البركة",
  blessing_distribution: "توزيع البركة",
  assistance_logs: "مساعدة",
  bridal_prep_details: "تجهيز عرائس",
  medical_aid_details: "مساعدة علاجية",
  clothes_requests: "طلب ملابس",
  furniture_inventory: "مخزن الأثاث",
  furniture_requests: "طلب أثاث",
  supplies_inventory: "مخزن التموين",
  pharmacy_inventory: "مخزن الصيدلية",
  pharmacy_requests: "طلب علاج",
  treasury_transactions: "حركة خزنة",
  user_roles: "صلاحية مستخدم",
};

const FIELD_LABELS: Record<string, string> = {
  // Beneficiaries
  full_name: "الاسم الكامل",
  nickname: "الشهرة",
  mother_name: "اسم الأم",
  gender: "النوع",
  national_id: "الرقم القومي",
  birth_date: "تاريخ الميلاد",
  birth_governorate: "محل الميلاد",
  job: "وظيفة الزوج",
  salary: "وظيفة الزوجة",
  wife_mobile: "موبايل الزوجة",
  husband_mobile: "موبايل الزوج",
  phone: "الهاتف",
  mobile: "الموبايل",
  landline: "الهاتف الأرضي",
  confession_father: "أب الاعتراف",
  saint_family: "أسرة القديس",
  address: "العنوان",
  household_count: "عدد أفراد الأسرة",
  housing_type: "نوع السكن",
  rooms: "عدد الغرف",
  has_washing_machine: "غسالة",
  has_fridge: "ثلاجة",
  has_stove: "بوتاجاز",
  has_mattress: "مرتبة",
  has_computer: "كمبيوتر",
  has_sofa: "كنبة",
  has_dining: "سفرة",
  has_tv: "تلفزيون",
  has_wardrobe: "دولاب",
  has_alt_address: "له عنوان بديل",
  alt_address: "العنوان البديل",
  alt_governorate: "محافظة العنوان البديل",
  household_goods: "الأجهزة المنزلية",
  family_conditions: "ظروف الأسرة",
  // Family members
  seq: "م",
  relation: "صلة القرابة",
  insurance_number: "رقم التأمين",
  marital_status: "الحالة الاجتماعية",
  school_or_job: "المدرسة / العمل",
  income: "الدخل",
  notes: "ملاحظات",
  // Financials
  individual_id: "المخدوم",
  church_monthly: "الشهريات",
  therapeutic_aid: "مساعدات علاجية",
  study_aid: "مساعدات دراسية",
  basic_salary: "المرتب الأساسي",
  extra_income: "دخل إضافي",
  electricity_gas_water: "كهرباء / غاز / مياه",
  phone_bill: "فاتورة التليفون",
  rent: "الإيجار",
  treatment_cost: "تكلفة العلاج",
  education_cost: "تكلفة التعليم",
  financial_notes: "ملاحظات مالية",
  custom_revenues: "إيرادات أخرى",
  custom_expenses: "مصروفات أخرى",
  // Monthly support / dashboard
  church_name: "اسم الكنيسة",
  amount: "المبلغ",
  sector: "القطاع",
  monthly: "الشهريات",
  study: "الدراسة",
  therapeutic: "العلاجية",
  display_order: "الترتيب",
  // Inventory / distribution
  weekly_total: "إجمالي الأسبوع",
  details: "التفاصيل",
  received: "تم الاستلام",
  distribution_date: "تاريخ التوزيع",
  category: "التصنيف",
  item_name: "اسم الصنف",
  quantity: "الكمية",
  weight: "الوزن",
  disease_category: "تصنيف المرض",
  custom_disease_name: "اسم المرض",
  medicine_name: "اسم الدواء",
  unit_type: "الوحدة",
  // Assistance
  assistance_type: "نوع المساعدة",
  total_amount: "إجمالي المبلغ",
  item_type: "نوع الصنف",
  unit_price: "سعر الوحدة",
  total_price: "الإجمالي",
  service_name: "اسم الخدمة",
  church_percentage: "نسبة الكنيسة",
  church_amount: "مبلغ الكنيسة",
  // Clothes / furniture / pharmacy requests
  request_category: "نوع الطلب",
  school_name: "اسم المدرسة",
  t_shirt_size: "مقاس التيشيرت",
  pants_size: "مقاس البنطلون",
  shoe_size: "مقاس الحذاء",
  family_name: "اسم الأسرة",
  beneficiary_name: "اسم المخدوم",
  status: "الحالة",
  requested_quantity: "الكمية المطلوبة",
  // Treasury
  transaction_date: "تاريخ الحركة",
  transaction_type: "نوع الحركة",
  description: "البيان",
  reference: "المرجع",
  affects_metric: "مؤثرة على الإحصائيات",
  // Roles
  role: "الدور",
  user_id: "المستخدم",
};

const HIDDEN_FIELDS = new Set([
  "id",
  "created_at",
  "updated_at",
  "created_by",
  "updated_by",
  "requested_by",
  "created_by_email",
  "affects_metric",
  "user_id",
]);

/** Fields that are technical noise in the leadership-facing details modal. */
function isHiddenField(key: string): boolean {
  if (HIDDEN_FIELDS.has(key)) return true;
  if (key === "national_id") return false;
  return key.endsWith("_id") || key.endsWith("_url");
}

function isPlainObject(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseChanges(raw: unknown, action: string): AuditChangeSet | null {
  let value = raw;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return null;
    }
  }
  if (!isPlainObject(value)) return null;

  if ("before" in value || "after" in value) {
    return {
      before: isPlainObject(value.before) ? value.before : undefined,
      after: isPlainObject(value.after) ? value.after : undefined,
      changed: Array.isArray(value.changed)
        ? value.changed.filter((k): k is string => typeof k === "string")
        : undefined,
    };
  }

  // Legacy rows stored a flat snapshot (after for INSERT/UPDATE, before for DELETE).
  if (action === "DELETE") return { before: value };
  return { after: value };
}

function operationLabel(row: AuditRow): string {
  const noun = TABLE_LABELS[row.table_name] ?? row.table_name;
  const verb = ACTION_LABELS[row.action] ?? row.action;

  if (row.table_name === "treasury_transactions") {
    return row.action === "INSERT" ? "تسجيل حركة خزنة" : `${verb} حركة خزنة`;
  }

  return `${verb} ${noun}`;
}

function actionBadgeClass(action: string): string {
  if (action === "DELETE") return "bg-destructive/15 text-destructive";
  if (action === "UPDATE") return "bg-sky/30 text-primary";
  return "bg-success/15 text-success";
}

function firstText(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function fallbackEntity(row: AuditRow): string | null {
  const changes = parseChanges(row.changes, row.action);
  const snapshot = changes?.after ?? changes?.before ?? {};
  return firstText(
    snapshot.beneficiary_name,
    snapshot.full_name,
    snapshot.name,
    snapshot.item_name,
    snapshot.medicine_name,
    snapshot.service_name,
    snapshot.sector,
    snapshot.saint_family,
    snapshot.category,
    snapshot.description,
    snapshot.notes,
  );
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "نعم" : "لا";
  if (typeof value === "number") return value.toLocaleString("ar-EG");
  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
      const date = new Date(value);
      if (!Number.isNaN(date.getTime())) {
        return date.toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" });
      }
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const date = new Date(`${value}T00:00:00`);
      if (!Number.isNaN(date.getTime())) {
        return date.toLocaleDateString("ar-EG", { dateStyle: "medium" });
      }
    }
    return value;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return "—";
    return value
      .map((item) => {
        if (!isPlainObject(item)) return formatValue(item);
        const parts: string[] = [];
        const name = firstText(item.item_name, item.name, item.label, item.title, item.key);
        if (name) parts.push(name);
        if (item.quantity !== undefined && item.quantity !== null) {
          parts.push(`الكمية: ${formatValue(item.quantity)}`);
        }
        if (typeof item.exists === "boolean") {
          parts.push(item.exists ? "موجود" : "غير موجود");
        }
        if (typeof item.condition === "string" && item.condition.trim()) {
          parts.push(item.condition.trim());
        }
        if (typeof item.notes === "string" && item.notes.trim()) {
          parts.push(`ملاحظات: ${item.notes.trim()}`);
        }
        return parts.length ? parts.join(" — ") : JSON.stringify(item);
      })
      .join("، ");
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function sameValue(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (isEmptyValue(a) && isEmptyValue(b)) return true;
  return JSON.stringify(a) === JSON.stringify(b);
}

function isEmptyValue(value: unknown): boolean {
  if (value === null || value === undefined || value === "") return true;
  if (Array.isArray(value)) return value.length === 0;
  if (isPlainObject(value)) return Object.keys(value).length === 0;
  return false;
}

function buildDetailView(row: AuditRow): DetailView {
  const changes = parseChanges(row.changes, row.action);
  const before = changes?.before;
  const after = changes?.after;
  const hasBefore = Boolean(before && Object.keys(before).length);
  const hasAfter = Boolean(after && Object.keys(after).length);

  if (hasBefore && hasAfter) {
    const keys = changes?.changed?.length
      ? changes.changed
      : Array.from(new Set([...Object.keys(before!), ...Object.keys(after!)]));

    const rows = keys
      .filter((key) => !isHiddenField(key))
      .filter((key) => !sameValue(before![key], after![key]))
      .map((key) => ({
        key,
        label: FIELD_LABELS[key] ?? key,
        before: before![key],
        after: after![key],
      }));

    return { rows, mode: "diff", snapshotLabel: "" };
  }

  const snapshot = after ?? before ?? {};
  const rows = Object.keys(snapshot)
    .filter((key) => !isHiddenField(key))
    .filter((key) => !isEmptyValue(snapshot[key]))
    .map((key) => ({
      key,
      label: FIELD_LABELS[key] ?? key,
      [after ? "after" : "before"]: snapshot[key],
    }));

  return {
    rows,
    mode: "snapshot",
    snapshotLabel:
      row.action === "DELETE"
        ? "آخر القيم المحفوظة قبل الحذف"
        : row.action === "UPDATE"
          ? "القيم بعد التعديل (القيم السابقة غير متاحة لهذه العملية القديمة)"
          : "القيم التي تمت إضافتها",
  };
}

function AuditPage() {
  const { can, role } = useAuth();
  const router = useRouter();
  const fetchLog = useServerFn(getAuditLog);
  const deleteHistory = useServerFn(deleteAuditLog);
  const canViewAudit = can("view:audit");
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AuditRow | null>(null);

  const restricted = auditRestricted.includes(role as string);

  useEffect(() => {
    if (restricted) {
      toast.error("غير مصرح لك بهذا الحقل");
      router.navigate({ to: "/" });
    }
  }, [restricted, router]);

  useEffect(() => {
    if (!canViewAudit) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    fetchLog()
      .then((data) => {
        if (active) setRows((data ?? []) as AuditRow[]);
      })
      .catch((error) => {
        if (active) toast.error(error instanceof Error ? error.message : "تعذر تحميل السجل");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [fetchLog, canViewAudit]);

  if (restricted) {
    return <div className="text-center py-8 text-muted-foreground">جاري التوجيه...</div>;
  }

  if (!can("view:audit")) return <div className="paper-card text-center">غير مصرح.</div>;

  const handleClearHistory = async () => {
    const confirmed = window.confirm(
      "هل أنت متأكد من مسح سجل التعديلات بالكامل؟ لا يمكن التراجع عن هذا الإجراء.",
    );
    if (!confirmed) return;

    try {
      await deleteHistory();
      const freshRows = await fetchLog();
      setRows((freshRows ?? []) as AuditRow[]);
      toast.success("تم مسح سجل النشاط بالكامل");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(message || "حدث خطأ أثناء محاولة المسح");
      console.error(error);
    }
  };

  const detailView = selected ? buildDetailView(selected) : null;

  return (
    <div className="paper-card">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div>
          <h2 className="display text-xl">سجل التعديلات</h2>
          <p className="text-sm text-muted-foreground mt-1">
            متابعة كل الإضافات والتعديلات والحذف على بيانات الخدمة.
          </p>
        </div>
        <button
          type="button"
          onClick={handleClearHistory}
          className="inline-flex items-center gap-2 rounded-full bg-red-600/10 px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-600/20"
        >
          <Trash2 size={16} /> مسح السجل
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-muted-foreground">
            <tr>
              {["الوقت", "المستخدم", "العملية", "الجهة", "التفاصيل"].map((header) => (
                <th
                  key={header}
                  className="text-start px-2 py-2 border-b border-border font-semibold whitespace-nowrap"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const entity = row.entity_label || fallbackEntity(row);
              return (
                <tr key={row.id} className="border-b border-border/60 align-middle">
                  <td className="px-2 py-3 tabular-nums whitespace-nowrap" dir="ltr">
                    {new Date(row.created_at).toLocaleString("ar-EG", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </td>
                  <td className="px-2 py-3 break-all" dir="ltr">
                    {row.user_email || "—"}
                  </td>
                  <td className="px-2 py-3 whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${actionBadgeClass(row.action)}`}
                    >
                      {operationLabel(row)}
                    </span>
                  </td>
                  <td className="px-2 py-3 font-semibold text-foreground">{entity || "—"}</td>
                  <td className="px-2 py-3">
                    <button
                      type="button"
                      onClick={() => setSelected(row)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/20"
                    >
                      <Eye size={14} /> التفاصيل
                    </button>
                  </td>
                </tr>
              );
            })}
            {loading && (
              <tr>
                <td colSpan={5} className="text-center py-8 text-muted-foreground">
                  جاري تحميل السجل...
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-8 text-muted-foreground">
                  لا توجد تعديلات بعد
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto text-start">
          {selected && detailView && (
            <>
              <DialogHeader className="text-start">
                <DialogTitle className="display text-lg">تفاصيل العملية</DialogTitle>
                <DialogDescription className="text-start">
                  {operationLabel(selected)}
                  {selected.entity_label || fallbackEntity(selected)
                    ? ` — ${selected.entity_label || fallbackEntity(selected)}`
                    : ""}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-3 rounded-2xl bg-muted/40 p-4 text-sm sm:grid-cols-2">
                <div>
                  <div className="text-xs text-muted-foreground">الوقت</div>
                  <div className="font-semibold tabular-nums" dir="ltr">
                    {new Date(selected.created_at).toLocaleString("ar-EG", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">المستخدم</div>
                  <div className="font-semibold break-all" dir="ltr">
                    {selected.user_email || "—"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">العملية</div>
                  <div className="font-semibold">{operationLabel(selected)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">الجهة</div>
                  <div className="font-semibold">
                    {selected.entity_label || fallbackEntity(selected) || "—"}
                  </div>
                </div>
              </div>

              {detailView.rows.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  لا توجد تفاصيل إضافية لهذه العملية.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-muted-foreground">
                      <tr>
                        <th className="text-start px-2 py-2 border-b border-border font-semibold">
                          الحقل
                        </th>
                        {detailView.mode === "diff" ? (
                          <>
                            <th className="text-start px-2 py-2 border-b border-border font-semibold">
                              قبل التعديل
                            </th>
                            <th className="text-start px-2 py-2 border-b border-border font-semibold">
                              بعد التعديل
                            </th>
                          </>
                        ) : (
                          <th className="text-start px-2 py-2 border-b border-border font-semibold">
                            القيمة
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {detailView.rows.map((detail) => (
                        <tr key={detail.key} className="border-b border-border/60">
                          <td className="px-2 py-2 font-semibold whitespace-nowrap">
                            {detail.label}
                          </td>
                          {detailView.mode === "diff" ? (
                            <>
                              <td className="px-2 py-2 text-muted-foreground whitespace-pre-wrap break-words">
                                {formatValue(detail.before)}
                              </td>
                              <td className="px-2 py-2 whitespace-pre-wrap break-words">
                                {formatValue(detail.after)}
                              </td>
                            </>
                          ) : (
                            <td className="px-2 py-2 whitespace-pre-wrap break-words">
                              {formatValue(
                                detail.after !== undefined ? detail.after : detail.before,
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {detailView.mode === "snapshot" && detailView.snapshotLabel && (
                    <p className="mt-2 text-xs text-muted-foreground">{detailView.snapshotLabel}</p>
                  )}
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
