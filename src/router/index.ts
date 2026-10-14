import { createRouter, createWebHistory } from 'vue-router';
import TaskList from '../views/TaskList.vue';
import CompletedTasks from '../views/CompletedTasks.vue';
import Login from '../views/Login.vue';

const routes = [
  { path: '/', name: 'tasks', component: TaskList, meta: { title: 'My Tasks' } },
  { path: '/completed', name: 'completed', component: CompletedTasks, meta: { title: 'Completed Tasks' } },
  { path: '/login', name: 'login', component: Login, meta: { title: 'Sign in' } },
  { path: '/:pathMatch(.*)*', redirect: '/' },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});

router.afterEach((to) => {
  const title = (to.meta.title as string | undefined) ?? 'Task Manager';
  document.title = `${title} · Task Manager`;
});

export default router;
