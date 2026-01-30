# Port Configuration Guide

## 🔌 Current Port Setup

By default, Nuxt runs on port **3000**. If your server is running on port **3001**, it might be because:
1. Port 3000 was already in use
2. You manually configured a different port
3. Another Nuxt app is running on 3000

## 🚀 Access Your App

### If Running on Port 3001:
- **Local**: http://localhost:3001
- **Network**: Check terminal output for network URL

### If Running on Port 3000:
- **Local**: http://localhost:3000
- **Network**: Check terminal output for network URL

## ⚙️ Configure Port Manually

### Option 1: Command Line

```bash
npm run dev -- --port 3001
```

Or set in `package.json`:

```json
{
  "scripts": {
    "dev": "nuxt dev --port 3001"
  }
}
```

### Option 2: Environment Variable

Add to `.env`:

```env
PORT=3001
```

Or run:

```bash
PORT=3001 npm run dev
```

### Option 3: nuxt.config.ts

```typescript
export default defineNuxtConfig({
  devServer: {
    port: 3001
  }
})
```

## 🔍 Check What's Running

Check which ports are in use:

```bash
# Mac/Linux
lsof -ti:3000,3001

# Or check running processes
ps aux | grep nuxt
```

## ✅ Quick Access

Just open in your browser:
- http://localhost:3001/ (if on 3001)
- http://localhost:3000/ (if on 3000)

The exact URL is shown in your terminal when you run `npm run dev`:
```
➜ Local:    http://localhost:3001/
```

## 🎯 Status

- ✅ App should be accessible at the port shown in terminal
- ✅ Database is configured
- ✅ Environment variables are set
- ✅ Ready to test!

---

**Just open the URL shown in your terminal!** 🚀
