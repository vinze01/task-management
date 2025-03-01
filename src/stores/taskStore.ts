import { defineStore } from 'pinia';

export interface Task {
  id: number;
  title: string;
  completed: boolean;
  date: string
}

export const useTaskStore = defineStore('taskStore', {
  state: () => ({
    tasks: JSON.parse(localStorage.getItem('tasks') || '[]') as Task[],
  }),
  actions: {
    addTask(title: string) {
      const newTask: Task = {
        id: Date.now(), title, completed: false, date: new Date().toLocaleString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        }),
      };
      this.tasks.push(newTask);
      this.saveTasks();
    },
    markTaskAsCompleted(id: number) {
      const task = this.tasks.find(t => t.id === id);
      if (task) {
        task.completed = true;
        this.saveTasks();
      }
    },
    deleteTask(id: number) {
      this.tasks = this.tasks.filter(t => t.id !== id);
      this.saveTasks();
    },
    saveTasks() {
      localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }
  }
});
