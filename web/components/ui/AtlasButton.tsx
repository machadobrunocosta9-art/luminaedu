import { Button } from "@/components/ui/button";

type AtlasButtonProps = React.ComponentProps<typeof Button> & {
  variantAtlas?: "primary" | "secondary" | "ghost";
};

export function AtlasButton({
  children,
  variantAtlas = "primary",
  className = "",
  ...props
}: AtlasButtonProps) {
  const styles = {
    primary: "bg-[#F4B400] text-[#201A14] hover:bg-[#dca200] rounded-xl font-semibold",
    secondary: "bg-white border border-gray-300 text-[#201A14] rounded-xl",
    ghost: "bg-transparent hover:bg-gray-100 text-[#201A14]",
  };

  return (
    <Button className={`${styles[variantAtlas]} ${className}`} {...props}>
      {children}
    </Button>
  );
}