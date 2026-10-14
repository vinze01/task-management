<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useTaskStore, type Priority } from '@/stores/taskStore';
import TaskItem, { type TaskEditPatch } from '@/components/TaskItem.vue';
import Modal from '@/components/Modal.vue';
import QuestForm, { type QuestPayload } from '@/components/QuestForm.vue';
import PaginationControls from '@/components/PaginationControls.vue';
import { usePagination } from '@/composables/usePagination';

type Filter = 'all' | 'active' | 'completed';
type Sort = 'newest' | 'oldest' | 'title' | 'due' | 'priority';

const taskStore = useTaskStore();
const { tasks, totalCount, activeCount, completedCount, overdueCount, dueTodayCount, highPriorityCount, completionRate } =
  storeToRefs(taskStore);

const toast = ref('');
const search = ref('');
const filter = ref<Filter>('all');
const sort = ref<Sort>('newest');
const showQuestModal = ref(false);
const listTop = ref<HTMLElement | null>(null);
let toastTimer: number | undefined;

const CHEERS = ['Nice! +1 done 🎉', 'Crushed it! 💪', 'On a roll! 🚀', 'So satisfying! ✨', 'Task wizard! 🧙'];

const showToast = (msg: string): void => {
  toast.value = msg;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => (toast.value = ''), 2600);
}

const heroMessage = computed(() => {
  if (totalCount.value === 0) return 'Start your streak — tap ➕ for your first quest';
  if (activeCount.value === 0) return 'All clear! Time to celebrate 🎉';
  if (overdueCount.value > 0) return `${overdueCount.value} overdue — let's rescue them 🚨`;
  if (dueTodayCount.value > 0) return `${dueTodayCount.value} due today — you've got this ⚡`;
  if (completionRate.value >= 75) return 'Almost there, finishing strong 🌟';
  return 'Small steps, big wins 🌱';
});

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase();
  let list = [...tasks.value];
  if (filter.value === 'active') list = list.filter((t) => !t.completed);
  if (filter.value === 'completed') list = list.filter((t) => t.completed);
  if (q) list = list.filter((t) => t.title.toLowerCase().includes(q));
  const prioRank: Record<Priority, number> = { high: 0, medium: 1, low: 2 };
  switch (sort.value) {
    case 'oldest':
      list.sort((a, b) => a.id - b.id);
      break;
    case 'title':
      list.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case 'due':
      list.sort((a, b) => (a.dueDate ?? '9999') .localeCompare(b.dueDate ?? '9999'));
      break;
    case 'priority':
      list.sort((a, b) => prioRank[a.priority] - prioRank[b.priority]);
      break;
    default:
      list.sort((a, b) => b.id - a.id);
  }
  return list;
});

const pagination = usePagination(filtered, 10);

// Filters narrow the list — start back at page 1. Task toggles/deletes keep the page.
watch([filter, search, sort], () => pagination.reset());

const scrollToList = (): void => {
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  listTop.value?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
}

const onPage = (n: number): void => {
  pagination.goTo(n);
  scrollToList();
}

const onPageSize = (n: number): void => {
  pagination.pageSize.value = n;
  pagination.reset();
  scrollToList();
}

const openQuestModal = (): void => {
  showQuestModal.value = true;
}

const closeQuestModal = (): void => {
  showQuestModal.value = false;
}

const handleQuestSubmit = (payload: QuestPayload): void => {
  const created = taskStore.addTask(payload.title, {
    priority: payload.priority,
    dueDate: payload.dueDate,
    dueTime: payload.dueTime,
    reminderAt: payload.reminderAt,
  });
  if (created) {
    showToast(
      created.reminderAt
        ? `Quest added with alarm 🔔 “${created.title}”`
        : `Quest added: “${created.title}” ✨`,
    );
    closeQuestModal();
  }
}

const onToggle = (id: number): void => {
  const t = tasks.value.find((x) => x.id === id);
  const wasCompleted = t?.completed ?? false;
  taskStore.toggleTask(id);
  if (t && !wasCompleted) {
    showToast(CHEERS[Math.floor(Math.random() * CHEERS.length)] ?? 'Done! 🎉');
  }
}

const onRemove = (id: number): void => {
  const t = tasks.value.find((x) => x.id === id);
  taskStore.deleteTask(id);
  showToast(t ? `Poof! “${t.title}” deleted 🗑️` : 'Task deleted.');
}

const onUpdate = (id: number, patch: TaskEditPatch): void => {
  if (taskStore.updateTask(id, patch)) showToast('Quest updated ✏️');
}
</script>

<template>
  <section aria-labelledby="tasks-heading" class="page">
    <div class="hero card">
      <div class="hero-text">
        <p class="eyebrow">✨ Your quest board</p>
        <h1 id="tasks-heading" class="h1">My Tasks</h1>
        <p class="sub">{{ heroMessage }}</p>
        <div class="progress" role="group" aria-label="Completion progress">
          <div class="progress-track">
            <div class="progress-fill" :style="{ width: `${completionRate}%` }"></div>
          </div>
          <span class="progress-label">{{ completionRate }}% done</span>
        </div>
      </div>
      <div class="hero-mascot" aria-hidden="true">🚀</div>
    </div>

    <div class="stats" role="group" aria-label="Task summary — swipe sideways on mobile to see all" tabindex="0">
      <div class="stat card fun-total"><span class="stat-emoji" aria-hidden="true">🗂️</span><span class="stat-num">{{ totalCount }}</span><span class="stat-label">Total quests</span></div>
      <div class="stat card fun-active"><span class="stat-emoji" aria-hidden="true">⚡</span><span class="stat-num">{{ activeCount }}</span><span class="stat-label">Active</span></div>
      <div class="stat card fun-done"><span class="stat-emoji" aria-hidden="true">🎉</span><span class="stat-num">{{ completedCount }}</span><span class="stat-label">Completed</span></div>
      <div class="stat card fun-alert"><span class="stat-emoji" aria-hidden="true">⏰</span><span class="stat-num">{{ overdueCount }}</span><span class="stat-label">Overdue</span></div>
      <div class="stat card fun-fire"><span class="stat-emoji" aria-hidden="true">🔥</span><span class="stat-num">{{ highPriorityCount }}</span><span class="stat-label">High prio</span></div>
    </div>

    <div class="toolbar card">
      <div class="filters" role="group" aria-label="Filter tasks">
        <button type="button" :class="['chip', { active: filter === 'all' }]" :aria-pressed="filter === 'all'" @click="filter = 'all'">All ({{ totalCount }})</button>
        <button type="button" :class="['chip', { active: filter === 'active' }]" :aria-pressed="filter === 'active'" @click="filter = 'active'">Active ({{ activeCount }})</button>
        <button type="button" :class="['chip', { active: filter === 'completed' }]" :aria-pressed="filter === 'completed'" @click="filter = 'completed'">Done ({{ completedCount }})</button>
      </div>
      <div class="search-sort">
        <label class="sr-only" for="search">Search tasks</label>
        <input id="search" v-model="search" type="search" class="field-input" placeholder="🔍 Search quests…" autocomplete="off" />
        <label class="sr-only" for="sort">Sort tasks</label>
        <select id="sort" v-model="sort" class="field-input select">
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="title">Title A–Z</option>
          <option value="due">Due date</option>
          <option value="priority">Priority</option>
        </select>
      </div>
    </div>

    <div ref="listTop" class="list-anchor" tabindex="-1"></div>

    <div v-if="filtered.length === 0" class="card empty">
      <div class="empty-mascot" aria-hidden="true">{{ tasks.length === 0 ? '🗺️' : '🔍' }}</div>
      <h2 class="empty-title">{{ tasks.length === 0 ? 'No quests yet, adventurer!' : 'Nothing matches your search' }}</h2>
      <p class="empty-desc">
        {{ tasks.length === 0 ? 'Every hero starts somewhere. Create your first quest!' : 'Try a different search or filter — or create it as a new quest.' }}
      </p>
      <button type="button" class="btn btn-primary" @click="openQuestModal">➕ New quest</button>
    </div>

    <template v-else>
      <ul class="list" :aria-label="`Tasks, ${filtered.length} total`">
        <TaskItem
          v-for="task in pagination.paged.value"
          :key="task.id"
          :task="task"
          @toggle="onToggle"
          @remove="onRemove"
          @rename="(id, title) => onUpdate(id, { title, priority: task.priority, dueDate: task.dueDate, dueTime: task.dueTime, reminderAt: task.reminderAt })"
          @update="onUpdate"
        />
      </ul>

      <PaginationControls
        :page="pagination.page.value"
        :total-pages="pagination.totalPages.value"
        :page-size="pagination.pageSize.value"
        :range="pagination.range.value"
        :page-numbers="pagination.pageNumbers.value"
        @update:page="onPage"
        @update:page-size="onPageSize"
      />
    </template>

    <Modal v-if="showQuestModal" title="New quest" @close="closeQuestModal">
      <QuestForm @submit="handleQuestSubmit" @cancel="closeQuestModal" />
    </Modal>

    <button type="button" class="fab" aria-label="Create new quest" @click="openQuestModal">
      <span class="fab-icon" aria-hidden="true">＋</span>
      <span class="fab-label">New quest</span>
    </button>

    <div class="toast-stack" aria-live="polite">
      <div v-if="toast" class="toast" role="status"><span class="toast-emoji" aria-hidden="true">✨</span>{{ toast }}</div>
    </div>
  </section>
</template>

<style scoped>
.page {
  display: grid;
  gap: 1rem;
  min-width: 0;
}

.hero {
  position: relative;
  overflow: hidden;
  padding: 1.2rem 1.2rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  background: var(--color-surface);
}

.hero::after {
  content: '';
  position: absolute;
  inset: 0 0 auto 0;
  height: 5px;
  background: var(--gradient-brand);
}

.eyebrow {
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-primary-hover);
}

.h1 {
  font-size: 1.9rem;
  line-height: 1.1;
  letter-spacing: -0.03em;
}

.sub {
  color: var(--color-muted);
  margin-top: 0.25rem;
  font-weight: 600;
}

.hero-text {
  flex: 1 1 auto;
  min-width: 0;
}

.hero-mascot {
  font-size: 3rem;
  flex-shrink: 0;
  animation: float-slow 3s ease-in-out infinite;
  filter: drop-shadow(0 8px 16px rgba(124, 58, 237, 0.3));
}

.progress {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  margin-top: 0.8rem;
}

.progress-track {
  flex: 1 1 auto;
  height: 10px;
  border-radius: var(--radius-full);
  background: var(--color-border);
  overflow: hidden;
  min-width: 0;
}

.progress-fill {
  height: 100%;
  border-radius: var(--radius-full);
  background: var(--gradient-brand);
  transition: width 400ms cubic-bezier(0.34, 1.3, 0.64, 1);
}

.progress-label {
  font-size: 0.82rem;
  font-weight: 800;
  white-space: nowrap;
}

.stats {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(128px, 152px);
  gap: 0.6rem;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  padding-bottom: 0.3rem;
  scrollbar-width: thin;
}

.stat {
  scroll-snap-align: start;
  padding: 0.75rem 0.9rem;
  display: grid;
  gap: 0.05rem;
  min-width: 0;
  position: relative;
  overflow: hidden;
}

.stat::after {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
}

.fun-total::after {
  background: var(--accent-blue);
}

.fun-active::after {
  background: var(--accent-amber);
}

.fun-done::after {
  background: var(--accent-teal);
}

.fun-alert::after {
  background: var(--color-danger);
}

.fun-fire::after {
  background: var(--accent-pink);
}

.stat-emoji {
  font-size: 1.2rem;
}

.stat-num {
  font-size: 1.4rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.stat-label {
  color: var(--color-muted);
  font-size: 0.82rem;
  font-weight: 700;
}

.toolbar {
  padding: 0.85rem 1rem;
  display: grid;
  gap: 0.75rem;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.chip {
  min-height: 40px;
  padding: 0.45rem 0.8rem;
  border-radius: var(--radius-full);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-muted);
  font-weight: 800;
  font-size: 0.86rem;
  cursor: pointer;
}

.chip.active {
  background: var(--color-text);
  border-color: var(--color-text);
  color: var(--color-bg);
}

.search-sort {
  display: grid;
  gap: 0.6rem;
}

.select {
  cursor: pointer;
}

.list-anchor {
  scroll-margin-top: calc(var(--header-height) + 12px);
  outline: none;
}

.list {
  list-style: none;
  padding: 0;
  display: grid;
  gap: 0.6rem;
  min-width: 0;
}

.empty {
  padding: 2.2rem 1.2rem;
  text-align: center;
  display: grid;
  gap: 0.4rem;
  justify-items: center;
}

.empty-mascot {
  font-size: 2.8rem;
  animation: float-slow 3s ease-in-out infinite;
}

.empty-title {
  font-size: 1.1rem;
}

.empty-desc {
  color: var(--color-muted);
  max-width: 42ch;
}

@media (min-width: 640px) {
  .search-sort {
    grid-template-columns: 1fr 170px;
  }
  .stats {
    grid-auto-flow: row;
    grid-template-columns: repeat(5, 1fr);
    overflow: visible;
    padding-bottom: 0;
  }
}

@media (min-width: 768px) {
  .h1 {
    font-size: 2.1rem;
  }
}
</style>
