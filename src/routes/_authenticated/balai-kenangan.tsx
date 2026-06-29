import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { format, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Plus } from "lucide-react";
import { fotoListQuery } from "@/lib/queries";
import { createFoto } from "@/lib/empire.functions";
import { useActiveMember } from "@/lib/active-member";
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

export const Route = createFileRoute("/_authenticated/balai-kenangan")({
  head: () => ({
    meta: [
      { title: "Balai Kenangan — JERUK'S EMPIRE" },
      { name: "description", content: "Galeri foto kenangan kelas TI." },
      { property: "og:title", content: "Balai Kenangan — JERUK'S EMPIRE" },
      { property: "og:description", content: "Galeri kenangan kelas." },
    ],
  }),
  component: BalaiKenangan,
});

function BalaiKenangan() {
  const qc = useQueryClient();
  const { member } = useActiveMember();
  const { data: foto } = useQuery(fotoListQuery);
  const fn = useServerFn(createFoto);
  const [preview, setPreview] = useState<{ url: string; caption?: string | null } | null>(null);

  const mut = useMutation({
    mutationFn: (input: { url: string; caption?: string | null; uploader_id?: string | null }) =>
      fn({ data: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["foto"] });
      toast.success("Kenangan tersimpan di Balai.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-3xl text-empire">Balai Kenangan</h1>
          <p className="text-sm text-muted-foreground">Jejak perjalanan kerajaan.</p>
        </div>
        <TambahFotoDialog onSubmit={(d) => mut.mutate({ ...d, uploader_id: member?.id ?? null })} />
      </header>

      {foto && foto.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {foto.map((f) => (
            <button
              key={f.id}
              onClick={() => setPreview({ url: f.url, caption: f.caption })}
              className="group relative aspect-square overflow-hidden rounded-xl border bg-cream"
            >
              <img
                src={f.url}
                alt={f.caption ?? ""}
                className="size-full object-cover transition group-hover:scale-105"
                loading="lazy"
              />
              {f.caption && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-rind/80 to-transparent p-2 text-left">
                  <p className="text-xs text-cream truncate">{f.caption}</p>
                </div>
              )}
            </button>
          ))}
        </div>
      ) : (
        <EmptyState title="Balai masih sunyi. Belum ada kenangan." hint="Tempel link foto untuk memulai." />
      )}

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-3xl p-2">
          {preview && (
            <>
              <img src={preview.url} alt={preview.caption ?? ""} className="w-full max-h-[80vh] object-contain" />
              {preview.caption && (
                <p className="px-3 pb-2 text-sm text-muted-foreground">{preview.caption}</p>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TambahFotoDialog({
  onSubmit,
}: {
  onSubmit: (d: { url: string; caption?: string | null }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-1.5">
          <Plus className="size-4" /> Unggah Kenangan
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-empire">Simpan Kenangan</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Link foto</Label>
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
            <p className="text-xs text-muted-foreground mt-1">
              Tempel link langsung ke gambar (mis. dari Imgur, Drive yang sudah dipublikasikan).
            </p>
          </div>
          <div>
            <Label>Caption (opsional)</Label>
            <Input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Buka puasa kelas" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Batal
          </Button>
          <Button
            onClick={() => {
              if (!url) return;
              onSubmit({ url, caption: caption || null });
              setOpen(false);
              setUrl("");
              setCaption("");
            }}
          >
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
