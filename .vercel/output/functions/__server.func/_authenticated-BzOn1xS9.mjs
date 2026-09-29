import { i as __toESM } from "./_runtime.mjs";
import { _ as useRouter, h as Link } from "./_libs/@tanstack/react-router+[...].mjs";
import { u as require_react } from "./_libs/@floating-ui/react-dom+[...].mjs";
import { F as require_jsx_runtime } from "./_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { V as saveHiddenFamiliesMetric, X as updateMetric, b as getAuditLog, et as useServerFn, w as getDashboard } from "./_ssr/church.functions-CojeWWgP.mjs";
import { r as getFamilyScopeForRole } from "./_ssr/permissions-BPF-3_4x.mjs";
import { t as useAuth } from "./_ssr/use-auth-DmMFHth-.mjs";
import { n as toast } from "./_libs/sonner.mjs";
import { E as DollarSign, L as Activity, P as BookOpen, R as SquareCheckBig, _ as Pencil, a as UserPlus, c as Stethoscope, d as Search, g as Pill, l as Sofa, o as TrendingUp, u as Shirt, v as Package } from "./_libs/lucide-react.mjs";
import { a as CartesianGrid, c as Cell, d as Legend, i as XAxis, l as ResponsiveContainer, n as BarChart, o as Bar, r as YAxis, s as Pie, t as PieChart, u as Tooltip } from "./_libs/recharts+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_authenticated-BzOn1xS9.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Dashboard() {
	const { role, can, isAdmin, isFamilyServant } = useAuth();
	useRouter();
	const fetchDashboard = useServerFn(getDashboard);
	const fetchAudit = useServerFn(getAuditLog);
	const saveMetric = useServerFn(updateMetric);
	const saveHidden = useServerFn(saveHiddenFamiliesMetric);
	const [metrics, setMetrics] = (0, import_react.useState)([]);
	const [hiddenFamilies, setHiddenFamilies] = (0, import_react.useState)(null);
	const [hiddenPersisted, setHiddenPersisted] = (0, import_react.useState)(false);
	const [editing, setEditing] = (0, import_react.useState)(null);
	const [editingHidden, setEditingHidden] = (0, import_react.useState)(false);
	const [auditLog, setAuditLog] = (0, import_react.useState)([]);
	async function reload() {
		const d = await fetchDashboard();
		setMetrics(d.metrics);
		setHiddenFamilies(d.hiddenFamilies);
		setHiddenPersisted(d.hiddenFamiliesPersisted);
		if (isAdmin) setAuditLog((await fetchAudit()).slice(0, 10));
	}
	(0, import_react.useEffect)(() => {
		if (isAdmin || isFamilyServant) reload();
	}, [isAdmin, isFamilyServant]);
	const roleScope = getFamilyScopeForRole(role);
	const scopedMetrics = isAdmin ? metrics : roleScope ? metrics.filter((m) => m.sector === roleScope.sector) : [];
	const scopedHiddenFamilies = isAdmin ? hiddenFamilies : null;
	const hiddenMonthly = scopedHiddenFamilies ? Number(scopedHiddenFamilies.monthly) : 0;
	const hiddenStudy = scopedHiddenFamilies ? Number(scopedHiddenFamilies.study) : 0;
	const hiddenTherapeutic = scopedHiddenFamilies ? Number(scopedHiddenFamilies.therapeutic) : 0;
	const totalMonthly = scopedMetrics.reduce((s, m) => s + Number(m.monthly), 0) + hiddenMonthly;
	const totalStudy = scopedMetrics.reduce((s, m) => s + Number(m.study), 0) + hiddenStudy;
	const totalTherapeutic = scopedMetrics.reduce((s, m) => s + Number(m.therapeutic), 0) + hiddenTherapeutic;
	const summaryCards = [
		{
			label: "إجمالي الخارج",
			value: totalMonthly + totalStudy + totalTherapeutic,
			icon: DollarSign,
			color: "bg-primary/10 text-primary"
		},
		{
			label: "الشهريات",
			value: totalMonthly,
			icon: TrendingUp,
			color: "bg-sky/15 text-sky"
		},
		{
			label: "مساعدات دراسية",
			value: totalStudy,
			icon: BookOpen,
			color: "bg-teal/15 text-teal"
		},
		{
			label: "مساعدات علاجية",
			value: totalTherapeutic,
			icon: Stethoscope,
			color: "bg-chart-3/15 text-foreground"
		}
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4 sm:space-y-6 md:space-y-8",
		children: [
			(isAdmin || isFamilyServant) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4",
				children: summaryCards.map((card) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
					className: "paper-card !p-3 sm:!p-6 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-4",
					onDoubleClick: () => isAdmin && card.label === "إجمالي الخارج" && metrics[0] && setEditing(metrics[0]),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: `rounded-xl p-2 sm:p-3 shrink-0 ${card.color}`,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(card.icon, {
							size: 22,
							className: "size-[18px] sm:size-[22px]"
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0 w-full sm:w-auto",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[11px] sm:text-xs text-muted-foreground truncate",
							children: card.label
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "display text-lg sm:text-xl text-ink tabular-nums truncate",
							children: card.value.toLocaleString("ar-EG")
						})]
					})]
				}, card.label))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "grid grid-cols-2 gap-2 sm:gap-3 lg:flex lg:flex-wrap",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuickActionButton, {
						to: "/add",
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserPlus, { size: 16 }),
						label: "إضافة مخدوم",
						color: "green",
						className: "col-span-2 lg:col-auto",
						restricted: [
							"SUPPLY_WAREHOUSE_MANAGER",
							"FURNITURE_WAREHOUSE_MANAGER",
							"PHARMACY_WAREHOUSE_MANAGER",
							"BRIDE_AND_MEDICAL_AIDS_MANAGER",
							"BLESSING_DISTRIBUTOR"
						],
						role
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuickActionButton, {
						to: "/search",
						search: { mode: "name" },
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { size: 16 }),
						label: "البحث بالاسم",
						color: "dark",
						restricted: [
							"SUPPLY_WAREHOUSE_MANAGER",
							"FURNITURE_WAREHOUSE_MANAGER",
							"PHARMACY_WAREHOUSE_MANAGER",
							"BLESSING_DISTRIBUTOR"
						],
						role
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuickActionButton, {
						to: "/clothes",
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shirt, { size: 16 }),
						label: "طلب ملابس",
						color: "dark",
						restricted: [
							"SUPPLY_WAREHOUSE_MANAGER",
							"FURNITURE_WAREHOUSE_MANAGER",
							"PHARMACY_WAREHOUSE_MANAGER",
							"BRIDE_AND_MEDICAL_AIDS_MANAGER",
							"BLESSING_DISTRIBUTOR"
						],
						role
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuickActionButton, {
						to: "/blessing-distribution",
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SquareCheckBig, { size: 16 }),
						label: "توزيع البركة",
						color: "dark",
						restricted: [
							"SUPPLY_WAREHOUSE_MANAGER",
							"FURNITURE_WAREHOUSE_MANAGER",
							"PHARMACY_WAREHOUSE_MANAGER",
							"BRIDE_AND_MEDICAL_AIDS_MANAGER"
						],
						role
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuickActionButton, {
						to: "/furniture",
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sofa, { size: 16 }),
						label: role === "FURNITURE_WAREHOUSE_MANAGER" ? "إدارة مخزن الأجهزة والأثاث" : "طلب الأجهزة والأثاث",
						color: "dark",
						restricted: [
							"SUPPLY_WAREHOUSE_MANAGER",
							"PHARMACY_WAREHOUSE_MANAGER",
							"BRIDE_AND_MEDICAL_AIDS_MANAGER",
							"BLESSING_DISTRIBUTOR"
						],
						role
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuickActionButton, {
						to: "/pharmacy",
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, { size: 16 }),
						label: role === "PHARMACY_WAREHOUSE_MANAGER" ? "إدارة مخزن الصيدلية" : "الصيدلية",
						color: "dark",
						restricted: [
							"SUPPLY_WAREHOUSE_MANAGER",
							"FURNITURE_WAREHOUSE_MANAGER",
							"BRIDE_AND_MEDICAL_AIDS_MANAGER",
							"BLESSING_DISTRIBUTOR"
						],
						role
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuickActionButton, {
						to: "/inventory",
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { size: 16 }),
						label: role === "SUPPLY_WAREHOUSE_MANAGER" ? "إدارة مخزن التموين" : "المخزن",
						color: "dark",
						restricted: [
							"ST_MATTHEW",
							"ST_MARK",
							"ST_JOHN",
							"ST_LUKE",
							"ST_HIDDEN_FAMILIES",
							"BLESSING_DISTRIBUTOR",
							"FURNITURE_WAREHOUSE_MANAGER",
							"PHARMACY_WAREHOUSE_MANAGER",
							"BRIDE_AND_MEDICAL_AIDS_MANAGER"
						],
						role
					})
				]
			}),
			isAdmin && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
					className: "paper-card !p-4 sm:!p-6 min-w-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between gap-2 mb-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "display text-sm text-muted-foreground min-w-0",
							children: "مصاريف القطاعات"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => metrics[0] && setEditing(metrics[0]),
							className: "shrink-0 flex items-center justify-center gap-1 min-h-11 min-w-11 px-2 rounded-full text-xs text-muted-foreground hover:text-primary hover:bg-primary/10 transition",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { size: 12 }), " تعديل"]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "h-56 sm:h-72 relative z-0",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(BarChart, {
							data: metrics,
							layout: "vertical",
							margin: {
								top: 20,
								right: 20,
								left: 10,
								bottom: 20
							},
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
									horizontal: false,
									stroke: "var(--color-border)"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
									type: "number",
									stroke: "var(--color-muted-foreground)",
									fontSize: 11
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
									type: "category",
									dataKey: "sector",
									stroke: "var(--color-muted-foreground)",
									fontSize: 12,
									width: 10,
									tick: false,
									tickLine: false
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, { contentStyle: {
									background: "var(--color-paper-2)",
									border: "1px solid var(--color-border)",
									borderRadius: 12
								} }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Legend, { content: renderChartLegend }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
									dataKey: "monthly",
									stackId: "a",
									name: "شهريات",
									fill: "var(--color-sky)",
									radius: [
										0,
										0,
										0,
										0
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
									dataKey: "study",
									stackId: "a",
									name: "مساعدات دراسية",
									fill: "var(--color-teal)"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
									dataKey: "therapeutic",
									stackId: "a",
									name: "مساعدات علاجية",
									fill: "var(--color-chart-3)",
									radius: [
										0,
										8,
										8,
										0
									]
								})
							]
						}) })
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HiddenFamiliesPieCard, {
					metric: scopedHiddenFamilies,
					editable: true,
					onEdit: () => setEditingHidden(true)
				})]
			}),
			can("view:audit") && auditLog.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "paper-card !p-4 sm:!p-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2 mb-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Activity, {
							size: 16,
							className: "text-muted-foreground"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "display text-sm text-muted-foreground",
							children: "آخر النشاطات"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "space-y-2 md:hidden",
						children: auditLog.map((entry) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
							className: "rounded-xl border border-border/40 bg-paper px-3 py-2.5",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
								className: "grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
										className: "text-muted-foreground",
										children: "المستخدم"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
										className: "min-w-0 break-words text-foreground/80",
										children: entry.user_email
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
										className: "text-muted-foreground",
										children: "الإجراء"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
										className: "min-w-0 break-words text-foreground/80",
										children: entry.action
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
										className: "text-muted-foreground",
										children: "الجدول"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
										className: "min-w-0 break-words text-foreground/60",
										children: entry.table_name
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
										className: "text-muted-foreground",
										children: "التاريخ"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
										className: "min-w-0 break-words text-muted-foreground",
										children: formatAuditDate(entry.created_at)
									})
								]
							})
						}, entry.id))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "hidden md:block overflow-x-auto",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
							className: "w-full text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "border-b border-border/60 text-muted-foreground text-xs",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "text-start pb-2 font-medium",
										children: "ال المستخدم"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "text-start pb-2 font-medium",
										children: "الإجراء"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "text-start pb-2 font-medium",
										children: "الجدول"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "text-start pb-2 font-medium hidden sm:table-cell",
										children: "التاريخ"
									})
								]
							}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: auditLog.map((entry) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "border-b border-border/30 last:border-0",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-2 text-foreground/80",
										children: entry.user_email
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-2 text-foreground/80",
										children: entry.action
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-2 text-foreground/60",
										children: entry.table_name
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-2 text-muted-foreground hidden sm:table-cell",
										children: formatAuditDate(entry.created_at)
									})
								]
							}, entry.id)) })]
						})
					})
				]
			}),
			isAdmin && metrics.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:hidden",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "paper-card !p-4 sm:!p-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
						className: "display text-sm text-muted-foreground mb-3 flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { size: 14 }), " تعديل قيم القطاعات"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "space-y-2",
						children: metrics.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setEditing(m),
							className: "w-full min-h-11 flex items-center text-start px-3 py-2 rounded-xl hover:bg-primary/10 text-sm transition",
							children: m.sector
						}, m.id))
					})]
				}), hiddenFamilies && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "paper-card !p-4 sm:!p-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
						className: "display text-sm text-muted-foreground mb-3 flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { size: 14 }), " تعديل الأسر المستترة"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => setEditingHidden(true),
						className: "w-full min-h-11 flex items-center text-start px-3 py-2 rounded-xl hover:bg-primary/10 text-sm transition",
						children: "الشهريات · المساعدات الدراسية · المساعدات العلاجية"
					})]
				})]
			}),
			editing && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EditMetricDialog, {
				metrics,
				currentId: editing.id,
				onClose: () => setEditing(null),
				onSave: async (id, vals) => {
					await saveMetric({ data: {
						id,
						...vals
					} });
					toast.success("تم حفظ التعديلات");
					setEditing(null);
					reload();
				}
			}),
			editingHidden && hiddenFamilies && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EditMetricDialog, {
				metric: hiddenFamilies,
				title: "الأسر المستترة",
				onClose: () => setEditingHidden(false),
				onSave: async (_id, vals) => {
					if (hiddenPersisted && hiddenFamilies.id) await saveMetric({ data: {
						id: hiddenFamilies.id,
						...vals
					} });
					else await saveHidden({ data: vals });
					toast.success("تم حفظ التعديلات");
					setEditingHidden(false);
					reload();
				}
			})
		]
	});
}
function HiddenFamiliesPieCard({ metric, editable, onEdit }) {
	const pieData = metric ? [
		{
			name: "شهريات",
			value: Number(metric.monthly)
		},
		{
			name: "مساعدات دراسية",
			value: Number(metric.study)
		},
		{
			name: "مساعدات علاجية",
			value: Number(metric.therapeutic)
		}
	] : [];
	const PIE_COLORS = [
		"var(--color-sky)",
		"var(--color-teal)",
		"var(--color-chart-3)"
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "paper-card !p-4 sm:!p-6 min-w-0",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between gap-2 mb-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "display text-sm text-muted-foreground min-w-0",
				children: "الأسر المستترة"
			}), editable && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				onClick: onEdit,
				className: "shrink-0 flex items-center justify-center gap-1 min-h-11 min-w-11 px-2 rounded-full text-xs text-muted-foreground hover:text-primary hover:bg-primary/10 transition",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { size: 12 }), " تعديل"]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "h-[220px] sm:h-64",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PieChart, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pie, {
					data: pieData,
					dataKey: "value",
					nameKey: "name",
					outerRadius: "68%",
					label: true,
					children: pieData.map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cell, { fill: PIE_COLORS[i] }, i))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Legend, { content: renderChartLegend }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, {})
			] }) })
		})]
	});
}
function ChartLegend({ payload }) {
	if (!payload?.length) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
		className: "mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5",
		children: payload.map((item, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
			className: "flex items-center gap-1.5 text-xs text-muted-foreground",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "size-2.5 shrink-0 rounded-[2px]",
				style: { backgroundColor: item.color }
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "min-w-0",
				children: item.value
			})]
		}, `${item.value}-${i}`))
	});
}
function renderChartLegend(props) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChartLegend, { payload: props?.payload });
}
function formatAuditDate(iso) {
	return new Date(iso).toLocaleDateString("ar-EG", {
		year: "numeric",
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit"
	});
}
function QuickActionButton({ to, search, icon, label, color, className, restricted, role }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
		to,
		search,
		onClick: (e) => {
			if (restricted.includes(role)) {
				e.preventDefault();
				toast.error("غير مصرح لك بهذا الحقل");
			}
		},
		className: `${color === "green" ? "chip-green" : "chip-dark"} w-full min-h-11 !px-3 !py-2 text-[11px] sm:text-xs leading-tight text-center lg:min-h-0 lg:w-auto lg:!px-5 lg:!py-2.5 lg:text-sm lg:leading-normal ` + (className ?? ""),
		children: [icon && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "ms-1.5 shrink-0 flex items-center [&>svg]:size-3.5 lg:[&>svg]:size-4",
			children: icon
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "min-w-0",
			children: label
		})]
	});
}
function EditMetricDialog({ metric, metrics, currentId, title, onClose, onSave }) {
	const initial = metrics ? metrics.find((m) => m.id === currentId) ?? metrics[0] : metric;
	const [selectedId, setSelectedId] = (0, import_react.useState)(initial.id);
	const [monthly, setMonthly] = (0, import_react.useState)(Number(initial.monthly));
	const [study, setStudy] = (0, import_react.useState)(Number(initial.study));
	const [therapeutic, setTherapeutic] = (0, import_react.useState)(Number(initial.therapeutic));
	const showSelector = metrics && metrics.length > 1;
	function handleSectorChange(id) {
		const m = metrics.find((x) => x.id === id);
		if (!m) return;
		setSelectedId(id);
		setMonthly(Number(m.monthly));
		setStudy(Number(m.study));
		setTherapeutic(Number(m.therapeutic));
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 bg-ink/40 backdrop-blur-sm z-50 flex items-center justify-center p-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "paper-card w-full max-w-md",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
					className: "display text-xl mb-4",
					children: ["تعديل: ", title ?? initial.sector]
				}),
				showSelector && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "block mb-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-sm font-semibold text-muted-foreground",
						children: "اختر القطاع"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
						value: selectedId,
						onChange: (e) => handleSectorChange(e.target.value),
						className: "mt-1 w-full rounded-xl bg-paper px-4 py-2 outline-none focus:ring-2 focus:ring-ring text-sm",
						children: metrics.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: m.id,
							children: m.sector
						}, m.id))
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "شهريات",
							value: monthly,
							onChange: setMonthly
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "مساعدات دراسية",
							value: study,
							onChange: setStudy
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "مساعدات علاجية",
							value: therapeutic,
							onChange: setTherapeutic
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-3 mt-6 justify-end",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: onClose,
						className: "px-4 py-2 rounded-full bg-muted text-foreground",
						children: "إلغاء"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => onSave(selectedId, {
							monthly,
							study,
							therapeutic
						}),
						className: "chip-green px-6 py-2",
						children: "حفظ"
					})]
				})
			]
		})
	});
}
function Field({ label, value, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "block",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-sm font-semibold text-muted-foreground",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
			type: "number",
			value,
			onChange: (e) => onChange(Number(e.target.value)),
			className: "mt-1 w-full rounded-xl bg-paper px-4 py-2 outline-none focus:ring-2 focus:ring-ring"
		})]
	});
}
//#endregion
export { Dashboard as component };
