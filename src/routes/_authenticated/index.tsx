import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
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
  TrendingUp,
  BookOpen,
  Stethoscope,
  DollarSign,
  Activity,
  Pill,
} from "lucide-react";
import { toast } from "sonner";
import { getFamilyScopeForRole } from "@/lib/permissions";

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
  const { role, can, isAdmin, isFamilyServant } = useAuth();
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

  // STRICT client-side mapping guard: a family servant may only ever render the
  // EXACT sector mapped to their role. Any stray/leaked row is discarded here.
  const roleScope = getFamilyScopeForRole(role);
  const scopedMetrics = isAdmin
    ? metrics
    : roleScope
      ? metrics.filter((m) => m.sector === roleScope.sector)
      : [];
  const scopedHiddenFamilies = isAdmin ? hiddenFamilies : null;

  const hiddenMonthly = scopedHiddenFamilies ? Number(scopedHiddenFamilies.monthly) : 0;
  const hiddenStudy = scopedHiddenFamilies ? Number(scopedHiddenFamilies.study) : 0;
  const hiddenTherapeutic = scopedHiddenFamilies ? Number(scopedHiddenFamilies.therapeutic) : 0;

  const totalMonthly =
    scopedMetrics.reduce((s, m) => s + Number(m.monthly), 0) + hiddenMonthly;
  const totalStudy = scopedMetrics.reduce((s, m) => s + Number(m.study), 0) + hiddenStudy;
  const totalTherapeutic =
    scopedMetrics.reduce((s, m) => s + Number(m.therapeutic), 0) + hiddenTherapeutic;
  const total = totalMonthly + totalStudy + totalTherapeutic;

  const summaryCards = [
    { label: "إجمالي الخارج", value: total, icon: DollarSign, color: "bg-primary/10 text-primary" },
    { label: "الشهريات", value: totalMonthly, icon: TrendingUp, color: "bg-sky/15 text-sky" },
    { label: "مساعدات دراسية", value: totalStudy, icon: BookOpen, color: "bg-teal/15 text-teal" },
    {
      label: "مساعدات علاجية",
      value: totalTherapeutic,
      icon: Stethoscope,
      color: "bg-chart-3/15 text-foreground",
    },
  ];

  return (
    <div className="space-y-6 md:space-y-8">
      {/* ═══════ Zone 1: Summary Cards — Admins (global) & family servants (scoped to assigned family) ═══════ */}
      {(isAdmin || isFamilyServant) && (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryCards.map((card) => (
            <article
              key={card.label}
              className="paper-card flex items-center gap-4"
              onDoubleClick={() =>
                isAdmin && card.label === "إجمالي الخارج" && metrics[0] && setEditing(metrics[0])
              }
            >
              <div className={`rounded-xl p-3 ${card.color}`}>
                <card.icon size={22} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">{card.label}</p>
                <p className="display text-xl text-ink tabular-nums">
                  {card.value.toLocaleString("ar-EG")}
                </p>
              </div>
            </article>
          ))}
        </section>
      )}

      {/* ═══════ Quick Actions — Unified for ALL roles (click-intercepted) ═══════ */}
      <section className="flex flex-wrap gap-3">
        <QuickActionButton
          to="/add"
          icon={<UserPlus size={16} />}
          label="إضافة مخدوم"
          color="green"
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
          label={
            role === "FURNITURE_WAREHOUSE_MANAGER"
              ? "إدارة مخزن الأجهزة والأثاث"
              : "طلب الأجهزة والأثاث"
          }
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
          label={
            role === "PHARMACY_WAREHOUSE_MANAGER"
              ? "إدارة مخزن الصيدلية"
              : "الصيدلية"
          }
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
          label={
            role === "SUPPLY_WAREHOUSE_MANAGER"
              ? "إدارة مخزن التموين"
              : "المخزن"
          }
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
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart */}
          <article className="paper-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="display text-sm text-muted-foreground">مصاريف القطاعات</h2>
              <button
                onClick={() => metrics[0] && setEditing(metrics[0])}
                className="text-xs text-muted-foreground hover:text-primary transition flex items-center gap-1"
              >
                <Pencil size={12} /> تعديل
              </button>
            </div>
            <div className="h-72 relative z-0">
              <ResponsiveContainer>
                <BarChart
                  data={metrics}
                  layout="vertical"
                  margin={{ top: 20, right: 20, left: 10, bottom: 20 }}
                >
                  <CartesianGrid horizontal={false} stroke="var(--color-border)" />
                  <XAxis type="number" stroke="var(--color-muted-foreground)" fontSize={11} />
                  <YAxis
                    type="category"
                    dataKey="sector"
                    stroke="var(--color-muted-foreground)"
                    fontSize={12}
                    width={10}
                    tick={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-paper-2)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar
                    dataKey="monthly"
                    stackId="a"
                    name="شهريات"
                    fill="var(--color-sky)"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar dataKey="study" stackId="a" name="مساعدات دراسية" fill="var(--color-teal)" />
                  <Bar
                    dataKey="therapeutic"
                    stackId="a"
                    name="مساعدات علاجية"
                    fill="var(--color-chart-3)"
                    radius={[0, 8, 8, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>

          {/* Pie Chart (admins only) */}
          <HiddenFamiliesPieCard
            metric={scopedHiddenFamilies}
            editable
            onEdit={() => setEditingHidden(true)}
          />
        </section>
      )}

      {/* ═══════ Zone 3: Recent Activity ═══════ */}
      {can("view:audit") && auditLog.length > 0 && (
        <section className="paper-card">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={16} className="text-muted-foreground" />
            <h2 className="display text-sm text-muted-foreground">آخر النشاطات</h2>
          </div>
          <div className="overflow-x-auto">
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
                      {new Date(entry.created_at).toLocaleDateString("ar-EG", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
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
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:hidden">
          <div className="paper-card">
            <h3 className="display text-sm text-muted-foreground mb-3 flex items-center gap-2">
              <Pencil size={14} /> تعديل قيم القطاعات
            </h3>
            <div className="space-y-2">
              {metrics.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setEditing(m)}
                  className="w-full text-start px-3 py-2 rounded-xl hover:bg-primary/10 text-sm transition"
                >
                  {m.sector}
                </button>
              ))}
            </div>
          </div>
          {hiddenFamilies && (
            <div className="paper-card">
              <h3 className="display text-sm text-muted-foreground mb-3 flex items-center gap-2">
                <Pencil size={14} /> تعديل الأسر المستترة
              </h3>
              <button
                onClick={() => setEditingHidden(true)}
                className="w-full text-start px-3 py-2 rounded-xl hover:bg-primary/10 text-sm transition"
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
          onSave={async (id, vals) => {
            await saveMetric({ data: { id, ...vals } });
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
          onSave={async (_id, vals) => {
            if (hiddenPersisted && hiddenFamilies.id) {
              await saveMetric({ data: { id: hiddenFamilies.id, ...vals } });
            } else {
              await saveHidden({ data: vals });
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

function HiddenFamiliesPieCard({
  metric,
  editable,
  onEdit,
}: {
  metric: Metric | null;
  editable: boolean;
  onEdit?: () => void;
}) {
  const pieData = metric
    ? [
        { name: "شهريات", value: Number(metric.monthly) },
        { name: "مساعدات دراسية", value: Number(metric.study) },
        { name: "مساعدات علاجية", value: Number(metric.therapeutic) },
      ]
    : [];

  const PIE_COLORS = ["var(--color-sky)", "var(--color-teal)", "var(--color-chart-3)"];

  return (
    <article className="paper-card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="display text-sm text-muted-foreground">الأسر المستترة</h2>
        {editable && (
          <button
            onClick={onEdit}
            className="text-xs text-muted-foreground hover:text-primary transition flex items-center gap-1"
          >
            <Pencil size={12} /> تعديل
          </button>
        )}
      </div>
      <div className="h-64">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={90} label>
              {pieData.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i]} />
              ))}
            </Pie>
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}

function QuickActionButton({
  to,
  search,
  icon,
  label,
  color,
  restricted,
  role,
}: {
  to: string;
  search?: Record<string, any>;
  icon: React.ReactNode;
  label: string;
  color: "green" | "dark";
  restricted: string[];
  role: string | null;
}) {
  const cls = color === "green" ? "chip-green" : "chip-dark";
  return (
    <Link
      to={to}
      search={search as any}
      onClick={(e) => {
        if (restricted.includes(role as any)) {
          e.preventDefault();
          toast.error("غير مصرح لك بهذا الحقل");
        }
      }}
      className={`${cls} text-sm !py-2.5 !px-5`}
    >
      {icon && <span className="ms-1.5">{icon}</span>} {label}
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
  onSave: (id: string, v: { monthly: number; study: number; therapeutic: number }) => void;
}) {
  const initial = metrics ? (metrics.find((m) => m.id === currentId) ?? metrics[0]) : metric!;
  const [selectedId, setSelectedId] = useState(initial.id);
  const [monthly, setMonthly] = useState(Number(initial.monthly));
  const [study, setStudy] = useState(Number(initial.study));
  const [therapeutic, setTherapeutic] = useState(Number(initial.therapeutic));

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
        <div className="flex gap-3 mt-6 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-full bg-muted text-foreground">
            إلغاء
          </button>
          <button
            onClick={() => onSave(selectedId, { monthly, study, therapeutic })}
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
