<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useTaskStore } from '@/stores/taskStore';
import TaskItem, { type TaskEditPatch } from '@/components/TaskItem.vue';
import PaginationControls from '@/components/PaginationControls.vue';
import { usePagination } from '@/composables/usePagination';

const taskStore = useTaskStore();
const { completedTasks, completedCount, totalCount, completionRate } = storeToRefs(taskStore);
const toast = ref('');
const listTop = ref<HTMLElement | null>(null);
let toastTimer: number | undefined;

const showToast = (msg: string): void => {
  toast.value = msg;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => (toast.value = ''), 2600);
}

const sorted = computed(() => [...completedTasks.value].sort((a, b) => b.id - a.id));
const pagination = usePagination(sorted, 10);

watch(sorted, () => {
  if (pagination.page.value > pagination.totalPages.value) {
    pagination.goTo(pagination.totalPages.value);
  }
});

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

const onToggle = (id: number): void => {
  taskStore.toggleTask(id);
  showToast('Back to active — no shame! 💪');
}

const onRemove = (id: number): void => {
  taskStore.deleteTask(id);
  showToast('Cleared from the hall of fame 🧹');
}

const onUpdate = (id: number, patch: TaskEditPatch): void => {
  if (taskStore.updateTask(id, patch)) showToast('Task updated ✏️');
}

const clearAll = (): void => {
  taskStore.clearCompleted();
  showToast('Hall of fame wiped clean ✨');
}
</script>

<template>
  <section aria-labelledby="completed-heading" class="page">
    <div class="hero card">
      <div class="hero-text">
        <p class="eyebrow">🏆 Hall of fame</p>
        <h1 id="completed-heading" class="h1">Completed Tasks</h1>
        <p class="sub">
          {{ completedCount === 0 ? 'Finished quests will shine here.' : `${completedCount} of ${totalCount} done · ${completionRate}% complete. Legendary!` }}
        </p>
      </div>
      <div class="hero-mascot" aria-hidden="true">🏆</div>
    </div>

    <div v-if="completedCount > 0" class="head-actions">
      <button type="button" class="btn btn-secondary" @click="clearAll">🧹 Clear completed</button>
      <router-link to="/" class="btn btn-primary">➕ Add more quests</router-link>
    </div>

    <div ref="listTop" class="list-anchor" tabindex="-1"></div>

    <div v-if="sorted.length === 0" class="card empty">
      <div class="empty-mascot" aria-hidden="true">🌱</div>
      <h2 class="empty-title">No victories yet</h2>
      <p class="empty-desc">Complete a quest from All Tasks and it will earn its trophy here.</p>
      <router-link to="/" class="btn btn-primary">⚔️ Go to quests</router-link>
    </div>

    <template v-else>
      <ul class="list" aria-label="Completed tasks">
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
  padding: 1.2rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.hero::after {
  content: '';
  position: absolute;
  inset: 0 0 auto 0;
  height: 5px;
  background: linear-gradient(135deg, #f59e0b, #ec4899, #7c3aed);
}

.eyebrow {
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-warning-text);
}

.h1 {
  font-size: 1.7rem;
  letter-spacing: -0.02em;
  line-height: 1.15;
}

.sub {
  color: var(--color-muted);
  margin-top: 0.2rem;
  font-weight: 600;
}

.hero-text {
  flex: 1 1 auto;
  min-width: 0;
}

.hero-mascot {
  font-size: 3rem;
  animation: float-slow 3s ease-in-out infinite;
}

.head-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
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
}

.empty {
  padding: 2.4rem 1.25rem;
  display: grid;
  gap: 0.5rem;
  justify-items: center;
  text-align: center;
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
  max-width: 44ch;
}
</style>
