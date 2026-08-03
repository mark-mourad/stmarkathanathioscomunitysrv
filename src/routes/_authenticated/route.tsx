import { createFileRoute, Outlet, redirect, Link, useRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { ChurchLogo } from "@/components/church-logo";
import { useAuth } from "@/hooks/use-auth";
import { hasPermission, ROLE_LABEL, type Role } from "@/lib/permissions";
import {
  LogOut,
  LayoutDashboard,
  Search,
  UserPlus,
  History,
  Package,
  CheckSquare,
  Shirt,
  Sofa,
  Pill,
  ChevronDown,
  Menu,
  X,
  Warehouse,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthedLayout,
});

function AuthedLayout() {
  const { role, user, can } = useAuth();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function signOut() {
    await supabase.auth.signOut();
    router.navigate({ to: "/auth" });
  }

  const roleLabel = role ? (ROLE_LABEL[role]?.ar ?? role) : "قراءة فقط";

  const handleForbiddenNav = (e: React.MouseEvent, to: string) => {
    if (isRouteForbidden(role, to)) {
      e.preventDefault();
      toast.error("غير مصرح لك بهذا الحقل");
    }
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-border/60 bg-paper/80 backdrop-blur sticky top-0 z-30">
        <div className="mx-auto max-w-7xl px-4 md:px-6 py-3 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-3 flex-shrink-0">
            <ChurchLogo size={48} className="hidden sm:block" />
            <div className="whitespace-nowrap">
              <h1 className="display text-base md:text-lg leading-tight text-ink">
                كنيسة القديس مارمرقس والبابا أثناسيوس
              </h1>
              <p className="text-[11px] text-muted-foreground hidden sm:block">
                نظام إدارة الخدمة والمخدومين
              </p>
            </div>
          </Link>

          {/* Desktop nav — all items visible to all roles */}
          <nav className="hidden lg:flex items-center gap-1 text-sm me-auto">
            <NavLink to="/" icon={<LayoutDashboard size={16} />} label="الرئيسية" />
            <NavLink to="/search" icon={<Search size={16} />} label="البحث" />
            <NavLink to="/add" icon={<UserPlus size={16} />} label="إضافة مخدوم" />

            {/* Services dropdown — visible to all */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 px-4 py-2 rounded-full text-foreground/80 hover:bg-primary/10 hover:text-primary transition font-semibold text-sm cursor-pointer outline-none">
                <Package size={16} />
                الخدمات والأنشطة
                <ChevronDown size={14} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-[220px]">
                <DropdownMenuLabel className="text-muted-foreground text-xs">
                  الخدمات والأنشطة
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link
                    to="/blessing-distribution"
                    onClick={(e) => handleForbiddenNav(e, "/blessing-distribution")}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <CheckSquare size={16} /> توزيع البركة
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    to="/clothes"
                    onClick={(e) => handleForbiddenNav(e, "/clothes")}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Shirt size={16} /> ملابس الأعياد والمدارس
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    to="/furniture"
                    onClick={(e) => handleForbiddenNav(e, "/furniture")}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Sofa size={16} /> الأجهزة والأثاث
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    to="/pharmacy"
                    onClick={(e) => handleForbiddenNav(e, "/pharmacy")}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Pill size={16} /> الصيدلية
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    to="/inventory"
                    onClick={(e) => handleForbiddenNav(e, "/inventory")}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Package size={16} /> المخزن
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Admin dropdown — visible to all */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 px-4 py-2 rounded-full text-foreground/80 hover:bg-primary/10 hover:text-primary transition font-semibold text-sm cursor-pointer outline-none">
                <History size={16} />
                الإدارة والمالية
                <ChevronDown size={14} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-[200px]">
                <DropdownMenuLabel className="text-muted-foreground text-xs">
                  الإدارة والمالية
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link
                    to="/audit"
                    onClick={(e) => handleForbiddenNav(e, "/audit")}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <History size={16} /> السجل
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden rounded-full bg-primary/10 hover:bg-primary/20 text-primary p-2 transition"
            aria-label="القائمة"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* User profile + logout */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="text-start leading-tight hidden sm:block">
              <div className="text-xs text-muted-foreground">{user?.email}</div>
              <div className="text-[11px] font-semibold text-primary">{roleLabel}</div>
            </div>
            <button
              onClick={signOut}
              className="rounded-full bg-primary/10 hover:bg-primary/20 text-primary p-2 transition"
              aria-label="تسجيل الخروج"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* Mobile nav dropdown — all items visible to all roles */}
        {mobileOpen && (
          <nav className="lg:hidden border-t border-border/40 bg-paper/95 backdrop-blur px-4 py-4 space-y-1">
            <MobileNavLink
              to="/"
              icon={<LayoutDashboard size={18} />}
              label="الرئيسية"
              onClick={() => setMobileOpen(false)}
            />
            <MobileNavLink
              to="/search"
              icon={<Search size={18} />}
              label="البحث"
              onClick={() => setMobileOpen(false)}
            />
            <MobileNavLink
              to="/add"
              icon={<UserPlus size={18} />}
              label="إضافة مخدوم"
              onClick={() => setMobileOpen(false)}
            />
            <>
              <div className="border-t border-border/40 my-2" />
              <p className="text-xs text-muted-foreground px-3 py-1">الخدمات والأنشطة</p>
              <MobileNavLink
                to="/blessing-distribution"
                icon={<CheckSquare size={18} />}
                label="توزيع البركة"
                onClick={() => setMobileOpen(false)}
              />
              <MobileNavLink
                to="/clothes"
                icon={<Shirt size={18} />}
                label="ملابس الأعياد والمدارس"
                onClick={() => setMobileOpen(false)}
              />
              <MobileNavLink
                to="/furniture"
                icon={<Sofa size={18} />}
                label="الأجهزة والأثاث"
                onClick={() => setMobileOpen(false)}
              />
              <MobileNavLink
                to="/pharmacy"
                icon={<Pill size={18} />}
                label="الصيدلية"
                onClick={() => setMobileOpen(false)}
              />
              <MobileNavLink
                to="/inventory"
                icon={<Package size={18} />}
                label="المخزن"
                onClick={() => setMobileOpen(false)}
              />
            </>
            <>
              <div className="border-t border-border/40 my-2" />
              <p className="text-xs text-muted-foreground px-3 py-1">الإدارة والمالية</p>
              <MobileNavLink
                to="/audit"
                icon={<History size={18} />}
                label="السجل"
                onClick={() => setMobileOpen(false)}
              />
            </>
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-7xl px-4 md:px-6 py-6 md:py-8">
        <Outlet />
      </main>
    </div>
  );
}

function isRouteForbidden(role: string | null, to: string): boolean {
  if (!role || role === "SUPER_ADMIN" || role === "ADMIN") return false;
  if (to === "/") return false;
  const FS: string[] = ["ST_MATTHEW", "ST_MARK", "ST_JOHN", "ST_LUKE", "ST_HIDDEN_FAMILIES"];
  const WH: string[] = ["SUPPLY_WAREHOUSE_MANAGER", "FURNITURE_WAREHOUSE_MANAGER", "PHARMACY_WAREHOUSE_MANAGER"];
  if (FS.includes(role)) return ["/inventory", "/audit"].includes(to);
  if (role === "BRIDE_AND_MEDICAL_AIDS_MANAGER") return to !== "/search";
  if (role === "BLESSING_DISTRIBUTOR") return to !== "/blessing-distribution";
  if (role === "SUPPLY_WAREHOUSE_MANAGER") return to !== "/inventory";
  if (role === "FURNITURE_WAREHOUSE_MANAGER") return to !== "/furniture";
  if (role === "PHARMACY_WAREHOUSE_MANAGER") return to !== "/pharmacy";
  return true;
}

function NavLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  const { role } = useAuth();
  const handleClick = (e: React.MouseEvent) => {
    if (isRouteForbidden(role, to)) {
      e.preventDefault();
      toast.error("غير مصرح لك بهذا الحقل");
    }
  };
  return (
    <Link
      to={to}
      onClick={handleClick}
      className="flex items-center gap-2 px-4 py-2 rounded-full text-foreground/80 hover:bg-primary/10 hover:text-primary transition font-semibold whitespace-nowrap"
      activeProps={{ className: "!bg-primary !text-primary-foreground" }}
      activeOptions={{ exact: to === "/" }}
    >
      {icon}
      {label}
    </Link>
  );
}

function MobileNavLink({
  to,
  icon,
  label,
  onClick,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  const { role } = useAuth();
  const handleClick = (e: React.MouseEvent) => {
    if (isRouteForbidden(role, to)) {
      e.preventDefault();
      toast.error("غير مصرح لك بهذا الحقل");
      return;
    }
    onClick();
  };
  return (
    <Link
      to={to}
      onClick={handleClick}
      className="flex items-center gap-3 px-3 py-3 rounded-xl text-foreground/80 hover:bg-primary/10 hover:text-primary transition font-semibold"
      activeProps={{ className: "!bg-primary !text-primary-foreground" }}
      activeOptions={{ exact: to === "/" }}
    >
      {icon}
      {label}
    </Link>
  );
}
