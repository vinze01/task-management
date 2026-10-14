import { ref, computed, watch, type Ref, type ComputedRef } from 'vue';

export const PAGE_SIZES = [10, 20, 50] as const;

export interface Pagination<T> {
  page: Ref<number>;
  pageSize: Ref<number>;
  total: ComputedRef<number>;
  totalPages: ComputedRef<number>;
  paged: ComputedRef<T[]>;
  range: ComputedRef<string>;
  pageNumbers: ComputedRef<number[]>;
  reset: () => void;
  goTo: (n: number) => void;
}

/** Client-side pagination for long lists. Call `reset()` when filters/search/sort change. */
export function usePagination<T>(items: Ref<readonly T[]>, initialSize = 10): Pagination<T> {
  const page = ref(1);
  const pageSize = ref<number>(initialSize);

  const total = computed(() => items.value.length);
  const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)));

  const safePage = computed(() => Math.min(Math.max(1, page.value), totalPages.value));

  const paged = computed(() => {
    const start = (safePage.value - 1) * pageSize.value;
    return [...items.value].slice(start, start + pageSize.value);
  });

  const range = computed(() => {
    if (total.value === 0) return '';
    const start = (safePage.value - 1) * pageSize.value + 1;
    const end = Math.min(safePage.value * pageSize.value, total.value);
    return `Showing ${start}–${end} of ${total.value}`;
  });

  const pageNumbers = computed(() => {
    const totalP = totalPages.value;
    const cur = safePage.value;
    const windowSize = 5;
    let start = Math.max(1, cur - Math.floor(windowSize / 2));
    const end = Math.min(totalP, start + windowSize - 1);
    start = Math.max(1, end - windowSize + 1);
    const out: number[] = [];
    for (let i = start; i <= end; i++) out.push(i);
    return out;
  });

  function reset() {
    page.value = 1;
  }

  function goTo(n: number) {
    page.value = Math.min(Math.max(1, n), totalPages.value);
  }

  watch([pageSize, totalPages], () => {
    if (page.value > totalPages.value) page.value = totalPages.value;
  });

  return { page, pageSize, total, totalPages, paged, range, pageNumbers, reset, goTo };
}
