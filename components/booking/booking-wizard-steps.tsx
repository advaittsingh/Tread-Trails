"use client";

import { cn } from "@/lib/utils";

export type BookingWizardStepsProps = {
  titles: readonly string[];
  /** Zero-based index of the active step (`aria-current="step"`). */
  currentStep: number;
  ariaLabel?: string;
  className?: string;
};

/**
 * Linear wizard step indicator (numbered pills + labels). Used by booking;
 * pass any `titles` array for other flows later.
 */
export function BookingWizardSteps({
  titles,
  currentStep,
  ariaLabel = "Booking steps",
  className,
}: BookingWizardStepsProps) {
  return (
    <nav
      aria-label={ariaLabel}
      className={cn(
        "rounded-xl border border-border/60 bg-muted/25 px-3 py-3",
        className
      )}
    >
      <ol
        className="flex flex-wrap gap-2 sm:grid sm:gap-3"
        style={{
          gridTemplateColumns: `repeat(${Math.max(titles.length, 1)}, minmax(0, 1fr))`,
        }}
      >
        {titles.map((title, i) => {
          const active = currentStep === i;
          const done = currentStep > i;
          return (
            <li
              key={title}
              aria-current={active ? "step" : undefined}
              className="flex min-w-0 flex-1 items-start gap-2 sm:flex-col sm:items-center sm:text-center"
            >
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold tabular-nums",
                  active &&
                    "border-primary bg-primary text-primary-foreground shadow-card",
                  done &&
                    !active &&
                    "border-primary/40 bg-primary/10 text-primary",
                  !active && !done && "border-border/80 bg-background text-muted-foreground"
                )}
              >
                {i + 1}
              </span>
              <span
                className={cn(
                  "text-[11px] font-medium leading-snug tracking-wide uppercase sm:mt-1",
                  active ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {title}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
