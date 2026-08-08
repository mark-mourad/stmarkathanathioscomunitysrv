import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import {
  type Role,
  resolvePrimaryRole,
  hasPermission,
  getAssignedFamily,
  isFamilyServant,
  type Permission,
  getVisibleSaintFamilyValues,
  getFamilyScopeForRole,
} from "@/lib/permissions";

// ── RBAC helpers (server-side) ─────────────────────────────

function getServerRole(context: { dbRoles?: string[] }): Role | null {
  return resolvePrimaryRole(context.dbRoles ?? []);
}

function requirePermission(context: { dbRoles?: string[] }, permission: Permission): void {
  const role = getServerRole(context);
  if (!hasPermission(role, permission)) {
    throw new Error("غير مصرح لك بهذا الإجراء");
  }
}

/**
 * STRICT family derivation: the family is resolved ONLY from the role mapping.
 * There is deliberately NO fallback to `context.assignedFamily` or to any
 * default family (e.g. Hidden Families) — a family servant can never leak into
 * another family's scope even if the DB row is misconfigured.
 */
function getServerAssignedFamily(context: { dbRoles?: string[] }): string | null {
  return getAssignedFamily(getServerRole(context));
}

/** Apply saint_family filter to a query builder for family-scoped roles. */
function applyFamilyScope(
  query: any,
  context: { dbRoles?: string[]; assignedFamily?: string | null },
  familyColumn: string = "saint_family",
) {
  const family = getServerAssignedFamily(context);
  if (family) {
    return query.eq(familyColumn, family);
  }
  return query;
}

function requireFamilyScoped(context: { dbRoles?: string[] }, allowedRoles: Role[]): void {
  const role = getServerRole(context);
  if (role && (allowedRoles as readonly Role[]).includes(role)) return;
  if (!role || !(allowedRoles as readonly Role[]).includes(role)) {
    throw new Error("غير مصرح لك بهذا الإجراء");
  }
}

/** Throw unless the given saint_family is visible to the current role. */
function requireVisibleFamily(
  context: { dbRoles?: string[]; assignedFamily?: string | null },
  familyName: string,
): void {
  const role = getServerRole(context);
  const visible = getVisibleSaintFamilyValues(role);
  if (!visible.includes(familyName)) {
    throw new Error("غير مصرح لك بهذه الأسرة");
  }
}

export const HIDDEN_FAMILIES_SECTOR = "الأسر المستترة";

/** Canonical saint-family values stored in `individuals.saint_family`. */
export const SAINT_FAMILY_VALUES = ["متى", "مرقس", "لوقا", "يوحنا", "أسر مستترة"] as const;
export type SaintFamily = (typeof SAINT_FAMILY_VALUES)[number];
export const saintFamilySchema = z.enum(SAINT_FAMILY_VALUES);

/**
 * STRICT role → sector guard for `dashboard_metrics`.
 * - SUPER_ADMIN / ADMIN: any sector (global view).
 * - Family servants: ONLY the EXACT sector mapped to their role.
 * - Every other role: no sector.
 */
function isSectorAllowedForRole(sector: string, role: Role | null): boolean {
  if (role === "SUPER_ADMIN" || role === "ADMIN") return true;
  const scope = getFamilyScopeForRole(role);
  if (!scope) return false;
  return sector === scope.sector;
}

const INDIVIDUAL_LIST_COLUMNS =
  "id, full_name, nickname, national_id, phone, job, saint_family, address" as const;

/** Map stored/UI gender values to the canonical enum used in the database. */
export function normalizeGender(value: unknown): "male" | "female" | undefined {
  if (value === "male" || value === "female") return value;
  if (typeof value !== "string") return undefined;

  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const lower = trimmed.toLowerCase();
  if (lower === "male" || lower === "m") return "male";
  if (lower === "female" || lower === "f") return "female";
  if (trimmed === "ذكر") return "male";
  if (trimmed === "أنثى" || trimmed === "انثى") return "female";

  return undefined;
}

export const genderSchema = z.preprocess(
  normalizeGender,
  z.enum(["male", "female"], {
    required_error: "برجاء اختيار النوع",
    invalid_type_error: "برجاء اختيار النوع بشكل صحيح",
  }),
);

// ---- Dashboard ----
export const getDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    requirePermission(context, "view:dashboard");
    const role = getServerRole(context);
    const isAdmin = role === "SUPER_ADMIN" || role === "ADMIN";
    // STRICT mapping: each family servant is bound to EXACTLY ONE family scope.
    const scope = getFamilyScopeForRole(role);

    const { data: allMetrics } = await context.supabase
      .from("dashboard_metrics")
      .select("*")
      .order("display_order", { ascending: true });
    const rows = allMetrics ?? [];

    let metrics: typeof rows;
    let hiddenFamilies: (typeof rows)[number] | null;

    if (isAdmin) {
      // Global aggregated financial totals + all family breakdown (incl. Hidden Families).
      metrics = rows.filter((m) => m.sector !== HIDDEN_FAMILIES_SECTOR);
      hiddenFamilies = rows.find((m) => m.sector === HIDDEN_FAMILIES_SECTOR) ?? null;
    } else if (scope) {
      // STRICT family scope: the exact sector mapped to the role — nothing else.
      // ABSOLUTE PRIVACY: never another standard family, never Hidden Families.
      metrics = rows.filter((m) => m.sector === scope.sector);
      hiddenFamilies = null;
    } else {
      // Non-admin, non-family roles receive NO financial metrics at all.
      metrics = [];
      hiddenFamilies = null;
    }

    // Family count strictly scoped to the mapped saint_family (or global for admins).
    let familyQuery = context.supabase.from("individuals").select("id");
    if (scope) {
      familyQuery = familyQuery.eq("saint_family", scope.saintFamily);
    }
    const { data: families } = await familyQuery;

    return {
      metrics,
      hiddenFamilies,
      hiddenFamiliesPersisted: hiddenFamilies !== null,
      total_families: families?.length ?? 0,
    };
  });

export const updateMetric = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().uuid(),
        monthly: z.number().nonnegative(),
        study: z.number().nonnegative(),
        therapeutic: z.number().nonnegative(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    requirePermission(context, "view:dashboard");
    const role = getServerRole(context);

    // Financial mutation lockdown: load the target row and refuse any update
    // that would touch a sector outside the caller's assigned family.
    const { data: metric, error: fetchError } = await context.supabase
      .from("dashboard_metrics")
      .select("id, sector")
      .eq("id", data.id)
      .maybeSingle();
    if (fetchError) throw new Error(fetchError.message);
    if (!metric) throw new Error("لم يتم العثور على القيمة");
    if (!isSectorAllowedForRole(metric.sector, role)) {
      throw new Error("غير مصرح لك بتعديل هذه الأسرة");
    }

    const { error } = await context.supabase
      .from("dashboard_metrics")
      .update({
        monthly: data.monthly,
        study: data.study,
        therapeutic: data.therapeutic,
        updated_by: context.userId,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const saveHiddenFamiliesMetric = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        monthly: z.number().nonnegative(),
        study: z.number().nonnegative(),
        therapeutic: z.number().nonnegative(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    requirePermission(context, "view:dashboard");
    const role = getServerRole(context);
    const isAdmin = role === "SUPER_ADMIN" || role === "ADMIN";
    // Hidden Families metric may only be mutated by admins or the Hidden
    // Families servant — never by a standard family servant.
    if (!isAdmin && role !== "ST_HIDDEN_FAMILIES") {
      throw new Error("غير مصرح لك بتعديل الأسر المستترة");
    }
    const { data: existing } = await context.supabase
      .from("dashboard_metrics")
      .select("id")
      .eq("sector", HIDDEN_FAMILIES_SECTOR)
      .maybeSingle();
    if (existing) {
      const { error } = await context.supabase
        .from("dashboard_metrics")
        .update({
          monthly: data.monthly,
          study: data.study,
          therapeutic: data.therapeutic,
          updated_by: context.userId,
        })
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
      return { id: existing.id };
    }
    const { data: created, error } = await context.supabase
      .from("dashboard_metrics")
      .insert({
        sector: HIDDEN_FAMILIES_SECTOR,
        monthly: data.monthly,
        study: data.study,
        therapeutic: data.therapeutic,
        display_order: 0,
        updated_by: context.userId,
      })
      .select("id")
      .single();
    if (error || !created) throw new Error(error?.message ?? "فشل الحفظ");
    return { id: created.id };
  });

// ---- Search ----
export const searchIndividuals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ mode: z.enum(["name", "national_id"]), q: z.string().min(1) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const assignedFamily = getServerAssignedFamily(context);
    const q = data.q.trim();

    let individualQuery;
    let familyQuery;

    if (data.mode === "name") {
      individualQuery = context.supabase
        .from("individuals")
        .select(INDIVIDUAL_LIST_COLUMNS)
        .or(`full_name.ilike.%${q}%,nickname.ilike.%${q}%`)
        .limit(50);

      if (assignedFamily) {
        individualQuery = individualQuery.eq("saint_family", assignedFamily);
      }

      familyQuery = context.supabase
        .from("family_members")
        .select("id, full_name, national_id, relation, individual_id")
        .ilike("full_name", `%${q}%`)
        .limit(50);
    } else {
      // Search by national_id - exact match first, then substring
      const cleanNationalId = q.replace(/\D/g, ""); // Remove non-digits

      individualQuery = context.supabase
        .from("individuals")
        .select(INDIVIDUAL_LIST_COLUMNS)
        .or(`national_id.eq.${cleanNationalId},national_id.ilike.%${cleanNationalId}%`)
        .limit(50);

      familyQuery = context.supabase
        .from("family_members")
        .select("id, full_name, national_id, relation, individual_id")
        .or(`national_id.eq.${cleanNationalId},national_id.ilike.%${cleanNationalId}%`)
        .limit(50);
    }

    const [
      { data: individualRows, error: individualError },
      { data: familyRows, error: familyError },
    ] = await Promise.all([individualQuery, familyQuery]);

    if (individualError) throw new Error(`خطأ في البحث: ${individualError.message}`);
    if (familyError) throw new Error(`خطأ في البحث: ${familyError.message}`);

    const individuals = (individualRows ?? []).map((row) => ({
      type: "individual" as const,
      id: row.id,
      full_name: row.full_name,
      nickname: row.nickname,
      national_id: row.national_id,
      phone: row.phone,
      job: row.job,
      saint_family: row.saint_family,
      address: row.address,
    }));

    const familyResults = familyRows ?? [];
    const individualIds = [...new Set(familyResults.map((row) => row.individual_id))];
    const { data: familyIndividuals, error: familyIndividualsError } =
      individualIds.length > 0
        ? await context.supabase
            .from("individuals")
            .select(INDIVIDUAL_LIST_COLUMNS)
            .in("id", individualIds)
        : { data: [] as any[], error: null };
    if (familyIndividualsError)
      throw new Error(`خطأ في جلب بيانات الأسرة: ${familyIndividualsError.message}`);

    const individualMap = (familyIndividuals ?? []).reduce(
      (map, item) => ({ ...map, [item.id]: item }),
      {} as Record<string, (typeof familyIndividuals)[number]>,
    );

    const familySearchResults = familyResults.map((row) => {
      const individual = individualMap[row.individual_id];
      return {
        type: "family" as const,
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
        family_relation: row.relation,
      };
    });

    return [...individuals, ...familySearchResults].slice(0, 50);
  });

export const getAllGuests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ saint_family: saintFamilySchema.optional() }).parse(d ?? {}))
  .handler(async ({ data, context }) => {
    const assignedFamily = getServerAssignedFamily(context);
    const saintFamily = assignedFamily ?? data.saint_family;

    try {
      let individualQuery = context.supabase
        .from("individuals")
        .select(INDIVIDUAL_LIST_COLUMNS)
        .order("full_name", { ascending: true })
        .limit(500);

      if (saintFamily) {
        individualQuery = individualQuery.eq("saint_family", saintFamily);
      }

      const { data: individualRows, error: individualsError } = await individualQuery;

      if (individualsError) {
        console.error("[getAllGuests] Database error fetching individuals:", {
          saint_family: saintFamily,
          code: individualsError.code,
          message: individualsError.message,
          details: individualsError.details,
        });
        throw new Error(`خطأ في جلب المخدومين: ${individualsError.message}`);
      }

      const individuals = (individualRows ?? []).map((row) => ({
        type: "individual" as const,
        id: row.id,
        full_name: row.full_name,
        nickname: row.nickname,
        national_id: row.national_id,
        phone: row.phone,
        job: row.job,
        saint_family: row.saint_family,
        address: row.address,
      }));

      const individualMap = (individualRows ?? []).reduce(
        (map, item) => ({ ...map, [item.id]: item }),
        {} as Record<string, NonNullable<typeof individualRows>[number]>,
      );

      let familyQuery = context.supabase
        .from("family_members")
        .select("id, full_name, national_id, relation, individual_id")
        .order("created_at", { ascending: false })
        .limit(500);

      if (saintFamily) {
        const filteredIds = (individualRows ?? []).map((row) => row.id);
        if (filteredIds.length === 0) {
          return individuals;
        }
        familyQuery = familyQuery.in("individual_id", filteredIds);
      }

      const { data: familyRows, error: familyError } = await familyQuery;

      if (familyError) {
        console.error("[getAllGuests] Database error fetching family members:", {
          saint_family: saintFamily,
          code: familyError.code,
          message: familyError.message,
          details: familyError.details,
        });
        throw new Error(`خطأ في جلب أفراد الأسرة: ${familyError.message}`);
      }

      if (!saintFamily) {
        const parentIds = [...new Set((familyRows ?? []).map((row) => row.individual_id))];
        const missingIds = parentIds.filter((id) => !individualMap[id]);

        if (missingIds.length > 0) {
          const { data: familyIndividuals, error: familyIndividualsError } = await context.supabase
            .from("individuals")
            .select(INDIVIDUAL_LIST_COLUMNS)
            .in("id", missingIds);

          if (familyIndividualsError) {
            console.error("[getAllGuests] Database error fetching family individuals:", {
              code: familyIndividualsError.code,
              message: familyIndividualsError.message,
              details: familyIndividualsError.details,
            });
            throw new Error(`خطأ في جلب بيانات أفراد الأسرة: ${familyIndividualsError.message}`);
          }

          for (const item of familyIndividuals ?? []) {
            individualMap[item.id] = item;
          }
        }
      }

      const familySearchResults = (familyRows ?? []).map((row) => {
        const individual = individualMap[row.individual_id];
        return {
          type: "family" as const,
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
          family_relation: row.relation,
        };
      });

      return [...individuals, ...familySearchResults].slice(0, 500);
    } catch (error) {
      console.error("[getAllGuests] Unexpected error:", error);
      throw new Error(error instanceof Error ? error.message : "خطأ في جلب الضيوف");
    }
  });

const EXPORT_INDIVIDUAL_COLUMNS =
  "id, full_name, nickname, gender, mother_name, national_id, birth_date, job, salary, phone, mobile, landline, confession_father, saint_family, address, household_count, housing_type, rooms, has_washing_machine, has_fridge, has_stove, has_mattress, has_computer, has_sofa, has_dining, has_tv, has_wardrobe, has_alt_address, alt_address, alt_governorate" as const;

export const getExportData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ saint_family: saintFamilySchema.optional() }).parse(d ?? {}))
  .handler(async ({ data, context }) => {
    const assignedFamily = getServerAssignedFamily(context);
    const saintFamily = assignedFamily ?? data.saint_family;

    let individualQuery = context.supabase
      .from("individuals")
      .select(EXPORT_INDIVIDUAL_COLUMNS)
      .order("full_name", { ascending: true })
      .limit(500);

    if (saintFamily) {
      individualQuery = individualQuery.eq("saint_family", saintFamily);
    }

    const { data: individualRows, error: individualsError } = await individualQuery;
    if (individualsError) throw new Error(`خطأ في جلب المخدومين: ${individualsError.message}`);

    const individualIds = (individualRows ?? []).map((r) => r.id);

    let familyQuery = context.supabase
      .from("family_members")
      .select("id, full_name, national_id, relation, individual_id")
      .order("created_at", { ascending: false })
      .limit(500);
    if (saintFamily && individualIds.length > 0) {
      familyQuery = familyQuery.in("individual_id", individualIds);
    }

    let financialsQuery = context.supabase.from("financials").select("*").limit(500);
    if (saintFamily && individualIds.length > 0) {
      financialsQuery = financialsQuery.in("individual_id", individualIds);
    }

    let churchSupportQuery = context.supabase
      .from("monthly_church_support")
      .select("individual_id, church_name, amount")
      .limit(500);
    if (saintFamily && individualIds.length > 0) {
      churchSupportQuery = churchSupportQuery.in("individual_id", individualIds);
    }

    const [{ data: familyRows }, { data: financialsRows }, { data: churchSupportRows }] =
      await Promise.all([familyQuery, financialsQuery, churchSupportQuery]);

    const financialsMap: Record<string, any> = {};
    (financialsRows ?? []).forEach((f) => {
      financialsMap[f.individual_id] = f;
    });

    const churchSupportMap: Record<string, { total: number; details: string }> = {};
    (churchSupportRows ?? []).forEach((cs) => {
      if (!churchSupportMap[cs.individual_id]) {
        churchSupportMap[cs.individual_id] = { total: 0, details: "" };
      }
      churchSupportMap[cs.individual_id].total += Number(cs.amount || 0);
      const parts = churchSupportMap[cs.individual_id].details
        ? [churchSupportMap[cs.individual_id].details]
        : [];
      parts.push(`${cs.church_name}: ${Number(cs.amount || 0)}`);
      churchSupportMap[cs.individual_id].details = parts.join("، ");
    });

    const familyByIndividual: Record<string, Array<{ full_name: string; relation: string }>> = {};
    (familyRows ?? []).forEach((fm) => {
      if (!familyByIndividual[fm.individual_id]) familyByIndividual[fm.individual_id] = [];
      familyByIndividual[fm.individual_id].push({
        full_name: fm.full_name,
        relation: fm.relation ?? "",
      });
    });

    return {
      individuals: individualRows ?? [],
      familyByIndividual,
      financialsMap,
      churchSupportMap,
    };
  });

// ---- Individual full profile ----
export const getIndividual = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const role = getServerRole(context);
    if (!hasPermission(role, "view:beneficiary")) {
      throw new Error("غير مصرح لك بعرض بيانات المخدومين");
    }

    const [{ data: ind }, { data: fam }, { data: fin }, { data: churchSupport }] =
      await Promise.all([
        context.supabase.from("individuals").select("*").eq("id", data.id).maybeSingle(),
        context.supabase
          .from("family_members")
          .select("*")
          .eq("individual_id", data.id)
          .order("seq", { ascending: true }),
        context.supabase.from("financials").select("*").eq("individual_id", data.id).maybeSingle(),
        context.supabase.from("monthly_church_support").select("*").eq("individual_id", data.id),
      ]);
    if (!ind) throw new Error("لم يتم العثور على المخدوم");

    // Family scoping for ST_* roles
    const assignedFamily = getServerAssignedFamily(context);
    if (assignedFamily && ind.saint_family !== assignedFamily) {
      throw new Error("غير مصرح لك بعرض هذا الملف");
    }

    return {
      individual: ind,
      family: fam ?? [],
      financials: fin,
      churchSupport: churchSupport ?? [],
    };
  });

// ---- Create individual ----
const individualSchema = z.object({
  full_name: z.string().min(1),
  nickname: z.string().optional().nullable(),
  mother_name: z.string().optional().nullable(),
  gender: genderSchema,
  national_id: z.string().optional().nullable(),
  birth_date: z.string().optional().nullable(),
  birth_governorate: z.string().optional().nullable(),
  job: z.string().optional().nullable(),
  salary: z.number().optional().nullable(),
  phone: z.string().optional().nullable(),
  mobile: z.string().optional().nullable(),
  landline: z.string().optional().nullable(),
  confession_father: z.string().optional().nullable(),
  saint_family: saintFamilySchema,
  address: z.string().optional().nullable(),
  household_count: z.number().int().optional().nullable(),
  housing_type: z.string().optional().nullable(),
  rooms: z.number().int().optional().nullable(),
  has_washing_machine: z.boolean().optional(),
  has_fridge: z.boolean().optional(),
  has_stove: z.boolean().optional(),
  has_mattress: z.boolean().optional(),
  has_computer: z.boolean().optional(),
  has_sofa: z.boolean().optional(),
  has_dining: z.boolean().optional(),
  has_tv: z.boolean().optional(),
  has_wardrobe: z.boolean().optional(),
  has_alt_address: z.boolean().optional(),
  alt_address: z.string().optional().nullable(),
  alt_governorate: z.string().optional().nullable(),
  family: z
    .array(
      z.object({
        id: z.string().uuid().optional(),
        full_name: z.string().min(1),
        national_id: z.string().optional().nullable(),
        relation: z.string().optional().nullable(),
        insurance_number: z.string().optional().nullable(),
        marital_status: z.string().optional().nullable(),
        confession_father: z.string().optional().nullable(),
        school_or_job: z.string().optional().nullable(),
        income: z.number().optional().nullable(),
        notes: z.string().optional().nullable(),
      }),
    )
    .optional(),
  financials: z
    .object({
      church_monthly: z.number().optional(),
      therapeutic_aid: z.number().optional(),
      study_aid: z.number().optional(),
      basic_salary: z.number().optional(),
      extra_income: z.number().optional(),
      electricity_gas_water: z.number().optional(),
      phone_bill: z.number().optional(),
      rent: z.number().optional(),
      treatment_cost: z.number().optional(),
      education_cost: z.number().optional(),
    })
    .optional(),
  churchSupport: z
    .array(
      z.object({
        id: z.string().uuid().optional(),
        church_name: z.string().min(1),
        amount: z.number(),
      }),
    )
    .optional(),
});

export const createIndividual = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => individualSchema.parse(d))
  .handler(async ({ data, context }) => {
    requirePermission(context, "add:beneficiary");
    const { family, financials, churchSupport, ...ind } = data;
    const assignedFamily = getServerAssignedFamily(context);
    if (assignedFamily && ind.saint_family !== assignedFamily) {
      throw new Error("غير مصرح لك بإضافة مخدومين من هذه الأسرة");
    }

    // Trim and clean national_id
    if (ind.national_id) {
      ind.national_id = ind.national_id.trim();

      // Verify it's 14 digits
      if (!/^\d{14}$/.test(ind.national_id)) {
        throw new Error("الرقم القومي يجب أن يكون 14 رقم بالضبط");
      }

      // Check if national_id already exists
      const { data: existing, error: checkError } = await context.supabase
        .from("individuals")
        .select("id")
        .eq("national_id", ind.national_id)
        .maybeSingle();

      if (checkError) throw new Error("خطأ في التحقق من الرقم القومي");
      if (existing) {
        throw new Error("الرقم القومي موجود بالفعل في النظام");
      }
    }

    const { data: created, error } = await context.supabase
      .from("individuals")
      .insert({ ...ind, created_by: context.userId })
      .select("id")
      .single();
    if (error || !created) throw new Error(error?.message ?? "فشل الحفظ");
    if (family?.length) {
      const rows = family.map((f, i) => ({ ...f, seq: i + 1, individual_id: created.id }));
      await context.supabase.from("family_members").insert(rows);
    }
    if (financials) {
      await context.supabase
        .from("financials")
        .insert({ ...financials, individual_id: created.id });
    }
    if (churchSupport?.length) {
      const supportRows = churchSupport.map((cs) => ({ ...cs, individual_id: created.id }));
      await context.supabase.from("monthly_church_support").insert(supportRows);
    }
    return { id: created.id };
  });

export const updateIndividual = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => individualSchema.extend({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    requirePermission(context, "edit:beneficiary");
    const { id, family, financials, churchSupport, ...ind } = data;

    // Financial mutation lockdown: a family servant may only edit individuals
    // (and their financials) that already belong to their assigned family.
    const assignedFamily = getServerAssignedFamily(context);
    if (assignedFamily) {
      const { data: existing, error: scopeError } = await context.supabase
        .from("individuals")
        .select("id, saint_family")
        .eq("id", id)
        .maybeSingle();
      if (scopeError) throw new Error(scopeError.message);
      if (!existing) throw new Error("لم يتم العثور على المخدوم");
      if (existing.saint_family !== assignedFamily) {
        throw new Error("غير مصرح لك بتعديل مخدومين من هذه الأسرة");
      }
      if (ind.saint_family !== assignedFamily) {
        throw new Error("غير مصرح لك بتعديل هذه الأسرة");
      }
    }

    // Trim and validate national_id
    if (ind.national_id) {
      ind.national_id = ind.national_id.trim();

      // Verify it's 14 digits
      if (!/^\d{14}$/.test(ind.national_id)) {
        throw new Error("الرقم القومي يجب أن يكون 14 رقم بالضبط");
      }

      // Check if national_id already exists in other records (exclude current record)
      const { data: existing, error: checkError } = await context.supabase
        .from("individuals")
        .select("id")
        .eq("national_id", ind.national_id)
        .neq("id", id)
        .maybeSingle();

      if (checkError) throw new Error("خطأ في التحقق من الرقم القومي");
      if (existing) {
        throw new Error("الرقم القومي موجود بالفعل في النظام لشخص آخر");
      }
    }

    const { error: indErr } = await context.supabase.from("individuals").update(ind).eq("id", id);
    if (indErr) throw new Error(indErr.message);

    // Synchronize family members: update existing rows in-place (by id),
    // insert new rows, and delete rows that were removed from the form.
    const submittedFamily = family ?? [];
    const { data: existingFamily } = await context.supabase
      .from("family_members")
      .select("id")
      .eq("individual_id", id);
    const existingFamilyIds = new Set((existingFamily ?? []).map((r) => r.id));
    const submittedFamilyIds = submittedFamily
      .map((f) => f.id)
      .filter((fid): fid is string => Boolean(fid));
    const removedFamilyIds = [...existingFamilyIds].filter(
      (existingId) => !submittedFamilyIds.includes(existingId),
    );
    if (removedFamilyIds.length > 0) {
      const { error: famDelErr } = await context.supabase
        .from("family_members")
        .delete()
        .in("id", removedFamilyIds);
      if (famDelErr) throw new Error(famDelErr.message);
    }
    let seq = 1;
    for (const f of submittedFamily) {
      const { id: famId, ...familyFields } = f;
      if (famId && existingFamilyIds.has(famId)) {
        const { error: famUpdErr } = await context.supabase
          .from("family_members")
          .update({ ...familyFields, seq: seq++ })
          .eq("id", famId);
        if (famUpdErr) throw new Error(famUpdErr.message);
      } else {
        const { error: famInsErr } = await context.supabase
          .from("family_members")
          .insert({ ...familyFields, seq: seq++, individual_id: id });
        if (famInsErr) throw new Error(famInsErr.message);
      }
    }

    if (financials) {
      const { data: existing } = await context.supabase
        .from("financials")
        .select("id")
        .eq("individual_id", id)
        .maybeSingle();
      if (existing) {
        const { error: finErr } = await context.supabase
          .from("financials")
          .update(financials)
          .eq("individual_id", id);
        if (finErr) throw new Error(finErr.message);
      } else {
        const { error: finErr } = await context.supabase
          .from("financials")
          .insert({ ...financials, individual_id: id });
        if (finErr) throw new Error(finErr.message);
      }
    }

    // Synchronize church support: update existing rows in-place (by id),
    // insert new rows, and delete rows that were removed from the form.
    const submittedSupport = churchSupport ?? [];
    const { data: existingSupport } = await context.supabase
      .from("monthly_church_support")
      .select("id")
      .eq("individual_id", id);
    const existingSupportIds = new Set((existingSupport ?? []).map((r) => r.id));
    const submittedSupportIds = submittedSupport
      .map((cs) => cs.id)
      .filter((cid): cid is string => Boolean(cid));
    const removedSupportIds = [...existingSupportIds].filter(
      (existingId) => !submittedSupportIds.includes(existingId),
    );
    if (removedSupportIds.length > 0) {
      const { error: supportDelErr } = await context.supabase
        .from("monthly_church_support")
        .delete()
        .in("id", removedSupportIds);
      if (supportDelErr) throw new Error(supportDelErr.message);
    }
    for (const cs of submittedSupport) {
      const { id: supportId, ...supportFields } = cs;
      if (supportId && existingSupportIds.has(supportId)) {
        const { error: supportUpdErr } = await context.supabase
          .from("monthly_church_support")
          .update(supportFields)
          .eq("id", supportId);
        if (supportUpdErr) throw new Error(supportUpdErr.message);
      } else {
        const { error: supportInsErr } = await context.supabase
          .from("monthly_church_support")
          .insert({ ...supportFields, individual_id: id });
        if (supportInsErr) throw new Error(supportInsErr.message);
      }
    }

    return { id };
  });

export const deleteIndividual = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    requirePermission(context, "delete:beneficiary");
    const { error } = await context.supabase.from("individuals").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---- Audit log ----
export const getAuditLog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    requirePermission(context, "view:audit");
    const { data, error } = await context.supabase
      .from("audit_log")
      .select("id, user_email, action, table_name, record_id, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const deleteAuditLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    requirePermission(context, "view:audit");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("audit_log").delete().gt("id", 0);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---- Inventory (المخزن) ----
export const getInventory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("inventory")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

export const updateInventory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        weekly_total: z.number().int().nonnegative(),
        details: z.string().optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    requirePermission(context, "manage:inventory");

    const { data: existing } = await context.supabase
      .from("inventory")
      .select("id")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing) {
      const { data: updated, error } = await context.supabase
        .from("inventory")
        .update({
          weekly_total: data.weekly_total,
          details: data.details,
          updated_by: context.userId,
        })
        .eq("id", existing.id)
        .select("id, weekly_total")
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!updated) {
        throw new Error(
          "تعذر حفظ البركة: لم يتم تحديث أي صف في قاعدة البيانات (تحقق من الصلاحيات)",
        );
      }
      return { id: updated.id };
    } else {
      const { data: created, error } = await context.supabase
        .from("inventory")
        .insert({
          weekly_total: data.weekly_total,
          details: data.details,
          updated_by: context.userId,
        })
        .select("id")
        .single();
      if (error || !created) throw new Error(error?.message ?? "فشل الحفظ");
      return { id: created.id };
    }
  });

// ---- Blessing Distribution (توزيع البركة) ----
export const getIndividualsBySaintFamily = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ saint_family: saintFamilySchema }).parse(d))
  .handler(async ({ data, context }) => {
    // Enforce family scoping for ST_* roles
    const assignedFamily = getServerAssignedFamily(context);
    const saintFamily = assignedFamily ?? data.saint_family;
    if (assignedFamily && assignedFamily !== data.saint_family) {
      throw new Error("غير مصرح لك بهذه الأسرة");
    }
    try {
      const { data: individuals, error } = await context.supabase
        .from("individuals")
        .select("id, full_name, nickname, national_id")
        .eq("saint_family", saintFamily)
        .order("full_name", { ascending: true });

      if (error) {
        console.error("[getIndividualsBySaintFamily] Database error:", {
          saint_family: data.saint_family,
          code: error.code,
          message: error.message,
          details: error.details,
        });
        throw new Error(`خطأ في جلب المخدومين لأسرة ${data.saint_family}: ${error.message}`);
      }

      return individuals ?? [];
    } catch (err) {
      console.error("[getIndividualsBySaintFamily] Unexpected error:", err);
      throw err;
    }
  });

export const getBlessingDistribution = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        saint_family: saintFamilySchema,
        distribution_date: z.string().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const assignedFamily = getServerAssignedFamily(context);
    const saintFamily = assignedFamily ?? data.saint_family;
    if (assignedFamily && assignedFamily !== data.saint_family) {
      throw new Error("غير مصرح لك بهذه الأسرة");
    }
    try {
      const date = data.distribution_date || new Date().toISOString().split("T")[0];
      const { data: records, error } = await context.supabase
        .from("blessing_distribution")
        .select("*")
        .eq("saint_family", saintFamily)
        .eq("distribution_date", date);

      if (error) {
        console.error("[getBlessingDistribution] Database error:", {
          saint_family: data.saint_family,
          distribution_date: date,
          code: error.code,
          message: error.message,
          details: error.details,
        });
        throw new Error(`خطأ في جلب توزيع البركة: ${error.message}`);
      }

      return records ?? [];
    } catch (err) {
      console.error("[getBlessingDistribution] Unexpected error:", err);
      throw err;
    }
  });

export const saveBlessingDistribution = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        saint_family: saintFamilySchema,
        distribution_date: z.string().optional(),
        received_individuals: z.array(z.string().uuid()),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    // Allow BLESSING_DISTRIBUTOR, ST_*, ADMIN, SUPER_ADMIN
    const role = getServerRole(context);
    if (!hasPermission(role, "view:blessing-distribution")) {
      throw new Error("غير مصرح لك بتوزيع البركة");
    }
    const assignedFamily = getServerAssignedFamily(context);
    if (assignedFamily && assignedFamily !== data.saint_family) {
      throw new Error("غير مصرح لك بهذه الأسرة");
    }
    const date = data.distribution_date || new Date().toISOString().split("T")[0];

    // Get current inventory
    const { data: inventory, error: inventoryError } = await context.supabase
      .from("inventory")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (inventoryError) throw new Error(inventoryError.message);
    if (!inventory) {
      throw new Error("يرجى إعداد المخزون أولاً");
    }

    // Get existing records for this family and date
    const { data: existingRecords, error: existingError } = await context.supabase
      .from("blessing_distribution")
      .select("*")
      .eq("saint_family", data.saint_family)
      .eq("distribution_date", date);

    if (existingError) throw new Error(existingError.message);

    const existingReceived = (existingRecords ?? []).filter((r) => r.received);
    const previousCount = existingReceived.length;
    const newCount = data.received_individuals.length;
    const difference = newCount - previousCount;

    // Check if inventory has enough
    if (difference > 0 && inventory.weekly_total < difference) {
      throw new Error(
        `المخزون غير كافٍ. المطلوب: ${difference}، المتاح: ${inventory.weekly_total}`,
      );
    }

    // Get all individuals for this family
    const { data: individuals, error: individualsError } = await context.supabase
      .from("individuals")
      .select("id")
      .eq("saint_family", data.saint_family);

    if (individualsError) throw new Error(individualsError.message);

    const allIndividualIds = (individuals ?? []).map((i) => i.id);

    // Use upsert to handle existing records without violating unique constraint
    const recordsToUpsert = allIndividualIds.map((individualId) => ({
      saint_family: data.saint_family,
      individual_id: individualId,
      received: data.received_individuals.includes(individualId),
      distribution_date: date,
      created_by: context.userId,
    }));

    const { error: upsertError } = await context.supabase
      .from("blessing_distribution")
      .upsert(recordsToUpsert, {
        onConflict: "saint_family,individual_id,distribution_date",
        ignoreDuplicates: false,
      });

    if (upsertError) throw new Error(upsertError.message);

    // Update inventory
    const { data: updatedInventory, error: updateInventoryError } = await context.supabase
      .from("inventory")
      .update({
        weekly_total: inventory.weekly_total - difference,
        updated_by: context.userId,
      })
      .eq("id", inventory.id)
      .select("id")
      .maybeSingle();

    if (updateInventoryError) throw new Error(updateInventoryError.message);
    if (!updatedInventory) {
      throw new Error("تعذر تحديث المخزون: لم يتم تحديث أي صف (تحقق من الصلاحيات)");
    }

    return { ok: true, new_inventory_total: inventory.weekly_total - difference };
  });

export const scanBlessingDistribution = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        national_id: z.string().min(1),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const role = getServerRole(context);
    if (!hasPermission(role, "view:blessing-distribution")) {
      throw new Error("غير مصرح لك بتوزيع البركة");
    }
    const nationalId = data.national_id.trim();
    const date = new Date().toISOString().split("T")[0];

    // Look up the individual by national_id
    const { data: individual, error: indError } = await context.supabase
      .from("individuals")
      .select("id, full_name, saint_family")
      .eq("national_id", nationalId)
      .maybeSingle();

    if (indError) throw new Error(indError.message);
    if (!individual) throw new Error("لم يتم العثور على مخدوم بهذا الرقم القومي");
    if (!individual.saint_family) throw new Error("هذا المخدوم غير مسجل في أي أسرة قديس");

    // Family scoping for ST_* roles: a servant may only scan their own family.
    const assignedFamily = getServerAssignedFamily(context);
    if (assignedFamily && assignedFamily !== individual.saint_family) {
      throw new Error("غير مصرح لك بهذه الأسرة");
    }

    // Get current inventory
    const { data: inventory, error: inventoryError } = await context.supabase
      .from("inventory")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (inventoryError) throw new Error(inventoryError.message);
    if (!inventory) throw new Error("يرجى إعداد المخزون أولاً");

    // Check if already received
    const { data: existing, error: existError } = await context.supabase
      .from("blessing_distribution")
      .select("id, received")
      .eq("saint_family", individual.saint_family)
      .eq("individual_id", individual.id)
      .eq("distribution_date", date)
      .maybeSingle();

    if (existError) throw new Error(existError.message);
    if (existing?.received) {
      throw new Error(`${individual.full_name} استلم البركة بالفعل`);
    }

    // Check inventory
    if (inventory.weekly_total < 1) {
      throw new Error("المخزون غير كافٍ");
    }

    // Upsert the record
    const { error: upsertError } = await context.supabase.from("blessing_distribution").upsert(
      {
        saint_family: individual.saint_family,
        individual_id: individual.id,
        received: true,
        distribution_date: date,
        distributed_at: new Date().toISOString(),
        created_by: context.userId,
      },
      { onConflict: "saint_family,individual_id,distribution_date", ignoreDuplicates: false },
    );

    if (upsertError) throw new Error(upsertError.message);

    // Decrement inventory
    const { data: updatedInventory, error: updateInvError } = await context.supabase
      .from("inventory")
      .update({ weekly_total: inventory.weekly_total - 1, updated_by: context.userId })
      .eq("id", inventory.id)
      .select("id")
      .maybeSingle();

    if (updateInvError) throw new Error(updateInvError.message);
    if (!updatedInventory) {
      throw new Error("تعذر تحديث المخزون: لم يتم تحديث أي صف (تحقق من الصلاحيات)");
    }

    return {
      ok: true,
      individual_name: individual.full_name,
      new_inventory_total: inventory.weekly_total - 1,
    };
  });

export const toggleBlessingDistribution = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        saint_family: saintFamilySchema,
        individual_id: z.string().uuid(),
        distribution_date: z.string().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const role = getServerRole(context);
    if (!hasPermission(role, "view:blessing-distribution")) {
      throw new Error("غير مصرح لك بتوزيع البركة");
    }
    const assignedFamily = getServerAssignedFamily(context);
    if (assignedFamily && assignedFamily !== data.saint_family) {
      throw new Error("غير مصرح لك بهذه الأسرة");
    }
    const date = data.distribution_date || new Date().toISOString().split("T")[0];

    // Verify the individual belongs to the requested saint_family
    const { data: individual, error: indError } = await context.supabase
      .from("individuals")
      .select("id, full_name, saint_family")
      .eq("id", data.individual_id)
      .maybeSingle();
    if (indError) throw new Error(indError.message);
    if (!individual) throw new Error("لم يتم العثور على المخدوم");
    if (individual.saint_family !== data.saint_family) {
      throw new Error("هذا المخدوم غير مسجل في هذه الأسرة");
    }

    // Read the current record state
    const { data: existing, error: existError } = await context.supabase
      .from("blessing_distribution")
      .select("id, received")
      .eq("saint_family", data.saint_family)
      .eq("individual_id", data.individual_id)
      .eq("distribution_date", date)
      .maybeSingle();
    if (existError) throw new Error(existError.message);

    const currentlyReceived = existing?.received ?? false;
    const newReceived = !currentlyReceived;

    // Read current inventory
    const { data: inventory, error: inventoryError } = await context.supabase
      .from("inventory")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (inventoryError) throw new Error(inventoryError.message);
    if (!inventory) throw new Error("يرجى إعداد المخزون أولاً");

    // Compute inventory delta: checking a box consumes 1, unchecking returns 1.
    let newTotal = inventory.weekly_total;
    if (newReceived && !currentlyReceived) {
      if (inventory.weekly_total < 1) {
        throw new Error("المخزون غير كافٍ");
      }
      newTotal = inventory.weekly_total - 1;
    } else if (!newReceived && currentlyReceived) {
      newTotal = inventory.weekly_total + 1;
    }

    // Upsert the record with the new state
    const { error: upsertError } = await context.supabase.from("blessing_distribution").upsert(
      {
        saint_family: data.saint_family,
        individual_id: data.individual_id,
        received: newReceived,
        distribution_date: date,
        distributed_at: newReceived ? new Date().toISOString() : null,
        created_by: context.userId,
      },
      { onConflict: "saint_family,individual_id,distribution_date", ignoreDuplicates: false },
    );
    if (upsertError) throw new Error(upsertError.message);

    // Persist inventory delta
    const { data: updatedInventory, error: updateInvError } = await context.supabase
      .from("inventory")
      .update({ weekly_total: newTotal, updated_by: context.userId })
      .eq("id", inventory.id)
      .select("id")
      .maybeSingle();
    if (updateInvError) throw new Error(updateInvError.message);
    if (!updatedInventory) {
      throw new Error("تعذر تحديث المخزون: لم يتم تحديث أي صف (تحقق من الصلاحيات)");
    }

    return {
      ok: true,
      individual_name: individual.full_name,
      received: newReceived,
      new_inventory_total: newTotal,
    };
  });

// ---- Saint Families (الأسرة) ----
export const getSaintFamilies = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
      const role = getServerRole(context);
      const visibleValues = getVisibleSaintFamilyValues(role);

      const { data, error } = await context.supabase
        .from("individuals")
        .select("saint_family")
        .not("saint_family", "is", null)
        .order("saint_family", { ascending: true });

      if (error) {
        console.error("[getSaintFamilies] Database error:", {
          code: error.code,
          message: error.message,
          details: error.details,
        });
        throw new Error(error.message);
      }

      const standardFamilies = [
        { value: "مرقس", label: "أسرة القديس مرقس" },
        { value: "يوحنا", label: "أسرة القديس يوحنا" },
        { value: "لوقا", label: "أسرة القديس لوقا" },
        { value: "متى", label: "أسرة القديس متى" },
        { value: "أسر مستترة", label: "الأسر المستترة" },
      ].filter((f) => visibleValues.includes(f.value));

      const dbFamilies = Array.from(new Set(data?.map((d) => d.saint_family))).filter(
        (f): f is string => f !== null && f !== undefined && visibleValues.includes(f),
      );

      const allFamilies = [...standardFamilies];

      dbFamilies.forEach((family) => {
        if (!allFamilies.find((f) => f.value === family)) {
          allFamilies.push({ value: family, label: family });
        }
      });

      return allFamilies;
    } catch (err) {
      console.error("[getSaintFamilies] Unexpected error:", err);
      throw err;
    }
  });

// ---- Assistance Module (مساعدات) ----
export const getAssistanceLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ individual_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    requirePermission(context, "view:sensitive");
    const { data: logs, error } = await context.supabase
      .from("assistance_logs")
      .select(
        `
        *,
        bridal_prep_details(*),
        medical_aid_details(*),
        family_members(full_name)
      `,
      )
      .eq("individual_id", data.individual_id)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return logs ?? [];
  });

export const getFamilyMemberAssistanceStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ individual_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    requirePermission(context, "view:sensitive");
    // Get assistance logs for the main individual
    const { data: mainLogs, error: mainError } = await context.supabase
      .from("assistance_logs")
      .select("assistance_type, family_member_id")
      .eq("individual_id", data.individual_id);

    if (mainError) throw new Error(mainError.message);

    // Get family members
    const { data: family, error: familyError } = await context.supabase
      .from("family_members")
      .select("id, full_name")
      .eq("individual_id", data.individual_id);

    if (familyError) throw new Error(familyError.message);

    // Build status map
    const statusMap: Record<string, { hasBridal: boolean; hasMedical: boolean }> = {};

    // Main individual status
    statusMap[data.individual_id] = {
      hasBridal:
        mainLogs?.some(
          (log: any) => log.assistance_type === "bridal_prep" && !log.family_member_id,
        ) ?? false,
      hasMedical:
        mainLogs?.some(
          (log: any) => log.assistance_type === "medical_aid" && !log.family_member_id,
        ) ?? false,
    };

    // Family members status
    family?.forEach((member: any) => {
      statusMap[member.id] = {
        hasBridal:
          mainLogs?.some(
            (log: any) =>
              log.assistance_type === "bridal_prep" && log.family_member_id === member.id,
          ) ?? false,
        hasMedical:
          mainLogs?.some(
            (log: any) =>
              log.assistance_type === "medical_aid" && log.family_member_id === member.id,
          ) ?? false,
      };
    });

    return statusMap;
  });

const assistanceLogSchema = z.object({
  individual_id: z.string().uuid(),
  family_member_id: z.string().uuid().nullable(),
  assistance_type: z.enum(["bridal_prep", "medical_aid"]),
  notes: z.string().optional().nullable(),
  bridal_details: z
    .object({
      appliances: z
        .array(
          z.object({
            category: z.literal("appliances"),
            item_type: z.string(),
            quantity: z.number(),
            unit_price: z.number(),
            total_price: z.number(),
          }),
        )
        .optional(),
      furniture: z
        .array(
          z.object({
            category: z.literal("furniture"),
            item_type: z.string(),
            quantity: z.number(),
            unit_price: z.number(),
            total_price: z.number(),
          }),
        )
        .optional(),
      clothing: z
        .array(
          z.object({
            category: z.literal("clothing"),
            item_type: z.string(),
            quantity: z.number(),
            unit_price: z.number(),
            total_price: z.number(),
          }),
        )
        .optional(),
      kitchenware: z
        .array(
          z.object({
            category: z.literal("kitchenware"),
            item_type: z.string(),
            quantity: z.number(),
            unit_price: z.number(),
            total_price: z.number(),
          }),
        )
        .optional(),
      bedding: z
        .array(
          z.object({
            category: z.literal("bedding"),
            item_type: z.string(),
            quantity: z.number(),
            unit_price: z.number(),
            total_price: z.number(),
          }),
        )
        .optional(),
    })
    .optional(),
  medical_details: z
    .array(
      z.object({
        category: z.enum([
          "operation",
          "radiology",
          "lab_test",
          "medication",
          "checkup",
          "external_treatment",
        ]),
        service_name: z.string(),
        total_price: z.number(),
        church_percentage: z.number(),
      }),
    )
    .optional(),
});

export const createAssistanceLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => assistanceLogSchema.parse(d))
  .handler(async ({ data, context }) => {
    requirePermission(context, "view:sensitive");
    const { bridal_details, medical_details, ...logData } = data;

    // Calculate total amount
    let totalAmount = 0;
    if (bridal_details) {
      Object.values(bridal_details).forEach((items: any[]) => {
        items.forEach((item) => (totalAmount += item.total_price));
      });
    }
    if (medical_details) {
      medical_details.forEach((item) => (totalAmount += item.total_price));
    }

    // Create main assistance log
    const { data: log, error: logError } = await context.supabase
      .from("assistance_logs")
      .insert({
        ...logData,
        total_amount: totalAmount,
        created_by: context.userId,
      })
      .select("id")
      .single();

    if (logError || !log) throw new Error(logError?.message ?? "فشل إنشاء سجل المساعدة");

    // Insert bridal prep details if applicable
    if (bridal_details && data.assistance_type === "bridal_prep") {
      const allBridalDetails = Object.values(bridal_details).flat() as any[];
      const bridalRows = allBridalDetails.map((detail) => ({
        assistance_log_id: log.id,
        ...detail,
      }));
      const { error: bridalError } = await context.supabase
        .from("bridal_prep_details")
        .insert(bridalRows);
      if (bridalError) throw new Error(bridalError.message);
    }

    // Insert medical aid details if applicable
    if (medical_details && data.assistance_type === "medical_aid") {
      const medicalRows = medical_details.map((detail) => ({
        assistance_log_id: log.id,
        ...detail,
      }));
      const { error: medicalError } = await context.supabase
        .from("medical_aid_details")
        .insert(medicalRows);
      if (medicalError) throw new Error(medicalError.message);
    }

    return { id: log.id };
  });

export const deleteAssistanceLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    requirePermission(context, "view:sensitive");
    const { error } = await context.supabase.from("assistance_logs").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---- Clothes Requests (ملابس الأعياد والمدارس) ----
const clothesRequestSchema = z.object({
  individual_id: z.string().uuid(),
  family_member_id: z.string().uuid().nullable().optional(),
  saint_family: z.string().min(1),
  request_category: z.enum(["holiday", "school"]),
  school_name: z.string().optional().nullable(),
  t_shirt_size: z.string().optional().nullable(),
  pants_size: z.string().optional().nullable(),
  shoe_size: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const getClothesRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const assignedFamily = getServerAssignedFamily(context);
    let query = context.supabase
      .from("clothes_requests")
      .select(
        `
        *,
        individuals(id, full_name, saint_family),
        family_members(id, full_name, relation)
      `,
      )
      .order("created_at", { ascending: false })
      .limit(500);
    if (assignedFamily) {
      query = query.eq("saint_family", assignedFamily);
    }
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getClothesRequestsByFamily = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ saint_family: z.string().min(1) }).parse(d))
  .handler(async ({ data, context }) => {
    requireVisibleFamily(context, data.saint_family);
    const { data: rows, error } = await context.supabase
      .from("clothes_requests")
      .select(
        `
        *,
        individuals(id, full_name, saint_family),
        family_members(id, full_name, relation)
      `,
      )
      .eq("saint_family", data.saint_family)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const createClothesRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => clothesRequestSchema.parse(d))
  .handler(async ({ data, context }) => {
    requireVisibleFamily(context, data.saint_family);
    const { data: created, error } = await context.supabase
      .from("clothes_requests")
      .insert({ ...data, created_by: context.userId })
      .select("id")
      .single();
    if (error || !created) throw new Error(error?.message ?? "فشل حفظ طلب الملابس");
    return { id: created.id };
  });

export const updateClothesRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => clothesRequestSchema.extend({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    requireVisibleFamily(context, data.saint_family);
    const { id, ...rest } = data;
    const { error } = await context.supabase.from("clothes_requests").update(rest).eq("id", id);
    if (error) throw new Error(error.message);
    return { id };
  });

export const deleteClothesRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("clothes_requests").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Get children (ابن/ابنة) under a specific individual, optionally filtered by saint_family */
export const getChildrenByFamily = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ saint_family: z.string().min(1) }).parse(d))
  .handler(async ({ data, context }) => {
    requireVisibleFamily(context, data.saint_family);
    const { data: individuals, error: indErr } = await context.supabase
      .from("individuals")
      .select("id, full_name, saint_family")
      .eq("saint_family", data.saint_family)
      .order("full_name", { ascending: true });
    if (indErr) throw new Error(indErr.message);

    const individualIds = (individuals ?? []).map((i) => i.id);
    if (individualIds.length === 0) return [];

    const { data: familyMembers, error: famErr } = await context.supabase
      .from("family_members")
      .select("id, full_name, relation, individual_id")
      .in("individual_id", individualIds)
      .in("relation", ["ابن", "ابنة"]);
    if (famErr) throw new Error(famErr.message);

    const individualMap = new Map((individuals ?? []).map((i) => [i.id, i.full_name]));

    return (familyMembers ?? []).map((fm) => ({
      id: fm.id,
      full_name: fm.full_name,
      relation: fm.relation,
      parent_name: individualMap.get(fm.individual_id) ?? "",
      individual_id: fm.individual_id,
    }));
  });

// ---- Furniture & Home Appliances (الأجهزة والأثاث) ----

const FURNITURE_CATEGORIES = ["أجهزة منزلية", "أثاث", "مفروشات"] as const;
const furnitureCategorySchema = z.enum(FURNITURE_CATEGORIES);
const FURNITURE_REQUEST_STATUSES = ["تحت المراجعة", "مقبول", "مرفوض"] as const;

/** Get beneficiaries (individuals) by saint_family for the request form */
export const getFurnitureBeneficiaries = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ family_name: z.string().min(1) }).parse(d))
  .handler(async ({ data, context }) => {
    requireVisibleFamily(context, data.family_name);
    const { data: rows, error } = await context.supabase
      .from("individuals")
      .select("id, full_name, nickname")
      .eq("saint_family", data.family_name)
      .order("full_name", { ascending: true });
    if (error) throw new Error(error.message);
    return (rows ?? []).map((r) => ({
      id: r.id,
      full_name: r.full_name,
      display_name: r.nickname ? `${r.full_name} (${r.nickname})` : r.full_name,
    }));
  });

/** Get all furniture inventory items */
export const getFurnitureInventory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("furniture_inventory")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

/** Add furniture inventory item */
export const addFurnitureInventoryItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        category: furnitureCategorySchema,
        item_name: z.string().min(1),
        quantity: z.number().int().positive(),
        details: z.string().optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    requirePermission(context, "manage:furniture");
    const { data: created, error } = await context.supabase
      .from("furniture_inventory")
      .insert({ ...data, created_by: context.userId })
      .select("id")
      .single();
    if (error || !created) throw new Error(error?.message ?? "فشل إضافة العنصر");
    return { id: created.id };
  });

/** Update furniture inventory item */
export const updateFurnitureInventoryItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().uuid(),
        category: furnitureCategorySchema,
        item_name: z.string().min(1),
        quantity: z.number().int().nonnegative(),
        details: z.string().optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    requirePermission(context, "manage:furniture");
    const { id, ...rest } = data;
    const { error } = await context.supabase.from("furniture_inventory").update(rest).eq("id", id);
    if (error) throw new Error(error.message);
    return { id };
  });

/** Delete furniture inventory item */
export const deleteFurnitureInventoryItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    requirePermission(context, "manage:furniture");
    const { error } = await context.supabase.from("furniture_inventory").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Get all furniture requests (for admin approval) */
export const getFurnitureRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("furniture_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

/** Get furniture requests for the current user (viewer tracking) */
export const getMyFurnitureRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("furniture_requests")
      .select("*")
      .eq("requested_by", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

/** Create a furniture request (quantity always 1) */
export const createFurnitureRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        family_name: z.string().min(1),
        beneficiary_id: z.string().uuid(),
        beneficiary_name: z.string().min(1),
        category: furnitureCategorySchema,
        item_name: z.string().min(1),
        details: z.string().optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    requireVisibleFamily(context, data.family_name);
    const { data: created, error } = await context.supabase
      .from("furniture_requests")
      .insert({
        ...data,
        quantity: 1,
        requested_by: context.userId,
      })
      .select("id")
      .single();
    if (error || !created) throw new Error(error?.message ?? "فشل حفظ الطلب");
    return { id: created.id };
  });

/** Update furniture request status (admin approve/reject) */
export const updateFurnitureRequestStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(FURNITURE_REQUEST_STATUSES),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    requirePermission(context, "manage:furniture");
    const { error } = await context.supabase
      .from("furniture_requests")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { id: data.id };
  });

/** Delete furniture request */
export const deleteFurnitureRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("furniture_requests").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---- Food Supplies Inventory (مخزن التموين / العُقدة) ----

const SUPPLIES_CATEGORIES = ["بروتين", "نشويات", "دهون", "أخرى"] as const;
const suppliesCategorySchema = z.enum(SUPPLIES_CATEGORIES);

/** Get all supplies inventory items */
export const getSuppliesInventory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("supplies_inventory")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

/** Add supplies inventory item */
export const addSupplyItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        category: suppliesCategorySchema,
        item_name: z.string().min(1),
        quantity: z.number().int().nonnegative(),
        weight: z.string().optional().nullable(),
        details: z.string().optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    requirePermission(context, "manage:supplies");
    const { data: created, error } = await context.supabase
      .from("supplies_inventory")
      .insert({ ...data, created_by: context.userId })
      .select("id")
      .single();
    if (error || !created) throw new Error(error?.message ?? "فشل إضافة الصنف");
    return { id: created.id };
  });

/** Update supplies inventory item */
export const updateSupplyItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().uuid(),
        category: suppliesCategorySchema,
        item_name: z.string().min(1),
        quantity: z.number().int().nonnegative(),
        weight: z.string().optional().nullable(),
        details: z.string().optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    requirePermission(context, "manage:supplies");
    const { id, ...rest } = data;
    const { error } = await context.supabase.from("supplies_inventory").update(rest).eq("id", id);
    if (error) throw new Error(error.message);
    return { id };
  });

/** Delete supplies inventory item */
export const deleteSupplyItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    requirePermission(context, "manage:supplies");
    const { error } = await context.supabase.from("supplies_inventory").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---- Pharmacy & Medication System (الصيدلية) ----

const PHARMACY_UNIT_TYPES = ["علبة", "شريط", "حقنة/أمبول", "أخرى"] as const;
const PHARMACY_REQUEST_STATUSES = ["تحت المراجعة", "مقبول", "مرفوض"] as const;

/** Get all pharmacy inventory items (admin) */
export const getPharmacyInventory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("pharmacy_inventory")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

/** Add pharmacy inventory item */
export const addPharmacyInventoryItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        disease_category: z.string().min(1),
        custom_disease_name: z.string().optional().nullable(),
        medicine_name: z.string().min(1),
        quantity: z.number().int().nonnegative(),
        unit_type: z.enum(PHARMACY_UNIT_TYPES),
        details: z.string().optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    requirePermission(context, "manage:pharmacy");
    const { data: created, error } = await context.supabase
      .from("pharmacy_inventory")
      .insert({ ...data, created_by: context.userId })
      .select("id")
      .single();
    if (error || !created) throw new Error(error?.message ?? "فشل إضافة الصنف");
    return { id: created.id };
  });

/** Update pharmacy inventory item */
export const updatePharmacyInventoryItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().uuid(),
        disease_category: z.string().min(1),
        custom_disease_name: z.string().optional().nullable(),
        medicine_name: z.string().min(1),
        quantity: z.number().int().nonnegative(),
        unit_type: z.enum(PHARMACY_UNIT_TYPES),
        details: z.string().optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    requirePermission(context, "manage:pharmacy");
    const { id, ...rest } = data;
    const { error } = await context.supabase
      .from("pharmacy_inventory")
      .update(rest)
      .eq("id", id);
    if (error) throw new Error(error.message);
    return { id };
  });

/** Delete pharmacy inventory item */
export const deletePharmacyInventoryItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    requirePermission(context, "manage:pharmacy");
    const { error } = await context.supabase
      .from("pharmacy_inventory")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Get all pharmacy requests (admin approval) */
export const getPharmacyRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("pharmacy_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

/** Get current user's pharmacy requests (viewer tracking) */
export const getMyPharmacyRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("pharmacy_requests")
      .select("*")
      .eq("requested_by", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

/** Create a pharmacy request */
export const createPharmacyRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        family_name: z.string().min(1),
        beneficiary_id: z.string().uuid().optional().nullable(),
        beneficiary_name: z.string().min(1),
        disease_category: z.string().min(1),
        custom_disease_name: z.string().optional().nullable(),
        medicine_name: z.string().min(1),
        requested_quantity: z.number().int().positive(),
        details: z.string().optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    requireVisibleFamily(context, data.family_name);
    const { data: created, error } = await context.supabase
      .from("pharmacy_requests")
      .insert({ ...data, requested_by: context.userId })
      .select("id")
      .single();
    if (error || !created) throw new Error(error?.message ?? "فشل حفظ الطلب");
    return { id: created.id };
  });

/** Update pharmacy request status (admin approve/reject) */
export const updatePharmacyRequestStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(PHARMACY_REQUEST_STATUSES),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    requirePermission(context, "manage:pharmacy");
    const { error } = await context.supabase
      .from("pharmacy_requests")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { id: data.id };
  });

/** Delete pharmacy request */
export const deletePharmacyRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    requirePermission(context, "manage:pharmacy");
    const { error } = await context.supabase
      .from("pharmacy_requests")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Get beneficiaries by saint_family for pharmacy request form */
export const getPharmacyBeneficiaries = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ family_name: z.string().min(1) }).parse(d))
  .handler(async ({ data, context }) => {
    requireVisibleFamily(context, data.family_name);
    const { data: rows, error } = await context.supabase
      .from("individuals")
      .select("id, full_name, nickname")
      .eq("saint_family", data.family_name)
      .order("full_name", { ascending: true });
    if (error) throw new Error(error.message);
    return (rows ?? []).map((r) => ({
      id: r.id,
      full_name: r.full_name,
      display_name: r.nickname ? `${r.full_name} (${r.nickname})` : r.full_name,
    }));
  });
