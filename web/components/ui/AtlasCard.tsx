type AtlasCardProps = {
  children: React.ReactNode;
  className?: string;
};

export function AtlasCard({ children, className = "" }: AtlasCardProps) {
  return (
    <div className={`rounded-3xl border border-black/5 bg-white p-6 shadow-sm ${className}`}>
      {children}
    </div>
  );
}