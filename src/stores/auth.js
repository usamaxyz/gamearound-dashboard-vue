import {defineStore} from 'pinia';
import {getCurrentUser, fetchAuthSession, signOut} from 'aws-amplify/auth';
import api from '@/services/api';
import router from '@/router';

let checkAuthPromise = null;

// Listen for storage changes (e.g. logout from another tab)
window.addEventListener('storage', (event) => {
  // If any Cognito related key is removed (cleared on logout)
  if (event.key && event.key.includes('CognitoIdentityServiceProvider') && !event.newValue) {
    const authStore = useAuthStore();
    if (authStore.isAuthenticated) {
      console.log('Detected logout in another tab, clearing local state...');
      authStore.logout();
    }
  }
});

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
      // If a check is already in progress, return the existing promise
      if (checkAuthPromise) {
        return checkAuthPromise;
      }

      checkAuthPromise = (async () => {
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
            // If profile fetch fails with 401, logout
            if (profError.response?.status === 401) {
              await this.logout();
            }
          }
        } catch (error) {
          console.log('User is not authenticated');
          this.user = null;
          this.session = null;
          this.profile = null;
          this.isAuthenticated = false;
        } finally {
          this.loading = false;
          checkAuthPromise = null; // Reset promise when done
        }
      })();

      return checkAuthPromise;
    },

    async logout() {
      try {
        await signOut();
      } catch (error) {
        console.error('Error signing out from Amplify: ', error);
      } finally {
        // Always clear local state even if signOut fails
        this.user = null;
        this.session = null;
        this.profile = null;
        this.isAuthenticated = false;
        
        // Redirect to login if we are not already there
        if (router.currentRoute.value.name !== 'login') {
          router.push({ name: 'login' });
        }
      }
    }
  },

  getters: {
    token: (state) => state.session?.tokens?.idToken?.toString(),
    userId: (state) => state.user?.userId,
    email: (state) => state.session?.tokens?.idToken?.payload?.email,
    name: (state) => state.profile?.user?.name || '',
    companyName: (state) => state.profile?.company?.name || '',
    totalUsers: (state) => state.profile?.stats?.totalUsers || 0,
    totalGames: (state) => state.profile?.stats?.totalGames || 0,
    hasPermission: (state) => (permission) => {
      return state.profile?.user?.permissions?.includes(permission) || false;
    }

  }
});
