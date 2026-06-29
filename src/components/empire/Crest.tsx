import { cn } from "@/lib/utils";
import logoAsset from "@/assets/jeruks-empire-logo.png.asset.json";

interface CrestProps {
  size?: number;
  className?: string;
  animated?: boolean;
}

/**
 * Lambang JERUK'S EMPIRE — versi gambar resmi.
 */
export function Crest({ size = 56, className, animated = true }: CrestProps) {
  return (
    <img
      src={logoAsset.url}
      alt="Lambang Jeruk's Empire"
      width={size}
      height={size}
      className={cn("object-contain drop-shadow-sm", animated && "crest-bloom", className)}
      style={{ width: size, height: size }}
    />
  );
}
