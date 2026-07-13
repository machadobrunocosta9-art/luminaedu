type ProgressBarTone =
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "neutral";

type ProgressBarProps = {
  value: number;
  tone?: ProgressBarTone;
  label?: string;
  showValue?: boolean;
  className?: string;
};

const toneStyles: Record<ProgressBarTone, string> = {
  primary: "bg-primary",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  neutral: "bg-muted-foreground",
};

export default function ProgressBar({
  value,
  tone = "primary",
  label,
  showValue = false,
  className = "",
}: ProgressBarProps) {
  const normalizedValue = Math.min(100, Math.max(0, value));

  return (
    <div className={className}>
      {(label || showValue) && (
        <div className="mb-2 flex items-center justify-between gap-4">
          {label ? (
            <p className="text-xs font-medium text-muted-foreground">
              {label}
            </p>
          ) : (
            <span />
          )}

          {showValue && (
            <p className="text-xs font-semibold text-foreground">
              {value}%
            </p>
          )}
        </div>
      )}

      <div
        className="h-2 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-label={label ?? "Progresso"}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={normalizedValue}
      >
        <div
          className={`h-full rounded-full transition-[width] duration-500 ease-out ${toneStyles[tone]}`}
          style={{
            width: `${normalizedValue}%`,
          }}
        />
      </div>
    </div>
  );
}