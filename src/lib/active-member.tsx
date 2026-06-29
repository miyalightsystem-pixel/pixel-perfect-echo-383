import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Anggota = Database["public"]["Tables"]["anggota"]["Row"];

interface ActiveMemberCtx {
  userId: string | null;
  email: string | null;
  member: Anggota | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const Ctx = createContext<ActiveMemberCtx | null>(null);

export function ActiveMemberProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const qc = useQueryClient();

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setUserId(data.session?.user?.id ?? null);
      setEmail(data.session?.user?.email ?? null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      setUserId(session?.user?.id ?? null);
      setEmail(session?.user?.email ?? null);
      if (event !== "SIGNED_OUT") qc.invalidateQueries();
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [qc]);

  const { data: member } = useQuery({
    queryKey: ["anggota", "self", userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("anggota")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
  };

  return (
    <Ctx.Provider value={{ userId, email, member: member ?? null, loading, signOut }}>
      {children}
    </Ctx.Provider>
  );
}

export function useActiveMember() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useActiveMember must be inside ActiveMemberProvider");
  return ctx;
}

export function isAdmin(role?: Anggota["role"] | null) {
  return role === "manager" || role === "yang_mulia";
}
export function canManageKas(role?: Anggota["role"] | null) {
  return role === "yang_mulia" || role === "manager";
}
export function canManageJadwal(role?: Anggota["role"] | null) {
  return role === "yang_mulia" || role === "sekretaris" || role === "manager";
}
export function canManageTugas(role?: Anggota["role"] | null) {
  return role === "yang_mulia" || role === "sekretaris" || role === "manager";
}
export function canManageMembers(role?: Anggota["role"] | null) {
  return role === "yang_mulia" || role === "sekretaris" || role === "manager";
}
