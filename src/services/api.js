import axios from 'axios';
import { useAuthStore } from '@/stores/auth';

const api = axios.create({
    baseURL: 'https://gfuiuxg5me.execute-api.eu-central-1.amazonaws.com/stage',
    headers: {
        'Content-Type': 'application/json'
    }
});

// Interceptor to add auth token to every request
api.interceptors.request.use(async (config) => {
    const authStore = useAuthStore();
    
    // Only attach token if authenticated. 
    // If not authenticated, we don't send the Authorization header, 
    // and the request will fail naturally or be caught by guards.
    if (authStore.isAuthenticated) {
        const token = authStore.token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Interceptor to handle 401 Unauthorized responses
api.interceptors.response.use((response) => {
    return response;
}, async (error) => {
    const authStore = useAuthStore();
    
    if (error.response && error.response.status === 401) {
        // If we get a 401, it means the session is invalid or expired
        console.warn('Unauthorized request, logging out...');
        await authStore.logout();
    }
    
    return Promise.reject(error);
});

export const CLOUDFRONT_URL = 'https://du1ui0vdk1uj4.cloudfront.net';

export const getCloudFrontUrl = (url) => {
    if (!url) return '';
    // If it's already a cloudfront URL or doesn't look like an S3 URL, return as is
    if (url.includes('cloudfront.net') || !url.includes('s3')) return url;
    
    // Convert S3 URL to CloudFront URL
    // Format: https://bucket.s3.region.amazonaws.com/path/to/file
    try {
        const s3Pattern = /\.s3\.[a-z0-9-]+\.amazonaws\.com\//;
        const parts = url.split(s3Pattern);
        if (parts.length > 1) {
            return `${CLOUDFRONT_URL}/${parts[1]}`;
        }
    } catch (e) {
        console.warn('Failed to parse URL for CloudFront:', url);
    }
    
    return url;
};

export const isImageFile = (url) => {
    if (!url) return false;
    return /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(url);
};

export default api;
