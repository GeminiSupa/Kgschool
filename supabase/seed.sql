-- Seed data for initial setup
-- This creates initial accounts for each role

-- Note: These are example users. In production, you should:
-- 1. Create users through Supabase Auth first
-- 2. Then update their profiles with the correct roles
-- 3. Or use the signup flow with metadata

-- Example: To create an admin user, sign up with email/password
-- Then run: UPDATE profiles SET role = 'admin' WHERE email = 'admin@kindergarten.de';

-- Sample groups
INSERT INTO groups (id, name, age_range, capacity) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Bären Gruppe', 'Ü3', 20),
  ('00000000-0000-0000-0000-000000000002', 'Hasen Gruppe', 'U3', 15),
  ('00000000-0000-0000-0000-000000000003', 'Schmetterlinge Gruppe', 'Ü3', 20)
ON CONFLICT (id) DO NOTHING;

-- Sample lunch menus for the next week
INSERT INTO lunch_menus (date, meal_name, description, allergens, nutritional_info) VALUES
  (CURRENT_DATE, 'Spaghetti Bolognese', 'Klassische Nudeln mit Hackfleischsoße', ARRAY['gluten', 'milk']::TEXT[], '{"calories": 450, "protein": "20g"}'::jsonb),
  (CURRENT_DATE + INTERVAL '1 day', 'Gemüsepfanne mit Reis', 'Frisches Gemüse mit Basmatireis', ARRAY[]::TEXT[], '{"calories": 380, "protein": "12g"}'::jsonb),
  (CURRENT_DATE + INTERVAL '2 days', 'Fischstäbchen mit Kartoffeln', 'Panierte Fischstäbchen mit Kartoffeln', ARRAY['gluten', 'fish']::TEXT[], '{"calories": 420, "protein": "18g"}'::jsonb)
ON CONFLICT (date) DO NOTHING;
