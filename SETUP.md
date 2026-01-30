# Setup Instructions

## Initial Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Up Supabase**
   - Create a new project at https://supabase.com
   - Go to SQL Editor
   - Run the SQL from `supabase/schema.sql`
   - (Optional) Run `supabase/seed.sql` for sample data

3. **Configure Environment Variables**
   - Copy `.env.example` to `.env`
   - Add your Supabase credentials:
     ```
     SUPABASE_URL=your_project_url
     SUPABASE_ANON_KEY=your_anon_key
     SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
     ```

4. **Create Initial Users**

   You need to create one user for each role. Here's how:

   **Option 1: Through Supabase Dashboard**
   1. Go to Authentication > Users > Add User
   2. Create users with these emails (or your own):
      - admin@kindergarten.de
      - teacher@kindergarten.de
      - parent@kindergarten.de
      - kitchen@kindergarten.de
   3. Note the UUID of each user
   4. Go to SQL Editor and run:
      ```sql
      UPDATE profiles SET role = 'admin' WHERE email = 'admin@kindergarten.de';
      UPDATE profiles SET role = 'teacher' WHERE email = 'teacher@kindergarten.de';
      UPDATE profiles SET role = 'parent' WHERE email = 'parent@kindergarten.de';
      UPDATE profiles SET role = 'kitchen' WHERE email = 'kitchen@kindergarten.de';
      ```

   **Option 2: Through the App (Admin Only)**
   1. Sign up with the first account
   2. Manually update the profile role in Supabase to 'admin'
   3. Log in as admin
   4. Use the "Add Staff" feature to create other users

5. **Start Development Server**
   ```bash
   npm run dev
   ```

6. **Access the App**
   - Open http://localhost:3000
   - Log in with one of the created accounts

## Deployment to Vercel

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin your-repo-url
   git push -u origin main
   ```

2. **Deploy on Vercel**
   - Go to https://vercel.com
   - Import your GitHub repository
   - Add environment variables:
     - `SUPABASE_URL`
     - `SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY` (optional, for server-side operations)
   - Deploy

3. **Update Supabase Settings**
   - Go to Supabase Dashboard > Settings > API
   - Add your Vercel domain to allowed redirect URLs
   - Add your Vercel domain to allowed CORS origins

## Post-Deployment

1. **Test All Roles**
   - Log in as each role type
   - Verify permissions work correctly
   - Test key features

2. **Configure Email (Optional)**
   - Set up email templates in Supabase
   - Configure SMTP settings for email notifications

3. **Set Up Storage Buckets**
   - Create buckets for:
     - Child photos
     - Activity photos
     - Documents
   - Configure RLS policies for each bucket

## Troubleshooting

### Common Issues

1. **Authentication not working**
   - Check Supabase URL and keys in `.env`
   - Verify redirect URLs in Supabase settings
   - Check browser console for errors

2. **RLS policies blocking access**
   - Verify user has correct role in `profiles` table
   - Check RLS policies in Supabase dashboard
   - Test queries in Supabase SQL editor

3. **Build errors**
   - Run `npm install` again
   - Clear `.nuxt` folder and rebuild
   - Check Node.js version (requires 18+)

4. **PWA not working**
   - Ensure HTTPS is enabled (required for PWA)
   - Check service worker registration in browser DevTools
   - Verify manifest.json is accessible

## Next Steps

- Customize the theme colors in `chakra.config.ts`
- Add more translations in `i18n.config.ts`
- Configure email notifications
- Set up backup procedures
- Add monitoring and error tracking (e.g., Sentry)
