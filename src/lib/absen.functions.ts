import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const uuid = z.string().uuid();

// Bagikan link absen QR untuk satu sesi (jadwal + tanggal).
// "Siapa cepat dia dapat" — gagal kalau sudah ada yang share lebih dulu.
export const shareAbsenLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        jadwal_id: uuid,
        tanggal: z.string().min(1), // YYYY-MM-DD
        link: z.string().url().max(500),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    // Cari anggota id dari user yang login
    const { data: anggota } = await context.supabase
      .from("anggota")
      .select("id")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!anggota) throw new Error("Anggota tidak ditemukan.");

    const { error } = await context.supabase.from("absen_share").insert({
      jadwal_id: data.jadwal_id,
      tanggal: data.tanggal,
      link: data.link,
      shared_by: anggota.id,
    });
    if (error) {
      if (error.code === "23505") {
        throw new Error("Yah, ada yang sudah duluan share link absen sesi ini!");
      }
      throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteAbsenShare = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: uuid }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("absen_share").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
