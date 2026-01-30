# Setup Instructions - Step by Step

## ⚠️ Important: Fix npm Permissions First

You need to fix npm cache permissions before installing. Run this in your terminal:

```bash
sudo chown -R 501:20 "/Users/apple/.npm"
```

You'll be prompted for your password. This is a one-time fix.

## Step 1: Fix npm Permissions

```bash
sudo chown -R 501:20 "/Users/apple/.npm"
```

## Step 2: Install Dependencies

```bash
cd "/Users/apple/Desktop/KG School"
npm install
```

## Step 3: Set Up Supabase

1. Go to https://supabase.com and create a new project
2. In your Supabase dashboard, go to **SQL Editor**
3. Copy the entire content of `supabase/schema.sql`
4. Paste and run it in the SQL Editor
5. (Optional) Run `supabase/seed.sql` for sample data

## Step 4: Configure Environment Variables

Create a `.env` file in the project root:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

You can find these in Supabase Dashboard > Settings > API

## Step 5: Create Initial Users

### Option A: Through Supabase Dashboard

1. Go to **Authentication > Users > Add User**
2. Create users with these emails (or your own):
   - `admin@kindergarten.de`
   - `teacher@kindergarten.de`
   - `parent@kindergarten.de`
   - `kitchen@kindergarten.de`
3. Set passwords for each
4. After creating each user, go to **SQL Editor** and run:

```sql
-- For admin
UPDATE profiles SET role = 'admin', full_name = 'Admin User' 
WHERE email = 'admin@kindergarten.de';

-- For teacher
UPDATE profiles SET role = 'teacher', full_name = 'Teacher User' 
WHERE email = 'teacher@kindergarten.de';

-- For parent
UPDATE profiles SET role = 'parent', full_name = 'Parent User' 
WHERE email = 'parent@kindergarten.de';

-- For kitchen
UPDATE profiles SET role = 'kitchen', full_name = 'Kitchen Staff' 
WHERE email = 'kitchen@kindergarten.de';
```

### Option B: Through the App

1. Sign up with your first account
2. Manually update the role in Supabase SQL Editor to 'admin'
3. Log in as admin
4. Use "Add Staff" feature to create other users

## Step 6: Start Development Server

```bash
npm run dev
```

The app will be available at http://localhost:3000

## Step 7: Test the Application

1. Log in with one of the created accounts
2. Test different role dashboards
3. Try creating a child
4. Test attendance features
5. Test messaging
6. Test on mobile device

## Troubleshooting

### npm install fails with permission errors
- Run: `sudo chown -R 501:20 "/Users/apple/.npm"`
- Or use a different npm cache location (see FIX_NPM_PERMISSIONS.md)

### Database connection errors
- Check `.env` file has correct Supabase credentials
- Verify Supabase project is active
- Check Supabase dashboard for any errors

### Build errors
- Run `npm install` again
- Delete `node_modules` and `.nuxt` folders
- Run `npm install` again
- Check Node.js version (needs 18+)

### i18n errors
- The app will work without i18n if there are issues
- Translations are in `locales/` folder
- Can be disabled in `nuxt.config.ts` if needed

## Next Steps After Setup

1. Customize colors in `tailwind.config.js`
2. Add more translations in `locales/` folder
3. Configure email notifications in Supabase
4. Set up storage buckets for file uploads
5. Deploy to Vercel

## Deployment to Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables (same as `.env`)
4. Deploy!

For detailed deployment instructions, see `SETUP.md`
