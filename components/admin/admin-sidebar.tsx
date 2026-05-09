"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  LayoutDashboard,
  Mail,
  MapPin,
  Package,
  ShoppingCart,
  Users,
  Wrench,
  Shield,
} from "lucide-react";

import { cn } from "@/lib/utils";

const core = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: Package },
  { href: "/admin/bookings", label: "Bookings", icon: Wrench },
];

const advanced = [
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/live", label: "Live map", icon: MapPin },
  { href: "/admin/carts", label: "Abandoned carts", icon: ShoppingCart },
  { href: "/admin/crm", label: "CRM email", icon: Mail },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/system", label: "System", icon: Activity },
];

function NavBlock({
  title,
  items,
  pathname,
}: {
  title: string;
  items: typeof core;
  pathname: string | null;
}) {
  return (
    <div className="space-y-2">
      <p className="px-3 text-[10px] font-semibold tracking-[0.2em] text-zinc-500 uppercase">
        {title}
      </p>
      <nav className="flex flex-col gap-0.5">
        {items.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/admin"
              ? pathname === "/admin"
              : pathname?.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                active
                  ? "bg-emerald-500/15 text-emerald-100 ring-1 ring-emerald-500/25"
                  : "text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-100"
              )}
            >
              <Icon className="size-4 shrink-0 opacity-80" />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-zinc-800 bg-zinc-950 px-3 py-8 lg:w-64">
      <div className="mb-10 flex items-center gap-2 px-3">
        <Shield className="size-5 text-emerald-400" />
        <div>
          <p className="font-heading text-xs tracking-[0.35em] text-emerald-400 uppercase">
            Control
          </p>
          <p className="text-sm font-semibold tracking-tight text-zinc-100">
            Tread Trails Admin
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-10 overflow-y-auto no-scrollbar">
        <NavBlock title="Operations" items={core} pathname={pathname} />
        <NavBlock title="Intelligence" items={advanced} pathname={pathname} />
      </div>

      <div className="mt-8 border-t border-zinc-800/80 px-3 pt-6">
        <Link
          href="/"
          className="text-xs tracking-wide text-zinc-500 transition hover:text-zinc-300"
        >
          ← Exit to storefront
        </Link>
      </div>
    </aside>
  );
}
