"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ShoppingBag, User } from "lucide-react";

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
import { NavbarSearch } from "@/components/layout/navbar-search";

const nav = [
  { href: "/vehicles", label: "Vehicles" },
  { href: "/brands", label: "Brands" },
  { href: "/products", label: "Products" },
  { href: "/builds", label: "Builds" },
  { href: "/booking", label: "Booking" },
  { href: "/about", label: "About" },
  { href: "/youtube", label: "Youtube" },
  { href: "/corporate-inquiry", label: "Corporate" },
  { href: "/contact", label: "Contact" },
];

function NavLink({
  href,
  label,
  pathname,
  onClick,
  stacked,
}: {
  href: string;
  label: ReactNode;
  pathname: string;
  onClick?: () => void;
  stacked?: boolean;
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
          "group/navlink inline-flex h-16 items-center rounded-md",
          "hover:text-[#128C7E]",
          active ? "font-medium text-[#128C7E]" : "text-muted-foreground",
        ],
        stacked && [
          "inline-flex min-h-11 items-center rounded-lg px-3 py-3 font-medium focus-visible:ring-offset-0",
          "hover:bg-[#25D366]/10 hover:text-[#128C7E]",
          active
            ? "bg-[#25D366]/10 text-[#128C7E]"
            : "text-muted-foreground",
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

export function Navbar() {
  const pathname = usePathname();
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
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
        "fixed inset-x-0 top-0 z-40 transition-[background-color,box-shadow,border-color] duration-300",
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
          {nav.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              pathname={pathname}
            />
          ))}
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
          <Link
            href="/cart"
            className={cn(
              buttonVariants({ variant: "outline", size: "icon-sm" }),
              "relative shrink-0 border-border/80"
            )}
            aria-label={`Shopping cart${totalQuantity ? `, ${totalQuantity} items` : ", empty"}`}
          >
            <ShoppingBag className="size-[18px]" />
            {totalQuantity > 0 ? (
              <Badge className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full p-0 text-[10px]">
                {totalQuantity > 99 ? "99+" : totalQuantity}
              </Badge>
            ) : null}
          </Link>

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
                <NavLink
                  href="/"
                  label="Home"
                  pathname={pathname}
                  stacked
                  onClick={() => setOpen(false)}
                />
                {nav.map((item) => (
                  <NavLink
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    pathname={pathname}
                    stacked
                    onClick={() => setOpen(false)}
                  />
                ))}
                <NavLink
                  href="/cart"
                  label="Cart"
                  pathname={pathname}
                  stacked
                  onClick={() => setOpen(false)}
                />
                <NavLink
                  href="/account"
                  label={
                    <>
                      <User className="size-5 shrink-0" />
                      <span className="sr-only">Account</span>
                    </>
                  }
                  pathname={pathname}
                  stacked
                  onClick={() => setOpen(false)}
                />
                <NavLink
                  href="/login"
                  label="Login"
                  pathname={pathname}
                  stacked
                  onClick={() => setOpen(false)}
                />
                <NavLink
                  href="/signup"
                  label="Sign up"
                  pathname={pathname}
                  stacked
                  onClick={() => setOpen(false)}
                />
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
