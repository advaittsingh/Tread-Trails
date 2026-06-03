import Image from "next/image";

import { cn } from "@/lib/utils";

const LOGO_SRC = "/treadtrails-logo.png";
const LOGO_WIDTH = 885;
const LOGO_HEIGHT = 152;

type SiteLogoProps = {
  variant?: "header" | "footer";
  className?: string;
  priority?: boolean;
};

export function SiteLogo({
  variant = "header",
  className,
  priority,
}: SiteLogoProps) {
  return (
    <Image
      src={LOGO_SRC}
      alt="Tread Trails"
      width={LOGO_WIDTH}
      height={LOGO_HEIGHT}
      unoptimized
      priority={priority ?? variant === "header"}
      className={cn(
        "w-auto shrink-0 object-contain object-left",
        variant === "header" && "h-9 max-w-[min(11rem,46vw)] sm:h-10 sm:max-w-[13rem]",
        variant === "footer" && "h-10 max-w-[min(16rem,90vw)] sm:h-11 sm:max-w-[18rem]",
        className
      )}
    />
  );
}
