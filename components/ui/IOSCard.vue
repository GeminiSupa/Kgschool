<template>
  <div
      :class="[
      'ios-card',
      elevated ? 'ios-card-elevated' : '',
      blur ? 'ios-card-blur' : '',
      customClass
    ]"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
interface Props {
  elevated?: boolean
  blur?: boolean
  customClass?: string
}

withDefaults(defineProps<Props>(), {
  elevated: true,
  blur: true,
  customClass: ''
})
</script>

<style scoped>
.ios-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.ios-card-elevated {
  box-shadow: 0 20px 60px -12px rgba(0, 0, 0, 0.25),
              0 0 0 1px rgba(255, 255, 255, 0.1);
}

.ios-card-blur {
  background: rgba(255, 255, 255, 0.25);
}

@media (max-width: 768px) {
  .ios-card {
    border-radius: 16px;
    backdrop-filter: blur(16px) saturate(180%);
    -webkit-backdrop-filter: blur(16px) saturate(180%);
  }
}
</style>
