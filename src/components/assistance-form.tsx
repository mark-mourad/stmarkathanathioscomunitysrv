import { useState, useEffect } from "react";
import { Plus, Trash2, X, CheckCircle, XCircle, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import {
  AssistanceType,
  BridalCategory,
  BridalPrepDetail,
  MedicalAidDetail,
  APPLIANCE_TYPES,
  FURNITURE_TYPES,
  KITCHENWARE_TYPES,
  BEDDING_TYPES,
  CLOTHING_TYPES,
  MEDICAL_CATEGORIES,
  type AssistanceFormData,
} from "@/types/assistance";
import { getFamilyMemberAssistanceStatus } from "@/lib/church.functions";
import { cn } from "@/lib/utils";

interface AssistanceFormProps {
  individualId: string;
  familyMembers: Array<{ id: string; full_name: string }>;
  onClose: () => void;
  onSubmit: (data: AssistanceFormData) => Promise<void>;
}

const BRIDAL_CATEGORIES: { key: BridalCategory; label: string; types: readonly string[]; hasQuantity: boolean }[] = [
  { key: "appliances", label: "الأجهزة المنزلية", types: APPLIANCE_TYPES, hasQuantity: false },
  { key: "furniture", label: "الاثاث", types: FURNITURE_TYPES, hasQuantity: false },
  { key: "clothing", label: "الملابس", types: CLOTHING_TYPES, hasQuantity: true },
  { key: "kitchenware", label: "أدوات المطبخ", types: KITCHENWARE_TYPES, hasQuantity: true },
  { key: "bedding", label: "المفروشات", types: BEDDING_TYPES, hasQuantity: true },
];

export function AssistanceForm({ individualId, familyMembers, onClose, onSubmit }: AssistanceFormProps) {
  const [assistanceType, setAssistanceType] = useState<AssistanceType | "">("");
  const [familyMemberId, setFamilyMemberId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [assistanceStatus, setAssistanceStatus] = useState<Record<string, { hasBridal: boolean; hasMedical: boolean }>>({});
  const [expandedCategories, setExpandedCategories] = useState<Set<BridalCategory>>(new Set(["appliances"]));
  const [customClothingItems, setCustomClothingItems] = useState<Set<number>>(new Set());
  const fetchStatus = useServerFn(getFamilyMemberAssistanceStatus);

  useEffect(() => {
    fetchStatus({ data: { individual_id: individualId } }).then(setAssistanceStatus);
  }, [individualId, fetchStatus]);

  const getMemberStatusText = (memberId: string) => {
    const status = assistanceStatus[memberId];
    if (!status) return "";
    const parts: string[] = [];
    if (status.hasBridal) parts.push("يوجد تجهيز");
    if (status.hasMedical) parts.push("يوجد مساعدات علاجية");
    if (parts.length === 0) return "لا يوجد مساعدات";
    return parts.join("، ");
  };

  const toggleCategory = (cat: BridalCategory) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const [bridalDetails, setBridalDetails] = useState<Record<BridalCategory, BridalPrepDetail[]>>({
    appliances: [],
    furniture: [],
    clothing: [],
    kitchenware: [],
    bedding: [],
  });

  const [medicalDetails, setMedicalDetails] = useState<MedicalAidDetail[]>([]);

  const addBridalItem = (category: BridalCategory) => {
    setBridalDetails((prev) => ({
      ...prev,
      [category]: [
        ...prev[category],
        { category, item_type: "", quantity: 1, unit_price: 0, total_price: 0 },
      ],
    }));
  };

  const updateBridalItem = (category: BridalCategory, index: number, field: keyof BridalPrepDetail, value: any) => {
    setBridalDetails((prev) => {
      const updated = [...prev[category]];
      updated[index] = { ...updated[index], [field]: value };
      if (field === "quantity" || field === "unit_price") {
        updated[index].total_price = updated[index].quantity * updated[index].unit_price;
      }
      return { ...prev, [category]: updated };
    });
  };

  const removeBridalItem = (category: BridalCategory, index: number) => {
    setBridalDetails((prev) => ({
      ...prev,
      [category]: prev[category].filter((_, i) => i !== index),
    }));
  };

  const addMedicalItem = () => {
    setMedicalDetails((prev) => [
      ...prev,
      { category: "operation", service_name: "", total_price: 0, church_percentage: 0, church_amount: 0 },
    ]);
  };

  const updateMedicalItem = (index: number, field: keyof MedicalAidDetail, value: any) => {
    setMedicalDetails((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      if (field === "total_price" || field === "church_percentage") {
        updated[index].church_amount = (updated[index].total_price * updated[index].church_percentage) / 100;
      }
      return updated;
    });
  };

  const removeMedicalItem = (index: number) => {
    setMedicalDetails((prev) => prev.filter((_, i) => i !== index));
  };

  const calculateBridalTotal = (category: BridalCategory) => {
    return bridalDetails[category].reduce((sum, item) => sum + item.total_price, 0);
  };

  const calculateBridalGrandTotal = () => {
    return Object.values(bridalDetails).reduce((sum, items) => sum + items.reduce((s, item) => s + item.total_price, 0), 0);
  };

  const calculateMedicalTotal = () => {
    return medicalDetails.reduce((sum, item) => sum + item.total_price, 0);
  };

  const calculateMedicalChurchTotal = () => {
    return medicalDetails.reduce((sum, item) => sum + item.church_amount, 0);
  };

  const handleSubmit = async () => {
    if (!assistanceType) {
      toast.error("يرجى اختيار نوع المساعدة");
      return;
    }
    if (assistanceType === "bridal_prep" && calculateBridalGrandTotal() === 0) {
      toast.error("يرجى إضافة عناصر لتجهيز العرايس");
      return;
    }
    if (assistanceType === "medical_aid" && medicalDetails.length === 0) {
      toast.error("يرجى إضافة مساعدات علاجية");
      return;
    }
    setBusy(true);
    try {
      const formData: AssistanceFormData = {
        family_member_id: familyMemberId === "" ? null : familyMemberId,
        assistance_type: assistanceType,
        notes,
        bridal_details: assistanceType === "bridal_prep" ? bridalDetails : {
          appliances: [], furniture: [], clothing: [], kitchenware: [], bedding: [],
        },
        medical_details: assistanceType === "medical_aid" ? medicalDetails : [],
      };
      await onSubmit(formData);
      toast.success("تم حفظ المساعدة بنجاح");
      onClose();
    } catch (err: any) {
      toast.error(err?.message ?? "حدث خطأ");
    } finally {
      setBusy(false);
    }
  };

  const inputClass = "w-full bg-paper rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring border border-border/60";
  const selectClass = "w-full bg-paper rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring border border-border/60 appearance-none";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="display text-lg text-ink">إضافة مساعدة</h2>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition">
          <X size={18} />
        </button>
      </div>

      <div className="paper-card space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">المخدوم / فرد الأسرة</label>
            <select
              value={familyMemberId}
              onChange={(e) => setFamilyMemberId(e.target.value)}
              className={selectClass}
            >
              <option value="">{familyMembers[0]?.full_name || "المخدوم الرئيسي"}</option>
              {familyMembers.slice(1).map((member) => (
                <option key={member.id} value={member.id}>
                  {member.full_name} {getMemberStatusText(member.id) ? `(${getMemberStatusText(member.id)})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">نوع المساعدة <span className="text-destructive">*</span></label>
            <select
              value={assistanceType}
              onChange={(e) => setAssistanceType(e.target.value as AssistanceType | "")}
              className={cn(selectClass, !assistanceType && "text-muted-foreground")}
            >
              <option value="">— اختر نوع المساعدة —</option>
              <option value="bridal_prep">تجهيز عرايس</option>
              <option value="medical_aid">مساعدة علاجية</option>
            </select>
          </div>
        </div>
        {(() => {
          const activeId = familyMemberId || individualId;
          const statusText = getMemberStatusText(activeId);
          if (!statusText) return null;
          const hasAny = statusText.includes("يوجد");
          return (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {hasAny ? <CheckCircle size={12} className="text-success" /> : <XCircle size={12} />}
              <span>{statusText}</span>
            </div>
          );
        })()}
      </div>

      {assistanceType === "bridal_prep" && (
        <div className="space-y-3">
          {BRIDAL_CATEGORIES.map((cat) => {
            const items = bridalDetails[cat.key];
            const total = calculateBridalTotal(cat.key);
            const isExpanded = expandedCategories.has(cat.key);
            return (
              <div key={cat.key} className="paper-card overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleCategory(cat.key)}
                  className="w-full flex items-center justify-between py-1 text-start transition hover:bg-muted/30 -mx-1.5 px-1.5 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{cat.label}</span>
                    {items.length > 0 && (
                      <span className="text-[10px] font-bold bg-primary/10 text-primary rounded-full px-1.5 py-0.5 tabular-nums">
                        {items.length}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {total > 0 && (
                      <span className="text-xs font-semibold text-muted-foreground tabular-nums">
                        {total.toLocaleString("ar-EG")} ج.م
                      </span>
                    )}
                    {isExpanded ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="mt-3 space-y-2">
                    {items.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-2">لا توجد عناصر مضافة</p>
                    )}
                    {items.map((item, i) => (
                      <div key={i} className="flex gap-2 items-end bg-muted/20 rounded-lg p-2">
                        {cat.hasQuantity ? (
                          <>
                            <div className="w-16 shrink-0">
                              <label className="text-[10px] text-muted-foreground block mb-0.5">العدد</label>
                              <input
                                type="number"
                                value={item.quantity}
                                min="1"
                                onChange={(e) => updateBridalItem(cat.key, i, "quantity", Number(e.target.value) || 1)}
                                className={cn(inputClass, "px-2 py-1 text-center")}
                              />
                            </div>
                            <div className="flex-1">
                              <label className="text-[10px] text-muted-foreground block mb-0.5">النوع</label>
                              {cat.key === "clothing" && customClothingItems.has(i) ? (
                                <input
                                  type="text"
                                  value={item.item_type === "أخرى" ? "" : item.item_type}
                                  onChange={(e) => updateBridalItem(cat.key, i, "item_type", e.target.value)}
                                  className={cn(inputClass, "px-2 py-1")}
                                  placeholder="تحديد النوع"
                                />
                              ) : (
                                <select
                                  value={item.item_type}
                                  onChange={(e) => {
                                    if (e.target.value === "أخرى") {
                                      setCustomClothingItems((prev) => new Set(prev).add(i));
                                      updateBridalItem(cat.key, i, "item_type", "");
                                    } else {
                                      setCustomClothingItems((prev) => {
                                        const next = new Set(prev);
                                        next.delete(i);
                                        return next;
                                      });
                                      updateBridalItem(cat.key, i, "item_type", e.target.value);
                                    }
                                  }}
                                  className={cn(selectClass, "px-2 py-1")}
                                >
                                  <option value="">اختر</option>
                                  {cat.types.map((type) => (
                                    <option key={type} value={type}>{type}</option>
                                  ))}
                                </select>
                              )}
                            </div>
                            <div className="w-20 shrink-0">
                              <label className="text-[10px] text-muted-foreground block mb-0.5">سعر القطعة</label>
                              <input
                                type="number"
                                value={item.unit_price || ""}
                                onChange={(e) => updateBridalItem(cat.key, i, "unit_price", Number(e.target.value) || 0)}
                                className={cn(inputClass, "px-2 py-1")}
                              />
                            </div>
                            <div className="w-20 shrink-0 text-end">
                              <label className="text-[10px] text-muted-foreground block mb-0.5">الإجمالي</label>
                              <div className="text-sm font-semibold py-1 tabular-nums">{item.total_price.toLocaleString("ar-EG")}</div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex-1">
                              <label className="text-[10px] text-muted-foreground block mb-0.5">النوع</label>
                              <select
                                value={item.item_type}
                                onChange={(e) => updateBridalItem(cat.key, i, "item_type", e.target.value)}
                                className={cn(selectClass, "px-2 py-1")}
                              >
                                <option value="">اختر</option>
                                {cat.types.map((type) => (
                                  <option key={type} value={type}>{type}</option>
                                ))}
                              </select>
                            </div>
                            <div className="w-24 shrink-0">
                              <label className="text-[10px] text-muted-foreground block mb-0.5">السعر</label>
                              <input
                                type="number"
                                value={item.total_price || ""}
                                onChange={(e) => updateBridalItem(cat.key, i, "total_price", Number(e.target.value) || 0)}
                                className={cn(inputClass, "px-2 py-1")}
                              />
                            </div>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => removeBridalItem(cat.key, i)}
                          className="text-destructive/60 hover:text-destructive hover:bg-destructive/10 p-1.5 rounded-lg transition shrink-0"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addBridalItem(cat.key)}
                      className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-primary hover:bg-primary/5 rounded-lg py-1.5 transition"
                    >
                      <Plus size={13} /> إضافة {cat.label}
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {calculateBridalGrandTotal() > 0 && (
            <div className="paper-card bg-primary/5 border border-primary/20">
              <div className="flex justify-between text-base font-bold display">
                <span>الإجمالي الكلي</span>
                <span>{calculateBridalGrandTotal().toLocaleString("ar-EG")} ج.م</span>
              </div>
            </div>
          )}
        </div>
      )}

      {assistanceType === "medical_aid" && (
        <div className="paper-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">المساعدات العلاجية</h3>
            <button
              type="button"
              onClick={addMedicalItem}
              className="text-xs font-semibold text-primary hover:bg-primary/5 rounded-lg px-2 py-1 flex items-center gap-1 transition"
            >
              <Plus size={13} /> إضافة
            </button>
          </div>

          {medicalDetails.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">اضغط "إضافة" لبدء تسجيل المساعدات العلاجية</p>
          )}

          <div className="space-y-3">
            {medicalDetails.map((item, i) => (
              <div key={i} className="bg-muted/20 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-muted-foreground">عنصر {i + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeMedicalItem(i)}
                    className="text-destructive/60 hover:text-destructive hover:bg-destructive/10 p-1 rounded transition text-xs flex items-center gap-1"
                  >
                    <Trash2 size={12} /> حذف
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-muted-foreground block mb-0.5">نوع الخدمة</label>
                    <select
                      value={item.category}
                      onChange={(e) => updateMedicalItem(i, "category", e.target.value)}
                      className={cn(selectClass, "px-2 py-1")}
                    >
                      {MEDICAL_CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground block mb-0.5">اسم العلاج / الخدمة</label>
                    <input
                      type="text"
                      value={item.service_name}
                      onChange={(e) => updateMedicalItem(i, "service_name", e.target.value)}
                      className={cn(inputClass, "px-2 py-1")}
                      placeholder="اسم الخدمة"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-muted-foreground block mb-0.5">السعر</label>
                    <input
                      type="number"
                      value={item.total_price || ""}
                      onChange={(e) => updateMedicalItem(i, "total_price", Number(e.target.value) || 0)}
                      className={cn(inputClass, "px-2 py-1")}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground block mb-0.5">نسبة الكنيسة %</label>
                    <input
                      type="number"
                      value={item.church_percentage || ""}
                      onChange={(e) => updateMedicalItem(i, "church_percentage", Number(e.target.value) || 0)}
                      className={cn(inputClass, "px-2 py-1")}
                      min="0"
                      max="100"
                    />
                  </div>
                  <div className="text-end">
                    <label className="text-[10px] text-muted-foreground block mb-0.5">مبلغ الكنيسة</label>
                    <div className="text-sm font-semibold text-success py-1 tabular-nums">
                      {item.church_amount.toLocaleString("ar-EG")} ج.م
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {medicalDetails.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border space-y-1">
              <div className="flex justify-between text-sm font-semibold">
                <span>الإجمالي الكلي</span>
                <span className="tabular-nums">{calculateMedicalTotal().toLocaleString("ar-EG")} ج.م</span>
              </div>
              <div className="flex justify-between text-sm font-semibold text-success">
                <span>إجمالي ما صرفته الكنيسة</span>
                <span className="tabular-nums">{calculateMedicalChurchTotal().toLocaleString("ar-EG")} ج.م</span>
              </div>
            </div>
          )}
        </div>
      )}

      {assistanceType && (
        <div className="paper-card">
          <label className="block text-xs font-semibold text-muted-foreground mb-1">ملاحظات</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-paper rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring border border-border/60 resize-none"
            rows={2}
            placeholder="أي ملاحظات إضافية..."
          />
        </div>
      )}

      {assistanceType && (
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-muted text-sm"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={busy}
            className="chip-green px-6 py-2 text-sm disabled:opacity-60"
          >
            {busy ? "جارٍ الحفظ..." : "حفظ"}
          </button>
        </div>
      )}
    </div>
  );
}
