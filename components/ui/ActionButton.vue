<template>
  <button
    :type="type"
    :disabled="disabled"
    :class="[
      'inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-1',
      variantClasses,
      disabled && 'opacity-50 cursor-not-allowed'
    ]"
    @click="$emit('click', $event)"
  >
    <span v-if="icon" class="text-base">{{ icon }}</span>
    <span v-if="$slots.default"><slot /></span>
  </button>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'view' | 'edit' | 'delete' | 'primary' | 'secondary' | 'danger'
  icon?: string
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  type: 'button',
  disabled: false
})

defineEmits<{
  click: [event: MouseEvent]
}>()

const variantClasses = computed(() => {
  const variants = {
    view: 'bg-blue-50 text-blue-700 hover:bg-blue-100 focus:ring-blue-500',
    edit: 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 focus:ring-yellow-500',
    delete: 'bg-red-50 text-red-700 hover:bg-red-100 focus:ring-red-500',
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
  }
  return variants[props.variant]
})
</script>
