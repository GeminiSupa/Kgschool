# Kindergarten Management System

A clean, minimal kindergarten management platform built with Nuxt 3, TypeScript, and Supabase.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Ensure your `.env` file has:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_PUBLISHABLE_KEY=your_anon_key
```

### 3. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

## 📦 Tech Stack

- **Nuxt 3** - Vue.js framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Supabase** - Backend (Auth, Database, Storage)
- **Pinia** - State management
- **VueUse** - Vue composition utilities
- **PWA** - Progressive Web App support

## 📁 Project Structure

```
/
├── .env                  # Environment variables (keep secure!)
├── supabase/            # Database schema files
├── pages/               # File-based routing
│   ├── index.vue        # Welcome page
│   └── login.vue        # Login page
├── app.vue              # Root component
└── nuxt.config.ts       # Nuxt configuration
```

## 🎯 Current Status

✅ **Clean Setup Complete**
- Minimal working app
- Supabase integration ready
- Tailwind CSS configured
- No i18n (can add later)

## 🔮 Future Features

- Add dashboard pages
- Child management
- Attendance tracking
- Messaging system
- Lunch ordering
- And more!

## 📝 Adding i18n Later

When you need German/other languages:

```bash
npm install @nuxtjs/i18n
```

Then add i18n config to `nuxt.config.ts` - takes 5 minutes!

## 🚀 Deployment to Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables from `.env`
4. Deploy!

---

**Clean, simple, and ready to build!** 🎉
