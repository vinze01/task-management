<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';
import { useTaskStore, type Task } from '@/stores/taskStore';
import { useReminderScheduler, playAlarmSound, sendSystemNotification } from '@/composables/useReminders';
import ReminderDialog from '@/components/ReminderDialog.vue';

const authStore = useAuthStore();
const { user, avatar } = storeToRefs(authStore);
const themeStore = useThemeStore();
const taskStore = useTaskStore();
const route = useRoute();
const router = useRouter();

const menuOpen = ref(false);
const showWelcome = ref(false);
const dialogRef = ref<HTMLDivElement | null>(null);
const alarmQueue = ref<Task[]>([]);

function handleAlarm(task: Task) {
  playAlarmSound();
  sendSystemNotification(task);
  if (!alarmQueue.value.some((t) => t.id === task.id)) {
    alarmQueue.value.push(task);
  }
}

useReminderScheduler(handleAlarm);

function alarmDone(id: number) {
  taskStore.markTaskAsCompleted(id);
  alarmQueue.value = alarmQueue.value.filter((t) => t.id !== id);
}

function alarmSnooze(id: number, minutes: number) {
  taskStore.snoozeReminder(id, minutes);
  alarmQueue.value = alarmQueue.value.filter((t) => t.id !== id);
}

function alarmDismiss(id: number) {
  alarmQueue.value = alarmQueue.value.filter((t) => t.id !== id);
}

function alarmDismissAll() {
  alarmQueue.value = [];
}

// Never render raw storage values (e.g. a JSON object string from another app
// sharing the same origin/key). Store already normalizes, this is belt-and-braces.
const displayName = computed(() => {
  const v: unknown = user.value;
  if (typeof v !== 'string') return '';
  const t = v.trim();
  if (!t || t.startsWith('{') || t.startsWith('[')) return '';
  return t.length > 80 ? t.slice(0, 80) : t;
});

const initial = computed(() => (displayName.value ? displayName.value.charAt(0).toUpperCase() : '?'));
const headerAvatar = computed(() => avatar.value || initial.value);
const isDark = computed(() => themeStore.theme === 'dark');

function closeMenu() {
  menuOpen.value = false;
}

async function logout() {
  authStore.logout();
  closeMenu();
  await router.push('/login');
}

function dismissWelcome(persist = true) {
  showWelcome.value = false;
  if (persist) {
    try {
      sessionStorage.setItem('welcome-dismissed', '1');
    } catch { /* ignore */ }
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    if (alarmQueue.value.length > 0) {
      alarmDismissAll();
      return;
    }
    if (showWelcome.value) dismissWelcome();
    if (menuOpen.value) closeMenu();
  }
}

function onOverlayClick(e: MouseEvent) {
  if (e.target === e.currentTarget) dismissWelcome();
}

watch(
  () => route.path,
  () => closeMenu(),
);

onMounted(() => {
  themeStore.init();
  window.addEventListener('keydown', onKeydown);
  let dismissed = false;
  try {
    dismissed = sessionStorage.getItem('welcome-dismissed') === '1';
  } catch { /* ignore */ }
  if (user.value && !dismissed) {
    showWelcome.value = true;
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown);
});
</script>

<template>
  <a class="skip-link" href="#main">Skip to content</a>
  <div class="app">
    <header class="header">
      <div class="header-inner">
        <router-link to="/" class="brand" aria-label="Task Manager home">
          <span class="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
              <path d="M4 12.5 9.5 18 20 6.5" stroke="white" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </span>
          <span class="brand-text">Task Manager</span>
          <span class="brand-spark" aria-hidden="true">✨</span>
        </router-link>

        <nav class="desktop-nav" aria-label="Primary">
          <router-link to="/" class="nav-link" :class="{ active: route.path === '/' }">All Tasks</router-link>
          <router-link to="/completed" class="nav-link" :class="{ active: route.path === '/completed' }">Completed</router-link>
        </nav>

        <div class="header-actions">
          <button
            type="button"
            class="theme-btn"
            :aria-pressed="isDark ? 'true' : 'false'"
            :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
            title="Toggle theme"
            @click="themeStore.toggle()"
          >
            <span aria-hidden="true">{{ isDark ? '☀️' : '🌙' }}</span>
          </button>

          <div v-if="user" class="user-chip">
            <span class="avatar" aria-hidden="true">{{ headerAvatar }}</span>
            <span class="username">{{ displayName }}</span>
            <button type="button" class="btn btn-secondary btn-sm logout-btn" @click="logout">Logout</button>
          </div>
          <router-link v-else to="/login" class="btn btn-primary btn-sm">Sign in</router-link>

          <button
            type="button"
            class="menu-btn"
            :aria-expanded="menuOpen ? 'true' : 'false'"
            aria-controls="mobile-menu"
            aria-label="Toggle navigation menu"
            @click="menuOpen = !menuOpen"
          >
            <svg v-if="!menuOpen" viewBox="0 0 20 20" width="20" height="20" fill="none" aria-hidden="true">
              <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
            </svg>
            <svg v-else viewBox="0 0 20 20" width="20" height="20" fill="none" aria-hidden="true">
              <path d="M5 5l10 10M15 5 5 15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
            </svg>
          </button>
        </div>
      </div>

      <div v-if="menuOpen" id="mobile-menu" class="mobile-menu">
        <nav aria-label="Mobile">
          <router-link to="/" class="mobile-link" :class="{ active: route.path === '/' }" @click="closeMenu">All Tasks</router-link>
          <router-link to="/completed" class="mobile-link" :class="{ active: route.path === '/completed' }" @click="closeMenu">Completed</router-link>
          <router-link v-if="!user" to="/login" class="mobile-link" :class="{ active: route.path === '/login' }" @click="closeMenu">Sign in</router-link>
          <button v-else type="button" class="mobile-link as-button" @click="logout">
            <span v-if="avatar" aria-hidden="true">{{ avatar }}</span> Logout ({{ displayName }})
          </button>
          <button type="button" class="mobile-link as-button" @click="themeStore.toggle()">
            {{ isDark ? '☀️ Switch to light mode' : '🌙 Switch to dark mode' }}
          </button>
        </nav>
      </div>
    </header>

    <main id="main" class="main">
      <div class="container">
        <router-view />
      </div>
    </main>

    <footer class="footer">
      <div class="container footer-inner">
        <p>© {{ new Date().getFullYear() }} Task Manager · Made for getting things done ✨</p>
        <p class="footer-muted">Tasks stay on this device. Signing out keeps your tasks. Theme: {{ isDark ? 'dark' : 'light' }}.</p>
      </div>
    </footer>

    <div v-if="showWelcome && user" class="overlay" role="presentation" @click="onOverlayClick">
      <div
        ref="dialogRef"
        class="dialog card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-title"
        aria-describedby="welcome-desc"
      >
        <div class="dialog-fun" aria-hidden="true">🎉</div>
        <h2 id="welcome-title" class="dialog-title">Welcome back, {{ displayName || 'there' }}</h2>
        <p id="welcome-desc" class="dialog-desc">Ready to crush it? Your tasks are saved locally.</p>
        <div class="dialog-actions">
          <button type="button" class="btn btn-primary" @click="dismissWelcome()">Let's go</button>
        </div>
      </div>
    </div>

    <ReminderDialog
      :queue="alarmQueue"
      @done="alarmDone"
      @snooze="alarmSnooze"
      @dismiss="alarmDismiss"
      @dismiss-all="alarmDismissAll"
    />
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: color-mix(in srgb, var(--color-surface) 88%, transparent);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--color-border);
}

.header-inner {
  max-width: var(--content-max);
  margin-inline: auto;
  min-height: var(--header-height);
  padding: 0.6rem 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  min-width: 0;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  text-decoration: none;
  color: var(--color-text);
  min-width: 0;
  margin-right: auto;
}

.brand-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: var(--gradient-brand);
  flex-shrink: 0;
  box-shadow: var(--shadow-sm);
  transition: transform var(--transition-bounce);
}

.brand:hover .brand-mark {
  transform: rotate(-8deg) scale(1.05);
}

.brand-text {
  font-weight: 800;
  font-size: 1.05rem;
  letter-spacing: -0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.brand-spark {
  font-size: 0.9rem;
  animation: float-slow 3s ease-in-out infinite;
}

@keyframes float-slow {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-3px);
  }
}

.desktop-nav {
  display: none;
  align-items: center;
  gap: 0.35rem;
  background: var(--color-surface-muted);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  padding: 0.2rem;
}

.nav-link {
  padding: 0.5rem 0.95rem;
  border-radius: var(--radius-full);
  color: var(--color-muted);
  font-weight: 700;
  font-size: 0.9rem;
  text-decoration: none;
  min-height: 40px;
  display: inline-flex;
  align-items: center;
}

.nav-link:hover {
  color: var(--color-text);
}

.nav-link.active {
  background: var(--color-surface);
  color: var(--color-text);
  box-shadow: var(--shadow-xs);
  border: 1px solid var(--color-border);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  margin-left: auto;
}

.theme-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: var(--radius-full);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  font-size: 1.15rem;
  cursor: pointer;
  transition: transform var(--transition-bounce), background-color var(--transition-fast);
}

.theme-btn:hover {
  transform: rotate(12deg) scale(1.05);
}

.user-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  min-width: 0;
}

/* Mobile shows just the avatar circle; name + logout live in the menu. */
.user-chip .username,
.user-chip .logout-btn {
  display: none;
}

.avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: var(--gradient-brand);
  color: #fff;
  font-size: 1.15rem;
  font-weight: 800;
  flex-shrink: 0;
}

.username {
  max-width: 130px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 700;
  font-size: 0.9rem;
}

.btn-sm {
  min-height: 40px;
  padding: 0.5rem 0.9rem;
  font-size: 0.88rem;
}

.menu-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text);
  cursor: pointer;
}

.mobile-menu {
  border-top: 1px solid var(--color-border);
  padding: 0.5rem 1rem 0.85rem;
  background: var(--color-surface);
}

.mobile-menu nav {
  display: grid;
  gap: 0.25rem;
  max-width: var(--content-max);
  margin-inline: auto;
}

.mobile-link {
  display: flex;
  align-items: center;
  min-height: 48px;
  padding: 0.7rem 0.85rem;
  border-radius: var(--radius-sm);
  color: var(--color-text);
  font-weight: 600;
  text-decoration: none;
  background: transparent;
  border: 0;
  font-size: 1rem;
  cursor: pointer;
  text-align: left;
  width: 100%;
  overflow-wrap: anywhere;
}

.mobile-link:hover {
  background: var(--color-surface-muted);
}

.mobile-link.active {
  background: var(--color-primary-soft);
  color: var(--color-primary-hover);
}

.main {
  flex: 1 1 auto;
  padding: 1.25rem 0 2rem;
  min-width: 0;
}

.footer {
  border-top: 1px solid var(--color-border);
  background: var(--color-surface);
  padding: 1rem 0;
}

.footer-inner {
  display: grid;
  gap: 0.2rem;
  font-size: 0.86rem;
  color: var(--color-muted);
}

.footer-muted {
  color: var(--color-faint);
  font-size: 0.82rem;
}

.overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(15, 23, 42, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.dialog {
  width: 100%;
  max-width: 420px;
  max-height: calc(100vh - 2rem);
  overflow: auto;
  padding: 1.6rem 1.4rem;
  text-align: center;
}

.dialog-fun {
  font-size: 2.4rem;
  animation: float-slow 2.4s ease-in-out infinite;
}

.dialog-title {
  font-size: 1.25rem;
  letter-spacing: -0.01em;
  overflow-wrap: anywhere;
  margin-top: 0.4rem;
}

.dialog-desc {
  margin-top: 0.4rem;
  color: var(--color-muted);
}

.dialog-actions {
  margin-top: 1.1rem;
  display: flex;
  justify-content: center;
}

@media (min-width: 768px) {
  .desktop-nav {
    display: inline-flex;
  }
  .user-chip .username {
    display: inline-block;
    vertical-align: middle;
  }
  .user-chip .logout-btn {
    display: inline-flex;
  }
  .menu-btn,
  .mobile-menu {
    display: none;
  }
  .brand {
    margin-right: 0;
  }
  .header-inner {
    gap: 1.2rem;
  }
  .header-actions {
    margin-left: auto;
  }
}
</style>
