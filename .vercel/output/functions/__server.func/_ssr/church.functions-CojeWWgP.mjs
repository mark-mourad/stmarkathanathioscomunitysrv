import { i as __toESM } from "../_runtime.mjs";
import { D as isRedirect, _ as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as TSS_SERVER_FUNCTION, l as createServerFn } from "./esm-9EjmF9OT.mjs";
import { t as getServerFnById } from "../__23tanstack-start-server-fn-resolver-DtKkvV1Z.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-Dmuh2lU9.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as numberType, c as stringType, i as literalType, n as booleanType, o as objectType, r as enumType, s as preprocessType, t as arrayType } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/church.functions-CojeWWgP.js
var import_react = /* @__PURE__ */ __toESM(require_react());
function useServerFn(serverFn) {
	const router = useRouter();
	return import_react.useCallback(async (...args) => {
		try {
			const res = await serverFn(...args);
			if (isRedirect(res)) throw res;
			return res;
		} catch (err) {
			if (isRedirect(err)) {
				err.options._fromLocation = router.stores.location.get();
				return router.navigate(router.resolveRedirect(err).options);
			}
			throw err;
		}
	}, [router, serverFn]);
}
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
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
var getDashboard = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("1926ccdc7a5aa7add07f95de64f271605a057a885651fe98df49f3b28f9d303c"));
var updateMetric = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
	id: stringType().uuid(),
	monthly: numberType().nonnegative(),
	study: numberType().nonnegative(),
	therapeutic: numberType().nonnegative()
}).parse(d)).handler(createSsrRpc("86420d89d1413b1847397af247612481d1b72c0dfaeddd27d725f098e36940c9"));
var saveHiddenFamiliesMetric = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
	monthly: numberType().nonnegative(),
	study: numberType().nonnegative(),
	therapeutic: numberType().nonnegative()
}).parse(d)).handler(createSsrRpc("4c986a0ee72bc79854c00b833ddcb4df3bd3710d60563ed11fb3c4ad5d1136c2"));
var searchIndividuals = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
	mode: enumType(["name", "national_id"]),
	q: stringType().min(1)
}).parse(d)).handler(createSsrRpc("c42c6bb358cb8d8ecdbf45d1d0868e6d2968f7cf666e34195d981523f603e62d"));
var getAllGuests = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ saint_family: saintFamilySchema.optional() }).parse(d ?? {})).handler(createSsrRpc("5b850a436fa317440a4d4d1815135067970f5d8242c9ac351e46c27aee0f0f55"));
var getExportData = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ saint_family: saintFamilySchema.optional() }).parse(d ?? {})).handler(createSsrRpc("bd083edf462ed5842857da04423f4d82f348a1aa82841c9c34354d64bfb0c087"));
var getIndividual = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ id: stringType().uuid() }).parse(d)).handler(createSsrRpc("5d8714a18ea31853e44852574ac05b2ac4e8e6f1d9597ef4bead9c36c7ce4201"));
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
var createIndividual = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => individualSchema.parse(d)).handler(createSsrRpc("9acd3e89294b7e8a670df2e5cf48edb3296dbe1277e12f68ad26e2dcc3211b69"));
var updateIndividual = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => individualSchema.extend({ id: stringType().uuid() }).parse(d)).handler(createSsrRpc("cfc8374315c1b355e72ea0dafc45a7c902195e43304d68942c5ba5d01e878708"));
var deleteIndividual = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ id: stringType().uuid() }).parse(d)).handler(createSsrRpc("0dee60ffa14ee03f3fac0c58900d1f97aeec53ea8eb065c8c3b3475e9ae038f1"));
var getAuditLog = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("0cb1d27cf46c52b659eee6ce610cf4465fa7b9fd7e186b0d7aacd16e4a5aff88"));
var deleteAuditLog = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("0be259a69a0fa1e14833ac0d87976e0059a50b4fcd3cc719a0cbb493ce22df7f"));
var getInventory = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("c09670fa1c9c76962d58aa8a4b204c9eced7bb6b9c5a2f71917e5ad9cab569ac"));
var updateInventory = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
	weekly_total: numberType().int().nonnegative(),
	details: stringType().optional().nullable()
}).parse(d)).handler(createSsrRpc("fc9abc78203fd36070e1c412990ff11b2092aac8d1e61966d39672086e32742a"));
var getIndividualsBySaintFamily = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ saint_family: saintFamilySchema }).parse(d)).handler(createSsrRpc("ab188b9dad0141b97a8cbf6a31e9c32f0c1d3157b6d0652f37dcedeb52a4a3ca"));
var getBlessingDistribution = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
	saint_family: saintFamilySchema,
	distribution_date: stringType().optional()
}).parse(d)).handler(createSsrRpc("8a8a29ffdbdb3fec0eb44e2bca7875c665a9405d006a258cef3b52a6d4b1b396"));
createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
	saint_family: saintFamilySchema,
	distribution_date: stringType().optional(),
	received_individuals: arrayType(stringType().uuid())
}).parse(d)).handler(createSsrRpc("b5ed50e34bb0d117a0270670f6e5546b093bfc3003a1eaec882da92717642451"));
var scanBlessingDistribution = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ national_id: stringType().min(1) }).parse(d)).handler(createSsrRpc("65d7da866a703323d5fc64941566d5c8168a5b9a468e1d2223e86ba05aaeb1b6"));
var toggleBlessingDistribution = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
	saint_family: saintFamilySchema,
	individual_id: stringType().uuid(),
	distribution_date: stringType().optional()
}).parse(d)).handler(createSsrRpc("b7c3003a2dea1d2588de7d889333eaafd53611e5b757964dfc76428fc5685c17"));
var getSaintFamilies = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("e60e0ea2c04a086a68cc9893f70310962d7c8f1c1b20ec6e5c3269b8a7c921cd"));
var getAssistanceLogs = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ individual_id: stringType().uuid() }).parse(d)).handler(createSsrRpc("c73ea4c713c131e7a331f165872c6f1faff0fd7057be4f465c73275c7bda30e5"));
var getFamilyMemberAssistanceStatus = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ individual_id: stringType().uuid() }).parse(d)).handler(createSsrRpc("197ff399d7ceae5ce912d0b30fd85cc10fa9409a50d3e347ff990d355fbbc91b"));
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
var createAssistanceLog = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => assistanceLogSchema.parse(d)).handler(createSsrRpc("077c27fd124eaea1ebfc3ee08e30d967f1c25e246ece3a7fc0fa4eda70edfda0"));
var deleteAssistanceLog = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ id: stringType().uuid() }).parse(d)).handler(createSsrRpc("c599ca922c527fcf9eb80e4827649ec99470b8ee7cddb8a28701a26364470549"));
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
var getClothesRequests = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("a0b57c5a71a09cfff970056c840a393f1669b8d1aae0112e01c1cb3b19a67d07"));
createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ saint_family: stringType().min(1) }).parse(d)).handler(createSsrRpc("894a81440a5e7fcfd57a27b22e6ea56af4feaa5dff18c2978b9f02ecc57161fa"));
var createClothesRequest = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => clothesRequestSchema.parse(d)).handler(createSsrRpc("9779adaeeb7eccaf6430382b98ddd0c431c51fb379669484a09414a540f17b9e"));
var updateClothesRequest = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => clothesRequestSchema.extend({ id: stringType().uuid() }).parse(d)).handler(createSsrRpc("84dedf0aad8208dc2b4722dee289d315de3c749a8821894f612dba12b5d864b2"));
var deleteClothesRequest = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ id: stringType().uuid() }).parse(d)).handler(createSsrRpc("8f12474654af84efb97fede86513f79f1aab97a5072fa5bac65fe4511ab4dbf0"));
/** Get children (ابن/ابنة) under a specific individual, optionally filtered by saint_family */
var getChildrenByFamily = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ saint_family: stringType().min(1) }).parse(d)).handler(createSsrRpc("6b987e8c84f2c5d6ba5bf88965fb9a229c95f9031467683e742d89d07b76491d"));
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
var getFurnitureBeneficiaries = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ family_name: stringType().min(1) }).parse(d)).handler(createSsrRpc("ce8eac2457acb3308ef98da8a37219aa900d2b97218f3b5a1b7f27cf9b52ec7c"));
/** Get all furniture inventory items */
var getFurnitureInventory = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("4ab4c66f96375fa3d2270d47df7b612e535d426ed2404d9056fe43b9e52d1324"));
/** Add furniture inventory item */
var addFurnitureInventoryItem = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
	category: furnitureCategorySchema,
	item_name: stringType().min(1),
	quantity: numberType().int().positive(),
	details: stringType().optional().nullable()
}).parse(d)).handler(createSsrRpc("78940c1848ca715116d31d20c7dc2e4854fedf1a8771f692f98d52c43c5c0590"));
/** Update furniture inventory item */
var updateFurnitureInventoryItem = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
	id: stringType().uuid(),
	category: furnitureCategorySchema,
	item_name: stringType().min(1),
	quantity: numberType().int().nonnegative(),
	details: stringType().optional().nullable()
}).parse(d)).handler(createSsrRpc("0c8b827fa0b929bfa3bf2242e537b79c1b8723066953b9e2f7263be77fffee3f"));
/** Delete furniture inventory item */
var deleteFurnitureInventoryItem = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ id: stringType().uuid() }).parse(d)).handler(createSsrRpc("a0a1434a599a9623ca1724ce5cfbf241159fff81acf34f69b0b85a9b8dc5166e"));
/** Get all furniture requests (for admin approval) */
var getFurnitureRequests = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("13650d227d5554ca5de0b3eda755fe11163731c54ab7efa1dd160094ebab94ac"));
/** Get furniture requests for the current user (viewer tracking) */
var getMyFurnitureRequests = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("94ac86e4ffdc1a5f95c88ee7663f033a8f7739e8611890626fbbb4cd50fe94cc"));
/** Create a furniture request (quantity always 1) */
var createFurnitureRequest = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
	family_name: stringType().min(1),
	beneficiary_id: stringType().uuid(),
	beneficiary_name: stringType().min(1),
	category: furnitureCategorySchema,
	item_name: stringType().min(1),
	details: stringType().optional().nullable()
}).parse(d)).handler(createSsrRpc("3d647e53ede6e49350b485d8b1e5fb60f263c3817bb5a671844d49e8a17b58c2"));
/** Update furniture request status (admin approve/reject) */
var updateFurnitureRequestStatus = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
	id: stringType().uuid(),
	status: enumType(FURNITURE_REQUEST_STATUSES)
}).parse(d)).handler(createSsrRpc("afa9cc3260dd3e9cd180f28210edb37cfe67585b845d9205ba3b112283c4d3be"));
/** Delete furniture request */
var deleteFurnitureRequest = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ id: stringType().uuid() }).parse(d)).handler(createSsrRpc("ece49859be450df034d58ad470454b2f2429c7efaa8bb4483d6eeffb08421006"));
var suppliesCategorySchema = enumType([
	"بروتين",
	"نشويات",
	"دهون",
	"أخرى"
]);
/** Get all supplies inventory items */
var getSuppliesInventory = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("c1302878275c5e2f226a1197bcbf0bb8761b2f8eade486324225234a10d5869f"));
/** Add supplies inventory item */
var addSupplyItem = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
	category: suppliesCategorySchema,
	item_name: stringType().min(1),
	quantity: numberType().int().nonnegative(),
	weight: stringType().optional().nullable(),
	details: stringType().optional().nullable()
}).parse(d)).handler(createSsrRpc("4c0e81816150b9e12a5b022de1bf42e7c6a2379f11b373382e891433ac0c43a1"));
/** Update supplies inventory item */
var updateSupplyItem = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
	id: stringType().uuid(),
	category: suppliesCategorySchema,
	item_name: stringType().min(1),
	quantity: numberType().int().nonnegative(),
	weight: stringType().optional().nullable(),
	details: stringType().optional().nullable()
}).parse(d)).handler(createSsrRpc("f03d3f7187935ef7c9ce16469555c354f9b5de8ae2866f043e385ba3bfe897f0"));
/** Delete supplies inventory item */
var deleteSupplyItem = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ id: stringType().uuid() }).parse(d)).handler(createSsrRpc("27b72eeb8413d287fee78c56728a977915c4493c4735ff03a3595547044e1553"));
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
var getPharmacyInventory = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("7888fceeb922cb7864a0b0f8359be4728a7ad1f207db9372799d64bbcd76531b"));
/** Add pharmacy inventory item */
var addPharmacyInventoryItem = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
	disease_category: stringType().min(1),
	custom_disease_name: stringType().optional().nullable(),
	medicine_name: stringType().min(1),
	quantity: numberType().int().nonnegative(),
	unit_type: enumType(PHARMACY_UNIT_TYPES),
	details: stringType().optional().nullable()
}).parse(d)).handler(createSsrRpc("aa4754406b0d3a6c70a560ff9152aa8c28b13fbe7f2b520a56518e2dd8244112"));
/** Update pharmacy inventory item */
var updatePharmacyInventoryItem = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
	id: stringType().uuid(),
	disease_category: stringType().min(1),
	custom_disease_name: stringType().optional().nullable(),
	medicine_name: stringType().min(1),
	quantity: numberType().int().nonnegative(),
	unit_type: enumType(PHARMACY_UNIT_TYPES),
	details: stringType().optional().nullable()
}).parse(d)).handler(createSsrRpc("e5ef3a00764879a72b8169529ae1c326a422e189edceb879b6d545311ef913b7"));
/** Delete pharmacy inventory item */
var deletePharmacyInventoryItem = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ id: stringType().uuid() }).parse(d)).handler(createSsrRpc("8c52c39d96f4a974c68993e8cf38e3af177a5f002622dec8567e62d15f9895bf"));
/** Get all pharmacy requests (admin approval) */
var getPharmacyRequests = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("8458aa91410371f7b21180606dfa87c449c6fb48bfe5b6fca8e383c6eaa91836"));
/** Get current user's pharmacy requests (viewer tracking) */
var getMyPharmacyRequests = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("96fb3f197f60ed1aa97f259da1a052a609c3b5efc57df333987eb8dbf0eec77f"));
/** Create a pharmacy request */
var createPharmacyRequest = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
	family_name: stringType().min(1),
	beneficiary_id: stringType().uuid().optional().nullable(),
	beneficiary_name: stringType().min(1),
	disease_category: stringType().min(1),
	custom_disease_name: stringType().optional().nullable(),
	medicine_name: stringType().min(1),
	requested_quantity: numberType().int().positive(),
	details: stringType().optional().nullable()
}).parse(d)).handler(createSsrRpc("ad7ad673c7d0851c3b2954b413c5148b7309f42bbfddcd2548ebed48313f6c5f"));
/** Update pharmacy request status (admin approve/reject) */
var updatePharmacyRequestStatus = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
	id: stringType().uuid(),
	status: enumType(PHARMACY_REQUEST_STATUSES)
}).parse(d)).handler(createSsrRpc("1363e2346909bb8626525420cf760b760a4ca33f50e726cdb39d96add9ea619e"));
/** Delete pharmacy request */
var deletePharmacyRequest = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ id: stringType().uuid() }).parse(d)).handler(createSsrRpc("c392b182b0cfeaafced34e748bdb339eb041c4334a7be48f3ef64a6042976518"));
/** Get beneficiaries by saint_family for pharmacy request form */
var getPharmacyBeneficiaries = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ family_name: stringType().min(1) }).parse(d)).handler(createSsrRpc("95909a0b237b8c240472c6ebe719d3a7be563c7c83a12c681379f213a432c3be"));
//#endregion
export { updateSupplyItem as $, getIndividual as A, normalizeGender as B, getClothesRequests as C, getFurnitureBeneficiaries as D, getFamilyMemberAssistanceStatus as E, getPharmacyBeneficiaries as F, updateClothesRequest as G, scanBlessingDistribution as H, getPharmacyInventory as I, updateIndividual as J, updateFurnitureInventoryItem as K, getPharmacyRequests as L, getInventory as M, getMyFurnitureRequests as N, getFurnitureInventory as O, getMyPharmacyRequests as P, updatePharmacyRequestStatus as Q, getSaintFamilies as R, getChildrenByFamily as S, getExportData as T, searchIndividuals as U, saveHiddenFamiliesMetric as V, toggleBlessingDistribution as W, updateMetric as X, updateInventory as Y, updatePharmacyInventoryItem as Z, deleteSupplyItem as _, createClothesRequest as a, getAuditLog as b, createPharmacyRequest as c, deleteClothesRequest as d, useServerFn as et, deleteFurnitureInventoryItem as f, deletePharmacyRequest as g, deletePharmacyInventoryItem as h, createAssistanceLog as i, getIndividualsBySaintFamily as j, getFurnitureRequests as k, deleteAssistanceLog as l, deleteIndividual as m, addPharmacyInventoryItem as n, createFurnitureRequest as o, deleteFurnitureRequest as p, updateFurnitureRequestStatus as q, addSupplyItem as r, createIndividual as s, addFurnitureInventoryItem as t, deleteAuditLog as u, getAllGuests as v, getDashboard as w, getBlessingDistribution as x, getAssistanceLogs as y, getSuppliesInventory as z };
