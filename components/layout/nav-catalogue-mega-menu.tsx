"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import type { NavCatalogueData } from "@/lib/server/nav-catalogue-data";
import { cn } from "@/lib/utils";

function subLinkActive(
  pathname: string,
  searchCategory: string | null,
  href: string
): boolean {
  if (href.startsWith("/products?")) {
    const cat = new URL(href, "http://local").searchParams.get("category");
    if (!cat) return pathname === "/products" && !searchCategory;
    return pathname === "/products" && searchCategory === cat;
  }
  const path = new URL(href, "http://local").pathname;
  if (path.startsWith("/build/") && pathname.startsWith("/build/")) {
    return pathname === path;
  }
  return pathname === path || pathname.startsWith(`${path}/`);
}

const MEGA_MENU_ROW_CLASS = "min-h-[2.375rem]";
const MEGA_MENU_PREVIEW_COUNT = 6;

function SubLink({
  href,
  label,
  pathname,
  searchCategory,
  onNavigate,
  alignedRows,
}: {
  href: string;
  label: string;
  pathname: string;
  searchCategory: string | null;
  onNavigate?: () => void;
  alignedRows?: boolean;
}) {
  const active = subLinkActive(pathname, searchCategory, href);
  return (
    <li className={alignedRows ? MEGA_MENU_ROW_CLASS : undefined}>
      <Link
        href={href}
        onClick={onNavigate}
        className={cn(
          "block rounded-md px-2 text-xs leading-snug text-black/80 transition-colors",
          alignedRows
            ? cn(
                "flex h-full min-h-[2.375rem] items-center py-1",
                MEGA_MENU_ROW_CLASS
              )
            : "py-1.5",
          "hover:bg-[#25D366]/10 hover:text-black",
          active && "bg-[#25D366]/10 font-medium text-black"
        )}
      >
        {label}
      </Link>
    </li>
  );
}

type NavCatalogueMegaMenuProps = {
  data: NavCatalogueData;
  open: boolean;
  onNavigate?: () => void;
  onOpenChange?: (open: boolean) => void;
  variant?: "desktop" | "mobile";
};

export function NavCatalogueMegaMenu({
  data,
  open,
  onNavigate,
  onOpenChange,
  variant = "desktop",
}: NavCatalogueMegaMenuProps) {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const searchCategory = searchParams.get("category");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  function sectionHeaderActive(
    hubHref: string,
    key: NavCatalogueData["sections"][number]["key"]
  ) {
    if (pathname === hubHref || pathname.startsWith(`${hubHref}/`)) return true;
    if (key === "builds" && pathname.startsWith("/build/")) return true;
    if (key === "products" && pathname === "/products" && searchCategory) {
      return true;
    }
    return false;
  }

  if (variant === "mobile") {
    return (
      <div className="space-y-5 px-1 pb-2">
        {data.sections.map((section) => (
          <div key={section.key}>
            <Link
              href={section.hubHref}
              onClick={onNavigate}
              className={cn(
                "px-2 text-xs font-semibold tracking-wider text-black uppercase hover:text-[#128C7E]",
                sectionHeaderActive(section.hubHref, section.key) &&
                  "text-[#128C7E]"
              )}
            >
              {section.label}
            </Link>
            <ul className="mt-2 grid grid-cols-2 gap-x-2 gap-y-0.5 sm:grid-cols-3">
              {section.items.slice(0, MEGA_MENU_PREVIEW_COUNT).map((item) => (
                <SubLink
                  key={`${section.key}-${item.href}`}
                  href={item.href}
                  label={item.label}
                  pathname={pathname}
                  searchCategory={searchCategory}
                  onNavigate={onNavigate}
                />
              ))}
            </ul>
            <Link
              href={section.hubHref}
              onClick={onNavigate}
              className="mt-2 inline-block px-2 text-[11px] font-medium text-[#128C7E] hover:underline"
            >
              View all {section.label.toLowerCase()}
            </Link>
          </div>
        ))}
      </div>
    );
  }

  const panel = (
    <div
      className={cn(
        "fixed inset-x-0 top-16 z-[100] border-b border-border/80 bg-background pt-1 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.18)] transition-[opacity,visibility,transform] duration-200 ease-out",
        open
          ? "pointer-events-auto visible translate-y-0 opacity-100"
          : "pointer-events-none invisible -translate-y-1 opacity-0"
      )}
      role="menu"
      aria-label="Catalogue"
      aria-hidden={!open}
      onMouseEnter={() => onOpenChange?.(true)}
      onMouseLeave={() => onOpenChange?.(false)}
    >
      <div className="mx-auto grid max-w-7xl grid-cols-2 items-stretch gap-x-8 gap-y-0 bg-background px-4 py-6 sm:px-6 lg:grid-cols-4 lg:px-8">
        {data.sections.map((section) => {
          const previewItems = section.items.slice(0, MEGA_MENU_PREVIEW_COUNT);
          const paddedItems = [
            ...previewItems,
            ...Array.from(
              { length: MEGA_MENU_PREVIEW_COUNT - previewItems.length },
              () => null
            ),
          ];

          return (
            <div key={section.key} className="flex min-w-0 flex-col">
              <Link
                href={section.hubHref}
                role="menuitem"
                onClick={onNavigate}
                className={cn(
                  "shrink-0 font-heading text-xs tracking-[0.2em] text-black uppercase transition-colors hover:text-[#128C7E]",
                  sectionHeaderActive(section.hubHref, section.key) &&
                    "text-[#128C7E]"
                )}
              >
                {section.label}
              </Link>
              <ul className="mt-3 flex flex-1 flex-col gap-0.5">
                {paddedItems.map((item, index) =>
                  item ? (
                    <SubLink
                      key={`${section.key}-${item.href}`}
                      href={item.href}
                      label={item.label}
                      pathname={pathname}
                      searchCategory={searchCategory}
                      onNavigate={onNavigate}
                      alignedRows
                    />
                  ) : (
                    <li
                      key={`${section.key}-pad-${index}`}
                      className={MEGA_MENU_ROW_CLASS}
                      aria-hidden
                    />
                  )
                )}
              </ul>
              <Link
                href={section.hubHref}
                onClick={onNavigate}
                className="mt-auto shrink-0 pt-4 text-[11px] font-medium text-[#128C7E] hover:underline"
              >
                View all {section.label.toLowerCase()}
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );

  if (!mounted) return null;
  return createPortal(panel, document.body);
}
