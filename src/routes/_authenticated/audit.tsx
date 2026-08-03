import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getAuditLog, deleteAuditLog } from "@/lib/church.functions";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/audit")({
  head: () => ({ meta: [{ title: "سجل النشاط" }] }),
  component: AuditPage,
});

function AuditPage() {
  const { can, role } = useAuth();
  const router = useRouter();
  const auditRestricted = ["SUPPLY_WAREHOUSE_MANAGER", "FURNITURE_WAREHOUSE_MANAGER", "PHARMACY_WAREHOUSE_MANAGER", "BRIDE_AND_MEDICAL_AIDS_MANAGER", "BLESSING_DISTRIBUTOR"];

  useEffect(() => {
    if (auditRestricted.includes(role as any)) {
      toast.error("غير مصرح لك بهذا الحقل");
      router.navigate({ to: "/" });
    }
  }, [role]);

  if (auditRestricted.includes(role as any)) {
    return <div className="text-center py-8 text-muted-foreground">جاري التوجيه...</div>;
  }
  const fetchLog = useServerFn(getAuditLog);
  const deleteHistory = useServerFn(deleteAuditLog);
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    if (can("view:audit")) fetchLog().then(setRows);
  }, []);

  const handleClearHistory = async () => {
    const confirmed = window.confirm("هل أنت متأكد من مسح سجل التعديلات بالكامل؟ لا يمكن التراجع عن هذا الإجراء.");
    if (!confirmed) return;

    try {
      await deleteHistory();
      const freshRows = await fetchLog();
      setRows(freshRows);
      toast.success("تم مسح سجل النشاط بالكامل");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(message || "حدث خطأ أثناء محاولة المسح");
      console.error(error);
    }
  };

  if (!can("view:audit")) return <div className="paper-card text-center">غير مصرح.</div>;

  const labelOf = (a: string) =>
    a === "INSERT" ? "إضافة" : a === "UPDATE" ? "تعديل" : a === "DELETE" ? "حذف" : a;
  const tableLabel: Record<string, string> = {
    individuals: "المخدومين",
    family_members: "أفراد الأسرة",
    financials: "البيانات المالية",
    dashboard_metrics: "قيم اللوحة",
  };

  return (
    <div className="paper-card">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
        <h2 className="display text-xl">سجل التعديلات</h2>
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
              {["الوقت","المستخدم","العملية","الجهة","المعرف"].map(h => (
                <th key={h} className="text-start px-2 py-2 border-b border-border font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-border/60">
                <td className="px-2 py-2 tabular-nums" dir="ltr">
                  {new Date(r.created_at).toLocaleString("ar-EG")}
                </td>
                <td className="px-2 py-2">{r.user_email || "—"}</td>
                <td className="px-2 py-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    r.action === "DELETE" ? "bg-destructive/15 text-destructive"
                    : r.action === "UPDATE" ? "bg-sky/30 text-primary"
                    : "bg-success/15 text-success"
                  }`}>{labelOf(r.action)}</span>
                </td>
                <td className="px-2 py-2">{tableLabel[r.table_name] ?? r.table_name}</td>
                <td className="px-2 py-2 text-muted-foreground" dir="ltr">{r.record_id}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">لا توجد تعديلات بعد</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
