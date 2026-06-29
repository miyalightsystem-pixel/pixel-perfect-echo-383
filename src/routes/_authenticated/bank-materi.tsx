import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { ExternalLink, Plus, FileText } from "lucide-react";
import { materiListQuery } from "@/lib/queries";
import { createMateri } from "@/lib/empire.functions";
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

export const Route = createFileRoute("/_authenticated/bank-materi")({
  head: () => ({
    meta: [
      { title: "Bank Materi — JERUK'S EMPIRE" },
      { name: "description", content: "Kumpulan link materi & catatan tiap mata kuliah." },
      { property: "og:title", content: "Bank Materi — JERUK'S EMPIRE" },
      { property: "og:description", content: "Materi & catatan kelas TI." },
    ],
  }),
  component: BankMateri,
});

function BankMateri() {
  const qc = useQueryClient();
  const { data: materi } = useQuery(materiListQuery);
  const createFn = useServerFn(createMateri);

  const [filter, setFilter] = useState<string>("all");

  const matkuls = useMemo(
    () => [...new Set((materi ?? []).map((m) => m.matkul))].sort(),
    [materi],
  );

  const grouped = useMemo(() => {
    const filtered = filter === "all" ? materi ?? [] : (materi ?? []).filter((m) => m.matkul === filter);
    const g = new Map<string, typeof filtered>();
    for (const m of filtered) {
      const arr = g.get(m.matkul) ?? [];
      arr.push(m);
      g.set(m.matkul, arr);
    }
    return [...g.entries()];
  }, [materi, filter]);

  const mut = useMutation({
    mutationFn: (input: { matkul: string; judul: string; link: string }) => createFn({ data: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["materi"] });
      toast.success("Materi telah ditambahkan ke Bank.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-3xl text-empire">Bank Materi</h1>
          <p className="text-sm text-muted-foreground">Pustaka link, slide, dan catatan.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Semua matkul" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua matkul</SelectItem>
              {matkuls.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <TambahMateriDialog onSubmit={(d) => mut.mutate(d)} matkuls={matkuls} />
        </div>
      </header>

      {grouped.length > 0 ? (
        <div className="space-y-4">
          {grouped.map(([matkul, items]) => (
            <div key={matkul} className="rounded-xl border bg-card overflow-hidden">
              <div className="px-4 py-2 bg-empire/10 font-display text-lg text-empire">{matkul}</div>
              <ul className="divide-y divide-border/60">
                {items.map((m) => (
                  <li key={m.id} className="px-4 py-2.5 flex items-center gap-3">
                    <FileText className="size-4 text-empire shrink-0" />
                    <span className="flex-1 truncate">{m.judul}</span>
                    <a
                      href={m.link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-empire text-sm inline-flex items-center gap-1 hover:underline"
                    >
                      Buka <ExternalLink className="size-3" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="Bank Materi masih kosong." hint="Bagikan link Drive pertama dengan tombol di atas." />
      )}
    </div>
  );
}

function TambahMateriDialog({
  onSubmit,
  matkuls,
}: {
  onSubmit: (d: { matkul: string; judul: string; link: string }) => void;
  matkuls: string[];
}) {
  const [open, setOpen] = useState(false);
  const [matkul, setMatkul] = useState("");
  const [judul, setJudul] = useState("");
  const [link, setLink] = useState("");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-1.5">
          <Plus className="size-4" /> Tambah Materi
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-empire">Sumbangkan Materi</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Mata kuliah</Label>
            <Input
              value={matkul}
              onChange={(e) => setMatkul(e.target.value)}
              placeholder="Algoritma & Struktur Data"
              list="matkul-list"
            />
            <datalist id="matkul-list">
              {matkuls.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
          </div>
          <div>
            <Label>Judul</Label>
            <Input value={judul} onChange={(e) => setJudul(e.target.value)} placeholder="Catatan UTS" />
          </div>
          <div>
            <Label>Link</Label>
            <Input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://drive.google.com/..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Batal
          </Button>
          <Button
            onClick={() => {
              if (!matkul || !judul || !link) return;
              onSubmit({ matkul, judul, link });
              setOpen(false);
              setMatkul("");
              setJudul("");
              setLink("");
            }}
          >
            Sumbangkan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
