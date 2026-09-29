import { i as __toESM } from "../_runtime.mjs";
import { A as redirect, _ as useRouter, c as HeadContent, d as Outlet, f as lazyRouteComponent, g as useNavigate, h as Link, m as createRootRouteWithContext, p as createFileRoute, s as Scripts, u as createRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { F as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as supabase } from "./client-CvtLKJfQ.mjs";
import { t as useAuth } from "./use-auth-DmMFHth-.mjs";
import { t as Toaster } from "../_libs/sonner.mjs";
import { n as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { r as QueryClientProvider } from "../_libs/tanstack__react-query.mjs";
import { t as Route$11 } from "./individual._id-N8zfhcgZ.mjs";
import { t as Route$12 } from "./search-CJPB1n1Y.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/router-CMuAsffW.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var styles_default = "/assets/styles-3POIF3iR.css";
var favicon_png_default = "data:image/x-icon;base64,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";
function reportLovableError(error, context = {}) {
	if (typeof window === "undefined") return;
	window.__lovableEvents?.captureException?.(error, {
		source: "react_error_boundary",
		route: window.location.pathname,
		...context
	}, {
		mechanism: "react_error_boundary",
		handled: false,
		severity: "error"
	});
}
/** Cream background from `src/styles.css` (`--background: oklch(0.952 0.034 84)`),
* resolved to hex so the manifest and meta tags stay widely supported. */
var THEME_COLOR = "#FAEED6";
function NotFoundComponent() {
	const { user, loading } = useAuth();
	const navigate = useNavigate();
	(0, import_react.useEffect)(() => {
		if (loading) return;
		if (user) navigate({ to: "/" });
	}, [
		user,
		loading,
		navigate
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-7xl font-bold text-foreground",
					children: "404"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-4 text-xl font-semibold text-foreground",
					children: "Page not found"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "The page you're looking for doesn't exist or has been moved."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: user ? "/" : "/auth",
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: user ? "Back to dashboard" : "Go home"
					})
				})
			]
		})
	});
}
function ErrorComponent({ error, reset }) {
	console.error(error);
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		reportLovableError(error, { boundary: "tanstack_root_error_component" });
	}, [error]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-xl font-semibold tracking-tight text-foreground",
					children: "This page didn't load"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "Something went wrong on our end. You can try refreshing or head back home."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 flex flex-wrap justify-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => {
							router.invalidate();
							reset();
						},
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Try again"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "/",
						className: "inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent",
						children: "Go home"
					})]
				})
			]
		})
	});
}
var Route$10 = createRootRouteWithContext()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: "كنيسة القديس مارمرقس والبابا أثناسيوس — نظام إدارة الخدمة" },
			{
				name: "description",
				content: "نظام إدارة بيانات المخدومين، أفراد الأسرة، والتحليلات المالية."
			},
			{
				property: "og:title",
				content: "كنيسة القديس مارمرقس والبابا أثناسيوس"
			},
			{
				property: "og:description",
				content: "نظام إدارة الخدمة والمخدومين"
			},
			{
				property: "og:type",
				content: "website"
			},
			{
				name: "twitter:card",
				content: "summary"
			},
			{
				name: "theme-color",
				content: THEME_COLOR
			},
			{
				name: "mobile-web-app-capable",
				content: "yes"
			}
		],
		links: [
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "icon",
				type: "image/x-icon",
				href: favicon_png_default
			},
			{
				rel: "manifest",
				href: "/manifest.webmanifest"
			},
			{
				rel: "apple-touch-icon",
				href: "/icons/apple-touch-icon.png"
			}
		]
	}),
	shellComponent: RootShell,
	component: RootComponent,
	notFoundComponent: NotFoundComponent,
	errorComponent: ErrorComponent
});
function RootShell({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "ar",
		dir: "rtl",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})] })]
	});
}
function RootComponent() {
	const { queryClient } = Route$10.useRouteContext();
	(0, import_react.useEffect)(() => {
		if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
		try {
			if (window.self !== window.top) return;
		} catch {
			return;
		}
		const register = () => {
			navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
		};
		if (document.readyState === "complete") register();
		else window.addEventListener("load", register, { once: true });
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(QueryClientProvider, {
		client: queryClient,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
			richColors: true,
			position: "top-center",
			dir: "rtl"
		})]
	});
}
var $$splitComponentImporter$9 = () => import("./auth-DjqDOD7T.mjs");
var Route$9 = createFileRoute("/auth")({
	head: () => ({ meta: [{ title: "تسجيل الدخول | كنيسة القديس مارمرقس والبابا أثناسيوس" }] }),
	beforeLoad: async () => {
		if (typeof window === "undefined") return;
		const { data } = await supabase.auth.getSession();
		if (data.session) throw redirect({ to: "/" });
	},
	component: lazyRouteComponent($$splitComponentImporter$9, "component")
});
var $$splitComponentImporter$8 = () => import("./route-Caz7jyAp.mjs");
var Route$8 = createFileRoute("/_authenticated")({
	ssr: false,
	beforeLoad: async () => {
		const { data, error } = await supabase.auth.getUser();
		if (error || !data.user) throw redirect({ to: "/auth" });
		return { user: data.user };
	},
	component: lazyRouteComponent($$splitComponentImporter$8, "component")
});
var $$splitComponentImporter$7 = () => import("../_authenticated-BzOn1xS9.mjs");
var Route$7 = createFileRoute("/_authenticated/")({
	head: () => ({ meta: [{ title: "اللوحة الرئيسية" }] }),
	component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
var $$splitComponentImporter$6 = () => import("./pharmacy-CBuNoGdj.mjs");
var Route$6 = createFileRoute("/_authenticated/pharmacy")({
	head: () => ({ meta: [{ title: "الصيدلية" }] }),
	component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
var $$splitComponentImporter$5 = () => import("./inventory-C6MczK41.mjs");
var Route$5 = createFileRoute("/_authenticated/inventory")({
	beforeLoad: async () => {
		return {};
	},
	head: () => ({ meta: [{ title: "المخزن" }] }),
	component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
var $$splitComponentImporter$4 = () => import("./furniture-CfiZam5x.mjs");
var Route$4 = createFileRoute("/_authenticated/furniture")({
	head: () => ({ meta: [{ title: "طلب ومخزن الأجهزة والأثاث" }] }),
	component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
var $$splitComponentImporter$3 = () => import("./clothes-BlOEFMfg.mjs");
var Route$3 = createFileRoute("/_authenticated/clothes")({
	head: () => ({ meta: [{ title: "ملابس الأعياد والمدارس" }] }),
	component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
var $$splitComponentImporter$2 = () => import("./blessing-distribution-CymP3_HS.mjs");
var Route$2 = createFileRoute("/_authenticated/blessing-distribution")({
	head: () => ({ meta: [{ title: "توزيع البركة" }] }),
	component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
var $$splitComponentImporter$1 = () => import("./audit-DdnokrgS.mjs");
var Route$1 = createFileRoute("/_authenticated/audit")({
	head: () => ({ meta: [{ title: "سجل النشاط" }] }),
	component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
var $$splitComponentImporter = () => import("./add-DIn_L-WK.mjs");
var Route = createFileRoute("/_authenticated/add")({
	head: () => ({ meta: [{ title: "إضافة مخدوم" }] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
var AuthRoute = Route$9.update({
	id: "/auth",
	path: "/auth",
	getParentRoute: () => Route$10
});
var AuthenticatedRouteRoute = Route$8.update({
	id: "/_authenticated",
	getParentRoute: () => Route$10
});
var AuthenticatedIndexRoute = Route$7.update({
	id: "/",
	path: "/",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedSearchRoute = Route$12.update({
	id: "/search",
	path: "/search",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedPharmacyRoute = Route$6.update({
	id: "/pharmacy",
	path: "/pharmacy",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedInventoryRoute = Route$5.update({
	id: "/inventory",
	path: "/inventory",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedFurnitureRoute = Route$4.update({
	id: "/furniture",
	path: "/furniture",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedClothesRoute = Route$3.update({
	id: "/clothes",
	path: "/clothes",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedBlessingDistributionRoute = Route$2.update({
	id: "/blessing-distribution",
	path: "/blessing-distribution",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedAuditRoute = Route$1.update({
	id: "/audit",
	path: "/audit",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedRouteRouteChildren = {
	AuthenticatedAddRoute: Route.update({
		id: "/add",
		path: "/add",
		getParentRoute: () => AuthenticatedRouteRoute
	}),
	AuthenticatedAuditRoute,
	AuthenticatedBlessingDistributionRoute,
	AuthenticatedClothesRoute,
	AuthenticatedFurnitureRoute,
	AuthenticatedInventoryRoute,
	AuthenticatedPharmacyRoute,
	AuthenticatedSearchRoute,
	AuthenticatedIndexRoute,
	AuthenticatedIndividualIdRoute: Route$11.update({
		id: "/individual/$id",
		path: "/individual/$id",
		getParentRoute: () => AuthenticatedRouteRoute
	})
};
var rootRouteChildren = {
	AuthenticatedRouteRoute: AuthenticatedRouteRoute._addFileChildren(AuthenticatedRouteRouteChildren),
	AuthRoute
};
var routeTree = Route$10._addFileChildren(rootRouteChildren)._addFileTypes();
var getRouter = () => {
	return createRouter({
		routeTree,
		context: { queryClient: new QueryClient() },
		scrollRestoration: true,
		defaultPreloadStaleTime: 0
	});
};
//#endregion
export { getRouter };
