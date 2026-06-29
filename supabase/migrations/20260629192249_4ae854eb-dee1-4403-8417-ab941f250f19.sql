
-- Storage policies for kenangan bucket (private + signed URLs)
DROP POLICY IF EXISTS "kenangan_auth_read" ON storage.objects;
DROP POLICY IF EXISTS "kenangan_auth_insert" ON storage.objects;
DROP POLICY IF EXISTS "kenangan_auth_delete" ON storage.objects;

CREATE POLICY "kenangan_auth_read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'kenangan');

CREATE POLICY "kenangan_auth_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'kenangan');

CREATE POLICY "kenangan_auth_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'kenangan');
