
DROP POLICY IF EXISTS "Hapus absen kadaluarsa" ON public.absen_share;
CREATE POLICY "Hapus absen kadaluarsa"
  ON public.absen_share FOR DELETE
  TO authenticated
  USING (expires_at <= now());
