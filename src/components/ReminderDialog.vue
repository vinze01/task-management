<script setup lang="ts">
import type { Task } from '@/stores/taskStore';

defineProps<{ queue: Task[] }>();

const emit = defineEmits<{
  (e: 'done', id: number): void;
  (e: 'snooze', id: number, minutes: number): void;
  (e: 'dismiss', id: number): void;
  (e: 'dismiss-all'): void;
}>();

function formatWhen(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}
</script>

<template>
  <div v-if="queue.length > 0" class="overlay" role="presentation">
    <div
      class="dialog card"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="alarm-title"
      aria-describedby="alarm-desc"
    >
      <div class="dialog-fun" aria-hidden="true">⏰</div>
      <h2 id="alarm-title" class="dialog-title">
        {{ queue.length === 1 ? 'Reminder ringing!' : `${queue.length} reminders ringing!` }}
      </h2>
      <p id="alarm-desc" class="dialog-desc">Time's up — starting with the first one below.</p>

      <ul class="alarm-list">
        <li v-for="t in queue" :key="t.id" class="alarm-item">
          <p class="alarm-task">{{ t.title }}</p>
          <p class="alarm-when">⏰ {{ formatWhen(t.reminderAt) }}</p>
          <div class="alarm-actions">
            <button type="button" class="btn btn-primary btn-sm" @click="emit('done', t.id)">✅ Mark done</button>
            <button type="button" class="btn btn-secondary btn-sm" @click="emit('snooze', t.id, 10)">😴 Snooze 10m</button>
            <button type="button" class="btn btn-secondary btn-sm" @click="emit('dismiss', t.id)">Dismiss</button>
          </div>
        </li>
      </ul>

      <div class="dialog-foot">
        <button type="button" class="btn btn-secondary btn-sm" @click="emit('dismiss-all')">Dismiss all</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(15, 23, 42, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  animation: toast-in 200ms ease;
}

.dialog {
  width: 100%;
  max-width: 460px;
  max-height: calc(100vh - 2rem);
  overflow: auto;
  padding: 1.5rem 1.3rem;
  text-align: center;
  border-top: 5px solid transparent;
  border-image: var(--gradient-brand) 1;
  border-image-slice: 1 0 0 0;
}

.dialog-fun {
  font-size: 2.6rem;
  animation: ring 1s ease-in-out infinite;
}

@keyframes ring {
  0%, 100% { transform: rotate(0); }
  20% { transform: rotate(14deg); }
  40% { transform: rotate(-12deg); }
  60% { transform: rotate(8deg); }
  80% { transform: rotate(-6deg); }
}

.dialog-title {
  font-size: 1.25rem;
  letter-spacing: -0.01em;
  margin-top: 0.4rem;
  overflow-wrap: anywhere;
}

.dialog-desc {
  margin-top: 0.3rem;
  color: var(--color-muted);
  font-size: 0.92rem;
}

.alarm-list {
  list-style: none;
  padding: 0;
  margin-top: 1rem;
  display: grid;
  gap: 0.7rem;
  text-align: left;
}

.alarm-item {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface-muted);
  padding: 0.8rem 0.9rem;
  display: grid;
  gap: 0.25rem;
}

.alarm-task {
  font-weight: 800;
  overflow-wrap: anywhere;
}

.alarm-when {
  color: var(--color-muted);
  font-size: 0.85rem;
  font-weight: 600;
}

.alarm-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-top: 0.4rem;
}

.btn-sm {
  min-height: 40px;
  padding: 0.5rem 0.8rem;
  font-size: 0.85rem;
}

.dialog-foot {
  margin-top: 1rem;
  display: flex;
  justify-content: center;
}

@keyframes toast-in {
  from { opacity: 0; transform: translateY(10px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
</style>
