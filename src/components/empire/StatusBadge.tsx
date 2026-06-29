import { cn } from "@/lib/utils";

type Status = "belum" | "dikerjakan" | "selesai" | "lunas";

const labels: Record<Status, string> = {
  belum: "Belum",
  dikerjakan: "Dikerjakan",
  selesai: "Selesai",
  lunas: "Lunas",
};

const styles: Record<Status, string> = {
  belum: "bg-muted text-muted-foreground border-border",
  dikerjakan: "bg-[color:var(--zest-yellow)]/30 text-rind border-[color:var(--zest-yellow)]",
  selesai: "bg-[color:var(--peel-green)]/15 text-[color:var(--peel-green)] border-[color:var(--peel-green)]/40",
  lunas: "bg-[color:var(--peel-green)]/15 text-[color:var(--peel-green)] border-[color:var(--peel-green)]/40",
};

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        styles[status],
        className,
      )}
    >
      {status === "selesai" || status === "lunas" ? "✓ " : ""}
      {labels[status]}
    </span>
  );
}
