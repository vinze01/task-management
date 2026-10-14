<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';

defineProps<{ title: string }>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const dialogRef = ref<HTMLDivElement | null>(null);
let prevFocus: Element | null = null;
let prevOverflow = '';

function focusables(): HTMLElement[] {
  const root = dialogRef.value;
  if (!root) return [];
  return [...root.querySelectorAll<HTMLElement>(
    'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
  )].filter((el) => el.offsetParent !== null || el === document.activeElement);
}

function trapTab(e: KeyboardEvent) {
  if (e.key !== 'Tab') return;
  const items = focusables();
  if (items.length === 0) return;
  const first = items[0]!;
  const last = items[items.length - 1]!;
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.stopPropagation();
    emit('close');
    return;
  }
  trapTab(e);
}

function onOverlay(e: MouseEvent) {
  if (e.target === e.currentTarget) emit('close');
}

onMounted(() => {
  prevFocus = document.activeElement;
  prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  document.addEventListener('keydown', onKeydown, true);
  const items = focusables();
  (items[0] ?? dialogRef.value)?.focus();
});

onBeforeUnmount(() => {
  document.body.style.overflow = prevOverflow;
  document.removeEventListener('keydown', onKeydown, true);
  if (prevFocus instanceof HTMLElement) prevFocus.focus();
});
</script>

<template>
  <div class="modal-overlay" @click="onOverlay">
    <div
      ref="dialogRef"
      class="modal-dialog"
      role="dialog"
      aria-modal="true"
      :aria-label="title"
      tabindex="-1"
    >
      <div class="modal-head">
        <h2 class="modal-title">{{ title }}</h2>
        <button type="button" class="modal-x" aria-label="Close dialog" @click="emit('close')">✕</button>
      </div>
      <div class="modal-body">
        <slot />
      </div>
    </div>
  </div>
</template>
