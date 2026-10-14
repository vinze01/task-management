import { ref, onMounted, onBeforeUnmount } from 'vue';
import { storeToRefs } from 'pinia';
import { useTaskStore, isReminderDue, type Task } from '@/stores/taskStore';

export type NotificationPermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

const currentPermission = (): NotificationPermissionState => {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission as NotificationPermissionState;
}

/** Gentle 3-chime alarm using WebAudio — no audio assets needed. */
export const playAlarmSound = (): void => {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const play = (freq: number, startAt: number, dur = 0.3) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, startAt);
      gain.gain.exponentialRampToValueAtTime(0.32, startAt + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(startAt);
      osc.stop(startAt + dur + 0.05);
    };
    const t = ctx.currentTime + 0.05;
    play(880, t);
    play(987.77, t + 0.34);
    play(1174.66, t + 0.68, 0.45);
    window.setTimeout(() => void ctx.close().catch(() => undefined), 2200);
  } catch {
    // Audio blocked / unavailable — visual + system notification still work.
  }
}

/** Phone buzz to accompany the chime. No-op where unsupported (e.g. iOS). */
export const vibrateAlarm = (): void => {
  try {
    if ('vibrate' in navigator) navigator.vibrate([500, 250, 500, 250, 1000]);
  } catch {
    // ignore
  }
}

interface WakeLockSentinelLike {
  release(): Promise<void>;
  addEventListener(type: string, listener: () => void): void;
}

/**
 * Keeps the screen on while the board is open — the single most effective
 * mobile alarm fix (a sleeping phone suspends all page JS, so no web app can
 * ring from a locked screen). Best-effort: silently no-ops where unsupported.
 */
export const useWakeLock = () => {
  let lock: WakeLockSentinelLike | null = null;

  const acquire = async (): Promise<void> => {
    try {
      const nav = navigator as unknown as {
        wakeLock?: { request(mode: 'screen'): Promise<WakeLockSentinelLike> };
      };
      if (!nav.wakeLock) return;
      if (lock) return;
      lock = await nav.wakeLock.request('screen');
      lock.addEventListener('release', () => {
        lock = null;
      });
    } catch {
      lock = null;
    }
  }

  const onVisibility = (): void => {
    if (document.visibilityState === 'visible') void acquire();
  }

  onMounted(() => {
    void acquire();
    document.addEventListener('visibilitychange', onVisibility);
  });

  onBeforeUnmount(() => {
    document.removeEventListener('visibilitychange', onVisibility);
    void lock?.release().catch(() => undefined);
  });
}

export const sendSystemNotification = (task: Task): void => {
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
export const useNotificationPermission = () => {
  const permission = ref<NotificationPermissionState>(currentPermission());

  const enableNotifications = async (): Promise<NotificationPermissionState> => {
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
export const useReminderScheduler = (onAlarm: (task: Task) => void, intervalMs = 10_000) => {
  const taskStore = useTaskStore();
  const { tasks } = storeToRefs(taskStore);
  const permission = ref<NotificationPermissionState>(currentPermission());
  let timer: number | undefined;

  const check = (): void => {
    permission.value = currentPermission();
    const now = Date.now();
    for (const t of tasks.value) {
      if (isReminderDue(t, now)) {
        taskStore.markReminderFired(t.id);
        onAlarm({ ...t });
      }
    }
  }

  const enableNotifications = async (): Promise<NotificationPermissionState> => {
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

  const onVisibility = (): void => {
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
