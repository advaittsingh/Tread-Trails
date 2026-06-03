type Props = {
  engineSummary: string;
  modelYearsLabel: string;
  trimSummary: string;
};

export function VehiclePlatformSpecs({
  engineSummary,
  modelYearsLabel,
  trimSummary,
}: Props) {
  const rows = [
    { label: "Engine", value: engineSummary.trim() },
    { label: "Model years", value: modelYearsLabel.trim() },
    { label: "Typical trims", value: trimSummary.trim() },
  ].filter((r) => r.value.length > 0);

  if (rows.length === 0) return null;

  return (
    <section className="border-y border-border/60 bg-muted/15">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <p className="font-heading text-xs tracking-[0.35em] text-primary uppercase">
          Platform notes
        </p>
        <dl className="mt-6 grid gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-10">
          {rows.map((row) => (
            <div key={row.label}>
              <dt className="text-[11px] tracking-widest text-muted-foreground uppercase">
                {row.label}
              </dt>
              <dd className="mt-2 text-sm leading-relaxed text-foreground md:text-[15px]">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
