import { i as __toESM } from "../_runtime.mjs";
import { _ as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { F as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { C as getClothesRequests, G as updateClothesRequest, S as getChildrenByFamily, a as createClothesRequest, d as deleteClothesRequest, et as useServerFn } from "./church.functions-CojeWWgP.mjs";
import { i as getVisibleSaintFamilyValues } from "./permissions-BPF-3_4x.mjs";
import { t as useAuth } from "./use-auth-DmMFHth-.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { _ as Pencil, h as Plus, s as Trash2, t as X, w as Eye } from "../_libs/lucide-react.mjs";
import { a as AlertDialogDescription, c as AlertDialogTitle, i as AlertDialogContent, l as AlertDialogTrigger, n as AlertDialogAction, o as AlertDialogFooter, r as AlertDialogCancel, s as AlertDialogHeader, t as AlertDialog } from "./alert-dialog-DEtovhbm.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/clothes-BlOEFMfg.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var SAINT_FAMILIES = [
	{
		value: "مرقس",
		label: "أسرة القديس مرقس"
	},
	{
		value: "يوحنا",
		label: "أسرة القديس يوحنا"
	},
	{
		value: "لوقا",
		label: "أسرة القديس لوقا"
	},
	{
		value: "متى",
		label: "أسرة القديس متى"
	},
	{
		value: "أسر مستترة",
		label: "الأسر المستترة"
	}
];
var REQUEST_CATEGORIES = [{
	value: "holiday",
	label: "لبس عيد"
}, {
	value: "school",
	label: "لبس مدرسة"
}];
var T_SHIRT_SIZES = [
	"XS",
	"S",
	"M",
	"L",
	"XL",
	"XXL",
	"3XL",
	"24",
	"26",
	"28",
	"30",
	"32",
	"34",
	"36",
	"38",
	"40"
];
var PANTS_SIZES = [
	"24",
	"26",
	"28",
	"30",
	"32",
	"34",
	"36",
	"38",
	"40",
	"42",
	"44",
	"XS",
	"S",
	"M",
	"L",
	"XL",
	"XXL"
];
var SHOE_SIZES = Array.from({ length: 27 }, (_, i) => String(i + 20));
function ClothesPage() {
	const { can, role } = useAuth();
	const router = useRouter();
	const clothesRestricted = [
		"SUPPLY_WAREHOUSE_MANAGER",
		"FURNITURE_WAREHOUSE_MANAGER",
		"PHARMACY_WAREHOUSE_MANAGER",
		"BRIDE_AND_MEDICAL_AIDS_MANAGER",
		"BLESSING_DISTRIBUTOR"
	];
	(0, import_react.useEffect)(() => {
		if (clothesRestricted.includes(role)) {
			toast.error("غير مصرح لك بهذا الحقل");
			router.navigate({ to: "/" });
		}
	}, [role]);
	if (clothesRestricted.includes(role)) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "text-center py-8 text-muted-foreground",
		children: "جاري التوجيه..."
	});
	const fetchRequests = useServerFn(getClothesRequests);
	const createReq = useServerFn(createClothesRequest);
	const updateReq = useServerFn(updateClothesRequest);
	const deleteReq = useServerFn(deleteClothesRequest);
	const fetchChildren = useServerFn(getChildrenByFamily);
	const visibleFamilies = SAINT_FAMILIES.filter((f) => getVisibleSaintFamilyValues(role).includes(f.value));
	const familyLocked = visibleFamilies.length === 1;
	const [requests, setRequests] = (0, import_react.useState)([]);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [filterFamily, setFilterFamily] = (0, import_react.useState)("");
	const [filterCategory, setFilterCategory] = (0, import_react.useState)("");
	const [searchQuery, setSearchQuery] = (0, import_react.useState)("");
	const [modalOpen, setModalOpen] = (0, import_react.useState)(false);
	const [modalMode, setModalMode] = (0, import_react.useState)("add");
	const [editingId, setEditingId] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [formFamily, setFormFamily] = (0, import_react.useState)("");
	const [formChild, setFormChild] = (0, import_react.useState)("");
	const [formCategory, setFormCategory] = (0, import_react.useState)("");
	const [formSchoolName, setFormSchoolName] = (0, import_react.useState)("");
	const [formTShirtSize, setFormTShirtSize] = (0, import_react.useState)("");
	const [formPantsSize, setFormPantsSize] = (0, import_react.useState)("");
	const [formShoeSize, setFormShoeSize] = (0, import_react.useState)("");
	const [formNotes, setFormNotes] = (0, import_react.useState)("");
	const [children, setChildren] = (0, import_react.useState)([]);
	const [childrenLoading, setChildrenLoading] = (0, import_react.useState)(false);
	const reload = (0, import_react.useCallback)(async () => {
		setLoading(true);
		try {
			setRequests(await fetchRequests());
		} catch {
			toast.error("خطأ في جلب طلبات الملابس");
		} finally {
			setLoading(false);
		}
	}, [fetchRequests]);
	(0, import_react.useEffect)(() => {
		reload();
	}, [reload]);
	async function handleFamilyChange(family) {
		setFormFamily(family);
		setFormChild("");
		if (!family) {
			setChildren([]);
			return;
		}
		setChildrenLoading(true);
		try {
			setChildren(await fetchChildren({ data: { saint_family: family } }));
		} catch {
			setChildren([]);
		} finally {
			setChildrenLoading(false);
		}
	}
	function openAddModal() {
		setModalMode("add");
		setEditingId(null);
		setFormChild("");
		setFormCategory("");
		setFormSchoolName("");
		setFormTShirtSize("");
		setFormPantsSize("");
		setFormShoeSize("");
		setFormNotes("");
		setChildren([]);
		setModalOpen(true);
		if (familyLocked) handleFamilyChange(visibleFamilies[0].value);
		else setFormFamily("");
	}
	function openEditModal(req) {
		setModalMode("edit");
		setEditingId(req.id);
		setFormFamily(req.saint_family);
		setFormCategory(req.request_category);
		setFormSchoolName(req.school_name ?? "");
		setFormTShirtSize(req.t_shirt_size ?? "");
		setFormPantsSize(req.pants_size ?? "");
		setFormShoeSize(req.shoe_size ?? "");
		setFormNotes(req.notes ?? "");
		handleFamilyChange(req.saint_family).then(() => {
			setFormChild(req.family_member_id ?? req.individual_id);
		});
		setModalOpen(true);
	}
	function openViewModal(req) {
		setModalMode("view");
		setEditingId(req.id);
		setFormFamily(req.saint_family);
		setFormCategory(req.request_category);
		setFormSchoolName(req.school_name ?? "");
		setFormTShirtSize(req.t_shirt_size ?? "");
		setFormPantsSize(req.pants_size ?? "");
		setFormShoeSize(req.shoe_size ?? "");
		setFormNotes(req.notes ?? "");
		setFormChild(req.family_member_id ?? req.individual_id);
		setChildren([]);
		setModalOpen(true);
	}
	async function handleSubmit() {
		if (!formFamily) return toast.error("يرجى اختيار الأسرة");
		if (!formCategory) return toast.error("يرجى اختيار نوع الطلب");
		if (!formChild) return toast.error("يرجى اختيار الابن/الابنة");
		setBusy(true);
		try {
			const payload = {
				saint_family: formFamily,
				request_category: formCategory,
				school_name: formCategory === "school" ? formSchoolName : null,
				t_shirt_size: formTShirtSize || null,
				pants_size: formPantsSize || null,
				shoe_size: formShoeSize || null,
				notes: formNotes || null,
				individual_id: children.find((c) => c.id === formChild)?.individual_id ?? "",
				family_member_id: formChild
			};
			if (modalMode === "add") {
				await createReq({ data: payload });
				toast.success("تم حفظ طلب الملابس");
			} else if (modalMode === "edit" && editingId) {
				await updateReq({ data: {
					...payload,
					id: editingId
				} });
				toast.success("تم تحديث طلب الملابس");
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
			await deleteReq({ data: { id } });
			toast.success("تم حذف طلب الملابس");
			await reload();
		} catch (err) {
			toast.error(err?.message ?? "فشل الحذف");
		}
	}
	const filtered = requests.filter((r) => {
		if (filterFamily && r.saint_family !== filterFamily) return false;
		if (filterCategory && r.request_category !== filterCategory) return false;
		if (searchQuery) {
			const q = searchQuery.toLowerCase();
			const name = r.individuals?.full_name?.toLowerCase() ?? "";
			const childName = r.family_members?.full_name?.toLowerCase() ?? "";
			if (!name.includes(q) && !childName.includes(q)) return false;
		}
		return true;
	});
	const categoryLabel = (cat) => cat === "holiday" ? "لبس عيد" : "لبس مدرسة";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between gap-3 flex-wrap",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "display text-2xl text-ink",
					children: "ملابس الأعياد والمدارس"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: openAddModal,
					className: "chip-green px-5 py-2 text-sm flex items-center gap-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { size: 16 }), " إضافة طلب ملابس"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "paper-card",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-1 md:grid-cols-4 gap-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "block",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs font-semibold text-muted-foreground",
								children: "بحث بالاسم"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								value: searchQuery,
								onChange: (e) => setSearchQuery(e.target.value),
								placeholder: "اسم المخدوم أو الابن...",
								className: "mt-1 w-full rounded-xl bg-paper border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
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
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "block",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs font-semibold text-muted-foreground",
								children: "نوع الطلب"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								value: filterCategory,
								onChange: (e) => setFilterCategory(e.target.value),
								className: "mt-1 w-full rounded-xl bg-paper border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "",
									children: "الكل"
								}), REQUEST_CATEGORIES.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: c.value,
									children: c.label
								}, c.value))]
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
					children: "لا توجد طلبات مسجلة"
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
								"الابن/الابنة",
								"صلة القرابة",
								"نوع الطلب",
								"اسم المدرسة",
								"تي شيرت",
								"بنطلون",
								"كوتشي",
								"ملاحظات",
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
									children: r.saint_family
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-2 py-2",
									children: r.individuals?.full_name ?? "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-2 py-2",
									children: r.family_members?.full_name ?? "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-2 py-2",
									children: r.family_members?.relation ?? "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-2 py-2",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: `px-2 py-1 rounded-full text-xs font-semibold ${r.request_category === "holiday" ? "bg-sky/20 text-sky" : "bg-teal/20 text-teal"}`,
										children: categoryLabel(r.request_category)
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-2 py-2",
									children: r.school_name ?? "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-2 py-2",
									children: r.t_shirt_size ?? "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-2 py-2",
									children: r.pants_size ?? "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-2 py-2",
									children: r.shoe_size ?? "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-2 py-2 text-muted-foreground max-w-[120px] truncate",
									children: r.notes ?? ""
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-2 py-2",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											onClick: () => openViewModal(r),
											className: "p-1 rounded hover:bg-primary/10 text-muted-foreground",
											title: "عرض",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { size: 14 })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											onClick: () => openEditModal(r),
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
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogTitle, { children: "حذف طلب الملابس" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogDescription, { children: "سيتم حذف هذا الطلب نهائياً. لا يمكن التراجع عن هذا الإجراء." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogCancel, { children: "إلغاء" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogAction, {
											onClick: () => handleDelete(r.id),
											className: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
											children: "حذف"
										})] })] })] })] })]
									})
								})
							]
						}, r.id)) })]
					})
				})
			}),
			modalOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 bg-ink/40 backdrop-blur-sm z-50 flex items-center justify-center p-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "paper-card w-full max-w-2xl max-h-[90vh] overflow-y-auto",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between mb-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "display text-xl",
								children: modalMode === "add" ? "إضافة طلب ملابس" : modalMode === "edit" ? "تعديل طلب ملابس" : "عرض طلب الملابس"
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
										children: ["الأسرة ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-destructive",
											children: "*"
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
										value: formFamily,
										onChange: (e) => handleFamilyChange(e.target.value),
										disabled: modalMode === "view" || familyLocked,
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
										children: ["الابن/الابنة ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-destructive",
											children: "*"
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
										value: formChild,
										onChange: (e) => setFormChild(e.target.value),
										disabled: modalMode === "view" || !formFamily,
										className: "mt-1 w-full rounded-xl bg-paper border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "",
											children: childrenLoading ? "جارٍ التحميل..." : !formFamily ? "اختر الأسرة أولاً" : "اختر الابن/الابنة..."
										}), children.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
											value: c.id,
											children: [
												c.full_name,
												" (",
												c.parent_name,
												" - ",
												c.relation,
												")"
											]
										}, c.id))]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-sm font-semibold text-muted-foreground",
									children: ["نوع الطلب ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-destructive",
										children: "*"
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-2 flex gap-4",
									children: REQUEST_CATEGORIES.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: `flex items-center gap-2 px-4 py-2 rounded-xl border cursor-pointer transition ${formCategory === c.value ? "bg-primary/10 border-primary text-primary" : "bg-paper border-border hover:bg-primary/5"} ${modalMode === "view" ? "pointer-events-none opacity-70" : ""}`,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "radio",
											name: "category",
											value: c.value,
											checked: formCategory === c.value,
											onChange: (e) => setFormCategory(e.target.value),
											disabled: modalMode === "view",
											className: "accent-[color:var(--color-primary)]"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-sm font-semibold",
											children: c.label
										})]
									}, c.value))
								})] }),
								formCategory === "school" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "block",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-sm font-semibold text-muted-foreground",
										children: "اسم المدرسة"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										value: formSchoolName,
										onChange: (e) => setFormSchoolName(e.target.value),
										disabled: modalMode === "view",
										placeholder: "أدخل اسم المدرسة",
										className: "mt-1 w-full rounded-xl bg-paper border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-1 md:grid-cols-3 gap-4",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
											className: "block",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-sm font-semibold text-muted-foreground",
												children: "مقاس التي شيرت"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
												value: formTShirtSize,
												onChange: (e) => setFormTShirtSize(e.target.value),
												disabled: modalMode === "view",
												className: "mt-1 w-full rounded-xl bg-paper border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: "",
													children: "اختر المقاس..."
												}), T_SHIRT_SIZES.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: s,
													children: s
												}, s))]
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
											className: "block",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-sm font-semibold text-muted-foreground",
												children: "مقاس البنطلون"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
												value: formPantsSize,
												onChange: (e) => setFormPantsSize(e.target.value),
												disabled: modalMode === "view",
												className: "mt-1 w-full rounded-xl bg-paper border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: "",
													children: "اختر المقاس..."
												}), PANTS_SIZES.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: s,
													children: s
												}, s))]
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
											className: "block",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-sm font-semibold text-muted-foreground",
												children: "مقاس الكوتشي"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
												value: formShoeSize,
												onChange: (e) => setFormShoeSize(e.target.value),
												disabled: modalMode === "view",
												className: "mt-1 w-full rounded-xl bg-paper border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: "",
													children: "اختر المقاس..."
												}), SHOE_SIZES.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: s,
													children: s
												}, s))]
											})]
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "block",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-sm font-semibold text-muted-foreground",
										children: "ملاحظات"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
										value: formNotes,
										onChange: (e) => setFormNotes(e.target.value),
										disabled: modalMode === "view",
										rows: 2,
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
								children: modalMode === "view" ? "إغلاق" : "إلغاء"
							}), modalMode !== "view" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: handleSubmit,
								disabled: busy,
								className: "chip-green px-6 py-2 text-sm disabled:opacity-60",
								children: busy ? "جارٍ الحفظ..." : modalMode === "add" ? "حفظ" : "تحديث"
							})]
						})
					]
				})
			})
		]
	});
}
//#endregion
export { ClothesPage as component };
