type AtlasBadgeProps = {
  children: React.ReactNode;
  tone?: "success" | "warning" | "danger" | "neutral";
};

export function AtlasBadge({ children, tone = "neutral" }: AtlasBadgeProps) {
  const styles = {
    success: "bg-green-100 text-green-700",
    warning: "bg-yellow-100 text-yellow-800",
    danger: "bg-red-100 text-red-700",
    neutral: "bg-gray-100 text-gray-700",
  };

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold ${styles[tone]}`}>
      {children}
    </span>
  );
}