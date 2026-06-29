GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.anggota_role) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.current_anggota_id() TO authenticated, anon;