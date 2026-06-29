
ALTER TABLE public.absen_share
  ADD COLUMN IF NOT EXISTS expires_at timestamptz NOT NULL DEFAULT (now() + interval '15 minutes');

CREATE INDEX IF NOT EXISTS absen_share_lookup_idx ON public.absen_share (jadwal_id, tanggal, expires_at);

DROP POLICY IF EXISTS "Bangsawan boleh replace absen kadaluarsa" ON public.absen_share;
CREATE POLICY "Bangsawan boleh replace absen kadaluarsa"
  ON public.absen_share FOR UPDATE
  TO authenticated
  USING (expires_at <= now())
  WITH CHECK (shared_by = current_anggota_id());

CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
  PERFORM cron.unschedule('absen-share-weekly-reset');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'absen-share-weekly-reset',
  '5 0 * * 1',
  $$DELETE FROM public.absen_share WHERE created_at < now() - interval '7 days';$$
);
