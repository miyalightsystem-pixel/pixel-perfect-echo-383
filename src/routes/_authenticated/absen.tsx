import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { QrCode, ExternalLink, Lock, Share2, Trash2, Copy, Clock } from "lucide-react";
import { jadwalListQuery, absenShareListQuery } from "@/lib/queries";
import { shareAbsenLink, deleteAbsenShare } from "@/lib/absen.functions";
import { useActiveMember, isAdmin } from "@/lib/active-member";
import { EmptyState } from "@/components/empire/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/absen")({
  head: () => ({
    meta: [
      { title: "Absen Cepat — JERUK'S EMPIRE" },
      { name: "description", content: "Bagi link absen QR sesi kuliah — siapa cepat dia dapat." },
      { property: "og:title", content: "Absen Cepat — JERUK'S EMPIRE" },
      { property: "og:description", content: "Race to share absen link." },
    ],
  }),
  component: AbsenPage,
});

const HARI_LABEL = ["", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

function AbsenPage() {
  const today = new Date();
  const tanggalStr = format(today, "yyyy-MM-dd");
  const hariNum = today.getDay() === 0 ? 7 : today.getDay();

  const qc = useQueryClient();
  const { member } = useActiveMember();
  const admin = isAdmin(member?.role);
  const { data: jadwal } = useQuery(jadwalListQuery);
  const { data: shares } = useQuery(absenShareListQuery);

  const todayJadwal = useMemo(
    () => (jadwal ?? []).filter((j) => j.hari === hariNum),
    [jadwal, hariNum],
  );

  // Map jadwal_id+tanggal -> share row hari ini
  const shareMap = useMemo(() => {
    const m = new Map<string, NonNullable<typeof shares>[number]>();
    for (const s of shares ?? []) {
      if (s.tanggal === tanggalStr) m.set(s.jadwal_id, s);
    }
    return m;
  }, [shares, tanggalStr]);

  const shareFn = useServerFn(shareAbsenLink);
  const shareMut = useMutation({
    mutationFn: (input: { jadwal_id: string; tanggal: string; link: string }) =>
      shareFn({ data: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["absen_share"] });
      toast.success("Mantap! Link absen berhasil dibagikan duluan 🏁");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delFn = useServerFn(deleteAbsenShare);
  const delMut = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["absen_share"] });
      toast.success("Link absen dihapus.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [openId, setOpenId] = useState<string | null>(null);
  const [linkInput, setLinkInput] = useState("");

  const recentShares = (shares ?? []).filter((s) => s.tanggal !== tanggalStr).slice(0, 8);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-empire flex items-center gap-2">
            <QrCode className="size-7" /> Absen Cepat
          </h1>
          <p className="text-sm text-muted-foreground">
            Siapa cepat dia dapat — bagi link QR absen sesi {HARI_LABEL[hariNum]} ini, yang lain otomatis ter-lock.
          </p>
        </div>
      </header>

      <section className="space-y-3">
        <h2 className="font-display text-lg text-rind">Sesi hari ini · {format(today, "EEEE, d MMM", { locale: idLocale })}</h2>
        {todayJadwal.length === 0 ? (
          <EmptyState title="Tidak ada jadwal hari ini" hint="Liburan dulu, Bangsawan." />
        ) : (
          <ul className="grid gap-3">
            <AnimatePresence initial={false}>
              {todayJadwal.map((j, i) => {
                const share = shareMap.get(j.id);
                const locked = !!share;
                return (
                  <motion.li
                    key={j.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25, delay: i * 0.04 }}
                    className={cn(
                      "rounded-xl border p-4 bg-card transition-all",
                      locked ? "border-empire/60 shadow-[0_0_0_1px_var(--empire-orange)]/20" : "border-border/60 hover:border-empire/50",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-display text-base truncate">{j.matkul}</div>
                        <div className="text-xs text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <span className="inline-flex items-center gap-1"><Clock className="size-3" />{j.jam_mulai}–{j.jam_selesai}</span>
                          {j.ruangan && <span>· {j.ruangan}</span>}
                          {j.dosen && <span>· {j.dosen}</span>}
                        </div>
                      </div>
                      {locked ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-empire/15 text-empire px-2 py-1 text-[11px] font-medium shrink-0">
                          <Lock className="size-3" /> Sudah ada
                        </span>
                      ) : (
                        <Dialog
                          open={openId === j.id}
                          onOpenChange={(o) => {
                            setOpenId(o ? j.id : null);
                            if (!o) setLinkInput("");
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button size="sm" className="gap-1 shrink-0">
                              <Share2 className="size-3.5" /> Bagikan
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Bagikan link absen · {j.matkul}</DialogTitle>
                              <DialogDescription>
                                Tempel URL hasil scan QR absen. Yang pertama submit akan menang — yang lain ter-lock.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-2 pt-2">
                              <Label htmlFor="absen-link">Link absen</Label>
                              <Input
                                id="absen-link"
                                placeholder="https://..."
                                value={linkInput}
                                onChange={(e) => setLinkInput(e.target.value)}
                                autoFocus
                              />
                            </div>
                            <DialogFooter>
                              <Button
                                disabled={!linkInput || shareMut.isPending}
                                onClick={() => {
                                  shareMut.mutate(
                                    { jadwal_id: j.id, tanggal: tanggalStr, link: linkInput.trim() },
                                    {
                                      onSettled: () => {
                                        setOpenId(null);
                                        setLinkInput("");
                                      },
                                    },
                                  );
                                }}
                              >
                                {shareMut.isPending ? "Mengirim…" : "Kirim Link"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>

                    {share && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mt-3 rounded-lg bg-muted/40 p-3 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                          <span>
                            Dibagikan oleh <b className="text-foreground">{share.anggota?.panggilan || share.anggota?.nama || "Bangsawan"}</b>
                            {" · "}{format(new Date(share.created_at), "HH:mm", { locale: idLocale })}
                          </span>
                          {admin && (
                            <button
                              onClick={() => delMut.mutate(share.id)}
                              className="text-destructive hover:underline inline-flex items-center gap-1"
                              aria-label="Hapus"
                            >
                              <Trash2 className="size-3" />
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={share.link}
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1 truncate text-sm text-empire hover:underline inline-flex items-center gap-1"
                          >
                            <ExternalLink className="size-3.5 shrink-0" />
                            <span className="truncate">{share.link}</span>
                          </a>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              navigator.clipboard.writeText(share.link);
                              toast.success("Link tersalin.");
                            }}
                          >
                            <Copy className="size-3.5" />
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        )}
      </section>

      {recentShares.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-lg text-rind">Riwayat terbaru</h2>
          <ul className="space-y-2">
            {recentShares.map((s) => (
              <li key={s.id} className="rounded-lg border border-border/60 bg-card p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{s.jadwal?.matkul ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(s.tanggal + "T00:00:00"), "d MMM yyyy", { locale: idLocale })} · {s.anggota?.panggilan || s.anggota?.nama}
                    </div>
                  </div>
                  <a href={s.link} target="_blank" rel="noreferrer" className="text-empire text-xs hover:underline shrink-0 inline-flex items-center gap-1">
                    <ExternalLink className="size-3" /> Buka
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </motion.div>
  );
}
