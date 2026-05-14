<template>
  <form class="create-form" @submit.prevent="submit">
    <div class="field-group">
      <div class="field">
        <label class="field-label">Ссылка для сокращения</label>
        <input
          v-model="url"
          type="url"
          placeholder="https://example.com/very/long/url"
          class="input"
          :disabled="loading"
          autofocus
          required
        />
      </div>
      <div class="field">
        <label class="field-label">
          Своё название
          <span class="field-hint">необязательно</span>
          <span v-if="alias.length > 0" class="field-counter" :class="{ 'field-counter--warn': alias.length >= 45 }">
            {{ alias.length }}/50
          </span>
        </label>
        <div class="alias-wrap" :class="{ focused: aliasFocused }">
          <span class="alias-prefix">{{ shortBase }}/r/</span>
          <input
            v-model="alias"
            type="text"
            placeholder="my-link"
            class="input alias-input"
            :disabled="loading"
            maxlength="50"
            @input="alias = alias.replace(/[^a-zA-Z0-9\-_]/g, '')"
            @focus="aliasFocused = true"
            @blur="aliasFocused = false"
          />
        </div>
      </div>
    </div>

    <div class="field">
      <label class="field-label">Срок действия</label>
      <div class="expiry-group">
        <button
          v-for="opt in expiryOptions"
          :key="opt.label"
          type="button"
          class="expiry-btn"
          :class="{ active: selectedExpiry === opt.days }"
          @click="selectedExpiry = opt.days"
        >{{ opt.label }}</button>
      </div>
    </div>

    <Transition name="error-fade">
      <p v-if="error" class="error-msg">{{ error }}</p>
    </Transition>
    <button type="submit" class="btn-primary" :disabled="loading">
      <span v-if="loading" class="spinner" />
      {{ loading ? 'Создаём...' : 'Сократить ссылку' }}
    </button>
  </form>
</template>

<script setup>
import { ref } from 'vue';
import { createLink } from '../api.js';

const emit = defineEmits(['created']);

const url = ref('');
const alias = ref('');
const loading = ref(false);
const error = ref('');
const aliasFocused = ref(false);
const selectedExpiry = ref(3);

const shortBase = window.location.origin;

const expiryOptions = [
  { label: '1 день',   days: 1 },
  { label: '3 дня',    days: 3 },
  { label: '7 дней',   days: 7 },
  { label: '14 дней',  days: 14 },
  { label: 'Навсегда', days: null },
];

async function submit() {
  error.value = '';
  loading.value = true;
  try {
    const link = await createLink(url.value, alias.value, selectedExpiry.value);
    emit('created', link);
    url.value = '';
    alias.value = '';
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.create-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.field-label {
  font-size: 11px;
  font-weight: 500;
  color: var(--muted-foreground);
  display: flex;
  align-items: center;
  gap: 6px;
}

.field-hint {
  font-weight: 400;
  opacity: 0.7;
}

.field-counter {
  margin-left: auto;
  font-weight: 400;
  font-variant-numeric: tabular-nums;
  opacity: 0.5;
  transition: color 0.15s, opacity 0.15s;
}

.field-counter--warn {
  color: var(--danger);
  opacity: 1;
}

.input {
  width: 100%;
  background: var(--input-bg);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 8px 12px;
  font-size: 14px;
  color: var(--foreground);
  outline: none;
  transition: border-color 0.15s;
}

.input::placeholder {
  color: var(--muted-foreground);
  opacity: 0.6;
}

.input:focus {
  border-color: var(--accent);
}

.input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.alias-wrap {
  display: flex;
  align-items: center;
  background: var(--input-bg);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  transition: border-color 0.15s;
}

.alias-wrap.focused {
  border-color: var(--accent);
}

.alias-prefix {
  padding: 8px 0 8px 12px;
  font-size: 13px;
  color: var(--muted-foreground);
  white-space: nowrap;
  flex-shrink: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 60%;
  user-select: none;
}

.alias-input {
  border: none;
  border-radius: 0;
  background: transparent;
  padding-left: 2px;
  flex: 1;
  min-width: 0;
}

.alias-input:focus {
  border-color: transparent;
}

.expiry-group {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.expiry-btn {
  height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--muted-foreground);
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s, transform 0.12s cubic-bezier(0.32, 0.72, 0, 1);
}

.expiry-btn:hover:not(.active) {
  background: oklch(from var(--foreground) l c h / 0.05);
  color: var(--foreground);
}

.expiry-btn:active {
  transform: scale(0.95);
}

.expiry-btn.active {
  background: oklch(from var(--accent) l c h / 0.12);
  border-color: var(--accent);
  color: var(--accent);
}

.error-msg {
  font-size: 12px;
  color: var(--danger);
  padding: 6px 10px;
  background: oklch(from var(--danger) l c h / 0.08);
  border-radius: calc(var(--radius) - 2px);
  border: 1px solid oklch(from var(--danger) l c h / 0.2);
}

.error-fade-enter-active,
.error-fade-leave-active {
  transition: opacity 0.18s ease, transform 0.18s cubic-bezier(0.32, 0.72, 0, 1);
}
.error-fade-enter-from,
.error-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.btn-primary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 40px;
  width: 100%;
  margin-top: 4px;
  background: var(--foreground);
  color: var(--background);
  border: none;
  border-radius: var(--radius);
  font-size: 13px;
  font-weight: 500;
  transition: opacity 0.15s, transform 0.15s cubic-bezier(0.32, 0.72, 0, 1);
}

.btn-primary:hover:not(:disabled) {
  opacity: 0.88;
}

.btn-primary:active:not(:disabled) {
  transform: scale(0.97);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinner {
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
