import { useState, useEffect, useMemo } from "react";
import React from "react";
import { Plus, Trash2 } from "lucide-react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useServerFn } from "@tanstack/react-start";
import { getSaintFamilies, normalizeGender } from "@/lib/church.functions";
import { getVisibleSaintFamilyValues, type Role } from "@/lib/permissions";

// Egyptian Governorate codes from National ID (digits 8-9)
const GOVERNORATE_CODES: Record<string, string> = {
  "01": "القاهرة",
  "02": "الإسكندرية",
  "03": "بورسعيد",
  "04": "السويس",
  "11": "دمياط",
  "12": "الدقهلية",
  "13": "الشرقية",
  "14": "القليوبية",
  "15": "كفر الشيخ",
  "16": "الغربية",
  "17": "المنوفية",
  "18": "البحيرة",
  "19": "الإسماعيلية",
  "21": "الجيزة",
  "22": "بني سويف",
  "23": "الفيوم",
  "24": "المنيا",
  "25": "أسيوط",
  "26": "سوهاج",
  "27": "قنا",
  "28": "أسوان",
  "29": "الأقصر",
  "31": "البحر الأحمر",
  "32": "الوادي الجديد",
  "33": "مطروح",
  "34": "شمال سيناء",
  "35": "جنوب سيناء",
  "88": "خارج الجمهورية",
};

const SAINT_FAMILIES = [
  { value: "متى", label: "متى" },
  { value: "مرقس", label: "مرقس" },
  { value: "لوقا", label: "لوقا" },
  { value: "يوحنا", label: "يوحنا" },
  { value: "أسر مستترة", label: "أسر مستترة" },
];

const HOUSING_TYPES = [
  { value: "تمليك", label: "تمليك" },
  { value: "ايجار قديم", label: "ايجار قديم" },
  { value: "ايجار جديد", label: "ايجار جديد" },
  { value: "أخرى", label: "أخرى" },
];

const GENDER_TYPES = [
  { value: "male", label: "ذكر" },
  { value: "female", label: "أنثى" },
];

const RELATION_OPTIONS = [
  { value: "زوج", label: "زوج" },
  { value: "ابن", label: "ابن" },
  { value: "ابنة", label: "ابنة" },
  { value: "آخر", label: "آخر" },
];

// Parse Egyptian National ID to extract birth date and governorate
// Format: C YY MM DD GG ... (14 digits total)
// C = Century digit (2 = 1900s, 3 = 2000s)
// YY = Year (digits 2-3, indices 1-2)
// MM = Month (digits 4-5, indices 3-4)
// DD = Day (digits 6-7, indices 5-6)
// GG = Governorate code (digits 8-9, indices 7-8)
function parseEgyptianNationalId(id: string) {
  if (!id || id.length !== 14 || !/^\d{14}$/.test(id)) {
    return { birthDate: null, governorate: null, age: null };
  }

  // Extract century from 1st digit (index 0)
  const centuryDigit = id.charAt(0);
  let century = "";
  if (centuryDigit === "2") {
    century = "19";
  } else if (centuryDigit === "3") {
    century = "20";
  } else {
    return { birthDate: null, governorate: null, age: null };
  }

  // Extract year (digits 2-3, indices 1-2)
  const yearYY = id.substring(1, 3);
  const year = century + yearYY;

  // Extract month (digits 4-5, indices 3-4)
  const month = id.substring(3, 5);

  // Extract day (digits 6-7, indices 5-6)
  const day = id.substring(5, 7);

  // Validate day (1-31) and month (1-12) strictly
  const monthNum = parseInt(month, 10);
  const dayNum = parseInt(day, 10);
  
  // Strict validation: day must be 1-31, month must be 1-12
  if (monthNum < 1 || monthNum > 12 || dayNum < 1 || dayNum > 31) {
    return { birthDate: null, governorate: null, age: null };
  }
  
  // Additional validation: check for impossible dates
  const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (dayNum > daysInMonth[monthNum - 1]) {
    return { birthDate: null, governorate: null, age: null };
  }

  // Format as YYYY-MM-DD for Postgres
  const birthDate = `${year}-${month}-${day}`;

  // Calculate exact age from birth date
  const birthDateObj = new Date(parseInt(year), monthNum - 1, dayNum);
  const today = new Date();
  let age = today.getFullYear() - birthDateObj.getFullYear();
  const monthDiff = today.getMonth() - birthDateObj.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
    age--;
  }

  // Extract governorate code (digits 8-9, indices 7-8)
  const governorateCode = id.substring(7, 9);
  const governorate = GOVERNORATE_CODES[governorateCode] || null;

  return { birthDate, governorate, age };
}

function calculateAgeFromBirthDate(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const parts = birthDate.split("-");
  if (parts.length !== 3) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  const birth = new Date(year, month - 1, day);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export type FamilyRow = {
  full_name: string;
  national_id?: string;
  relation?: string;
  relation_custom?: string;
  insurance_number?: string;
  marital_status?: string;
  confession_father?: string;
  school_or_job?: string;
  income?: number;
  notes?: string;
};

export const APPLIANCES = [
  { k: "has_washing_machine", l: "غسالة" },
  { k: "has_fridge", l: "ثلاجة" },
  { k: "has_stove", l: "بوتاجاز" },
  { k: "has_mattress", l: "مرتبة" },
  { k: "has_computer", l: "كمبيوتر" },
  { k: "has_sofa", l: "كنبة" },
  { k: "has_dining", l: "سفرة" },
  { k: "has_tv", l: "تلفزيون" },
  { k: "has_wardrobe", l: "دولاب" },
] as const;

export type ChurchSupportRow = {
  church_name: string;
  amount: number;
};

export type IndividualFormData = {
  ind: Record<string, any>;
  family: FamilyRow[];
  fin: Record<string, number>;
  churchSupport: ChurchSupportRow[];
};

type Props = {
  initialInd?: Record<string, any>;
  initialFamily?: FamilyRow[];
  initialFin?: Record<string, number>;
  initialChurchSupport?: ChurchSupportRow[];
  submitLabel: string;
  busy?: boolean;
  onSubmit: (data: IndividualFormData) => void | Promise<void>;
  onCancel?: () => void;
  lockFamily?: boolean;
  role?: Role | null;
};

export function IndividualForm({
  initialInd = {},
  initialFamily = [{ full_name: "" }],
  initialFin = {},
  initialChurchSupport = [],
  submitLabel,
  busy = false,
  onSubmit,
  onCancel,
  lockFamily = false,
  role = null,
}: Props) {
  const [ind, setInd] = useState<Record<string, any>>(initialInd);
  const [family, setFamily] = useState<FamilyRow[]>(initialFamily);
  const [fin, setFin] = useState<Record<string, number>>(initialFin);
  const [churchSupport, setChurchSupport] = useState<ChurchSupportRow[]>(initialChurchSupport);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const visibleFamilyValues = useMemo(
    () => (role ? getVisibleSaintFamilyValues(role) : SAINT_FAMILIES.map((f) => f.value)),
    [role],
  );
  const [saintFamilies, setSaintFamilies] = useState<Array<{ value: string; label: string }>>(
    SAINT_FAMILIES.filter((f) => visibleFamilyValues.includes(f.value)),
  );
  const fetchSaintFamilies = useServerFn(getSaintFamilies);

  useEffect(() => {
    fetchSaintFamilies().then((families) => {
      if (families && families.length > 0) {
        setSaintFamilies(families.filter((f) => visibleFamilyValues.includes(f.value)));
      }
    }).catch(() => {
      // Fallback to static list if fetch fails
      setSaintFamilies(SAINT_FAMILIES.filter((f) => visibleFamilyValues.includes(f.value)));
    });
  }, [fetchSaintFamilies, visibleFamilyValues]);

  function set<T extends string>(key: T, v: any) {
    setFieldErrors((prev) => {
      if (prev[key]) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return prev;
    });
    setInd((s) => {
      const nextValue = key === "gender" ? normalizeGender(v) ?? v : v;
      const updated = { ...s, [key]: nextValue };

      // When National ID changes, auto-extract birth date, governorate, and age
      if (key === "national_id" && v.length === 14) {
        const { birthDate, governorate, age } = parseEgyptianNationalId(v);
        if (birthDate) {
          updated.birth_date = birthDate;
        }
        if (governorate) {
          updated.birth_governorate = governorate;
        }
        updated.calculated_age = age;
      }

      return updated;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    const errors: Record<string, string> = {};
    
    // Client-side validation for mandatory fields
    const gender = normalizeGender(ind.gender);
    if (!gender) {
      errors.gender = "يرجى اختيار النوع (ذكر/أنثى)";
    }
    
    if (!ind.saint_family) {
      errors.saint_family = "يرجى اختيار أسرة القديس";
    }
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    
    await onSubmit({ ind: { ...ind, gender }, family, fin, churchSupport });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="paper-card">
        <h2 className="display text-xl mb-4 text-ink">بيانات المخدوم</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TInput label="الاسم" required value={ind.full_name ?? ""} onChange={(v) => set("full_name", v)} />
          <TInput label="اسم الشهرة" value={ind.nickname ?? ""} onChange={(v) => set("nickname", v)} />
          <TSelect
            label="النوع"
            value={normalizeGender(ind.gender)}
            onChange={(v) => set("gender", v)}
            options={GENDER_TYPES}
            placeholder="اختر النوع"
            required
            errorMsg={fieldErrors.gender}
          />
          <TInput label="اسم الأم" value={ind.mother_name ?? ""} onChange={(v) => set("mother_name", v)} />
          <TInput
            label="الرقم القومي"
            required
            maxLength={14}
            value={ind.national_id ?? ""}
            onChange={(v) => set("national_id", v)}
            pattern="\d{14}"
            errorMsg={
              ind.national_id && !/^\d{14}$/.test(ind.national_id)
                ? "يجب أن يكون الرقم القومي 14 رقم بالضبط"
                : ""
            }
          />
          <TInput
            label="تاريخ الميلاد"
            value={ind.birth_date ?? ""}
            readOnly
          />
          <TInput
            label="محافظة الميلاد"
            value={ind.birth_governorate ?? ""}
            readOnly
          />
          <TInput
            label="العمر / السن"
            value={ind.calculated_age != null ? String(ind.calculated_age) : (ind.birth_date ? String(calculateAgeFromBirthDate(ind.birth_date) ?? "") : "")}
            readOnly
          />
          <TInput label="الوظيفة" value={ind.job ?? ""} onChange={(v) => set("job", v)} />
          <TInput label="الراتب" type="number" value={ind.salary ?? ""} onChange={(v) => set("salary", v)} />
          <TInput label="رقم الموبايل" value={ind.phone ?? ""} onChange={(v) => set("phone", v)} />
          <TInput label="رقم موبايل آخر" value={ind.mobile ?? ""} onChange={(v) => set("mobile", v)} />
          <TInput label="تلفون أرضي" value={ind.landline ?? ""} onChange={(v) => set("landline", v)} />
          <TInput label="أب الاعتراف" value={ind.confession_father ?? ""} onChange={(v) => set("confession_father", v)} />
          <TSelect
            label="أسرة القديس"
            value={ind.saint_family ?? ""}
            onChange={(v) => set("saint_family", v)}
            options={saintFamilies}
            placeholder="اختر أسرة القديس"
            required
            errorMsg={fieldErrors.saint_family}
            disabled={lockFamily}
          />
          <div>
            <TSelect
              label="نوع السكن"
              value={ind.housing_type ?? ""}
              onChange={(v) => set("housing_type", v)}
              options={HOUSING_TYPES}
              placeholder="اختر نوع السكن"
            />
            {ind.housing_type === "أخرى" && (
              <div className="mt-2">
                <TInput
                  label="نوع السكن (حسب التخصيص)"
                  value={ind.housing_type_other ?? ""}
                  onChange={(v) => set("housing_type_other", v)}
                  placeholder="أدخل نوع السكن"
                />
              </div>
            )}
          </div>
          <TInput label="عدد الأفراد" type="number" value={ind.household_count ?? ""} onChange={(v) => set("household_count", v)} />
          <TInput label="عدد الغرف" type="number" value={ind.rooms ?? ""} onChange={(v) => set("rooms", v)} />
          <TInput label="العنوان بالتفصيل" value={ind.address ?? ""} onChange={(v) => set("address", v)} className="md:col-span-3" />
        </div>

        {/* Alternative Address Section */}
        <div className="mt-4 pt-4 border-t border-border">
          <label className="flex items-center gap-2 mb-3">
            <input
              type="checkbox"
              checked={!!ind.has_alt_address}
              onChange={(e) => set("has_alt_address", e.target.checked)}
              className="accent-[color:var(--color-primary)]"
            />
            <span className="text-sm font-semibold text-muted-foreground">سكن آخر</span>
          </label>
          {ind.has_alt_address && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
              <TInput
                label="عنوان السكن الآخر"
                value={ind.alt_address ?? ""}
                onChange={(v) => set("alt_address", v)}
                className="md:col-span-2"
              />
              <TSelect
                label="محافظة السكن الآخر"
                value={ind.alt_governorate ?? ""}
                onChange={(v) => set("alt_governorate", v)}
                options={Object.entries(GOVERNORATE_CODES).map(([code, name]) => ({ value: name, label: name }))}
                placeholder="اختر المحافظة"
              />
            </div>
          )}
        </div>

        <h3 className="display text-sm mt-6 mb-2 text-muted-foreground">المنقولات المنزلية</h3>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
          {APPLIANCES.map((a) => (
            <label
              key={a.k}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-paper border border-border cursor-pointer hover:bg-primary/5"
            >
              <input
                type="checkbox"
                checked={!!ind[a.k]}
                onChange={(e) => set(a.k, e.target.checked)}
                className="accent-[color:var(--color-primary)]"
              />
              <span className="text-sm font-semibold">{a.l}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="paper-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="display text-xl text-ink">أفراد الأسرة</h2>
          <button
            type="button"
            onClick={() => setFamily((s) => [...s, { full_name: "" }])}
            className="chip-green px-4 py-2 text-sm"
          >
            <Plus size={14} className="inline-block ms-1" /> إضافة فرد
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-muted-foreground">
                {["م","الاسم","الرقم القومي","صلة القرابة","الحالة الاجتماعية","أب الاعتراف","السنة الدراسية/الوظيفة","الدخل","ملاحظات",""].map((h) => (
                  <th key={h} className="px-2 py-2 text-start font-semibold border-b border-border">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {family.map((f, i) => (
                <tr key={i} className="border-b border-border/60">
                  <td className="px-2 py-1 text-muted-foreground">{i + 1}</td>
                  <td className="px-1 py-1">
                    <input
                      value={f.full_name ?? ""}
                      onChange={(e) => setFamily((s) => s.map((r, ri) => ri === i ? { ...r, full_name: e.target.value } : r))}
                      className="w-full bg-paper rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-ring"
                    />
                  </td>
                  <td className="px-1 py-1">
                    <input
                      value={f.national_id ?? ""}
                      onChange={(e) => setFamily((s) => s.map((r, ri) => ri === i ? { ...r, national_id: e.target.value } : r))}
                      className="w-full bg-paper rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-ring"
                    />
                  </td>
                  <td className="px-1 py-1">
                    <select
                      value={f.relation ?? ""}
                      onChange={(e) => setFamily((s) => s.map((r, ri) => ri === i ? { ...r, relation: e.target.value, relation_custom: e.target.value !== "آخر" ? undefined : r.relation_custom } : r))}
                      className="w-full bg-paper rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-ring text-sm"
                    >
                      <option value="">اختر...</option>
                      {RELATION_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    {f.relation === "آخر" && (
                      <input
                        value={f.relation_custom ?? ""}
                        onChange={(e) => setFamily((s) => s.map((r, ri) => ri === i ? { ...r, relation_custom: e.target.value } : r))}
                        className="w-full bg-paper rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-ring mt-1 text-sm"
                        placeholder="حدد العلاقة"
                      />
                    )}
                    {f.relation === "ابنة" && (
                      <input
                        value={f.insurance_number ?? ""}
                        onChange={(e) => setFamily((s) => s.map((r, ri) => ri === i ? { ...r, insurance_number: e.target.value } : r))}
                        className="w-full bg-paper rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-ring mt-1 text-sm"
                        placeholder="الرقم التأميني"
                      />
                    )}
                  </td>
                  <td className="px-1 py-1">
                    <input
                      value={f.marital_status ?? ""}
                      onChange={(e) => setFamily((s) => s.map((r, ri) => ri === i ? { ...r, marital_status: e.target.value } : r))}
                      className="w-full bg-paper rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-ring"
                    />
                  </td>
                  <td className="px-1 py-1">
                    <input
                      value={f.confession_father ?? ""}
                      onChange={(e) => setFamily((s) => s.map((r, ri) => ri === i ? { ...r, confession_father: e.target.value } : r))}
                      className="w-full bg-paper rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-ring"
                    />
                  </td>
                  <td className="px-1 py-1">
                    <input
                      value={f.school_or_job ?? ""}
                      onChange={(e) => setFamily((s) => s.map((r, ri) => ri === i ? { ...r, school_or_job: e.target.value } : r))}
                      className="w-full bg-paper rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-ring"
                    />
                  </td>
                  <td className="px-1 py-1">
                    <input
                      type="number"
                      value={f.income ?? ""}
                      onChange={(e) => setFamily((s) => s.map((r, ri) => ri === i ? { ...r, income: e.target.value === "" ? undefined : Number(e.target.value) } : r))}
                      className="w-24 bg-paper rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-ring"
                    />
                  </td>
                  <td className="px-1 py-1">
                    <input
                      value={f.notes ?? ""}
                      onChange={(e) => setFamily((s) => s.map((r, ri) => ri === i ? { ...r, notes: e.target.value } : r))}
                      className="w-full bg-paper rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-ring"
                    />
                  </td>
                  <td className="px-1 py-1">
                    <button
                      type="button"
                      onClick={() => setFamily((s) => s.filter((_, ri) => ri !== i))}
                      className="text-destructive hover:bg-destructive/10 p-1 rounded"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="paper-card">
        <h2 className="display text-xl mb-4 text-ink">البيانات المالية</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          <div>
            <h3 className="display text-sm text-success mb-2">الإيرادات</h3>
            <div className="space-y-2">
              <NumRow label="شهريات كنايس" k="church_monthly" fin={fin} setFin={setFin} />
              <NumRow label="مرتب أساسي" k="basic_salary" fin={fin} setFin={setFin} />
              <NumRow label="مصدر إضافي للدخل" k="extra_income" fin={fin} setFin={setFin} />
              <NumRow label="مساعدات علاجية" k="therapeutic_aid" fin={fin} setFin={setFin} />
              <NumRow label="مساعدات خلال دراسة" k="study_aid" fin={fin} setFin={setFin} />
            </div>
          </div>
          <div>
            <h3 className="display text-sm text-destructive mb-2">المصروفات</h3>
            <div className="space-y-2">
              <NumRow label="كهرباء – غاز – مياه" k="electricity_gas_water" fin={fin} setFin={setFin} />
              <NumRow label="تليفون" k="phone_bill" fin={fin} setFin={setFin} />
              <NumRow label="إيجار" k="rent" fin={fin} setFin={setFin} />
              <NumRow label="علاج" k="treatment_cost" fin={fin} setFin={setFin} />
              <NumRow label="دراسة" k="education_cost" fin={fin} setFin={setFin} />
            </div>
          </div>
        </div>
      </section>

      <section className="paper-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="display text-xl text-ink">شهريات كنائس أخرى</h2>
          <button
            type="button"
            onClick={() => setChurchSupport((s) => [...s, { church_name: "", amount: 0 }])}
            className="chip-green px-4 py-2 text-sm"
          >
            <Plus size={14} className="inline-block ms-1" /> إضافة كنيسة
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-muted-foreground">
                {["م","اسم الكنيسة","المبلغ",""].map((h) => (
                  <th key={h} className="px-2 py-2 text-start font-semibold border-b border-border">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {churchSupport.map((cs, i) => (
                <tr key={i} className="border-b border-border/60">
                  <td className="px-2 py-1 text-muted-foreground">{i + 1}</td>
                  <td className="px-1 py-1">
                    <input
                      value={cs.church_name ?? ""}
                      onChange={(e) => setChurchSupport((s) => s.map((r, ri) => ri === i ? { ...r, church_name: e.target.value } : r))}
                      className="w-full bg-paper rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-ring"
                      placeholder="اسم الكنيسة"
                    />
                  </td>
                  <td className="px-1 py-1">
                    <input
                      type="number"
                      value={cs.amount ?? ""}
                      onChange={(e) => setChurchSupport((s) => s.map((r, ri) => ri === i ? { ...r, amount: e.target.value === "" ? 0 : Number(e.target.value) } : r))}
                      className="w-32 bg-paper rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-ring"
                      placeholder="0"
                    />
                  </td>
                  <td className="px-1 py-1">
                    <button
                      type="button"
                      onClick={() => setChurchSupport((s) => s.filter((_, ri) => ri !== i))}
                      className="text-destructive hover:bg-destructive/10 p-1 rounded"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {churchSupport.length === 0 && (
            <div className="text-center py-4 text-muted-foreground text-sm">
              لا توجد شهريات من كنائس أخرى
            </div>
          )}
        </div>
      </section>

      <div className="flex justify-end gap-3">
        {onCancel && (
          <button type="button" onClick={onCancel} className="px-6 py-3 rounded-full bg-muted">
            إلغاء
          </button>
        )}
        <button type="submit" disabled={busy} className="chip-green px-8 py-3 disabled:opacity-60">
          {busy ? "جارٍ الحفظ..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

function TInput({
  label, type = "text", required, className = "", value, onChange, readOnly = false, pattern, errorMsg = "", maxLength, placeholder,
}: { label: string; type?: string; required?: boolean; className?: string; value: string; onChange?: (v: string) => void; readOnly?: boolean; pattern?: string; errorMsg?: string; maxLength?: number; placeholder?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-sm font-semibold text-muted-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </span>
      <input
        type={type}
        required={required}
        readOnly={readOnly}
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(e) => onChange?.(e.target.value)}
        pattern={pattern}
        className={cn(
          "mt-1 w-full rounded-xl bg-paper border border-border px-3 py-2 outline-none focus:ring-2 focus:ring-ring",
          readOnly && "bg-muted cursor-not-allowed opacity-70",
          errorMsg && "border-destructive focus:ring-destructive"
        )}
      />
      {errorMsg && <p className="text-xs text-destructive mt-1">{errorMsg}</p>}
    </label>
  );
}

function TSelect({
  label, value, onChange, options, placeholder, className = "", required = false, errorMsg = "", disabled = false,
}: {
  label: string;
  value?: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  className?: string;
  required?: boolean;
  errorMsg?: string;
  disabled?: boolean;
}) {
  const Select = SelectPrimitive.Root;
  const SelectTrigger = React.forwardRef<
    React.ElementRef<typeof SelectPrimitive.Trigger>,
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
  >(({ className, children, ...props }, ref) => (
    <SelectPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-xl bg-paper border border-border px-3 py-2 text-sm text-muted-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring",
        errorMsg && "border-destructive focus:ring-destructive",
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  ));
  SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

  const SelectContent = React.forwardRef<
    React.ElementRef<typeof SelectPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
  >(({ className, children, position = "popper", ...props }, ref) => (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref}
        className={cn(
          "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border border-border bg-paper shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
          className,
        )}
        position={position}
        {...props}
      >
        <SelectPrimitive.Viewport
          className={cn(
            "p-1",
            position === "popper" &&
              "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]",
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  ));
  SelectContent.displayName = SelectPrimitive.Content.displayName;

  const SelectItem = React.forwardRef<
    React.ElementRef<typeof SelectPrimitive.Item>,
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
  >(({ className, children, ...props }, ref) => (
    <SelectPrimitive.Item
      ref={ref}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 ps-2 pe-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className,
      )}
      {...props}
    >
      <span className="absolute end-2 flex h-3.5 w-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check className="h-4 w-4" />
        </SelectPrimitive.ItemIndicator>
      </span>

      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  ));
  SelectItem.displayName = SelectPrimitive.Item.displayName;

  return (
    <label className={`block ${className}`}>
      <span className="text-sm font-semibold text-muted-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </span>
      <div className="mt-1">
        <Select value={value || undefined} onValueChange={onChange} disabled={disabled}>
          <SelectTrigger className={disabled ? "bg-muted cursor-not-allowed opacity-70" : ""}>
            <SelectPrimitive.Value placeholder={placeholder || "اختر..."} />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {errorMsg && <p className="text-xs text-destructive mt-1">{errorMsg}</p>}
    </label>
  );
}

function NumRow({
  label, k, fin, setFin,
}: { label: string; k: string; fin: Record<string, number>; setFin: (f: any) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 bg-paper border border-border rounded-xl px-3 py-2">
      <span className="text-sm font-semibold">{label}</span>
      <input
        type="number"
        value={fin[k] ?? ""}
        onChange={(e) =>
          setFin((s: any) => ({ ...s, [k]: e.target.value === "" ? 0 : Number(e.target.value) }))
        }
        className="w-32 bg-transparent text-end outline-none tabular-nums"
        placeholder="0"
      />
    </label>
  );
}

export function buildIndividualPayload({ ind, family, fin, churchSupport }: IndividualFormData) {
  const cleanFamily = family.filter((f) => f.full_name.trim().length);
  const cleanChurchSupport = churchSupport.filter((cs) => cs.church_name.trim().length);
  const gender = normalizeGender(ind.gender);
  if (!gender) {
    throw new Error("برجاء اختيار النوع");
  }
  
  // If housing type is "أخرى", use the custom input value
  const finalHousingType = ind.housing_type === "أخرى" ? ind.housing_type_other : ind.housing_type;

  return {
    full_name: ind.full_name,
    nickname: ind.nickname ?? null,
    mother_name: ind.mother_name ?? null,
    gender,
    national_id: ind.national_id ?? null,
    birth_date: ind.birth_date || null,
    birth_governorate: ind.birth_governorate ?? null,
    job: ind.job ?? null,
    salary: ind.salary ? Number(ind.salary) : null,
    phone: ind.phone ?? null,
    mobile: ind.mobile ?? null,
    landline: ind.landline ?? null,
    confession_father: ind.confession_father ?? null,
    saint_family: ind.saint_family ?? null,
    address: ind.address ?? null,
    household_count: ind.household_count ? Number(ind.household_count) : null,
    housing_type: finalHousingType ?? null,
    rooms: ind.rooms ? Number(ind.rooms) : null,
    has_washing_machine: !!ind.has_washing_machine,
    has_fridge: !!ind.has_fridge,
    has_stove: !!ind.has_stove,
    has_mattress: !!ind.has_mattress,
    has_computer: !!ind.has_computer,
    has_sofa: !!ind.has_sofa,
    has_dining: !!ind.has_dining,
    has_tv: !!ind.has_tv,
    has_wardrobe: !!ind.has_wardrobe,
    has_alt_address: !!ind.has_alt_address,
    alt_address: ind.alt_address ?? null,
    alt_governorate: ind.alt_governorate ?? null,
    family: cleanFamily.map((f) => ({
      full_name: f.full_name,
      national_id: f.national_id ?? null,
      relation: f.relation === "آخر" ? (f.relation_custom ?? null) : (f.relation ?? null),
      insurance_number: f.insurance_number ?? null,
      marital_status: f.marital_status ?? null,
      confession_father: f.confession_father ?? null,
      school_or_job: f.school_or_job ?? null,
      income: f.income ? Number(f.income) : null,
      notes: f.notes ?? null,
    })),
    financials: {
      church_monthly: Number(fin.church_monthly || 0),
      therapeutic_aid: Number(fin.therapeutic_aid || 0),
      study_aid: Number(fin.study_aid || 0),
      basic_salary: Number(fin.basic_salary || 0),
      extra_income: Number(fin.extra_income || 0),
      electricity_gas_water: Number(fin.electricity_gas_water || 0),
      phone_bill: Number(fin.phone_bill || 0),
      rent: Number(fin.rent || 0),
      treatment_cost: Number(fin.treatment_cost || 0),
      education_cost: Number(fin.education_cost || 0),
    },
    churchSupport: cleanChurchSupport.map((cs) => ({
      church_name: cs.church_name,
      amount: Number(cs.amount || 0),
    })),
  };
}
