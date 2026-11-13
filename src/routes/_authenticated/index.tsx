import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  getDashboard,
  getAuditLog,
  saveHiddenFamiliesMetric,
  updateMetric,
} from "@/lib/church.functions";
import { useAuth } from "@/hooks/use-auth";
import {
  Search as SearchIcon,
  UserPlus,
  Pencil,
  CheckSquare,
  Package,
  Shirt,
  Sofa,
  Activity,
  Pill,
} from "lucide-react";
import { toast } from "sonner";
import {
  getFamilyScopeForRole,
  getHomeRouteForRole,
  isSingleWorkspaceRole,
} from "@/lib/permissions";
import { FinancialCharts, FinancialSummaryCards } from "@/components/financial-overview";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({ meta: [{ title: "اللوحة الرئيسية" }] }),
  component: Dashboard,
});

type Metric = {
  id: string;
  sector: string;
  monthly: number;
  study: number;
  therapeutic: number;
};

type AuditEntry = {
  id: string;
  user_email: string;
  action: string;
  table_name: string;
  record_id: string;
  created_at: string;
};

function Dashboard() {
  const { role, can, isAdmin, isFamilyServant, loading } = useAuth();
  const router = useRouter();
  const fetchDashboard = useServerFn(getDashboard);
  const fetchAudit = useServerFn(getAuditLog);
  const saveMetric = useServerFn(updateMetric);
  const saveHidden = useServerFn(saveHiddenFamiliesMetric);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [hiddenFamilies, setHiddenFamilies] = useState<Metric | null>(null);
  const [hiddenPersisted, setHiddenPersisted] = useState(false);
  const [editing, setEditing] = useState<Metric | null>(null);
  const [editingHidden, setEditingHidden] = useState(false);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);

  async function reload() {
    const d = await fetchDashboard();
    setMetrics(d.metrics as Metric[]);
    setHiddenFamilies(d.hiddenFamilies as Metric);
    setHiddenPersisted(d.hiddenFamiliesPersisted);
    // Audit trail is admin-only; never fetched (or leaked) for family servants.
    if (isAdmin) {
      const a = await fetchAudit();
      setAuditLog((a as AuditEntry[]).slice(0, 10));
    }
  }
  useEffect(() => {
    if (isAdmin || isFamilyServant) reload();
  }, [isAdmin, isFamilyServant]);

  // Single-purpose managers have their own dedicated screens; never render the
  // general dashboard for them.
  useEffect(() => {
    if (!loading && isSingleWorkspaceRole(role)) {
      router.navigate({ to: getHomeRouteForRole(role) });
    }
  }, [loading, role, router]);

  // STRICT client-side mapping guard: a family servant may only ever render the
  // EXACT sector mapped to their role. Any stray/leaked row is discarded here.
  const roleScope = getFamilyScopeForRole(role);
  const scopedMetrics = isAdmin
    ? metrics
    : roleScope
      ? metrics.filter((m) => m.sector === roleScope.sector)
      : [];
  const scopedHiddenFamilies = isAdmin ? hiddenFamilies : null;

  if (isSingleWorkspaceRole(role)) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        جاري التوجيه إلى الواجهة المخصصة...
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8">
      {/* ═══════ Zone 1: Summary Cards — Admins (global) & family servants (scoped to assigned family) ═══════ */}
      {(isAdmin || isFamilyServant) && (
        <FinancialSummaryCards
          metrics={scopedMetrics}
          hidden={scopedHiddenFamilies}
          onTotalDoubleClick={() => isAdmin && metrics[0] && setEditing(metrics[0])}
        />
      )}

      {/* ═══════ Quick Actions — Unified for ALL roles (click-intercepted) ═══════ */}
      {/* Phones: 2-column grid; the green "add" action spans the full first row. lg+ keeps the single wrapping row. */}
      <section className="grid grid-cols-2 gap-2 sm:gap-3 lg:flex lg:flex-wrap">
        <QuickActionButton
          to="/add"
          icon={<UserPlus size={16} />}
          label="إضافة مخدوم"
          color="green"
          className="col-span-2 lg:col-auto"
          restricted={[
            "SUPPLY_WAREHOUSE_MANAGER",
            "FURNITURE_WAREHOUSE_MANAGER",
            "PHARMACY_WAREHOUSE_MANAGER",
            "BRIDE_AND_MEDICAL_AIDS_MANAGER",
            "BLESSING_DISTRIBUTOR",
          ]}
          role={role}
        />
        <QuickActionButton
          to="/search"
          search={{ mode: "name" }}
          icon={<SearchIcon size={16} />}
          label="البحث بالاسم"
          color="dark"
          restricted={[
            "SUPPLY_WAREHOUSE_MANAGER",
            "FURNITURE_WAREHOUSE_MANAGER",
            "PHARMACY_WAREHOUSE_MANAGER",
            "BLESSING_DISTRIBUTOR",
          ]}
          role={role}
        />
        <QuickActionButton
          to="/clothes"
          icon={<Shirt size={16} />}
          label="طلب ملابس"
          color="dark"
          restricted={[
            "SUPPLY_WAREHOUSE_MANAGER",
            "FURNITURE_WAREHOUSE_MANAGER",
            "PHARMACY_WAREHOUSE_MANAGER",
            "BRIDE_AND_MEDICAL_AIDS_MANAGER",
            "BLESSING_DISTRIBUTOR",
          ]}
          role={role}
        />
        <QuickActionButton
          to="/blessing-distribution"
          icon={<CheckSquare size={16} />}
          label="توزيع البركة"
          color="dark"
          restricted={[
            "SUPPLY_WAREHOUSE_MANAGER",
            "FURNITURE_WAREHOUSE_MANAGER",
            "PHARMACY_WAREHOUSE_MANAGER",
            "BRIDE_AND_MEDICAL_AIDS_MANAGER",
          ]}
          role={role}
        />
        <QuickActionButton
          to="/furniture"
          icon={<Sofa size={16} />}
          label="طلب الأجهزة والأثاث"
          color="dark"
          restricted={[
            "SUPPLY_WAREHOUSE_MANAGER",
            "PHARMACY_WAREHOUSE_MANAGER",
            "BRIDE_AND_MEDICAL_AIDS_MANAGER",
            "BLESSING_DISTRIBUTOR",
          ]}
          role={role}
        />
        <QuickActionButton
          to="/pharmacy"
          icon={<Pill size={16} />}
          label="الصيدلية"
          color="dark"
          restricted={[
            "SUPPLY_WAREHOUSE_MANAGER",
            "FURNITURE_WAREHOUSE_MANAGER",
            "BRIDE_AND_MEDICAL_AIDS_MANAGER",
            "BLESSING_DISTRIBUTOR",
          ]}
          role={role}
        />
        <QuickActionButton
          to="/inventory"
          icon={<Package size={16} />}
          label="المخزن"
          color="dark"
          restricted={[
            "ST_MATTHEW",
            "ST_MARK",
            "ST_JOHN",
            "ST_LUKE",
            "ST_HIDDEN_FAMILIES",
            "BLESSING_DISTRIBUTOR",
            "FURNITURE_WAREHOUSE_MANAGER",
            "PHARMACY_WAREHOUSE_MANAGER",
            "BRIDE_AND_MEDICAL_AIDS_MANAGER",
          ]}
          role={role}
        />
      </section>

      {/* ═══════ Zone 2: Charts Grid — Only for SUPER_ADMIN & ADMIN ═══════ */}
      {isAdmin && (
        <FinancialCharts
          metrics={metrics}
          hidden={scopedHiddenFamilies}
          editable
          onEditMetric={() => metrics[0] && setEditing(metrics[0])}
          onEditHidden={() => setEditingHidden(true)}
        />
      )}

      {/* ═══════ Zone 3: Recent Activity ═══════ */}
      {can("view:audit") && auditLog.length > 0 && (
        <section className="paper-card !p-4 sm:!p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={16} className="text-muted-foreground" />
            <h2 className="display text-sm text-muted-foreground">آخر النشاطات</h2>
          </div>

          {/* Phones: stacked label/value cards (the table below is hidden) */}
          <ul className="space-y-2 md:hidden">
            {auditLog.map((entry) => (
              <li
                key={entry.id}
                className="rounded-xl border border-border/40 bg-paper px-3 py-2.5"
              >
                <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
                  <dt className="text-muted-foreground">المستخدم</dt>
                  <dd className="min-w-0 break-words text-foreground/80">{entry.user_email}</dd>
                  <dt className="text-muted-foreground">الإجراء</dt>
                  <dd className="min-w-0 break-words text-foreground/80">{entry.action}</dd>
                  <dt className="text-muted-foreground">الجدول</dt>
                  <dd className="min-w-0 break-words text-foreground/60">{entry.table_name}</dd>
                  <dt className="text-muted-foreground">التاريخ</dt>
                  <dd className="min-w-0 break-words text-muted-foreground">
                    {formatAuditDate(entry.created_at)}
                  </dd>
                </dl>
              </li>
            ))}
          </ul>

          {/* md and up: the original table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 text-muted-foreground text-xs">
                  <th className="text-start pb-2 font-medium">ال المستخدم</th>
                  <th className="text-start pb-2 font-medium">الإجراء</th>
                  <th className="text-start pb-2 font-medium">الجدول</th>
                  <th className="text-start pb-2 font-medium hidden sm:table-cell">التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {auditLog.map((entry) => (
                  <tr key={entry.id} className="border-b border-border/30 last:border-0">
                    <td className="py-2 text-foreground/80">{entry.user_email}</td>
                    <td className="py-2 text-foreground/80">{entry.action}</td>
                    <td className="py-2 text-foreground/60">{entry.table_name}</td>
                    <td className="py-2 text-muted-foreground hidden sm:table-cell">
                      {formatAuditDate(entry.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ═══════ Admin Edit Panels (hidden on larger screens, shown as fallback) ═══════ */}
      {isAdmin && metrics.length > 0 && (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:hidden">
          <div className="paper-card !p-4 sm:!p-6">
            <h3 className="display text-sm text-muted-foreground mb-3 flex items-center gap-2">
              <Pencil size={14} /> تعديل قيم القطاعات
            </h3>
            <div className="space-y-2">
              {metrics.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setEditing(m)}
                  className="w-full min-h-11 flex items-center text-start px-3 py-2 rounded-xl hover:bg-primary/10 text-sm transition"
                >
                  {m.sector}
                </button>
              ))}
            </div>
          </div>
          {hiddenFamilies && (
            <div className="paper-card !p-4 sm:!p-6">
              <h3 className="display text-sm text-muted-foreground mb-3 flex items-center gap-2">
                <Pencil size={14} /> تعديل الأسر المستترة
              </h3>
              <button
                onClick={() => setEditingHidden(true)}
                className="w-full min-h-11 flex items-center text-start px-3 py-2 rounded-xl hover:bg-primary/10 text-sm transition"
              >
                الشهريات · المساعدات الدراسية · المساعدات العلاجية
              </button>
            </div>
          )}
        </section>
      )}

      {/* ═══════ Dialogs ═══════ */}
      {editing && (
        <EditMetricDialog
          metrics={metrics}
          currentId={editing.id}
          onClose={() => setEditing(null)}
          onSave={async (id, vals, description) => {
            await saveMetric({ data: { id, ...vals, description } });
            toast.success("تم حفظ التعديلات");
            setEditing(null);
            reload();
          }}
        />
      )}

      {editingHidden && hiddenFamilies && (
        <EditMetricDialog
          metric={hiddenFamilies}
          title="الأسر المستترة"
          onClose={() => setEditingHidden(false)}
          onSave={async (_id, vals, description) => {
            if (hiddenPersisted && hiddenFamilies.id) {
              await saveMetric({ data: { id: hiddenFamilies.id, ...vals, description } });
            } else {
              await saveHidden({ data: { ...vals, description } });
            }
            toast.success("تم حفظ التعديلات");
            setEditingHidden(false);
            reload();
          }}
        />
      )}
    </div>
  );
}

function formatAuditDate(iso: string) {
  return new Date(iso).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function QuickActionButton({
  to,
  search,
  icon,
  label,
  color,
  className,
  restricted,
  role,
}: {
  to: string;
  search?: Record<string, any>;
  icon: React.ReactNode;
  label: string;
  color: "green" | "dark";
  className?: string;
  restricted: string[];
  role: string | null;
}) {
  const cls = color === "green" ? "chip-green" : "chip-dark";
  return (
    <Link
      to={to}
      search={search as any}
      onClick={(e) => {
        if (
          role === "CLOTHES_MANAGER" ||
          role === "TREASURER" ||
          restricted.includes(role as any)
        ) {
          e.preventDefault();
          toast.error("غير مصرح لك بهذا الحقل");
        }
      }}
      className={
        `${cls} w-full min-h-11 !px-3 !py-2 text-[11px] sm:text-xs leading-tight text-center ` +
        `lg:min-h-0 lg:w-auto lg:!px-5 lg:!py-2.5 lg:text-sm lg:leading-normal ` +
        (className ?? "")
      }
    >
      {icon && (
        <span className="ms-1.5 shrink-0 flex items-center [&>svg]:size-3.5 lg:[&>svg]:size-4">
          {icon}
        </span>
      )}
      <span className="min-w-0">{label}</span>
    </Link>
  );
}

function EditMetricDialog({
  metric,
  metrics,
  currentId,
  title,
  onClose,
  onSave,
}: {
  metric?: Metric;
  metrics?: Metric[];
  currentId?: string;
  title?: string;
  onClose: () => void;
  onSave: (
    id: string,
    v: { monthly: number; study: number; therapeutic: number },
    description: string,
  ) => void;
}) {
  const initial = metrics ? (metrics.find((m) => m.id === currentId) ?? metrics[0]) : metric!;
  const [selectedId, setSelectedId] = useState(initial.id);
  const [monthly, setMonthly] = useState(Number(initial.monthly));
  const [study, setStudy] = useState(Number(initial.study));
  const [therapeutic, setTherapeutic] = useState(Number(initial.therapeutic));
  const [description, setDescription] = useState("");

  const showSelector = metrics && metrics.length > 1;

  function handleSectorChange(id: string) {
    const m = metrics!.find((x) => x.id === id);
    if (!m) return;
    setSelectedId(id);
    setMonthly(Number(m.monthly));
    setStudy(Number(m.study));
    setTherapeutic(Number(m.therapeutic));
  }

  return (
    <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="paper-card w-full max-w-md">
        <h3 className="display text-xl mb-4">تعديل: {title ?? initial.sector}</h3>
        {showSelector && (
          <label className="block mb-4">
            <span className="text-sm font-semibold text-muted-foreground">اختر القطاع</span>
            <select
              value={selectedId}
              onChange={(e) => handleSectorChange(e.target.value)}
              className="mt-1 w-full rounded-xl bg-paper px-4 py-2 outline-none focus:ring-2 focus:ring-ring text-sm"
            >
              {metrics!.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.sector}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="space-y-3">
          <Field label="شهريات" value={monthly} onChange={setMonthly} />
          <Field label="مساعدات دراسية" value={study} onChange={setStudy} />
          <Field label="مساعدات علاجية" value={therapeutic} onChange={setTherapeutic} />
        </div>
        <label className="block mt-3">
          <span className="text-sm font-semibold text-muted-foreground">
            ملاحظات / وصف التعديل <span className="text-destructive">*</span>
          </span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 min-h-20 w-full rounded-xl bg-paper px-4 py-2 outline-none focus:ring-2 focus:ring-ring text-sm"
            placeholder="سبب التعديل أو تفاصيل المستفيد / المستند"
            maxLength={2000}
            required
          />
        </label>
        <div className="flex gap-3 mt-6 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-full bg-muted text-foreground">
            إلغاء
          </button>
          <button
            onClick={() => {
              if (!description.trim()) {
                toast.error("برجاء إدخال ملاحظات / وصف الحركة");
                return;
              }
              onSave(selectedId, { monthly, study, therapeutic }, description.trim());
            }}
            className="chip-green px-6 py-2"
          >
            حفظ
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-muted-foreground">{label}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full rounded-xl bg-paper px-4 py-2 outline-none focus:ring-2 focus:ring-ring"
      />
    </label>
  );
}
