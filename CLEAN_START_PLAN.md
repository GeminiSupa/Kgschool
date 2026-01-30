# 🚀 Clean Start Plan

## ✅ **KEEP** (Essential Files)
- `.env` - Supabase credentials
- `supabase/` - Database schema files
- `package.json` - Dependencies (but remove i18n)
- `tailwind.config.js` - Tailwind config
- `vercel.json` - Vercel deployment config
- `tsconfig.json` - TypeScript config

## ❌ **REMOVE** (Start Fresh)
- `components/` - All components (start fresh)
- `pages/` - All pages (start fresh)
- `layouts/` - All layouts (start fresh)
- `locales/` - i18n translation files
- `i18n.config.ts` - i18n config
- All `.md` documentation files
- `plugins/` - Recreate simple ones
- `stores/` - Recreate simple ones
- `composables/` - Recreate simple ones

## 📦 **NEW CLEAN SETUP**

### 1. Remove i18n
- Remove `@nuxtjs/i18n` from `package.json`
- Remove i18n config from `nuxt.config.ts`
- **Why:** Add later when needed - it's easy to add with one command

### 2. Minimal Modules
- `@nuxtjs/supabase` ✅
- `@pinia/nuxt` ✅
- `@nuxtjs/tailwindcss` ✅
- `@vite-pwa/nuxt` ✅ (optional, can remove)
- `@vueuse/nuxt` ✅

### 3. Simple Structure
```
/
├── .env (keep)
├── supabase/ (keep)
├── app.vue (minimal)
├── pages/
│   └── index.vue (simple welcome)
├── components/ (empty, add as needed)
└── nuxt.config.ts (clean, no i18n)
```

### 4. Benefits
- ✅ No i18n errors
- ✅ Clean, working app
- ✅ Easy to add German later (just install @nuxtjs/i18n)
- ✅ Less complexity = fewer errors
- ✅ Faster development

### 5. Adding i18n Later
When you need German:
```bash
npm install @nuxtjs/i18n
```
Then add config - takes 5 minutes!

## 🎯 **Action Plan**

1. Remove i18n from package.json
2. Clean nuxt.config.ts (remove i18n)
3. Delete all components/pages/layouts
4. Create minimal app.vue and index.vue
5. Test - should work perfectly!

---

**Ready to proceed?** ✅
