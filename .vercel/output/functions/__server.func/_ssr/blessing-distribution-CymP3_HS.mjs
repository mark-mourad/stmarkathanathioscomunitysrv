import { i as __toESM } from "../_runtime.mjs";
import { _ as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { F as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { H as scanBlessingDistribution, M as getInventory, W as toggleBlessingDistribution, et as useServerFn, j as getIndividualsBySaintFamily, x as getBlessingDistribution } from "./church.functions-CojeWWgP.mjs";
import { t as useAuth } from "./use-auth-DmMFHth-.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { M as Check, d as Search, f as ScanBarcode } from "../_libs/lucide-react.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/blessing-distribution-CymP3_HS.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var SAINT_FAMILIES = [
	{
		value: "متى",
		label: "القديس متى"
	},
	{
		value: "مرقس",
		label: "القديس مرقس"
	},
	{
		value: "لوقا",
		label: "القديس لوقا"
	},
	{
		value: "يوحنا",
		label: "القديس يوحنا"
	},
	{
		value: "أسر مستترة",
		label: "الأسر المستترة"
	}
];
var FILTERED_SAINT_FAMILIES = (role) => {
	if (role === "SUPER_ADMIN" || role === "ADMIN") return SAINT_FAMILIES;
	if (role === "ST_HIDDEN_FAMILIES") return SAINT_FAMILIES.filter((f) => f.value === "أسر مستترة");
	if ([
		"ST_MATTHEW",
		"ST_MARK",
		"ST_JOHN",
		"ST_LUKE"
	].includes(role)) {
		const myFamily = {
			ST_MATTHEW: "متى",
			ST_MARK: "مرقس",
			ST_JOHN: "يوحنا",
			ST_LUKE: "لوقا"
		}[role];
		return SAINT_FAMILIES.filter((f) => f.value === myFamily);
	}
	return SAINT_FAMILIES.filter((f) => f.value !== "أسر مستترة");
};
var SCANNER_MAX_KEY_INTERVAL_MS = 80;
var BLESSING_BLOCKED_ROLES = ["BRIDE_AND_MEDICAL_AIDS_MANAGER", "SUPPLY_WAREHOUSE_MANAGER"];
function BlessingDistribution() {
	const { role, isAdmin } = useAuth();
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		if (BLESSING_BLOCKED_ROLES.includes(role)) {
			toast.error("غير مصرح لك بهذا الحقل");
			router.navigate({ to: "/" });
		}
	}, [role]);
	const [selectedFamily, setSelectedFamily] = (0, import_react.useState)("");
	const [lastScannedName, setLastScannedName] = (0, import_react.useState)(null);
	const [scannerProcessing, setScannerProcessing] = (0, import_react.useState)(false);
	const [manualInput, setManualInput] = (0, import_react.useState)("");
	const [manualLoading, setManualLoading] = (0, import_react.useState)(false);
	const queryClient = useQueryClient();
	const fetchIndividuals = useServerFn(getIndividualsBySaintFamily);
	const fetchBlessingDistribution = useServerFn(getBlessingDistribution);
	const scanDistribution = useServerFn(scanBlessingDistribution);
	const toggleDistribution = useServerFn(toggleBlessingDistribution);
	const fetchInventory = useServerFn(getInventory);
	const { data: inventory } = useQuery({
		queryKey: ["blessing-batch"],
		queryFn: () => fetchInventory(),
		staleTime: 0,
		refetchOnMount: "always",
		refetchInterval: 1e4
	});
	const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
	const { data: individuals = [], isLoading: isLoadingIndividuals } = useQuery({
		queryKey: ["blessing-individuals", selectedFamily],
		queryFn: () => fetchIndividuals({ data: { saint_family: selectedFamily } }),
		enabled: !!selectedFamily,
		staleTime: 0,
		refetchOnMount: "always"
	});
	const { data: blessingRecords = [], isLoading: isLoadingRecords } = useQuery({
		queryKey: [
			"blessing-records",
			selectedFamily,
			today
		],
		queryFn: () => fetchBlessingDistribution({ data: {
			saint_family: selectedFamily,
			distribution_date: today
		} }),
		enabled: !!selectedFamily,
		staleTime: 0,
		refetchOnMount: "always"
	});
	const isLoading = isLoadingIndividuals || isLoadingRecords;
	const scannerBufferRef = (0, import_react.useRef)("");
	const scannerLastKeyTimeRef = (0, import_react.useRef)(0);
	const refreshAll = (0, import_react.useCallback)(async () => {
		await queryClient.invalidateQueries({ queryKey: ["blessing-individuals", selectedFamily] });
		await queryClient.invalidateQueries({ queryKey: [
			"blessing-records",
			selectedFamily,
			today
		] });
		await queryClient.invalidateQueries({ queryKey: ["blessing-batch"] });
	}, [
		queryClient,
		selectedFamily,
		today
	]);
	const toggleMutation = useMutation({
		mutationFn: (vars) => toggleDistribution({ data: vars }),
		onSuccess: async (result, vars) => {
			toast.success(result.received ? `تم تسجيل البركة لـ ${result.individual_name}` : `تم إلغاء تسجيل البركة لـ ${result.individual_name}`);
			await refreshAll();
		},
		onError: (error) => {
			toast.error(error instanceof Error ? error.message : "خطأ في تحديث الحالة");
		}
	});
	const executeScan = (0, import_react.useCallback)(async (nationalId) => {
		setScannerProcessing(true);
		setLastScannedName(null);
		try {
			const result = await scanDistribution({ data: { national_id: nationalId } });
			setLastScannedName(result.individual_name);
			toast.success(`تم تسجيل البركة لـ ${result.individual_name}`);
			await refreshAll();
		} catch (error) {
			const msg = error instanceof Error ? error.message : "خطأ في المسح";
			toast.error(msg);
			await refreshAll();
		} finally {
			setScannerProcessing(false);
		}
	}, [scanDistribution, refreshAll]);
	async function handleManualScan(e) {
		e.preventDefault();
		const id = manualInput.trim();
		if (!id) return;
		setManualLoading(true);
		try {
			const result = await scanDistribution({ data: { national_id: id } });
			toast.success(`تم تسجيل البركة لـ ${result.individual_name}`);
			setManualInput("");
			await refreshAll();
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "خطأ في البحث");
			await refreshAll();
		} finally {
			setManualLoading(false);
		}
	}
	(0, import_react.useEffect)(() => {
		function isTextInputFocused() {
			const el = document.activeElement;
			if (!el) return false;
			const tag = el.tagName;
			return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
		}
		function onKeyDown(e) {
			if (isTextInputFocused()) return;
			if (document.querySelector("[role='dialog']")) return;
			const now = Date.now();
			if (now - scannerLastKeyTimeRef.current > SCANNER_MAX_KEY_INTERVAL_MS && scannerBufferRef.current.length > 0) scannerBufferRef.current = "";
			scannerLastKeyTimeRef.current = now;
			if (e.key === "Enter") {
				const buf = scannerBufferRef.current.trim();
				scannerBufferRef.current = "";
				if (buf.length > 0) {
					e.preventDefault();
					executeScan(buf);
				}
				return;
			}
			if (e.key.length > 1 && e.key !== "Backspace" && e.key !== "Delete") return;
			if (e.ctrlKey || e.altKey || e.metaKey) return;
			if (e.key.length === 1) scannerBufferRef.current += e.key;
		}
		document.addEventListener("keydown", onKeyDown, true);
		return () => document.removeEventListener("keydown", onKeyDown, true);
	}, [executeScan]);
	const receivedSet = new Set(blessingRecords.filter((r) => r.received).map((r) => r.individual_id));
	const receivedCount = receivedSet.size;
	const notReceivedCount = individuals.length - receivedCount;
	const canToggle = isAdmin;
	if (BLESSING_BLOCKED_ROLES.includes(role)) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "text-center py-8 text-muted-foreground",
		children: "جاري التوجيه..."
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "max-w-4xl mx-auto space-y-6",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "paper-card",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "display text-2xl mb-6",
					children: "توزيع البركة"
				}),
				isAdmin && inventory && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "bg-primary/10 border border-primary/20 rounded-xl p-4 mb-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex justify-between items-center",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-sm font-semibold text-primary",
							children: "إجمالي البركة المتبقية"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-2xl font-bold tabular-nums text-primary",
							children: inventory.weekly_total
						})]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						className: "block text-sm font-semibold text-muted-foreground mb-2",
						children: "اختر أسرة القديس"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						value: selectedFamily,
						onChange: (e) => setSelectedFamily(e.target.value),
						className: "w-full rounded-xl bg-paper px-4 py-3 outline-none focus:ring-2 focus:ring-ring",
						disabled: isLoading,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "",
							children: "-- اختر أسرة القديس --"
						}), FILTERED_SAINT_FAMILIES(role).map((family) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: family.value,
							children: family.label
						}, family.value))]
					})]
				}),
				selectedFamily && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-4 mb-6",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "bg-primary/10 rounded-xl p-4 text-center",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-3xl font-bold text-primary tabular-nums",
								children: receivedCount
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-sm text-muted-foreground",
								children: "استلموا البركة"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "bg-muted rounded-xl p-4 text-center",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-3xl font-bold tabular-nums",
								children: notReceivedCount
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-sm text-muted-foreground",
								children: "لم يستلموا البركة"
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "bg-primary/5 border border-primary/15 rounded-xl p-4 mb-6 flex items-center gap-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScanBarcode, {
									size: 22,
									className: "text-primary"
								}), !scannerProcessing && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-success rounded-full animate-pulse" })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-sm font-semibold text-primary",
									children: scannerProcessing ? "جارٍ التسجيل..." : "جاهز لمسح الباركود"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-xs text-muted-foreground",
									children: "امسح بطاقة المخدوم لتسجيل البركة"
								})]
							}),
							lastScannedName && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "text-xs bg-success/15 text-success px-3 py-1 rounded-full font-semibold",
								children: ["آخر مسح: ", lastScannedName]
							})
						]
					}),
					isAdmin && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						onSubmit: handleManualScan,
						className: "bg-paper-2 rounded-xl p-4 mb-6 flex gap-3 items-center",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, {
								size: 20,
								className: "text-muted-foreground shrink-0"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "text",
								value: manualInput,
								onChange: (e) => setManualInput(e.target.value),
								className: "flex-1 rounded-xl bg-paper px-4 py-3 outline-none focus:ring-2 focus:ring-ring",
								disabled: manualLoading,
								autoComplete: "off",
								placeholder: "أدخل الرقم القومي للمسح"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "submit",
								className: "chip-green px-4 py-3 text-sm whitespace-nowrap",
								disabled: manualLoading || !manualInput.trim(),
								children: manualLoading ? "جاري..." : "مسح الباركود"
							})
						]
					}),
					isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-center py-8 text-muted-foreground",
						children: "جاري التحميل..."
					}) : individuals.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-center py-8 text-muted-foreground",
						children: "لا يوجد أفراد مسجلين في هذه الأسرة"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "space-y-2 max-h-96 overflow-y-auto",
						children: individuals.map((individual) => {
							const isReceived = receivedSet.has(individual.id);
							const toggling = toggleMutation.isPending;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: `flex items-center gap-3 p-3 rounded-lg transition ${isReceived ? "bg-primary/10 border-2 border-primary" : "bg-paper border-2 border-transparent"}`,
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										role: "checkbox",
										"aria-checked": isReceived,
										"aria-label": `${individual.full_name} - ${isReceived ? "استلم البركة" : "لم يستلم البركة"}`,
										onClick: () => toggleMutation.mutate({
											saint_family: selectedFamily,
											individual_id: individual.id
										}),
										disabled: !canToggle || toggling,
										title: canToggle ? "اضغط لتغيير حالة الاستلام" : "غير مسموح بالتعديل",
										className: `w-5 h-5 rounded border-2 flex items-center justify-center transition shrink-0 ${isReceived ? "bg-primary border-primary" : "border-muted-foreground"} ${canToggle && !toggling ? "cursor-pointer hover:opacity-80" : "cursor-default opacity-70"}`,
										children: isReceived && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
											size: 14,
											className: "text-primary-foreground"
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "font-semibold",
											children: individual.full_name
										}), individual.nickname && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-sm text-muted-foreground",
											children: individual.nickname
										})]
									}),
									isReceived && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full",
										children: "استلم البركة"
									})
								]
							}, individual.id);
						})
					})
				] })
			]
		})
	});
}
//#endregion
export { BlessingDistribution as component };
