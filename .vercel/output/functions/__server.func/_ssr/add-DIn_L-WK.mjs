import { i as __toESM } from "../_runtime.mjs";
import { _ as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { F as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { et as useServerFn, s as createIndividual } from "./church.functions-CojeWWgP.mjs";
import { t as useAuth } from "./use-auth-DmMFHth-.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { n as buildIndividualPayload, t as IndividualForm } from "./individual-form-CqEQcHFt.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/add-DIn_L-WK.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AddPage() {
	const { role, can, assignedFamily, isFamilyServant } = useAuth();
	const router = useRouter();
	const submit = useServerFn(createIndividual);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const addRestricted = [
		"SUPPLY_WAREHOUSE_MANAGER",
		"FURNITURE_WAREHOUSE_MANAGER",
		"PHARMACY_WAREHOUSE_MANAGER",
		"BRIDE_AND_MEDICAL_AIDS_MANAGER",
		"BLESSING_DISTRIBUTOR"
	];
	(0, import_react.useEffect)(() => {
		if (addRestricted.includes(role)) {
			toast.error("غير مصرح لك بهذا الحقل");
			router.navigate({ to: "/" });
		}
	}, [role]);
	if (addRestricted.includes(role)) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "text-center py-8 text-muted-foreground",
		children: "جاري التوجيه..."
	});
	if (!can("add:beneficiary")) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "paper-card text-center",
		children: "غير مصرح. للقراءة فقط."
	});
	async function onSubmit(formData) {
		if (!formData.ind.full_name) {
			toast.error("الاسم مطلوب");
			return;
		}
		if (!formData.ind.national_id || formData.ind.national_id.length !== 14) {
			toast.error("الرقم القومي مطلوب ويجب أن يكون 14 رقم");
			return;
		}
		setBusy(true);
		try {
			const res = await submit({ data: buildIndividualPayload(formData) });
			toast.success("تم حفظ المخدوم");
			router.navigate({
				to: "/individual/$id",
				params: { id: res.id }
			});
		} catch (err) {
			toast.error(err?.message ?? "حدث خطأ");
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IndividualForm, {
		submitLabel: "حفظ المخدوم",
		busy,
		onSubmit,
		onCancel: () => router.history.back(),
		initialInd: isFamilyServant && assignedFamily ? { saint_family: assignedFamily } : {},
		lockFamily: isFamilyServant,
		role
	});
}
//#endregion
export { AddPage as component };
