import Link from "next/link";
import type { LucideIcon } from "lucide-react";

type PrimaryActionProps = {
  label: string;
  href: string;
  icon?: LucideIcon;
  className?: string;
  iconAnimation?: "rotate" | "scale" | "slide" | "none";
};

const iconAnimationStyles = {
  rotate: "group-hover:rotate-90",
  scale: "group-hover:scale-110",
  slide: "group-hover:translate-x-1",
  none: "",
};

export default function PrimaryAction({
  label,
  href,
  icon: Icon,
  className = "",
  iconAnimation = "scale",
}: PrimaryActionProps) {
  return (
    <Link
      href={href}
      className={`group inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/25 active:translate-y-0 active:scale-[0.98] ${className}`}
    >
      {Icon && (
        <Icon
          size={17}
          className={`shrink-0 transition-transform duration-200 ${iconAnimationStyles[iconAnimation]}`}
        />
      )}

      <span>{label}</span>
    </Link>
  );
}