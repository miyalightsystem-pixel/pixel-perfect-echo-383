import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Shield, UserPlus, X, Crown, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useActiveMember, isAdmin } from "@/lib/active-member";
import { anggotaListQuery, pendingAksesListQuery } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/empire/EmptyState";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Anggota = Database["public"]["Tables"]["anggota"]["Row"];
type Pending = Database["public"]["Tables"]["pending_akses"]["Row"];

const ROLE_LABEL: Record<string, string> = {
  manager: "Manager (Admin)",
  yang_mulia: "Yang Mulia",
  sekretaris: "Sekretaris",
  bendahara: "Bendahara",
  bangsawan: "Bangsawan",
};

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw redirect({ to: "/auth" });
    const { data: anggota } = await supabase
      .from("anggota")
      .select("role")
      .eq("user_id", user.user.id)
      .maybeSingle();
    if (!anggota || (anggota.role !== "manager" && anggota.role !== "yang_mulia")) {
      throw redirect({ to: "/" });
    }
  },
  head: () => ({
    meta: [
      { title: "Balai Admin — JERUK'S EMPIRE" },
      { name: "description", content: "Kelola bangsawan dan persetujuan akses." },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { member } = useActiveMember();
  const { data: anggotaList = [] } = useQuery(anggotaListQuery);
  const { data: pending = [] } = useQuery(pendingAksesListQuery);
  const [linkTarget, setLinkTarget] = useState<Pending | null>(null);
  const [editTarget, setEditTarget] = useState<Anggota | null>(null);

  if (!isAdmin(member?.role)) return null;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl text-empire flex items-center gap-2">
          <Shield className="size-7 text-plum" /> Balai Admin
        </h1>
        <p className="text-sm text-muted-foreground">
          Kelola permintaan akses dan data bangsawan kerajaan.
        </p>
      </header>

      {/* Pending */}
      <section className="rounded-2xl border bg-card overflow-hidden">
        <div className="px-4 py-3 bg-plum/10 border-b">
          <h2 className="font-display text-xl text-plum">
            Menanti Persetujuan ({pending.length})
          </h2>
          <p className="text-xs text-muted-foreground">
            Akun Google yang masuk tapi belum terdaftar sebagai bangsawan.
          </p>
        </div>
        {pending.length === 0 ? (
          <div className="p-4">
            <EmptyState title="Tak ada yang menunggu di gerbang." />
          </div>
        ) : (
          <ul className="divide-y divide-border/60">
            {pending.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-4 py-3">
                {p.foto_google ? (
                  <img src={p.foto_google} alt="" className="size-10 rounded-full object-cover" />
                ) : (
                  <div className="size-10 rounded-full bg-cream" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{p.nama_google ?? "Tanpa nama"}</div>
                  <div className="text-xs text-muted-foreground truncate font-mono">{p.email}</div>
                </div>
                <Button size="sm" onClick={() => setLinkTarget(p)} className="gap-1">
                  <UserPlus className="size-3.5" /> Tautkan
                </Button>
                <RejectButton pending={p} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Anggota */}
      <section className="rounded-2xl border bg-card overflow-hidden">
        <div className="px-4 py-3 bg-empire/10 border-b">
          <h2 className="font-display text-xl text-empire">Silsilah Bangsawan</h2>
          <p className="text-xs text-muted-foreground">
            Klik kursi untuk ubah peran, data, atau lepaskan tautan akun.
          </p>
        </div>
        <ul className="divide-y divide-border/60">
          {anggotaList.map((a) => (
            <li key={a.id} className="flex items-center gap-3 px-4 py-3">
              {a.foto_url ? (
                <img src={a.foto_url} alt="" className="size-10 rounded-full object-cover bg-cream" />
              ) : (
                <div className="size-10 rounded-full bg-cream flex items-center justify-center text-xs text-muted-foreground">
                  {a.urutan ?? "?"}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate flex items-center gap-1.5">
                  {a.role === "manager" && <Shield className="size-3.5 text-plum" />}
                  {a.role === "yang_mulia" && <Crown className="size-3.5 text-plum" />}
                  {a.nama}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {ROLE_LABEL[a.role]}
                  {a.email && ` · ${a.email}`}
                  {a.user_id ? " · ✓ tertaut" : " · belum tertaut"}
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => setEditTarget(a)} className="gap-1">
                <Pencil className="size-3.5" /> Ubah
              </Button>
            </li>
          ))}
        </ul>
      </section>

      {linkTarget && (
        <LinkDialog
          pending={linkTarget}
          anggotaList={anggotaList.filter((a) => !a.user_id)}
          onClose={() => setLinkTarget(null)}
        />
      )}
      {editTarget && <EditDialog anggota={editTarget} onClose={() => setEditTarget(null)} />}
    </div>
  );
}

function RejectButton({ pending }: { pending: Pending }) {
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("pending_akses").delete().eq("id", pending.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pending_akses"] });
      toast.success("Permintaan ditolak.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Button
      size="icon"
      variant="ghost"
      onClick={() => mut.mutate()}
      disabled={mut.isPending}
      className="text-destructive"
      title="Tolak permintaan"
    >
      <X className="size-4" />
    </Button>
  );
}

function LinkDialog({
  pending,
  anggotaList,
  onClose,
}: {
  pending: Pending;
  anggotaList: Anggota[];
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<string>("");

  const mut = useMutation({
    mutationFn: async () => {
      if (!selected) throw new Error("Pilih kursi dulu.");
      const { error: e1 } = await supabase
        .from("anggota")
        .update({ user_id: pending.user_id, email: pending.email })
        .eq("id", selected);
      if (e1) throw e1;
      const { error: e2 } = await supabase.from("pending_akses").delete().eq("id", pending.id);
      if (e2) throw e2;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pending_akses"] });
      qc.invalidateQueries({ queryKey: ["anggota"] });
      toast.success(`${pending.email} telah tertaut ke kursi.`);
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-empire">Tautkan Akun ke Kursi</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="rounded-lg bg-muted/40 p-3 text-sm">
            <div className="font-medium">{pending.nama_google ?? "Tanpa nama"}</div>
            <div className="text-xs text-muted-foreground font-mono">{pending.email}</div>
          </div>
          <div>
            <Label>Pilih kursi kosong</Label>
            <Select value={selected} onValueChange={setSelected}>
              <SelectTrigger><SelectValue placeholder="— pilih bangsawan —" /></SelectTrigger>
              <SelectContent>
                {anggotaList.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.nama} ({ROLE_LABEL[a.role]})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Hanya kursi yang belum tertaut akun yang muncul.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={() => mut.mutate()} disabled={mut.isPending}>
            Tautkan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditDialog({ anggota, onClose }: { anggota: Anggota; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    nama: anggota.nama,
    panggilan: anggota.panggilan ?? "",
    role: anggota.role,
    email: anggota.email ?? "",
    nim: anggota.nim ?? "",
    wa: anggota.wa ?? "",
    ig: anggota.ig ?? "",
    foto_url: anggota.foto_url ?? "",
    tempat_lahir: anggota.tempat_lahir ?? "",
    tgl_lahir: anggota.tgl_lahir ?? "",
    hobi: anggota.hobi ?? "",
    motto: anggota.motto ?? "",
  });

  const mut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("anggota")
        .update({
          ...form,
          email: form.email || null,
          tgl_lahir: form.tgl_lahir || null,
        })
        .eq("id", anggota.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["anggota"] });
      toast.success("Data bangsawan diperbarui.");
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const unlink = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("anggota")
        .update({ user_id: null })
        .eq("id", anggota.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["anggota"] });
      toast.success("Akun Google dilepaskan dari kursi.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-empire">Ubah Bangsawan</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nama Lengkap">
              <Input value={form.nama} onChange={(e) => set("nama", e.target.value)} />
            </Field>
            <Field label="Panggilan">
              <Input value={form.panggilan} onChange={(e) => set("panggilan", e.target.value)} />
            </Field>
          </div>
          <Field label="Peran">
            <Select
              value={form.role}
              onValueChange={(v) => set("role", v as typeof form.role)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(ROLE_LABEL).map(([v, l]) => (
                  <SelectItem key={v} value={v}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Email (Google)">
            <Input value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="nama@gmail.com" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="NIM">
              <Input value={form.nim} onChange={(e) => set("nim", e.target.value)} />
            </Field>
            <Field label="No WA">
              <Input value={form.wa} onChange={(e) => set("wa", e.target.value)} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Instagram">
              <Input value={form.ig} onChange={(e) => set("ig", e.target.value)} />
            </Field>
            <Field label="Foto URL">
              <Input value={form.foto_url} onChange={(e) => set("foto_url", e.target.value)} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tempat Lahir">
              <Input value={form.tempat_lahir} onChange={(e) => set("tempat_lahir", e.target.value)} />
            </Field>
            <Field label="Tanggal Lahir">
              <Input type="date" value={form.tgl_lahir} onChange={(e) => set("tgl_lahir", e.target.value)} />
            </Field>
          </div>
          <Field label="Hobi">
            <Input value={form.hobi} onChange={(e) => set("hobi", e.target.value)} />
          </Field>
          <Field label="Motto">
            <Input value={form.motto} onChange={(e) => set("motto", e.target.value)} />
          </Field>
          {anggota.user_id && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => unlink.mutate()}
              disabled={unlink.isPending}
              className="w-full text-destructive"
            >
              Lepaskan tautan akun Google
            </Button>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={() => mut.mutate()} disabled={mut.isPending}>Simpan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
