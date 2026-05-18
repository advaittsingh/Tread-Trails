import type { ReactNode } from "react";

import { Breadcrumbs, type BreadcrumbItem } from "@/components/layout/breadcrumbs";
import { SectionHeading } from "@/components/marketing/section-heading";
import { cn } from "@/lib/utils";

type VehicleExplorerShellProps = {
  breadcrumbs: BreadcrumbItem[];
  eyebrow: string;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export function VehicleExplorerShell({
  breadcrumbs,
  eyebrow,
  title,
  description,
  children,
  className,
}: VehicleExplorerShellProps) {
  return (
    <div className={cn("mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8", className)}>
      <Breadcrumbs items={breadcrumbs} className="mb-8" />
      <SectionHeading
        titleAs="h1"
        eyebrow={eyebrow}
        title={title}
        description={description}
        className="mb-12"
      />
      {children}
    </div>
  );
}
