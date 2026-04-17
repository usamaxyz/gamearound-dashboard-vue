import axios from 'axios';
import { useAuthStore } from '@/stores/auth';

const api = axios.create({
    baseURL: 'https://4wk6506a85.execute-api.eu-central-1.amazonaws.com/staging',
    headers: {
        'Content-Type': 'application/json'
    }
});

// Interceptor to add auth token to every request
api.interceptors.request.use(async (config) => {
    const authStore = useAuthStore();
    
    // Ensure we have a fresh session if possible
    if (!authStore.isAuthenticated) {
        await authStore.checkAuth();
    }

    const token = authStore.token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default api;
