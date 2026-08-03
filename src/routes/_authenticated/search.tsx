import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getAllGuests, searchIndividuals, getExportData, type SaintFamily } from "@/lib/church.functions";
import { Search as SearchIcon, Download, Users } from "lucide-react";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { getVisibleSaintFamilyValues } from "@/lib/permissions";
import { toast } from "sonner";

const searchSchema = z.object({
  mode: z.enum(["name", "national_id"]).optional().default("name"),
});

export const Route = createFileRoute("/_authenticated/search")({
  head: () => ({ meta: [{ title: "البحث" }] }),
  validateSearch: (s) => searchSchema.parse(s),
  component: SearchPage,
});

const FAMILY_BUTTONS: Array<{ family: SaintFamily; label: string; rowSpan?: number }> = [
  { family: "متى", label: "أسرة القديس متى" },
  { family: "مرقس", label: "أسرة القديس مرقس" },
  { family: "يوحنا", label: "أسرة القديس يوحنا" },
  { family: "لوقا", label: "أسرة القديس لوقا" },
  { family: "أسر مستترة", label: "الأسر المستترة", rowSpan: 2 },
];

function SearchPage() {
  const { mode: initialMode } = Route.useSearch();
  const { role, isFamilyServant, assignedFamily, isAdmin } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"name" | "national_id">(initialMode);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState(false);
  const [familyFilter, setFamilyFilter] = useState("");
  const run = useServerFn(searchIndividuals);
  const loadGuests = useServerFn(getAllGuests);
  const fetchExportData = useServerFn(getExportData);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setLoading(true);
    try {
      const r = await run({ data: { mode, q: q.trim() } });
      setResults(r);
    } finally {
      setLoading(false);
    }
  }

  function handleFamilyClick(family: SaintFamily) {
    // 1. Hidden Families check
    if (family === "أسر مستترة" && !["SUPER_ADMIN", "ADMIN", "ST_HIDDEN_FAMILIES"].includes(role as any)) {
      toast.error("غير مصرح لك بهذا الحقل");
      return;
    }

    // 2. ST_* scope enforcement: block if clicking outside assigned family
    if (isFamilyServant && family !== assignedFamily) {
      toast.error("غير مصرح لك بهذا الحقل");
      return;
    }
    loadBeneficiaries(family);
  }

  async function loadBeneficiaries(saintFamily?: SaintFamily) {
    setLoading(true);
    try {
      const r = await loadGuests({ data: saintFamily ? { saint_family: saintFamily } : {} });
      setResults(r);
      setTouched(true);
      setQ("");
      setFamilyFilter(saintFamily ?? "");
    } catch (error) {
      console.error("Error loading beneficiaries:", error);
    } finally {
      setLoading(false);
    }
  }

  // Privacy: never surface the hidden-family option to roles that may not see it
  const visibleFamilies = getVisibleSaintFamilyValues(role);
  const familyButtons = FAMILY_BUTTONS.filter((f) => visibleFamilies.includes(f.family));

  const placeholder = mode === "name" ? "الاسم" : "الرقم القومي";

  // Family filter: show only primary beneficiaries when a specific family is selected
  const filteredResults = familyFilter 
    ? results.filter((r) => r.saint_family === familyFilter && r.type === "individual")
    : results;

  // Export: admins always; family servants only when filter matches their family or is unset; others preserved
  const canExport = isAdmin || (isFamilyServant ? (!familyFilter || familyFilter === assignedFamily) : true);

  async function exportToCSV() {
    const data = await fetchExportData({ data: familyFilter ? { saint_family: familyFilter as SaintFamily } : {} });

    const APPLIANCE_LABELS: Record<string, string> = {
      has_washing_machine: "غسالة",
      has_fridge: "ثلاجة",
      has_stove: "بوتاجاز",
      has_mattress: "مرتبة",
      has_computer: "كمبيوتر",
      has_sofa: "كنبة",
      has_dining: "سفرة",
      has_tv: "تلفزيون",
      has_wardrobe: "دولاب",
    };
    const APPLIANCE_KEYS = Object.keys(APPLIANCE_LABELS) as (keyof typeof APPLIANCE_LABELS)[];

    const csvEscape = (val: string) => {
      if (val.includes(",") || val.includes('"') || val.includes("\n")) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    };

    const textCell = (val: string | null | undefined) => {
      const v = val ?? "";
      if (!v) return "";
      return `="${v}"`;
    };

    const headers = [
      "الاسم الكامل",
      "اسم الشهرة",
      "النوع",
      "صفة المخدوم",
      "اسم رب الأسرة",
      "اسم الأم",
      "الرقم القومي",
      "تاريخ الميلاد",
      "الوظيفة / المهنة",
      "رقم التليفون",
      "رقم موبايل آخر",
      "تلفون أرضي",
      "أب الاعتراف",
      "أسرة القديس",
      "العنوان الحالي",
      "سكن آخر",
      "تفاصيل سكن آخر",
      "المرفقات",
      "عدد أفراد الأسرة",
      "إجمالي الإيرادات",
      "إجمالي المصروفات",
      "شهريات الكنائس",
      "ملاحظات",
    ];

    const genderLabel = (g: string | null) => {
      if (g === "male") return "ذكر";
      if (g === "female") return "أنثى";
      return "";
    };

    const rows: string[][] = [];

    (data.individuals ?? []).forEach((ind: any) => {
      const fin = data.financialsMap?.[ind.id] ?? {};
      const cs = data.churchSupportMap?.[ind.id] ?? { total: 0, details: "" };
      const totalIncome = Number(fin.basic_salary || 0) + Number(fin.extra_income || 0) + Number(fin.church_monthly || 0) + Number(fin.therapeutic_aid || 0) + Number(fin.study_aid || 0);
      const totalExpenses = Number(fin.electricity_gas_water || 0) + Number(fin.phone_bill || 0) + Number(fin.rent || 0) + Number(fin.treatment_cost || 0) + Number(fin.education_cost || 0);
      const appliances = APPLIANCE_KEYS.filter((k) => ind[k]).map((k) => APPLIANCE_LABELS[k]).join("، ");
      const altAddress = ind.has_alt_address ? [ind.alt_address, ind.alt_governorate].filter(Boolean).join(" - ") : "";

      rows.push([
        ind.full_name || "",
        ind.nickname || "",
        genderLabel(ind.gender),
        "مخدوم أساسي",
        ind.full_name || "",
        ind.mother_name || "",
        textCell(ind.national_id),
        ind.birth_date || "",
        ind.job || "",
        textCell(ind.phone),
        textCell(ind.mobile),
        textCell(ind.landline),
        ind.confession_father || "",
        ind.saint_family || "",
        ind.address || "",
        ind.has_alt_address ? "نعم" : "لا",
        altAddress,
        appliances,
        String(ind.household_count || ""),
        String(totalIncome || ""),
        String(totalExpenses || ""),
        cs.details || cs.total ? `${cs.details}${cs.details && cs.total ? " (الإجمالي: " + cs.total + ")" : cs.total ? "الإجمالي: " + cs.total : ""}` : "",
        "",
      ]);

      const familyMembers = data.familyByIndividual?.[ind.id] ?? [];
      familyMembers.forEach((fm) => {
        rows.push([
          fm.full_name || "",
          "",
          "",
          "فرد من الأسرة",
          ind.full_name || "",
          "",
          textCell(null),
          "",
          "",
          "",
          "",
          "",
          "",
          ind.saint_family || "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
        ]);
      });
    });

    const BOM = "\uFEFF";
    const csvContent = BOM + [
      headers.map(csvEscape).join(","),
      ...rows.map((row) => row.map(csvEscape).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `beneficiaries_${familyFilter || "all"}_${new Date().toISOString().split("T")[0]}.csv`;
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  const searchRestrictedRoles = [
    "SUPPLY_WAREHOUSE_MANAGER",
    "FURNITURE_WAREHOUSE_MANAGER",
    "PHARMACY_WAREHOUSE_MANAGER",
    "BLESSING_DISTRIBUTOR",
  ];

  useEffect(() => {
    if (searchRestrictedRoles.includes(role as any)) {
      toast.error("غير مصرح لك بهذا الحقل");
      router.navigate({ to: "/" });
      return;
    }
    if (role === "ST_HIDDEN_FAMILIES") {
      loadBeneficiaries("أسر مستترة");
    } else if (role === "BRIDE_AND_MEDICAL_AIDS_MANAGER") {
      loadBeneficiaries();
    }
  }, [role]);

  if (searchRestrictedRoles.includes(role as any)) {
    return <div className="text-center py-8 text-muted-foreground">جاري التوجيه...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <>
        <div className="flex gap-3 justify-center mb-6">
          <button
            onClick={() => { setMode("name"); setResults([]); setTouched(false); }}
            className={`chip-dark px-6 ${mode === "name" ? "" : "opacity-60"}`}
          >
            البحث بالاسم
          </button>
          <button
            onClick={() => { setMode("national_id"); setResults([]); setTouched(false); }}
            className={`chip-dark px-6 ${mode === "national_id" ? "" : "opacity-60"}`}
          >
            البحث بالرقم القومي
          </button>
        </div>
        
        {/* Family Buttons — primary filter (hidden families hidden from unauthorized roles) */}
        <div className="mt-6 mb-6">
          <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
            {familyButtons.map((f) => (
              <button
                key={f.family}
                type="button"
                disabled={loading}
                onClick={() => handleFamilyClick(f.family)}
                className={`flex items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition-all duration-200 shadow-soft ${
                  familyFilter === f.family
                    ? "bg-primary text-primary-foreground border-primary shadow-pill"
                    : "bg-paper-2 border-border text-muted-foreground hover:bg-primary/10 hover:text-foreground hover:border-primary/30"
                } ${f.rowSpan === 2 ? "col-span-2 justify-self-center" : ""}`}
              >
                <Users size={15} />
                {f.label}
              </button>
            ))}
          </div>
        </div>
        
        <form onSubmit={onSubmit} className="relative">
          <input
            value={touched ? q : ""}
            onFocus={() => setTouched(true)}
            onChange={(e) => { setTouched(true); setQ(e.target.value); }}
            placeholder={touched ? "" : placeholder}
            className="w-full rounded-full bg-paper-2 px-8 py-6 text-center display text-xl text-muted-foreground/70 focus:text-foreground shadow-soft outline-none focus:ring-2 focus:ring-ring"
            inputMode={mode === "national_id" ? "numeric" : "text"}
          />
          <button
            type="submit"
            className="absolute top-1/2 -translate-y-1/2 left-3 rounded-full bg-primary text-primary-foreground p-3"
          >
            <SearchIcon size={20} />
          </button>
        </form>
        
        {/* Export button — visible when there are results and user is authorized */}
        {results.length > 0 && canExport && (
          <div className="mt-4 flex justify-center">
            <button
              onClick={exportToCSV}
              className="chip-green px-4 py-2 text-sm flex items-center gap-2"
            >
              <Download size={14} /> تصدير CSV
            </button>
          </div>
        )}
        
        <div className="mt-8 space-y-3">
          {loading && <p className="text-center text-muted-foreground">جارٍ البحث...</p>}
          {!loading && touched && results.length === 0 && (
            <p className="text-center text-muted-foreground">لا توجد نتائج</p>
          )}
          {!loading && !touched && !q && (
            <p className="text-center text-muted-foreground">اختر أسرة أو ابدأ البحث...</p>
          )}
          {filteredResults.map((r) => (
            <Link
              key={`${r.type}-${r.id}-${r.highlightFamilyId ?? ""}`}
              to="/individual/$id"
              params={{ id: r.id }}
              search={r.type === "family" ? { highlightFamilyId: r.highlightFamilyId } : undefined}
              className={`paper-card flex items-center justify-between hover:scale-[1.01] transition block ${r.type === "family" ? "border-l-4 border-primary/80 bg-primary/5" : ""}`}
            >
              <div>
                <div className="display text-lg">
                  {r.full_name}
                  {r.type === "family" && (
                    <span className="text-sm text-muted-foreground ms-2">(عن طريق فرد الأسرة)</span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {r.job || "—"} · {r.phone || "—"}
                </div>
                {r.type === "family" && (
                  <div className="text-xs mt-1 rounded-full bg-primary/10 px-2 py-1 inline-flex items-center gap-1 text-primary">
                    <span>{r.family_full_name}</span>
                    <span>·</span>
                    <span>{r.family_relation || "—"}</span>
                  </div>
                )}
              </div>
              <div className="text-xs text-muted-foreground tabular-nums" dir="ltr">
                {r.national_id || "—"}
              </div>
            </Link>
          ))}
        </div>
      </>
    </div>
  );
}

