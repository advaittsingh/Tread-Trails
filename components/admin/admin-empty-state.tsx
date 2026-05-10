import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type AdminEmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  className?: string;
};

export function AdminEmptyState({
  icon: Icon,
  title,
  description,
  className,
}: AdminEmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-16 text-center",
        className
      )}
    >
      {Icon ? (
        <Icon
          className="size-11 text-zinc-600"
          strokeWidth={1.15}
          aria-hidden
        />
      ) : null}
      <p className="font-medium text-zinc-300">{title}</p>
      {description ? (
        <p className="max-w-md text-sm leading-relaxed text-zinc-500">
          {description}
        </p>
      ) : null}
    </div>
  );
}
