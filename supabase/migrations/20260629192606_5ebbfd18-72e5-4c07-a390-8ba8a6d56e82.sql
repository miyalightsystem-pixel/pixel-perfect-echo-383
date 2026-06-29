DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='kenangan_read_auth') THEN
    CREATE POLICY "kenangan_read_auth" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'kenangan');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='kenangan_insert_auth') THEN
    CREATE POLICY "kenangan_insert_auth" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'kenangan');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='kenangan_delete_auth') THEN
    CREATE POLICY "kenangan_delete_auth" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'kenangan' AND owner = auth.uid());
  END IF;
END $$;