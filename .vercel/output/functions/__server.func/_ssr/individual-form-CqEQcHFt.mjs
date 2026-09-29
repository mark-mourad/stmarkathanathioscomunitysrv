import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { F as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { B as normalizeGender, R as getSaintFamilies, et as useServerFn } from "./church.functions-CojeWWgP.mjs";
import { i as getVisibleSaintFamilyValues } from "./permissions-BPF-3_4x.mjs";
import { M as Check, h as Plus, j as ChevronDown, s as Trash2 } from "../_libs/lucide-react.mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
import { a as SelectItemIndicator, c as SelectTrigger, i as SelectItem, l as SelectValue, n as SelectContent, o as SelectItemText, r as SelectIcon, s as SelectPortal, t as Select, u as SelectViewport } from "../_libs/@radix-ui/react-select+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/individual-form-CqEQcHFt.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var GOVERNORATE_CODES = {
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
	"88": "خارج الجمهورية"
};
var SAINT_FAMILIES = [
	{
		value: "متى",
		label: "متى"
	},
	{
		value: "مرقس",
		label: "مرقس"
	},
	{
		value: "لوقا",
		label: "لوقا"
	},
	{
		value: "يوحنا",
		label: "يوحنا"
	},
	{
		value: "أسر مستترة",
		label: "أسر مستترة"
	}
];
var HOUSING_TYPES = [
	{
		value: "تمليك",
		label: "تمليك"
	},
	{
		value: "ايجار قديم",
		label: "ايجار قديم"
	},
	{
		value: "ايجار جديد",
		label: "ايجار جديد"
	},
	{
		value: "أخرى",
		label: "أخرى"
	}
];
var GENDER_TYPES = [{
	value: "male",
	label: "ذكر"
}, {
	value: "female",
	label: "أنثى"
}];
var RELATION_OPTIONS = [
	{
		value: "زوج",
		label: "زوج"
	},
	{
		value: "ابن",
		label: "ابن"
	},
	{
		value: "ابنة",
		label: "ابنة"
	},
	{
		value: "آخر",
		label: "آخر"
	}
];
function parseEgyptianNationalId(id) {
	if (!id || id.length !== 14 || !/^\d{14}$/.test(id)) return {
		birthDate: null,
		governorate: null,
		age: null
	};
	const centuryDigit = id.charAt(0);
	let century = "";
	if (centuryDigit === "2") century = "19";
	else if (centuryDigit === "3") century = "20";
	else return {
		birthDate: null,
		governorate: null,
		age: null
	};
	const yearYY = id.substring(1, 3);
	const year = century + yearYY;
	const month = id.substring(3, 5);
	const day = id.substring(5, 7);
	const monthNum = parseInt(month, 10);
	const dayNum = parseInt(day, 10);
	if (monthNum < 1 || monthNum > 12 || dayNum < 1 || dayNum > 31) return {
		birthDate: null,
		governorate: null,
		age: null
	};
	if (dayNum > [
		31,
		29,
		31,
		30,
		31,
		30,
		31,
		31,
		30,
		31,
		30,
		31
	][monthNum - 1]) return {
		birthDate: null,
		governorate: null,
		age: null
	};
	const birthDate = `${year}-${month}-${day}`;
	const birthDateObj = new Date(parseInt(year), monthNum - 1, dayNum);
	const today = /* @__PURE__ */ new Date();
	let age = today.getFullYear() - birthDateObj.getFullYear();
	const monthDiff = today.getMonth() - birthDateObj.getMonth();
	if (monthDiff < 0 || monthDiff === 0 && today.getDate() < birthDateObj.getDate()) age--;
	return {
		birthDate,
		governorate: GOVERNORATE_CODES[id.substring(7, 9)] || null,
		age
	};
}
function calculateAgeFromBirthDate(birthDate) {
	if (!birthDate) return null;
	const parts = birthDate.split("-");
	if (parts.length !== 3) return null;
	const year = parseInt(parts[0], 10);
	const month = parseInt(parts[1], 10);
	const day = parseInt(parts[2], 10);
	const birth = new Date(year, month - 1, day);
	const today = /* @__PURE__ */ new Date();
	let age = today.getFullYear() - birth.getFullYear();
	const monthDiff = today.getMonth() - birth.getMonth();
	if (monthDiff < 0 || monthDiff === 0 && today.getDate() < birth.getDate()) age--;
	return age;
}
var APPLIANCES = [
	{
		k: "has_washing_machine",
		l: "غسالة"
	},
	{
		k: "has_fridge",
		l: "ثلاجة"
	},
	{
		k: "has_stove",
		l: "بوتاجاز"
	},
	{
		k: "has_mattress",
		l: "مرتبة"
	},
	{
		k: "has_computer",
		l: "كمبيوتر"
	},
	{
		k: "has_sofa",
		l: "كنبة"
	},
	{
		k: "has_dining",
		l: "سفرة"
	},
	{
		k: "has_tv",
		l: "تلفزيون"
	},
	{
		k: "has_wardrobe",
		l: "دولاب"
	}
];
function IndividualForm({ initialInd = {}, initialFamily = [{ full_name: "" }], initialFin = {}, initialChurchSupport = [], submitLabel, busy = false, onSubmit, onCancel, lockFamily = false, role = null }) {
	const [ind, setInd] = (0, import_react.useState)(initialInd);
	const [family, setFamily] = (0, import_react.useState)(initialFamily);
	const [fin, setFin] = (0, import_react.useState)(initialFin);
	const [churchSupport, setChurchSupport] = (0, import_react.useState)(initialChurchSupport);
	const [fieldErrors, setFieldErrors] = (0, import_react.useState)({});
	const visibleFamilyValues = (0, import_react.useMemo)(() => role ? getVisibleSaintFamilyValues(role) : SAINT_FAMILIES.map((f) => f.value), [role]);
	const [saintFamilies, setSaintFamilies] = (0, import_react.useState)(SAINT_FAMILIES.filter((f) => visibleFamilyValues.includes(f.value)));
	const fetchSaintFamilies = useServerFn(getSaintFamilies);
	(0, import_react.useEffect)(() => {
		fetchSaintFamilies().then((families) => {
			if (families && families.length > 0) setSaintFamilies(families.filter((f) => visibleFamilyValues.includes(f.value)));
		}).catch(() => {
			setSaintFamilies(SAINT_FAMILIES.filter((f) => visibleFamilyValues.includes(f.value)));
		});
	}, [fetchSaintFamilies, visibleFamilyValues]);
	function set(key, v) {
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
			const updated = {
				...s,
				[key]: nextValue
			};
			if (key === "national_id" && v.length === 14) {
				const { birthDate, governorate, age } = parseEgyptianNationalId(v);
				if (birthDate) updated.birth_date = birthDate;
				if (governorate) updated.birth_governorate = governorate;
				updated.calculated_age = age;
			}
			return updated;
		});
	}
	async function handleSubmit(e) {
		e.preventDefault();
		const errors = {};
		const gender = normalizeGender(ind.gender);
		if (!gender) errors.gender = "يرجى اختيار النوع (ذكر/أنثى)";
		if (!ind.saint_family) errors.saint_family = "يرجى اختيار أسرة القديس";
		if (Object.keys(errors).length > 0) {
			setFieldErrors(errors);
			return;
		}
		await onSubmit({
			ind: {
				...ind,
				gender
			},
			family,
			fin,
			churchSupport
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
		onSubmit: handleSubmit,
		className: "space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "paper-card",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "display text-xl mb-4 text-ink",
						children: "بيانات المخدوم"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-1 md:grid-cols-3 gap-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TInput, {
								label: "الاسم",
								required: true,
								value: ind.full_name ?? "",
								onChange: (v) => set("full_name", v)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TInput, {
								label: "اسم الشهرة",
								value: ind.nickname ?? "",
								onChange: (v) => set("nickname", v)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TSelect, {
								label: "النوع",
								value: normalizeGender(ind.gender),
								onChange: (v) => set("gender", v),
								options: GENDER_TYPES,
								placeholder: "اختر النوع",
								required: true,
								errorMsg: fieldErrors.gender
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TInput, {
								label: "اسم الأم",
								value: ind.mother_name ?? "",
								onChange: (v) => set("mother_name", v)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TInput, {
								label: "الرقم القومي",
								required: true,
								maxLength: 14,
								value: ind.national_id ?? "",
								onChange: (v) => set("national_id", v),
								pattern: "\\d{14}",
								errorMsg: ind.national_id && !/^\d{14}$/.test(ind.national_id) ? "يجب أن يكون الرقم القومي 14 رقم بالضبط" : ""
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TInput, {
								label: "تاريخ الميلاد",
								value: ind.birth_date ?? "",
								readOnly: true
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TInput, {
								label: "محافظة الميلاد",
								value: ind.birth_governorate ?? "",
								readOnly: true
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TInput, {
								label: "العمر / السن",
								value: ind.calculated_age != null ? String(ind.calculated_age) : ind.birth_date ? String(calculateAgeFromBirthDate(ind.birth_date) ?? "") : "",
								readOnly: true
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TInput, {
								label: "الوظيفة",
								value: ind.job ?? "",
								onChange: (v) => set("job", v)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TInput, {
								label: "الراتب",
								type: "number",
								value: ind.salary ?? "",
								onChange: (v) => set("salary", v)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TInput, {
								label: "رقم الموبايل",
								value: ind.phone ?? "",
								onChange: (v) => set("phone", v)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TInput, {
								label: "رقم موبايل آخر",
								value: ind.mobile ?? "",
								onChange: (v) => set("mobile", v)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TInput, {
								label: "تلفون أرضي",
								value: ind.landline ?? "",
								onChange: (v) => set("landline", v)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TInput, {
								label: "أب الاعتراف",
								value: ind.confession_father ?? "",
								onChange: (v) => set("confession_father", v)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TSelect, {
								label: "أسرة القديس",
								value: ind.saint_family ?? "",
								onChange: (v) => set("saint_family", v),
								options: saintFamilies,
								placeholder: "اختر أسرة القديس",
								required: true,
								errorMsg: fieldErrors.saint_family,
								disabled: lockFamily
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TSelect, {
								label: "نوع السكن",
								value: ind.housing_type ?? "",
								onChange: (v) => set("housing_type", v),
								options: HOUSING_TYPES,
								placeholder: "اختر نوع السكن"
							}), ind.housing_type === "أخرى" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-2",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TInput, {
									label: "نوع السكن (حسب التخصيص)",
									value: ind.housing_type_other ?? "",
									onChange: (v) => set("housing_type_other", v),
									placeholder: "أدخل نوع السكن"
								})
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TInput, {
								label: "عدد الأفراد",
								type: "number",
								value: ind.household_count ?? "",
								onChange: (v) => set("household_count", v)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TInput, {
								label: "عدد الغرف",
								type: "number",
								value: ind.rooms ?? "",
								onChange: (v) => set("rooms", v)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TInput, {
								label: "العنوان بالتفصيل",
								value: ind.address ?? "",
								onChange: (v) => set("address", v),
								className: "md:col-span-3"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 pt-4 border-t border-border",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "flex items-center gap-2 mb-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "checkbox",
								checked: !!ind.has_alt_address,
								onChange: (e) => set("has_alt_address", e.target.checked),
								className: "accent-[color:var(--color-primary)]"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-sm font-semibold text-muted-foreground",
								children: "سكن آخر"
							})]
						}), ind.has_alt_address && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-1 md:grid-cols-2 gap-4 mt-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TInput, {
								label: "عنوان السكن الآخر",
								value: ind.alt_address ?? "",
								onChange: (v) => set("alt_address", v),
								className: "md:col-span-2"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TSelect, {
								label: "محافظة السكن الآخر",
								value: ind.alt_governorate ?? "",
								onChange: (v) => set("alt_governorate", v),
								options: Object.entries(GOVERNORATE_CODES).map(([code, name]) => ({
									value: name,
									label: name
								})),
								placeholder: "اختر المحافظة"
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "display text-sm mt-6 mb-2 text-muted-foreground",
						children: "المنقولات المنزلية"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid grid-cols-3 md:grid-cols-5 gap-2",
						children: APPLIANCES.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "flex items-center gap-2 px-3 py-2 rounded-xl bg-paper border border-border cursor-pointer hover:bg-primary/5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "checkbox",
								checked: !!ind[a.k],
								onChange: (e) => set(a.k, e.target.checked),
								className: "accent-[color:var(--color-primary)]"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-sm font-semibold",
								children: a.l
							})]
						}, a.k))
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "paper-card",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between mb-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "display text-xl text-ink",
						children: "أفراد الأسرة"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => setFamily((s) => [...s, { full_name: "" }]),
						className: "chip-green px-4 py-2 text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {
							size: 14,
							className: "inline-block ms-1"
						}), " إضافة فرد"]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "overflow-x-auto",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full text-sm border-collapse",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
							className: "text-muted-foreground",
							children: [
								"م",
								"الاسم",
								"الرقم القومي",
								"صلة القرابة",
								"الحالة الاجتماعية",
								"أب الاعتراف",
								"السنة الدراسية/الوظيفة",
								"الدخل",
								"ملاحظات",
								""
							].map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-2 py-2 text-start font-semibold border-b border-border",
								children: h
							}, h))
						}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: family.map((f, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "border-b border-border/60",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-2 py-1 text-muted-foreground",
									children: i + 1
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-1 py-1",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										value: f.full_name ?? "",
										onChange: (e) => setFamily((s) => s.map((r, ri) => ri === i ? {
											...r,
											full_name: e.target.value
										} : r)),
										className: "w-full bg-paper rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-ring"
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-1 py-1",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										value: f.national_id ?? "",
										onChange: (e) => setFamily((s) => s.map((r, ri) => ri === i ? {
											...r,
											national_id: e.target.value
										} : r)),
										className: "w-full bg-paper rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-ring"
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
									className: "px-1 py-1",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
											value: f.relation ?? "",
											onChange: (e) => setFamily((s) => s.map((r, ri) => ri === i ? {
												...r,
												relation: e.target.value,
												relation_custom: e.target.value !== "آخر" ? void 0 : r.relation_custom
											} : r)),
											className: "w-full bg-paper rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-ring text-sm",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "",
												children: "اختر..."
											}), RELATION_OPTIONS.map((opt) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: opt.value,
												children: opt.label
											}, opt.value))]
										}),
										f.relation === "آخر" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											value: f.relation_custom ?? "",
											onChange: (e) => setFamily((s) => s.map((r, ri) => ri === i ? {
												...r,
												relation_custom: e.target.value
											} : r)),
											className: "w-full bg-paper rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-ring mt-1 text-sm",
											placeholder: "حدد العلاقة"
										}),
										f.relation === "ابنة" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											value: f.insurance_number ?? "",
											onChange: (e) => setFamily((s) => s.map((r, ri) => ri === i ? {
												...r,
												insurance_number: e.target.value
											} : r)),
											className: "w-full bg-paper rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-ring mt-1 text-sm",
											placeholder: "الرقم التأميني"
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-1 py-1",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										value: f.marital_status ?? "",
										onChange: (e) => setFamily((s) => s.map((r, ri) => ri === i ? {
											...r,
											marital_status: e.target.value
										} : r)),
										className: "w-full bg-paper rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-ring"
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-1 py-1",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										value: f.confession_father ?? "",
										onChange: (e) => setFamily((s) => s.map((r, ri) => ri === i ? {
											...r,
											confession_father: e.target.value
										} : r)),
										className: "w-full bg-paper rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-ring"
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-1 py-1",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										value: f.school_or_job ?? "",
										onChange: (e) => setFamily((s) => s.map((r, ri) => ri === i ? {
											...r,
											school_or_job: e.target.value
										} : r)),
										className: "w-full bg-paper rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-ring"
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-1 py-1",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "number",
										value: f.income ?? "",
										onChange: (e) => setFamily((s) => s.map((r, ri) => ri === i ? {
											...r,
											income: e.target.value === "" ? void 0 : Number(e.target.value)
										} : r)),
										className: "w-24 bg-paper rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-ring"
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-1 py-1",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										value: f.notes ?? "",
										onChange: (e) => setFamily((s) => s.map((r, ri) => ri === i ? {
											...r,
											notes: e.target.value
										} : r)),
										className: "w-full bg-paper rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-ring"
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-1 py-1",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => setFamily((s) => s.filter((_, ri) => ri !== i)),
										className: "text-destructive hover:bg-destructive/10 p-1 rounded",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 14 })
									})
								})
							]
						}, i)) })]
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "paper-card",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "display text-xl mb-4 text-ink",
					children: "البيانات المالية"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "display text-sm text-success mb-2",
						children: "الإيرادات"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumRow, {
								label: "شهريات كنايس",
								k: "church_monthly",
								fin,
								setFin
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumRow, {
								label: "مرتب أساسي",
								k: "basic_salary",
								fin,
								setFin
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumRow, {
								label: "مصدر إضافي للدخل",
								k: "extra_income",
								fin,
								setFin
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumRow, {
								label: "مساعدات علاجية",
								k: "therapeutic_aid",
								fin,
								setFin
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumRow, {
								label: "مساعدات خلال دراسة",
								k: "study_aid",
								fin,
								setFin
							})
						]
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "display text-sm text-destructive mb-2",
						children: "المصروفات"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumRow, {
								label: "كهرباء – غاز – مياه",
								k: "electricity_gas_water",
								fin,
								setFin
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumRow, {
								label: "تليفون",
								k: "phone_bill",
								fin,
								setFin
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumRow, {
								label: "إيجار",
								k: "rent",
								fin,
								setFin
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumRow, {
								label: "علاج",
								k: "treatment_cost",
								fin,
								setFin
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumRow, {
								label: "دراسة",
								k: "education_cost",
								fin,
								setFin
							})
						]
					})] })]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "paper-card",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between mb-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "display text-xl text-ink",
						children: "شهريات كنائس أخرى"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => setChurchSupport((s) => [...s, {
							church_name: "",
							amount: 0
						}]),
						className: "chip-green px-4 py-2 text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {
							size: 14,
							className: "inline-block ms-1"
						}), " إضافة كنيسة"]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "overflow-x-auto",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full text-sm border-collapse",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
							className: "text-muted-foreground",
							children: [
								"م",
								"اسم الكنيسة",
								"المبلغ",
								""
							].map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-2 py-2 text-start font-semibold border-b border-border",
								children: h
							}, h))
						}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: churchSupport.map((cs, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "border-b border-border/60",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-2 py-1 text-muted-foreground",
									children: i + 1
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-1 py-1",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										value: cs.church_name ?? "",
										onChange: (e) => setChurchSupport((s) => s.map((r, ri) => ri === i ? {
											...r,
											church_name: e.target.value
										} : r)),
										className: "w-full bg-paper rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-ring",
										placeholder: "اسم الكنيسة"
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-1 py-1",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "number",
										value: cs.amount ?? "",
										onChange: (e) => setChurchSupport((s) => s.map((r, ri) => ri === i ? {
											...r,
											amount: e.target.value === "" ? 0 : Number(e.target.value)
										} : r)),
										className: "w-32 bg-paper rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-ring",
										placeholder: "0"
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-1 py-1",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => setChurchSupport((s) => s.filter((_, ri) => ri !== i)),
										className: "text-destructive hover:bg-destructive/10 p-1 rounded",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 14 })
									})
								})
							]
						}, i)) })]
					}), churchSupport.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-center py-4 text-muted-foreground text-sm",
						children: "لا توجد شهريات من كنائس أخرى"
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex justify-end gap-3",
				children: [onCancel && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: onCancel,
					className: "px-6 py-3 rounded-full bg-muted",
					children: "إلغاء"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "submit",
					disabled: busy,
					className: "chip-green px-8 py-3 disabled:opacity-60",
					children: busy ? "جارٍ الحفظ..." : submitLabel
				})]
			})
		]
	});
}
function TInput({ label, type = "text", required, className = "", value, onChange, readOnly = false, pattern, errorMsg = "", maxLength, placeholder }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: `block ${className}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "text-sm font-semibold text-muted-foreground",
				children: [
					label,
					" ",
					required && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-destructive",
						children: "*"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				type,
				required,
				readOnly,
				value,
				maxLength,
				placeholder,
				onChange: (e) => onChange?.(e.target.value),
				pattern,
				className: cn("mt-1 w-full rounded-xl bg-paper border border-border px-3 py-2 outline-none focus:ring-2 focus:ring-ring", readOnly && "bg-muted cursor-not-allowed opacity-70", errorMsg && "border-destructive focus:ring-destructive")
			}),
			errorMsg && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-destructive mt-1",
				children: errorMsg
			})
		]
	});
}
function TSelect({ label, value, onChange, options, placeholder, className = "", required = false, errorMsg = "", disabled = false }) {
	const Select$1 = Select;
	const SelectTrigger$1 = import_react.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectTrigger, {
		ref,
		className: cn("flex h-10 w-full items-center justify-between rounded-xl bg-paper border border-border px-3 py-2 text-sm text-muted-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring", errorMsg && "border-destructive focus:ring-destructive", className),
		...props,
		children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectIcon, {
			asChild: true,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "h-4 w-4 opacity-50" })
		})]
	}));
	SelectTrigger$1.displayName = SelectTrigger.displayName;
	const SelectContent$1 = import_react.forwardRef(({ className, children, position = "popper", ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectPortal, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, {
		ref,
		className: cn("relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border border-border bg-paper shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2", position === "popper" && "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1", className),
		position,
		...props,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectViewport, {
			className: cn("p-1", position === "popper" && "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"),
			children
		})
	}) }));
	SelectContent$1.displayName = SelectContent.displayName;
	const SelectItem$1 = import_react.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectItem, {
		ref,
		className: cn("relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 ps-2 pe-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className),
		...props,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "absolute end-2 flex h-3.5 w-3.5 items-center justify-center",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItemIndicator, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-4 w-4" }) })
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItemText, { children })]
	}));
	SelectItem$1.displayName = SelectItem.displayName;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: `block ${className}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "text-sm font-semibold text-muted-foreground",
				children: [
					label,
					" ",
					required && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-destructive",
						children: "*"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-1",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select$1, {
					value: value || void 0,
					onValueChange: onChange,
					disabled,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger$1, {
						className: disabled ? "bg-muted cursor-not-allowed opacity-70" : "",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: placeholder || "اختر..." })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent$1, { children: options.map((opt) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem$1, {
						value: opt.value,
						children: opt.label
					}, opt.value)) })]
				})
			}),
			errorMsg && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-destructive mt-1",
				children: errorMsg
			})
		]
	});
}
function NumRow({ label, k, fin, setFin }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "flex items-center justify-between gap-3 bg-paper border border-border rounded-xl px-3 py-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-sm font-semibold",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
			type: "number",
			value: fin[k] ?? "",
			onChange: (e) => setFin((s) => ({
				...s,
				[k]: e.target.value === "" ? 0 : Number(e.target.value)
			})),
			className: "w-32 bg-transparent text-end outline-none tabular-nums",
			placeholder: "0"
		})]
	});
}
function buildIndividualPayload({ ind, family, fin, churchSupport }) {
	const cleanFamily = family.filter((f) => f.full_name.trim().length);
	const cleanChurchSupport = churchSupport.filter((cs) => cs.church_name.trim().length);
	const gender = normalizeGender(ind.gender);
	if (!gender) throw new Error("برجاء اختيار النوع");
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
			id: f.id,
			full_name: f.full_name,
			national_id: f.national_id ?? null,
			relation: f.relation === "آخر" ? f.relation_custom ?? null : f.relation ?? null,
			insurance_number: f.insurance_number ?? null,
			marital_status: f.marital_status ?? null,
			confession_father: f.confession_father ?? null,
			school_or_job: f.school_or_job ?? null,
			income: f.income ? Number(f.income) : null,
			notes: f.notes ?? null
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
			education_cost: Number(fin.education_cost || 0)
		},
		churchSupport: cleanChurchSupport.map((cs) => ({
			id: cs.id,
			church_name: cs.church_name,
			amount: Number(cs.amount || 0)
		}))
	};
}
//#endregion
export { buildIndividualPayload as n, IndividualForm as t };
