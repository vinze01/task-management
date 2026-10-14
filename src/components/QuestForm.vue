<script setup lang="ts">
import { ref } from 'vue';
import { localInputToISO, type Priority } from '@/stores/taskStore';
import { useNotificationPermission } from '@/composables/useReminders';

export interface QuestPayload {
  title: string;
  priority: Priority;
  dueDate: string | null;
  dueTime: string | null;
  reminderAt: string | null;
}

const emit = defineEmits<{
  (e: 'submit', payload: QuestPayload): void;
  (e: 'cancel'): void;
}>();

const title = ref('');
const priority = ref<Priority>('medium');
const due = ref('');
const time = ref('');
const reminderOn = ref(false);
const reminder = ref('');
const errorMessage = ref('');
const pastWarn = ref('');

const { permission, enableNotifications } = useNotificationPermission();

function useDueForReminder() {
  if (due.value) {
    reminder.value = `${due.value}T${time.value || '09:00'}`;
    reminderOn.value = true;
  }
}

function handleSubmit() {
  errorMessage.value = '';
  pastWarn.value = '';
  if (!title.value.trim()) {
    errorMessage.value = 'Give your quest a title first.';
    return;
  }
  // Time without a date means "today" — e.g. "Take my medicine at 8pm".
  let dueDate = due.value ? due.value : null;
  if (!dueDate && time.value) {
    const n = new Date();
    const pad = (v: number) => String(v).padStart(2, '0');
    dueDate = `${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(n.getDate())}`;
  }
  let reminderAt: string | null = null;
  if (reminderOn.value) {
    if (!reminder.value) {
      errorMessage.value = 'Pick a date + time for the alarm, or turn the reminder off.';
      return;
    }
    reminderAt = localInputToISO(reminder.value);
    if (!reminderAt) {
      errorMessage.value = 'That alarm time looks invalid.';
      return;
    }
    if (new Date(reminderAt).getTime() < Date.now()) {
      pastWarn.value = 'Heads up: that alarm time is in the past — it will ring right away.';
    }
  }
  emit('submit', {
    title: title.value.trim(),
    priority: priority.value,
    dueDate,
    dueTime: dueDate ? (time.value ? time.value : null) : null,
    reminderAt,
  });
}
</script>

<template>
  <form class="quest-form" novalidate @submit.prevent="handleSubmit">
    <div>
      <label for="q-title" class="field-label">Quest title</label>
      <input
        id="q-title"
        v-model="title"
        type="text"
        class="field-input"
        placeholder="e.g. Take my medicine 💊"
        maxlength="200"
        autocomplete="off"
        :aria-invalid="errorMessage && !title.trim() ? 'true' : 'false'"
        :aria-describedby="errorMessage ? 'q-error' : undefined"
      />
    </div>

    <div>
      <span id="q-prio-label" class="field-label">Priority</span>
      <div class="prio-picker" role="group" aria-labelledby="q-prio-label">
        <button
          v-for="p in (['low', 'medium', 'high'] as Priority[])"
          :key="p"
          type="button"
          :class="['prio-btn', `prio-${p}`, { active: priority === p }]"
          :aria-pressed="priority === p"
          @click="priority = p"
        >
          {{ p === 'high' ? '🔥 High' : p === 'medium' ? '🔵 Med' : '🌿 Low' }}
        </button>
      </div>
    </div>

    <div class="due-grid">
      <div>
        <label for="q-due" class="mini-label">Due date (optional)</label>
        <input id="q-due" v-model="due" type="date" class="field-input" />
      </div>
      <div>
        <label for="q-time" class="mini-label">Due time (optional)</label>
        <input id="q-time" v-model="time" type="time" class="field-input" />
      </div>
    </div>
    <p class="hint">No date but a time? We'll assume today — handy for “Take my medicine at 8pm”.</p>

    <div class="rem-card">
      <label class="rem-toggle">
        <input v-model="reminderOn" type="checkbox" />
        <span>🔔 Set an alarm for this quest</span>
      </label>
      <div v-if="reminderOn" class="rem-fields">
        <label for="q-reminder" class="mini-label">Alarm rings at (you pick the exact time)</label>
        <input id="q-reminder" v-model="reminder" type="datetime-local" class="field-input" />
        <div class="rem-row">
          <button type="button" class="link-btn" @click="useDueForReminder">Use due date + time</button>
          <button
            v-if="permission === 'default'"
            type="button"
            class="link-btn"
            @click="enableNotifications"
          >
            Enable system notifications
          </button>
          <span v-else-if="permission === 'granted'" class="perm-ok">🔔 System alerts on</span>
          <span v-else-if="permission === 'denied'" class="perm-warn">System alerts blocked — in-app alarm still works</span>
        </div>
        <p v-if="pastWarn" class="hint warn" role="status">{{ pastWarn }}</p>
      </div>
    </div>

    <p v-if="errorMessage" id="q-error" class="field-error" role="alert">{{ errorMessage }}</p>

    <div class="form-actions">
      <button type="button" class="btn btn-secondary" @click="emit('cancel')">Cancel</button>
      <button type="submit" class="btn btn-primary" :disabled="!title.trim()">➕ Add quest</button>
    </div>
  </form>
</template>

<style scoped>
.quest-form {
  display: grid;
  gap: 0.85rem;
  min-width: 0;
}

.prio-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.prio-btn {
  min-height: 44px;
  padding: 0.45rem 0.9rem;
  border-radius: var(--radius-full);
  border: 1.5px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-muted);
  font-weight: 800;
  font-size: 0.85rem;
  cursor: pointer;
  transition: transform var(--transition-fast), border-color var(--transition-fast);
}

.prio-btn:hover {
  transform: translateY(-1px);
}

.prio-btn.active {
  border-color: var(--color-primary);
  background: var(--color-primary-soft);
  color: var(--color-text);
}

.mini-label {
  display: block;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--color-muted);
  margin-bottom: 0.25rem;
}

.due-grid {
  display: grid;
  gap: 0.6rem;
  grid-template-columns: 1fr 1fr;
  min-width: 0;
}

.hint {
  font-size: 0.8rem;
  color: var(--color-faint);
}

.hint.warn {
  color: var(--color-warning-text);
  font-weight: 700;
}

.rem-card {
  border: 1px dashed var(--color-border-strong);
  border-radius: var(--radius-sm);
  background: var(--color-surface-muted);
  padding: 0.7rem 0.8rem;
  display: grid;
  gap: 0.55rem;
}

.rem-toggle {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  font-weight: 800;
  font-size: 0.9rem;
  cursor: pointer;
  min-height: 44px;
}

.rem-toggle input {
  width: 20px;
  height: 20px;
  accent-color: var(--color-primary);
}

.rem-fields {
  display: grid;
  gap: 0.4rem;
}

.rem-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem 0.9rem;
}

.link-btn {
  background: none;
  border: none;
  padding: 0.3rem 0;
  color: var(--color-primary-hover);
  font-size: 0.82rem;
  font-weight: 800;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
  min-height: 36px;
}

.perm-ok {
  font-size: 0.82rem;
  font-weight: 800;
  color: var(--color-success);
}

.perm-warn {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-muted);
}

.form-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.6rem;
  margin-top: 0.2rem;
}

.form-actions .btn {
  flex: 1 1 140px;
}

@media (max-width: 420px) {
  .due-grid {
    grid-template-columns: 1fr;
  }
}
</style>
