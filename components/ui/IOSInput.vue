<template>
  <div class="ios-input-wrapper">
    <label v-if="label" :for="id" class="ios-input-label">
      {{ label }}
    </label>
    <div class="ios-input-container">
      <input
        :id="id"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :required="required"
        :disabled="disabled"
        :class="['ios-input', error ? 'ios-input-error' : '', customClass]"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        @focus="$emit('focus', $event)"
        @blur="$emit('blur', $event)"
      />
      <div v-if="error" class="ios-input-error-message">{{ error }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  id?: string
  label?: string
  type?: string
  modelValue: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  error?: string
  customClass?: string
}

withDefaults(defineProps<Props>(), {
  id: undefined,
  label: undefined,
  type: 'text',
  placeholder: '',
  required: false,
  disabled: false,
  error: undefined,
  customClass: ''
})

defineEmits<{
  'update:modelValue': [value: string]
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
}>()
</script>

<style scoped>
.ios-input-wrapper {
  width: 100%;
}

.ios-input-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #1d1d1f;
  margin-bottom: 8px;
  letter-spacing: 0.3px;
}

.ios-input-container {
  position: relative;
}

.ios-input {
  width: 100%;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  color: #1d1d1f;
  font-size: 16px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  outline: none;
  -webkit-appearance: none;
}

.ios-input::placeholder {
  color: rgba(0, 0, 0, 0.4);
}

.ios-input:focus {
  background: rgba(255, 255, 255, 1);
  border-color: rgba(102, 126, 234, 0.5);
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.2);
  transform: scale(1.01);
}

.ios-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ios-input-error {
  border-color: rgba(255, 59, 48, 0.6);
  background: rgba(255, 59, 48, 0.1);
}

.ios-input-error-message {
  margin-top: 6px;
  font-size: 13px;
  color: #ff3b30;
  font-weight: 500;
}

@media (max-width: 768px) {
  .ios-input {
    padding: 12px 14px;
    font-size: 16px; /* Prevents zoom on iOS */
    border-radius: 10px;
  }
  
  .ios-input-label {
    font-size: 13px;
  }
}
</style>
