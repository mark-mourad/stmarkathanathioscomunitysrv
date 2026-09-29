import { f as lazyRouteComponent, p as createFileRoute } from "../_libs/@tanstack/react-router+[...].mjs";
import { c as stringType, o as objectType } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/individual._id-N8zfhcgZ.js
var $$splitComponentImporter = () => import("./individual._id-By4djZUo.mjs");
var individualSearchSchema = objectType({ highlightFamilyId: stringType().uuid().optional() });
var Route = createFileRoute("/_authenticated/individual/$id")({
	head: () => ({ meta: [{ title: "ملف المخدوم" }] }),
	validateSearch: (s) => individualSearchSchema.parse(s),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };
