"use client";

import { usePathname } from "next/navigation";

import type { NavCatalogueData } from "@/lib/server/nav-catalogue-data";

import { Navbar } from "@/components/layout/navbar";
import { SiteShell } from "@/components/layout/site-shell";

export function SiteChrome({
  catalogue,
  children,
}: {
  catalogue: NavCatalogueData;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin") ?? false;

  if (isAdmin) {
    return children;
  }

  return (
    <>
      <Navbar catalogue={catalogue} />
      <SiteShell>{children}</SiteShell>
    </>
  );
}
