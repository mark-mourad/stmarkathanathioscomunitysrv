import { i as TSS_SERVER_FUNCTION, l as createServerFn } from "./esm-9EjmF9OT.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-Dmuh2lU9.mjs";
import { a as numberType, c as stringType, i as literalType, n as booleanType, o as objectType, r as enumType, s as preprocessType, t as arrayType } from "../_libs/zod.mjs";
import { a as hasPermission, i as getVisibleSaintFamilyValues, n as getAssignedFamily, r as getFamilyScopeForRole, s as resolvePrimaryRole } from "./permissions-BPF-3_4x.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/church.functions-CNk3xtUk.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
function getServerRole(context) {
	return resolvePrimaryRole(context.dbRoles ?? []);
}
function requirePermission(context, permission) {
	if (!hasPermission(getServerRole(context), permission)) throw new Error("غير مصرح لك بهذا الإجراء");
}
/**
* STRICT family derivation: the family is resolved ONLY from the role mapping.
* There is deliberately NO fallback to `context.assignedFamily` or to any
* default family (e.g. Hidden Families) — a family servant can never leak into
* another family's scope even if the DB row is misconfigured.
*/
function getServerAssignedFamily(context) {
	return getAssignedFamily(getServerRole(context));
}
/** Throw unless the given saint_family is visible to the current role. */
function requireVisibleFamily(context, familyName) {
	if (!getVisibleSaintFamilyValues(getServerRole(context)).includes(familyName)) throw new Error("غير مصرح لك بهذه الأسرة");
}
var HIDDEN_FAMILIES_SECTOR = "الأسر المستترة";
var saintFamilySchema = enumType([
	"متى",
	"مرقس",
	"لوقا",
	"يوحنا",
	"أسر مستترة"
]);
/**
* STRICT role → sector guard for `dashboard_metrics`.
* - SUPER_ADMIN / ADMIN: any sector (global view).
* - Family servants: ONLY the EXACT sector mapped to their role.
* - Every other role: no sector.
*/
function isSectorAllowedForRole(sector, role) {
	if (role === "SUPER_ADMIN" || role === "ADMIN") return true;
	const scope = getFamilyScopeForRole(role);
	if (!scope) return false;
	return sector === scope.sector;
}
var INDIVIDUAL_LIST_COLUMNS = "id, full_name, nickname, national_id, phone, job, saint_family, address";
/** Map stored/UI gender values to the canonical enum used in the database. */
function normalizeGender(value) {
	if (value === "male" || value === "female") return value;
	if (typeof value !== "string") return void 0;
	const trimmed = value.trim();
	if (!trimmed) return void 0;
	const lower = trimmed.toLowerCase();
	if (lower === "male" || lower === "m") return "male";
	if (lower === "female" || lower === "f") return "female";
	if (trimmed === "ذكر") return "male";
	if (trimmed === "أنثى" || trimmed === "انثى") return "female";
}
var genderSchema = preprocessType(normalizeGender, enumType(["male", "female"], {
	required_error: "برجاء اختيار النوع",
	invalid_type_error: "برجاء اختيار النوع بشكل صحيح"
}));
var getDashboard_createServerFn_handler = createServerRpc({
	id: "1926ccdc7a5aa7add07f95de64f271605a057a885651fe98df49f3b28f9d303c",
	name: "getDashboard",
	filename: "src/lib/church.functions.ts"
}, (opts) => getDashboard.__executeServer(opts));
var getDashboard = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(getDashboard_createServerFn_handler, async ({ context }) => {
	requirePermission(context, "view:dashboard");
	const role = getServerRole(context);
	const isAdmin = role === "SUPER_ADMIN" || role === "ADMIN";
	const scope = getFamilyScopeForRole(role);
	const { data: allMetrics } = await context.supabase.from("dashboard_metrics").select("*").order("display_order", { ascending: true });
	const rows = allMetrics ?? [];
	let metrics;
	let hiddenFamilies;
	if (isAdmin) {
		metrics = rows.filter((m) => m.sector !== HIDDEN_FAMILIES_SECTOR);
		hiddenFamilies = rows.find((m) => m.sector === HIDDEN_FAMILIES_SECTOR) ?? null;
	} else if (scope) {
		metrics = rows.filter((m) => m.sector === scope.sector);
		hiddenFamilies = null;
	} else {
		metrics = [];
		hiddenFamilies = null;
	}
	let familyQuery = context.supabase.from("individuals").select("id");
	if (scope) familyQuery = familyQuery.eq("saint_family", scope.saintFamily);
	const { data: families } = await familyQuery;
	return {
		metrics,
		hiddenFamilies,
		hiddenFamiliesPersisted: hiddenFamilies !== null,
		total_families: families?.length ?? 0
	};
});
var updateMetric_createServerFn_handler = createServerRpc({
	id: "86420d89d1413b1847397af247612481d1b72c0dfaeddd27d725f098e36940c9",
	name: "updateMetric",
	filename: "src/lib/church.functions.ts"
}, (opts) => updateMetric.__executeServer(opts));
var updateMetric = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
	id: stringType().uuid(),
	monthly: numberType().nonnegative(),
	study: numberType().nonnegative(),
	therapeutic: numberType().nonnegative()
}).parse(d)).handler(updateMetric_createServerFn_handler, async ({ data, context }) => {
	requirePermission(context, "view:dashboard");
	const role = getServerRole(context);
	const { data: metric, error: fetchError } = await context.supabase.from("dashboard_metrics").select("id, sector").eq("id", data.id).maybeSingle();
	if (fetchError) throw new Error(fetchError.message);
	if (!metric) throw new Error("لم يتم العثور على القيمة");
	if (!isSectorAllowedForRole(metric.sector, role)) throw new Error("غير مصرح لك بتعديل هذه الأسرة");
	const { error } = await context.supabase.from("dashboard_metrics").update({
		monthly: data.monthly,
		study: data.study,
		therapeutic: data.therapeutic,
		updated_by: context.userId
	}).eq("id", data.id);
	if (error) throw new Error(error.message);
	return { ok: true };
});
var saveHiddenFamiliesMetric_createServerFn_handler = createServerRpc({
	id: "4c986a0ee72bc79854c00b833ddcb4df3bd3710d60563ed11fb3c4ad5d1136c2",
	name: "saveHiddenFamiliesMetric",
	filename: "src/lib/church.functions.ts"
}, (opts) => saveHiddenFamiliesMetric.__executeServer(opts));
var saveHiddenFamiliesMetric = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
	monthly: numberType().nonnegative(),
	study: numberType().nonnegative(),
	therapeutic: numberType().nonnegative()
}).parse(d)).handler(saveHiddenFamiliesMetric_createServerFn_handler, async ({ data, context }) => {
	requirePermission(context, "view:dashboard");
	const role = getServerRole(context);
	if (!(role === "SUPER_ADMIN" || role === "ADMIN") && role !== "ST_HIDDEN_FAMILIES") throw new Error("غير مصرح لك بتعديل الأسر المستترة");
	const { data: existing } = await context.supabase.from("dashboard_metrics").select("id").eq("sector", HIDDEN_FAMILIES_SECTOR).maybeSingle();
	if (existing) {
		const { error } = await context.supabase.from("dashboard_metrics").update({
			monthly: data.monthly,
			study: data.study,
			therapeutic: data.therapeutic,
			updated_by: context.userId
		}).eq("id", existing.id);
		if (error) throw new Error(error.message);
		return { id: existing.id };
	}
	const { data: created, error } = await context.supabase.from("dashboard_metrics").insert({
		sector: HIDDEN_FAMILIES_SECTOR,
		monthly: data.monthly,
		study: data.study,
		therapeutic: data.therapeutic,
		display_order: 0,
		updated_by: context.userId
	}).select("id").single();
	if (error || !created) throw new Error(error?.message ?? "فشل الحفظ");
	return { id: created.id };
});
var searchIndividuals_createServerFn_handler = createServerRpc({
	id: "c42c6bb358cb8d8ecdbf45d1d0868e6d2968f7cf666e34195d981523f603e62d",
	name: "searchIndividuals",
	filename: "src/lib/church.functions.ts"
}, (opts) => searchIndividuals.__executeServer(opts));
var searchIndividuals = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
	mode: enumType(["name", "national_id"]),
	q: stringType().min(1)
}).parse(d)).handler(searchIndividuals_createServerFn_handler, async ({ data, context }) => {
	const assignedFamily = getServerAssignedFamily(context);
	const q = data.q.trim();
	let individualQuery;
	let familyQuery;
	if (data.mode === "name") {
		individualQuery = context.supabase.from("individuals").select(INDIVIDUAL_LIST_COLUMNS).or(`full_name.ilike.%${q}%,nickname.ilike.%${q}%`).limit(50);
		if (assignedFamily) individualQuery = individualQuery.eq("saint_family", assignedFamily);
		familyQuery = context.supabase.from("family_members").select("id, full_name, national_id, relation, individual_id").ilike("full_name", `%${q}%`).limit(50);
	} else {
		const cleanNationalId = q.replace(/\D/g, "");
		individualQuery = context.supabase.from("individuals").select(INDIVIDUAL_LIST_COLUMNS).or(`national_id.eq.${cleanNationalId},national_id.ilike.%${cleanNationalId}%`).limit(50);
		familyQuery = context.supabase.from("family_members").select("id, full_name, national_id, relation, individual_id").or(`national_id.eq.${cleanNationalId},national_id.ilike.%${cleanNationalId}%`).limit(50);
	}
	const [{ data: individualRows, error: individualError }, { data: familyRows, error: familyError }] = await Promise.all([individualQuery, familyQuery]);
	if (individualError) throw new Error(`خطأ في البحث: ${individualError.message}`);
	if (familyError) throw new Error(`خطأ في البحث: ${familyError.message}`);
	const individuals = (individualRows ?? []).map((row) => ({
		type: "individual",
		id: row.id,
		full_name: row.full_name,
		nickname: row.nickname,
		national_id: row.national_id,
		phone: row.phone,
		job: row.job,
		saint_family: row.saint_family,
		address: row.address
	}));
	const familyResults = familyRows ?? [];
	const individualIds = [...new Set(familyResults.map((row) => row.individual_id))];
	const { data: familyIndividuals, error: familyIndividualsError } = individualIds.length > 0 ? await context.supabase.from("individuals").select(INDIVIDUAL_LIST_COLUMNS).in("id", individualIds) : {
		data: [],
		error: null
	};
	if (familyIndividualsError) throw new Error(`خطأ في جلب بيانات الأسرة: ${familyIndividualsError.message}`);
	const individualMap = (familyIndividuals ?? []).reduce((map, item) => ({
		...map,
		[item.id]: item
	}), {});
	const familySearchResults = familyResults.map((row) => {
		const individual = individualMap[row.individual_id];
		return {
			type: "family",
			id: row.individual_id,
			highlightFamilyId: row.id,
			full_name: individual?.full_name ?? "",
			nickname: individual?.nickname,
			national_id: individual?.national_id,
			phone: individual?.phone,
			job: individual?.job,
			saint_family: individual?.saint_family ?? null,
			address: individual?.address ?? null,
			family_full_name: row.full_name,
			family_relation: row.relation
		};
	});
	return [...individuals, ...familySearchResults].slice(0, 50);
});
var getAllGuests_createServerFn_handler = createServerRpc({
	id: "5b850a436fa317440a4d4d1815135067970f5d8242c9ac351e46c27aee0f0f55",
	name: "getAllGuests",
	filename: "src/lib/church.functions.ts"
}, (opts) => getAllGuests.__executeServer(opts));
var getAllGuests = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ saint_family: saintFamilySchema.optional() }).parse(d ?? {})).handler(getAllGuests_createServerFn_handler, async ({ data, context }) => {
	const saintFamily = getServerAssignedFamily(context) ?? data.saint_family;
	try {
		let individualQuery = context.supabase.from("individuals").select(INDIVIDUAL_LIST_COLUMNS).order("full_name", { ascending: true }).limit(500);
		if (saintFamily) individualQuery = individualQuery.eq("saint_family", saintFamily);
		const { data: individualRows, error: individualsError } = await individualQuery;
		if (individualsError) {
			console.error("[getAllGuests] Database error fetching individuals:", {
				saint_family: saintFamily,
				code: individualsError.code,
				message: individualsError.message,
				details: individualsError.details
			});
			throw new Error(`خطأ في جلب المخدومين: ${individualsError.message}`);
		}
		const individuals = (individualRows ?? []).map((row) => ({
			type: "individual",
			id: row.id,
			full_name: row.full_name,
			nickname: row.nickname,
			national_id: row.national_id,
			phone: row.phone,
			job: row.job,
			saint_family: row.saint_family,
			address: row.address
		}));
		const individualMap = (individualRows ?? []).reduce((map, item) => ({
			...map,
			[item.id]: item
		}), {});
		let familyQuery = context.supabase.from("family_members").select("id, full_name, national_id, relation, individual_id").order("created_at", { ascending: false }).limit(500);
		if (saintFamily) {
			const filteredIds = (individualRows ?? []).map((row) => row.id);
			if (filteredIds.length === 0) return individuals;
			familyQuery = familyQuery.in("individual_id", filteredIds);
		}
		const { data: familyRows, error: familyError } = await familyQuery;
		if (familyError) {
			console.error("[getAllGuests] Database error fetching family members:", {
				saint_family: saintFamily,
				code: familyError.code,
				message: familyError.message,
				details: familyError.details
			});
			throw new Error(`خطأ في جلب أفراد الأسرة: ${familyError.message}`);
		}
		if (!saintFamily) {
			const missingIds = [...new Set((familyRows ?? []).map((row) => row.individual_id))].filter((id) => !individualMap[id]);
			if (missingIds.length > 0) {
				const { data: familyIndividuals, error: familyIndividualsError } = await context.supabase.from("individuals").select(INDIVIDUAL_LIST_COLUMNS).in("id", missingIds);
				if (familyIndividualsError) {
					console.error("[getAllGuests] Database error fetching family individuals:", {
						code: familyIndividualsError.code,
						message: familyIndividualsError.message,
						details: familyIndividualsError.details
					});
					throw new Error(`خطأ في جلب بيانات أفراد الأسرة: ${familyIndividualsError.message}`);
				}
				for (const item of familyIndividuals ?? []) individualMap[item.id] = item;
			}
		}
		const familySearchResults = (familyRows ?? []).map((row) => {
			const individual = individualMap[row.individual_id];
			return {
				type: "family",
				id: row.individual_id,
				highlightFamilyId: row.id,
				full_name: individual?.full_name ?? "",
				nickname: individual?.nickname,
				national_id: individual?.national_id,
				phone: individual?.phone,
				job: individual?.job,
				saint_family: individual?.saint_family ?? null,
				address: individual?.address ?? null,
				family_full_name: row.full_name,
				family_relation: row.relation
			};
		});
		return [...individuals, ...familySearchResults].slice(0, 500);
	} catch (error) {
		console.error("[getAllGuests] Unexpected error:", error);
		throw new Error(error instanceof Error ? error.message : "خطأ في جلب الضيوف");
	}
});
var EXPORT_INDIVIDUAL_COLUMNS = "id, full_name, nickname, gender, mother_name, national_id, birth_date, job, salary, phone, mobile, landline, confession_father, saint_family, address, household_count, housing_type, rooms, has_washing_machine, has_fridge, has_stove, has_mattress, has_computer, has_sofa, has_dining, has_tv, has_wardrobe, has_alt_address, alt_address, alt_governorate";
var getExportData_createServerFn_handler = createServerRpc({
	id: "bd083edf462ed5842857da04423f4d82f348a1aa82841c9c34354d64bfb0c087",
	name: "getExportData",
	filename: "src/lib/church.functions.ts"
}, (opts) => getExportData.__executeServer(opts));
var getExportData = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ saint_family: saintFamilySchema.optional() }).parse(d ?? {})).handler(getExportData_createServerFn_handler, async ({ data, context }) => {
	const saintFamily = getServerAssignedFamily(context) ?? data.saint_family;
	let individualQuery = context.supabase.from("individuals").select(EXPORT_INDIVIDUAL_COLUMNS).order("full_name", { ascending: true }).limit(500);
	if (saintFamily) individualQuery = individualQuery.eq("saint_family", saintFamily);
	const { data: individualRows, error: individualsError } = await individualQuery;
	if (individualsError) throw new Error(`خطأ في جلب المخدومين: ${individualsError.message}`);
	const individualIds = (individualRows ?? []).map((r) => r.id);
	let familyQuery = context.supabase.from("family_members").select("id, full_name, national_id, relation, individual_id").order("created_at", { ascending: false }).limit(500);
	if (saintFamily && individualIds.length > 0) familyQuery = familyQuery.in("individual_id", individualIds);
	let financialsQuery = context.supabase.from("financials").select("*").limit(500);
	if (saintFamily && individualIds.length > 0) financialsQuery = financialsQuery.in("individual_id", individualIds);
	let churchSupportQuery = context.supabase.from("monthly_church_support").select("individual_id, church_name, amount").limit(500);
	if (saintFamily && individualIds.length > 0) churchSupportQuery = churchSupportQuery.in("individual_id", individualIds);
	const [{ data: familyRows }, { data: financialsRows }, { data: churchSupportRows }] = await Promise.all([
		familyQuery,
		financialsQuery,
		churchSupportQuery
	]);
	const financialsMap = {};
	(financialsRows ?? []).forEach((f) => {
		financialsMap[f.individual_id] = f;
	});
	const churchSupportMap = {};
	(churchSupportRows ?? []).forEach((cs) => {
		if (!churchSupportMap[cs.individual_id]) churchSupportMap[cs.individual_id] = {
			total: 0,
			details: ""
		};
		churchSupportMap[cs.individual_id].total += Number(cs.amount || 0);
		const parts = churchSupportMap[cs.individual_id].details ? [churchSupportMap[cs.individual_id].details] : [];
		parts.push(`${cs.church_name}: ${Number(cs.amount || 0)}`);
		churchSupportMap[cs.individual_id].details = parts.join("، ");
	});
	const familyByIndividual = {};
	(familyRows ?? []).forEach((fm) => {
		if (!familyByIndividual[fm.individual_id]) familyByIndividual[fm.individual_id] = [];
		familyByIndividual[fm.individual_id].push({
			full_name: fm.full_name,
			relation: fm.relation ?? ""
		});
	});
	return {
		individuals: individualRows ?? [],
		familyByIndividual,
		financialsMap,
		churchSupportMap
	};
});
var getIndividual_createServerFn_handler = createServerRpc({
	id: "5d8714a18ea31853e44852574ac05b2ac4e8e6f1d9597ef4bead9c36c7ce4201",
	name: "getIndividual",
	filename: "src/lib/church.functions.ts"
}, (opts) => getIndividual.__executeServer(opts));
var getIndividual = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ id: stringType().uuid() }).parse(d)).handler(getIndividual_createServerFn_handler, async ({ data, context }) => {
	if (!hasPermission(getServerRole(context), "view:beneficiary")) throw new Error("غير مصرح لك بعرض بيانات المخدومين");
	const [{ data: ind }, { data: fam }, { data: fin }, { data: churchSupport }] = await Promise.all([
		context.supabase.from("individuals").select("*").eq("id", data.id).maybeSingle(),
		context.supabase.from("family_members").select("*").eq("individual_id", data.id).order("seq", { ascending: true }),
		context.supabase.from("financials").select("*").eq("individual_id", data.id).maybeSingle(),
		context.supabase.from("monthly_church_support").select("*").eq("individual_id", data.id)
	]);
	if (!ind) throw new Error("لم يتم العثور على المخدوم");
	const assignedFamily = getServerAssignedFamily(context);
	if (assignedFamily && ind.saint_family !== assignedFamily) throw new Error("غير مصرح لك بعرض هذا الملف");
	return {
		individual: ind,
		family: fam ?? [],
		financials: fin,
		churchSupport: churchSupport ?? []
	};
});
var individualSchema = objectType({
	full_name: stringType().min(1),
	nickname: stringType().optional().nullable(),
	mother_name: stringType().optional().nullable(),
	gender: genderSchema,
	national_id: stringType().optional().nullable(),
	birth_date: stringType().optional().nullable(),
	birth_governorate: stringType().optional().nullable(),
	job: stringType().optional().nullable(),
	salary: numberType().optional().nullable(),
	phone: stringType().optional().nullable(),
	mobile: stringType().optional().nullable(),
	landline: stringType().optional().nullable(),
	confession_father: stringType().optional().nullable(),
	saint_family: saintFamilySchema,
	address: stringType().optional().nullable(),
	household_count: numberType().int().optional().nullable(),
	housing_type: stringType().optional().nullable(),
	rooms: numberType().int().optional().nullable(),
	has_washing_machine: booleanType().optional(),
	has_fridge: booleanType().optional(),
	has_stove: booleanType().optional(),
	has_mattress: booleanType().optional(),
	has_computer: booleanType().optional(),
	has_sofa: booleanType().optional(),
	has_dining: booleanType().optional(),
	has_tv: booleanType().optional(),
	has_wardrobe: booleanType().optional(),
	has_alt_address: booleanType().optional(),
	alt_address: stringType().optional().nullable(),
	alt_governorate: stringType().optional().nullable(),
	family: arrayType(objectType({
		id: stringType().uuid().optional(),
		full_name: stringType().min(1),
		national_id: stringType().optional().nullable(),
		relation: stringType().optional().nullable(),
		insurance_number: stringType().optional().nullable(),
		marital_status: stringType().optional().nullable(),
		confession_father: stringType().optional().nullable(),
		school_or_job: stringType().optional().nullable(),
		income: numberType().optional().nullable(),
		notes: stringType().optional().nullable()
	})).optional(),
	financials: objectType({
		church_monthly: numberType().optional(),
		therapeutic_aid: numberType().optional(),
		study_aid: numberType().optional(),
		basic_salary: numberType().optional(),
		extra_income: numberType().optional(),
		electricity_gas_water: numberType().optional(),
		phone_bill: numberType().optional(),
		rent: numberType().optional(),
		treatment_cost: numberType().optional(),
		education_cost: numberType().optional()
	}).optional(),
	churchSupport: arrayType(objectType({
		id: stringType().uuid().optional(),
		church_name: stringType().min(1),
		amount: numberType()
	})).optional()
});
var createIndividual_createServerFn_handler = createServerRpc({
	id: "9acd3e89294b7e8a670df2e5cf48edb3296dbe1277e12f68ad26e2dcc3211b69",
	name: "createIndividual",
	filename: "src/lib/church.functions.ts"
}, (opts) => createIndividual.__executeServer(opts));
var createIndividual = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => individualSchema.parse(d)).handler(createIndividual_createServerFn_handler, async ({ data, context }) => {
	requirePermission(context, "add:beneficiary");
	const { family, financials, churchSupport, ...ind } = data;
	const assignedFamily = getServerAssignedFamily(context);
	if (assignedFamily && ind.saint_family !== assignedFamily) throw new Error("غير مصرح لك بإضافة مخدومين من هذه الأسرة");
	if (ind.national_id) {
		ind.national_id = ind.national_id.trim();
		if (!/^\d{14}$/.test(ind.national_id)) throw new Error("الرقم القومي يجب أن يكون 14 رقم بالضبط");
		const { data: existing, error: checkError } = await context.supabase.from("individuals").select("id").eq("national_id", ind.national_id).maybeSingle();
		if (checkError) throw new Error("خطأ في التحقق من الرقم القومي");
		if (existing) throw new Error("الرقم القومي موجود بالفعل في النظام");
	}
	const { data: created, error } = await context.supabase.from("individuals").insert({
		...ind,
		created_by: context.userId
	}).select("id").single();
	if (error || !created) throw new Error(error?.message ?? "فشل الحفظ");
	if (family?.length) {
		const rows = family.map((f, i) => ({
			...f,
			seq: i + 1,
			individual_id: created.id
		}));
		await context.supabase.from("family_members").insert(rows);
	}
	if (financials) await context.supabase.from("financials").insert({
		...financials,
		individual_id: created.id
	});
	if (churchSupport?.length) {
		const supportRows = churchSupport.map((cs) => ({
			...cs,
			individual_id: created.id
		}));
		await context.supabase.from("monthly_church_support").insert(supportRows);
	}
	return { id: created.id };
});
var updateIndividual_createServerFn_handler = createServerRpc({
	id: "cfc8374315c1b355e72ea0dafc45a7c902195e43304d68942c5ba5d01e878708",
	name: "updateIndividual",
	filename: "src/lib/church.functions.ts"
}, (opts) => updateIndividual.__executeServer(opts));
var updateIndividual = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => individualSchema.extend({ id: stringType().uuid() }).parse(d)).handler(updateIndividual_createServerFn_handler, async ({ data, context }) => {
	requirePermission(context, "edit:beneficiary");
	const { id, family, financials, churchSupport, ...ind } = data;
	const assignedFamily = getServerAssignedFamily(context);
	if (assignedFamily) {
		const { data: existing, error: scopeError } = await context.supabase.from("individuals").select("id, saint_family").eq("id", id).maybeSingle();
		if (scopeError) throw new Error(scopeError.message);
		if (!existing) throw new Error("لم يتم العثور على المخدوم");
		if (existing.saint_family !== assignedFamily) throw new Error("غير مصرح لك بتعديل مخدومين من هذه الأسرة");
		if (ind.saint_family !== assignedFamily) throw new Error("غير مصرح لك بتعديل هذه الأسرة");
	}
	if (ind.national_id) {
		ind.national_id = ind.national_id.trim();
		if (!/^\d{14}$/.test(ind.national_id)) throw new Error("الرقم القومي يجب أن يكون 14 رقم بالضبط");
		const { data: existing, error: checkError } = await context.supabase.from("individuals").select("id").eq("national_id", ind.national_id).neq("id", id).maybeSingle();
		if (checkError) throw new Error("خطأ في التحقق من الرقم القومي");
		if (existing) throw new Error("الرقم القومي موجود بالفعل في النظام لشخص آخر");
	}
	const { error: indErr } = await context.supabase.from("individuals").update(ind).eq("id", id);
	if (indErr) throw new Error(indErr.message);
	const submittedFamily = family ?? [];
	const { data: existingFamily } = await context.supabase.from("family_members").select("id").eq("individual_id", id);
	const existingFamilyIds = new Set((existingFamily ?? []).map((r) => r.id));
	const submittedFamilyIds = submittedFamily.map((f) => f.id).filter((fid) => Boolean(fid));
	const removedFamilyIds = [...existingFamilyIds].filter((existingId) => !submittedFamilyIds.includes(existingId));
	if (removedFamilyIds.length > 0) {
		const { error: famDelErr } = await context.supabase.from("family_members").delete().in("id", removedFamilyIds);
		if (famDelErr) throw new Error(famDelErr.message);
	}
	let seq = 1;
	for (const f of submittedFamily) {
		const { id: famId, ...familyFields } = f;
		if (famId && existingFamilyIds.has(famId)) {
			const { error: famUpdErr } = await context.supabase.from("family_members").update({
				...familyFields,
				seq: seq++
			}).eq("id", famId);
			if (famUpdErr) throw new Error(famUpdErr.message);
		} else {
			const { error: famInsErr } = await context.supabase.from("family_members").insert({
				...familyFields,
				seq: seq++,
				individual_id: id
			});
			if (famInsErr) throw new Error(famInsErr.message);
		}
	}
	if (financials) {
		const { data: existing } = await context.supabase.from("financials").select("id").eq("individual_id", id).maybeSingle();
		if (existing) {
			const { error: finErr } = await context.supabase.from("financials").update(financials).eq("individual_id", id);
			if (finErr) throw new Error(finErr.message);
		} else {
			const { error: finErr } = await context.supabase.from("financials").insert({
				...financials,
				individual_id: id
			});
			if (finErr) throw new Error(finErr.message);
		}
	}
	const submittedSupport = churchSupport ?? [];
	const { data: existingSupport } = await context.supabase.from("monthly_church_support").select("id").eq("individual_id", id);
	const existingSupportIds = new Set((existingSupport ?? []).map((r) => r.id));
	const submittedSupportIds = submittedSupport.map((cs) => cs.id).filter((cid) => Boolean(cid));
	const removedSupportIds = [...existingSupportIds].filter((existingId) => !submittedSupportIds.includes(existingId));
	if (removedSupportIds.length > 0) {
		const { error: supportDelErr } = await context.supabase.from("monthly_church_support").delete().in("id", removedSupportIds);
		if (supportDelErr) throw new Error(supportDelErr.message);
	}
	for (const cs of submittedSupport) {
		const { id: supportId, ...supportFields } = cs;
		if (supportId && existingSupportIds.has(supportId)) {
			const { error: supportUpdErr } = await context.supabase.from("monthly_church_support").update(supportFields).eq("id", supportId);
			if (supportUpdErr) throw new Error(supportUpdErr.message);
		} else {
			const { error: supportInsErr } = await context.supabase.from("monthly_church_support").insert({
				...supportFields,
				individual_id: id
			});
			if (supportInsErr) throw new Error(supportInsErr.message);
		}
	}
	return { id };
});
var deleteIndividual_createServerFn_handler = createServerRpc({
	id: "0dee60ffa14ee03f3fac0c58900d1f97aeec53ea8eb065c8c3b3475e9ae038f1",
	name: "deleteIndividual",
	filename: "src/lib/church.functions.ts"
}, (opts) => deleteIndividual.__executeServer(opts));
var deleteIndividual = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ id: stringType().uuid() }).parse(d)).handler(deleteIndividual_createServerFn_handler, async ({ data, context }) => {
	requirePermission(context, "delete:beneficiary");
	const { error } = await context.supabase.from("individuals").delete().eq("id", data.id);
	if (error) throw new Error(error.message);
	return { ok: true };
});
var getAuditLog_createServerFn_handler = createServerRpc({
	id: "0cb1d27cf46c52b659eee6ce610cf4465fa7b9fd7e186b0d7aacd16e4a5aff88",
	name: "getAuditLog",
	filename: "src/lib/church.functions.ts"
}, (opts) => getAuditLog.__executeServer(opts));
var getAuditLog = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(getAuditLog_createServerFn_handler, async ({ context }) => {
	requirePermission(context, "view:audit");
	const { data, error } = await context.supabase.from("audit_log").select("id, user_email, action, table_name, record_id, created_at").order("created_at", { ascending: false }).limit(200);
	if (error) throw new Error(error.message);
	return data ?? [];
});
var deleteAuditLog_createServerFn_handler = createServerRpc({
	id: "0be259a69a0fa1e14833ac0d87976e0059a50b4fcd3cc719a0cbb493ce22df7f",
	name: "deleteAuditLog",
	filename: "src/lib/church.functions.ts"
}, (opts) => deleteAuditLog.__executeServer(opts));
var deleteAuditLog = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(deleteAuditLog_createServerFn_handler, async ({ context }) => {
	requirePermission(context, "view:audit");
	const { supabaseAdmin } = await import("./client.server-DNqj6dJC.mjs");
	const { error } = await supabaseAdmin.from("audit_log").delete().gt("id", 0);
	if (error) throw new Error(error.message);
	return { ok: true };
});
var getInventory_createServerFn_handler = createServerRpc({
	id: "c09670fa1c9c76962d58aa8a4b204c9eced7bb6b9c5a2f71917e5ad9cab569ac",
	name: "getInventory",
	filename: "src/lib/church.functions.ts"
}, (opts) => getInventory.__executeServer(opts));
var getInventory = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(getInventory_createServerFn_handler, async ({ context }) => {
	const { data, error } = await context.supabase.from("inventory").select("*").order("created_at", { ascending: false }).limit(1).maybeSingle();
	if (error) throw new Error(error.message);
	return data;
});
var updateInventory_createServerFn_handler = createServerRpc({
	id: "fc9abc78203fd36070e1c412990ff11b2092aac8d1e61966d39672086e32742a",
	name: "updateInventory",
	filename: "src/lib/church.functions.ts"
}, (opts) => updateInventory.__executeServer(opts));
var updateInventory = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
	weekly_total: numberType().int().nonnegative(),
	details: stringType().optional().nullable()
}).parse(d)).handler(updateInventory_createServerFn_handler, async ({ data, context }) => {
	requirePermission(context, "manage:inventory");
	const { data: existing } = await context.supabase.from("inventory").select("id").order("created_at", { ascending: false }).limit(1).maybeSingle();
	if (existing) {
		const { data: updated, error } = await context.supabase.from("inventory").update({
			weekly_total: data.weekly_total,
			details: data.details,
			updated_by: context.userId
		}).eq("id", existing.id).select("id, weekly_total").maybeSingle();
		if (error) throw new Error(error.message);
		if (!updated) throw new Error("تعذر حفظ البركة: لم يتم تحديث أي صف في قاعدة البيانات (تحقق من الصلاحيات)");
		return { id: updated.id };
	} else {
		const { data: created, error } = await context.supabase.from("inventory").insert({
			weekly_total: data.weekly_total,
			details: data.details,
			updated_by: context.userId
		}).select("id").single();
		if (error || !created) throw new Error(error?.message ?? "فشل الحفظ");
		return { id: created.id };
	}
});
var getIndividualsBySaintFamily_createServerFn_handler = createServerRpc({
	id: "ab188b9dad0141b97a8cbf6a31e9c32f0c1d3157b6d0652f37dcedeb52a4a3ca",
	name: "getIndividualsBySaintFamily",
	filename: "src/lib/church.functions.ts"
}, (opts) => getIndividualsBySaintFamily.__executeServer(opts));
var getIndividualsBySaintFamily = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ saint_family: saintFamilySchema }).parse(d)).handler(getIndividualsBySaintFamily_createServerFn_handler, async ({ data, context }) => {
	const assignedFamily = getServerAssignedFamily(context);
	const saintFamily = assignedFamily ?? data.saint_family;
	if (assignedFamily && assignedFamily !== data.saint_family) throw new Error("غير مصرح لك بهذه الأسرة");
	try {
		const { data: individuals, error } = await context.supabase.from("individuals").select("id, full_name, nickname, national_id").eq("saint_family", saintFamily).order("full_name", { ascending: true });
		if (error) {
			console.error("[getIndividualsBySaintFamily] Database error:", {
				saint_family: data.saint_family,
				code: error.code,
				message: error.message,
				details: error.details
			});
			throw new Error(`خطأ في جلب المخدومين لأسرة ${data.saint_family}: ${error.message}`);
		}
		return individuals ?? [];
	} catch (err) {
		console.error("[getIndividualsBySaintFamily] Unexpected error:", err);
		throw err;
	}
});
var getBlessingDistribution_createServerFn_handler = createServerRpc({
	id: "8a8a29ffdbdb3fec0eb44e2bca7875c665a9405d006a258cef3b52a6d4b1b396",
	name: "getBlessingDistribution",
	filename: "src/lib/church.functions.ts"
}, (opts) => getBlessingDistribution.__executeServer(opts));
var getBlessingDistribution = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
	saint_family: saintFamilySchema,
	distribution_date: stringType().optional()
}).parse(d)).handler(getBlessingDistribution_createServerFn_handler, async ({ data, context }) => {
	const assignedFamily = getServerAssignedFamily(context);
	const saintFamily = assignedFamily ?? data.saint_family;
	if (assignedFamily && assignedFamily !== data.saint_family) throw new Error("غير مصرح لك بهذه الأسرة");
	try {
		const date = data.distribution_date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
		const { data: records, error } = await context.supabase.from("blessing_distribution").select("*").eq("saint_family", saintFamily).eq("distribution_date", date);
		if (error) {
			console.error("[getBlessingDistribution] Database error:", {
				saint_family: data.saint_family,
				distribution_date: date,
				code: error.code,
				message: error.message,
				details: error.details
			});
			throw new Error(`خطأ في جلب توزيع البركة: ${error.message}`);
		}
		return records ?? [];
	} catch (err) {
		console.error("[getBlessingDistribution] Unexpected error:", err);
		throw err;
	}
});
var saveBlessingDistribution_createServerFn_handler = createServerRpc({
	id: "b5ed50e34bb0d117a0270670f6e5546b093bfc3003a1eaec882da92717642451",
	name: "saveBlessingDistribution",
	filename: "src/lib/church.functions.ts"
}, (opts) => saveBlessingDistribution.__executeServer(opts));
var saveBlessingDistribution = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
	saint_family: saintFamilySchema,
	distribution_date: stringType().optional(),
	received_individuals: arrayType(stringType().uuid())
}).parse(d)).handler(saveBlessingDistribution_createServerFn_handler, async ({ data, context }) => {
	if (!hasPermission(getServerRole(context), "view:blessing-distribution")) throw new Error("غير مصرح لك بتوزيع البركة");
	const assignedFamily = getServerAssignedFamily(context);
	if (assignedFamily && assignedFamily !== data.saint_family) throw new Error("غير مصرح لك بهذه الأسرة");
	const date = data.distribution_date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
	const { data: inventory, error: inventoryError } = await context.supabase.from("inventory").select("*").order("created_at", { ascending: false }).limit(1).maybeSingle();
	if (inventoryError) throw new Error(inventoryError.message);
	if (!inventory) throw new Error("يرجى إعداد المخزون أولاً");
	const { data: existingRecords, error: existingError } = await context.supabase.from("blessing_distribution").select("*").eq("saint_family", data.saint_family).eq("distribution_date", date);
	if (existingError) throw new Error(existingError.message);
	const previousCount = (existingRecords ?? []).filter((r) => r.received).length;
	const difference = data.received_individuals.length - previousCount;
	if (difference > 0 && inventory.weekly_total < difference) throw new Error(`المخزون غير كافٍ. المطلوب: ${difference}، المتاح: ${inventory.weekly_total}`);
	const { data: individuals, error: individualsError } = await context.supabase.from("individuals").select("id").eq("saint_family", data.saint_family);
	if (individualsError) throw new Error(individualsError.message);
	const recordsToUpsert = (individuals ?? []).map((i) => i.id).map((individualId) => ({
		saint_family: data.saint_family,
		individual_id: individualId,
		received: data.received_individuals.includes(individualId),
		distribution_date: date,
		created_by: context.userId
	}));
	const { error: upsertError } = await context.supabase.from("blessing_distribution").upsert(recordsToUpsert, {
		onConflict: "saint_family,individual_id,distribution_date",
		ignoreDuplicates: false
	});
	if (upsertError) throw new Error(upsertError.message);
	const { data: updatedInventory, error: updateInventoryError } = await context.supabase.from("inventory").update({
		weekly_total: inventory.weekly_total - difference,
		updated_by: context.userId
	}).eq("id", inventory.id).select("id").maybeSingle();
	if (updateInventoryError) throw new Error(updateInventoryError.message);
	if (!updatedInventory) throw new Error("تعذر تحديث المخزون: لم يتم تحديث أي صف (تحقق من الصلاحيات)");
	return {
		ok: true,
		new_inventory_total: inventory.weekly_total - difference
	};
});
var scanBlessingDistribution_createServerFn_handler = createServerRpc({
	id: "65d7da866a703323d5fc64941566d5c8168a5b9a468e1d2223e86ba05aaeb1b6",
	name: "scanBlessingDistribution",
	filename: "src/lib/church.functions.ts"
}, (opts) => scanBlessingDistribution.__executeServer(opts));
var scanBlessingDistribution = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ national_id: stringType().min(1) }).parse(d)).handler(scanBlessingDistribution_createServerFn_handler, async ({ data, context }) => {
	if (!hasPermission(getServerRole(context), "view:blessing-distribution")) throw new Error("غير مصرح لك بتوزيع البركة");
	const nationalId = data.national_id.trim();
	const date = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
	const { data: individual, error: indError } = await context.supabase.from("individuals").select("id, full_name, saint_family").eq("national_id", nationalId).maybeSingle();
	if (indError) throw new Error(indError.message);
	if (!individual) throw new Error("لم يتم العثور على مخدوم بهذا الرقم القومي");
	if (!individual.saint_family) throw new Error("هذا المخدوم غير مسجل في أي أسرة قديس");
	const assignedFamily = getServerAssignedFamily(context);
	if (assignedFamily && assignedFamily !== individual.saint_family) throw new Error("غير مصرح لك بهذه الأسرة");
	const { data: inventory, error: inventoryError } = await context.supabase.from("inventory").select("*").order("created_at", { ascending: false }).limit(1).maybeSingle();
	if (inventoryError) throw new Error(inventoryError.message);
	if (!inventory) throw new Error("يرجى إعداد المخزون أولاً");
	const { data: existing, error: existError } = await context.supabase.from("blessing_distribution").select("id, received").eq("saint_family", individual.saint_family).eq("individual_id", individual.id).eq("distribution_date", date).maybeSingle();
	if (existError) throw new Error(existError.message);
	if (existing?.received) throw new Error(`${individual.full_name} استلم البركة بالفعل`);
	if (inventory.weekly_total < 1) throw new Error("المخزون غير كافٍ");
	const { error: upsertError } = await context.supabase.from("blessing_distribution").upsert({
		saint_family: individual.saint_family,
		individual_id: individual.id,
		received: true,
		distribution_date: date,
		distributed_at: (/* @__PURE__ */ new Date()).toISOString(),
		created_by: context.userId
	}, {
		onConflict: "saint_family,individual_id,distribution_date",
		ignoreDuplicates: false
	});
	if (upsertError) throw new Error(upsertError.message);
	const { data: updatedInventory, error: updateInvError } = await context.supabase.from("inventory").update({
		weekly_total: inventory.weekly_total - 1,
		updated_by: context.userId
	}).eq("id", inventory.id).select("id").maybeSingle();
	if (updateInvError) throw new Error(updateInvError.message);
	if (!updatedInventory) throw new Error("تعذر تحديث المخزون: لم يتم تحديث أي صف (تحقق من الصلاحيات)");
	return {
		ok: true,
		individual_name: individual.full_name,
		new_inventory_total: inventory.weekly_total - 1
	};
});
var toggleBlessingDistribution_createServerFn_handler = createServerRpc({
	id: "b7c3003a2dea1d2588de7d889333eaafd53611e5b757964dfc76428fc5685c17",
	name: "toggleBlessingDistribution",
	filename: "src/lib/church.functions.ts"
}, (opts) => toggleBlessingDistribution.__executeServer(opts));
var toggleBlessingDistribution = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
	saint_family: saintFamilySchema,
	individual_id: stringType().uuid(),
	distribution_date: stringType().optional()
}).parse(d)).handler(toggleBlessingDistribution_createServerFn_handler, async ({ data, context }) => {
	if (!hasPermission(getServerRole(context), "view:blessing-distribution")) throw new Error("غير مصرح لك بتوزيع البركة");
	const assignedFamily = getServerAssignedFamily(context);
	if (assignedFamily && assignedFamily !== data.saint_family) throw new Error("غير مصرح لك بهذه الأسرة");
	const date = data.distribution_date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
	const { data: individual, error: indError } = await context.supabase.from("individuals").select("id, full_name, saint_family").eq("id", data.individual_id).maybeSingle();
	if (indError) throw new Error(indError.message);
	if (!individual) throw new Error("لم يتم العثور على المخدوم");
	if (individual.saint_family !== data.saint_family) throw new Error("هذا المخدوم غير مسجل في هذه الأسرة");
	const { data: existing, error: existError } = await context.supabase.from("blessing_distribution").select("id, received").eq("saint_family", data.saint_family).eq("individual_id", data.individual_id).eq("distribution_date", date).maybeSingle();
	if (existError) throw new Error(existError.message);
	const currentlyReceived = existing?.received ?? false;
	const newReceived = !currentlyReceived;
	const { data: inventory, error: inventoryError } = await context.supabase.from("inventory").select("*").order("created_at", { ascending: false }).limit(1).maybeSingle();
	if (inventoryError) throw new Error(inventoryError.message);
	if (!inventory) throw new Error("يرجى إعداد المخزون أولاً");
	let newTotal = inventory.weekly_total;
	if (newReceived && !currentlyReceived) {
		if (inventory.weekly_total < 1) throw new Error("المخزون غير كافٍ");
		newTotal = inventory.weekly_total - 1;
	} else if (!newReceived && currentlyReceived) newTotal = inventory.weekly_total + 1;
	const { error: upsertError } = await context.supabase.from("blessing_distribution").upsert({
		saint_family: data.saint_family,
		individual_id: data.individual_id,
		received: newReceived,
		distribution_date: date,
		distributed_at: newReceived ? (/* @__PURE__ */ new Date()).toISOString() : null,
		created_by: context.userId
	}, {
		onConflict: "saint_family,individual_id,distribution_date",
		ignoreDuplicates: false
	});
	if (upsertError) throw new Error(upsertError.message);
	const { data: updatedInventory, error: updateInvError } = await context.supabase.from("inventory").update({
		weekly_total: newTotal,
		updated_by: context.userId
	}).eq("id", inventory.id).select("id").maybeSingle();
	if (updateInvError) throw new Error(updateInvError.message);
	if (!updatedInventory) throw new Error("تعذر تحديث المخزون: لم يتم تحديث أي صف (تحقق من الصلاحيات)");
	return {
		ok: true,
		individual_name: individual.full_name,
		received: newReceived,
		new_inventory_total: newTotal
	};
});
var getSaintFamilies_createServerFn_handler = createServerRpc({
	id: "e60e0ea2c04a086a68cc9893f70310962d7c8f1c1b20ec6e5c3269b8a7c921cd",
	name: "getSaintFamilies",
	filename: "src/lib/church.functions.ts"
}, (opts) => getSaintFamilies.__executeServer(opts));
var getSaintFamilies = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(getSaintFamilies_createServerFn_handler, async ({ context }) => {
	try {
		const visibleValues = getVisibleSaintFamilyValues(getServerRole(context));
		const { data, error } = await context.supabase.from("individuals").select("saint_family").not("saint_family", "is", null).order("saint_family", { ascending: true });
		if (error) {
			console.error("[getSaintFamilies] Database error:", {
				code: error.code,
				message: error.message,
				details: error.details
			});
			throw new Error(error.message);
		}
		const standardFamilies = [
			{
				value: "مرقس",
				label: "أسرة القديس مرقس"
			},
			{
				value: "يوحنا",
				label: "أسرة القديس يوحنا"
			},
			{
				value: "لوقا",
				label: "أسرة القديس لوقا"
			},
			{
				value: "متى",
				label: "أسرة القديس متى"
			},
			{
				value: "أسر مستترة",
				label: "الأسر المستترة"
			}
		].filter((f) => visibleValues.includes(f.value));
		const dbFamilies = Array.from(new Set(data?.map((d) => d.saint_family))).filter((f) => f !== null && f !== void 0 && visibleValues.includes(f));
		const allFamilies = [...standardFamilies];
		dbFamilies.forEach((family) => {
			if (!allFamilies.find((f) => f.value === family)) allFamilies.push({
				value: family,
				label: family
			});
		});
		return allFamilies;
	} catch (err) {
		console.error("[getSaintFamilies] Unexpected error:", err);
		throw err;
	}
});
var getAssistanceLogs_createServerFn_handler = createServerRpc({
	id: "c73ea4c713c131e7a331f165872c6f1faff0fd7057be4f465c73275c7bda30e5",
	name: "getAssistanceLogs",
	filename: "src/lib/church.functions.ts"
}, (opts) => getAssistanceLogs.__executeServer(opts));
var getAssistanceLogs = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ individual_id: stringType().uuid() }).parse(d)).handler(getAssistanceLogs_createServerFn_handler, async ({ data, context }) => {
	requirePermission(context, "view:sensitive");
	const { data: logs, error } = await context.supabase.from("assistance_logs").select(`
        *,
        bridal_prep_details(*),
        medical_aid_details(*),
        family_members(full_name)
      `).eq("individual_id", data.individual_id).order("created_at", { ascending: false });
	if (error) throw new Error(error.message);
	return logs ?? [];
});
var getFamilyMemberAssistanceStatus_createServerFn_handler = createServerRpc({
	id: "197ff399d7ceae5ce912d0b30fd85cc10fa9409a50d3e347ff990d355fbbc91b",
	name: "getFamilyMemberAssistanceStatus",
	filename: "src/lib/church.functions.ts"
}, (opts) => getFamilyMemberAssistanceStatus.__executeServer(opts));
var getFamilyMemberAssistanceStatus = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ individual_id: stringType().uuid() }).parse(d)).handler(getFamilyMemberAssistanceStatus_createServerFn_handler, async ({ data, context }) => {
	requirePermission(context, "view:sensitive");
	const { data: mainLogs, error: mainError } = await context.supabase.from("assistance_logs").select("assistance_type, family_member_id").eq("individual_id", data.individual_id);
	if (mainError) throw new Error(mainError.message);
	const { data: family, error: familyError } = await context.supabase.from("family_members").select("id, full_name").eq("individual_id", data.individual_id);
	if (familyError) throw new Error(familyError.message);
	const statusMap = {};
	statusMap[data.individual_id] = {
		hasBridal: mainLogs?.some((log) => log.assistance_type === "bridal_prep" && !log.family_member_id) ?? false,
		hasMedical: mainLogs?.some((log) => log.assistance_type === "medical_aid" && !log.family_member_id) ?? false
	};
	family?.forEach((member) => {
		statusMap[member.id] = {
			hasBridal: mainLogs?.some((log) => log.assistance_type === "bridal_prep" && log.family_member_id === member.id) ?? false,
			hasMedical: mainLogs?.some((log) => log.assistance_type === "medical_aid" && log.family_member_id === member.id) ?? false
		};
	});
	return statusMap;
});
var assistanceLogSchema = objectType({
	individual_id: stringType().uuid(),
	family_member_id: stringType().uuid().nullable(),
	assistance_type: enumType(["bridal_prep", "medical_aid"]),
	notes: stringType().optional().nullable(),
	bridal_details: objectType({
		appliances: arrayType(objectType({
			category: literalType("appliances"),
			item_type: stringType(),
			quantity: numberType(),
			unit_price: numberType(),
			total_price: numberType()
		})).optional(),
		furniture: arrayType(objectType({
			category: literalType("furniture"),
			item_type: stringType(),
			quantity: numberType(),
			unit_price: numberType(),
			total_price: numberType()
		})).optional(),
		clothing: arrayType(objectType({
			category: literalType("clothing"),
			item_type: stringType(),
			quantity: numberType(),
			unit_price: numberType(),
			total_price: numberType()
		})).optional(),
		kitchenware: arrayType(objectType({
			category: literalType("kitchenware"),
			item_type: stringType(),
			quantity: numberType(),
			unit_price: numberType(),
			total_price: numberType()
		})).optional(),
		bedding: arrayType(objectType({
			category: literalType("bedding"),
			item_type: stringType(),
			quantity: numberType(),
			unit_price: numberType(),
			total_price: numberType()
		})).optional()
	}).optional(),
	medical_details: arrayType(objectType({
		category: enumType([
			"operation",
			"radiology",
			"lab_test",
			"medication",
			"checkup",
			"external_treatment"
		]),
		service_name: stringType(),
		total_price: numberType(),
		church_percentage: numberType()
	})).optional()
});
var createAssistanceLog_createServerFn_handler = createServerRpc({
	id: "077c27fd124eaea1ebfc3ee08e30d967f1c25e246ece3a7fc0fa4eda70edfda0",
	name: "createAssistanceLog",
	filename: "src/lib/church.functions.ts"
}, (opts) => createAssistanceLog.__executeServer(opts));
var createAssistanceLog = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => assistanceLogSchema.parse(d)).handler(createAssistanceLog_createServerFn_handler, async ({ data, context }) => {
	requirePermission(context, "view:sensitive");
	const { bridal_details, medical_details, ...logData } = data;
	let totalAmount = 0;
	if (bridal_details) Object.values(bridal_details).forEach((items) => {
		items.forEach((item) => totalAmount += item.total_price);
	});
	if (medical_details) medical_details.forEach((item) => totalAmount += item.total_price);
	const { data: log, error: logError } = await context.supabase.from("assistance_logs").insert({
		...logData,
		total_amount: totalAmount,
		created_by: context.userId
	}).select("id").single();
	if (logError || !log) throw new Error(logError?.message ?? "فشل إنشاء سجل المساعدة");
	if (bridal_details && data.assistance_type === "bridal_prep") {
		const bridalRows = Object.values(bridal_details).flat().map((detail) => ({
			assistance_log_id: log.id,
			...detail
		}));
		const { error: bridalError } = await context.supabase.from("bridal_prep_details").insert(bridalRows);
		if (bridalError) throw new Error(bridalError.message);
	}
	if (medical_details && data.assistance_type === "medical_aid") {
		const medicalRows = medical_details.map((detail) => ({
			assistance_log_id: log.id,
			...detail
		}));
		const { error: medicalError } = await context.supabase.from("medical_aid_details").insert(medicalRows);
		if (medicalError) throw new Error(medicalError.message);
	}
	return { id: log.id };
});
var deleteAssistanceLog_createServerFn_handler = createServerRpc({
	id: "c599ca922c527fcf9eb80e4827649ec99470b8ee7cddb8a28701a26364470549",
	name: "deleteAssistanceLog",
	filename: "src/lib/church.functions.ts"
}, (opts) => deleteAssistanceLog.__executeServer(opts));
var deleteAssistanceLog = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ id: stringType().uuid() }).parse(d)).handler(deleteAssistanceLog_createServerFn_handler, async ({ data, context }) => {
	requirePermission(context, "view:sensitive");
	const { error } = await context.supabase.from("assistance_logs").delete().eq("id", data.id);
	if (error) throw new Error(error.message);
	return { ok: true };
});
var clothesRequestSchema = objectType({
	individual_id: stringType().uuid(),
	family_member_id: stringType().uuid().nullable().optional(),
	saint_family: stringType().min(1),
	request_category: enumType(["holiday", "school"]),
	school_name: stringType().optional().nullable(),
	t_shirt_size: stringType().optional().nullable(),
	pants_size: stringType().optional().nullable(),
	shoe_size: stringType().optional().nullable(),
	notes: stringType().optional().nullable()
});
var getClothesRequests_createServerFn_handler = createServerRpc({
	id: "a0b57c5a71a09cfff970056c840a393f1669b8d1aae0112e01c1cb3b19a67d07",
	name: "getClothesRequests",
	filename: "src/lib/church.functions.ts"
}, (opts) => getClothesRequests.__executeServer(opts));
var getClothesRequests = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(getClothesRequests_createServerFn_handler, async ({ context }) => {
	const assignedFamily = getServerAssignedFamily(context);
	let query = context.supabase.from("clothes_requests").select(`
        *,
        individuals(id, full_name, saint_family),
        family_members(id, full_name, relation)
      `).order("created_at", { ascending: false }).limit(500);
	if (assignedFamily) query = query.eq("saint_family", assignedFamily);
	const { data, error } = await query;
	if (error) throw new Error(error.message);
	return data ?? [];
});
var getClothesRequestsByFamily_createServerFn_handler = createServerRpc({
	id: "894a81440a5e7fcfd57a27b22e6ea56af4feaa5dff18c2978b9f02ecc57161fa",
	name: "getClothesRequestsByFamily",
	filename: "src/lib/church.functions.ts"
}, (opts) => getClothesRequestsByFamily.__executeServer(opts));
var getClothesRequestsByFamily = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ saint_family: stringType().min(1) }).parse(d)).handler(getClothesRequestsByFamily_createServerFn_handler, async ({ data, context }) => {
	requireVisibleFamily(context, data.saint_family);
	const { data: rows, error } = await context.supabase.from("clothes_requests").select(`
        *,
        individuals(id, full_name, saint_family),
        family_members(id, full_name, relation)
      `).eq("saint_family", data.saint_family).order("created_at", { ascending: false });
	if (error) throw new Error(error.message);
	return rows ?? [];
});
var createClothesRequest_createServerFn_handler = createServerRpc({
	id: "9779adaeeb7eccaf6430382b98ddd0c431c51fb379669484a09414a540f17b9e",
	name: "createClothesRequest",
	filename: "src/lib/church.functions.ts"
}, (opts) => createClothesRequest.__executeServer(opts));
var createClothesRequest = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => clothesRequestSchema.parse(d)).handler(createClothesRequest_createServerFn_handler, async ({ data, context }) => {
	requireVisibleFamily(context, data.saint_family);
	const { data: created, error } = await context.supabase.from("clothes_requests").insert({
		...data,
		created_by: context.userId
	}).select("id").single();
	if (error || !created) throw new Error(error?.message ?? "فشل حفظ طلب الملابس");
	return { id: created.id };
});
var updateClothesRequest_createServerFn_handler = createServerRpc({
	id: "84dedf0aad8208dc2b4722dee289d315de3c749a8821894f612dba12b5d864b2",
	name: "updateClothesRequest",
	filename: "src/lib/church.functions.ts"
}, (opts) => updateClothesRequest.__executeServer(opts));
var updateClothesRequest = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => clothesRequestSchema.extend({ id: stringType().uuid() }).parse(d)).handler(updateClothesRequest_createServerFn_handler, async ({ data, context }) => {
	requireVisibleFamily(context, data.saint_family);
	const { id, ...rest } = data;
	const { error } = await context.supabase.from("clothes_requests").update(rest).eq("id", id);
	if (error) throw new Error(error.message);
	return { id };
});
var deleteClothesRequest_createServerFn_handler = createServerRpc({
	id: "8f12474654af84efb97fede86513f79f1aab97a5072fa5bac65fe4511ab4dbf0",
	name: "deleteClothesRequest",
	filename: "src/lib/church.functions.ts"
}, (opts) => deleteClothesRequest.__executeServer(opts));
var deleteClothesRequest = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ id: stringType().uuid() }).parse(d)).handler(deleteClothesRequest_createServerFn_handler, async ({ data, context }) => {
	const { error } = await context.supabase.from("clothes_requests").delete().eq("id", data.id);
	if (error) throw new Error(error.message);
	return { ok: true };
});
var getChildrenByFamily_createServerFn_handler = createServerRpc({
	id: "6b987e8c84f2c5d6ba5bf88965fb9a229c95f9031467683e742d89d07b76491d",
	name: "getChildrenByFamily",
	filename: "src/lib/church.functions.ts"
}, (opts) => getChildrenByFamily.__executeServer(opts));
var getChildrenByFamily = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ saint_family: stringType().min(1) }).parse(d)).handler(getChildrenByFamily_createServerFn_handler, async ({ data, context }) => {
	requireVisibleFamily(context, data.saint_family);
	const { data: individuals, error: indErr } = await context.supabase.from("individuals").select("id, full_name, saint_family").eq("saint_family", data.saint_family).order("full_name", { ascending: true });
	if (indErr) throw new Error(indErr.message);
	const individualIds = (individuals ?? []).map((i) => i.id);
	if (individualIds.length === 0) return [];
	const { data: familyMembers, error: famErr } = await context.supabase.from("family_members").select("id, full_name, relation, individual_id").in("individual_id", individualIds).in("relation", ["ابن", "ابنة"]);
	if (famErr) throw new Error(famErr.message);
	const individualMap = new Map((individuals ?? []).map((i) => [i.id, i.full_name]));
	return (familyMembers ?? []).map((fm) => ({
		id: fm.id,
		full_name: fm.full_name,
		relation: fm.relation,
		parent_name: individualMap.get(fm.individual_id) ?? "",
		individual_id: fm.individual_id
	}));
});
var furnitureCategorySchema = enumType([
	"أجهزة منزلية",
	"أثاث",
	"مفروشات"
]);
var FURNITURE_REQUEST_STATUSES = [
	"تحت المراجعة",
	"مقبول",
	"مرفوض"
];
/** Get beneficiaries (individuals) by saint_family for the request form */
var getFurnitureBeneficiaries_createServerFn_handler = createServerRpc({
	id: "ce8eac2457acb3308ef98da8a37219aa900d2b97218f3b5a1b7f27cf9b52ec7c",
	name: "getFurnitureBeneficiaries",
	filename: "src/lib/church.functions.ts"
}, (opts) => getFurnitureBeneficiaries.__executeServer(opts));
var getFurnitureBeneficiaries = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ family_name: stringType().min(1) }).parse(d)).handler(getFurnitureBeneficiaries_createServerFn_handler, async ({ data, context }) => {
	requireVisibleFamily(context, data.family_name);
	const { data: rows, error } = await context.supabase.from("individuals").select("id, full_name, nickname").eq("saint_family", data.family_name).order("full_name", { ascending: true });
	if (error) throw new Error(error.message);
	return (rows ?? []).map((r) => ({
		id: r.id,
		full_name: r.full_name,
		display_name: r.nickname ? `${r.full_name} (${r.nickname})` : r.full_name
	}));
});
var getFurnitureInventory_createServerFn_handler = createServerRpc({
	id: "4ab4c66f96375fa3d2270d47df7b612e535d426ed2404d9056fe43b9e52d1324",
	name: "getFurnitureInventory",
	filename: "src/lib/church.functions.ts"
}, (opts) => getFurnitureInventory.__executeServer(opts));
var getFurnitureInventory = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(getFurnitureInventory_createServerFn_handler, async ({ context }) => {
	const { data, error } = await context.supabase.from("furniture_inventory").select("*").order("created_at", { ascending: false });
	if (error) throw new Error(error.message);
	return data ?? [];
});
var addFurnitureInventoryItem_createServerFn_handler = createServerRpc({
	id: "78940c1848ca715116d31d20c7dc2e4854fedf1a8771f692f98d52c43c5c0590",
	name: "addFurnitureInventoryItem",
	filename: "src/lib/church.functions.ts"
}, (opts) => addFurnitureInventoryItem.__executeServer(opts));
var addFurnitureInventoryItem = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
	category: furnitureCategorySchema,
	item_name: stringType().min(1),
	quantity: numberType().int().positive(),
	details: stringType().optional().nullable()
}).parse(d)).handler(addFurnitureInventoryItem_createServerFn_handler, async ({ data, context }) => {
	requirePermission(context, "manage:furniture");
	const { data: created, error } = await context.supabase.from("furniture_inventory").insert({
		...data,
		created_by: context.userId
	}).select("id").single();
	if (error || !created) throw new Error(error?.message ?? "فشل إضافة العنصر");
	return { id: created.id };
});
var updateFurnitureInventoryItem_createServerFn_handler = createServerRpc({
	id: "0c8b827fa0b929bfa3bf2242e537b79c1b8723066953b9e2f7263be77fffee3f",
	name: "updateFurnitureInventoryItem",
	filename: "src/lib/church.functions.ts"
}, (opts) => updateFurnitureInventoryItem.__executeServer(opts));
var updateFurnitureInventoryItem = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
	id: stringType().uuid(),
	category: furnitureCategorySchema,
	item_name: stringType().min(1),
	quantity: numberType().int().nonnegative(),
	details: stringType().optional().nullable()
}).parse(d)).handler(updateFurnitureInventoryItem_createServerFn_handler, async ({ data, context }) => {
	requirePermission(context, "manage:furniture");
	const { id, ...rest } = data;
	const { error } = await context.supabase.from("furniture_inventory").update(rest).eq("id", id);
	if (error) throw new Error(error.message);
	return { id };
});
var deleteFurnitureInventoryItem_createServerFn_handler = createServerRpc({
	id: "a0a1434a599a9623ca1724ce5cfbf241159fff81acf34f69b0b85a9b8dc5166e",
	name: "deleteFurnitureInventoryItem",
	filename: "src/lib/church.functions.ts"
}, (opts) => deleteFurnitureInventoryItem.__executeServer(opts));
var deleteFurnitureInventoryItem = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ id: stringType().uuid() }).parse(d)).handler(deleteFurnitureInventoryItem_createServerFn_handler, async ({ data, context }) => {
	requirePermission(context, "manage:furniture");
	const { error } = await context.supabase.from("furniture_inventory").delete().eq("id", data.id);
	if (error) throw new Error(error.message);
	return { ok: true };
});
var getFurnitureRequests_createServerFn_handler = createServerRpc({
	id: "13650d227d5554ca5de0b3eda755fe11163731c54ab7efa1dd160094ebab94ac",
	name: "getFurnitureRequests",
	filename: "src/lib/church.functions.ts"
}, (opts) => getFurnitureRequests.__executeServer(opts));
var getFurnitureRequests = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(getFurnitureRequests_createServerFn_handler, async ({ context }) => {
	const { data, error } = await context.supabase.from("furniture_requests").select("*").order("created_at", { ascending: false });
	if (error) throw new Error(error.message);
	return data ?? [];
});
var getMyFurnitureRequests_createServerFn_handler = createServerRpc({
	id: "94ac86e4ffdc1a5f95c88ee7663f033a8f7739e8611890626fbbb4cd50fe94cc",
	name: "getMyFurnitureRequests",
	filename: "src/lib/church.functions.ts"
}, (opts) => getMyFurnitureRequests.__executeServer(opts));
var getMyFurnitureRequests = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(getMyFurnitureRequests_createServerFn_handler, async ({ context }) => {
	const { data, error } = await context.supabase.from("furniture_requests").select("*").eq("requested_by", context.userId).order("created_at", { ascending: false });
	if (error) throw new Error(error.message);
	return data ?? [];
});
var createFurnitureRequest_createServerFn_handler = createServerRpc({
	id: "3d647e53ede6e49350b485d8b1e5fb60f263c3817bb5a671844d49e8a17b58c2",
	name: "createFurnitureRequest",
	filename: "src/lib/church.functions.ts"
}, (opts) => createFurnitureRequest.__executeServer(opts));
var createFurnitureRequest = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
	family_name: stringType().min(1),
	beneficiary_id: stringType().uuid(),
	beneficiary_name: stringType().min(1),
	category: furnitureCategorySchema,
	item_name: stringType().min(1),
	details: stringType().optional().nullable()
}).parse(d)).handler(createFurnitureRequest_createServerFn_handler, async ({ data, context }) => {
	requireVisibleFamily(context, data.family_name);
	const { data: created, error } = await context.supabase.from("furniture_requests").insert({
		...data,
		quantity: 1,
		requested_by: context.userId
	}).select("id").single();
	if (error || !created) throw new Error(error?.message ?? "فشل حفظ الطلب");
	return { id: created.id };
});
var updateFurnitureRequestStatus_createServerFn_handler = createServerRpc({
	id: "afa9cc3260dd3e9cd180f28210edb37cfe67585b845d9205ba3b112283c4d3be",
	name: "updateFurnitureRequestStatus",
	filename: "src/lib/church.functions.ts"
}, (opts) => updateFurnitureRequestStatus.__executeServer(opts));
var updateFurnitureRequestStatus = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
	id: stringType().uuid(),
	status: enumType(FURNITURE_REQUEST_STATUSES)
}).parse(d)).handler(updateFurnitureRequestStatus_createServerFn_handler, async ({ data, context }) => {
	requirePermission(context, "manage:furniture");
	const { error } = await context.supabase.from("furniture_requests").update({ status: data.status }).eq("id", data.id);
	if (error) throw new Error(error.message);
	return { id: data.id };
});
var deleteFurnitureRequest_createServerFn_handler = createServerRpc({
	id: "ece49859be450df034d58ad470454b2f2429c7efaa8bb4483d6eeffb08421006",
	name: "deleteFurnitureRequest",
	filename: "src/lib/church.functions.ts"
}, (opts) => deleteFurnitureRequest.__executeServer(opts));
var deleteFurnitureRequest = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ id: stringType().uuid() }).parse(d)).handler(deleteFurnitureRequest_createServerFn_handler, async ({ data, context }) => {
	const { error } = await context.supabase.from("furniture_requests").delete().eq("id", data.id);
	if (error) throw new Error(error.message);
	return { ok: true };
});
var suppliesCategorySchema = enumType([
	"بروتين",
	"نشويات",
	"دهون",
	"أخرى"
]);
/** Get all supplies inventory items */
var getSuppliesInventory_createServerFn_handler = createServerRpc({
	id: "c1302878275c5e2f226a1197bcbf0bb8761b2f8eade486324225234a10d5869f",
	name: "getSuppliesInventory",
	filename: "src/lib/church.functions.ts"
}, (opts) => getSuppliesInventory.__executeServer(opts));
var getSuppliesInventory = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(getSuppliesInventory_createServerFn_handler, async ({ context }) => {
	const { data, error } = await context.supabase.from("supplies_inventory").select("*").order("created_at", { ascending: false });
	if (error) throw new Error(error.message);
	return data ?? [];
});
var addSupplyItem_createServerFn_handler = createServerRpc({
	id: "4c0e81816150b9e12a5b022de1bf42e7c6a2379f11b373382e891433ac0c43a1",
	name: "addSupplyItem",
	filename: "src/lib/church.functions.ts"
}, (opts) => addSupplyItem.__executeServer(opts));
var addSupplyItem = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
	category: suppliesCategorySchema,
	item_name: stringType().min(1),
	quantity: numberType().int().nonnegative(),
	weight: stringType().optional().nullable(),
	details: stringType().optional().nullable()
}).parse(d)).handler(addSupplyItem_createServerFn_handler, async ({ data, context }) => {
	requirePermission(context, "manage:supplies");
	const { data: created, error } = await context.supabase.from("supplies_inventory").insert({
		...data,
		created_by: context.userId
	}).select("id").single();
	if (error || !created) throw new Error(error?.message ?? "فشل إضافة الصنف");
	return { id: created.id };
});
var updateSupplyItem_createServerFn_handler = createServerRpc({
	id: "f03d3f7187935ef7c9ce16469555c354f9b5de8ae2866f043e385ba3bfe897f0",
	name: "updateSupplyItem",
	filename: "src/lib/church.functions.ts"
}, (opts) => updateSupplyItem.__executeServer(opts));
var updateSupplyItem = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
	id: stringType().uuid(),
	category: suppliesCategorySchema,
	item_name: stringType().min(1),
	quantity: numberType().int().nonnegative(),
	weight: stringType().optional().nullable(),
	details: stringType().optional().nullable()
}).parse(d)).handler(updateSupplyItem_createServerFn_handler, async ({ data, context }) => {
	requirePermission(context, "manage:supplies");
	const { id, ...rest } = data;
	const { error } = await context.supabase.from("supplies_inventory").update(rest).eq("id", id);
	if (error) throw new Error(error.message);
	return { id };
});
var deleteSupplyItem_createServerFn_handler = createServerRpc({
	id: "27b72eeb8413d287fee78c56728a977915c4493c4735ff03a3595547044e1553",
	name: "deleteSupplyItem",
	filename: "src/lib/church.functions.ts"
}, (opts) => deleteSupplyItem.__executeServer(opts));
var deleteSupplyItem = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ id: stringType().uuid() }).parse(d)).handler(deleteSupplyItem_createServerFn_handler, async ({ data, context }) => {
	requirePermission(context, "manage:supplies");
	const { error } = await context.supabase.from("supplies_inventory").delete().eq("id", data.id);
	if (error) throw new Error(error.message);
	return { ok: true };
});
var PHARMACY_UNIT_TYPES = [
	"علبة",
	"شريط",
	"حقنة/أمبول",
	"أخرى"
];
var PHARMACY_REQUEST_STATUSES = [
	"تحت المراجعة",
	"مقبول",
	"مرفوض"
];
/** Get all pharmacy inventory items (admin) */
var getPharmacyInventory_createServerFn_handler = createServerRpc({
	id: "7888fceeb922cb7864a0b0f8359be4728a7ad1f207db9372799d64bbcd76531b",
	name: "getPharmacyInventory",
	filename: "src/lib/church.functions.ts"
}, (opts) => getPharmacyInventory.__executeServer(opts));
var getPharmacyInventory = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(getPharmacyInventory_createServerFn_handler, async ({ context }) => {
	const { data, error } = await context.supabase.from("pharmacy_inventory").select("*").order("created_at", { ascending: false });
	if (error) throw new Error(error.message);
	return data ?? [];
});
var addPharmacyInventoryItem_createServerFn_handler = createServerRpc({
	id: "aa4754406b0d3a6c70a560ff9152aa8c28b13fbe7f2b520a56518e2dd8244112",
	name: "addPharmacyInventoryItem",
	filename: "src/lib/church.functions.ts"
}, (opts) => addPharmacyInventoryItem.__executeServer(opts));
var addPharmacyInventoryItem = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
	disease_category: stringType().min(1),
	custom_disease_name: stringType().optional().nullable(),
	medicine_name: stringType().min(1),
	quantity: numberType().int().nonnegative(),
	unit_type: enumType(PHARMACY_UNIT_TYPES),
	details: stringType().optional().nullable()
}).parse(d)).handler(addPharmacyInventoryItem_createServerFn_handler, async ({ data, context }) => {
	requirePermission(context, "manage:pharmacy");
	const { data: created, error } = await context.supabase.from("pharmacy_inventory").insert({
		...data,
		created_by: context.userId
	}).select("id").single();
	if (error || !created) throw new Error(error?.message ?? "فشل إضافة الصنف");
	return { id: created.id };
});
var updatePharmacyInventoryItem_createServerFn_handler = createServerRpc({
	id: "e5ef3a00764879a72b8169529ae1c326a422e189edceb879b6d545311ef913b7",
	name: "updatePharmacyInventoryItem",
	filename: "src/lib/church.functions.ts"
}, (opts) => updatePharmacyInventoryItem.__executeServer(opts));
var updatePharmacyInventoryItem = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
	id: stringType().uuid(),
	disease_category: stringType().min(1),
	custom_disease_name: stringType().optional().nullable(),
	medicine_name: stringType().min(1),
	quantity: numberType().int().nonnegative(),
	unit_type: enumType(PHARMACY_UNIT_TYPES),
	details: stringType().optional().nullable()
}).parse(d)).handler(updatePharmacyInventoryItem_createServerFn_handler, async ({ data, context }) => {
	requirePermission(context, "manage:pharmacy");
	const { id, ...rest } = data;
	const { error } = await context.supabase.from("pharmacy_inventory").update(rest).eq("id", id);
	if (error) throw new Error(error.message);
	return { id };
});
var deletePharmacyInventoryItem_createServerFn_handler = createServerRpc({
	id: "8c52c39d96f4a974c68993e8cf38e3af177a5f002622dec8567e62d15f9895bf",
	name: "deletePharmacyInventoryItem",
	filename: "src/lib/church.functions.ts"
}, (opts) => deletePharmacyInventoryItem.__executeServer(opts));
var deletePharmacyInventoryItem = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ id: stringType().uuid() }).parse(d)).handler(deletePharmacyInventoryItem_createServerFn_handler, async ({ data, context }) => {
	requirePermission(context, "manage:pharmacy");
	const { error } = await context.supabase.from("pharmacy_inventory").delete().eq("id", data.id);
	if (error) throw new Error(error.message);
	return { ok: true };
});
var getPharmacyRequests_createServerFn_handler = createServerRpc({
	id: "8458aa91410371f7b21180606dfa87c449c6fb48bfe5b6fca8e383c6eaa91836",
	name: "getPharmacyRequests",
	filename: "src/lib/church.functions.ts"
}, (opts) => getPharmacyRequests.__executeServer(opts));
var getPharmacyRequests = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(getPharmacyRequests_createServerFn_handler, async ({ context }) => {
	const { data, error } = await context.supabase.from("pharmacy_requests").select("*").order("created_at", { ascending: false });
	if (error) throw new Error(error.message);
	return data ?? [];
});
var getMyPharmacyRequests_createServerFn_handler = createServerRpc({
	id: "96fb3f197f60ed1aa97f259da1a052a609c3b5efc57df333987eb8dbf0eec77f",
	name: "getMyPharmacyRequests",
	filename: "src/lib/church.functions.ts"
}, (opts) => getMyPharmacyRequests.__executeServer(opts));
var getMyPharmacyRequests = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(getMyPharmacyRequests_createServerFn_handler, async ({ context }) => {
	const { data, error } = await context.supabase.from("pharmacy_requests").select("*").eq("requested_by", context.userId).order("created_at", { ascending: false });
	if (error) throw new Error(error.message);
	return data ?? [];
});
var createPharmacyRequest_createServerFn_handler = createServerRpc({
	id: "ad7ad673c7d0851c3b2954b413c5148b7309f42bbfddcd2548ebed48313f6c5f",
	name: "createPharmacyRequest",
	filename: "src/lib/church.functions.ts"
}, (opts) => createPharmacyRequest.__executeServer(opts));
var createPharmacyRequest = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
	family_name: stringType().min(1),
	beneficiary_id: stringType().uuid().optional().nullable(),
	beneficiary_name: stringType().min(1),
	disease_category: stringType().min(1),
	custom_disease_name: stringType().optional().nullable(),
	medicine_name: stringType().min(1),
	requested_quantity: numberType().int().positive(),
	details: stringType().optional().nullable()
}).parse(d)).handler(createPharmacyRequest_createServerFn_handler, async ({ data, context }) => {
	requireVisibleFamily(context, data.family_name);
	const { data: created, error } = await context.supabase.from("pharmacy_requests").insert({
		...data,
		requested_by: context.userId
	}).select("id").single();
	if (error || !created) throw new Error(error?.message ?? "فشل حفظ الطلب");
	return { id: created.id };
});
var updatePharmacyRequestStatus_createServerFn_handler = createServerRpc({
	id: "1363e2346909bb8626525420cf760b760a4ca33f50e726cdb39d96add9ea619e",
	name: "updatePharmacyRequestStatus",
	filename: "src/lib/church.functions.ts"
}, (opts) => updatePharmacyRequestStatus.__executeServer(opts));
var updatePharmacyRequestStatus = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
	id: stringType().uuid(),
	status: enumType(PHARMACY_REQUEST_STATUSES)
}).parse(d)).handler(updatePharmacyRequestStatus_createServerFn_handler, async ({ data, context }) => {
	requirePermission(context, "manage:pharmacy");
	const { error } = await context.supabase.from("pharmacy_requests").update({ status: data.status }).eq("id", data.id);
	if (error) throw new Error(error.message);
	return { id: data.id };
});
var deletePharmacyRequest_createServerFn_handler = createServerRpc({
	id: "c392b182b0cfeaafced34e748bdb339eb041c4334a7be48f3ef64a6042976518",
	name: "deletePharmacyRequest",
	filename: "src/lib/church.functions.ts"
}, (opts) => deletePharmacyRequest.__executeServer(opts));
var deletePharmacyRequest = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ id: stringType().uuid() }).parse(d)).handler(deletePharmacyRequest_createServerFn_handler, async ({ data, context }) => {
	requirePermission(context, "manage:pharmacy");
	const { error } = await context.supabase.from("pharmacy_requests").delete().eq("id", data.id);
	if (error) throw new Error(error.message);
	return { ok: true };
});
var getPharmacyBeneficiaries_createServerFn_handler = createServerRpc({
	id: "95909a0b237b8c240472c6ebe719d3a7be563c7c83a12c681379f213a432c3be",
	name: "getPharmacyBeneficiaries",
	filename: "src/lib/church.functions.ts"
}, (opts) => getPharmacyBeneficiaries.__executeServer(opts));
var getPharmacyBeneficiaries = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ family_name: stringType().min(1) }).parse(d)).handler(getPharmacyBeneficiaries_createServerFn_handler, async ({ data, context }) => {
	requireVisibleFamily(context, data.family_name);
	const { data: rows, error } = await context.supabase.from("individuals").select("id, full_name, nickname").eq("saint_family", data.family_name).order("full_name", { ascending: true });
	if (error) throw new Error(error.message);
	return (rows ?? []).map((r) => ({
		id: r.id,
		full_name: r.full_name,
		display_name: r.nickname ? `${r.full_name} (${r.nickname})` : r.full_name
	}));
});
//#endregion
export { addFurnitureInventoryItem_createServerFn_handler, addPharmacyInventoryItem_createServerFn_handler, addSupplyItem_createServerFn_handler, createAssistanceLog_createServerFn_handler, createClothesRequest_createServerFn_handler, createFurnitureRequest_createServerFn_handler, createIndividual_createServerFn_handler, createPharmacyRequest_createServerFn_handler, deleteAssistanceLog_createServerFn_handler, deleteAuditLog_createServerFn_handler, deleteClothesRequest_createServerFn_handler, deleteFurnitureInventoryItem_createServerFn_handler, deleteFurnitureRequest_createServerFn_handler, deleteIndividual_createServerFn_handler, deletePharmacyInventoryItem_createServerFn_handler, deletePharmacyRequest_createServerFn_handler, deleteSupplyItem_createServerFn_handler, getAllGuests_createServerFn_handler, getAssistanceLogs_createServerFn_handler, getAuditLog_createServerFn_handler, getBlessingDistribution_createServerFn_handler, getChildrenByFamily_createServerFn_handler, getClothesRequestsByFamily_createServerFn_handler, getClothesRequests_createServerFn_handler, getDashboard_createServerFn_handler, getExportData_createServerFn_handler, getFamilyMemberAssistanceStatus_createServerFn_handler, getFurnitureBeneficiaries_createServerFn_handler, getFurnitureInventory_createServerFn_handler, getFurnitureRequests_createServerFn_handler, getIndividual_createServerFn_handler, getIndividualsBySaintFamily_createServerFn_handler, getInventory_createServerFn_handler, getMyFurnitureRequests_createServerFn_handler, getMyPharmacyRequests_createServerFn_handler, getPharmacyBeneficiaries_createServerFn_handler, getPharmacyInventory_createServerFn_handler, getPharmacyRequests_createServerFn_handler, getSaintFamilies_createServerFn_handler, getSuppliesInventory_createServerFn_handler, saveBlessingDistribution_createServerFn_handler, saveHiddenFamiliesMetric_createServerFn_handler, scanBlessingDistribution_createServerFn_handler, searchIndividuals_createServerFn_handler, toggleBlessingDistribution_createServerFn_handler, updateClothesRequest_createServerFn_handler, updateFurnitureInventoryItem_createServerFn_handler, updateFurnitureRequestStatus_createServerFn_handler, updateIndividual_createServerFn_handler, updateInventory_createServerFn_handler, updateMetric_createServerFn_handler, updatePharmacyInventoryItem_createServerFn_handler, updatePharmacyRequestStatus_createServerFn_handler, updateSupplyItem_createServerFn_handler };
