import {defineStore} from 'pinia';

export const useAppStore = defineStore('app', {
    state: () => ({
        app_name: 'Gamearound',
    }),
    getters: {},
    actions: {},
});
