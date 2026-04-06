-- =============================================================================
-- Wipe ALL application data in `public` (dev / staging only)
-- =============================================================================
-- Run in Supabase Dashboard → SQL Editor (as postgres / service role).
--
-- What this does:
--   • Removes trigger on auth.users that calls public.handle_new_user (if present)
--   • DROP SCHEMA public CASCADE — deletes every table, function, policy, type
--     in public (profiles, children, kitas, etc.)
--   • Recreates empty `public` with Supabase-typical grants
--
-- What this does NOT do:
--   • Does NOT delete rows in auth.users (logins still exist; profiles are gone).
--     To remove users: Dashboard → Authentication → Users, or use Admin API.
--   • Does NOT empty Storage buckets (avatars, documents). Clear in Dashboard
--     if you need a full wipe.
--
-- After this succeeds, run `supabase/schema-full.sql` ONCE.
-- =============================================================================

-- Trigger from schema.sql points at public.handle_new_user; drop before nuking public.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

DROP SCHEMA IF EXISTS public CASCADE;

CREATE SCHEMA public;

GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres, anon, authenticated, service_role;

-- Extensions live outside public; schema-full.sql will run CREATE EXTENSION IF NOT EXISTS again.
