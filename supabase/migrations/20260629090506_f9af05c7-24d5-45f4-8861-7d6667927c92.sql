
-- 1. Extend anggota with new columns
ALTER TABLE public.anggota
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS panggilan text,
  ADD COLUMN IF NOT EXISTS nim text,
  ADD COLUMN IF NOT EXISTS tempat_lahir text,
  ADD COLUMN IF NOT EXISTS tgl_lahir date,
  ADD COLUMN IF NOT EXISTS hobi text,
  ADD COLUMN IF NOT EXISTS motto text,
  ADD COLUMN IF NOT EXISTS urutan int;

CREATE UNIQUE INDEX IF NOT EXISTS anggota_email_unique ON public.anggota (lower(email)) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS anggota_user_id_unique ON public.anggota (user_id) WHERE user_id IS NOT NULL;

-- 2. Add 'manager' to role enum (cannot be USED in same tx, but seeding below uses cast via INSERT after — needs separate enum recreate)
-- Recreate enum to safely use new value within same migration
ALTER TABLE public.anggota ALTER COLUMN role DROP DEFAULT;
ALTER TABLE public.anggota ALTER COLUMN role TYPE text USING role::text;
DROP TYPE IF EXISTS public.anggota_role;
CREATE TYPE public.anggota_role AS ENUM ('manager','yang_mulia','sekretaris','bendahara','bangsawan');
ALTER TABLE public.anggota ALTER COLUMN role TYPE public.anggota_role USING role::public.anggota_role;
ALTER TABLE public.anggota ALTER COLUMN role SET DEFAULT 'bangsawan'::public.anggota_role;

-- 3. Wipe & reseed anggota (children cascade / set null automatically)
DELETE FROM public.anggota;

INSERT INTO public.anggota (urutan, nama, panggilan, role, email, nim, wa, ig, tempat_lahir, tgl_lahir, foto_url, hobi, motto) VALUES
(0, 'Admin Empire', 'Admin', 'manager'::public.anggota_role, 'mastermoneman@gmail.com', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Penjaga balairung digital'),
(1, 'Raihan Satria Wibawa', 'Raihan', 'bangsawan'::public.anggota_role, 'satriaraihan82@gmail.com', '2511011', '081227274819', 'rai_vestero', 'Magelang', '2007-09-27', 'https://drive.google.com/uc?id=1FgmcrqDzAnVi6jXPmamQSpOeqkk5y8Sv', 'Bermain game', 'Hidup untuk menang'),
(2, 'Fatkhul Wahab', 'Wahab', 'bangsawan'::public.anggota_role, 'wahabfatkhul44@gmail.com', '2511026', '085643147', 'fatkhul_w03', 'Magelang', '2005-07-03', 'https://drive.google.com/uc?id=1U5jwXnTcL_X-pe_3KZFNJJilCCQ5yRDw', 'Main game, merawat ikan', 'Tetap semangat pantang menyerah'),
(3, 'Ragil Kurniawan', 'Awan', 'bangsawan'::public.anggota_role, 'awnaidee@gmail.com', '2511019', '087749122420', 'awnaidee', 'Amerika', '2002-02-28', 'https://drive.google.com/uc?id=16WJu_y9TTJ3zOT__k9PdHz95dLChxUX6', 'Hobi ngamok', 'Alon alon rasah kesusu, arek kesusu yo susune sopo'),
(4, 'Muhammad Rasyid', 'Jefferson', 'bangsawan'::public.anggota_role, 'muhammadrasyid6054@gmail.com', '2511001', '085921788183', '18.1.shitt', 'Palembang', '2006-02-24', 'https://drive.google.com/uc?id=1Lqz0hcaQyP9V2XOdHSODwB23TkTXVsSX', 'Berkesenian', 'Hidup yang berarti bukan sekedar tak mati, mati yang berarti mesti yang terakhir kali');

-- 12 tahta kosong
INSERT INTO public.anggota (urutan, nama, role)
SELECT g, 'Tahta Kosong #' || g, 'bangsawan'::public.anggota_role
FROM generate_series(5, 16) g;

-- 4. has_role + is_admin (security definer to avoid recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.anggota_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.anggota WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.anggota WHERE user_id = _user_id AND role IN ('manager','yang_mulia'))
$$;

CREATE OR REPLACE FUNCTION public.current_anggota_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.anggota WHERE user_id = auth.uid() LIMIT 1
$$;

-- 5. pending_akses table
CREATE TABLE IF NOT EXISTS public.pending_akses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  email text NOT NULL,
  nama_google text,
  foto_google text,
  catatan text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pending_akses TO authenticated;
GRANT ALL ON public.pending_akses TO service_role;

ALTER TABLE public.pending_akses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pending: self read" ON public.pending_akses
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "pending: admin manage" ON public.pending_akses
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "pending: self delete" ON public.pending_akses
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- 6. Anggota policy update — authenticated dapat read; manager bisa update; user link diri sendiri via trigger
-- Existing policies are anon-permissive from before; replace
DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT polname FROM pg_policy WHERE polrelid='public.anggota'::regclass LOOP
    EXECUTE format('DROP POLICY %I ON public.anggota', r.polname);
  END LOOP;
END $$;

CREATE POLICY "anggota: authenticated read" ON public.anggota
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "anggota: admin update" ON public.anggota
  FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "anggota: admin insert" ON public.anggota
  FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "anggota: admin delete" ON public.anggota
  FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

REVOKE SELECT ON public.anggota FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.anggota TO authenticated;
GRANT ALL ON public.anggota TO service_role;

-- 7. Trigger handle_new_user — saat user signup, cocokan email atau masuk pending
CREATE OR REPLACE FUNCTION public.handle_new_google_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _email text;
  _matched uuid;
BEGIN
  _email := lower(NEW.email);
  IF _email IS NULL THEN RETURN NEW; END IF;

  UPDATE public.anggota
    SET user_id = NEW.id
    WHERE lower(email) = _email AND user_id IS NULL
    RETURNING id INTO _matched;

  IF _matched IS NULL THEN
    INSERT INTO public.pending_akses (user_id, email, nama_google, foto_google)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
      NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_google_user();
