type AtlasInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export function AtlasInput({ label, className = "", ...props }: AtlasInputProps) {
  return (
    <label className="block">
      {label && <span className="mb-2 block text-sm font-semibold text-[#201A14]">{label}</span>}
      <input
        className={`w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-[#F4B400] ${className}`}
        {...props}
      />
    </label>
  );
}

