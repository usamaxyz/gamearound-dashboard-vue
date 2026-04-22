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

export default api;
