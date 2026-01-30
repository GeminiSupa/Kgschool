<template>
  <button
    :type="type"
    :disabled="disabled"
    :class="[
      'ios-button',
      variant === 'primary' ? 'ios-button-primary' : '',
      variant === 'secondary' ? 'ios-button-secondary' : '',
      variant === 'ghost' ? 'ios-button-ghost' : '',
      size === 'large' ? 'ios-button-large' : '',
      size === 'small' ? 'ios-button-small' : '',
      disabled ? 'ios-button-disabled' : '',
      customClass
    ]"
    @click="$emit('click', $event)"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'small' | 'medium' | 'large'
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  customClass?: string
}

withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'medium',
  type: 'button',
  disabled: false,
  customClass: ''
})

defineEmits<{
  click: [event: MouseEvent]
}>()
</script>

<style scoped>
.ios-button {
  position: relative;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.ios-button::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: translate(-50%, -50%);
  transition: width 0.3s, height 0.3s;
}

.ios-button:active::before {
  width: 300px;
  height: 300px;
}

.ios-button-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 14px 0 rgba(102, 126, 234, 0.39);
}

.ios-button-primary:hover:not(.ios-button-disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px 0 rgba(102, 126, 234, 0.5);
}

.ios-button-primary:active:not(.ios-button-disabled) {
  transform: translateY(0);
  box-shadow: 0 2px 10px 0 rgba(102, 126, 234, 0.3);
}

.ios-button-secondary {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: #667eea;
  border: 1px solid rgba(102, 126, 234, 0.3);
}

.ios-button-ghost {
  background: transparent;
  color: rgba(255, 255, 255, 0.9);
}

.ios-button-large {
  padding: 16px 32px;
  font-size: 18px;
  border-radius: 16px;
}

.ios-button-medium {
  padding: 12px 24px;
  font-size: 16px;
}

.ios-button-small {
  padding: 8px 16px;
  font-size: 14px;
  border-radius: 10px;
}

.ios-button-disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

@media (max-width: 768px) {
  .ios-button {
    font-size: 15px;
  }
  
  .ios-button-large {
    padding: 14px 28px;
    font-size: 17px;
  }
}
</style>
