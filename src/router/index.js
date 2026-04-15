import {createRouter, createWebHistory} from 'vue-router';
import routes from './routes.js';

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    scrollBehavior(to, from, savedPosition) {
        if (savedPosition) {
            // restore scroll when using browser back/forward
            return savedPosition
        }

        if (to.hash) {
            return {
                el: to.hash,
                behavior: 'smooth',
            }
        }

        // default: scroll to top
        return {top: 0, behavior: 'smooth'}
    },
    routes: routes,
})

export default router;
