import { createRouter, createWebHistory } from 'vue-router';
import TaskList from '../views/TaskList.vue';
import CompletedTasks from '../views/CompletedTasks.vue';
import Login from '../views/Login.vue';


const routes = [
  { path: '/', component: TaskList },
  { path: '/completed', component: CompletedTasks },
  { path: '/login', component: Login },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
