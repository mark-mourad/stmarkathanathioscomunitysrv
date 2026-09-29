import { i as __toESM } from "../_runtime.mjs";
import { _ as useRouter, h as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { F as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { T as getExportData, U as searchIndividuals, et as useServerFn, v as getAllGuests } from "./church.functions-CojeWWgP.mjs";
import { i as getVisibleSaintFamilyValues } from "./permissions-BPF-3_4x.mjs";
import { t as useAuth } from "./use-auth-DmMFHth-.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { T as Download, d as Search, r as Users } from "../_libs/lucide-react.mjs";
import { t as Route } from "./search-CJPB1n1Y.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/search-CorMoa2f.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var FAMILY_BUTTONS = [
	{
		family: "متى",
		label: "أسرة القديس متى"
	},
	{
		family: "مرقس",
		label: "أسرة القديس مرقس"
	},
	{
		family: "يوحنا",
		label: "أسرة القديس يوحنا"
	},
	{
		family: "لوقا",
		label: "أسرة القديس لوقا"
	},
	{
		family: "أسر مستترة",
		label: "الأسر المستترة",
		rowSpan: 2
	}
];
function SearchPage() {
	const { mode: initialMode } = Route.useSearch();
	const { role, isFamilyServant, assignedFamily, isAdmin } = useAuth();
	const router = useRouter();
	const [mode, setMode] = (0, import_react.useState)(initialMode);
	const [q, setQ] = (0, import_react.useState)("");
	const [results, setResults] = (0, import_react.useState)([]);
	const [loading, setLoading] = (0, import_react.useState)(false);
	const [touched, setTouched] = (0, import_react.useState)(false);
	const [familyFilter, setFamilyFilter] = (0, import_react.useState)("");
	const run = useServerFn(searchIndividuals);
	const loadGuests = useServerFn(getAllGuests);
	const fetchExportData = useServerFn(getExportData);
	async function onSubmit(e) {
		e.preventDefault();
		if (!q.trim()) return;
		setLoading(true);
		try {
			setResults(await run({ data: {
				mode,
				q: q.trim()
			} }));
		} finally {
			setLoading(false);
		}
	}
	function handleFamilyClick(family) {
		if (family === "أسر مستترة" && ![
			"SUPER_ADMIN",
			"ADMIN",
			"ST_HIDDEN_FAMILIES"
		].includes(role)) {
			toast.error("غير مصرح لك بهذا الحقل");
			return;
		}
		if (isFamilyServant && family !== assignedFamily) {
			toast.error("غير مصرح لك بهذا الحقل");
			return;
		}
		loadBeneficiaries(family);
	}
	async function loadBeneficiaries(saintFamily) {
		setLoading(true);
		try {
			setResults(await loadGuests({ data: saintFamily ? { saint_family: saintFamily } : {} }));
			setTouched(true);
			setQ("");
			setFamilyFilter(saintFamily ?? "");
		} catch (error) {
			console.error("Error loading beneficiaries:", error);
		} finally {
			setLoading(false);
		}
	}
	const visibleFamilies = getVisibleSaintFamilyValues(role);
	const familyButtons = FAMILY_BUTTONS.filter((f) => visibleFamilies.includes(f.family));
	const placeholder = mode === "name" ? "الاسم" : "الرقم القومي";
	const filteredResults = familyFilter ? results.filter((r) => r.saint_family === familyFilter && r.type === "individual") : results;
	const canExport = isAdmin || (isFamilyServant ? !familyFilter || familyFilter === assignedFamily : true);
	async function exportToCSV() {
		const data = await fetchExportData({ data: familyFilter ? { saint_family: familyFilter } : {} });
		const APPLIANCE_LABELS = {
			has_washing_machine: "غسالة",
			has_fridge: "ثلاجة",
			has_stove: "بوتاجاز",
			has_mattress: "مرتبة",
			has_computer: "كمبيوتر",
			has_sofa: "كنبة",
			has_dining: "سفرة",
			has_tv: "تلفزيون",
			has_wardrobe: "دولاب"
		};
		const APPLIANCE_KEYS = Object.keys(APPLIANCE_LABELS);
		const csvEscape = (val) => {
			if (val.includes(",") || val.includes("\"") || val.includes("\n")) return `"${val.replace(/"/g, "\"\"")}"`;
			return val;
		};
		const textCell = (val) => {
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
			"ملاحظات"
		];
		const genderLabel = (g) => {
			if (g === "male") return "ذكر";
			if (g === "female") return "أنثى";
			return "";
		};
		const rows = [];
		(data.individuals ?? []).forEach((ind) => {
			const fin = data.financialsMap?.[ind.id] ?? {};
			const cs = data.churchSupportMap?.[ind.id] ?? {
				total: 0,
				details: ""
			};
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
				""
			]);
			(data.familyByIndividual?.[ind.id] ?? []).forEach((fm) => {
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
					""
				]);
			});
		});
		const csvContent = "﻿" + [headers.map(csvEscape).join(","), ...rows.map((row) => row.map(csvEscape).join(","))].join("\n");
		const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = `beneficiaries_${familyFilter || "all"}_${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.csv`;
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
		"BLESSING_DISTRIBUTOR"
	];
	(0, import_react.useEffect)(() => {
		if (searchRestrictedRoles.includes(role)) {
			toast.error("غير مصرح لك بهذا الحقل");
			router.navigate({ to: "/" });
			return;
		}
		if (role === "ST_HIDDEN_FAMILIES") loadBeneficiaries("أسر مستترة");
		else if (role === "BRIDE_AND_MEDICAL_AIDS_MANAGER") loadBeneficiaries();
	}, [role]);
	if (searchRestrictedRoles.includes(role)) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "text-center py-8 text-muted-foreground",
		children: "جاري التوجيه..."
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "max-w-3xl mx-auto",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-3 justify-center mb-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => {
						setMode("name");
						setResults([]);
						setTouched(false);
					},
					className: `chip-dark px-6 ${mode === "name" ? "" : "opacity-60"}`,
					children: "البحث بالاسم"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => {
						setMode("national_id");
						setResults([]);
						setTouched(false);
					},
					className: `chip-dark px-6 ${mode === "national_id" ? "" : "opacity-60"}`,
					children: "البحث بالرقم القومي"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-6 mb-6",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid grid-cols-2 gap-3 max-w-sm mx-auto",
					children: familyButtons.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						disabled: loading,
						onClick: () => handleFamilyClick(f.family),
						className: `flex items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition-all duration-200 shadow-soft ${familyFilter === f.family ? "bg-primary text-primary-foreground border-primary shadow-pill" : "bg-paper-2 border-border text-muted-foreground hover:bg-primary/10 hover:text-foreground hover:border-primary/30"} ${f.rowSpan === 2 ? "col-span-2 justify-self-center" : ""}`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { size: 15 }), f.label]
					}, f.family))
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				onSubmit,
				className: "relative",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					value: touched ? q : "",
					onFocus: () => setTouched(true),
					onChange: (e) => {
						setTouched(true);
						setQ(e.target.value);
					},
					placeholder: touched ? "" : placeholder,
					className: "w-full rounded-full bg-paper-2 px-8 py-6 text-center display text-xl text-muted-foreground/70 focus:text-foreground shadow-soft outline-none focus:ring-2 focus:ring-ring",
					inputMode: mode === "national_id" ? "numeric" : "text"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "submit",
					className: "absolute top-1/2 -translate-y-1/2 left-3 rounded-full bg-primary text-primary-foreground p-3",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { size: 20 })
				})]
			}),
			results.length > 0 && canExport && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4 flex justify-center",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: exportToCSV,
					className: "chip-green px-4 py-2 text-sm flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { size: 14 }), " تصدير CSV"]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-8 space-y-3",
				children: [
					loading && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-center text-muted-foreground",
						children: "جارٍ البحث..."
					}),
					!loading && touched && results.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-center text-muted-foreground",
						children: "لا توجد نتائج"
					}),
					!loading && !touched && !q && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-center text-muted-foreground",
						children: "اختر أسرة أو ابدأ البحث..."
					}),
					filteredResults.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/individual/$id",
						params: { id: r.id },
						search: r.type === "family" ? { highlightFamilyId: r.highlightFamilyId } : void 0,
						className: `paper-card flex items-center justify-between hover:scale-[1.01] transition block ${r.type === "family" ? "border-l-4 border-primary/80 bg-primary/5" : ""}`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "display text-lg",
								children: [r.full_name, r.type === "family" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-sm text-muted-foreground ms-2",
									children: "(عن طريق فرد الأسرة)"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "text-sm text-muted-foreground",
								children: [
									r.job || "—",
									" · ",
									r.phone || "—"
								]
							}),
							r.type === "family" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "text-xs mt-1 rounded-full bg-primary/10 px-2 py-1 inline-flex items-center gap-1 text-primary",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: r.family_full_name }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "·" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: r.family_relation || "—" })
								]
							})
						] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-xs text-muted-foreground tabular-nums",
							dir: "ltr",
							children: r.national_id || "—"
						})]
					}, `${r.type}-${r.id}-${r.highlightFamilyId ?? ""}`))
				]
			})
		] })
	});
}
//#endregion
export { SearchPage as component };
