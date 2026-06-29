import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { fotoListQuery } from "@/lib/queries";
import { createFoto } from "@/lib/empire.functions";
import { useActiveMember } from "@/lib/active-member";
import { supabase } from "@/integrations/supabase/client";
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

const BUCKET = "kenangan";
const isExternalUrl = (s: string) => /^https?:\/\//i.test(s);

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

function useResolvedFotoUrls(items: Array<{ id: string; url: string }> | undefined) {
  const paths = useMemo(
    () => (items ?? []).filter((f) => !isExternalUrl(f.url)).map((f) => f.url),
    [items],
  );

  const queries = useQueries({
    queries: paths.map((path) => ({
      queryKey: ["foto-signed", path],
      staleTime: 1000 * 60 * 45, // 45 menit (link 1 jam)
      queryFn: async () => {
        const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60);
        if (error) throw error;
        return data.signedUrl;
      },
    })),
  });

  return useMemo(() => {
    const map = new Map<string, string>();
    paths.forEach((p, i) => {
      const q = queries[i];
      if (q?.data) map.set(p, q.data);
    });
    return map;
  }, [paths, queries]);
}

function BalaiKenangan() {
  const qc = useQueryClient();
  const { member } = useActiveMember();
  const { data: foto } = useQuery(fotoListQuery);
  const fn = useServerFn(createFoto);
  const signedMap = useResolvedFotoUrls(foto);
  const [preview, setPreview] = useState<{ url: string; caption?: string | null } | null>(null);

  const resolveSrc = (raw: string) => (isExternalUrl(raw) ? raw : signedMap.get(raw) ?? "");

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
          {foto.map((f) => {
            const src = resolveSrc(f.url);
            return (
              <button
                key={f.id}
                onClick={() => src && setPreview({ url: src, caption: f.caption })}
                className="group relative aspect-square overflow-hidden rounded-xl border bg-cream"
              >
                {src ? (
                  <img
                    src={src}
                    alt={f.caption ?? ""}
                    className="size-full object-cover transition group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="grid place-items-center size-full text-muted-foreground">
                    <Loader2 className="size-5 animate-spin" />
                  </div>
                )}
                {f.caption && (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-rind/80 to-transparent p-2 text-left">
                    <p className="text-xs text-cream truncate">{f.caption}</p>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="Balai masih sunyi. Belum ada kenangan."
          hint="Unggah foto pertama untuk memulai."
        />
      )}

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-3xl p-2">
          {preview && (
            <>
              <img
                src={preview.url}
                alt={preview.caption ?? ""}
                className="w-full max-h-[80vh] object-contain"
              />
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
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const reset = () => {
    setFile(null);
    setCaption("");
    setPreviewUrl(null);
  };

  const handleFile = (f: File | null) => {
    setFile(f);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(f ? URL.createObjectURL(f) : null);
  };

  const handleSubmit = async () => {
    if (!file) return toast.error("Pilih foto dulu.");
    if (file.size > 8 * 1024 * 1024) return toast.error("Ukuran maksimum 8 MB.");
    if (!file.type.startsWith("image/")) return toast.error("File harus gambar.");

    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });
      if (error) throw error;
      onSubmit({ url: path, caption: caption || null });
      setOpen(false);
      reset();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
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
            <Label>Foto</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Disimpan aman di kerajaan (private bucket, signed URL).
            </p>
            {previewUrl && (
              <img
                src={previewUrl}
                alt="Pratinjau"
                className="mt-2 max-h-48 w-full object-contain rounded-lg border"
              />
            )}
          </div>
          <div>
            <Label>Caption (opsional)</Label>
            <Input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Buka puasa kelas"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={uploading}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={uploading || !file}>
            {uploading ? (
              <>
                <Loader2 className="size-4 animate-spin mr-1.5" /> Mengunggah…
              </>
            ) : (
              "Simpan"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
