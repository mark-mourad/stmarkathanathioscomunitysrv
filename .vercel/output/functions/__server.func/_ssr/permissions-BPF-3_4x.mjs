//#region node_modules/.nitro/vite/services/ssr/assets/permissions-BPF-3_4x.js
var FAMILY_SCOPE_BY_ROLE = {
	ST_MATTHEW: {
		familyId: "ST_MATTHEW",
		sector: "القديس متى",
		saintFamily: "متى"
	},
	ST_MARK: {
		familyId: "ST_MARK",
		sector: "القديس مرقس",
		saintFamily: "مرقس"
	},
	ST_JOHN: {
		familyId: "ST_JOHN",
		sector: "القديس يوحنا",
		saintFamily: "يوحنا"
	},
	ST_LUKE: {
		familyId: "ST_LUKE",
		sector: "القديس لوقا",
		saintFamily: "لوقا"
	},
	ST_HIDDEN_FAMILIES: {
		familyId: "ST_HIDDEN_FAMILIES",
		sector: "الأسر المستترة",
		saintFamily: "أسر مستترة"
	}
};
var FAMILY_BY_ROLE = Object.fromEntries(Object.entries(FAMILY_SCOPE_BY_ROLE).map(([role, scope]) => [role, scope.saintFamily]));
/** Returns the strict family scope for a family-servant role, or `null` otherwise. */
function getFamilyScopeForRole(role) {
	if (!role) return null;
	return FAMILY_SCOPE_BY_ROLE[role] ?? null;
}
var FAMILY_SERVANT_ROLES = [
	"ST_MATTHEW",
	"ST_MARK",
	"ST_JOHN",
	"ST_LUKE",
	"ST_HIDDEN_FAMILIES"
];
var ROLE_LABEL = {
	SUPER_ADMIN: {
		ar: "مدير النظام",
		en: "Super Admin"
	},
	ADMIN: {
		ar: "مسؤول",
		en: "Admin"
	},
	BRIDE_AND_MEDICAL_AIDS_MANAGER: {
		ar: "مساعدات العرائس والعلاج",
		en: "Bride & Medical Manager"
	},
	ST_MATTHEW: {
		ar: "خادم أسرة القديس متى",
		en: "St. Matthew Servant"
	},
	ST_MARK: {
		ar: "خادم أسرة القديس مرقس",
		en: "St. Mark Servant"
	},
	ST_JOHN: {
		ar: "خادم أسرة القديس يوحنا",
		en: "St. John Servant"
	},
	ST_LUKE: {
		ar: "خادم أسرة القديس لوقا",
		en: "St. Luke Servant"
	},
	ST_HIDDEN_FAMILIES: {
		ar: "خادم الأسر المستترة",
		en: "Hidden Families Servant"
	},
	BLESSING_DISTRIBUTOR: {
		ar: "توزيع البركة",
		en: "Blessing Distributor"
	},
	SUPPLY_WAREHOUSE_MANAGER: {
		ar: "مخزن التموين",
		en: "Supply Warehouse Manager"
	},
	FURNITURE_WAREHOUSE_MANAGER: {
		ar: "مخزن الأثاث",
		en: "Furniture Warehouse Manager"
	},
	PHARMACY_WAREHOUSE_MANAGER: {
		ar: "مخزن الصيدلية",
		en: "Pharmacy Warehouse Manager"
	}
};
var ROLE_PERMISSIONS = {
	SUPER_ADMIN: [
		"view:dashboard",
		"view:beneficiary",
		"view:sensitive",
		"view:pharmacy",
		"view:blessing-distribution",
		"view:furniture",
		"view:clothes",
		"view:inventory",
		"view:audit",
		"add:beneficiary",
		"edit:beneficiary",
		"delete:beneficiary",
		"manage:inventory",
		"manage:pharmacy",
		"manage:furniture",
		"manage:supplies"
	],
	ADMIN: [
		"view:dashboard",
		"view:beneficiary",
		"view:pharmacy",
		"view:blessing-distribution",
		"view:furniture",
		"view:clothes",
		"view:inventory",
		"view:audit",
		"add:beneficiary",
		"edit:beneficiary",
		"delete:beneficiary",
		"manage:inventory",
		"manage:pharmacy",
		"manage:furniture",
		"manage:supplies"
	],
	BRIDE_AND_MEDICAL_AIDS_MANAGER: ["view:beneficiary", "view:sensitive"],
	ST_MATTHEW: [
		"view:dashboard",
		"view:beneficiary",
		"view:blessing-distribution",
		"view:furniture",
		"view:clothes",
		"view:pharmacy",
		"add:beneficiary",
		"edit:beneficiary"
	],
	ST_MARK: [
		"view:dashboard",
		"view:beneficiary",
		"view:blessing-distribution",
		"view:furniture",
		"view:clothes",
		"view:pharmacy",
		"add:beneficiary",
		"edit:beneficiary"
	],
	ST_JOHN: [
		"view:dashboard",
		"view:beneficiary",
		"view:blessing-distribution",
		"view:furniture",
		"view:clothes",
		"view:pharmacy",
		"add:beneficiary",
		"edit:beneficiary"
	],
	ST_LUKE: [
		"view:dashboard",
		"view:beneficiary",
		"view:blessing-distribution",
		"view:furniture",
		"view:clothes",
		"view:pharmacy",
		"add:beneficiary",
		"edit:beneficiary"
	],
	ST_HIDDEN_FAMILIES: [
		"view:dashboard",
		"view:beneficiary",
		"view:blessing-distribution",
		"view:furniture",
		"view:clothes",
		"view:pharmacy",
		"add:beneficiary",
		"edit:beneficiary"
	],
	BLESSING_DISTRIBUTOR: ["view:blessing-distribution"],
	SUPPLY_WAREHOUSE_MANAGER: [
		"view:inventory",
		"manage:inventory",
		"manage:supplies"
	],
	FURNITURE_WAREHOUSE_MANAGER: ["view:furniture", "manage:furniture"],
	PHARMACY_WAREHOUSE_MANAGER: ["view:pharmacy", "manage:pharmacy"]
};
function hasPermission(role, permission) {
	if (!role) return false;
	const perms = ROLE_PERMISSIONS[role];
	return perms ? perms.includes(permission) : false;
}
function getAssignedFamily(role) {
	if (!role) return null;
	return FAMILY_BY_ROLE[role] ?? null;
}
function isFamilyServant(role) {
	if (!role) return false;
	return FAMILY_SERVANT_ROLES.includes(role);
}
/** Canonical saint-family values stored in `individuals.saint_family`. */
var SAINT_FAMILY_VALUES = [
	"متى",
	"مرقس",
	"لوقا",
	"يوحنا",
	"أسر مستترة"
];
/**
* Saint-family values a role is allowed to see/select in dropdowns and forms.
* - SUPER_ADMIN / ADMIN: all families (including hidden).
* - ST_HIDDEN_FAMILIES: hidden families only.
* - ST_MATTHEW / ST_MARK / ST_JOHN / ST_LUKE: their own assigned family only.
* - Everyone else (warehouse managers, distributors, bride manager): all families EXCEPT hidden.
*/
function getVisibleSaintFamilyValues(role) {
	if (!role) return [];
	if (role === "SUPER_ADMIN" || role === "ADMIN") return SAINT_FAMILY_VALUES;
	if (role === "ST_HIDDEN_FAMILIES") return ["أسر مستترة"];
	if ([
		"ST_MATTHEW",
		"ST_MARK",
		"ST_JOHN",
		"ST_LUKE"
	].includes(role)) {
		const family = FAMILY_BY_ROLE[role];
		return family ? [family] : [];
	}
	return SAINT_FAMILY_VALUES.filter((f) => f !== "أسر مستترة");
}
function resolvePrimaryRole(dbRoles) {
	if (dbRoles.includes("SUPER_ADMIN")) return "SUPER_ADMIN";
	if (dbRoles.includes("ADMIN")) return "ADMIN";
	if (dbRoles.includes("BRIDE_AND_MEDICAL_AIDS_MANAGER")) return "BRIDE_AND_MEDICAL_AIDS_MANAGER";
	if (dbRoles.includes("ST_MATTHEW")) return "ST_MATTHEW";
	if (dbRoles.includes("ST_MARK")) return "ST_MARK";
	if (dbRoles.includes("ST_JOHN")) return "ST_JOHN";
	if (dbRoles.includes("ST_LUKE")) return "ST_LUKE";
	if (dbRoles.includes("ST_HIDDEN_FAMILIES")) return "ST_HIDDEN_FAMILIES";
	if (dbRoles.includes("BLESSING_DISTRIBUTOR")) return "BLESSING_DISTRIBUTOR";
	if (dbRoles.includes("SUPPLY_WAREHOUSE_MANAGER")) return "SUPPLY_WAREHOUSE_MANAGER";
	if (dbRoles.includes("FURNITURE_WAREHOUSE_MANAGER")) return "FURNITURE_WAREHOUSE_MANAGER";
	if (dbRoles.includes("PHARMACY_WAREHOUSE_MANAGER")) return "PHARMACY_WAREHOUSE_MANAGER";
	return null;
}
//#endregion
export { hasPermission as a, getVisibleSaintFamilyValues as i, getAssignedFamily as n, isFamilyServant as o, getFamilyScopeForRole as r, resolvePrimaryRole as s, ROLE_LABEL as t };
