import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { format, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Plus, MessageSquare } from "lucide-react";
import { forumTopikListQuery } from "@/lib/queries";
import { createForumTopik } from "@/lib/empire.functions";
import { useActiveMember } from "@/lib/active-member";
import { EmptyState } from "@/components/empire/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/forum")({
  head: () => ({
    meta: [
      { title: "Forum — JERUK'S EMPIRE" },
      { name: "description", content: "Diskusi terbuka antar bangsawan kelas TI." },
      { property: "og:title", content: "Forum — JERUK'S EMPIRE" },
      { property: "og:description", content: "Diskusi kelas." },
    ],
  }),
  component: Forum,
});

function Forum() {
  const qc = useQueryClient();
  const { member } = useActiveMember();
  const { data: topik } = useQuery(forumTopikListQuery);
  const fn = useServerFn(createForumTopik);

  const mut = useMutation({
    mutationFn: (input: { judul: string; isi: string; author_id: string }) => fn({ data: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["forum_topik"] });
      toast.success("Topik baru diumumkan di forum.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-3xl text-empire">Forum</h1>
          <p className="text-sm text-muted-foreground">Sidang terbuka para Bangsawan.</p>
        </div>
        {member ? (
          <TopikDialog onSubmit={(d) => mut.mutate({ ...d, author_id: member.id })} />
        ) : (
          <Button disabled>Pilih nama dulu untuk posting</Button>
        )}
      </header>

      {topik && topik.length > 0 ? (
        <ul className="space-y-2">
          {topik.map((t) => {
            const author = (t as unknown as { author?: { nama: string } | null }).author;
            const balasanCount =
              ((t as unknown as { balasan?: { count: number }[] | null }).balasan?.[0]?.count) ?? 0;
            return (
              <li key={t.id}>
                <Link
                  to="/forum/$topikId"
                  params={{ topikId: t.id }}
                  className="block rounded-xl border bg-card p-4 hover:border-empire/60 transition"
                >
                  <h3 className="font-display text-lg">{t.judul}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{t.isi}</p>
                  <p className="mt-2 text-xs font-mono text-muted-foreground flex items-center gap-3">
                    <span>{author?.nama ?? "Anonim"}</span>
                    <span>·</span>
                    <span>{format(parseISO(t.created_at), "d MMM yyyy", { locale: idLocale })}</span>
                    <span className="ml-auto inline-flex items-center gap-1 text-empire">
                      <MessageSquare className="size-3" /> {balasanCount}
                    </span>
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState title="Belum ada topik di forum." hint="Mulai diskusi pertama dengan tombol di atas." />
      )}
    </div>
  );
}

function TopikDialog({ onSubmit }: { onSubmit: (d: { judul: string; isi: string }) => void }) {
  const [open, setOpen] = useState(false);
  const [judul, setJudul] = useState("");
  const [isi, setIsi] = useState("");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-1.5">
          <Plus className="size-4" /> Topik Baru
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-empire">Buka Sidang Baru</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Judul</Label>
            <Input value={judul} onChange={(e) => setJudul(e.target.value)} />
          </div>
          <div>
            <Label>Isi</Label>
            <Textarea
              value={isi}
              onChange={(e) => setIsi(e.target.value)}
              rows={5}
              placeholder="Ada yang punya catatan UTS?"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Batal
          </Button>
          <Button
            onClick={() => {
              if (!judul || !isi) return;
              onSubmit({ judul, isi });
              setOpen(false);
              setJudul("");
              setIsi("");
            }}
          >
            Sebarkan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
