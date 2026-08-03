import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import {
  type Role,
  resolvePrimaryRole,
  hasPermission,
  getAssignedFamily,
  isFamilyServant,
  type Permission,
} from "@/lib/permissions";

export type { Role, Permission };

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, s) => {
      if (!mounted) return;
      setSession(s);
      if (s) {
        const { data } = await supabase.from("user_roles").select("role").eq("user_id", s.user.id);
        const roles = (data ?? []).map((r) => r.role as string);
        setRole(resolvePrimaryRole(roles));
      } else {
        setRole(null);
      }
      setLoading(false);
    });
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session) {
        const { data: r } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.session.user.id);
        const roles = (r ?? []).map((x) => x.role as string);
        setRole(resolvePrimaryRole(roles));
      }
      setLoading(false);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const can = (permission: Permission) => hasPermission(role, permission);

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
    signOut: () => supabase.auth.signOut(),
  };
}
