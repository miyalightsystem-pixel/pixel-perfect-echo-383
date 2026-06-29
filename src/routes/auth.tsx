import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Crest } from "@/components/empire/Crest";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) throw redirect({ to: "/" });
  },
  head: () => ({
    meta: [
      { title: "Masuk Kerajaan — JERUK'S EMPIRE" },
      { name: "description", content: "Masuk ke balairung kerajaan dengan akun Google." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") window.location.href = "/";
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const masuk = async () => {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error("Gagal masuk: " + result.error.message);
        setLoading(false);
        return;
      }
      if (result.redirected) return;
      window.location.href = "/";
    } catch (e) {
      toast.error("Gagal masuk: " + (e as Error).message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-cream via-background to-cream">
      <div className="max-w-sm w-full text-center space-y-6">
        <div className="flex justify-center">
          <Crest size={88} />
        </div>
        <div>
          <h1 className="font-display text-4xl tracking-tight">
            <span className="text-empire">JERUK'S</span> EMPIRE
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Balairung digital kelas TI. Masuk dengan akun Google Anda.
          </p>
        </div>
        <Button onClick={masuk} disabled={loading} size="lg" className="w-full gap-2">
          <GoogleIcon /> {loading ? "Membuka gerbang…" : "Masuk dengan Google"}
        </Button>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Hanya bangsawan yang sudah terdaftar oleh Admin yang dapat masuk.
          Jika Anda belum terdaftar, akun akan menanti persetujuan.
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path
        fill="#fff"
        d="M21.35 11.1H12v3.2h5.35c-.23 1.43-1.66 4.2-5.35 4.2-3.22 0-5.85-2.66-5.85-5.94S8.78 6.6 12 6.6c1.83 0 3.06.78 3.77 1.45l2.57-2.47C16.7 4.05 14.55 3.1 12 3.1 7.04 3.1 3 7.14 3 12.12s4.04 9.02 9 9.02c5.2 0 8.64-3.66 8.64-8.81 0-.6-.07-1.05-.29-1.23z"
      />
    </svg>
  );
}
