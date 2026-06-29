INSERT INTO public.anggota (email, nama, role)
VALUES ('mastermoneman@gmail.com', 'Admin', 'yang_mulia')
ON CONFLICT DO NOTHING;

-- Kalau user sudah pernah login Google dan masuk pending_akses, kaitkan sekarang
UPDATE public.anggota a
SET user_id = p.user_id
FROM public.pending_akses p
WHERE lower(a.email) = lower(p.email)
  AND a.user_id IS NULL;

DELETE FROM public.pending_akses p
USING public.anggota a
WHERE a.user_id = p.user_id;