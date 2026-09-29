import { f as lazyRouteComponent, p as createFileRoute } from "../_libs/@tanstack/react-router+[...].mjs";
import { o as objectType, r as enumType } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/search-CJPB1n1Y.js
var $$splitComponentImporter = () => import("./search-CorMoa2f.mjs");
var searchSchema = objectType({ mode: enumType(["name", "national_id"]).optional().default("name") });
var Route = createFileRoute("/_authenticated/search")({
	head: () => ({ meta: [{ title: "البحث" }] }),
	validateSearch: (s) => searchSchema.parse(s),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };
