<script setup lang="ts">
import { useTaskStore } from '@/stores/taskStore';
import { computed } from 'vue';

const taskStore = useTaskStore();
const completedTasks = computed(() => taskStore.tasks.filter(task => task.completed));
</script>

<template>
  <div class="completed-tasks-container">
    <h1 class="title">Completed Tasks</h1>

    <div v-if="completedTasks.length === 0" class="no-tasks">
      No completed tasks yet. Keep going! 🚀
    </div>

    <ul v-else class="task-list">
      <li 
        v-for="task in completedTasks" 
        :key="task.id" 
        class="task-item">
        ✅ {{ task.title }}
      </li>
    </ul>
  </div>
</template>

<style scoped>
.completed-tasks-container {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.title {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 16px;
  color: #333;
}

.no-tasks {
  color: #777;
  text-align: center;
}

.task-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.task-item {
  padding: 16px;
  background-color: #d1f7d5;
  color: #4f9b3b;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  font-size: 1.125rem;
  margin-bottom: 12px;
}
</style>
