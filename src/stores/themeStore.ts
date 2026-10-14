import { defineStore } from 'pinia';

export type Theme = 'light' | 'dark';

function initialTheme(): Theme {
  try {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    // ignore
  }
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

export const useThemeStore = defineStore('theme', {
  state: () => ({
    theme: initialTheme() as Theme,
  }),
  actions: {
    apply() {
      try {
        document.documentElement.dataset.theme = this.theme;
        document.documentElement.style.colorScheme = this.theme;
        localStorage.setItem('theme', this.theme);
      } catch {
        // ignore
      }
    },
    toggle() {
      this.theme = this.theme === 'light' ? 'dark' : 'light';
      this.apply();
    },
    init() {
      this.apply();
      // Keep in sync if OS theme changes and user hasn't picked explicitly? Only when no saved pref.
      try {
        if (!localStorage.getItem('theme')) {
          const mq = window.matchMedia('(prefers-color-scheme: dark)');
          const onChange = (e: MediaQueryListEvent) => {
            this.theme = e.matches ? 'dark' : 'light';
            this.apply();
          };
          mq.addEventListener?.('change', onChange);
        }
      } catch {
        // ignore
      }
    },
  },
});
