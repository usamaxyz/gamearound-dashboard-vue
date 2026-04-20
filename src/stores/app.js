import { defineStore } from 'pinia';

export const useAppStore = defineStore('app', {
    state: () => ({
        app_name: 'Gamearound',
        version: '1.0.0',
        permissions: ['admin', 'manage_users'],
    }),

    getters: {},
    actions: {},
});
