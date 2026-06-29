import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { format, parseISO, differenceInCalendarDays } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Plus, Trophy, FolderOpen } from "lucide-react";
import { TUGAS_DRIVE_URL } from "@/lib/external-links";

import { tugasListQuery, completionListQuery, anggotaListQuery } from "@/lib/queries";
import { createTugas, markPersonalDone, setTugasStatus } from "@/lib/empire.functions";
import { useActiveMember } from "@/lib/active-member";
import { EmptyState } from "@/components/empire/EmptyState";
import { StatusBadge } from "@/components/empire/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/balai-tugas")({
  head: () => ({
    meta: [
      { title: "Balai Tugas — JERUK'S EMPIRE" },
      { name: "description", content: "Pelacak tugas, deadline, dan leaderboard kelas TI." },
      { property: "og:title", content: "Balai Tugas — JERUK'S EMPIRE" },
      { property: "og:description", content: "Pelacak tugas & leaderboard santai." },
    ],
  }),
  component: BalaiTugas,
});

function BalaiTugas() {
  const qc = useQueryClient();
  const { data: tugas } = useQuery(tugasListQuery);
  const { data: completions } = useQuery(completionListQuery);
  const { data: anggota } = useQuery(anggotaListQuery);
  const { member } = useActiveMember();

  const createFn = useServerFn(createTugas);
  const markFn = useServerFn(markPersonalDone);
  const statusFn = useServerFn(setTugasStatus);

  const createMut = useMutation({
    mutationFn: (input: { judul: string; matkul: string; deadline: string }) =>
      createFn({ data: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tugas"] });
      toast.success("Titah tugas baru telah disebar.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const markMut = useMutation({
    mutationFn: (input: { tugas_id: string; anggota_id: string; done: boolean }) =>
      markFn({ data: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tugas_completion"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const statusMut = useMutation({
    mutationFn: (input: { id: string; status: "belum" | "dikerjakan" | "selesai"; actor_id?: string }) =>
      statusFn({ data: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tugas"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  // Leaderboard
  const leaderboard = useMemo(() => {
    if (!completions || !anggota) return [];
    const counts = new Map<string, { nama: string; total: number; tepat: number }>();
    for (const a of anggota) counts.set(a.id, { nama: a.nama, total: 0, tepat: 0 });
    for (const c of completions as Array<{
      anggota_id: string;
      completed_at: string;
      tugas?: { deadline: string } | null;
      anggota?: { nama: string } | null;
    }>) {
      const row = counts.get(c.anggota_id);
      if (!row) continue;
      row.total += 1;
      if (c.tugas && new Date(c.completed_at) <= new Date(c.tugas.deadline)) {
        row.tepat += 1;
      }
    }
    return [...counts.values()].filter((r) => r.total > 0).sort((a, b) => b.tepat - a.tepat);
  }, [completions, anggota]);

  const personalDone = (tugasId: string) =>
    !!(completions as Array<{ tugas_id: string; anggota_id: string }> | undefined)?.find(
      (c) => c.tugas_id === tugasId && c.anggota_id === member?.id,
    );

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-empire">Balai Tugas</h1>
          <p className="text-sm text-muted-foreground">Titah perkuliahan & deadline.</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={TUGAS_DRIVE_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-card px-3 py-2 text-sm font-medium hover:border-empire/60 transition-all hover:-translate-y-0.5"
          >
            <FolderOpen className="size-4 text-empire" /> Drive Tugas
          </a>
          <TambahTugasDialog onSubmit={(d) => createMut.mutate(d)} />
        </div>
      </header>

      {/* Tugas list */}
      <section className="space-y-3">
        {tugas && tugas.length > 0 ? (
          tugas.map((t) => {
            const d = parseISO(t.deadline);
            const days = differenceInCalendarDays(d, new Date());
            const done = personalDone(t.id);
            return (
              <article
                key={t.id}
                className="rounded-xl border bg-card p-4 flex items-start gap-3"
              >
                <Checkbox
                  checked={done}
                  disabled={!member}
                  onCheckedChange={(v) =>
                    member &&
                    markMut.mutate({ tugas_id: t.id, anggota_id: member.id, done: !!v })
                  }
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className={`font-medium ${done ? "line-through text-muted-foreground" : ""}`}>
                      {t.judul}
                    </h3>
                    <StatusBadge status={t.status} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t.matkul} ·{" "}
                    <span className="font-mono">
                      {format(d, "EEE d MMM HH:mm", { locale: idLocale })}
                    </span>{" "}
                    ·{" "}
                    <span className={days < 0 ? "text-destructive" : "text-empire"}>
                      {days < 0 ? `lewat ${-days}h` : days === 0 ? "hari ini" : `${days} hari lagi`}
                    </span>
                  </p>
                  <div className="mt-2 flex gap-1.5 flex-wrap">
                    {(["belum", "dikerjakan", "selesai"] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() =>
                          statusMut.mutate({ id: t.id, status: s, actor_id: member?.id })
                        }
                        className={`rounded-full border px-2.5 py-0.5 text-[11px] capitalize ${
                          t.status === s
                            ? "border-empire bg-empire/10 text-empire"
                            : "border-border text-muted-foreground hover:border-empire/60"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <EmptyState title="Belum ada titah tugas hari ini." hint="Tambahkan tugas pertama dengan tombol di atas." />
        )}
      </section>

      {/* Leaderboard */}
      <section className="rounded-2xl border bg-card p-4">
        <h2 className="font-display text-xl text-empire flex items-center gap-2">
          <Trophy className="size-5" /> Leaderboard Santai
        </h2>
        <p className="text-xs text-muted-foreground">Hitungan tugas selesai tepat waktu.</p>
        {leaderboard.length > 0 ? (
          <ol className="mt-3 space-y-1.5">
            {leaderboard.map((row, i) => (
              <li
                key={row.nama}
                className="flex items-center justify-between gap-2 rounded-lg bg-cream/60 px-3 py-2"
              >
                <span className="flex items-center gap-2">
                  <span className="font-mono text-empire w-5">{i + 1}.</span>
                  {row.nama}
                </span>
                <span className="font-mono text-sm">
                  <span className="text-[color:var(--peel-green)]">{row.tepat}</span>
                  <span className="text-muted-foreground"> / {row.total}</span>
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">Belum ada Bangsawan yang menuntaskan tugas.</p>
        )}
      </section>
    </div>
  );
}

function TambahTugasDialog({
  onSubmit,
}: {
  onSubmit: (d: { judul: string; matkul: string; deadline: string }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [judul, setJudul] = useState("");
  const [matkul, setMatkul] = useState("");
  const [deadline, setDeadline] = useState("");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-1.5">
          <Plus className="size-4" /> Tambah Tugas
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-empire">Sebar Titah Tugas Baru</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Judul</Label>
            <Input value={judul} onChange={(e) => setJudul(e.target.value)} placeholder="Tugas Algoritma" />
          </div>
          <div>
            <Label>Mata kuliah</Label>
            <Input value={matkul} onChange={(e) => setMatkul(e.target.value)} placeholder="Algoritma & Struktur Data" />
          </div>
          <div>
            <Label>Deadline</Label>
            <Input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Batal
          </Button>
          <Button
            onClick={() => {
              if (!judul || !matkul || !deadline) return;
              onSubmit({ judul, matkul, deadline: new Date(deadline).toISOString() });
              setOpen(false);
              setJudul("");
              setMatkul("");
              setDeadline("");
            }}
          >
            Sebar Titah
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
