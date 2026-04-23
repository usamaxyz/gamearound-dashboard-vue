import home from "@/views/home.vue";

export default [
    {
        path: '/login',
        name: 'login',
        component: () => import('../views/login.vue'),
        meta: { guest: true }
    },
    {
        path: '/confirm-password',
        name: 'confirm-password',
        component: () => import('../views/confirm-password.vue'),
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
        path: '/currencies',
        name: 'currencies',
        component: () => import('../views/currencies.vue'),
        meta: { auth: true, permission: 'manage_currencies' }
    },
    {
        path: '/config-catalog',
        name: 'config-catalog',
        component: () => import('../views/config-catalog/list.vue'),
        meta: { auth: true, permission: 'manage_config_catalog' }
    },
    {
        path: '/config-catalog/add',
        name: 'config-catalog-add',
        component: () => import('../views/config-catalog/form.vue'),
        meta: { auth: true, permission: 'manage_config_catalog' }
    },
    {
        path: '/config-catalog/edit/:category/:itemid',
        name: 'config-catalog-edit',
        component: () => import('../views/config-catalog/form.vue'),
        meta: { auth: true, permission: 'manage_config_catalog' }
    },
    {
        path: '/:pathMatch(.*)*',
        name: 'not-found',
        component: () => import('../views/not_found.vue'),
    },

];
