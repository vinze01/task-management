import { defineStore } from 'pinia';

export interface Task {
  id: number;
  title: string;
  completed: boolean;
  date: string;
}

export const useTaskStore = defineStore('taskStore', {
  state: () => ({
    tasks: JSON.parse(localStorage.getItem('tasks') || '[]') as Task[],
  }),
  actions: {
    addTask: (title: any) => {
      const newTask = {
        id: Date.now(),
        title,
        completed: false,
        date: new Date().toLocaleString('en-US', {
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
      useTaskStore().tasks.push(newTask);
      useTaskStore().saveTasks();
    },
    markTaskAsCompleted: (id: any) => {
      const task = useTaskStore().tasks.find((t: { id: any; }) => t.id === id);
      if (task) {
        task.completed = true;
        useTaskStore().saveTasks();
      }
    },
    deleteTask: (id: any) => {
      useTaskStore().tasks = useTaskStore().tasks.filter((t: { id: any; }) => t.id !== id);
      useTaskStore().saveTasks();
    },
    saveTasks: () => {
      localStorage.setItem('tasks', JSON.stringify(useTaskStore().tasks));
    }
  }
});
