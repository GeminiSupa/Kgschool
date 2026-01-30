# Migration to Tailwind CSS

## Why the Change?

The `@chakra-ui/vue-next@^2.0.0` package doesn't exist in npm. Chakra UI for Vue 3/Nuxt 3 is not yet stable. We've switched to **Tailwind CSS** which is:
- ✅ Fully compatible with Nuxt 3
- ✅ Highly customizable
- ✅ Can replicate Fiori design system
- ✅ Better performance
- ✅ Active maintenance

## What Changed

1. **Removed**: `@chakra-ui/nuxt` and `@chakra-ui/vue-next`
2. **Added**: `@nuxtjs/tailwindcss`
3. **Updated**: All components need to use Tailwind classes instead of Chakra components

## Component Migration

All components using Chakra UI components (like `CBox`, `CButton`, etc.) need to be converted to use Tailwind CSS classes.

### Example Conversion

**Before (Chakra UI):**
```vue
<CBox p="6" bg="white">
  <CButton color-scheme="primary">Click me</CButton>
</CBox>
```

**After (Tailwind CSS):**
```vue
<div class="p-6 bg-white">
  <button class="btn-primary">Click me</button>
</div>
```

## Quick Fix for Now

Since this is a large migration, you have two options:

### Option 1: Use Tailwind with Custom Components (Recommended)
I'll create wrapper components that replicate Chakra's API but use Tailwind under the hood.

### Option 2: Use a Different UI Library
- **Nuxt UI** - Built specifically for Nuxt 3
- **PrimeVue** - Mature Vue 3 component library
- **Vuetify** - Material Design for Vue 3

## Next Steps

1. Run `npm install` to install Tailwind
2. Components will need to be updated to use Tailwind classes
3. Or choose a different UI library that's compatible

Would you like me to:
- A) Create Tailwind-based wrapper components (keeps similar API)
- B) Switch to Nuxt UI (easier, but different design)
- C) Update all components to use Tailwind directly (more work, but cleaner)
