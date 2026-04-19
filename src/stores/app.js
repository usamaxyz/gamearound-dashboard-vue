import { defineStore } from 'pinia';

export const useAppStore = defineStore('app', {
    state: () => ({
        app_name: 'Gamearound',
        permissions: ['admin'],
    }),

    getters: {},
    actions: {},
});
