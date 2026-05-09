"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ShoppingBag } from "lucide-react";

import { cn } from "@/lib/utils";
import { whatsappHref } from "@/lib/whatsapp";
import { useCart } from "@/contexts/cart-context";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";

const nav = [
  { href: "/vehicles", label: "Vehicles" },
  { href: "/brands", label: "Brands" },
  { href: "/products", label: "Products" },
  { href: "/builds", label: "Builds" },
  { href: "/booking", label: "Booking" },
];

function NavLink({
  href,
  label,
  pathname,
  onClick,
  stacked,
}: {
  href: string;
  label: string;
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
        "text-sm tracking-wide transition hover:text-foreground",
        stacked &&
          "rounded-lg px-3 py-3 font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active ? "font-medium text-foreground" : "text-muted-foreground",
        stacked && active && "bg-muted/80 text-foreground"
      )}
    >
      {label}
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
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Tread Trails home"
        >
          <span className="font-heading text-sm tracking-[0.28em] text-primary uppercase">
            Tread Trails
          </span>
        </Link>

        <nav
          aria-label="Primary"
          className="hidden items-center gap-8 lg:flex"
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

        <div className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/account"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "hidden sm:inline-flex"
            )}
          >
            Account
          </Link>
          <Link
            href="/cart"
            className={cn(
              buttonVariants({ variant: "outline", size: "icon-sm" }),
              "relative border-border/80"
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
          <a
            href={whatsappHref("Hi — I'm browsing Tread Trails online.")}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden rounded-full border border-[#25D366]/35 bg-[#25D366]/10 p-2 text-[#128C7E] transition hover:bg-[#25D366]/15 lg:inline-flex"
            aria-label="Chat on WhatsApp"
          >
            <WhatsAppIcon className="size-5" />
          </a>

          <Button
            variant="outline"
            size="icon"
            className="lg:hidden"
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
              <nav aria-label="Mobile" className="mt-8 flex flex-col gap-1 px-2">
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
                  label="Account"
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
