<script setup lang="ts">
import { PAGE_SIZES } from '@/composables/usePagination';

defineProps<{
  page: number;
  totalPages: number;
  pageSize: number;
  range: string;
  pageNumbers: number[];
}>();

const emit = defineEmits<{
  (e: 'update:page', n: number): void;
  (e: 'update:pageSize', n: number): void;
}>();
</script>

<template>
  <nav v-if="totalPages > 1 || range" class="pager card" aria-label="Task list pages">
    <p class="pager-range" role="status" aria-live="polite">{{ range }}</p>
    <div class="pager-row">
      <div class="pager-pages">
        <button
          type="button"
          class="pager-btn"
          :disabled="page <= 1"
          aria-label="Previous page"
          @click="emit('update:page', page - 1)"
        >
          ← Prev
        </button>
        <button
          v-for="n in pageNumbers"
          :key="n"
          type="button"
          :class="['pager-num', { active: n === page }]"
          :aria-label="`Page ${n}`"
          :aria-current="n === page ? 'page' : undefined"
          @click="emit('update:page', n)"
        >
          {{ n }}
        </button>
        <button
          type="button"
          class="pager-btn"
          :disabled="page >= totalPages"
          aria-label="Next page"
          @click="emit('update:page', page + 1)"
        >
          Next →
        </button>
      </div>
      <label class="pager-size">
        <span class="pager-size-label">Per page</span>
        <select
          :value="pageSize"
          class="field-input pager-select"
          aria-label="Tasks per page"
          @change="emit('update:pageSize', Number(($event.target as HTMLSelectElement).value))"
        >
          <option v-for="s in PAGE_SIZES" :key="s" :value="s">{{ s }}</option>
        </select>
      </label>
    </div>
  </nav>
</template>

<style scoped>
.pager {
  padding: 0.8rem 1rem;
  display: grid;
  gap: 0.6rem;
}

.pager-range {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--color-muted);
}

.pager-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
}

.pager-pages {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
}

.pager-btn,
.pager-num {
  min-width: 44px;
  min-height: 44px;
  padding: 0.5rem 0.7rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text);
  font-weight: 800;
  font-size: 0.86rem;
  cursor: pointer;
}

.pager-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.pager-btn:not(:disabled):hover,
.pager-num:not(.active):hover {
  background: var(--color-surface-muted);
  border-color: var(--color-border-strong);
}

.pager-num.active {
  background: var(--gradient-brand);
  border-color: transparent;
  color: #fff;
}

.pager-size {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.pager-size-label {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--color-muted);
}

.pager-select {
  width: auto;
  min-height: 44px;
  cursor: pointer;
}
</style>
