-- Add kita_id to lunch_menus for multi-tenancy + fix unique constraint
ALTER TABLE public.lunch_menus
  ADD COLUMN IF NOT EXISTS kita_id UUID REFERENCES public.kitas(id) ON DELETE CASCADE;

ALTER TABLE public.lunch_menus
  DROP CONSTRAINT IF EXISTS lunch_menus_date_key;

ALTER TABLE public.lunch_menus
  DROP CONSTRAINT IF EXISTS lunch_menus_date_kita_id_key;

ALTER TABLE public.lunch_menus
  ADD CONSTRAINT lunch_menus_date_kita_id_key UNIQUE (date, kita_id);

