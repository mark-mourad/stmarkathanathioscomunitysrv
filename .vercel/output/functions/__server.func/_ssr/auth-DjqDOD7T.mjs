import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { F as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as supabase } from "./client-CvtLKJfQ.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as ChurchLogo } from "./church-logo-IRnJ_q3u.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/auth-DjqDOD7T.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AuthPage() {
	const [email, setEmail] = (0, import_react.useState)("");
	const [password, setPassword] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	async function onSubmit(e) {
		e.preventDefault();
		setBusy(true);
		const { error } = await supabase.auth.signInWithPassword({
			email: email.trim(),
			password
		});
		setBusy(false);
		if (error) {
			toast.error("بيانات الدخول غير صحيحة");
			return;
		}
		window.location.href = "/";
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "min-h-screen flex items-center justify-center px-6 py-12",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-md",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex justify-center mb-8",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChurchLogo, { size: 220 })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					onSubmit,
					className: "space-y-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "submit",
							disabled: busy,
							className: "chip-dark w-full text-xl py-5 disabled:opacity-60",
							children: busy ? "جارٍ الدخول..." : "تسجيل الدخول"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "email",
							required: true,
							value: email,
							onChange: (e) => setEmail(e.target.value),
							placeholder: "User ID",
							className: "w-full rounded-full bg-paper-2 px-7 py-5 text-center text-lg shadow-soft outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground/70",
							dir: "ltr"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "password",
							required: true,
							value: password,
							onChange: (e) => setPassword(e.target.value),
							placeholder: "Password",
							className: "w-full rounded-full bg-paper-2 px-7 py-5 text-center text-lg shadow-soft outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground/70",
							dir: "ltr"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-8 text-center text-xs text-muted-foreground",
					children: "الحسابات محددة مسبقاً ولا يمكن التسجيل من خارج الكنيسة."
				})
			]
		})
	});
}
//#endregion
export { AuthPage as component };
