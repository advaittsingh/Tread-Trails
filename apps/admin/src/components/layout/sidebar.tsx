import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Calendar,
  Car,
  Layers,
  GitBranch,
  Link2,
  Building2,
  Users,
  BarChart3,
  Tag,
  Activity,
  UserPlus,
  Inbox,
  Image,
  Hammer,
  LogOut,
  X,
  Warehouse,
  FileText,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/api/client";
import { useNavigate } from "react-router-dom";

const navSections = [
  {
    label: "Commerce",
    items: [
      { title: "Dashboard", href: "/", icon: LayoutDashboard },
      { title: "Orders", href: "/orders", icon: ShoppingCart },
      { title: "Products", href: "/products", icon: Package },
      { title: "Inventory", href: "/inventory", icon: Warehouse },
      { title: "CMS", href: "/cms", icon: FileText },
      { title: "SEO", href: "/seo", icon: Search },
      { title: "Bookings", href: "/bookings", icon: Calendar },
      { title: "Vehicles", href: "/vehicles", icon: Car, matchPrefix: "/vehicle" },
      { title: "Vehicle makes", href: "/vehicle-makes", icon: Building2 },
      { title: "Vehicle models", href: "/vehicle-models", icon: Layers },
      { title: "Compatibility", href: "/vehicle-compatibility", icon: Link2 },
      { title: "Vehicle tree", href: "/vehicle-tree", icon: GitBranch },
      { title: "Brands", href: "/brands", icon: Tag },
      { title: "Users", href: "/users", icon: Users },
      { title: "Analytics", href: "/analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Operations",
    items: [
      { title: "System", href: "/system", icon: Activity, matchPrefix: "/system" },
      { title: "Leads", href: "/leads", icon: UserPlus },
      { title: "Inbox", href: "/inbox", icon: Inbox },
      { title: "Abandoned carts", href: "/carts", icon: ShoppingCart },
      { title: "Media", href: "/media", icon: Image },
      { title: "Portfolio builds", href: "/portfolio-builds", icon: Hammer },
    ],
  },
];

function isActive(pathname: string, href: string, matchPrefix?: string) {
  if (matchPrefix) return pathname === href || pathname.startsWith(`${matchPrefix}/`);
  return pathname === href;
}

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();

  const logout = async () => {
    await apiFetch("/api/auth/logout", { method: "POST" });
    navigate("/auth/sign-in");
  };

  return (
    <aside className="w-60 bg-white lg:bg-transparent flex flex-col relative z-10 h-full border-r border-stone-200 lg:border-0">
      <div className="p-6 pb-0 relative z-10 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-stone-900">Tread Trails Admin</h1>
        {onClose ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="lg:hidden p-1 text-stone-600 hover:text-stone-900 hover:bg-stone-100"
          >
            <X className="h-5 w-5" />
          </Button>
        ) : null}
      </div>

      <nav className="flex-1 p-4 space-y-4 relative z-10 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.label}>
            <p className="px-3 text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">
              {section.label}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(
                  location.pathname,
                  item.href,
                  "matchPrefix" in item ? item.matchPrefix : undefined
                );

                return (
                  <NavLink key={item.href} to={item.href}>
                    <div
                      className={cn(
                        "flex items-center text-sm font-normal rounded-lg cursor-pointer",
                        active
                          ? "px-3 py-2 shadow-sm hover:shadow-md bg-stone-800 hover:bg-stone-700 relative bg-gradient-to-b from-stone-700 to-stone-800 border border-stone-900 text-stone-50"
                          : "px-3 py-2 text-stone-700 hover:bg-stone-100 transition-colors duration-200 border border-transparent"
                      )}
                    >
                      <Icon className="mr-3 w-4 h-4 shrink-0" />
                      {item.title}
                    </div>
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}

        <div className="pt-4 border-t border-stone-200">
          <button
            type="button"
            onClick={() => void logout()}
            className="flex w-full items-center px-3 py-2 text-sm text-stone-700 hover:bg-stone-100 rounded-lg"
          >
            <LogOut className="mr-3 w-4 h-4" />
            Sign out
          </button>
        </div>
      </nav>
    </aside>
  );
}
