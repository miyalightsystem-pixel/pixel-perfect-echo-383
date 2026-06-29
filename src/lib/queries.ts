import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Pending = Database["public"]["Tables"]["pending_akses"]["Row"];

export const pendingAksesListQuery = queryOptions({
  queryKey: ["pending_akses", "list"],
  queryFn: async (): Promise<Pending[]> => {
    const { data, error } = await supabase
      .from("pending_akses")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
});

export const anggotaListQuery = queryOptions({
  queryKey: ["anggota", "list"],
  queryFn: async () => {
    const { data, error } = await supabase.from("anggota").select("*").order("role").order("nama");
    if (error) throw error;
    return data ?? [];
  },
});

export const titahListQuery = queryOptions({
  queryKey: ["titah", "list"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("titah")
      .select("*, author:anggota!titah_author_id_fkey(nama)")
      .order("pinned", { ascending: false })
      .order("tanggal", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
});

export const tugasListQuery = queryOptions({
  queryKey: ["tugas", "list"],
  queryFn: async () => {
    const { data, error } = await supabase.from("tugas").select("*").order("deadline");
    if (error) throw error;
    return data ?? [];
  },
});

export const completionListQuery = queryOptions({
  queryKey: ["tugas_completion", "list"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("tugas_completion")
      .select("*, tugas:tugas(deadline), anggota:anggota(nama)");
    if (error) throw error;
    return data ?? [];
  },
});

export const jadwalListQuery = queryOptions({
  queryKey: ["jadwal", "list"],
  queryFn: async () => {
    const { data, error } = await supabase.from("jadwal").select("*").order("hari").order("jam_mulai");
    if (error) throw error;
    return data ?? [];
  },
});

export const absenShareListQuery = queryOptions({
  queryKey: ["absen_share", "list"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("absen_share")
      .select("*, anggota:shared_by(nama, panggilan, foto_url), jadwal:jadwal_id(matkul, dosen, ruangan, hari, jam_mulai)")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return data ?? [];
  },
});

export const eventListQuery = queryOptions({
  queryKey: ["event_akademik", "list"],
  queryFn: async () => {
    const { data, error } = await supabase.from("event_akademik").select("*").order("tanggal_mulai");
    if (error) throw error;
    return data ?? [];
  },
});

export const materiListQuery = queryOptions({
  queryKey: ["materi", "list"],
  queryFn: async () => {
    const { data, error } = await supabase.from("materi").select("*").order("matkul").order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
});

export const kasPeriodeListQuery = queryOptions({
  queryKey: ["kas_periode", "list"],
  queryFn: async () => {
    const { data, error } = await supabase.from("kas_periode").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
});

export const kasPembayaranListQuery = queryOptions({
  queryKey: ["kas_pembayaran", "list"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("kas_pembayaran")
      .select("*, anggota:anggota(nama, role)")
      .order("anggota(nama)");
    if (error) throw error;
    return data ?? [];
  },
});

export const pengeluaranListQuery = queryOptions({
  queryKey: ["pengeluaran", "list"],
  queryFn: async () => {
    const { data, error } = await supabase.from("pengeluaran").select("*").order("tanggal", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
});

export const fotoListQuery = queryOptions({
  queryKey: ["foto", "list"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("foto")
      .select("*, uploader:anggota(nama)")
      .order("tanggal", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
});

export const forumTopikListQuery = queryOptions({
  queryKey: ["forum_topik", "list"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("forum_topik")
      .select("*, author:anggota(nama), balasan:forum_balasan(count)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
});

export const forumTopikDetailQuery = (id: string) =>
  queryOptions({
    queryKey: ["forum_topik", id],
    queryFn: async () => {
      const [topik, balasan] = await Promise.all([
        supabase.from("forum_topik").select("*, author:anggota(nama)").eq("id", id).maybeSingle(),
        supabase
          .from("forum_balasan")
          .select("*, author:anggota(nama)")
          .eq("topik_id", id)
          .order("created_at"),
      ]);
      if (topik.error) throw topik.error;
      if (balasan.error) throw balasan.error;
      return { topik: topik.data, balasan: balasan.data ?? [] };
    },
  });
