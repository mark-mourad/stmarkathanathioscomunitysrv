import { useState } from "react";
import { Plus, Trash2, Calendar, User, HeartHandshake, Stethoscope, Package, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { deleteAssistanceLog } from "@/lib/church.functions";
import type { AssistanceLog } from "@/types/assistance";

interface AssistanceHistoryProps {
  individualId: string;
  individualName: string;
  familyMembers: Array<{ id: string; full_name: string }>;
  logs: AssistanceLog[];
  onAddNew: () => void;
  onRefresh: () => void;
}

export function AssistanceHistory({ individualId, individualName, familyMembers, logs, onAddNew, onRefresh }: AssistanceHistoryProps) {
  const [deleting, setDeleting] = useState<string | null>(null);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await deleteAssistanceLog({ data: { id } });
      toast.success("تم حذف المساعدة");
      onRefresh();
    } catch (err: any) {
      toast.error(err?.message ?? "فشل الحذف");
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getMemberName = (log: AssistanceLog) => {
    if (!log.family_member_id) return individualName;
    const member = familyMembers.find(m => m.id === log.family_member_id);
    return member?.full_name || "فرد من الأسرة";
  };

  const getAssistanceTypeLabel = (type: string) => {
    return type === "bridal_prep" ? "تجهيز عرايس" : "مساعدة علاجية";
  };

  const getAssistanceIcon = (type: string) => {
    return type === "bridal_prep" ? <Package size={16} /> : <Stethoscope size={16} />;
  };

  const getAssistanceColor = (type: string) => {
    return type === "bridal_prep" ? "text-primary" : "text-success";
  };

  const calculateGrandTotal = () => {
    return logs.reduce((sum, log) => sum + Number(log.total_amount), 0);
  };

  const renderBridalDetails = (log: AssistanceLog) => {
    const details = log.bridal_prep_details as any[] || [];
    if (!details.length) return null;

    const categories: Record<string, { label: string; items: any[] }> = {
      appliances: { label: "الأجهزة المنزلية", items: [] },
      furniture: { label: "الاثاث", items: [] },
      clothing: { label: "الملابس", items: [] },
      kitchenware: { label: "أدوات المطبخ", items: [] },
      bedding: { label: "المفروشات", items: [] },
    };

    details.forEach(item => {
      if (categories[item.category]) {
        categories[item.category].items.push(item);
      }
    });

    return (
      <div className="mt-4 space-y-3 pt-4 border-t border-border">
        {Object.entries(categories).map(([key, cat]) => {
          if (!cat.items.length) return null;
          const categoryTotal = cat.items.reduce((sum, item) => sum + Number(item.total_price), 0);
          return (
            <div key={key}>
              <div className="font-semibold text-sm mb-2">{cat.label}</div>
              <div className="space-y-1 text-xs">
                {cat.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-muted-foreground">
                    <span>{item.item_type} {item.quantity > 1 ? `(${item.quantity})` : ''}</span>
                    <span>{Number(item.total_price).toLocaleString("ar-EG")} ج.م</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-semibold text-sm mt-1">
                <span>إجمالي {cat.label}</span>
                <span>{categoryTotal.toLocaleString("ar-EG")} ج.م</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderMedicalDetails = (log: AssistanceLog) => {
    const details = log.medical_aid_details as any[] || [];
    if (!details.length) return null;

    const categoryLabels: Record<string, string> = {
      operation: "عملية",
      radiology: "إشاعة",
      lab_test: "تحليل",
      medication: "علاجات",
      checkup: "كشف",
      external_treatment: "علاج خارجي",
    };

    return (
      <div className="mt-4 pt-4 border-t border-border">
        <div className="space-y-2">
          {details.map((item, i) => (
            <div key={i} className="text-xs">
              <div className="flex justify-between items-center">
                <span className="font-semibold">{categoryLabels[item.category] || item.category}</span>
                <span className="font-bold">{Number(item.total_price).toLocaleString("ar-EG")} ج.م</span>
              </div>
              <div className="text-muted-foreground">{item.service_name}</div>
              <div className="flex justify-between text-success mt-1">
                <span>تحملت الكنيسة ({item.church_percentage}%):</span>
                <span>{Number(item.church_amount).toLocaleString("ar-EG")} ج.م</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header with Add Button and Grand Total */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="display text-xl text-ink">سجل المساعدات</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {logs.length === 0 ? "لا توجد مساعدات سابقة" : `${logs.length} مساعدة`}
          </p>
        </div>
        <button
          onClick={onAddNew}
          className="chip-green px-4 py-2 flex items-center gap-2"
        >
          <Plus size={16} /> إضافة مساعدة جديدة
        </button>
      </div>

      {/* Grand Total */}
      {logs.length > 0 && (
        <div className="paper-card bg-primary/5 border-primary">
          <div className="flex justify-between text-lg font-bold display">
            <span>الإجمالي الكلي لجميع المساعدات</span>
            <span>{calculateGrandTotal().toLocaleString("ar-EG")} ج.م</span>
          </div>
        </div>
      )}

      {/* History List */}
      {logs.length === 0 ? (
        <div className="paper-card text-center py-12">
          <HeartHandshake size={48} className="mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">لا توجد مساعدات مسجلة لهذا المخدوم</p>
          <p className="text-sm text-muted-foreground mt-2">اضغط على "إضافة مساعدة جديدة" للبدء</p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <div key={log.id} className="paper-card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`inline-flex items-center gap-1 text-sm font-semibold ${getAssistanceColor(log.assistance_type)}`}>
                      {getAssistanceIcon(log.assistance_type)}
                      {getAssistanceTypeLabel(log.assistance_type)}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar size={12} />
                      {formatDate(log.created_at)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2 text-sm">
                    <User size={14} className="text-muted-foreground" />
                    <span className="text-muted-foreground">للمخدوم:</span>
                    <span className="font-semibold">{getMemberName(log)}</span>
                  </div>

                  <div className="text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">الإجمالي:</span>
                      <span className="font-bold display">{Number(log.total_amount).toLocaleString("ar-EG")} ج.م</span>
                    </div>
                    {log.notes && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        <span className="font-semibold">ملاحظات:</span> {log.notes}
                      </div>
                    )}
                  </div>

                  {/* Detailed Breakdown */}
                  {expandedLog === log.id && (
                    <>
                      {log.assistance_type === "bridal_prep" && renderBridalDetails(log)}
                      {log.assistance_type === "medical_aid" && renderMedicalDetails(log)}
                    </>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                    className="text-muted-foreground hover:text-foreground p-2 rounded transition"
                  >
                    {expandedLog === log.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  <button
                    onClick={() => handleDelete(log.id)}
                    disabled={deleting === log.id}
                    className="text-destructive hover:bg-destructive/10 p-2 rounded transition disabled:opacity-60"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
