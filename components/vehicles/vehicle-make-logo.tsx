import Image from "next/image";

import { getVehicleMakeLogoSrc } from "@/lib/vehicle-make-logos";
import { cn } from "@/lib/utils";

type VehicleMakeLogoProps = {
  makeSlug: string;
  makeName: string;
  className?: string;
  logoClassName?: string;
};

export function VehicleMakeLogo({
  makeSlug,
  makeName,
  className,
  logoClassName,
}: VehicleMakeLogoProps) {
  const logoSrc = getVehicleMakeLogoSrc(makeSlug);
  const initial = makeName.trim().charAt(0).toUpperCase() || "?";

  if (logoSrc) {
    return (
      <div className={cn("relative flex items-center justify-center", className)}>
        <Image
          src={logoSrc}
          alt={`${makeName} logo`}
          width={160}
          height={64}
          className={cn(
            "h-auto max-h-12 w-full max-w-[160px] object-contain object-center sm:max-h-14",
            logoClassName
          )}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex size-16 items-center justify-center rounded-full border border-primary/20 bg-accent font-heading text-2xl font-semibold text-primary",
        className
      )}
      aria-hidden
    >
      {initial}
    </div>
  );
}
