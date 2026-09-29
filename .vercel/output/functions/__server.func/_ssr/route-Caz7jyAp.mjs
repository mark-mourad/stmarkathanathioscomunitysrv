import { i as __toESM } from "../_runtime.mjs";
import { _ as useRouter, d as Outlet, h as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { F as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as ROLE_LABEL } from "./permissions-BPF-3_4x.mjs";
import { t as supabase } from "./client-CvtLKJfQ.mjs";
import { t as useAuth } from "./use-auth-DmMFHth-.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { A as ChevronRight, M as Check, O as Circle, R as SquareCheckBig, S as History, a as UserPlus, b as LogOut, d as Search, g as Pill, j as ChevronDown, l as Sofa, t as X, u as Shirt, v as Package, x as LayoutDashboard, y as Menu } from "../_libs/lucide-react.mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
import { a as Label2, c as Root2, d as SubTrigger2, f as Trigger, i as ItemIndicator2, l as Separator2, n as Content2, o as Portal2, r as Item2, s as RadioItem2, t as CheckboxItem2, u as SubContent2 } from "../_libs/@radix-ui/react-dropdown-menu+[...].mjs";
import { t as ChurchLogo } from "./church-logo-IRnJ_q3u.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/route-Caz7jyAp.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var DropdownMenu = Root2;
var DropdownMenuTrigger = Trigger;
var DropdownMenuSubTrigger = import_react.forwardRef(({ className, inset, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SubTrigger2, {
	ref,
	className: cn("flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0", inset && "pl-8", className),
	...props,
	children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "ml-auto" })]
}));
DropdownMenuSubTrigger.displayName = SubTrigger2.displayName;
var DropdownMenuSubContent = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SubContent2, {
	ref,
	className: cn("z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-dropdown-menu-content-transform-origin)", className),
	...props
}));
DropdownMenuSubContent.displayName = SubContent2.displayName;
var DropdownMenuContent = import_react.forwardRef(({ className, sideOffset = 4, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Portal2, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Content2, {
	ref,
	sideOffset,
	className: cn("z-50 max-h-[var(--radix-dropdown-menu-content-available-height)] min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md", "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-dropdown-menu-content-transform-origin)", className),
	...props
}) }));
DropdownMenuContent.displayName = Content2.displayName;
var DropdownMenuItem = import_react.forwardRef(({ className, inset, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Item2, {
	ref,
	className: cn("relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0", inset && "pl-8", className),
	...props
}));
DropdownMenuItem.displayName = Item2.displayName;
var DropdownMenuCheckboxItem = import_react.forwardRef(({ className, children, checked, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CheckboxItem2, {
	ref,
	className: cn("relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className),
	checked,
	...props,
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ItemIndicator2, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-4 w-4" }) })
	}), children]
}));
DropdownMenuCheckboxItem.displayName = CheckboxItem2.displayName;
var DropdownMenuRadioItem = import_react.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(RadioItem2, {
	ref,
	className: cn("relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className),
	...props,
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ItemIndicator2, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Circle, { className: "h-2 w-2 fill-current" }) })
	}), children]
}));
DropdownMenuRadioItem.displayName = RadioItem2.displayName;
var DropdownMenuLabel = import_react.forwardRef(({ className, inset, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label2, {
	ref,
	className: cn("px-2 py-1.5 text-sm font-semibold", inset && "pl-8", className),
	...props
}));
DropdownMenuLabel.displayName = Label2.displayName;
var DropdownMenuSeparator = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Separator2, {
	ref,
	className: cn("-mx-1 my-1 h-px bg-muted", className),
	...props
}));
DropdownMenuSeparator.displayName = Separator2.displayName;
var DropdownMenuShortcut = ({ className, ...props }) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("ml-auto text-xs tracking-widest opacity-60", className),
		...props
	});
};
DropdownMenuShortcut.displayName = "DropdownMenuShortcut";
function AuthedLayout() {
	const { role, user, can } = useAuth();
	const router = useRouter();
	const [mobileOpen, setMobileOpen] = (0, import_react.useState)(false);
	async function signOut() {
		await supabase.auth.signOut();
		router.navigate({ to: "/auth" });
	}
	const roleLabel = role ? ROLE_LABEL[role]?.ar ?? role : "قراءة فقط";
	const handleForbiddenNav = (e, to) => {
		if (isRouteForbidden(role, to)) {
			e.preventDefault();
			toast.error("غير مصرح لك بهذا الحقل");
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "border-b border-border/60 bg-paper/80 backdrop-blur sticky top-0 z-30",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto max-w-7xl px-4 md:px-6 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/",
						className: "flex items-center gap-2 sm:gap-3 min-w-0 flex-1 lg:flex-none",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChurchLogo, {
								size: 40,
								className: "sm:hidden"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChurchLogo, {
								size: 48,
								className: "hidden sm:block"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
									className: "display text-sm sm:text-base md:text-lg leading-tight text-ink truncate lg:overflow-visible lg:whitespace-normal",
									children: "كنيسة القديس مارمرقس والبابا أثناسيوس"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[11px] text-muted-foreground hidden sm:block truncate",
									children: "نظام إدارة الخدمة والمخدومين"
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
						className: "hidden lg:flex items-center gap-1 text-sm me-auto",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavLink, {
								to: "/",
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LayoutDashboard, { size: 16 }),
								label: "الرئيسية"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavLink, {
								to: "/search",
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { size: 16 }),
								label: "البحث"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavLink, {
								to: "/add",
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserPlus, { size: 16 }),
								label: "إضافة مخدوم"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenu, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuTrigger, {
								className: "flex items-center gap-2 px-4 py-2 rounded-full text-foreground/80 hover:bg-primary/10 hover:text-primary transition font-semibold text-sm cursor-pointer outline-none",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { size: 16 }),
									"الخدمات والأنشطة",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { size: 14 })
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuContent, {
								align: "start",
								className: "min-w-[220px]",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuLabel, {
										className: "text-muted-foreground text-xs",
										children: "الخدمات والأنشطة"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuSeparator, {}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuItem, {
										asChild: true,
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
											to: "/blessing-distribution",
											onClick: (e) => handleForbiddenNav(e, "/blessing-distribution"),
											className: "flex items-center gap-2 cursor-pointer",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SquareCheckBig, { size: 16 }), " توزيع البركة"]
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuItem, {
										asChild: true,
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
											to: "/clothes",
											onClick: (e) => handleForbiddenNav(e, "/clothes"),
											className: "flex items-center gap-2 cursor-pointer",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shirt, { size: 16 }), " ملابس الأعياد والمدارس"]
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuItem, {
										asChild: true,
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
											to: "/furniture",
											onClick: (e) => handleForbiddenNav(e, "/furniture"),
											className: "flex items-center gap-2 cursor-pointer",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sofa, { size: 16 }), " الأجهزة والأثاث"]
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuItem, {
										asChild: true,
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
											to: "/pharmacy",
											onClick: (e) => handleForbiddenNav(e, "/pharmacy"),
											className: "flex items-center gap-2 cursor-pointer",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, { size: 16 }), " الصيدلية"]
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuItem, {
										asChild: true,
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
											to: "/inventory",
											onClick: (e) => handleForbiddenNav(e, "/inventory"),
											className: "flex items-center gap-2 cursor-pointer",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { size: 16 }), " المخزن"]
										})
									})
								]
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenu, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuTrigger, {
								className: "flex items-center gap-2 px-4 py-2 rounded-full text-foreground/80 hover:bg-primary/10 hover:text-primary transition font-semibold text-sm cursor-pointer outline-none",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(History, { size: 16 }),
									"الإدارة والمالية",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { size: 14 })
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuContent, {
								align: "start",
								className: "min-w-[200px]",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuLabel, {
										className: "text-muted-foreground text-xs",
										children: "الإدارة والمالية"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuSeparator, {}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuItem, {
										asChild: true,
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
											to: "/audit",
											onClick: (e) => handleForbiddenNav(e, "/audit"),
											className: "flex items-center gap-2 cursor-pointer",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(History, { size: 16 }), " السجل"]
										})
									})
								]
							})] })
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => setMobileOpen(!mobileOpen),
						className: "lg:hidden shrink-0 flex items-center justify-center min-h-11 min-w-11 rounded-full bg-primary/10 hover:bg-primary/20 text-primary transition",
						"aria-label": "القائمة",
						"aria-expanded": mobileOpen,
						children: mobileOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 20 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, { size: 20 })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3 flex-shrink-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-start leading-tight hidden sm:block",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-xs text-muted-foreground truncate max-w-[10rem]",
								children: user?.email
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-[11px] font-semibold text-primary",
								children: roleLabel
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: signOut,
							className: "shrink-0 flex items-center justify-center min-h-11 min-w-11 rounded-full bg-primary/10 hover:bg-primary/20 text-primary transition",
							"aria-label": "تسجيل الخروج",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, { size: 18 })
						})]
					})
				]
			}), mobileOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
				className: "lg:hidden border-t border-border/40 bg-paper/95 backdrop-blur px-4 py-4 space-y-1 max-h-[80dvh] overflow-y-auto overscroll-contain",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MobileNavLink, {
						to: "/",
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LayoutDashboard, { size: 18 }),
						label: "الرئيسية",
						onClick: () => setMobileOpen(false)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MobileNavLink, {
						to: "/search",
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { size: 18 }),
						label: "البحث",
						onClick: () => setMobileOpen(false)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MobileNavLink, {
						to: "/add",
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserPlus, { size: 18 }),
						label: "إضافة مخدوم",
						onClick: () => setMobileOpen(false)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "border-t border-border/40 my-2" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted-foreground px-3 py-1",
							children: "الخدمات والأنشطة"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MobileNavLink, {
							to: "/blessing-distribution",
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SquareCheckBig, { size: 18 }),
							label: "توزيع البركة",
							onClick: () => setMobileOpen(false)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MobileNavLink, {
							to: "/clothes",
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shirt, { size: 18 }),
							label: "ملابس الأعياد والمدارس",
							onClick: () => setMobileOpen(false)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MobileNavLink, {
							to: "/furniture",
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sofa, { size: 18 }),
							label: "الأجهزة والأثاث",
							onClick: () => setMobileOpen(false)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MobileNavLink, {
							to: "/pharmacy",
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, { size: 18 }),
							label: "الصيدلية",
							onClick: () => setMobileOpen(false)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MobileNavLink, {
							to: "/inventory",
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { size: 18 }),
							label: "المخزن",
							onClick: () => setMobileOpen(false)
						})
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "border-t border-border/40 my-2" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted-foreground px-3 py-1",
							children: "الإدارة والمالية"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MobileNavLink, {
							to: "/audit",
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(History, { size: 18 }),
							label: "السجل",
							onClick: () => setMobileOpen(false)
						})
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "border-t border-border/40 mt-3 pt-3 flex items-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0 flex-1 px-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-xs text-muted-foreground break-all",
								children: user?.email
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-[11px] font-semibold text-primary",
								children: roleLabel
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: signOut,
							className: "shrink-0 flex items-center justify-center gap-2 min-h-11 px-4 rounded-full bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-sm transition",
							"aria-label": "تسجيل الخروج",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, { size: 18 }), " تسجيل الخروج"]
						})]
					})
				]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
			className: "mx-auto max-w-7xl px-4 md:px-6 py-6 md:py-8",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {})
		})]
	});
}
function isRouteForbidden(role, to) {
	if (!role || role === "SUPER_ADMIN" || role === "ADMIN") return false;
	if (to === "/") return false;
	if ([
		"ST_MATTHEW",
		"ST_MARK",
		"ST_JOHN",
		"ST_LUKE",
		"ST_HIDDEN_FAMILIES"
	].includes(role)) return ["/inventory", "/audit"].includes(to);
	if (role === "BRIDE_AND_MEDICAL_AIDS_MANAGER") return to !== "/search";
	if (role === "BLESSING_DISTRIBUTOR") return to !== "/blessing-distribution";
	if (role === "SUPPLY_WAREHOUSE_MANAGER") return to !== "/inventory";
	if (role === "FURNITURE_WAREHOUSE_MANAGER") return to !== "/furniture";
	if (role === "PHARMACY_WAREHOUSE_MANAGER") return to !== "/pharmacy";
	return true;
}
function NavLink({ to, icon, label }) {
	const { role } = useAuth();
	const handleClick = (e) => {
		if (isRouteForbidden(role, to)) {
			e.preventDefault();
			toast.error("غير مصرح لك بهذا الحقل");
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
		to,
		onClick: handleClick,
		className: "flex items-center gap-2 px-4 py-2 rounded-full text-foreground/80 hover:bg-primary/10 hover:text-primary transition font-semibold whitespace-nowrap",
		activeProps: { className: "!bg-primary !text-primary-foreground" },
		activeOptions: { exact: to === "/" },
		children: [icon, label]
	});
}
function MobileNavLink({ to, icon, label, onClick }) {
	const { role } = useAuth();
	const handleClick = (e) => {
		if (isRouteForbidden(role, to)) {
			e.preventDefault();
			toast.error("غير مصرح لك بهذا الحقل");
			return;
		}
		onClick();
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
		to,
		onClick: handleClick,
		className: "flex items-center gap-3 min-h-11 px-3 py-3 rounded-xl text-foreground/80 hover:bg-primary/10 hover:text-primary transition font-semibold",
		activeProps: { className: "!bg-primary !text-primary-foreground" },
		activeOptions: { exact: to === "/" },
		children: [icon, label]
	});
}
//#endregion
export { AuthedLayout as component };
