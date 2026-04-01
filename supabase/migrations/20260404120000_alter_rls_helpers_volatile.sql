-- PostgreSQL 0A000: SET LOCAL is not allowed in STABLE/IMMUTABLE functions.
-- Helpers that use SET row_security = off / SET LOCAL must be VOLATILE.

ALTER FUNCTION public.is_admin() VOLATILE;
ALTER FUNCTION public.is_teacher() VOLATILE;
ALTER FUNCTION public.is_admin_or_teacher() VOLATILE;
ALTER FUNCTION public.is_kitchen() VOLATILE;
ALTER FUNCTION public.is_support() VOLATILE;

ALTER FUNCTION public.get_user_kita_id() VOLATILE;

ALTER FUNCTION public.get_user_role() VOLATILE;
ALTER FUNCTION public.get_user_kita_id(uuid) VOLATILE;
ALTER FUNCTION public.user_belongs_to_kita(uuid, uuid) VOLATILE;

ALTER FUNCTION public.get_my_profile_hydration() VOLATILE;

ALTER FUNCTION public.parent_has_child_in_group(uuid) VOLATILE;
ALTER FUNCTION public.group_educator_is_me(uuid) VOLATILE;
