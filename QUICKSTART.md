# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Supabase

1. Go to https://supabase.com and create a new project
2. Copy your project URL and anon key
3. Create `.env` file:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### 3. Set Up Database

1. In Supabase Dashboard, go to SQL Editor
2. Copy and paste the entire content of `supabase/schema.sql`
3. Click "Run" to execute
4. (Optional) Run `supabase/seed.sql` for sample data

### 4. Create Your First Admin User

**Option A: Through Supabase Dashboard**
1. Go to Authentication > Users > Add User
2. Enter email: `admin@kindergarten.de`
3. Enter password (save it!)
4. After creation, go to SQL Editor and run:
```sql
UPDATE profiles SET role = 'admin', full_name = 'Admin User' 
WHERE email = 'admin@kindergarten.de';
```

**Option B: Through App Signup**
1. Start the app: `npm run dev`
2. Go to http://localhost:3000/login
3. Click "Sign up" (if available) or create account
4. Update role in Supabase SQL Editor as above

### 5. Start Development Server
```bash
npm run dev
```

### 6. Log In
- Go to http://localhost:3000
- Log in with your admin credentials
- You should see the admin dashboard!

## 🎯 Create More Users

Once logged in as admin:
1. Go to "Staff" in the sidebar
2. Click "Add Staff"
3. Fill in the form and create users for:
   - Teacher
   - Parent
   - Kitchen staff

Or create them directly in Supabase Auth and update their profiles.

## 📱 Test on Mobile

1. Start the dev server
2. Find your local IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
3. Access from mobile: `http://YOUR_IP:3000`
4. The app is mobile-responsive!

## 🚢 Deploy to Vercel

1. Push to GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin YOUR_REPO_URL
git push -u origin main
```

2. Go to https://vercel.com
3. Import your GitHub repository
4. Add environment variables (same as `.env`)
5. Deploy!

## ✅ Verify Everything Works

- [ ] Can log in as admin
- [ ] Can see admin dashboard
- [ ] Can create a child
- [ ] Can view children list
- [ ] Can create staff members
- [ ] Can access different role dashboards
- [ ] Mobile navigation works
- [ ] Notifications appear

## 🆘 Troubleshooting

**Can't log in?**
- Check Supabase URL and keys in `.env`
- Verify user exists in Supabase Auth
- Check browser console for errors

**Database errors?**
- Make sure you ran `schema.sql` completely
- Check RLS policies are enabled
- Verify user role in `profiles` table

**Build errors?**
- Run `npm install` again
- Delete `node_modules` and `.nuxt` folder
- Reinstall: `npm install`

## 📚 More Help

- See `SETUP.md` for detailed instructions
- See `README.md` for project overview
- See `IMPLEMENTATION_SUMMARY.md` for feature list

Happy coding! 🎉
