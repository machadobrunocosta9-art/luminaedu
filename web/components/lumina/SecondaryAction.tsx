import Link from "next/link";
import type { LucideIcon } from "lucide-react";

type SecondaryActionProps = {
  label: string;
  href: string;
  icon?: LucideIcon;
  trailingIcon?: LucideIcon;
  className?: string;
};

export default function SecondaryAction({
  label,
  href,
  icon: Icon,
  trailingIcon: TrailingIcon,
  className = "",
}: SecondaryActionProps) {
  return (
    <Link
      href={href}
      className={`group inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:bg-muted hover:shadow-sm active:translate-y-0 active:scale-[0.98] ${className}`}
    >
      {Icon && <Icon size={16} className="shrink-0" />}

      <span>{label}</span>

      {TrailingIcon && (
        <TrailingIcon
          size={16}
          className="shrink-0 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-primary"
        />
      )}
    </Link>
  );
}