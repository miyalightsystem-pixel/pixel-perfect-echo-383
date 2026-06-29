import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Crown, Instagram, MessageCircle, Plus } from "lucide-react";
import { anggotaListQuery } from "@/lib/queries";
import { createAnggota } from "@/lib/empire.functions";
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

export const Route = createFileRoute("/_authenticated/para-bangsawan")({
  head: () => ({
    meta: [
      { title: "Para Bangsawan — JERUK'S EMPIRE" },
      { name: "description", content: "Direktori anggota kelas TI dan jabatan kerajaannya." },
      { property: "og:title", content: "Para Bangsawan — JERUK'S EMPIRE" },
      { property: "og:description", content: "Direktori anggota kelas." },
    ],
  }),
  component: ParaBangsawan,
});

const roleLabel: Record<string, string> = {
  yang_mulia: "Yang Mulia",
  bendahara: "Bendahara",
  sekretaris: "Sekretaris",
  bangsawan: "Bangsawan",
};

function ParaBangsawan() {
  const qc = useQueryClient();
  const { data: anggota } = useQuery(anggotaListQuery);
  const fn = useServerFn(createAnggota);

  const mut = useMutation({
    mutationFn: (input: {
      nama: string;
      role: "yang_mulia" | "bendahara" | "sekretaris" | "bangsawan";
      foto_url?: string | null;
      ig?: string | null;
      wa?: string | null;
    }) => fn({ data: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["anggota"] });
      toast.success("Bangsawan baru disambut di kerajaan.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-3xl text-empire">Para Bangsawan</h1>
          <p className="text-sm text-muted-foreground">Daftar penghuni kerajaan.</p>
        </div>
        <TambahDialog onSubmit={(d) => mut.mutate(d)} />
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {anggota?.map((a) => {
          const isYM = a.role === "yang_mulia";
          return (
            <article
              key={a.id}
              className={`rounded-2xl border bg-card p-4 flex gap-3 ${isYM ? "border-plum/40" : ""}`}
            >
              <div className="size-16 rounded-full bg-cream shrink-0 overflow-hidden">
                {a.foto_url ? <img src={a.foto_url} alt={a.nama} className="size-full object-cover" /> : null}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="font-medium truncate">{a.nama}</h3>
                  {isYM && <Crown className="size-4 text-plum" />}
                </div>
                <p className={`text-xs ${isYM ? "text-plum font-medium" : "text-muted-foreground"}`}>
                  {roleLabel[a.role]}
                </p>
                <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                  {a.ig && (
                    <a
                      className="inline-flex items-center gap-1 hover:text-empire"
                      href={`https://instagram.com/${a.ig.replace(/^@/, "")}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Instagram className="size-3" /> @{a.ig.replace(/^@/, "")}
                    </a>
                  )}
                  {a.wa && (
                    <a
                      className="inline-flex items-center gap-1 hover:text-empire"
                      href={`https://wa.me/${a.wa.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <MessageCircle className="size-3" /> WA
                    </a>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function TambahDialog({
  onSubmit,
}: {
  onSubmit: (d: {
    nama: string;
    role: "yang_mulia" | "bendahara" | "sekretaris" | "bangsawan";
    foto_url?: string | null;
    ig?: string | null;
    wa?: string | null;
  }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [nama, setNama] = useState("");
  const [role, setRole] = useState<"yang_mulia" | "bendahara" | "sekretaris" | "bangsawan">("bangsawan");
  const [foto, setFoto] = useState("");
  const [ig, setIg] = useState("");
  const [wa, setWa] = useState("");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-1.5">
          <Plus className="size-4" /> Tambah Anggota
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-empire">Sambut Bangsawan Baru</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Nama</Label>
            <Input value={nama} onChange={(e) => setNama(e.target.value)} />
          </div>
          <div>
            <Label>Peran</Label>
            <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bangsawan">Bangsawan</SelectItem>
                <SelectItem value="bendahara">Bendahara</SelectItem>
                <SelectItem value="sekretaris">Sekretaris</SelectItem>
                <SelectItem value="yang_mulia">Yang Mulia (Ketua)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Foto (URL, opsional)</Label>
            <Input value={foto} onChange={(e) => setFoto(e.target.value)} placeholder="https://..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>IG</Label>
              <Input value={ig} onChange={(e) => setIg(e.target.value)} placeholder="username" />
            </div>
            <div>
              <Label>WhatsApp</Label>
              <Input value={wa} onChange={(e) => setWa(e.target.value)} placeholder="0812..." />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Batal
          </Button>
          <Button
            onClick={() => {
              if (!nama) return;
              onSubmit({
                nama,
                role,
                foto_url: foto || null,
                ig: ig || null,
                wa: wa || null,
              });
              setOpen(false);
              setNama("");
              setRole("bangsawan");
              setFoto("");
              setIg("");
              setWa("");
            }}
          >
            Sambut
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
