import home from "@/views/home.vue";

export default [
    {
        path: '/login',
        name: 'login',
        component: () => import('../views/login.vue'),
        meta: { guest: true }
    },
    {
        path: '/',
        name: 'home',
        component: home,
        meta: { auth: true }
    },
    {
        path: '/users',
        name: 'users',
        component: () => import('../views/users.vue'),
        meta: { auth: true, permission: 'manage_users' }
    },
    {
        path: '/games',
        name: 'games',
        component: () => import('../views/games.vue'),
        meta: { auth: true, permission: 'manage_games' }
    },
    {
        path: '/:pathMatch(.*)*',
        name: 'not-found',
        component: () => import('../views/not_found.vue'),
    },

];
