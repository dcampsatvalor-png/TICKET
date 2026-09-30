import Image from "next/image";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  variant?: "full" | "mark";
  className?: string;
  priority?: boolean;
};

/** Tasaciones Hipotecarias brand mark / full logo (transparent PNG). */
export function BrandLogo({
  variant = "full",
  className,
  priority = false,
}: BrandLogoProps) {
  if (variant === "mark") {
    return (
      <Image
        src="/logo-th-mark.png"
        alt="Tasaciones Hipotecarias"
        width={128}
        height={61}
        priority={priority}
        className={cn("h-8 w-auto object-contain", className)}
      />
    );
  }

  return (
    <Image
      src="/logo-th.png"
      alt="Tasaciones Hipotecarias S.A.U."
      width={720}
      height={357}
      priority={priority}
      className={cn("h-10 w-auto object-contain sm:h-11", className)}
    />
  );
}
