import type { Metadata } from "next";
import Link from "next/link";
import {
  Compass,
  Cpu,
  ShieldCheck,
  Sparkles,
  Truck,
  Users,
} from "lucide-react";

import { buildPageMetadata } from "@/lib/seo/page-metadata";

import { AboutHero } from "@/components/about/about-hero";
import { PrimaryCta, WhatsAppCta } from "@/components/marketing/cta-buttons";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const description =
  "Meet Tread Trails — expedition chassis tuning, curated accessories, portfolio installs, and boutique studio fitting across Bengaluru, Mumbai, and Dubai. Mission, process, and why drivers choose us.";

export const metadata: Metadata = buildPageMetadata({
  segmentTitle: "About",
  description,
  path: "/about",
});

const WHY_ITEMS = [
  {
    icon: Cpu,
    title: "Vehicle-native specs",
    body: "Programs respect factory hardpoints, ECU logic, and duty cycles — not generic bolt-on catalogs.",
  },
  {
    icon: ShieldCheck,
    title: "Safety-first installs",
    body: "Documentation, torque discipline, and validation steps mirror how we’d treat our own rigs.",
  },
  {
    icon: Sparkles,
    title: "Curated SKUs",
    body: "We carry brands and bundles we trust on builds we’ve shipped — fewer SKUs, higher signal.",
  },
  {
    icon: Truck,
    title: "End-to-end fulfilment",
    body: "From bay scheduling and fitting to dispatch windows — one desk owns your thread.",
  },
  {
    icon: Users,
    title: "Concierge access",
    body: "WhatsApp and email responses from people who speak chassis, not scripts.",
  },
  {
    icon: Compass,
    title: "Portfolio honesty",
    body: "Real installs on real platforms — browse builds before you commit metal.",
  },
] as const;

const PROCESS_STEPS = [
  {
    phase: "01",
    title: "Discover",
    detail:
      "Pick your platform, browse compatible catalog and portfolio builds, or drop us a line with goals and timeline.",
  },
  {
    phase: "02",
    title: "Specify",
    detail:
      "We narrow kits, geometry, and accessories to your use case — highway, trail, or full expedition duty.",
  },
  {
    phase: "03",
    title: "Schedule",
    detail:
      "Reserve bay time for measurements and installation. Deep links from vehicles or products pre-fill context.",
  },
  {
    phase: "04",
    title: "Install & verify",
    detail:
      "Studio fitting with checklist-driven QA — torque, alignment cues, and lighting aim where applicable.",
  },
  {
    phase: "05",
    title: "Support",
    detail:
      "Post-install guidance and reorder paths for wearables — same concierge thread you started with.",
  },
] as const;

export default function AboutPage() {
  return (
    <>
      <AboutHero />

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        {/* Company overview */}
        <section className="mx-auto max-w-3xl text-center lg:max-w-4xl">
          <SectionHeading
            align="center"
            eyebrow="Overview"
            title="Built for platforms that leave pavement"
            description="Tread Trails is an expedition-focused automotive lab: we marry disciplined engineering with a boutique studio experience. Each engagement starts from your chassis — Hilux, Thar, Fortuner, Wrangler-class rigs — and ends with hardware that earns highway miles and trail confidence alike."
            className="mx-auto mb-10 lg:mb-12"
          />
          <p className="text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
            From Bengaluru and Mumbai to Dubai, we work{" "}
            <strong className="font-medium text-foreground">by appointment</strong> so bays stay
            intentional — never rushed. Our storefront connects curated SKUs, portfolio builds, and
            scheduling so you always know what fits{" "}
            <em className="text-foreground/90 not-italic">your</em> vehicle before checkout.
          </p>
        </section>

        <Separator className="my-16 bg-border/60 lg:my-20" />

        {/* Mission & vision */}
        <section>
          <SectionHeading
            eyebrow="North star"
            title="Mission & vision"
            description="What we optimize for every week — and where we’re steering the studio."
            className="mb-10 lg:mb-14"
          />
          <div className="grid gap-6 md:grid-cols-2 md:gap-8">
            <Card className="border-border/70 shadow-card">
              <CardContent className="space-y-3 p-6 sm:p-8">
                <p className="font-heading text-xs tracking-[0.35em] text-primary uppercase">
                  Mission
                </p>
                <h3 className="font-heading text-2xl tracking-tight text-foreground sm:text-3xl">
                  Elevate every mile.
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                  Deliver expedition-grade upgrades with OEM-level rigor — suspension, armor,
                  lighting, recovery, and curated accessories — so drivers trust their rigs on tarmac
                  and terrain.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/70 shadow-card">
              <CardContent className="space-y-3 p-6 sm:p-8">
                <p className="font-heading text-xs tracking-[0.35em] text-primary uppercase">
                  Vision
                </p>
                <h3 className="font-heading text-2xl tracking-tight text-foreground sm:text-3xl">
                  The reference expedition studio.
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                  Become the studio teams and enthusiasts cite when they want credible installs,
                  honest portfolios, and programs that respect how modern platforms actually behave.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator className="my-16 bg-border/60 lg:my-20" />

        {/* Why choose us */}
        <section>
          <SectionHeading
            align="center"
            eyebrow="Differentiators"
            title="Why choose us"
            description="Six reasons drivers and fleets keep the thread with Tread Trails — beyond SKUs and price lists."
            className="mx-auto mb-10 max-w-2xl text-center lg:mb-14"
          />
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {WHY_ITEMS.map(({ icon: Icon, title, body }) => (
              <li key={title}>
                <Card className="h-full border-border/70 shadow-card transition hover:border-primary/25 hover:shadow-card-hover">
                  <CardContent className="flex flex-col gap-4 p-6">
                    <span className="flex size-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/8 text-primary">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <div className="space-y-2">
                      <h3 className="font-heading text-lg tracking-tight text-foreground">{title}</h3>
                      <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </section>

        <Separator className="my-16 bg-border/60 lg:my-20" />

        {/* Process / timeline */}
        <section>
          <SectionHeading
            eyebrow="How we work"
            title="Process"
            description="From first click to post-install support — a linear lane with clear milestones."
            className="mb-10 lg:mb-14"
          />
          <ol className="relative space-y-0 border-l border-border/80 pl-8 md:pl-10">
            {PROCESS_STEPS.map(({ phase, title, detail }, i) => (
              <li
                key={phase}
                className={cn(
                  "relative pb-12 md:pb-14",
                  i === PROCESS_STEPS.length - 1 && "pb-0"
                )}
              >
                <span
                  className="absolute top-0 -left-8 flex size-8 -translate-x-[calc(50%-1px)] items-center justify-center rounded-full border border-primary/35 bg-background font-heading text-[11px] tracking-widest text-primary md:-left-10 md:size-9 md:text-xs"
                  aria-hidden
                >
                  {phase}
                </span>
                <div className="space-y-2 pt-0.5 md:flex md:gap-10 md:pt-1">
                  <h3 className="font-heading shrink-0 text-xl tracking-tight text-foreground md:w-44 md:text-2xl">
                    {title}
                  </h3>
                  <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
                    {detail}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <Separator className="my-16 bg-border/60 lg:my-20" />

        {/* CTA */}
        <section aria-labelledby="about-cta-heading">
          <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background shadow-card">
            <CardContent className="flex flex-col gap-8 p-8 sm:flex-row sm:items-center sm:justify-between sm:p-10 lg:p-12">
              <div className="max-w-xl space-y-3">
                <p className="font-heading text-xs tracking-[0.35em] text-primary uppercase">
                  Next step
                </p>
                <h2
                  id="about-cta-heading"
                  className="font-heading text-balance text-3xl tracking-tight text-foreground sm:text-4xl"
                >
                  Ready when you are.
                </h2>
                <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                  Book a bay, browse builds on your chassis, or message us with photos — we&apos;ll
                  reply with an honest read on fitment and timeline.
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-3 sm:items-end">
                <PrimaryCta href="/booking" className="h-11 w-full px-8 sm:w-auto">
                  Book appointment
                </PrimaryCta>
                <WhatsAppCta
                  message="Hi — I'd like to plan a project with Tread Trails."
                  label="WhatsApp concierge"
                  variant="outline"
                  className="h-11 w-full px-8 sm:w-auto"
                />
                <Link
                  href="/vehicles"
                  className="text-center text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline sm:text-right"
                >
                  Explore vehicles →
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </>
  );
}
