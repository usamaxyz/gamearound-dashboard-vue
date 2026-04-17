import { defineStore } from 'pinia';
import { getCurrentUser, fetchAuthSession, signOut } from 'aws-amplify/auth';

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: null,
        session: null,
        isAuthenticated: false,
        loading: true
    }),

    actions: {
        async checkAuth() {
            this.loading = true;
            try {
                const user = await getCurrentUser();
                const session = await fetchAuthSession();
                this.user = user;
                this.session = session;
                this.isAuthenticated = true;
            } catch (error) {
                console.log('User is not authenticated');
                this.user = null;
                this.session = null;
                this.isAuthenticated = false;
            } finally {
                this.loading = false;
            }
        },

        async logout() {
            try {
                await signOut();
                this.user = null;
                this.session = null;
                this.isAuthenticated = false;
            } catch (error) {
                console.error('Error signing out: ', error);
            }
        }
    },

    getters: {
        token: (state) => state.session?.tokens?.idToken?.toString(),
        userId: (state) => state.user?.userId,
        email: (state) => state.session?.tokens?.idToken?.payload?.email,
        companyId: (state) => state.session?.tokens?.idToken?.payload?.['custom:company_id'],
    }
});
