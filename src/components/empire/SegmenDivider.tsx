import { cn } from "@/lib/utils";

export function SegmenDivider({ className }: { className?: string }) {
  return (
    <div className={cn("relative flex items-center justify-center my-6", className)} aria-hidden>
      <svg viewBox="0 0 320 16" className="w-full max-w-md" preserveAspectRatio="none">
        <g stroke="var(--rind-ink)" strokeWidth="1" strokeLinecap="round" opacity="0.7">
          {/* fan dari titik tengah */}
          {Array.from({ length: 11 }).map((_, i) => {
            const angle = -60 + (i * 12);
            const rad = (angle * Math.PI) / 180;
            const len = 140;
            const x2 = 160 + Math.cos(rad) * len;
            const y2 = 8 + Math.sin(rad) * 6;
            return <line key={i} x1="160" y1="8" x2={x2} y2={y2} />;
          })}
        </g>
        <circle cx="160" cy="8" r="2" fill="var(--empire-orange)" />
      </svg>
    </div>
  );
}
