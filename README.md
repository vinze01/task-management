# Task Management System

A playful quest-board SPA built with **Vue 3 + TypeScript + Vite**, using **Pinia** for state and **Vue Router** for navigation. Tasks, session, avatar, and theme persist in `localStorage` — no backend required.

## What it can do

### 1. Quest board (`src/views/TaskList.vue`)
- Hero card with dynamic message, completion progress bar, and five stat cards (total / active / completed / overdue / high-priority).
- **New quests via modal**: ➕ floating action button (bottom-right, always in reach) opens a `New quest` dialog (`src/components/Modal.vue` + `QuestForm.vue`) with title, priority picker (🌿 Low / 🔵 Med / 🔥 High), optional due date + due time, and optional alarm.
- Time without a date assumes today — handy for “Take my medicine at 8pm”.
- Toggle complete via checkbox (with celebration toasts), inline edit (title, priority, due date/time, alarm), two-click confirm delete.
- Filter (All / Active / Done), search, and sort (newest, oldest, title, due date, priority).
- **Pagination** (`src/composables/usePagination.ts` + `PaginationControls.vue`): 10 per page by default (10/20/50), page numbers, “Showing 1–10 of N” live status, smooth scroll back to the list on page change. Filters reset to page 1; toggles/deletes keep your page.
- Toasts (`aria-live`) confirm adds, completions, deletions, and edits.

### 2. Completed quests (`src/views/CompletedTasks.vue`)
- 🏆 Hall-of-fame hero with completion stats, same `TaskItem` cards (reopen, edit, delete), `Clear completed` bulk action, empty state with CTA back to the board, and the same pagination controls.

### 3. Priorities, due dates & alarms (`src/stores/taskStore.ts`)
- Each task stores: `id`, `title`, `completed`, `date` (created ISO), `priority` (`low|medium|high`), `dueDate` (`YYYY-MM-DD|null`), `dueTime` (`HH:MM|null`), `reminderAt` (alarm ISO|null), `reminderFired` (bool).
- Priority pills cycle Low → Med → High on click; due pills flag Overdue / Due today; 🔔 pills show the alarm time (muted `Rang · …` after ringing).
- **Alarms you set yourself**: pick any exact date + time per quest. While the app tab is open, a 10s scheduler (`src/composables/useReminders.ts`) rings with a chime (WebAudio, no assets) + phone buzz (Vibration API, Android) + an optional system notification (permission-gated) + an in-app alarm dialog.
- **Continuous ringing**: the chime + buzz repeat every 4 seconds until you ✅ Mark done, 😴 Snooze 10m, Dismiss, or Dismiss all. A 🔇 Mute sound toggle silences the loop while keeping the dialog.
- **Mobile helpers**: a Wake Lock request keeps the screen on while the board is open, and audio is unlocked on your first tap (browsers gate sound behind a gesture). Honest limit (also noted in the form): phones suspend JavaScript in backgrounded tabs and sleeping screens, so no web app can ring from a closed/locked phone — keep the tab open for medicine alarms.
- Editing a quest never silently re-arms a rung alarm — `updateTask` only resets the fired flag when the alarm time actually changes (minute precision, so snoozed second-precision times don't false-trigger).
- Old stored tasks migrate safely (default `medium` priority, no dates/alarms).

### 4. Password-free sign-in (`src/views/Login.vue`, `src/stores/authStore.ts`)
- Route `/login`: display name + optional adventurer avatar picker (🦊🐼🦄…) + generated CAPTCHA with a `New code` refresh button.
- No password — there's no backend to verify one. Inline validation (name required, CAPTCHA must match), loading state, honest demo copy.
- On success: `authStore.login(name, avatar)` → persists `user` (+ `avatar` if picked) → `router.push('/')`. Corrupt/foreign `user` values (e.g. a JSON blob from another app on the same origin) are normalized, never rendered raw.
- Avatar shows in the header (initial letter fallback) and survives logout; tasks are also preserved on logout.

### 5. App shell (`src/App.vue`)
- Sticky blurred header: gradient brand mark, `All Tasks` / `Completed` pill nav with active state, 🌙/☀️ **dark-mode toggle** (persisted, OS default, no-flash init in `main.ts`), avatar chip (avatar-only on mobile; name + Logout on desktop), hamburger menu with Escape-to-close.
- Global reminder scheduler + alarm dialog (`ReminderDialog.vue`) so alarms ring on any page.
- Welcome dialog once per session (`sessionStorage`), non-fixed footer, all navigation via Vue Router with reactive `storeToRefs` state.

### 6. Dark mode (`src/stores/themeStore.ts`, `src/assets/base.css`)
- Full light/dark token themes via `[data-theme]`, every page/form/modal/dialog follows the selected theme. Toggle in the header and the mobile menu.

### Persistence
- `localStorage 'tasks'`: `Task[]` JSON (see model above).
- `localStorage 'user'`: display-name string. `localStorage 'avatar'`: emoji string. `localStorage 'theme'`: `light|dark`.
- `sessionStorage 'welcome-dismissed'`: welcome dialog shown-once flag.
- Logout clears only `user` — tasks and avatar are preserved.

## Tech stack

- `vue@^3.5.13`, `vue-router@^4.5.0`, `pinia@^3.0.1`
- `vite@^6.1.0`, `@vitejs/plugin-vue`, `vite-plugin-vue-devtools`
- `typescript@~5.7.3`, `vue-tsc`, `@vue/tsconfig`
- `@tailwindcss/postcss`, `tailwindcss@^4.0.9`, `postcss`, `autoprefixer` (installed; UI uses custom CSS design tokens in `src/assets/base.css` + `main.css` instead — kept intentionally for a lightweight, consistent theme system)
- Path alias `@` → `./src` (`vite.config.ts`, `tsconfig.app.json`)

## Project structure

```
task-management/
├── index.html              # Title: Task Management System, mount #app
├── vite.config.ts          # Vue plugin, devtools, @ alias
├── tsconfig.app.json / tsconfig.json / tsconfig.node.json
├── package.json            # dev, build, preview, type-check scripts
├── public/                 # favicon.ico
└── src/
    ├── main.ts             # theme pre-apply (no flash) + createApp + Pinia + Router
    ├── App.vue             # header, router-view, welcome + alarm dialogs, footer
    ├── router/index.ts     # / → TaskList, /completed → CompletedTasks, /login → Login (+ catch-all, doc titles)
    ├── stores/
    │   ├── taskStore.ts    # Task model, CRUD, priorities, due dates, alarms, getters
    │   ├── authStore.ts    # user + avatar session, AVATARS, display-name hardening
    │   └── themeStore.ts   # light/dark theme + persistence
    ├── composables/
    │   ├── useReminders.ts # alarm scheduler, chime, notifications, permission hook
    │   └── usePagination.ts# page/pageSize/paged/range logic
    ├── components/
    │   ├── TaskItem.vue         # checkbox, pills, inline edit, confirm delete
    │   ├── Modal.vue            # accessible dialog (trap, Escape, restore focus)
    │   ├── QuestForm.vue        # new-quest form (owns its state + validation)
    │   ├── ReminderDialog.vue   # ringing-alarm queue dialog
    │   └── PaginationControls.vue
    ├── views/
    │   ├── TaskList.vue         # hero, stats, toolbar, paged list, FAB + modal
    │   ├── CompletedTasks.vue   # hall of fame, paged list
    │   └── Login.vue            # name + avatar + CAPTCHA (no password)
    ├── components/icons/   # default Vite icons (unused by views)
    └── assets/             # main.css (primitives, modal, FAB, toasts), base.css (theme tokens)
```

## Routes

| Path | Component | Purpose |
|------|-----------|---------|
| `/` | `TaskList.vue` | Quest board: modal create, filters/search/sort, paged list |
| `/completed` | `CompletedTasks.vue` | Completed-only paged list, clear completed |
| `/login` | `Login.vue` | Name + avatar + CAPTCHA sign-in (no password) |

No navigation guards — routes are currently public.

## Getting started

Prerequisites: Node.js >= 18 (22 recommended per `@tsconfig/node22`), npm >= 7.

```bash
git clone <your-repo-url>
cd task-management
npm install
npm run dev
```

Open the Vite URL (default `http://localhost:5173`).

### Scripts (`package.json`)

```bash
npm run dev         # vite dev server
npm run build       # type-check + vite build (run-p type-check build-only)
npm run build-only  # vite build only
npm run type-check  # vue-tsc --build
npm run preview     # vite preview built app
```

### Recommended IDE

VS Code + Volar (disable Vetur). See `.vscode/extensions.json`.

## Usage walkthrough

1. Go to `/login`, enter any name, optionally pick an avatar, solve the CAPTCHA → Start questing.
2. You land on `/`, see the welcome dialog once per session; header shows your avatar + name (avatar-only on mobile).
3. Tap ➕ (FAB, bottom-right) to create a quest in the modal — try priority + due time + alarm, e.g. “Take my medicine” with an alarm 2 minutes out.
4. Toggle complete via checkbox, edit via pencil (alarm shows a status hint: armed / already rang), delete via trash (click twice). Search / filter / sort / paginate as the list grows.
5. When the alarm time arrives (tab open): chime + system notification (if enabled) + alarm dialog → Mark done / Snooze 10m / Dismiss.
6. Check `/completed` for done items; reopen, edit, delete, or Clear completed.
7. Toggle 🌙/☀️ anytime — theme persists. Logout → session cleared, tasks + avatar preserved → `/login`.

## Known limitations / ideas

- No router auth guard; all routes are public demo pages.
- Alarms fire only while the app tab is open (no backend/workers); they ring continuously until actioned, with mute + snooze. System notifications need permission, sound needs one prior tap (browser autoplay policy), buzz needs Android, and a locked/sleeping phone suspends all page JS (OS-level limit) — Wake Lock mitigates this while the board is visible.
- No per-user data, no sharing/sync, no recurring tasks/alarms.
- CAPTCHA is client-only; no real backend auth exists (and that's why there's no password field).
- No tests, no lint, no LICENSE file.
- Styling is custom CSS design tokens; Tailwind packages are installed but intentionally unused.

## Contributing

1. Fork, `git checkout -b feature/your-feature`
2. Commit, push, open PR.

## License

No license file specified. Add `LICENSE` (e.g. MIT) if you intend to open-source.
