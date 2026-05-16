"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, ShoppingBag, User } from "lucide-react";

import { cn } from "@/lib/utils";
import { useCart } from "@/contexts/cart-context";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { CartSheet } from "@/components/cart/cart-sheet";
import { NavCatalogueMegaMenu } from "@/components/layout/nav-catalogue-mega-menu";
import { NavbarSearch } from "@/components/layout/navbar-search";
import type { NavCatalogueData } from "@/lib/server/nav-catalogue-data";

type NavEntry =
  | { kind: "link"; href: string; label: string }
  | { kind: "catalogue" };

function isCatalogueActive(pathname: string): boolean {
  return (
    pathname.startsWith("/brands") ||
    pathname.startsWith("/builds") ||
    pathname.startsWith("/build/") ||
    pathname.startsWith("/products") ||
    pathname.startsWith("/vehicles") ||
    pathname.startsWith("/vehicle/")
  );
}

/** Primary nav — alphabetical by label (Catalogue between Booking and Contact). */
const primaryNav: NavEntry[] = [
  { kind: "link", href: "/about", label: "About" },
  { kind: "link", href: "/booking", label: "Booking" },
  { kind: "catalogue" },
  { kind: "link", href: "/contact", label: "Contact" },
  { kind: "link", href: "/corporate-inquiry", label: "Corporate" },
  { kind: "link", href: "/youtube", label: "Youtube" },
];

const mobileUtilityLinks = [
  { href: "/", label: "Home" },
  { href: "/account", label: "Account" },
  { href: "/login", label: "Login" },
  { href: "/signup", label: "Sign up" },
].sort((a, b) => a.label.localeCompare(b.label));

function NavLink({
  href,
  label,
  pathname,
  onClick,
  stacked,
  indented,
}: {
  href: string;
  label: ReactNode;
  pathname: string;
  onClick?: () => void;
  stacked?: boolean;
  indented?: boolean;
}) {
  const active =
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "text-sm tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        !stacked && [
          // Full-height tap target; underline sits on inner label only (just below text).
          "group/navlink inline-flex h-16 items-center rounded-md text-black",
          "hover:text-black",
          active && "font-medium",
        ],
        stacked && [
          "inline-flex min-h-11 items-center rounded-lg px-3 py-3 font-medium text-black focus-visible:ring-offset-0",
          indented && "ms-3 border-s border-border/50 ps-5",
          "hover:bg-[#25D366]/10 hover:text-black",
          active && "bg-[#25D366]/10",
        ]
      )}
    >
      {!stacked ? (
        <span
          className={cn(
            "relative inline-block pb-0.5",
            "after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-[2px] after:origin-left after:scale-x-0 after:rounded-full after:bg-[#25D366] after:transition-transform after:duration-200 after:ease-out",
            "group-hover/navlink:after:scale-x-100",
            active && "after:scale-x-100"
          )}
        >
          {label}
        </span>
      ) : (
        label
      )}
    </Link>
  );
}

function NavCatalogueTrigger({
  pathname,
  catalogue,
  onNavigate,
}: {
  pathname: string;
  catalogue: NavCatalogueData;
  onNavigate?: () => void;
}) {
  const active = isCatalogueActive(pathname);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      className="relative h-16"
      onMouseEnter={() => setMenuOpen(true)}
      onFocus={() => setMenuOpen(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setMenuOpen(false);
        }
      }}
    >
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={menuOpen}
        className={cn(
          "inline-flex h-16 items-center rounded-md text-sm tracking-wide text-black transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "hover:text-black",
          active && "font-medium"
        )}
      >
        <span
          className={cn(
            "relative inline-flex items-center gap-1 pb-0.5",
            "after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-[2px] after:origin-left after:scale-x-0 after:rounded-full after:bg-[#25D366] after:transition-transform after:duration-200 after:ease-out",
            (menuOpen || active) && "after:scale-x-100"
          )}
        >
          Catalogue
          <ChevronDown
            className={cn(
              "size-3.5 opacity-70 transition-transform duration-200",
              menuOpen && "rotate-180"
            )}
            aria-hidden
          />
        </span>
      </button>

      <NavCatalogueMegaMenu
        data={catalogue}
        open={menuOpen}
        onOpenChange={setMenuOpen}
        onNavigate={() => {
          setMenuOpen(false);
          onNavigate?.();
        }}
      />
    </div>
  );
}

export function Navbar({ catalogue }: { catalogue: NavCatalogueData }) {
  const pathname = usePathname();
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const { totalQuantity } = useCart();

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,border-color] duration-300",
        solid
          ? "border-b border-border/80 bg-background/95 shadow-card backdrop-blur-md"
          : "border-b border-transparent bg-background/80 backdrop-blur-sm"
      )}
    >
      {/*
        Desktop (lg+): CSS grid — [logo | centered nav | search + actions]
        - Equal 1fr side columns keep the nav visually centered in the bar.
        - Nav uses a small negative inline margin (lg only) to tighten logo → first link
          without changing link-to-link gaps or the nav → utilities column gap.
        - flex-nowrap + whitespace-nowrap prevents wrapping.
        Mobile: flex justify-between — logo | cart + menu (nav in sheet).
      */}
      <div
        className={cn(
          "mx-auto h-16 max-w-7xl px-4 sm:px-6 lg:px-8",
          "flex flex-nowrap items-center justify-between gap-3",
          "lg:grid lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-center lg:gap-4"
        )}
      >
        <div className="flex min-w-0 shrink-0 items-center lg:justify-self-start">
          <Link
            href="/"
            className="flex h-16 items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Tread Trails home"
          >
            <span className="font-heading text-sm tracking-[0.28em] text-primary uppercase">
              Tread Trails
            </span>
          </Link>
        </div>

        <nav
          aria-label="Primary"
          className={cn(
            "hidden items-center lg:flex",
            "justify-self-center",
            // Pull primary links toward the logo; grid column gap unchanged before utilities.
            "lg:-ms-3 xl:-ms-4",
            "flex-nowrap gap-x-5 whitespace-nowrap xl:gap-x-6"
          )}
        >
          {primaryNav.map((entry) =>
            entry.kind === "catalogue" ? (
              <NavCatalogueTrigger
                key="catalogue"
                pathname={pathname}
                catalogue={catalogue}
              />
            ) : (
              <NavLink
                key={entry.href}
                href={entry.href}
                label={entry.label}
                pathname={pathname}
              />
            )
          )}
        </nav>

        <div
          className={cn(
            "flex min-w-0 shrink-0 flex-nowrap items-center justify-end gap-2 sm:gap-3",
            "lg:justify-self-end"
          )}
        >
          <NavbarSearch className="hidden min-w-0 max-w-[16rem] sm:max-w-[20rem] xl:max-w-[26rem] lg:block" />

          <Link
            href="/account"
            className={cn(
              buttonVariants({ variant: "outline", size: "icon-sm" }),
              "hidden shrink-0 border-border/80 sm:inline-flex"
            )}
            aria-label="Account"
          >
            <User className="size-[18px]" />
          </Link>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="relative shrink-0 border-border/80"
            aria-label={`Shopping cart${totalQuantity ? `, ${totalQuantity} items` : ", empty"}`}
            onClick={() => setCartOpen(true)}
          >
            <ShoppingBag className="size-[18px]" />
            {totalQuantity > 0 ? (
              <Badge className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full p-0 text-[10px]">
                {totalQuantity > 99 ? "99+" : totalQuantity}
              </Badge>
            ) : null}
          </Button>
          <CartSheet open={cartOpen} onOpenChange={setCartOpen} />

          <Button
            variant="outline"
            size="icon"
            className="shrink-0 lg:hidden"
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={open}
            aria-controls="mobile-navigation"
          >
            <Menu className="size-5" />
          </Button>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetContent
              side="right"
              id="mobile-navigation"
              className="w-[min(100%,320px)] border-border/60 bg-background"
            >
              <SheetHeader>
                <SheetTitle className="font-heading tracking-[0.2em] text-primary uppercase">
                  Menu
                </SheetTitle>
              </SheetHeader>
              <div className="px-2 pt-4">
                <NavbarSearch onNavigate={() => setOpen(false)} />
              </div>
              <nav aria-label="Mobile" className="mt-6 flex flex-col gap-1 px-2">
                {primaryNav.map((entry) =>
                  entry.kind === "catalogue" ? (
                    <NavCatalogueMegaMenu
                      key="catalogue"
                      data={catalogue}
                      open
                      variant="mobile"
                      onNavigate={() => setOpen(false)}
                    />
                  ) : (
                    <NavLink
                      key={entry.href}
                      href={entry.href}
                      label={entry.label}
                      pathname={pathname}
                      stacked
                      onClick={() => setOpen(false)}
                    />
                  )
                )}
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setCartOpen(true);
                  }}
                  className={cn(
                    "inline-flex min-h-11 w-full items-center rounded-lg px-3 py-3 text-left text-sm font-medium tracking-wide text-black transition-colors",
                    "hover:bg-[#25D366]/10 hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0"
                  )}
                >
                  Cart
                  {totalQuantity > 0 ? (
                    <Badge className="ms-auto">{totalQuantity > 99 ? "99+" : totalQuantity}</Badge>
                  ) : null}
                </button>
                {mobileUtilityLinks.map((item) => (
                  <NavLink
                    key={item.href}
                    href={item.href}
                    label={
                      item.href === "/account" ? (
                        <>
                          <User className="size-5 shrink-0" />
                          <span className="sr-only">Account</span>
                        </>
                      ) : (
                        item.label
                      )
                    }
                    pathname={pathname}
                    stacked
                    onClick={() => setOpen(false)}
                  />
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
