import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Plus, Receipt, FileDown } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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

  const monthly = useMemo(() => {
    const map = new Map<string, { bulan: string; masuk: number; keluar: number }>();
    const key = (iso: string) => format(parseISO(iso), "yyyy-MM");
    const label = (iso: string) => format(parseISO(iso), "MMM yy", { locale: idLocale });
    for (const p of pembayaran ?? []) {
      if (p.status !== "lunas" || !p.tanggal) continue;
      const k = key(p.tanggal);
      const row = map.get(k) ?? { bulan: label(p.tanggal), masuk: 0, keluar: 0 };
      row.masuk += p.jumlah;
      map.set(k, row);
    }
    for (const p of pengeluaran ?? []) {
      const k = key(p.tanggal);
      const row = map.get(k) ?? { bulan: label(p.tanggal), masuk: 0, keluar: 0 };
      row.keluar += p.jumlah;
      map.set(k, row);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v);
  }, [pembayaran, pengeluaran]);

  const exportPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Laporan Perbendaharaan — JERUK'S EMPIRE", 14, 18);
    doc.setFontSize(10);
    doc.text(`Periode: ${periode?.label ?? "—"}`, 14, 25);
    doc.text(`Dicetak: ${format(new Date(), "d MMM yyyy HH:mm", { locale: idLocale })}`, 14, 30);

    autoTable(doc, {
      startY: 36,
      head: [["Ringkasan", "Jumlah"]],
      body: [
        ["Total Masuk", formatRupiah(totals.masuk)],
        ["Total Keluar", formatRupiah(totals.keluar)],
        ["Saldo Kas", formatRupiah(totals.saldo)],
      ],
      theme: "grid",
      headStyles: { fillColor: [184, 134, 11] },
    });

    autoTable(doc, {
      head: [["Bangsawan", "Jumlah", "Status", "Tanggal"]],
      body: (pembayaran ?? []).map((p) => [
        (p as unknown as { anggota: { nama: string } }).anggota?.nama ?? "—",
        p.jumlah > 0 ? formatRupiah(p.jumlah) : "—",
        p.status,
        p.tanggal ? format(parseISO(p.tanggal), "d MMM yyyy", { locale: idLocale }) : "—",
      ]),
      theme: "striped",
      headStyles: { fillColor: [184, 134, 11] },
      didDrawPage: (d) => {
        if (d.cursor) doc.text("Setoran Bangsawan", 14, d.cursor.y - 4);
      },
    });

    autoTable(doc, {
      head: [["Deskripsi", "Tanggal", "Jumlah"]],
      body: (pengeluaran ?? []).map((p) => [
        p.deskripsi,
        format(parseISO(p.tanggal), "d MMM yyyy", { locale: idLocale }),
        formatRupiah(p.jumlah),
      ]),
      theme: "striped",
      headStyles: { fillColor: [184, 134, 11] },
    });

    doc.save(`perbendaharaan-${format(new Date(), "yyyyMMdd-HHmm")}.pdf`);
    toast.success("Laporan PDF terunduh.");
  };

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
      <header className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-3xl text-empire">Perbendaharaan</h1>
          <p className="text-sm text-muted-foreground">
            Hanya {member && canManage ? "Anda — " : ""}Bendahara & Yang Mulia yang dapat mengubah catatan.
          </p>
        </div>
        <Button variant="outline" onClick={exportPdf} className="gap-1.5">
          <FileDown className="size-4" /> Unduh Laporan PDF
        </Button>
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

      {monthly.length > 0 && (
        <section className="rounded-2xl border bg-card p-4">
          <h2 className="font-display text-xl text-empire mb-3">Arus Kas per Bulan</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="bulan" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis
                  tick={{ fontSize: 11 }}
                  stroke="hsl(var(--muted-foreground))"
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(v: number) => formatRupiah(v)}
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                  }}
                />
                <Legend />
                <Bar dataKey="masuk" name="Masuk" fill="var(--peel-green, #4caf50)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="keluar" name="Keluar" fill="hsl(var(--empire, 30 70% 45%))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

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
