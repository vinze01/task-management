import { defineStore } from 'pinia';

export type Priority = 'low' | 'medium' | 'high';

export interface Task {
  id: number;
  title: string;
  completed: boolean;
  /** ISO string for reliable sorting; display formatting happens in views */
  date: string;
  priority: Priority;
  /** Due date as YYYY-MM-DD, or null when none */
  dueDate: string | null;
  /** Due time as HH:MM (24h), or null when none. Only meaningful with dueDate. */
  dueTime: string | null;
  /** Exact alarm moment as ISO string, or null when no reminder. Manually selectable. */
  reminderAt: string | null;
  /** True once the reminder has fired, so it doesn't ring repeatedly. */
  reminderFired: boolean;
}

export interface NewTaskOptions {
  priority?: Priority;
  dueDate?: string | null;
  dueTime?: string | null;
  reminderAt?: string | null;
}

export interface TaskPatch {
  title?: string;
  priority?: Priority;
  dueDate?: string | null;
  dueTime?: string | null;
  reminderAt?: string | null;
}

const PRIORITIES: Priority[] = ['low', 'medium', 'high'];

const normalizePriority = (p: unknown): Priority => {
  return typeof p === 'string' && (PRIORITIES as string[]).includes(p) ? (p as Priority) : 'medium';
}

const normalizeDueDate = (d: unknown): string | null => {
  if (typeof d !== 'string' || !d) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return null;
  const dt = new Date(`${d}T00:00:00`);
  return Number.isNaN(dt.getTime()) ? null : d;
}

const normalizeTime = (t: unknown): string | null => {
  if (typeof t !== 'string' || !t) return null;
  const m = t.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

const normalizeISODateTime = (v: unknown): string | null => {
  if (typeof v !== 'string' || !v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** Compare two ISO datetimes at minute precision (the picker's resolution). */
const toMinuteKey = (iso: string | null): string | null => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  d.setSeconds(0, 0);
  return d.toISOString();
}

const todayKey = (): string => {
  const n = new Date();
  const m = `${n.getMonth() + 1}`.padStart(2, '0');
  const d = `${n.getDate()}`.padStart(2, '0');
  return `${n.getFullYear()}-${m}-${d}`;
}

/** Full deadline as a Date, combining optional date + optional time. Null when no due date. */
export const getDueDateTime = (t: Pick<Task, 'dueDate' | 'dueTime'>): Date | null => {
  if (!t.dueDate) return null;
  const time = t.dueTime ?? '23:59';
  const d = new Date(`${t.dueDate}T${time}:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export const isOverdue = (t: Pick<Task, 'completed' | 'dueDate' | 'dueTime'>): boolean => {
  if (t.completed || !t.dueDate) return false;
  const due = getDueDateTime(t);
  if (!due) return t.dueDate < todayKey();
  return due.getTime() < Date.now();
}

export const isDueToday = (t: Pick<Task, 'dueDate' | 'completed'>): boolean => {
  if (t.completed || !t.dueDate) return false;
  return t.dueDate === todayKey();
}

export const getReminderDate = (t: Pick<Task, 'reminderAt'>): Date | null => {
  if (!t.reminderAt) return null;
  const d = new Date(t.reminderAt);
  return Number.isNaN(d.getTime()) ? null : d;
}

export const isReminderDue = (t: Pick<Task, 'completed' | 'reminderAt' | 'reminderFired'>, now = Date.now()): boolean => {
  if (t.completed || !t.reminderAt || t.reminderFired) return false;
  const d = new Date(t.reminderAt);
  if (Number.isNaN(d.getTime())) return false;
  return d.getTime() <= now;
}

/** Convert a datetime-local input value (YYYY-MM-DDTHH:MM) to ISO, or null. */
export const localInputToISO = (local: string): string | null => {
  if (!local) return null;
  const d = new Date(local);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** Convert an ISO string to datetime-local input value (YYYY-MM-DDTHH:MM) in local time. */
export const isoToLocalInput = (iso: string | null): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const loadTasks = (): Task[] => {
  try {
    const raw = localStorage.getItem('tasks');
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const out: Task[] = [];
    for (const item of parsed) {
      if (typeof item !== 'object' || item === null) continue;
      const t = item as Partial<Task>;
      if (typeof t.id !== 'number' || typeof t.title !== 'string') continue;
      if (typeof t.completed !== 'boolean' || typeof t.date !== 'string') continue;
      const dueDate = normalizeDueDate(t.dueDate);
      out.push({
        id: t.id,
        title: t.title,
        completed: t.completed,
        date: t.date,
        priority: normalizePriority(t.priority),
        dueDate,
        // Time without a date is meaningless — drop it on load.
        dueTime: dueDate ? normalizeTime(t.dueTime) : null,
        reminderAt: normalizeISODateTime(t.reminderAt),
        reminderFired: t.reminderFired === true,
      });
    }
    return out;
  } catch {
    return [];
  }
}

export const useTaskStore = defineStore('taskStore', {
  state: () => ({
    tasks: loadTasks() as Task[],
  }),
  getters: {
    totalCount: (s) => s.tasks.length,
    completedCount: (s) => s.tasks.filter((t) => t.completed).length,
    activeCount: (s) => s.tasks.filter((t) => !t.completed).length,
    completedTasks: (s) => s.tasks.filter((t) => t.completed),
    activeTasks: (s) => s.tasks.filter((t) => !t.completed),
    overdueCount: (s) => s.tasks.filter(isOverdue).length,
    dueTodayCount: (s) => s.tasks.filter(isDueToday).length,
    highPriorityCount: (s) => s.tasks.filter((t) => !t.completed && t.priority === 'high').length,
    reminderCount: (s) =>
      s.tasks.filter((t) => !t.completed && t.reminderAt && !t.reminderFired).length,
    completionRate: (s) =>
      s.tasks.length === 0 ? 0 : Math.round((s.tasks.filter((t) => t.completed).length / s.tasks.length) * 100),
  },
  actions: {
    persist() {
      try {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
      } catch {
        // Storage full / unavailable: keep in-memory state, avoid crashing UI
      }
    },
    addTask(title: string, opts: NewTaskOptions = {}): Task | null {
      const trimmed = title.trim();
      if (!trimmed) return null;
      const dueDate = normalizeDueDate(opts.dueDate);
      const task: Task = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        title: trimmed,
        completed: false,
        date: new Date().toISOString(),
        priority: normalizePriority(opts.priority),
        dueDate,
        dueTime: dueDate ? normalizeTime(opts.dueTime) : null,
        reminderAt: normalizeISODateTime(opts.reminderAt),
        reminderFired: false,
      };
      this.tasks.unshift(task);
      this.persist();
      return task;
    },
    markTaskAsCompleted(id: number) {
      const task = this.tasks.find((t) => t.id === id);
      if (task && !task.completed) {
        task.completed = true;
        this.persist();
      }
    },
    toggleTask(id: number) {
      const task = this.tasks.find((t) => t.id === id);
      if (task) {
        task.completed = !task.completed;
        this.persist();
      }
    },
    reopenTask(id: number) {
      const task = this.tasks.find((t) => t.id === id);
      if (task && task.completed) {
        task.completed = false;
        this.persist();
      }
    },
    updateTaskTitle(id: number, title: string): boolean {
      const trimmed = title.trim();
      if (!trimmed) return false;
      const task = this.tasks.find((t) => t.id === id);
      if (!task) return false;
      task.title = trimmed;
      this.persist();
      return true;
    },
    setPriority(id: number, priority: Priority) {
      const task = this.tasks.find((t) => t.id === id);
      if (task) {
        task.priority = normalizePriority(priority);
        this.persist();
      }
    },
    setDueDate(id: number, dueDate: string | null) {
      const task = this.tasks.find((t) => t.id === id);
      if (task) {
        task.dueDate = normalizeDueDate(dueDate);
        if (!task.dueDate) task.dueTime = null;
        this.persist();
      }
    },
    setDueTime(id: number, dueTime: string | null) {
      const task = this.tasks.find((t) => t.id === id);
      if (task && task.dueDate) {
        task.dueTime = normalizeTime(dueTime);
        this.persist();
      }
    },
    setReminder(id: number, reminderAt: string | null) {
      const task = this.tasks.find((t) => t.id === id);
      if (task) {
        task.reminderAt = normalizeISODateTime(reminderAt);
        // Re-arm when the alarm time changes.
        task.reminderFired = false;
        this.persist();
      }
    },
    markReminderFired(id: number) {
      const task = this.tasks.find((t) => t.id === id);
      if (task) {
        task.reminderFired = true;
        this.persist();
      }
    },
    snoozeReminder(id: number, minutes: number) {
      const task = this.tasks.find((t) => t.id === id);
      if (task) {
        task.reminderAt = new Date(Date.now() + minutes * 60_000).toISOString();
        task.reminderFired = false;
        this.persist();
      }
    },
    clearReminder(id: number) {
      const task = this.tasks.find((t) => t.id === id);
      if (task) {
        task.reminderAt = null;
        task.reminderFired = false;
        this.persist();
      }
    },
    updateTask(id: number, patch: TaskPatch): boolean {
      const task = this.tasks.find((t) => t.id === id);
      if (!task) return false;
      if (patch.title !== undefined) {
        const trimmed = patch.title.trim();
        if (!trimmed) return false;
        task.title = trimmed;
      }
      if (patch.priority !== undefined) task.priority = normalizePriority(patch.priority);
      if (patch.dueDate !== undefined) {
        task.dueDate = normalizeDueDate(patch.dueDate);
        if (!task.dueDate) task.dueTime = null;
      }
      if (patch.dueTime !== undefined) {
        // Only keep a time when a date exists.
        task.dueTime = task.dueDate ? normalizeTime(patch.dueTime) : null;
      }
      if (patch.reminderAt !== undefined) {
        const next = normalizeISODateTime(patch.reminderAt);
        // Only re-arm when the alarm time actually changed — saving an edit
        // that leaves the alarm untouched must not resurrect an already-rung
        // (or snoozed, second-precision) alarm and fire it again.
        if (toMinuteKey(next) !== toMinuteKey(task.reminderAt)) {
          task.reminderAt = next;
          task.reminderFired = false;
        }
      }
      this.persist();
      return true;
    },
    deleteTask(id: number) {
      this.tasks = this.tasks.filter((t) => t.id !== id);
      this.persist();
    },
    clearCompleted() {
      this.tasks = this.tasks.filter((t) => !t.completed);
      this.persist();
    },
  },
});
