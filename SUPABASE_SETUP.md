# Supabase Setup Instructions

## ✅ Environment Variables Configured

Your `.env` file has been created with your Supabase credentials:
- **Project URL**: https://omfteqtfgyxftoukjfar.supabase.co
- **Anon Key**: Configured
- **Service Role Key**: Configured

## 📋 Next Steps

### 1. Run Database Schema (REQUIRED)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/omfteqtfgyxftoukjfar
2. Navigate to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Open `supabase/schema.sql` from this project
5. Copy the **entire contents** of the file
6. Paste into the SQL Editor
7. Click **Run** (or press Cmd/Ctrl + Enter)

This will create:
- All database tables (profiles, children, groups, attendance, etc.)
- Row-Level Security (RLS) policies
- Functions and triggers
- Indexes for performance

### 2. (Optional) Add Sample Data

If you want sample data for testing:

1. In SQL Editor, open `supabase/seed.sql`
2. Copy and paste into SQL Editor
3. Click **Run**

This adds:
- Sample groups
- Sample lunch menus

### 3. Create Initial Users

You have two options:

#### Option A: Through Supabase Dashboard

1. Go to **Authentication > Users**
2. Click **Add User**
3. Create users with these emails (or your own):
   - `admin@kindergarten.de`
   - `teacher@kindergarten.de`
   - `parent@kindergarten.de`
   - `kitchen@kindergarten.de`
4. Set passwords for each
5. After creating each user, go to **SQL Editor** and run:

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

#### Option B: Through the App

1. Start the dev server: `npm run dev`
2. Go to http://localhost:3000
3. Click "Sign Up" and create your first account
4. In Supabase SQL Editor, update the role:
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
```
5. Log in as admin
6. Use the admin panel to create other users

### 4. Verify Setup

1. Start development server:
   ```bash
   npm run dev
   ```

2. Open http://localhost:3000

3. You should see:
   - No Supabase connection errors
   - Login page loads
   - Can sign up/login

4. After logging in as admin:
   - Dashboard loads
   - Can navigate to different sections
   - No database errors in console

## 🔍 Troubleshooting

### "Missing supabase url" error
- Check `.env` file exists in project root
- Verify credentials are correct
- Restart dev server after creating `.env`

### "relation does not exist" error
- You haven't run `schema.sql` yet
- Go to SQL Editor and run the schema

### "permission denied" error
- RLS policies might not be set up
- Re-run `schema.sql` to ensure all policies are created

### Can't log in
- Check user exists in Supabase Authentication
- Verify profile role is set correctly
- Check browser console for errors

## ✅ Checklist

- [ ] `.env` file created (✅ Done)
- [ ] Database schema run in Supabase
- [ ] Sample data added (optional)
- [ ] Initial users created
- [ ] User roles set in database
- [ ] Dev server starts without errors
- [ ] Can log in successfully

## 🚀 After Setup

Once everything is working:

1. **Test Features**:
   - Create a child
   - Add staff member
   - Test attendance
   - Send a message
   - Order lunch

2. **Customize**:
   - Update colors in `tailwind.config.js`
   - Add more translations in `locales/`
   - Customize dashboard content

3. **Deploy**:
   - Push to GitHub
   - Deploy to Vercel
   - Add environment variables in Vercel dashboard

## 📞 Need Help?

- Check `FINAL_SETUP_GUIDE.md` for detailed instructions
- Review `SETUP_INSTRUCTIONS.md` for step-by-step guide
- Check Supabase logs in dashboard for errors

---

**Your Supabase project is ready!** Just run the schema and create users. 🎉
