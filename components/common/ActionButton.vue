<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="buttonClasses"
    @click="handleClick"
  >
    <span v-if="loading" class="inline-block animate-spin mr-2">⟳</span>
    <span v-if="icon && !loading" class="mr-2">{{ icon }}</span>
    <slot />
  </button>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning'
  size?: 'sm' | 'md' | 'lg'
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  loading?: boolean
  icon?: string
  confirm?: boolean
  confirmMessage?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
  disabled: false,
  loading: false,
  confirm: false,
  confirmMessage: 'Are you sure?'
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const buttonClasses = computed(() => {
  const base = 'inline-flex items-center justify-center font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
    warning: 'bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500'
  }
  
  const sizes = {
    sm: 'px-3 py-1.5 text-xs min-h-[2rem]',
    md: 'px-4 py-2 text-sm min-h-[2.5rem]',
    lg: 'px-6 py-3 text-base min-h-[3rem]'
  }
  
  return `${base} ${variants[props.variant]} ${sizes[props.size]}`
})

const handleClick = (event: MouseEvent) => {
  if (props.confirm && !confirm(props.confirmMessage)) {
    return
  }
  emit('click', event)
}
</script>
