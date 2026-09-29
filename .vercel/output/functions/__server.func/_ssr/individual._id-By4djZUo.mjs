import { i as __toESM } from "../_runtime.mjs";
import { _ as useRouter, h as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { F as require_jsx_runtime, d as DialogClose, f as DialogContent$1, g as DialogTitle$1, h as DialogPortal$1, m as DialogOverlay$1, p as DialogDescription$1, u as Dialog$1 } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { A as getIndividual, E as getFamilyMemberAssistanceStatus, J as updateIndividual, et as useServerFn, i as createAssistanceLog, l as deleteAssistanceLog, m as deleteIndividual, y as getAssistanceLogs } from "./church.functions-CojeWWgP.mjs";
import { t as useAuth } from "./use-auth-DmMFHth-.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { B as CircleCheckBig, C as HeartHandshake, I as ArrowRight, N as Calendar, T as Download, _ as Pencil, c as Stethoscope, h as Plus, i as User, j as ChevronDown, k as ChevronUp, m as Printer, s as Trash2, t as X, v as Package, z as CircleX } from "../_libs/lucide-react.mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
import { n as buildIndividualPayload, t as IndividualForm } from "./individual-form-CqEQcHFt.mjs";
import { a as AlertDialogDescription, c as AlertDialogTitle, i as AlertDialogContent, l as AlertDialogTrigger, n as AlertDialogAction, o as AlertDialogFooter, r as AlertDialogCancel, s as AlertDialogHeader, t as AlertDialog } from "./alert-dialog-DEtovhbm.mjs";
import { t as Route } from "./individual._id-N8zfhcgZ.mjs";
import { t as require_JsBarcode } from "../_libs/jsbarcode.mjs";
import { t as toPng } from "../_libs/html-to-image.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/individual._id-By4djZUo.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var import_JsBarcode = /* @__PURE__ */ __toESM(require_JsBarcode());
var APPLIANCE_TYPES = [
	"تلاجة",
	"غسالة",
	"ميكروويف",
	"خلاط",
	"فرن",
	"بوتاجاز",
	"مروحة",
	"تلفزيون"
];
var FURNITURE_TYPES = [
	"غرفة نوم",
	"كنبة",
	"أنتريه",
	"كرسي",
	"ترابيزة سفرة",
	"نيش",
	"بوفيه",
	"طاولة"
];
var KITCHENWARE_TYPES = [
	"طبق",
	"معلقة",
	"كوباية",
	"طاسة",
	"حلة",
	"شوكة",
	"سكين",
	"مصفاة"
];
var CLOTHING_TYPES = [
	"تي شيرت",
	"بنطلون",
	"بلوزة",
	"فستان",
	"جاكيت / كوت",
	"قميص",
	"غيارات",
	"أخرى"
];
var BEDDING_TYPES = [
	"ملاية",
	"مخدة",
	"بطانية",
	"سجادة",
	"ستارة",
	"وسادة",
	"غطاء"
];
var MEDICAL_CATEGORIES = [
	{
		value: "operation",
		label: "عملية"
	},
	{
		value: "radiology",
		label: "إشاعة"
	},
	{
		value: "lab_test",
		label: "تحليل"
	},
	{
		value: "medication",
		label: "علاجات"
	},
	{
		value: "checkup",
		label: "كشف"
	},
	{
		value: "external_treatment",
		label: "علاج خارجي"
	}
];
var BRIDAL_CATEGORIES = [
	{
		key: "appliances",
		label: "الأجهزة المنزلية",
		types: APPLIANCE_TYPES,
		hasQuantity: false
	},
	{
		key: "furniture",
		label: "الاثاث",
		types: FURNITURE_TYPES,
		hasQuantity: false
	},
	{
		key: "clothing",
		label: "الملابس",
		types: CLOTHING_TYPES,
		hasQuantity: true
	},
	{
		key: "kitchenware",
		label: "أدوات المطبخ",
		types: KITCHENWARE_TYPES,
		hasQuantity: true
	},
	{
		key: "bedding",
		label: "المفروشات",
		types: BEDDING_TYPES,
		hasQuantity: true
	}
];
function AssistanceForm({ individualId, familyMembers, onClose, onSubmit }) {
	const [assistanceType, setAssistanceType] = (0, import_react.useState)("");
	const [familyMemberId, setFamilyMemberId] = (0, import_react.useState)("");
	const [notes, setNotes] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [assistanceStatus, setAssistanceStatus] = (0, import_react.useState)({});
	const [expandedCategories, setExpandedCategories] = (0, import_react.useState)(/* @__PURE__ */ new Set(["appliances"]));
	const [customClothingItems, setCustomClothingItems] = (0, import_react.useState)(/* @__PURE__ */ new Set());
	const fetchStatus = useServerFn(getFamilyMemberAssistanceStatus);
	(0, import_react.useEffect)(() => {
		fetchStatus({ data: { individual_id: individualId } }).then(setAssistanceStatus);
	}, [individualId, fetchStatus]);
	const getMemberStatusText = (memberId) => {
		const status = assistanceStatus[memberId];
		if (!status) return "";
		const parts = [];
		if (status.hasBridal) parts.push("يوجد تجهيز");
		if (status.hasMedical) parts.push("يوجد مساعدات علاجية");
		if (parts.length === 0) return "لا يوجد مساعدات";
		return parts.join("، ");
	};
	const toggleCategory = (cat) => {
		setExpandedCategories((prev) => {
			const next = new Set(prev);
			if (next.has(cat)) next.delete(cat);
			else next.add(cat);
			return next;
		});
	};
	const [bridalDetails, setBridalDetails] = (0, import_react.useState)({
		appliances: [],
		furniture: [],
		clothing: [],
		kitchenware: [],
		bedding: []
	});
	const [medicalDetails, setMedicalDetails] = (0, import_react.useState)([]);
	const addBridalItem = (category) => {
		setBridalDetails((prev) => ({
			...prev,
			[category]: [...prev[category], {
				category,
				item_type: "",
				quantity: 1,
				unit_price: 0,
				total_price: 0
			}]
		}));
	};
	const updateBridalItem = (category, index, field, value) => {
		setBridalDetails((prev) => {
			const updated = [...prev[category]];
			updated[index] = {
				...updated[index],
				[field]: value
			};
			if (field === "quantity" || field === "unit_price") updated[index].total_price = updated[index].quantity * updated[index].unit_price;
			return {
				...prev,
				[category]: updated
			};
		});
	};
	const removeBridalItem = (category, index) => {
		setBridalDetails((prev) => ({
			...prev,
			[category]: prev[category].filter((_, i) => i !== index)
		}));
	};
	const addMedicalItem = () => {
		setMedicalDetails((prev) => [...prev, {
			category: "operation",
			service_name: "",
			total_price: 0,
			church_percentage: 0,
			church_amount: 0
		}]);
	};
	const updateMedicalItem = (index, field, value) => {
		setMedicalDetails((prev) => {
			const updated = [...prev];
			updated[index] = {
				...updated[index],
				[field]: value
			};
			if (field === "total_price" || field === "church_percentage") updated[index].church_amount = updated[index].total_price * updated[index].church_percentage / 100;
			return updated;
		});
	};
	const removeMedicalItem = (index) => {
		setMedicalDetails((prev) => prev.filter((_, i) => i !== index));
	};
	const calculateBridalTotal = (category) => {
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
			await onSubmit({
				family_member_id: familyMemberId === "" ? null : familyMemberId,
				assistance_type: assistanceType,
				notes,
				bridal_details: assistanceType === "bridal_prep" ? bridalDetails : {
					appliances: [],
					furniture: [],
					clothing: [],
					kitchenware: [],
					bedding: []
				},
				medical_details: assistanceType === "medical_aid" ? medicalDetails : []
			});
			toast.success("تم حفظ المساعدة بنجاح");
			onClose();
		} catch (err) {
			toast.error(err?.message ?? "حدث خطأ");
		} finally {
			setBusy(false);
		}
	};
	const inputClass = "w-full bg-paper rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring border border-border/60";
	const selectClass = "w-full bg-paper rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring border border-border/60 appearance-none";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "display text-lg text-ink",
					children: "إضافة مساعدة"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: onClose,
					className: "text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 18 })
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "paper-card space-y-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-1 md:grid-cols-2 gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						className: "block text-xs font-semibold text-muted-foreground mb-1",
						children: "المخدوم / فرد الأسرة"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						value: familyMemberId,
						onChange: (e) => setFamilyMemberId(e.target.value),
						className: selectClass,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "",
							children: familyMembers[0]?.full_name || "المخدوم الرئيسي"
						}), familyMembers.slice(1).map((member) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
							value: member.id,
							children: [
								member.full_name,
								" ",
								getMemberStatusText(member.id) ? `(${getMemberStatusText(member.id)})` : ""
							]
						}, member.id))]
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "block text-xs font-semibold text-muted-foreground mb-1",
						children: ["نوع المساعدة ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-destructive",
							children: "*"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						value: assistanceType,
						onChange: (e) => setAssistanceType(e.target.value),
						className: cn(selectClass, !assistanceType && "text-muted-foreground"),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "",
								children: "— اختر نوع المساعدة —"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "bridal_prep",
								children: "تجهيز عرايس"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "medical_aid",
								children: "مساعدة علاجية"
							})
						]
					})] })]
				}), (() => {
					const statusText = getMemberStatusText(familyMemberId || individualId);
					if (!statusText) return null;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-1.5 text-xs text-muted-foreground",
						children: [statusText.includes("يوجد") ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheckBig, {
							size: 12,
							className: "text-success"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleX, { size: 12 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: statusText })]
					});
				})()]
			}),
			assistanceType === "bridal_prep" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-3",
				children: [BRIDAL_CATEGORIES.map((cat) => {
					const items = bridalDetails[cat.key];
					const total = calculateBridalTotal(cat.key);
					const isExpanded = expandedCategories.has(cat.key);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "paper-card overflow-hidden",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => toggleCategory(cat.key),
							className: "w-full flex items-center justify-between py-1 text-start transition hover:bg-muted/30 -mx-1.5 px-1.5 rounded-lg",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-sm font-semibold",
									children: cat.label
								}), items.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[10px] font-bold bg-primary/10 text-primary rounded-full px-1.5 py-0.5 tabular-nums",
									children: items.length
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2",
								children: [total > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-xs font-semibold text-muted-foreground tabular-nums",
									children: [total.toLocaleString("ar-EG"), " ج.م"]
								}), isExpanded ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronUp, {
									size: 16,
									className: "text-muted-foreground"
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, {
									size: 16,
									className: "text-muted-foreground"
								})]
							})]
						}), isExpanded && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 space-y-2",
							children: [
								items.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-muted-foreground text-center py-2",
									children: "لا توجد عناصر مضافة"
								}),
								items.map((item, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex gap-2 items-end bg-muted/20 rounded-lg p-2",
									children: [cat.hasQuantity ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "w-16 shrink-0",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
												className: "text-[10px] text-muted-foreground block mb-0.5",
												children: "العدد"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												type: "number",
												value: item.quantity,
												min: "1",
												onChange: (e) => updateBridalItem(cat.key, i, "quantity", Number(e.target.value) || 1),
												className: cn(inputClass, "px-2 py-1 text-center")
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex-1",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
												className: "text-[10px] text-muted-foreground block mb-0.5",
												children: "النوع"
											}), cat.key === "clothing" && customClothingItems.has(i) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												type: "text",
												value: item.item_type === "أخرى" ? "" : item.item_type,
												onChange: (e) => updateBridalItem(cat.key, i, "item_type", e.target.value),
												className: cn(inputClass, "px-2 py-1"),
												placeholder: "تحديد النوع"
											}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
												value: item.item_type,
												onChange: (e) => {
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
												},
												className: cn(selectClass, "px-2 py-1"),
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: "",
													children: "اختر"
												}), cat.types.map((type) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: type,
													children: type
												}, type))]
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "w-20 shrink-0",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
												className: "text-[10px] text-muted-foreground block mb-0.5",
												children: "سعر القطعة"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												type: "number",
												value: item.unit_price || "",
												onChange: (e) => updateBridalItem(cat.key, i, "unit_price", Number(e.target.value) || 0),
												className: cn(inputClass, "px-2 py-1")
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "w-20 shrink-0 text-end",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
												className: "text-[10px] text-muted-foreground block mb-0.5",
												children: "الإجمالي"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "text-sm font-semibold py-1 tabular-nums",
												children: item.total_price.toLocaleString("ar-EG")
											})]
										})
									] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
											className: "text-[10px] text-muted-foreground block mb-0.5",
											children: "النوع"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
											value: item.item_type,
											onChange: (e) => updateBridalItem(cat.key, i, "item_type", e.target.value),
											className: cn(selectClass, "px-2 py-1"),
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "",
												children: "اختر"
											}), cat.types.map((type) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: type,
												children: type
											}, type))]
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "w-24 shrink-0",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
											className: "text-[10px] text-muted-foreground block mb-0.5",
											children: "السعر"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "number",
											value: item.total_price || "",
											onChange: (e) => updateBridalItem(cat.key, i, "total_price", Number(e.target.value) || 0),
											className: cn(inputClass, "px-2 py-1")
										})]
									})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => removeBridalItem(cat.key, i),
										className: "text-destructive/60 hover:text-destructive hover:bg-destructive/10 p-1.5 rounded-lg transition shrink-0",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 14 })
									})]
								}, i)),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: () => addBridalItem(cat.key),
									className: "w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-primary hover:bg-primary/5 rounded-lg py-1.5 transition",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { size: 13 }),
										" إضافة ",
										cat.label
									]
								})
							]
						})]
					}, cat.key);
				}), calculateBridalGrandTotal() > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "paper-card bg-primary/5 border border-primary/20",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex justify-between text-base font-bold display",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "الإجمالي الكلي" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [calculateBridalGrandTotal().toLocaleString("ar-EG"), " ج.م"] })]
					})
				})]
			}),
			assistanceType === "medical_aid" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "paper-card",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between mb-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-sm font-semibold",
							children: "المساعدات العلاجية"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: addMedicalItem,
							className: "text-xs font-semibold text-primary hover:bg-primary/5 rounded-lg px-2 py-1 flex items-center gap-1 transition",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { size: 13 }), " إضافة"]
						})]
					}),
					medicalDetails.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted-foreground text-center py-4",
						children: "اضغط \"إضافة\" لبدء تسجيل المساعدات العلاجية"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "space-y-3",
						children: medicalDetails.map((item, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "bg-muted/20 rounded-lg p-3 space-y-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-[10px] font-semibold text-muted-foreground",
										children: ["عنصر ", i + 1]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										onClick: () => removeMedicalItem(i),
										className: "text-destructive/60 hover:text-destructive hover:bg-destructive/10 p-1 rounded transition text-xs flex items-center gap-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 12 }), " حذف"]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-2 gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										className: "text-[10px] text-muted-foreground block mb-0.5",
										children: "نوع الخدمة"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
										value: item.category,
										onChange: (e) => updateMedicalItem(i, "category", e.target.value),
										className: cn(selectClass, "px-2 py-1"),
										children: MEDICAL_CATEGORIES.map((cat) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: cat.value,
											children: cat.label
										}, cat.value))
									})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										className: "text-[10px] text-muted-foreground block mb-0.5",
										children: "اسم العلاج / الخدمة"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "text",
										value: item.service_name,
										onChange: (e) => updateMedicalItem(i, "service_name", e.target.value),
										className: cn(inputClass, "px-2 py-1"),
										placeholder: "اسم الخدمة"
									})] })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-3 gap-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
											className: "text-[10px] text-muted-foreground block mb-0.5",
											children: "السعر"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "number",
											value: item.total_price || "",
											onChange: (e) => updateMedicalItem(i, "total_price", Number(e.target.value) || 0),
											className: cn(inputClass, "px-2 py-1")
										})] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
											className: "text-[10px] text-muted-foreground block mb-0.5",
											children: "نسبة الكنيسة %"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "number",
											value: item.church_percentage || "",
											onChange: (e) => updateMedicalItem(i, "church_percentage", Number(e.target.value) || 0),
											className: cn(inputClass, "px-2 py-1"),
											min: "0",
											max: "100"
										})] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "text-end",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
												className: "text-[10px] text-muted-foreground block mb-0.5",
												children: "مبلغ الكنيسة"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "text-sm font-semibold text-success py-1 tabular-nums",
												children: [item.church_amount.toLocaleString("ar-EG"), " ج.م"]
											})]
										})
									]
								})
							]
						}, i))
					}),
					medicalDetails.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 pt-3 border-t border-border space-y-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex justify-between text-sm font-semibold",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "الإجمالي الكلي" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "tabular-nums",
								children: [calculateMedicalTotal().toLocaleString("ar-EG"), " ج.م"]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex justify-between text-sm font-semibold text-success",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "إجمالي ما صرفته الكنيسة" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "tabular-nums",
								children: [calculateMedicalChurchTotal().toLocaleString("ar-EG"), " ج.م"]
							})]
						})]
					})
				]
			}),
			assistanceType && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "paper-card",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
					className: "block text-xs font-semibold text-muted-foreground mb-1",
					children: "ملاحظات"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
					value: notes,
					onChange: (e) => setNotes(e.target.value),
					className: "w-full bg-paper rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring border border-border/60 resize-none",
					rows: 2,
					placeholder: "أي ملاحظات إضافية..."
				})]
			}),
			assistanceType && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex justify-end gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: onClose,
					className: "px-5 py-2 rounded-full bg-muted text-sm",
					children: "إلغاء"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: handleSubmit,
					disabled: busy,
					className: "chip-green px-6 py-2 text-sm disabled:opacity-60",
					children: busy ? "جارٍ الحفظ..." : "حفظ"
				})]
			})
		]
	});
}
function AssistanceHistory({ individualId, individualName, familyMembers, logs, onAddNew, onRefresh }) {
	const [deleting, setDeleting] = (0, import_react.useState)(null);
	const [expandedLog, setExpandedLog] = (0, import_react.useState)(null);
	const handleDelete = async (id) => {
		setDeleting(id);
		try {
			await deleteAssistanceLog({ data: { id } });
			toast.success("تم حذف المساعدة");
			onRefresh();
		} catch (err) {
			toast.error(err?.message ?? "فشل الحذف");
		} finally {
			setDeleting(null);
		}
	};
	const formatDate = (dateString) => {
		return new Date(dateString).toLocaleDateString("ar-EG", {
			year: "numeric",
			month: "long",
			day: "numeric"
		});
	};
	const getMemberName = (log) => {
		if (!log.family_member_id) return individualName;
		return familyMembers.find((m) => m.id === log.family_member_id)?.full_name || "فرد من الأسرة";
	};
	const getAssistanceTypeLabel = (type) => {
		return type === "bridal_prep" ? "تجهيز عرايس" : "مساعدة علاجية";
	};
	const getAssistanceIcon = (type) => {
		return type === "bridal_prep" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { size: 16 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stethoscope, { size: 16 });
	};
	const getAssistanceColor = (type) => {
		return type === "bridal_prep" ? "text-primary" : "text-success";
	};
	const calculateGrandTotal = () => {
		return logs.reduce((sum, log) => sum + Number(log.total_amount), 0);
	};
	const renderBridalDetails = (log) => {
		const details = log.bridal_prep_details || [];
		if (!details.length) return null;
		const categories = {
			appliances: {
				label: "الأجهزة المنزلية",
				items: []
			},
			furniture: {
				label: "الاثاث",
				items: []
			},
			clothing: {
				label: "الملابس",
				items: []
			},
			kitchenware: {
				label: "أدوات المطبخ",
				items: []
			},
			bedding: {
				label: "المفروشات",
				items: []
			}
		};
		details.forEach((item) => {
			if (categories[item.category]) categories[item.category].items.push(item);
		});
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-4 space-y-3 pt-4 border-t border-border",
			children: Object.entries(categories).map(([key, cat]) => {
				if (!cat.items.length) return null;
				const categoryTotal = cat.items.reduce((sum, item) => sum + Number(item.total_price), 0);
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "font-semibold text-sm mb-2",
						children: cat.label
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "space-y-1 text-xs",
						children: cat.items.map((item, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex justify-between text-muted-foreground",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
								item.item_type,
								" ",
								item.quantity > 1 ? `(${item.quantity})` : ""
							] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [Number(item.total_price).toLocaleString("ar-EG"), " ج.م"] })]
						}, i))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex justify-between font-semibold text-sm mt-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["إجمالي ", cat.label] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [categoryTotal.toLocaleString("ar-EG"), " ج.م"] })]
					})
				] }, key);
			})
		});
	};
	const renderMedicalDetails = (log) => {
		const details = log.medical_aid_details || [];
		if (!details.length) return null;
		const categoryLabels = {
			operation: "عملية",
			radiology: "إشاعة",
			lab_test: "تحليل",
			medication: "علاجات",
			checkup: "كشف",
			external_treatment: "علاج خارجي"
		};
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-4 pt-4 border-t border-border",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "space-y-2",
				children: details.map((item, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "text-xs",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex justify-between items-center",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-semibold",
								children: categoryLabels[item.category] || item.category
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "font-bold",
								children: [Number(item.total_price).toLocaleString("ar-EG"), " ج.م"]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-muted-foreground",
							children: item.service_name
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex justify-between text-success mt-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
								"تحملت الكنيسة (",
								item.church_percentage,
								"%):"
							] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [Number(item.church_amount).toLocaleString("ar-EG"), " ج.م"] })]
						})
					]
				}, i))
			})
		});
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "display text-xl text-ink",
					children: "سجل المساعدات"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted-foreground mt-1",
					children: logs.length === 0 ? "لا توجد مساعدات سابقة" : `${logs.length} مساعدة`
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: onAddNew,
					className: "chip-green px-4 py-2 flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { size: 16 }), " إضافة مساعدة جديدة"]
				})]
			}),
			logs.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "paper-card bg-primary/5 border-primary",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex justify-between text-lg font-bold display",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "الإجمالي الكلي لجميع المساعدات" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [calculateGrandTotal().toLocaleString("ar-EG"), " ج.م"] })]
				})
			}),
			logs.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "paper-card text-center py-12",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeartHandshake, {
						size: 48,
						className: "mx-auto text-muted-foreground/30 mb-4"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-muted-foreground",
						children: "لا توجد مساعدات مسجلة لهذا المخدوم"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted-foreground mt-2",
						children: "اضغط على \"إضافة مساعدة جديدة\" للبدء"
					})
				]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "space-y-3",
				children: logs.map((log) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "paper-card",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start justify-between gap-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex-1",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2 mb-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: `inline-flex items-center gap-1 text-sm font-semibold ${getAssistanceColor(log.assistance_type)}`,
										children: [getAssistanceIcon(log.assistance_type), getAssistanceTypeLabel(log.assistance_type)]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-xs text-muted-foreground flex items-center gap-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Calendar, { size: 12 }), formatDate(log.created_at)]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2 mb-2 text-sm",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, {
											size: 14,
											className: "text-muted-foreground"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-muted-foreground",
											children: "للمخدوم:"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-semibold",
											children: getMemberName(log)
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "text-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-muted-foreground",
											children: "الإجمالي:"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "font-bold display",
											children: [Number(log.total_amount).toLocaleString("ar-EG"), " ج.م"]
										})]
									}), log.notes && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-2 text-xs text-muted-foreground",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "font-semibold",
												children: "ملاحظات:"
											}),
											" ",
											log.notes
										]
									})]
								}),
								expandedLog === log.id && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [log.assistance_type === "bridal_prep" && renderBridalDetails(log), log.assistance_type === "medical_aid" && renderMedicalDetails(log)] })
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setExpandedLog(expandedLog === log.id ? null : log.id),
								className: "text-muted-foreground hover:text-foreground p-2 rounded transition",
								children: expandedLog === log.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronUp, { size: 16 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { size: 16 })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => handleDelete(log.id),
								disabled: deleting === log.id,
								className: "text-destructive hover:bg-destructive/10 p-2 rounded transition disabled:opacity-60",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 16 })
							})]
						})]
					})
				}, log.id))
			})
		]
	});
}
var Dialog = Dialog$1;
var DialogPortal = DialogPortal$1;
var DialogOverlay = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay$1, {
	ref,
	className: cn("fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0", className),
	...props
}));
DialogOverlay.displayName = DialogOverlay$1.displayName;
var DialogContent = import_react.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogPortal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent$1, {
	ref,
	className: cn("fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg", className),
	...props,
	children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogClose, {
		className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background cursor-pointer transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-4 w-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "sr-only",
			children: "Close"
		})]
	})]
})] }));
DialogContent.displayName = DialogContent$1.displayName;
var DialogHeader = ({ className, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	className: cn("flex flex-col space-y-1.5 text-center sm:text-left", className),
	...props
});
DialogHeader.displayName = "DialogHeader";
var DialogFooter = ({ className, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	className: cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className),
	...props
});
DialogFooter.displayName = "DialogFooter";
var DialogTitle = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle$1, {
	ref,
	className: cn("text-lg font-semibold leading-none tracking-tight", className),
	...props
}));
DialogTitle.displayName = DialogTitle$1.displayName;
var DialogDescription = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription$1, {
	ref,
	className: cn("text-sm text-muted-foreground", className),
	...props
}));
DialogDescription.displayName = DialogDescription$1.displayName;
function BarcodeDisplay({ value, label }) {
	const svgRef = (0, import_react.useRef)(null);
	const wrapperRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		if (svgRef.current && value) try {
			(0, import_JsBarcode.default)(svgRef.current, value, {
				format: "CODE128",
				width: 2,
				height: 80,
				displayValue: true,
				fontSize: 16,
				margin: 10,
				background: "transparent"
			});
		} catch {}
	}, [value]);
	async function handleDownload() {
		if (!wrapperRef.current) return;
		try {
			const dataUrl = await toPng(wrapperRef.current, {
				backgroundColor: "#ffffff",
				pixelRatio: 2
			});
			const link = document.createElement("a");
			link.download = `barcode-${value}.png`;
			link.href = dataUrl;
			link.click();
			toast.success("تم تحميل الباركود");
		} catch {
			toast.error("فشل تحميل الباركود");
		}
	}
	if (!value) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "paper-card",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between mb-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "display text-lg",
				children: label ?? "الباركود"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: handleDownload,
				className: "chip-dark px-4 py-2 text-sm flex items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { size: 16 }), " تحميل الباركود (PNG)"]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			ref: wrapperRef,
			className: "flex justify-center bg-white rounded-xl p-4",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", { ref: svgRef })
		})]
	});
}
var APPL = [
	["has_washing_machine", "غسالة"],
	["has_fridge", "ثلاجة"],
	["has_stove", "بوتاجاز"],
	["has_mattress", "مرتبة"],
	["has_computer", "كمبيوتر"],
	["has_sofa", "كنبة"],
	["has_dining", "سفرة"],
	["has_tv", "تلفزيون"],
	["has_wardrobe", "دولاب"]
];
var FIN_KEYS = [
	"church_monthly",
	"therapeutic_aid",
	"study_aid",
	"basic_salary",
	"extra_income",
	"electricity_gas_water",
	"phone_bill",
	"rent",
	"treatment_cost",
	"education_cost"
];
function IndividualPage() {
	const { id } = Route.useParams();
	const { highlightFamilyId } = Route.useSearch();
	const { can, role, isAdmin } = useAuth();
	const router = useRouter();
	const individualRestrictedRoles = [
		"SUPPLY_WAREHOUSE_MANAGER",
		"FURNITURE_WAREHOUSE_MANAGER",
		"PHARMACY_WAREHOUSE_MANAGER",
		"BLESSING_DISTRIBUTOR"
	];
	(0, import_react.useEffect)(() => {
		if (individualRestrictedRoles.includes(role)) {
			toast.error("غير مصرح لك بهذا الحقل");
			router.navigate({ to: "/" });
		}
	}, [role]);
	if (individualRestrictedRoles.includes(role)) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "text-center py-8 text-muted-foreground",
		children: "جاري التوجيه..."
	});
	const fetchOne = useServerFn(getIndividual);
	const saveOne = useServerFn(updateIndividual);
	const removeOne = useServerFn(deleteIndividual);
	const [data, setData] = (0, import_react.useState)(null);
	const [editing, setEditing] = (0, import_react.useState)(false);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [deleting, setDeleting] = (0, import_react.useState)(false);
	const [assistanceDialog, setAssistanceDialog] = (0, import_react.useState)(false);
	const [showAssistanceForm, setShowAssistanceForm] = (0, import_react.useState)(false);
	const [assistanceLogs, setAssistanceLogs] = (0, import_react.useState)([]);
	const fetchAssistanceLogs = useServerFn(getAssistanceLogs);
	async function reload() {
		setData(await fetchOne({ data: { id } }));
	}
	(0, import_react.useEffect)(() => {
		fetchOne({ data: { id } }).then(setData).catch(() => setData(null));
	}, [id]);
	async function loadAssistanceLogs() {
		setAssistanceLogs(await fetchAssistanceLogs({ data: { individual_id: id } }));
	}
	async function handleAssistanceDialogOpen(open) {
		setAssistanceDialog(open);
		if (open) {
			setShowAssistanceForm(false);
			await loadAssistanceLogs();
		}
	}
	if (!data) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-center text-muted-foreground",
		children: "جارٍ التحميل..."
	});
	const { individual: ind, family, financials: f, churchSupport } = data;
	if (editing && can("edit:beneficiary")) {
		const initialFamily = family.length ? family.map((m) => ({
			id: m.id,
			full_name: m.full_name,
			national_id: m.national_id ?? void 0,
			relation: m.relation ?? void 0,
			relation_custom: void 0,
			insurance_number: m.insurance_number ?? void 0,
			marital_status: m.marital_status ?? void 0,
			confession_father: m.confession_father ?? void 0,
			school_or_job: m.school_or_job ?? void 0,
			income: m.income != null ? Number(m.income) : void 0,
			notes: m.notes ?? void 0
		})) : [{ full_name: "" }];
		const initialFin = {};
		for (const k of FIN_KEYS) initialFin[k] = Number(f?.[k] || 0);
		const initialChurchSupport = churchSupport?.length ? churchSupport.map((cs) => ({
			id: cs.id,
			church_name: cs.church_name,
			amount: Number(cs.amount)
		})) : [];
		const applianceKeys = [
			"has_washing_machine",
			"has_fridge",
			"has_stove",
			"has_mattress",
			"has_computer",
			"has_sofa",
			"has_dining",
			"has_tv",
			"has_wardrobe"
		];
		const initialInd = {
			full_name: ind.full_name,
			nickname: ind.nickname,
			mother_name: ind.mother_name,
			gender: ind.gender,
			national_id: ind.national_id,
			birth_date: ind.birth_date,
			birth_governorate: ind.birth_governorate,
			calculated_age: ind.birth_date ? (() => {
				const parts = String(ind.birth_date).split("-");
				if (parts.length !== 3) return null;
				const y = parseInt(parts[0], 10), m = parseInt(parts[1], 10), d = parseInt(parts[2], 10);
				const birth = new Date(y, m - 1, d);
				const now = /* @__PURE__ */ new Date();
				let age = now.getFullYear() - birth.getFullYear();
				const md = now.getMonth() - birth.getMonth();
				if (md < 0 || md === 0 && now.getDate() < birth.getDate()) age--;
				return age;
			})() : null,
			job: ind.job,
			salary: ind.salary,
			phone: ind.phone,
			mobile: ind.mobile,
			landline: ind.landline,
			confession_father: ind.confession_father,
			saint_family: ind.saint_family,
			address: ind.address,
			household_count: ind.household_count,
			housing_type: ind.housing_type,
			rooms: ind.rooms,
			has_alt_address: ind.has_alt_address,
			alt_address: ind.alt_address,
			alt_governorate: ind.alt_governorate
		};
		for (const k of applianceKeys) initialInd[k] = ind[k];
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
				className: "display text-xl text-ink",
				children: ["تعديل ملف: ", ind.full_name]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IndividualForm, {
				initialInd,
				initialFamily,
				initialFin,
				initialChurchSupport,
				submitLabel: "حفظ التعديلات",
				busy,
				role,
				onCancel: () => setEditing(false),
				onSubmit: async (formData) => {
					if (!formData.ind.full_name) {
						toast.error("الاسم مطلوب");
						return;
					}
					setBusy(true);
					try {
						await saveOne({ data: {
							id,
							...buildIndividualPayload(formData)
						} });
						toast.success("تم حفظ التعديلات");
						setEditing(false);
						await reload();
					} catch (err) {
						toast.error(err?.message ?? "حدث خطأ");
					} finally {
						setBusy(false);
					}
				}
			})]
		});
	}
	async function handleDelete() {
		setDeleting(true);
		try {
			await removeOne({ data: { id } });
			toast.success("تم حذف الملف");
			router.navigate({
				to: "/search",
				search: { mode: "name" }
			});
		} catch (err) {
			toast.error(err?.message ?? "فشل الحذف");
			setDeleting(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/search",
					search: { mode: "name" },
					className: "text-sm flex items-center gap-1 text-muted-foreground hover:text-primary",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { size: 16 }), " رجوع للبحث"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialog, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogTrigger, {
							asChild: true,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								disabled: deleting,
								onClick: (e) => {
									if (!can("delete:beneficiary")) {
										e.preventDefault();
										toast.error("غير مصرح لك بهذا الحقل");
									}
								},
								className: "bg-destructive text-destructive-foreground px-5 py-2 text-sm rounded-full font-semibold hover:bg-destructive/90 transition disabled:opacity-60 flex items-center gap-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 14 }), " حذف"]
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogTitle, { children: "حذف ملف المخدوم" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogDescription, { children: [
							"سيتم حذف ملف ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: ind.full_name }),
							" نهائياً مع جميع بيانات الأسرة والمالية. لا يمكن التراجع عن هذا الإجراء."
						] })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogCancel, { children: "إلغاء" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogAction, {
							onClick: handleDelete,
							className: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
							children: deleting ? "جارٍ الحذف..." : "حذف نهائياً"
						})] })] })] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => {
								if (!can("view:sensitive")) {
									toast.error("غير مصرح لك بهذا الحقل");
									return;
								}
								handleAssistanceDialogOpen(true);
							},
							className: "bg-primary text-primary-foreground px-5 py-2 text-sm rounded-full font-semibold hover:bg-primary/90 transition flex items-center gap-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeartHandshake, {
								size: 14,
								className: "inline-block ms-1"
							}), " مساعدات"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => window.print(),
							className: "bg-muted text-muted-foreground px-5 py-2 text-sm rounded-full font-semibold hover:bg-muted/80 transition flex items-center gap-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Printer, {
								size: 14,
								className: "inline-block ms-1"
							}), " طباعة الملف"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => {
								if (!can("edit:beneficiary")) {
									toast.error("غير مصرح لك بهذا الحقل");
									return;
								}
								setEditing(true);
							},
							className: "chip-green px-5 py-2 text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, {
								size: 14,
								className: "inline-block ms-1"
							}), " تعديل"]
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "paper-card relative",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "absolute -top-4 left-1/2 -translate-x-1/2 bg-paper-2 px-8 py-2 rounded-full shadow-soft display text-2xl text-muted-foreground/80",
						children: ind.full_name
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 text-sm",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, {
								label: "الاسم",
								v: ind.full_name
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, {
								label: "اسم الشهرة",
								v: ind.nickname
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, {
								label: "اسم الأم",
								v: ind.mother_name
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, {
								label: "الرقم القومي",
								v: ind.national_id
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, {
								label: "تاريخ الميلاد",
								v: ind.birth_date
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, {
								label: "الوظيفة",
								v: ind.job
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, {
								label: "الراتب",
								v: ind.salary
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, {
								label: "رقم التليفون",
								v: ind.phone
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, {
								label: "أب الاعتراف",
								v: ind.confession_father
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, {
								label: "أسرة القديس",
								v: ind.saint_family
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, {
								label: "العنوان بالتفصيل",
								v: ind.address,
								className: "md:col-span-2"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, {
								label: "عدد الأفراد",
								v: ind.household_count
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, {
								label: "نوع السكن",
								v: ind.housing_type
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, {
								label: "الغرف",
								v: ind.rooms
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, {
								label: "موبايل",
								v: ind.mobile
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, {
								label: "تلفون",
								v: ind.landline
							})
						]
					}),
					ind.has_alt_address && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 pt-4 border-t border-border",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-sm font-semibold text-muted-foreground mb-2",
							children: "سكن آخر"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-1 md:grid-cols-2 gap-4 text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, {
								label: "عنوان السكن الآخر",
								v: ind.alt_address,
								className: "md:col-span-2"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, {
								label: "محافظة السكن الآخر",
								v: ind.alt_governorate
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid grid-cols-3 md:grid-cols-9 gap-2 mt-5",
						children: APPL.map(([k, l]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: `text-center text-xs px-2 py-2 rounded-lg border ${ind[k] ? "bg-success/15 border-success/40 text-success" : "bg-paper border-border text-muted-foreground"}`,
							children: l
						}, k))
					})
				]
			}),
			ind.national_id && (role === "SUPER_ADMIN" || role === "ADMIN") && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BarcodeDisplay, {
				value: ind.national_id,
				label: "باركود الرقم القومي"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "paper-card",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "display text-lg mb-3",
						children: "أفراد الأسرة"
					}),
					highlightFamilyId && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mb-4 rounded-xl bg-emerald-100 border border-emerald-200 p-4 text-sm text-emerald-900",
						children: "تم تمييز فرد الأسرة المطابق باللون الأخضر داخل القائمة أدناه."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "overflow-x-auto",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
							className: "w-full text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
								className: "text-muted-foreground",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: [
									"م",
									"الاسم",
									"الرقم القومي",
									"صلة القرابة",
									"الحالة الاجتماعية",
									"أب الاعتراف",
									"الوظيفة/الدراسة",
									"الدخل",
									"ملاحظات"
								].map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-2 py-2 text-start border-b border-border font-semibold",
									children: h
								}, h)) })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", { children: [family.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								colSpan: 9,
								className: "text-center py-6 text-muted-foreground",
								children: "لا يوجد أفراد مسجلون"
							}) }), family.map((m, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: `border-b border-border/60 ${m.id === highlightFamilyId ? "bg-emerald-100 ring-1 ring-emerald-200" : ""}`,
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-2 py-2",
										children: i + 1
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-2 py-2",
										children: m.full_name
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-2 py-2",
										dir: "ltr",
										children: m.national_id || "—"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-2 py-2",
										children: m.relation || "—"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-2 py-2",
										children: m.marital_status || "—"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-2 py-2",
										children: m.confession_father || "—"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-2 py-2",
										children: m.school_or_job || "—"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-2 py-2 tabular-nums",
										children: m.income ?? "—"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-2 py-2 text-muted-foreground",
										children: m.notes || ""
									})
								]
							}, m.id))] })]
						})
					})
				]
			}),
			isAdmin && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-1 md:grid-cols-2 gap-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "paper-card",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "display text-lg mb-3 text-success",
							children: "الإيرادات"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FinRow, {
							label: "شهريات كنايس",
							v: f?.church_monthly
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FinRow, {
							label: "مرتب أساسي",
							v: f?.basic_salary
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FinRow, {
							label: "مصدر إضافي للدخل",
							v: f?.extra_income
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FinRow, {
							label: "مساعدات علاجية",
							v: f?.therapeutic_aid
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FinRow, {
							label: "مساعدات خلال دراسة",
							v: f?.study_aid
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Total, {
							label: "الإجمالي",
							v: sumOf(f, [
								"church_monthly",
								"basic_salary",
								"extra_income",
								"therapeutic_aid",
								"study_aid"
							])
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "paper-card",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "display text-lg mb-3 text-destructive",
							children: "المصروفات"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FinRow, {
							label: "كهرباء – غاز – مياه",
							v: f?.electricity_gas_water
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FinRow, {
							label: "تليفون",
							v: f?.phone_bill
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FinRow, {
							label: "إيجار",
							v: f?.rent
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FinRow, {
							label: "علاج",
							v: f?.treatment_cost
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FinRow, {
							label: "دراسة",
							v: f?.education_cost
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Total, {
							label: "الإجمالي",
							v: sumOf(f, [
								"electricity_gas_water",
								"phone_bill",
								"rent",
								"treatment_cost",
								"education_cost"
							])
						})
					]
				})]
			}), churchSupport && churchSupport.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "paper-card",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "display text-lg mb-3",
					children: "شهريات كنائس أخرى"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "overflow-x-auto",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
							className: "text-muted-foreground",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: [
								"م",
								"اسم الكنيسة",
								"المبلغ"
							].map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-2 py-2 text-start border-b border-border font-semibold",
								children: h
							}, h)) })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", { children: [churchSupport.map((cs, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "border-b border-border/60",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-2 py-2",
									children: i + 1
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-2 py-2",
									children: cs.church_name
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
									className: "px-2 py-2 tabular-nums",
									children: [Number(cs.amount).toLocaleString("ar-EG"), " ج.م"]
								})
							]
						}, i)), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "border-t-2 border-primary font-bold display",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								colSpan: 2,
								className: "px-2 py-2",
								children: "الإجمالي"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
								className: "px-2 py-2 tabular-nums",
								children: [churchSupport.reduce((sum, cs) => sum + Number(cs.amount), 0).toLocaleString("ar-EG"), " ج.م"]
							})]
						})] })]
					})
				})]
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: assistanceDialog,
				onOpenChange: handleAssistanceDialogOpen,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
					className: "max-w-4xl max-h-[90vh] overflow-y-auto",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, { children: ["مساعدات - ", ind.full_name] }) }), !showAssistanceForm ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AssistanceHistory, {
						individualId: id,
						individualName: ind.full_name,
						familyMembers: [{
							id: ind.id,
							full_name: ind.full_name
						}, ...family.map((f) => ({
							id: f.id,
							full_name: f.full_name
						}))],
						logs: assistanceLogs,
						onAddNew: () => setShowAssistanceForm(true),
						onRefresh: loadAssistanceLogs
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AssistanceForm, {
						individualId: id,
						familyMembers: [{
							id: ind.id,
							full_name: ind.full_name
						}, ...family.map((f) => ({
							id: f.id,
							full_name: f.full_name
						}))],
						onClose: () => {
							setShowAssistanceForm(false);
						},
						onSubmit: async (formData) => {
							await createAssistanceLog({ data: {
								individual_id: id,
								...formData
							} });
							await loadAssistanceLogs();
							setShowAssistanceForm(false);
						}
					})]
				})
			})
		]
	});
}
function sumOf(f, keys) {
	if (!f) return 0;
	return keys.reduce((s, k) => s + Number(f[k] || 0), 0);
}
function Info({ label, v, className = "" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "text-[11px] text-muted-foreground",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "font-semibold text-foreground",
			children: v ?? "—"
		})]
	});
}
function FinRow({ label, v }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex justify-between border-b border-border/60 py-2 text-sm",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: label }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "tabular-nums",
			children: (Number(v) || 0).toLocaleString("ar-EG")
		})]
	});
}
function Total({ label, v }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex justify-between mt-3 pt-3 border-t-2 border-primary font-bold display",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: label }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "tabular-nums",
			children: v.toLocaleString("ar-EG")
		})]
	});
}
//#endregion
export { IndividualPage as component };
