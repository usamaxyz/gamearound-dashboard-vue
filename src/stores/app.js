import { defineStore } from 'pinia';

export const useAppStore = defineStore('app', {
    state: () => ({
        app_name: 'Gamearound',
        version: '1.0.2',
        permissions: ['admin', 'manage_users', 'manage_games', 'manage_currencies'],
    }),

    getters: {},
    actions: {},
});
