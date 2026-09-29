import { i as __toESM } from "../_runtime.mjs";
import { _ as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { F as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { b as getAuditLog, et as useServerFn, u as deleteAuditLog } from "./church.functions-CojeWWgP.mjs";
import { t as useAuth } from "./use-auth-DmMFHth-.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { s as Trash2 } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/audit-DdnokrgS.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AuditPage() {
	const { can, role } = useAuth();
	const router = useRouter();
	const auditRestricted = [
		"SUPPLY_WAREHOUSE_MANAGER",
		"FURNITURE_WAREHOUSE_MANAGER",
		"PHARMACY_WAREHOUSE_MANAGER",
		"BRIDE_AND_MEDICAL_AIDS_MANAGER",
		"BLESSING_DISTRIBUTOR"
	];
	(0, import_react.useEffect)(() => {
		if (auditRestricted.includes(role)) {
			toast.error("غير مصرح لك بهذا الحقل");
			router.navigate({ to: "/" });
		}
	}, [role]);
	if (auditRestricted.includes(role)) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "text-center py-8 text-muted-foreground",
		children: "جاري التوجيه..."
	});
	const fetchLog = useServerFn(getAuditLog);
	const deleteHistory = useServerFn(deleteAuditLog);
	const [rows, setRows] = (0, import_react.useState)([]);
	(0, import_react.useEffect)(() => {
		if (can("view:audit")) fetchLog().then(setRows);
	}, []);
	const handleClearHistory = async () => {
		if (!window.confirm("هل أنت متأكد من مسح سجل التعديلات بالكامل؟ لا يمكن التراجع عن هذا الإجراء.")) return;
		try {
			await deleteHistory();
			setRows(await fetchLog());
			toast.success("تم مسح سجل النشاط بالكامل");
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			toast.error(message || "حدث خطأ أثناء محاولة المسح");
			console.error(error);
		}
	};
	if (!can("view:audit")) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "paper-card text-center",
		children: "غير مصرح."
	});
	const labelOf = (a) => a === "INSERT" ? "إضافة" : a === "UPDATE" ? "تعديل" : a === "DELETE" ? "حذف" : a;
	const tableLabel = {
		individuals: "المخدومين",
		family_members: "أفراد الأسرة",
		financials: "البيانات المالية",
		dashboard_metrics: "قيم اللوحة"
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "paper-card",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "display text-xl",
				children: "سجل التعديلات"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: handleClearHistory,
				className: "inline-flex items-center gap-2 rounded-full bg-red-600/10 px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-600/20",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 16 }), " مسح السجل"]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "overflow-x-auto",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "w-full text-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
					className: "text-muted-foreground",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: [
						"الوقت",
						"المستخدم",
						"العملية",
						"الجهة",
						"المعرف"
					].map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "text-start px-2 py-2 border-b border-border font-semibold",
						children: h
					}, h)) })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", { children: [rows.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
					className: "border-b border-border/60",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "px-2 py-2 tabular-nums",
							dir: "ltr",
							children: new Date(r.created_at).toLocaleString("ar-EG")
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "px-2 py-2",
							children: r.user_email || "—"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "px-2 py-2",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: `px-2 py-0.5 rounded-full text-xs font-semibold ${r.action === "DELETE" ? "bg-destructive/15 text-destructive" : r.action === "UPDATE" ? "bg-sky/30 text-primary" : "bg-success/15 text-success"}`,
								children: labelOf(r.action)
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "px-2 py-2",
							children: tableLabel[r.table_name] ?? r.table_name
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "px-2 py-2 text-muted-foreground",
							dir: "ltr",
							children: r.record_id
						})
					]
				}, r.id)), rows.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					colSpan: 5,
					className: "text-center py-8 text-muted-foreground",
					children: "لا توجد تعديلات بعد"
				}) })] })]
			})
		})]
	});
}
//#endregion
export { AuditPage as component };
