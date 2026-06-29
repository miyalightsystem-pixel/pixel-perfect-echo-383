import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { format, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { ArrowLeft, Send } from "lucide-react";
import { forumTopikDetailQuery } from "@/lib/queries";
import { createForumBalasan } from "@/lib/empire.functions";
import { useActiveMember } from "@/lib/active-member";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/empire/EmptyState";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/forum/$topikId")({
  head: () => ({
    meta: [
      { title: "Topik Forum — JERUK'S EMPIRE" },
      { name: "description", content: "Diskusi topik forum kelas TI." },
    ],
  }),
  component: ForumDetail,
});

function ForumDetail() {
  const { topikId } = Route.useParams();
  const qc = useQueryClient();
  const { member } = useActiveMember();
  const { data } = useQuery(forumTopikDetailQuery(topikId));
  const [isi, setIsi] = useState("");

  const fn = useServerFn(createForumBalasan);
  const mut = useMutation({
    mutationFn: (input: { topik_id: string; isi: string; author_id: string }) => fn({ data: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["forum_topik", topikId] });
      qc.invalidateQueries({ queryKey: ["forum_topik", "list"] });
      setIsi("");
      toast.success("Balasan tersampaikan.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!data?.topik) {
    return <EmptyState title="Topik tak ditemukan." />;
  }

  const author = (data.topik as unknown as { author?: { nama: string } | null }).author;

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <Link to="/forum" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-empire">
        <ArrowLeft className="size-4" /> Kembali ke forum
      </Link>

      <article className="rounded-2xl border bg-card p-5">
        <h1 className="font-display text-2xl">{data.topik.judul}</h1>
        <p className="text-xs font-mono text-muted-foreground mt-1">
          {author?.nama ?? "Anonim"} ·{" "}
          {format(parseISO(data.topik.created_at), "d MMM yyyy HH:mm", { locale: idLocale })}
        </p>
        <p className="mt-3 whitespace-pre-wrap text-foreground/90">{data.topik.isi}</p>
      </article>

      <section className="space-y-2">
        <h2 className="font-display text-lg text-empire">{data.balasan.length} Balasan</h2>
        {data.balasan.map((b) => {
          const ba = (b as unknown as { author?: { nama: string } | null }).author;
          return (
            <article key={b.id} className="rounded-xl border bg-card p-4">
              <p className="text-xs font-mono text-muted-foreground">
                {ba?.nama ?? "Anonim"} ·{" "}
                {format(parseISO(b.created_at), "d MMM HH:mm", { locale: idLocale })}
              </p>
              <p className="mt-1.5 whitespace-pre-wrap text-foreground/90">{b.isi}</p>
            </article>
          );
        })}
      </section>

      {member ? (
        <form
          className="rounded-2xl border bg-card p-3 space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!isi.trim()) return;
            mut.mutate({ topik_id: topikId, isi: isi.trim(), author_id: member.id });
          }}
        >
          <Textarea
            value={isi}
            onChange={(e) => setIsi(e.target.value)}
            placeholder={`Bertitah sebagai ${member.nama.split(" ")[0]}...`}
            rows={3}
          />
          <div className="flex justify-end">
            <Button type="submit" className="gap-1.5">
              <Send className="size-4" /> Kirim Balasan
            </Button>
          </div>
        </form>
      ) : (
        <p className="rounded-xl border border-dashed bg-card/50 p-4 text-center text-sm text-muted-foreground">
          Pilih nama Anda di pojok kanan atas untuk membalas.
        </p>
      )}
    </div>
  );
}
