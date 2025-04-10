import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: localStorage.getItem('user') || null,
    }),

    actions: {
        login: (username: string) => {
            useAuthStore().user = username;
            localStorage.setItem('user', username);
        },
        logout: () => {
            useAuthStore().user = null;
            localStorage.removeItem('user');
            localStorage.removeItem('tasks');
        },
        getUser: () => useAuthStore().user || localStorage.getItem('user'),
    },
});
