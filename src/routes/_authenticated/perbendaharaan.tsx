import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Plus, Receipt } from "lucide-react";
import {
  anggotaListQuery,
  kasPembayaranListQuery,
  kasPeriodeListQuery,
  pengeluaranListQuery,
} from "@/lib/queries";
import { recordPembayaran, recordPengeluaran } from "@/lib/empire.functions";
import { useActiveMember, canManageKas } from "@/lib/active-member";
import { StatusBadge } from "@/components/empire/StatusBadge";
import { EmptyState } from "@/components/empire/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { formatRupiah } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/perbendaharaan")({
  head: () => ({
    meta: [
      { title: "Perbendaharaan — JERUK'S EMPIRE" },
      { name: "description", content: "Saldo kas, status pembayaran, dan pengeluaran kelas." },
      { property: "og:title", content: "Perbendaharaan — JERUK'S EMPIRE" },
      { property: "og:description", content: "Kas kelas TI." },
    ],
  }),
  component: Perbendaharaan,
});

function Perbendaharaan() {
  const qc = useQueryClient();
  const { member } = useActiveMember();
  const canManage = canManageKas(member?.role);

  const { data: periodes } = useQuery(kasPeriodeListQuery);
  const { data: pembayaran } = useQuery(kasPembayaranListQuery);
  const { data: pengeluaran } = useQuery(pengeluaranListQuery);
  const { data: anggota } = useQuery(anggotaListQuery);

  const periode = periodes?.[0];

  const totals = useMemo(() => {
    const masuk = (pembayaran ?? []).reduce((s, p) => s + (p.status === "lunas" ? p.jumlah : 0), 0);
    const keluar = (pengeluaran ?? []).reduce((s, p) => s + p.jumlah, 0);
    return { masuk, keluar, saldo: masuk - keluar };
  }, [pembayaran, pengeluaran]);

  const bayarFn = useServerFn(recordPembayaran);
  const bayarMut = useMutation({
    mutationFn: (input: {
      periode_id: string;
      anggota_id: string;
      jumlah: number;
      status: "belum" | "lunas";
      actor_id: string;
    }) => bayarFn({ data: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["kas_pembayaran"] });
      toast.success("Status perbendaharaan telah diperbarui.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const pengFn = useServerFn(recordPengeluaran);
  const pengMut = useMutation({
    mutationFn: (input: { deskripsi: string; jumlah: number; actor_id: string }) =>
      pengFn({ data: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pengeluaran"] });
      toast.success("Pengeluaran tercatat.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl text-empire">Perbendaharaan</h1>
        <p className="text-sm text-muted-foreground">
          Hanya {member && canManage ? "Anda — " : ""}Bendahara & Yang Mulia yang dapat mengubah catatan.
        </p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Saldo Kas</p>
          <p className="font-mono text-3xl text-empire">{formatRupiah(totals.saldo)}</p>
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Masuk</p>
          <p className="font-mono text-2xl text-[color:var(--peel-green)]">
            {formatRupiah(totals.masuk)}
          </p>
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Keluar</p>
          <p className="font-mono text-2xl">{formatRupiah(totals.keluar)}</p>
        </div>
      </section>

      {/* Pembayaran per anggota */}
      <section className="rounded-2xl border bg-card overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-empire/10">
          <div>
            <h2 className="font-display text-xl text-empire">Setoran Bangsawan</h2>
            <p className="text-xs text-muted-foreground">
              Periode: {periode?.label ?? "—"} · Nominal {formatRupiah(periode?.nominal_per_orang ?? 0)}/orang
            </p>
          </div>
        </div>
        {pembayaran && pembayaran.length > 0 ? (
          <ul className="divide-y divide-border/60">
            {pembayaran.map((p) => {
              const a = (p as unknown as { anggota: { nama: string } }).anggota;
              return (
                <li key={p.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="flex-1 truncate">{a?.nama}</span>
                  <span className="font-mono text-sm text-muted-foreground w-24 text-right">
                    {p.jumlah > 0 ? formatRupiah(p.jumlah) : "—"}
                  </span>
                  <StatusBadge status={p.status} />
                  {canManage && periode && member && (
                    <Button
                      size="sm"
                      variant={p.status === "lunas" ? "outline" : "default"}
                      onClick={() =>
                        bayarMut.mutate({
                          periode_id: periode.id,
                          anggota_id: p.anggota_id,
                          jumlah: periode.nominal_per_orang,
                          status: p.status === "lunas" ? "belum" : "lunas",
                          actor_id: member.id,
                        })
                      }
                    >
                      {p.status === "lunas" ? "Batalkan" : "Tandai Lunas"}
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="p-4">
            <EmptyState title="Belum ada periode kas." />
          </div>
        )}
      </section>

      {/* Pengeluaran */}
      <section className="rounded-2xl border bg-card overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-empire/10">
          <h2 className="font-display text-xl text-empire flex items-center gap-2">
            <Receipt className="size-5" /> Riwayat Pengeluaran
          </h2>
          {canManage && member && (
            <PengeluaranDialog onSubmit={(d) => pengMut.mutate({ ...d, actor_id: member.id })} />
          )}
        </div>
        {pengeluaran && pengeluaran.length > 0 ? (
          <ul className="divide-y divide-border/60">
            {pengeluaran.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-4 py-3">
                <span className="flex-1 truncate">{p.deskripsi}</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {format(parseISO(p.tanggal), "d MMM yyyy", { locale: idLocale })}
                </span>
                <span className="font-mono text-sm w-24 text-right">{formatRupiah(p.jumlah)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-4">
            <EmptyState title="Belum ada pengeluaran tercatat." />
          </div>
        )}
      </section>
    </div>
  );
}

function PengeluaranDialog({
  onSubmit,
}: {
  onSubmit: (d: { deskripsi: string; jumlah: number }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [deskripsi, setDeskripsi] = useState("");
  const [jumlah, setJumlah] = useState("");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="size-4" /> Catat Pengeluaran
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-empire">Catat Pengeluaran</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Deskripsi</Label>
            <Input value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} placeholder="Snack rapat" />
          </div>
          <div>
            <Label>Jumlah (Rp)</Label>
            <Input
              type="number"
              value={jumlah}
              onChange={(e) => setJumlah(e.target.value)}
              placeholder="50000"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Batal
          </Button>
          <Button
            onClick={() => {
              const n = parseInt(jumlah, 10);
              if (!deskripsi || !Number.isFinite(n) || n <= 0) return;
              onSubmit({ deskripsi, jumlah: n });
              setOpen(false);
              setDeskripsi("");
              setJumlah("");
            }}
          >
            Catat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
