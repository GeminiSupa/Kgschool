<template>
  <component :is="as" :class="headingClasses">
    <slot />
  </component>
</template>

<script setup lang="ts">
interface Props {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
}

const props = withDefaults(defineProps<Props>(), {
  as: 'h2',
  size: 'md'
})

const sizes = {
  xs: 'text-sm font-semibold',
  sm: 'text-base font-semibold',
  md: 'text-lg font-bold',
  lg: 'text-xl font-bold',
  xl: 'text-2xl font-bold',
  '2xl': 'text-3xl font-bold'
}

const headingClasses = computed(() => {
  return `${sizes[props.size]} text-gray-900`
})
</script>
