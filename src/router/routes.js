import home from "@/views/home.vue";

export default [
    {
        path: '/',
        name: 'home',
        component: home,
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/about.vue'),
    },
    {
        path: '/:pathMatch(.*)*',
        name: 'not-found',
        component: () => import('../views/not_found.vue'),
    },
];
