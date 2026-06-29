
CREATE TABLE public.absen_share (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jadwal_id uuid NOT NULL REFERENCES public.jadwal(id) ON DELETE CASCADE,
  tanggal date NOT NULL,
  link text NOT NULL,
  shared_by uuid REFERENCES public.anggota(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (jadwal_id, tanggal)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.absen_share TO authenticated;
GRANT ALL ON public.absen_share TO service_role;

ALTER TABLE public.absen_share ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Semua bangsawan boleh lihat absen" ON public.absen_share
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Bangsawan boleh share absen" ON public.absen_share
  FOR INSERT TO authenticated WITH CHECK (
    shared_by = public.current_anggota_id()
  );

CREATE POLICY "Admin boleh hapus absen" ON public.absen_share
  FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));
