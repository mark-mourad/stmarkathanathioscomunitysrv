import { i as __toESM } from "../_runtime.mjs";
import { _ as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { F as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { $ as updateSupplyItem, M as getInventory, Y as updateInventory, _ as deleteSupplyItem, et as useServerFn, r as addSupplyItem, z as getSuppliesInventory } from "./church.functions-CojeWWgP.mjs";
import { t as useAuth } from "./use-auth-DmMFHth-.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { _ as Pencil, h as Plus, n as Wheat, p as Save, s as Trash2, t as X, v as Package } from "../_libs/lucide-react.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { a as AlertDialogDescription, c as AlertDialogTitle, i as AlertDialogContent, l as AlertDialogTrigger, n as AlertDialogAction, o as AlertDialogFooter, r as AlertDialogCancel, s as AlertDialogHeader, t as AlertDialog } from "./alert-dialog-DEtovhbm.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/inventory-C6MczK41.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var SUPPLIES_CATEGORIES = [
	{
		value: "بروتين",
		label: "بروتين"
	},
	{
		value: "نشويات",
		label: "نشويات"
	},
	{
		value: "دهون",
		label: "دهون"
	},
	{
		value: "أخرى",
		label: "أخرى"
	}
];
var SUPPLIES_ITEMS = {
	بروتين: [
		"فراخ",
		"سمك",
		"لحوم"
	],
	نشويات: [
		"أرز",
		"مكرونة",
		"شعرية",
		"عدس",
		"لسان عصفور",
		"فاصوليا بيضاء"
	],
	دهون: ["زيت", "سمن"],
	أخرى: []
};
var WEIGHT_OPTIONS = [
	"250 جرام",
	"500 جرام",
	"800 جرام",
	"1 كيلو",
	"2 كيلو",
	"5 كيلو",
	"10 كيلو",
	"20 كيلو",
	"25 كيلو"
];
function InventoryPage() {
	const { can, role, loading: authLoading } = useAuth();
	const canManageInventory = can("manage:inventory");
	can("manage:supplies");
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		if (authLoading) return;
		if (![
			"SUPER_ADMIN",
			"ADMIN",
			"SUPPLY_WAREHOUSE_MANAGER"
		].includes(role)) {
			toast.error("غير مصرح لك بهذا الحقل");
			router.navigate({ to: "/" });
		}
	}, [role, authLoading]);
	if (authLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "max-w-7xl mx-auto",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "paper-card",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-center py-8 text-muted-foreground",
				children: "جاري التحميل..."
			})
		})
	});
	if (![
		"SUPER_ADMIN",
		"ADMIN",
		"SUPPLY_WAREHOUSE_MANAGER"
	].includes(role)) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "text-center py-8 text-muted-foreground",
		children: "جاري التوجيه..."
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "max-w-7xl mx-auto space-y-6",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
			className: "display text-2xl flex items-center gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { size: 28 }), "المخزن"]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid grid-cols-1 lg:grid-cols-2 gap-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "order-1",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BlessingSection, { canManageInventory })
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "order-2",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SuppliesSection, {})
			})]
		})]
	});
}
function BlessingSection({ canManageInventory }) {
	const queryClient = useQueryClient();
	const fetchInventory = useServerFn(getInventory);
	const saveInventory = useServerFn(updateInventory);
	const [weeklyTotal, setWeeklyTotal] = (0, import_react.useState)(0);
	const [details, setDetails] = (0, import_react.useState)("");
	const { data: inventory, isLoading, isError, error, refetch } = useQuery({
		queryKey: ["blessing-batch"],
		queryFn: () => fetchInventory(),
		staleTime: 0,
		refetchOnMount: "always"
	});
	(0, import_react.useEffect)(() => {
		if (inventory) {
			setWeeklyTotal(inventory.weekly_total);
			setDetails(inventory.details || "");
		} else {
			setWeeklyTotal(0);
			setDetails("");
		}
	}, [inventory]);
	const saveMutation = useMutation({
		mutationFn: (vars) => saveInventory({ data: vars }),
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: ["blessing-batch"],
				refetchType: "all"
			});
			toast.success("تم حفظ البركة بنجاح");
		},
		onError: (err) => {
			toast.error(err instanceof Error ? err.message : "خطأ في الحفظ");
		}
	});
	const handleSave = () => saveMutation.mutate({
		weekly_total: weeklyTotal,
		details: details || null
	});
	const errorMessage = isError ? error instanceof Error ? error.message : "خطأ في تحميل المخزون" : null;
	if (isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "paper-card",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "text-center py-8 text-muted-foreground",
			children: "جاري التحميل..."
		})
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "paper-card",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
				className: "display text-xl mb-6 flex items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wheat, { size: 24 }), "البركة"]
			}),
			errorMessage && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "bg-destructive/10 border border-destructive/20 rounded-xl p-4 mb-6 text-center",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-destructive mb-3",
					children: errorMessage
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => refetch(),
					className: "chip-dark px-6 py-2",
					children: "إعادة المحاولة"
				})]
			}),
			!inventory && !errorMessage && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "bg-primary/10 border border-primary/20 rounded-xl p-4 mb-6 text-center",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-primary",
					children: "لم يتم إعداد البركة بعد. يرجى إدخال البيانات أدناه."
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						className: "block text-sm font-semibold text-muted-foreground mb-2",
						children: "توتال البركة"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "number",
						value: weeklyTotal,
						onChange: (e) => setWeeklyTotal(Number(e.target.value)),
						min: "0",
						disabled: !canManageInventory,
						className: "w-full rounded-xl bg-paper px-4 py-3 outline-none focus:ring-2 focus:ring-ring text-2xl font-bold tabular-nums disabled:opacity-60",
						placeholder: "أدخل العدد"
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						className: "block text-sm font-semibold text-muted-foreground mb-2",
						children: "تفاصيل ومكونات البركة"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
						value: details,
						onChange: (e) => setDetails(e.target.value),
						rows: 5,
						disabled: !canManageInventory,
						className: "w-full rounded-xl bg-paper px-4 py-3 outline-none focus:ring-2 focus:ring-ring resize-none disabled:opacity-60",
						placeholder: "أدخل التفاصيل والمكونات..."
					})] }),
					inventory && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "bg-paper-2 rounded-xl p-3 text-xs text-muted-foreground",
						children: ["آخر تحديث: ", new Date(inventory.updated_at).toLocaleString("ar-EG")]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex justify-end",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: handleSave,
							disabled: saveMutation.isPending || !canManageInventory,
							className: "chip-green px-8 py-3 flex items-center gap-2 text-lg disabled:opacity-60",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, { size: 20 }), saveMutation.isPending ? "جاري الحفظ..." : "حفظ"]
						})
					})
				]
			})
		]
	});
}
function SuppliesSection() {
	const fetchItems = useServerFn(getSuppliesInventory);
	const addItem = useServerFn(addSupplyItem);
	const updateItem = useServerFn(updateSupplyItem);
	const deleteItem = useServerFn(deleteSupplyItem);
	const [items, setItems] = (0, import_react.useState)([]);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [modalOpen, setModalOpen] = (0, import_react.useState)(false);
	const [modalMode, setModalMode] = (0, import_react.useState)("add");
	const [editingId, setEditingId] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [formCategory, setFormCategory] = (0, import_react.useState)("");
	const [formItem, setFormItem] = (0, import_react.useState)("");
	const [formQuantity, setFormQuantity] = (0, import_react.useState)(1);
	const [formWeight, setFormWeight] = (0, import_react.useState)("");
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
		setFormCategory("");
		setFormItem("");
		setFormQuantity(1);
		setFormWeight("");
		setFormDetails("");
		setModalOpen(true);
	}
	function openEdit(item) {
		setModalMode("edit");
		setEditingId(item.id);
		setFormCategory(item.category);
		setFormItem(item.item_name);
		setFormQuantity(item.quantity);
		setFormWeight(item.weight ?? "");
		setFormDetails(item.details ?? "");
		setModalOpen(true);
	}
	async function handleSubmit() {
		if (!formCategory) return toast.error("يرجى اختيار التصنيف");
		if (!formItem) return toast.error("يرجى اختيار اسم الصنف");
		if (formQuantity < 0) return toast.error("العدد لا يمكن أن يكون سالباً");
		setBusy(true);
		try {
			if (modalMode === "add") {
				await addItem({ data: {
					category: formCategory,
					item_name: formItem,
					quantity: formQuantity,
					weight: formWeight || null,
					details: formDetails || null
				} });
				toast.success("تم إضافة الصنف بنجاح");
			} else if (editingId) {
				await updateItem({ data: {
					id: editingId,
					category: formCategory,
					item_name: formItem,
					quantity: formQuantity,
					weight: formWeight || null,
					details: formDetails || null
				} });
				toast.success("تم تحديث الصنف بنجاح");
			}
			setModalOpen(false);
			await reload();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "حدث خطأ");
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
			toast.error(err instanceof Error ? err.message : "فشل الحذف");
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "paper-card",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between mb-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
					className: "display text-xl flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { size: 24 }), "مخزن التموين"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: openAdd,
					className: "chip-green px-5 py-2 text-sm flex items-center gap-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { size: 16 }), " إضافة صنف"]
				})]
			}),
			loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-center text-muted-foreground py-8",
				children: "جارٍ التحميل..."
			}) : items.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "text-center py-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-muted-foreground mb-3",
					children: "لا توجد أصناف في مخزن التموين"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: openAdd,
					className: "chip-green px-5 py-2 text-sm flex items-center gap-1 mx-auto",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { size: 16 }), " إضافة أول صنف"]
				})]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "overflow-x-auto",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full text-sm border-collapse",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
						className: "text-muted-foreground",
						children: [
							"م",
							"التصنيف",
							"اسم الصنف",
							"العدد",
							"الوزن",
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
									className: `px-2 py-1 rounded-full text-xs font-bold ${item.category === "بروتين" ? "bg-red-100 text-red-700" : item.category === "نشويات" ? "bg-amber-100 text-amber-700" : item.category === "دهون" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-700"}`,
									children: item.category
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-2 py-2 font-semibold",
								children: item.item_name
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
								children: item.weight ?? "—"
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
										item.item_name,
										"\" من مخزن التموين نهائياً. لا يمكن التراجع عن هذا الإجراء."
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
										children: ["التصنيف ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-destructive",
											children: "*"
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
										value: formCategory,
										onChange: (e) => {
											setFormCategory(e.target.value);
											setFormItem("");
										},
										className: "mt-1 w-full rounded-xl bg-paper border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "",
											children: "اختر التصنيف..."
										}), SUPPLIES_CATEGORIES.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: c.value,
											children: c.label
										}, c.value))]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "block",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-sm font-semibold text-muted-foreground",
										children: ["اسم الصنف ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-destructive",
											children: "*"
										})]
									}), formCategory && SUPPLIES_ITEMS[formCategory]?.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
										value: formItem,
										onChange: (e) => setFormItem(e.target.value),
										className: "mt-1 w-full rounded-xl bg-paper border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "",
											children: "اختر الصنف..."
										}), SUPPLIES_ITEMS[formCategory].map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: item,
											children: item
										}, item))]
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "text",
										value: formItem,
										onChange: (e) => setFormItem(e.target.value),
										placeholder: formCategory ? "أدخل اسم الصنف..." : "اختر التصنيف أولاً",
										disabled: !formCategory,
										className: "mt-1 w-full rounded-xl bg-paper border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
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
										value: formQuantity,
										onChange: (e) => setFormQuantity(Number(e.target.value)),
										min: "0",
										className: "mt-1 w-full rounded-xl bg-paper border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring tabular-nums",
										placeholder: "أدخل العدد"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "block",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-sm font-semibold text-muted-foreground",
										children: "الوزن / الكمية"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
										value: formWeight,
										onChange: (e) => setFormWeight(e.target.value),
										className: "mt-1 w-full rounded-xl bg-paper border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "",
											children: "اختر الوزن..."
										}), WEIGHT_OPTIONS.map((w) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: w,
											children: w
										}, w))]
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
								children: busy ? "جارٍ الحفظ..." : modalMode === "add" ? "إضافة" : "تحديث"
							})]
						})
					]
				})
			})
		]
	});
}
//#endregion
export { InventoryPage as component };
