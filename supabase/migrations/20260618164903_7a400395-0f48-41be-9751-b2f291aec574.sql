
CREATE TYPE public.anggota_role AS ENUM ('yang_mulia','bendahara','sekretaris','bangsawan');
CREATE TYPE public.tugas_status AS ENUM ('belum','dikerjakan','selesai');
CREATE TYPE public.event_jenis AS ENUM ('uts','uas','libur','lainnya');
CREATE TYPE public.kas_status AS ENUM ('belum','lunas');

CREATE TABLE public.anggota (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama text NOT NULL,
  foto_url text,
  role public.anggota_role NOT NULL DEFAULT 'bangsawan',
  ig text,
  wa text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.anggota TO anon, authenticated;
GRANT ALL ON public.anggota TO service_role;
ALTER TABLE public.anggota ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anggota dibaca semua" ON public.anggota FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.titah (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  judul text NOT NULL,
  isi text NOT NULL,
  tanggal timestamptz NOT NULL DEFAULT now(),
  pinned boolean NOT NULL DEFAULT false,
  author_id uuid REFERENCES public.anggota(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.titah TO anon, authenticated;
GRANT ALL ON public.titah TO service_role;
ALTER TABLE public.titah ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Titah dibaca semua" ON public.titah FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.tugas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  judul text NOT NULL,
  matkul text NOT NULL,
  deadline timestamptz NOT NULL,
  status public.tugas_status NOT NULL DEFAULT 'belum',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.tugas TO anon, authenticated;
GRANT ALL ON public.tugas TO service_role;
ALTER TABLE public.tugas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tugas dibaca semua" ON public.tugas FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.tugas_completion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tugas_id uuid NOT NULL REFERENCES public.tugas(id) ON DELETE CASCADE,
  anggota_id uuid NOT NULL REFERENCES public.anggota(id) ON DELETE CASCADE,
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tugas_id, anggota_id)
);
GRANT SELECT ON public.tugas_completion TO anon, authenticated;
GRANT ALL ON public.tugas_completion TO service_role;
ALTER TABLE public.tugas_completion ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Completion dibaca semua" ON public.tugas_completion FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.jadwal (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hari smallint NOT NULL CHECK (hari BETWEEN 1 AND 7),
  jam_mulai text NOT NULL,
  jam_selesai text NOT NULL,
  matkul text NOT NULL,
  ruangan text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.jadwal TO anon, authenticated;
GRANT ALL ON public.jadwal TO service_role;
ALTER TABLE public.jadwal ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Jadwal dibaca semua" ON public.jadwal FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.event_akademik (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama text NOT NULL,
  tanggal_mulai date NOT NULL,
  tanggal_selesai date,
  jenis public.event_jenis NOT NULL DEFAULT 'lainnya',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.event_akademik TO anon, authenticated;
GRANT ALL ON public.event_akademik TO service_role;
ALTER TABLE public.event_akademik ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Event dibaca semua" ON public.event_akademik FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.materi (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  matkul text NOT NULL,
  judul text NOT NULL,
  link text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.materi TO anon, authenticated;
GRANT ALL ON public.materi TO service_role;
ALTER TABLE public.materi ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Materi dibaca semua" ON public.materi FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.kas_periode (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  nominal_per_orang integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.kas_periode TO anon, authenticated;
GRANT ALL ON public.kas_periode TO service_role;
ALTER TABLE public.kas_periode ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Periode kas dibaca semua" ON public.kas_periode FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.kas_pembayaran (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  periode_id uuid NOT NULL REFERENCES public.kas_periode(id) ON DELETE CASCADE,
  anggota_id uuid NOT NULL REFERENCES public.anggota(id) ON DELETE CASCADE,
  status public.kas_status NOT NULL DEFAULT 'belum',
  jumlah integer NOT NULL DEFAULT 0,
  tanggal timestamptz,
  UNIQUE (periode_id, anggota_id)
);
GRANT SELECT ON public.kas_pembayaran TO anon, authenticated;
GRANT ALL ON public.kas_pembayaran TO service_role;
ALTER TABLE public.kas_pembayaran ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pembayaran dibaca semua" ON public.kas_pembayaran FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.pengeluaran (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deskripsi text NOT NULL,
  jumlah integer NOT NULL,
  tanggal timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.pengeluaran TO anon, authenticated;
GRANT ALL ON public.pengeluaran TO service_role;
ALTER TABLE public.pengeluaran ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pengeluaran dibaca semua" ON public.pengeluaran FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.foto (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  caption text,
  tanggal timestamptz NOT NULL DEFAULT now(),
  uploader_id uuid REFERENCES public.anggota(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.foto TO anon, authenticated;
GRANT ALL ON public.foto TO service_role;
ALTER TABLE public.foto ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Foto dibaca semua" ON public.foto FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.forum_topik (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  judul text NOT NULL,
  isi text NOT NULL,
  author_id uuid REFERENCES public.anggota(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.forum_topik TO anon, authenticated;
GRANT ALL ON public.forum_topik TO service_role;
ALTER TABLE public.forum_topik ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Topik dibaca semua" ON public.forum_topik FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.forum_balasan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topik_id uuid NOT NULL REFERENCES public.forum_topik(id) ON DELETE CASCADE,
  author_id uuid REFERENCES public.anggota(id) ON DELETE SET NULL,
  isi text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.forum_balasan TO anon, authenticated;
GRANT ALL ON public.forum_balasan TO service_role;
ALTER TABLE public.forum_balasan ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Balasan dibaca semua" ON public.forum_balasan FOR SELECT TO anon, authenticated USING (true);
