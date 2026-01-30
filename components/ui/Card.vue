<template>
  <div :class="cardClasses">
    <div v-if="title || $slots.header" class="mb-4 pb-4 border-b border-fiori-gray-200">
      <slot name="header">
        <h3 v-if="title" class="text-lg font-semibold text-fiori-gray-900">{{ title }}</h3>
        <p v-if="subtitle" class="mt-1 text-sm text-fiori-gray-600">{{ subtitle }}</p>
      </slot>
    </div>
    <slot />
    <div v-if="$slots.footer" class="mt-4 pt-4 border-t border-fiori-gray-200">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title?: string
  subtitle?: string
  elevated?: boolean
  hover?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  elevated: false,
  hover: true
})

const cardClasses = computed(() => {
  let classes = props.elevated ? 'card-fiori-elevated' : 'card-fiori'
  if (props.hover && !props.elevated) {
    classes += ' hover:shadow-md'
  }
  return classes
})
</script>
