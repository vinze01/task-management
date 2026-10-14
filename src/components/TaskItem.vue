<script setup lang="ts">
import { ref, nextTick, computed } from 'vue';
import type { Task, Priority } from '@/stores/taskStore';
import { isOverdue, isDueToday, isoToLocalInput, localInputToISO } from '@/stores/taskStore';

export interface TaskEditPatch {
  title: string;
  priority: Priority;
  dueDate: string | null;
  dueTime: string | null;
  reminderAt: string | null;
}

const props = defineProps<{ task: Task }>();

const emit = defineEmits<{
  (e: 'toggle', id: number): void;
  (e: 'remove', id: number): void;
  (e: 'rename', id: number, title: string): void;
  (e: 'update', id: number, patch: TaskEditPatch): void;
}>();

const isEditing = ref(false);
const draft = ref(props.task.title);
const draftPriority = ref<Priority>(props.task.priority);
const draftDue = ref<string>(props.task.dueDate ?? '');
const draftTime = ref<string>(props.task.dueTime ?? '');
const draftReminder = ref<string>(isoToLocalInput(props.task.reminderAt));
const editError = ref('');
const confirmDelete = ref(false);
const editInput = ref<HTMLInputElement | null>(null);

const overdue = computed(() => isOverdue(props.task));
const dueToday = computed(() => isDueToday(props.task));
const alarmArmed = computed(() => !!props.task.reminderAt && !props.task.reminderFired && !props.task.completed);

const originalReminderInput = computed(() => isoToLocalInput(props.task.reminderAt));
const reminderChanged = computed(() => draftReminder.value !== originalReminderInput.value);
const reminderHint = computed(() => {
  if (!draftReminder.value) return 'No alarm will ring for this quest.';
  const when = new Date(draftReminder.value);
  if (Number.isNaN(when.getTime())) return 'That alarm time looks invalid.';
  const fmt = when.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  if (reminderChanged.value) {
    return when.getTime() <= Date.now()
      ? 'New time is in the past — it will ring right after saving.'
      : `New alarm — will ring ${fmt}.`;
  }
  if (props.task.reminderFired) return `This alarm already rang (${fmt}). Change the time to ring again.`;
  return `Alarm armed for ${fmt}.`;
});

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

const formatDue = (date: string, time: string | null): string => {
  const d = new Date(`${date}T${time ?? '00:00'}:00`);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleString('en-US', time
    ? { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }
    : { month: 'short', day: 'numeric', year: 'numeric' });
}

const formatReminder = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

const priorityLabel = (p: Priority): string => {
  return p === 'high' ? 'High' : p === 'low' ? 'Low' : 'Med';
}

const todayLocal = (): string => {
  const n = new Date();
  const pad = (v: number) => String(v).padStart(2, '0');
  return `${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(n.getDate())}`;
}

const startEdit = async (): Promise<void> => {
  isEditing.value = true;
  draft.value = props.task.title;
  draftPriority.value = props.task.priority;
  draftDue.value = props.task.dueDate ?? '';
  draftTime.value = props.task.dueTime ?? '';
  draftReminder.value = isoToLocalInput(props.task.reminderAt);
  editError.value = '';
  confirmDelete.value = false;
  await nextTick();
  editInput.value?.focus();
  editInput.value?.select();
}

const cancelEdit = (): void => {
  isEditing.value = false;
  editError.value = '';
}

const saveEdit = (): void => {
  if (!draft.value.trim()) {
    editError.value = 'Task title cannot be empty.';
    return;
  }
  // Time without a date means "today" — e.g. medicine at 8pm.
  let dueDate = draftDue.value ? draftDue.value : null;
  if (!dueDate && draftTime.value) dueDate = todayLocal();
  const reminderAt = draftReminder.value ? localInputToISO(draftReminder.value) : null;
  if (draftReminder.value && !reminderAt) {
    editError.value = 'That reminder time looks invalid.';
    return;
  }
  emit('update', props.task.id, {
    title: draft.value.trim(),
    priority: draftPriority.value,
    dueDate,
    dueTime: dueDate ? (draftTime.value ? draftTime.value : null) : null,
    reminderAt,
  });
  isEditing.value = false;
}

const fillReminderFromDue = (): void => {
  if (draftDue.value) {
    draftReminder.value = `${draftDue.value}T${draftTime.value || '09:00'}`;
  }
}

const cyclePriority = (): void => {
  const order: Priority[] = ['low', 'medium', 'high'];
  const next = order[(order.indexOf(props.task.priority) + 1) % order.length] ?? 'medium';
  emit('update', props.task.id, {
    title: props.task.title,
    priority: next,
    dueDate: props.task.dueDate,
    dueTime: props.task.dueTime,
    reminderAt: props.task.reminderAt,
  });
}

const onDeleteClick = (): void => {
  if (!confirmDelete.value) {
    confirmDelete.value = true;
    return;
  }
  emit('remove', props.task.id);
}
</script>

<template>
  <li
    class="task"
    :class="[
      { 'is-done': task.completed },
      `prio-${task.priority}`,
      { 'is-overdue': overdue },
    ]"
  >
    <label class="check-wrap">
      <input
        type="checkbox"
        class="check"
        :checked="task.completed"
        :aria-label="task.completed ? `Reopen task: ${task.title}` : `Complete task: ${task.title}`"
        @change="emit('toggle', task.id)"
      />
      <span class="box" aria-hidden="true">
        <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden="true">
          <path d="M3 8.5 6.5 12 13 4.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </span>
    </label>

    <div class="body">
      <div v-if="!isEditing" class="title-row">
        <p class="title" :class="{ struck: task.completed }">{{ task.title }}</p>
        <p class="meta">
          <button
            type="button"
            class="pill"
            :class="`pill-${task.priority}`"
            :aria-label="`Priority ${priorityLabel(task.priority)}. Activate to change priority.`"
            title="Click to change priority"
            @click="cyclePriority"
          >
            <span class="dot" aria-hidden="true"></span>{{ priorityLabel(task.priority) }}
          </button>
          <span v-if="task.dueDate" class="pill pill-due" :class="{ 'pill-overdue': overdue, 'pill-today': dueToday && !task.completed }">
            {{ overdue ? `Overdue · ${formatDue(task.dueDate, task.dueTime)}` : dueToday ? `Due today${task.dueTime ? ` · ${formatDue(task.dueDate, task.dueTime)}` : ''}` : `📅 ${formatDue(task.dueDate, task.dueTime)}` }}
          </span>
          <span
            v-if="task.reminderAt"
            class="pill pill-bell"
            :class="{ 'pill-rang': task.reminderFired || task.completed }"
            :title="task.reminderFired ? 'Alarm already rang' : task.completed ? 'Alarm was set for this quest' : 'Alarm armed'"
          >
            {{ task.reminderFired || task.completed ? `🔔 Rang · ${formatReminder(task.reminderAt)}` : `🔔 ${formatReminder(task.reminderAt)}` }}
          </span>
          <span class="badge" :class="task.completed ? 'badge-done' : 'badge-active'">
            {{ task.completed ? 'Done' : 'Active' }}
          </span>
          <time :datetime="task.date">{{ formatDate(task.date) }}</time>
        </p>
      </div>

      <div v-else class="edit-row">
        <label :for="`edit-${task.id}`" class="sr-only">Edit task title</label>
        <input
          :id="`edit-${task.id}`"
          ref="editInput"
          v-model="draft"
          class="field-input"
          maxlength="200"
          autocomplete="off"
          @keyup.enter="saveEdit"
          @keyup.escape="cancelEdit"
          :aria-invalid="editError ? 'true' : 'false'"
          :aria-describedby="editError ? `edit-err-${task.id}` : undefined"
        />
        <div class="edit-grid">
          <div>
            <label :for="`prio-${task.id}`" class="mini-label">Priority</label>
            <select :id="`prio-${task.id}`" v-model="draftPriority" class="field-input">
              <option value="low">Low priority</option>
              <option value="medium">Medium priority</option>
              <option value="high">High priority</option>
            </select>
          </div>
          <div>
            <label :for="`due-${task.id}`" class="mini-label">Due date (optional)</label>
            <input :id="`due-${task.id}`" v-model="draftDue" type="date" class="field-input" />
          </div>
          <div>
            <label :for="`time-${task.id}`" class="mini-label">Due time (optional)</label>
            <input :id="`time-${task.id}`" v-model="draftTime" type="time" class="field-input" />
            <p class="hint">Time needs a date — if empty, today is used.</p>
          </div>
          <div>
            <label :for="`rem-${task.id}`" class="mini-label">🔔 Alarm (optional)</label>
            <input :id="`rem-${task.id}`" v-model="draftReminder" type="datetime-local" class="field-input" />
            <p class="hint" role="status">{{ reminderHint }}</p>
            <div class="rem-row">
              <button type="button" class="link-btn" @click="fillReminderFromDue">Use due time</button>
              <button type="button" class="link-btn" @click="draftReminder = ''">Clear</button>
            </div>
          </div>
        </div>
        <p v-if="editError" :id="`edit-err-${task.id}`" class="field-error" role="alert">{{ editError }}</p>
        <div class="edit-actions">
          <button type="button" class="btn btn-primary btn-sm" @click="saveEdit">Save</button>
          <button type="button" class="btn btn-secondary btn-sm" @click="cancelEdit">Cancel</button>
        </div>
      </div>
    </div>

    <div v-if="!isEditing" class="actions">
      <button
        type="button"
        class="icon-btn"
        :aria-label="`Edit task: ${task.title}`"
        title="Edit"
        @click="startEdit"
      >
        <svg viewBox="0 0 20 20" width="16" height="16" fill="none" aria-hidden="true">
          <path d="M13.5 3.5 16.5 6.5 7 16l-4 1 1-4 9.5-9.5Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" />
        </svg>
      </button>
      <button
        type="button"
        class="icon-btn danger"
        :aria-label="confirmDelete ? `Confirm delete task: ${task.title}` : `Delete task: ${task.title}`"
        :title="confirmDelete ? 'Click again to confirm' : 'Delete'"
        @click="onDeleteClick"
        @blur="confirmDelete = false"
      >
        <svg viewBox="0 0 20 20" width="16" height="16" fill="none" aria-hidden="true">
          <path d="M4 6h12M8 6V4.5A1 1 0 0 1 9 3.5h2a1 1 0 0 1 1 1V6m2.5 0 .8 10a1 1 0 0 1-1 1H5.7a1 1 0 0 1-1-1l.8-10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
        </svg>
        <span v-if="confirmDelete" class="confirm-text">Sure?</span>
      </button>
    </div>
  </li>
</template>

<style scoped>
.task {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.85rem 0.9rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-xs);
  min-width: 0;
  overflow: hidden;
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}

.task:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.task::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: var(--color-border-strong);
}

.task.prio-low::before {
  background: var(--accent-teal);
}

.task.prio-medium::before {
  background: var(--accent-blue);
}

.task.prio-high::before {
  background: var(--gradient-brand);
}

.task.is-done {
  background: var(--color-success-bg);
  border-color: var(--color-success-border);
}

.task.is-overdue {
  border-color: var(--color-danger);
}

.check-wrap {
  flex-shrink: 0;
  padding-top: 0.15rem;
  cursor: pointer;
}

.check {
  position: absolute;
  opacity: 0;
  width: 1px;
  height: 1px;
}

.box {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 9px;
  border: 2px solid var(--color-border-strong);
  background: var(--color-surface);
  color: transparent;
  transition: transform var(--transition-bounce), background var(--transition-fast), border-color var(--transition-fast), color var(--transition-fast);
}

.check:checked + .box {
  background: var(--gradient-brand);
  border-color: transparent;
  color: #fff;
  animation: pop-in 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.check:focus-visible + .box {
  outline: 3px solid var(--color-primary-ring);
  outline-offset: 2px;
}

.body {
  flex: 1 1 auto;
  min-width: 0;
}

.title {
  font-weight: 700;
  font-size: 0.98rem;
  line-height: 1.45;
  overflow-wrap: anywhere;
  color: var(--color-text);
}

.title.struck {
  text-decoration: line-through;
  text-decoration-thickness: 1.5px;
  color: var(--color-muted);
}

.meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.35rem;
  font-size: 0.8rem;
  color: var(--color-muted);
  min-width: 0;
}

.pill {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.12rem 0.55rem;
  border-radius: var(--radius-full);
  font-size: 0.72rem;
  font-weight: 800;
  border: 1px solid var(--color-border);
  background: var(--color-surface-muted);
  color: var(--color-muted);
  cursor: pointer;
}

.pill .dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
}

.pill-low {
  color: #0d9488;
  border-color: rgba(20, 184, 166, 0.4);
}

.pill-medium {
  color: var(--color-primary-hover);
  border-color: var(--color-border-strong);
}

.pill-high {
  color: #db2777;
  border-color: rgba(236, 72, 153, 0.45);
  background: rgba(236, 72, 153, 0.08);
}

[data-theme='dark'] .pill-high {
  color: #f9a8d4;
}

.pill-due {
  cursor: default;
}

.pill-today {
  background: var(--color-warning-bg);
  border-color: var(--color-warning-border);
  color: var(--color-warning-text);
}

.pill-overdue {
  background: var(--color-danger-bg);
  border-color: var(--color-danger);
  color: var(--color-danger-hover);
  animation: wiggle 1.2s ease-in-out infinite;
}

.pill-bell {
  cursor: default;
  background: var(--color-info-bg);
  border-color: var(--color-info-border);
  color: var(--color-primary-hover);
}

.pill-rang {
  background: var(--color-surface-muted);
  border-style: dashed;
  color: var(--color-muted);
}

@keyframes wiggle {
  0%,
  100% {
    transform: rotate(0);
  }
  25% {
    transform: rotate(-1.2deg);
  }
  75% {
    transform: rotate(1.2deg);
  }
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.1rem 0.55rem;
  border-radius: var(--radius-full);
  font-size: 0.72rem;
  font-weight: 800;
  border: 1px solid transparent;
}

.badge-active {
  background: var(--color-primary-soft);
  color: var(--color-primary-hover);
}

.badge-done {
  background: rgba(74, 222, 128, 0.16);
  color: var(--color-success);
  border-color: var(--color-success-border);
}

.actions {
  display: flex;
  gap: 0.25rem;
  flex-shrink: 0;
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  min-width: 40px;
  min-height: 40px;
  padding: 0.45rem 0.55rem;
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
  background: transparent;
  color: var(--color-muted);
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 700;
}

.icon-btn:hover {
  background: var(--color-surface-muted);
  color: var(--color-text);
  border-color: var(--color-border);
}

.icon-btn.danger {
  color: var(--color-danger);
}

.icon-btn.danger:hover {
  background: var(--color-danger-bg);
  color: var(--color-danger-hover);
}

.confirm-text {
  font-size: 0.75rem;
}

.edit-row {
  display: grid;
  gap: 0.55rem;
  min-width: 0;
}

.edit-grid > div {
  min-width: 0;
}

/* Native pickers have wide intrinsic widths — never let them push past the card. */
.edit-grid input[type='date'],
.edit-grid input[type='time'],
.edit-grid input[type='datetime-local'] {
  width: 100%;
  min-width: 0;
  max-width: 100%;
  font-size: 16px;
}

.edit-grid {
  display: grid;
  gap: 0.55rem;
  grid-template-columns: 1fr;
}

.mini-label {
  display: block;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--color-muted);
  margin-bottom: 0.25rem;
}

.hint {
  font-size: 0.76rem;
  color: var(--color-faint);
  margin-top: 0.25rem;
}

.rem-row {
  display: flex;
  gap: 0.6rem;
  margin-top: 0.3rem;
}

.link-btn {
  background: none;
  border: none;
  padding: 0.2rem 0;
  color: var(--color-primary-hover);
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.edit-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.btn-sm {
  min-height: 40px;
  padding: 0.5rem 0.9rem;
  font-size: 0.88rem;
}

@media (min-width: 560px) {
  .edit-grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
