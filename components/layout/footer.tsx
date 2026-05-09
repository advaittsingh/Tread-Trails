import Link from "next/link";

import { Separator } from "@/components/ui/separator";

const links = [
  { label: "Vehicles", href: "/vehicles" },
  { label: "Brands", href: "/brands" },
  { label: "Products", href: "/products" },
  { label: "Builds", href: "/builds" },
  { label: "Booking", href: "/booking" },
];

export function Footer() {
  return (
    <footer className="border-t border-border/80 bg-background/80">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-[1.3fr_1fr_1fr]">
          <div className="space-y-4">
            <p className="font-heading text-xl tracking-[0.2em] text-primary uppercase">
              Tread Trails
            </p>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              Precision-engineered off-road programs — expedition chassis tuning, armor,
              lighting, and curated accessories for vehicles that refuse to stay paved.
            </p>
          </div>
          <div>
            <p className="font-heading text-sm tracking-widest text-foreground uppercase">
              Explore
            </p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {links.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="transition hover:text-primary">
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/login" className="transition hover:text-primary">
                  Login
                </Link>
              </li>
              <li>
                <Link href="/signup" className="transition hover:text-primary">
                  Sign up
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-heading text-sm tracking-widest text-foreground uppercase">
              Visit
            </p>
            <address className="mt-4 space-y-2 text-sm not-italic text-muted-foreground">
              <p>Bengaluru · Mumbai · Dubai</p>
              <p>studio@treadtrails.example</p>
              <p className="text-xs tracking-wide uppercase">By appointment only</p>
            </address>
          </div>
        </div>
        <Separator className="my-10 bg-border/60" />
        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Tread Trails. Frontend demo — mock catalog data.
        </p>
      </div>
    </footer>
  );
}
