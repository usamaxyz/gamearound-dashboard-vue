import { defineStore } from 'pinia';
import { getCurrentUser, fetchAuthSession, signOut } from 'aws-amplify/auth';
import api from '@/services/api';

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: null,
        session: null,
        profile: null,
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

                // Fetch extended profile from DynamoDB
                try {
                    const res = await api.get('/profile');
                    this.profile = res.data;
                } catch (profError) {
                    console.error('Failed to fetch profile:', profError);
                }
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
                this.profile = null;
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
        name: (state) => state.profile?.user?.name || '',
        companyName: (state) => state.profile?.company?.name || '',
    }
});
