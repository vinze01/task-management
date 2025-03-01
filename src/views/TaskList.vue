<script setup lang="ts">
import { ref } from 'vue';
import { useTaskStore } from '@/stores/taskStore';

const taskStore = useTaskStore();
const newTask = ref('');
const errorMessage = ref('');

const addTask = () => {
  if (newTask.value.trim() === '') {
    errorMessage.value = 'Task cannot be empty!';
    return;
  }

  taskStore.addTask(newTask.value);
  newTask.value = '';
  errorMessage.value = '';
};

const deleteTask = (taskId: number) => {
  taskStore.deleteTask(taskId);
};
</script>

<template>
  <div class="tasks-container">
    <h1 class="title">All Tasks</h1>

    <div class="task-input-container">
      <input 
        v-model="newTask" 
        placeholder="Enter task" 
        class="task-input"
        @keyup.enter="addTask"
      />
      <button 
        @click="addTask" 
        class="add-task-button"
        :disabled="newTask.trim() === ''">
        Add Task
      </button>
    </div>

    <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

    <ul class="task-list">
      <li 
        v-for="task in taskStore.tasks" 
        :key="task.id" 
        class="task-item">
        <span :class="{ 'completed-task': task.completed }" class="task-title">
          {{ task.title }}
        </span>

        <div>
          <span class="task-date">{{ task.date }}</span>
          <button 
            @click="taskStore.markTaskAsCompleted(task.id)" 
            class="mark-done-button">
            {{ task.completed ? "Completed" : "✔ Mark as Done" }}
          </button>
          <button 
            @click="deleteTask(task.id)" 
            class="delete-task-button">
            ❌ Delete
          </button>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.tasks-container {
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

.task-input-container {
  display: flex;
  margin-bottom: 16px;
}

.task-input {
  padding: 12px;
  border: 1px solid #ccc;
  border-radius: 8px 0 0 8px;
  width: 100%;
  font-size: 1rem;
}

.add-task-button {
  padding: 12px;
  background-color: #4A90E2;
  color: white;
  border-radius: 0 8px 8px 0;
  font-size: 1rem;
  cursor: pointer;
  border: none;
  transition: background-color 0.3s;
}

.add-task-button:hover {
  background-color: #357ABD;
}

.add-task-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.error-message {
  color: red;
  font-size: 0.875rem;
  margin-top: 8px;
}

.task-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.task-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background-color: #f4f4f4;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 12px;
}

.task-title {
  font-size: 1.125rem;
  color: black;
}

.completed-task {
  text-decoration: line-through;
  color: #777;
}

.mark-done-button {
  color: #4CAF50;
  font-weight: bold;
  border: none;
  background-color: transparent;
  cursor: pointer;
}

.mark-done-button:hover {
  color: #388E3C;
}

.delete-task-button {
  color: #E04F5F;
  font-weight: bold;
  border: none;
  background-color: transparent;
  cursor: pointer;
  margin-left: 10px;
}

.delete-task-button:hover {
  color: #D32F2F;
}

.task-date {
  font-size: 0.875rem;
  color: #777;
  margin-right: 20px;
}
</style>
