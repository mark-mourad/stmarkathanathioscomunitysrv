import { i as __toESM } from "../_runtime.mjs";
import { _ as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { F as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { F as getPharmacyBeneficiaries, I as getPharmacyInventory, L as getPharmacyRequests, P as getMyPharmacyRequests, Q as updatePharmacyRequestStatus, Z as updatePharmacyInventoryItem, c as createPharmacyRequest, et as useServerFn, g as deletePharmacyRequest, h as deletePharmacyInventoryItem, n as addPharmacyInventoryItem } from "./church.functions-CojeWWgP.mjs";
import { i as getVisibleSaintFamilyValues } from "./permissions-BPF-3_4x.mjs";
import { t as useAuth } from "./use-auth-DmMFHth-.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { D as ClipboardList, F as Ban, M as Check, _ as Pencil, g as Pill, h as Plus, s as Trash2, t as X, v as Package } from "../_libs/lucide-react.mjs";
import { a as AlertDialogDescription, c as AlertDialogTitle, i as AlertDialogContent, l as AlertDialogTrigger, n as AlertDialogAction, o as AlertDialogFooter, r as AlertDialogCancel, s as AlertDialogHeader, t as AlertDialog } from "./alert-dialog-DEtovhbm.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/pharmacy-CBuNoGdj.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var SAINT_FAMILIES = [
	{
		value: "متى",
		label: "أسرة القديس متى"
	},
	{
		value: "مرقس",
		label: "أسرة القديس مرقس"
	},
	{
		value: "لوقا",
		label: "أسرة القديس لوقا"
	},
	{
		value: "يوحنا",
		label: "أسرة القديس يوحنا"
	},
	{
		value: "أسر مستترة",
		label: "الأسرة المستترة"
	}
];
var DISEASE_CATEGORIES = [
	{
		value: "قلب",
		label: "أمراض القلب"
	},
	{
		value: "سكر",
		label: "أمراض السكر"
	},
	{
		value: "ضغط",
		label: "أمراض الضغط"
	},
	{
		value: "صدر",
		label: "أمراض الصدر"
	},
	{
		value: "كلى",
		label: "أمراض الكلى"
	},
	{
		value: "عظام",
		label: "أمراض العظام"
	},
	{
		value: "جلدية",
		label: "أمراض جلدية"
	},
	{
		value: "عيون",
		label: "أمراض العيون"
	},
	{
		value: "نفسي",
		label: "أمراض نفسية"
	},
	{
		value: "أخرى",
		label: "أخرى"
	}
];
var UNIT_TYPES = [
	{
		value: "علبة",
		label: "علبة"
	},
	{
		value: "شريط",
		label: "شريط"
	},
	{
		value: "حقنة/أمبول",
		label: "حقنة/أمبول"
	},
	{
		value: "أخرى",
		label: "أخرى"
	}
];
var STATUS_STYLES = {
	"تحت المراجعة": "bg-amber-100 text-amber-700 border border-amber-200",
	مقبول: "bg-emerald-100 text-emerald-700 border border-emerald-200",
	مرفوض: "bg-red-100 text-red-700 border border-red-200"
};
function PharmacyPage() {
	const { can, role } = useAuth();
	const router = useRouter();
	const pharmRestricted = [
		"SUPPLY_WAREHOUSE_MANAGER",
		"FURNITURE_WAREHOUSE_MANAGER",
		"BRIDE_AND_MEDICAL_AIDS_MANAGER",
		"BLESSING_DISTRIBUTOR"
	];
	(0, import_react.useEffect)(() => {
		if (pharmRestricted.includes(role)) {
			toast.error("غير مصرح لك بهذا الحقل");
			router.navigate({ to: "/" });
		}
	}, [role]);
	if (pharmRestricted.includes(role)) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "text-center py-8 text-muted-foreground",
		children: "جاري التوجيه..."
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
				className: "display text-2xl text-ink flex items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, { size: 28 }), " الصيدلية"]
			}),
			role !== "PHARMACY_WAREHOUSE_MANAGER" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ViewerRequestSection, {}),
			can("manage:pharmacy") && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminSection, {})
		]
	});
}
function ViewerRequestSection() {
	const { role } = useAuth();
	const fetchMyRequests = useServerFn(getMyPharmacyRequests);
	const createReq = useServerFn(createPharmacyRequest);
	const fetchBeneficiaries = useServerFn(getPharmacyBeneficiaries);
	const [requests, setRequests] = (0, import_react.useState)([]);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [formOpen, setFormOpen] = (0, import_react.useState)(false);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [formFamily, setFormFamily] = (0, import_react.useState)("");
	const [formBeneficiary, setFormBeneficiary] = (0, import_react.useState)("");
	const [formDiseaseCategory, setFormDiseaseCategory] = (0, import_react.useState)("");
	const [formCustomDisease, setFormCustomDisease] = (0, import_react.useState)("");
	const [formMedicineName, setFormMedicineName] = (0, import_react.useState)("");
	const [formQuantity, setFormQuantity] = (0, import_react.useState)(1);
	const [formDetails, setFormDetails] = (0, import_react.useState)("");
	const [beneficiaries, setBeneficiaries] = (0, import_react.useState)([]);
	const [benefLoading, setBenefLoading] = (0, import_react.useState)(false);
	const reload = (0, import_react.useCallback)(async () => {
		setLoading(true);
		try {
			setRequests(await fetchMyRequests());
		} catch {
			toast.error("خطأ في جلب طلباتك");
		} finally {
			setLoading(false);
		}
	}, [fetchMyRequests]);
	(0, import_react.useEffect)(() => {
		reload();
	}, [reload]);
	async function handleFamilyChange(val) {
		setFormFamily(val);
		setFormBeneficiary("");
		setBeneficiaries([]);
		if (!val) return;
		setBenefLoading(true);
		try {
			setBeneficiaries(await fetchBeneficiaries({ data: { family_name: val } }));
		} catch {
			setBeneficiaries([]);
		} finally {
			setBenefLoading(false);
		}
	}
	const visibleFamilies = SAINT_FAMILIES.filter((f) => getVisibleSaintFamilyValues(role).includes(f.value));
	const familyLocked = visibleFamilies.length === 1;
	function openForm() {
		setFormBeneficiary("");
		setFormDiseaseCategory("");
		setFormCustomDisease("");
		setFormMedicineName("");
		setFormQuantity(1);
		setFormDetails("");
		setBeneficiaries([]);
		setFormOpen(true);
		if (familyLocked) handleFamilyChange(visibleFamilies[0].value);
		else setFormFamily("");
	}
	async function handleSubmit() {
		if (!formFamily) return toast.error("يرجى اختيار الأسرة");
		if (!formBeneficiary) return toast.error("يرجى اختيار المخدوم");
		if (!formDiseaseCategory) return toast.error("يرجى اختيار التصنيف المرضي");
		if (formDiseaseCategory === "أخرى" && !formCustomDisease) return toast.error("يرجى إدخال اسم المرض");
		if (!formMedicineName) return toast.error("يرجى إدخال اسم الدواء");
		if (formQuantity < 1) return toast.error("الكمية يجب أن تكون 1 على الأقل");
		const benef = beneficiaries.find((b) => b.id === formBeneficiary);
		setBusy(true);
		try {
			await createReq({ data: {
				family_name: formFamily,
				beneficiary_id: formBeneficiary,
				beneficiary_name: benef?.full_name ?? "",
				disease_category: formDiseaseCategory,
				custom_disease_name: formDiseaseCategory === "أخرى" ? formCustomDisease : null,
				medicine_name: formMedicineName,
				requested_quantity: formQuantity,
				details: formDetails || null
			} });
			toast.success("تم إرسال الطلب بنجاح");
			setFormOpen(false);
			await reload();
		} catch (err) {
			toast.error(err?.message ?? "حدث خطأ");
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between gap-3 flex-wrap",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
					className: "display text-lg text-ink flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClipboardList, { size: 20 }), " طلب الأدوية"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: openForm,
					className: "chip-green px-5 py-2 text-sm flex items-center gap-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { size: 16 }), " طلب دواء"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "paper-card",
				children: loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-center text-muted-foreground py-8",
					children: "جارٍ التحميل..."
				}) : requests.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-center text-muted-foreground py-8",
					children: "لم تقم بإرسال أي طلبات بعد"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "overflow-x-auto",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full text-sm border-collapse",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
							className: "text-muted-foreground",
							children: [
								"م",
								"الأسرة",
								"المخدوم",
								"المرض",
								"الدواء",
								"الكمية",
								"الحالة",
								"التاريخ"
							].map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-2 py-2 text-start font-semibold border-b border-border whitespace-nowrap",
								children: h
							}, h))
						}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: requests.map((r, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "border-b border-border/60 hover:bg-primary/5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-2 py-2 text-muted-foreground",
									children: i + 1
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-2 py-2",
									children: SAINT_FAMILIES.find((f) => f.value === r.family_name)?.label ?? r.family_name
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-2 py-2",
									children: r.beneficiary_name
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-2 py-2",
									children: r.disease_category === "أخرى" ? r.custom_disease_name ?? "أخرى" : DISEASE_CATEGORIES.find((d) => d.value === r.disease_category)?.label ?? r.disease_category
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-2 py-2 font-semibold",
									children: r.medicine_name
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-2 py-2",
									children: r.requested_quantity
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-2 py-2",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: `px-2 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[r.status] ?? ""}`,
										children: r.status
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-2 py-2 text-muted-foreground text-xs whitespace-nowrap",
									children: new Date(r.created_at).toLocaleDateString("ar-EG")
								})
							]
						}, r.id)) })]
					})
				})
			}),
			formOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 bg-ink/40 backdrop-blur-sm z-50 flex items-center justify-center p-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "paper-card w-full max-w-lg max-h-[90vh] overflow-y-auto",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between mb-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "display text-xl",
								children: "طلب دواء"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setFormOpen(false),
								className: "p-1 rounded hover:bg-muted",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 18 })
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "block",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-sm font-semibold text-muted-foreground",
										children: ["الأسرة ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-destructive",
											children: "*"
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
										value: formFamily,
										onChange: (e) => handleFamilyChange(e.target.value),
										disabled: familyLocked,
										className: "mt-1 w-full rounded-xl bg-paper border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "",
											children: familyLocked ? "" : "اختر الأسرة..."
										}), visibleFamilies.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: f.value,
											children: f.label
										}, f.value))]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "block",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-sm font-semibold text-muted-foreground",
										children: ["المخدوم ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-destructive",
											children: "*"
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
										value: formBeneficiary,
										onChange: (e) => setFormBeneficiary(e.target.value),
										disabled: !formFamily,
										className: "mt-1 w-full rounded-xl bg-paper border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "",
											children: benefLoading ? "جارٍ التحميل..." : !formFamily ? "اختر الأسرة أولاً" : "اختر المخدوم..."
										}), beneficiaries.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: b.id,
											children: b.display_name
										}, b.id))]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "block",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-sm font-semibold text-muted-foreground",
										children: ["التصنيف المرضي ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-destructive",
											children: "*"
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
										value: formDiseaseCategory,
										onChange: (e) => {
											setFormDiseaseCategory(e.target.value);
											setFormCustomDisease("");
										},
										className: "mt-1 w-full rounded-xl bg-paper border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "",
											children: "اختر التصنيف..."
										}), DISEASE_CATEGORIES.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: c.value,
											children: c.label
										}, c.value))]
									})]
								}),
								formDiseaseCategory === "أخرى" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "block",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-sm font-semibold text-muted-foreground",
										children: ["اسم المرض ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-destructive",
											children: "*"
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "text",
										value: formCustomDisease,
										onChange: (e) => setFormCustomDisease(e.target.value),
										placeholder: "أدخل اسم المرض...",
										className: "mt-1 w-full rounded-xl bg-paper border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "block",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-sm font-semibold text-muted-foreground",
										children: ["اسم الدواء ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-destructive",
											children: "*"
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "text",
										value: formMedicineName,
										onChange: (e) => setFormMedicineName(e.target.value),
										placeholder: "أدخل اسم الدواء...",
										className: "mt-1 w-full rounded-xl bg-paper border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "block",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-sm font-semibold text-muted-foreground",
										children: ["الكمية المطلوبة ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-destructive",
											children: "*"
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "number",
										min: 1,
										value: formQuantity,
										onChange: (e) => setFormQuantity(Number(e.target.value)),
										className: "mt-1 w-full rounded-xl bg-paper border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "block",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-sm font-semibold text-muted-foreground",
										children: "التفاصيل / ملاحظات"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
										value: formDetails,
										onChange: (e) => setFormDetails(e.target.value),
										rows: 2,
										placeholder: "أي ملاحظات أو تفاصيل إضافية...",
										className: "mt-1 w-full rounded-xl bg-paper border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
									})]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex gap-3 mt-6 justify-end",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setFormOpen(false),
								className: "px-4 py-2 rounded-full bg-muted text-foreground text-sm",
								children: "إلغاء"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: handleSubmit,
								disabled: busy,
								className: "chip-green px-6 py-2 text-sm disabled:opacity-60",
								children: busy ? "جارٍ الإرسال..." : "إرسال الطلب"
							})]
						})
					]
				})
			})
		]
	});
}
function AdminSection() {
	const [tab, setTab] = (0, import_react.useState)("inventory");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "space-y-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex gap-2 border-b border-border pb-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				onClick: () => setTab("inventory"),
				className: `px-4 py-2 rounded-full text-sm font-semibold transition ${tab === "inventory" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-primary/10"}`,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, {
					size: 14,
					className: "inline ms-1"
				}), "إدارة المخزون"]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				onClick: () => setTab("requests"),
				className: `px-4 py-2 rounded-full text-sm font-semibold transition ${tab === "requests" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-primary/10"}`,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClipboardList, {
					size: 14,
					className: "inline ms-1"
				}), "طلبات العلاج"]
			})]
		}), tab === "inventory" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InventoryTab, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RequestsTab, {})]
	});
}
function InventoryTab() {
	const fetchItems = useServerFn(getPharmacyInventory);
	const addItem = useServerFn(addPharmacyInventoryItem);
	const updateItem = useServerFn(updatePharmacyInventoryItem);
	const deleteItem = useServerFn(deletePharmacyInventoryItem);
	const [items, setItems] = (0, import_react.useState)([]);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [modalOpen, setModalOpen] = (0, import_react.useState)(false);
	const [modalMode, setModalMode] = (0, import_react.useState)("add");
	const [editingId, setEditingId] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [formDiseaseCategory, setFormDiseaseCategory] = (0, import_react.useState)("");
	const [formCustomDisease, setFormCustomDisease] = (0, import_react.useState)("");
	const [formMedicineName, setFormMedicineName] = (0, import_react.useState)("");
	const [formQuantity, setFormQuantity] = (0, import_react.useState)(1);
	const [formUnitType, setFormUnitType] = (0, import_react.useState)("علبة");
	const [formDetails, setFormDetails] = (0, import_react.useState)("");
	const reload = (0, import_react.useCallback)(async () => {
		setLoading(true);
		try {
			setItems(await fetchItems());
		} catch {
			toast.error("خطأ في جلب المخزون");
		} finally {
			setLoading(false);
		}
	}, [fetchItems]);
	(0, import_react.useEffect)(() => {
		reload();
	}, [reload]);
	function openAdd() {
		setModalMode("add");
		setEditingId(null);
		setFormDiseaseCategory("");
		setFormCustomDisease("");
		setFormMedicineName("");
		setFormQuantity(1);
		setFormUnitType("علبة");
		setFormDetails("");
		setModalOpen(true);
	}
	function openEdit(item) {
		setModalMode("edit");
		setEditingId(item.id);
		setFormDiseaseCategory(item.disease_category);
		setFormCustomDisease(item.custom_disease_name ?? "");
		setFormMedicineName(item.medicine_name);
		setFormQuantity(item.quantity);
		setFormUnitType(item.unit_type);
		setFormDetails(item.details ?? "");
		setModalOpen(true);
	}
	async function handleSubmit() {
		if (!formDiseaseCategory) return toast.error("يرجى اختيار التصنيف المرضي");
		if (formDiseaseCategory === "أخرى" && !formCustomDisease) return toast.error("يرجى إدخال اسم المرض");
		if (!formMedicineName) return toast.error("يرجى إدخال اسم الدواء");
		if (formQuantity < 0) return toast.error("العدد لا يمكن أن يكون سالباً");
		setBusy(true);
		try {
			const payload = {
				disease_category: formDiseaseCategory,
				custom_disease_name: formDiseaseCategory === "أخرى" ? formCustomDisease : null,
				medicine_name: formMedicineName,
				quantity: formQuantity,
				unit_type: formUnitType,
				details: formDetails || null
			};
			if (modalMode === "add") {
				await addItem({ data: payload });
				toast.success("تم إضافة الصنف بنجاح");
			} else if (editingId) {
				await updateItem({ data: {
					...payload,
					id: editingId
				} });
				toast.success("تم تحديث الصنف بنجاح");
			}
			setModalOpen(false);
			await reload();
		} catch (err) {
			toast.error(err?.message ?? "حدث خطأ");
		} finally {
			setBusy(false);
		}
	}
	async function handleDelete(id) {
		try {
			await deleteItem({ data: { id } });
			toast.success("تم حذف الصنف");
			await reload();
		} catch (err) {
			toast.error(err?.message ?? "فشل الحذف");
		}
	}
	const diseaseLabel = (cat, custom) => {
		if (cat === "أخرى") return custom ?? "أخرى";
		return DISEASE_CATEGORIES.find((d) => d.value === cat)?.label ?? cat;
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "display text-lg text-ink",
					children: "إدارة المخزون"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: openAdd,
					className: "chip-green px-5 py-2 text-sm flex items-center gap-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { size: 16 }), " إضافة صنف"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "paper-card",
				children: loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-center text-muted-foreground py-8",
					children: "جارٍ التحميل..."
				}) : items.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-center text-muted-foreground py-8",
					children: "لا توجد أصناف في مخزن الصيدلية"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "overflow-x-auto",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full text-sm border-collapse",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
							className: "text-muted-foreground",
							children: [
								"م",
								"المرض",
								"اسم الدواء",
								"العدد",
								"نوع الوحدة",
								"التفاصيل",
								""
							].map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-2 py-2 text-start font-semibold border-b border-border whitespace-nowrap",
								children: h
							}, h))
						}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: items.map((item, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "border-b border-border/60 hover:bg-primary/5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-2 py-2 text-muted-foreground",
									children: i + 1
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-2 py-2",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: `px-2 py-1 rounded-full text-xs font-bold ${item.disease_category === "أخرى" ? "bg-gray-100 text-gray-700" : "bg-sky/20 text-sky"}`,
										children: diseaseLabel(item.disease_category, item.custom_disease_name)
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-2 py-2 font-semibold",
									children: item.medicine_name
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-2 py-2",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: `px-2 py-1 rounded-full text-xs font-bold ${item.quantity > 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`,
										children: item.quantity
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-2 py-2 text-muted-foreground",
									children: item.unit_type
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-2 py-2 text-muted-foreground max-w-[120px] truncate",
									children: item.details ?? "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-2 py-2",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											onClick: () => openEdit(item),
											className: "p-1 rounded hover:bg-primary/10 text-muted-foreground",
											title: "تعديل",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { size: 14 })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialog, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogTrigger, {
											asChild: true,
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												className: "p-1 rounded hover:bg-destructive/10 text-destructive",
												title: "حذف",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 14 })
											})
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogTitle, { children: "حذف الصنف" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogDescription, { children: [
											"سيتم حذف \"",
											item.medicine_name,
											"\" من مخزن الصيدلية نهائياً. لا يمكن التراجع عن هذا الإجراء."
										] })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogCancel, { children: "إلغاء" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogAction, {
											onClick: () => handleDelete(item.id),
											className: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
											children: "حذف"
										})] })] })] })]
									})
								})
							]
						}, item.id)) })]
					})
				})
			}),
			modalOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 bg-ink/40 backdrop-blur-sm z-50 flex items-center justify-center p-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "paper-card w-full max-w-md max-h-[90vh] overflow-y-auto",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between mb-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "display text-xl",
								children: modalMode === "add" ? "إضافة صنف جديد" : "تعديل الصنف"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setModalOpen(false),
								className: "p-1 rounded hover:bg-muted",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 18 })
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "block",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-sm font-semibold text-muted-foreground",
										children: ["التصنيف المرضي ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-destructive",
											children: "*"
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
										value: formDiseaseCategory,
										onChange: (e) => {
											setFormDiseaseCategory(e.target.value);
											setFormCustomDisease("");
										},
										className: "mt-1 w-full rounded-xl bg-paper border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "",
											children: "اختر التصنيف..."
										}), DISEASE_CATEGORIES.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: c.value,
											children: c.label
										}, c.value))]
									})]
								}),
								formDiseaseCategory === "أخرى" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "block",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-sm font-semibold text-muted-foreground",
										children: ["اسم المرض ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-destructive",
											children: "*"
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "text",
										value: formCustomDisease,
										onChange: (e) => setFormCustomDisease(e.target.value),
										placeholder: "أدخل اسم المرض...",
										className: "mt-1 w-full rounded-xl bg-paper border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "block",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-sm font-semibold text-muted-foreground",
										children: ["اسم الدواء ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-destructive",
											children: "*"
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "text",
										value: formMedicineName,
										onChange: (e) => setFormMedicineName(e.target.value),
										placeholder: "أدخل اسم الدواء...",
										className: "mt-1 w-full rounded-xl bg-paper border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "block",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-sm font-semibold text-muted-foreground",
										children: ["العدد ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-destructive",
											children: "*"
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "number",
										min: 0,
										value: formQuantity,
										onChange: (e) => setFormQuantity(Number(e.target.value)),
										className: "mt-1 w-full rounded-xl bg-paper border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring tabular-nums"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "block",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-sm font-semibold text-muted-foreground",
										children: ["نوع الوحدة ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-destructive",
											children: "*"
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
										value: formUnitType,
										onChange: (e) => setFormUnitType(e.target.value),
										className: "mt-1 w-full rounded-xl bg-paper border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring",
										children: UNIT_TYPES.map((u) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: u.value,
											children: u.label
										}, u.value))
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "block",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-sm font-semibold text-muted-foreground",
										children: "ملاحظات (اختياري)"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
										value: formDetails,
										onChange: (e) => setFormDetails(e.target.value),
										rows: 2,
										placeholder: "أي ملاحظات أو تفاصيل إضافية...",
										className: "mt-1 w-full rounded-xl bg-paper border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
									})]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex gap-3 mt-6 justify-end",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setModalOpen(false),
								className: "px-4 py-2 rounded-full bg-muted text-foreground text-sm",
								children: "إلغاء"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: handleSubmit,
								disabled: busy,
								className: "chip-green px-6 py-2 text-sm disabled:opacity-60",
								children: busy ? "جارٍ الحفظ..." : modalMode === "add" ? "إضافة" : "حفظ"
							})]
						})
					]
				})
			})
		]
	});
}
function RequestsTab() {
	const { role } = useAuth();
	const fetchRequests = useServerFn(getPharmacyRequests);
	const updateStatus = useServerFn(updatePharmacyRequestStatus);
	const deleteReq = useServerFn(deletePharmacyRequest);
	const visibleFamilies = SAINT_FAMILIES.filter((f) => getVisibleSaintFamilyValues(role).includes(f.value));
	const [requests, setRequests] = (0, import_react.useState)([]);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [filterStatus, setFilterStatus] = (0, import_react.useState)("");
	const [filterFamily, setFilterFamily] = (0, import_react.useState)("");
	const reload = (0, import_react.useCallback)(async () => {
		setLoading(true);
		try {
			setRequests(await fetchRequests());
		} catch {
			toast.error("خطأ في جلب الطلبات");
		} finally {
			setLoading(false);
		}
	}, [fetchRequests]);
	(0, import_react.useEffect)(() => {
		reload();
	}, [reload]);
	async function handleStatusUpdate(id, status) {
		try {
			await updateStatus({ data: {
				id,
				status
			} });
			toast.success(status === "مقبول" ? "تم قبول الطلب" : "تم رفض الطلب");
			await reload();
		} catch (err) {
			toast.error(err?.message ?? "حدث خطأ");
		}
	}
	async function handleDelete(id) {
		try {
			await deleteReq({ data: { id } });
			toast.success("تم حذف الطلب");
			await reload();
		} catch (err) {
			toast.error(err?.message ?? "فشل الحذف");
		}
	}
	const filtered = requests.filter((r) => {
		if (filterStatus && r.status !== filterStatus) return false;
		if (filterFamily && r.family_name !== filterFamily) return false;
		return true;
	});
	const diseaseLabel = (cat, custom) => {
		if (cat === "أخرى") return custom ?? "أخرى";
		return DISEASE_CATEGORIES.find((d) => d.value === cat)?.label ?? cat;
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "display text-lg text-ink",
				children: "طلبات العلاج"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "paper-card",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-1 md:grid-cols-3 gap-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "block",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs font-semibold text-muted-foreground",
								children: "الحالة"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								value: filterStatus,
								onChange: (e) => setFilterStatus(e.target.value),
								className: "mt-1 w-full rounded-xl bg-paper border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "",
										children: "الكل"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "تحت المراجعة",
										children: "تحت المراجعة"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "مقبول",
										children: "مقبول"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "مرفوض",
										children: "مرفوض"
									})
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "block",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs font-semibold text-muted-foreground",
								children: "الأسرة"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								value: filterFamily,
								onChange: (e) => setFilterFamily(e.target.value),
								className: "mt-1 w-full rounded-xl bg-paper border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "",
									children: "الكل"
								}), visibleFamilies.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: f.value,
									children: f.label
								}, f.value))]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex items-end",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-sm text-muted-foreground",
								children: [filtered.length, " طلب"]
							})
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "paper-card",
				children: loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-center text-muted-foreground py-8",
					children: "جارٍ التحميل..."
				}) : filtered.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-center text-muted-foreground py-8",
					children: "لا توجد طلبات"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "overflow-x-auto",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full text-sm border-collapse",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
							className: "text-muted-foreground",
							children: [
								"م",
								"الأسرة",
								"المخدوم",
								"المرض",
								"الدواء",
								"الكمية",
								"الحالة",
								"التاريخ",
								""
							].map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-2 py-2 text-start font-semibold border-b border-border whitespace-nowrap",
								children: h
							}, h))
						}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: filtered.map((r, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "border-b border-border/60 hover:bg-primary/5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-2 py-2 text-muted-foreground",
									children: i + 1
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-2 py-2",
									children: SAINT_FAMILIES.find((f) => f.value === r.family_name)?.label ?? r.family_name
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-2 py-2",
									children: r.beneficiary_name
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-2 py-2",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "px-2 py-1 rounded-full text-xs font-bold bg-sky/20 text-sky",
										children: diseaseLabel(r.disease_category, r.custom_disease_name)
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-2 py-2 font-semibold",
									children: r.medicine_name
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-2 py-2",
									children: r.requested_quantity
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-2 py-2",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: `px-2 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[r.status] ?? ""}`,
										children: r.status
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-2 py-2 text-muted-foreground text-xs whitespace-nowrap",
									children: new Date(r.created_at).toLocaleDateString("ar-EG")
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-2 py-2",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-1",
										children: [r.status === "تحت المراجعة" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											onClick: () => handleStatusUpdate(r.id, "مقبول"),
											className: "p-1 rounded hover:bg-emerald-100 text-emerald-600",
											title: "قبول",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { size: 14 })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											onClick: () => handleStatusUpdate(r.id, "مرفوض"),
											className: "p-1 rounded hover:bg-red-100 text-red-600",
											title: "رفض",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ban, { size: 14 })
										})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialog, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogTrigger, {
											asChild: true,
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												className: "p-1 rounded hover:bg-destructive/10 text-destructive",
												title: "حذف",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 14 })
											})
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogTitle, { children: "حذف الطلب" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogDescription, { children: [
											"سيتم حذف طلب \"",
											r.medicine_name,
											"\" نهائياً. لا يمكن التراجع عن هذا الإجراء."
										] })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogCancel, { children: "إلغاء" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogAction, {
											onClick: () => handleDelete(r.id),
											className: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
											children: "حذف"
										})] })] })] })]
									})
								})
							]
						}, r.id)) })]
					})
				})
			})
		]
	});
}
//#endregion
export { PharmacyPage as component };
