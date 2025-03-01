import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: localStorage.getItem('user') || null,
    }),

    actions: {
        login(username: string) {
            this.user = username;
            localStorage.setItem('user', username);
        },
        logout() {
            this.user = null;
            localStorage.removeItem('user');
            localStorage.removeItem('tasks');
        },
        getUser() {
            return this.user || localStorage.getItem('user');
        }
    },
});
