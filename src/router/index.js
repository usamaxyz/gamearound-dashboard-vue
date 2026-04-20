import {createRouter, createWebHistory} from 'vue-router';
import routes from './routes.js';
import { useAuthStore } from '@/stores/auth';


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

router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore()
    
    // Check session on every navigation if not loaded
    if (authStore.loading) {
        await authStore.checkAuth()
    }

    const isAuthenticated = authStore.isAuthenticated

    if (to.meta.auth && !isAuthenticated) {
        // Redirect to login if path requires auth and user is not authenticated
        next({ name: 'login' })
    } else if (to.meta.guest && isAuthenticated) {
        // Redirect to home if path is for guests only and user is authenticated
        next({ name: 'home' })
    } else if (to.meta.permission && !authStore.hasPermission(to.meta.permission)) {
        // Redirect to home if user lacks required permission
        next({ name: 'home' })
    } else {
        next()
    }
})

export default router;

