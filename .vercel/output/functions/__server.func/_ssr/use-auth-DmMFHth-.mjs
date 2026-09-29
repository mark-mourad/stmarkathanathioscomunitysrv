import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as hasPermission, n as getAssignedFamily, o as isFamilyServant, s as resolvePrimaryRole } from "./permissions-BPF-3_4x.mjs";
import { t as supabase } from "./client-CvtLKJfQ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/use-auth-DmMFHth-.js
var import_react = /* @__PURE__ */ __toESM(require_react());
function useAuth() {
	const [session, setSession] = (0, import_react.useState)(null);
	const [role, setRole] = (0, import_react.useState)(null);
	const [loading, setLoading] = (0, import_react.useState)(true);
	(0, import_react.useEffect)(() => {
		let mounted = true;
		const { data: sub } = supabase.auth.onAuthStateChange(async (_event, s) => {
			if (!mounted) return;
			setSession(s);
			if (s) {
				const { data } = await supabase.from("user_roles").select("role").eq("user_id", s.user.id);
				setRole(resolvePrimaryRole((data ?? []).map((r) => r.role)));
			} else setRole(null);
			setLoading(false);
		});
		supabase.auth.getSession().then(async ({ data }) => {
			if (!mounted) return;
			setSession(data.session);
			if (data.session) {
				const { data: r } = await supabase.from("user_roles").select("role").eq("user_id", data.session.user.id);
				setRole(resolvePrimaryRole((r ?? []).map((x) => x.role)));
			}
			setLoading(false);
		});
		return () => {
			mounted = false;
			sub.subscription.unsubscribe();
		};
	}, []);
	const can = (permission) => hasPermission(role, permission);
	return {
		session,
		user: session?.user ?? null,
		role,
		isAdmin: role === "SUPER_ADMIN" || role === "ADMIN",
		isSuperAdmin: role === "SUPER_ADMIN",
		can,
		assignedFamily: getAssignedFamily(role),
		isFamilyServant: isFamilyServant(role),
		loading,
		signOut: () => supabase.auth.signOut()
	};
}
//#endregion
export { useAuth as t };
