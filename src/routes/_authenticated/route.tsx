import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/empire/AppShell";
import { Crest } from "@/components/empire/Crest";
import { Button } from "@/components/ui/button";
import { Clock, LogOut } from "lucide-react";
import { hasCompletedTour, startTour } from "@/lib/onboarding-tour";

// ⚠️ SEMENTARA: gerbang auth dibuka untuk audit/scan eksternal.
// Kembalikan blok beforeLoad asli setelah perbaikan selesai.
export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    return { user: data.user ?? ({ id: "guest", email: "guest@scan.local" } as any) };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user } = Route.useRouteContext();
  const [checking, setChecking] = useState(true);
  const [hasMember, setHasMember] = useState<boolean>(false);
  const [pending, setPending] = useState<{ email: string; created_at: string } | null>(null);

  const { refetch } = useQuery({
    queryKey: ["membership-check", user.id],
    queryFn: async () => {
      const [{ data: anggota }, { data: pendingRow }] = await Promise.all([
        supabase.from("anggota").select("id").eq("user_id", user.id).maybeSingle(),
        supabase.from("pending_akses").select("email, created_at").eq("user_id", user.id).maybeSingle(),
      ]);
      setHasMember(!!anggota);
      setPending(pendingRow);
      setChecking(false);
      return { anggota, pendingRow };
    },
  });

  // Poll every 8s while pending so user sees approval automatically
  useEffect(() => {
    if (!pending || hasMember) return;
    const t = setInterval(() => refetch(), 8000);
    return () => clearInterval(t);
  }, [pending, hasMember, refetch]);

  // Auto-start onboarding tour on first visit after membership confirmed
  useEffect(() => {
    if (!hasMember || checking) return;
    if (hasCompletedTour()) return;
    const t = setTimeout(() => startTour(), 700);
    return () => clearTimeout(t);
  }, [hasMember, checking]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Crest size={64} />
      </div>
    );
  }

  if (!hasMember) {
    return <PendingScreen email={user.email ?? pending?.email ?? ""} />;
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

function PendingScreen({ email }: { email: string }) {
  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  };
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-cream via-background to-cream">
      <div className="max-w-md w-full text-center space-y-5">
        <div className="flex justify-center">
          <Crest size={72} />
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-zest/20 px-3 py-1 text-xs font-medium text-rind">
          <Clock className="size-3.5" /> Menanti persetujuan Admin
        </div>
        <h1 className="font-display text-3xl text-empire">Tunggu sejenak, Calon Bangsawan</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Akun <span className="font-mono text-foreground">{email}</span> belum
          terdaftar di silsilah kerajaan. Admin akan menautkan akun Anda ke
          kursi yang tersedia. Halaman ini akan terbuka otomatis begitu disetujui.
        </p>
        <Button variant="outline" onClick={signOut} className="gap-2">
          <LogOut className="size-4" /> Keluar
        </Button>
      </div>
    </div>
  );
}
