import { ref, onMounted, onBeforeUnmount } from 'vue';
import { storeToRefs } from 'pinia';
import { useTaskStore, isReminderDue, type Task } from '@/stores/taskStore';

export type NotificationPermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

function currentPermission(): NotificationPermissionState {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission as NotificationPermissionState;
}

/** Gentle 3-chime alarm using WebAudio — no audio assets needed. */
export function playAlarmSound(): void {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const play = (freq: number, startAt: number, dur = 0.28) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, startAt);
      gain.gain.exponentialRampToValueAtTime(0.25, startAt + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(startAt);
      osc.stop(startAt + dur + 0.05);
    };
    const t = ctx.currentTime + 0.05;
    play(880, t);
    play(987.77, t + 0.32);
    play(1174.66, t + 0.64, 0.4);
    window.setTimeout(() => void ctx.close().catch(() => undefined), 2000);
  } catch {
    // Audio blocked / unavailable — visual + system notification still work.
  }
}

export function sendSystemNotification(task: Task): void {
  try {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const n = new Notification(`⏰ ${task.title}`, {
      body: 'Your quest reminder is ringing!',
      tag: `task-${task.id}`,
    });
    n.onclick = () => window.focus?.();
  } catch {
    // ignore
  }
}

/**
 * Notification permission state shared without polling the task store.
 * Use this in views that only need the permission UI.
 */
export function useNotificationPermission() {
  const permission = ref<NotificationPermissionState>(currentPermission());

  async function enableNotifications(): Promise<NotificationPermissionState> {
    try {
      if (!('Notification' in window)) {
        permission.value = 'unsupported';
        return permission.value;
      }
      permission.value = await Notification.requestPermission();
      return permission.value;
    } catch {
      return permission.value;
    }
  }

  onMounted(() => {
    permission.value = currentPermission();
  });

  return { permission, enableNotifications };
}

/**
 * Polls the task store and fires `onAlarm` once per task when its reminder time arrives.
 * Works while the app tab is open. Interval-based so it survives reloads via persisted state.
 * Mount exactly ONE scheduler app-wide (in App.vue) — a second instance would race it and
 * could mark reminders fired before the alarm dialog ever shows.
 */
export function useReminderScheduler(onAlarm: (task: Task) => void, intervalMs = 10_000) {
  const taskStore = useTaskStore();
  const { tasks } = storeToRefs(taskStore);
  const permission = ref<NotificationPermissionState>(currentPermission());
  let timer: number | undefined;

  function check() {
    permission.value = currentPermission();
    const now = Date.now();
    for (const t of tasks.value) {
      if (isReminderDue(t, now)) {
        taskStore.markReminderFired(t.id);
        onAlarm({ ...t });
      }
    }
  }

  async function enableNotifications(): Promise<NotificationPermissionState> {
    try {
      if (!('Notification' in window)) {
        permission.value = 'unsupported';
        return permission.value;
      }
      permission.value = await Notification.requestPermission();
      return permission.value;
    } catch {
      return permission.value;
    }
  }

  function onVisibility() {
    if (document.visibilityState === 'visible') check();
  }

  onMounted(() => {
    check();
    timer = window.setInterval(check, intervalMs);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', check);
  });

  onBeforeUnmount(() => {
    window.clearInterval(timer);
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('focus', check);
  });

  return { permission, enableNotifications, checkNow: check };
}
