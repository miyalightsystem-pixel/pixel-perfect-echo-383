import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const uuid = z.string().uuid();

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

// ---------- TITAH ----------
export const createTitah = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        judul: z.string().min(1).max(200),
        isi: z.string().min(1).max(2000),
        pinned: z.boolean().optional(),
        author_id: uuid,
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const sb = await admin();
    const { error } = await sb.from("titah").insert(data);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const togglePinTitah = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ id: uuid, pinned: z.boolean() }).parse(input))
  .handler(async ({ data }) => {
    const sb = await admin();
    const { error } = await sb.from("titah").update({ pinned: data.pinned }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- TUGAS ----------
async function assertManageTugas(sb: Awaited<ReturnType<typeof admin>>, actor_id?: string) {
  if (!actor_id) throw new Error("Aksi memerlukan identitas Bangsawan.");
  const { data: actor } = await sb.from("anggota").select("role").eq("id", actor_id).maybeSingle();
  if (!actor || !["yang_mulia", "sekretaris", "manager"].includes(actor.role)) {
    throw new Error("Hanya Yang Mulia atau Sekretaris yang berhak mengubah titah tugas.");
  }
}

export const createTugas = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        judul: z.string().min(1).max(200),
        matkul: z.string().min(1).max(100),
        deadline: z.string().min(1),
        actor_id: uuid.optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const sb = await admin();
    await assertManageTugas(sb, data.actor_id);
    const { actor_id: _omit, ...row } = data;
    const { error } = await sb.from("tugas").insert(row);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateTugas = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        id: uuid,
        judul: z.string().min(1).max(200),
        matkul: z.string().min(1).max(100),
        deadline: z.string().min(1),
        actor_id: uuid,
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const sb = await admin();
    await assertManageTugas(sb, data.actor_id);
    const { error } = await sb
      .from("tugas")
      .update({ judul: data.judul, matkul: data.matkul, deadline: data.deadline })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteTugas = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ id: uuid, actor_id: uuid }).parse(input))
  .handler(async ({ data }) => {
    const sb = await admin();
    await assertManageTugas(sb, data.actor_id);
    const { error } = await sb.from("tugas").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setTugasStatus = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({
      id: uuid,
      status: z.enum(["belum", "dikerjakan", "selesai"]),
      actor_id: uuid.optional(),
    }).parse(input),
  )
  .handler(async ({ data }) => {
    const sb = await admin();
    const { error } = await sb.from("tugas").update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error(error.message);
    // Track who marked it done (for leaderboard) — anggota personal completion
    if (data.status === "selesai" && data.actor_id) {
      await sb
        .from("tugas_completion")
        .upsert({ tugas_id: data.id, anggota_id: data.actor_id }, { onConflict: "tugas_id,anggota_id" });
    }
    return { ok: true };
  });

export const markPersonalDone = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ tugas_id: uuid, anggota_id: uuid, done: z.boolean() }).parse(input),
  )
  .handler(async ({ data }) => {
    const sb = await admin();
    if (data.done) {
      const { error } = await sb
        .from("tugas_completion")
        .upsert({ tugas_id: data.tugas_id, anggota_id: data.anggota_id }, { onConflict: "tugas_id,anggota_id" });
      if (error) throw new Error(error.message);
    } else {
      const { error } = await sb
        .from("tugas_completion")
        .delete()
        .eq("tugas_id", data.tugas_id)
        .eq("anggota_id", data.anggota_id);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

// ---------- JADWAL ----------
export const createJadwal = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        hari: z.number().int().min(1).max(7),
        jam_mulai: z.string().min(1),
        jam_selesai: z.string().min(1),
        matkul: z.string().min(1).max(100),
        ruangan: z.string().max(50).optional().nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const sb = await admin();
    const { error } = await sb.from("jadwal").insert(data);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteJadwal = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ id: uuid }).parse(input))
  .handler(async ({ data }) => {
    const sb = await admin();
    const { error } = await sb.from("jadwal").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- EVENT AKADEMIK ----------
export const createEvent = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        nama: z.string().min(1).max(100),
        tanggal_mulai: z.string().min(1),
        tanggal_selesai: z.string().optional().nullable(),
        jenis: z.enum(["uts", "uas", "libur", "lainnya"]),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const sb = await admin();
    const { error } = await sb.from("event_akademik").insert(data);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- MATERI ----------
export const createMateri = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        matkul: z.string().min(1).max(100),
        judul: z.string().min(1).max(200),
        link: z.string().url(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const sb = await admin();
    const { error } = await sb.from("materi").insert(data);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- KAS ----------
export const recordPembayaran = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        periode_id: uuid,
        anggota_id: uuid,
        jumlah: z.number().int().min(0),
        status: z.enum(["belum", "lunas"]),
        actor_id: uuid,
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const sb = await admin();
    // verify actor is bendahara/yang_mulia
    const { data: actor } = await sb.from("anggota").select("role").eq("id", data.actor_id).maybeSingle();
    if (!actor || (actor.role !== "yang_mulia" && actor.role !== "manager")) {
      throw new Error("Hanya Admin (Yang Mulia) yang berhak mengubah perbendaharaan.");
    }
    const { error } = await sb.from("kas_pembayaran").upsert(
      {
        periode_id: data.periode_id,
        anggota_id: data.anggota_id,
        status: data.status,
        jumlah: data.status === "lunas" ? data.jumlah : 0,
        tanggal: data.status === "lunas" ? new Date().toISOString() : null,
      },
      { onConflict: "periode_id,anggota_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const recordPengeluaran = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({
      deskripsi: z.string().min(1).max(200),
      jumlah: z.number().int().min(1),
      actor_id: uuid,
    }).parse(input),
  )
  .handler(async ({ data }) => {
    const sb = await admin();
    const { data: actor } = await sb.from("anggota").select("role").eq("id", data.actor_id).maybeSingle();
    if (!actor || (actor.role !== "yang_mulia" && actor.role !== "manager")) {
      throw new Error("Hanya Admin (Yang Mulia) yang berhak mencatat pengeluaran.");
    }
    const { error } = await sb.from("pengeluaran").insert({ deskripsi: data.deskripsi, jumlah: data.jumlah });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const createKasPeriode = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({
      label: z.string().min(1).max(50),
      nominal_per_orang: z.number().int().min(0),
      actor_id: uuid,
    }).parse(input),
  )
  .handler(async ({ data }) => {
    const sb = await admin();
    const { data: actor } = await sb.from("anggota").select("role").eq("id", data.actor_id).maybeSingle();
    if (!actor || (actor.role !== "yang_mulia" && actor.role !== "manager")) {
      throw new Error("Hanya Admin (Yang Mulia) yang berhak membuat periode kas.");
    }
    const { data: periode, error } = await sb
      .from("kas_periode")
      .insert({ label: data.label, nominal_per_orang: data.nominal_per_orang })
      .select()
      .single();
    if (error) throw new Error(error.message);
    // seed semua anggota dengan status belum
    const { data: members } = await sb.from("anggota").select("id");
    if (members?.length) {
      await sb.from("kas_pembayaran").insert(
        members.map((m) => ({
          periode_id: periode.id,
          anggota_id: m.id,
          status: "belum" as const,
          jumlah: 0,
        })),
      );
    }
    return { ok: true, id: periode.id };
  });

// ---------- FOTO ----------
export const createFoto = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        url: z.string().url(),
        caption: z.string().max(200).optional().nullable(),
        uploader_id: uuid.optional().nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const sb = await admin();
    const { error } = await sb.from("foto").insert(data);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- FORUM ----------
export const createForumTopik = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        judul: z.string().min(1).max(200),
        isi: z.string().min(1).max(4000),
        author_id: uuid,
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const sb = await admin();
    const { data: row, error } = await sb.from("forum_topik").insert(data).select().single();
    if (error) throw new Error(error.message);
    return { ok: true, id: row.id };
  });

export const createForumBalasan = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        topik_id: uuid,
        isi: z.string().min(1).max(4000),
        author_id: uuid,
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const sb = await admin();
    const { error } = await sb.from("forum_balasan").insert(data);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- ANGGOTA ----------
export const createAnggota = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        nama: z.string().min(1).max(100),
        foto_url: z.string().url().optional().nullable(),
        role: z.enum(["yang_mulia", "bendahara", "sekretaris", "bangsawan"]),
        ig: z.string().max(50).optional().nullable(),
        wa: z.string().max(30).optional().nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const sb = await admin();
    const { error } = await sb.from("anggota").insert(data);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
