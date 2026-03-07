import axios from 'axios';

const API = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
    timeout: 30000,
});

// Attach JWT token to every request
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Handle auth errors globally
API.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(err);
    }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
    signup: (data) => API.post('/auth/signup', data),
    login: (data) => API.post('/auth/login', data),
    getMe: () => API.get('/auth/me'),
};

// ── Interview ─────────────────────────────────────────────────────────────────
export const interviewAPI = {
    generateQuestions: (data) => API.post('/interview/generate-questions', data),
    evaluateAnswer: (data) => API.post('/interview/evaluate-answer', data),
    saveInterview: (data) => API.post('/interview/save', data),
    getHistory: () => API.get('/interview/history'),
    getInterview: (id) => API.get(`/interview/${id}`),
};

// ── Resume ────────────────────────────────────────────────────────────────────
export const resumeAPI = {
    analyzeResume: (formData) =>
        API.post('/resume/analyze', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    getHistory: () => API.get('/resume/history'),
    getResume: (id) => API.get(`/resume/${id}`),
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const dashboardAPI = {
    getDashboard: () => API.get('/dashboard'),
};

// ── Email ─────────────────────────────────────────────────────────────────────
export const emailAPI = {
    sendReport: (data) => API.post('/email/send-report', data),
};

export default API;
