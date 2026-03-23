require('dotenv').config();
require('express-async-errors');

// ── Validate AI keys on startup ───────────────────────────────────────────────
const { validateKeys } = require('./utils/llm');
const keysOk = validateKeys();
if (keysOk) console.log(`✅ LLM provider ready: ${(process.env.LLM_PROVIDER || 'groq').toUpperCase()} (${process.env.GROQ_MODEL || process.env.OPENAI_MODEL || process.env.GEMINI_MODEL || 'default model'})`);

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

// ── Routes ───────────────────────────────────────────────────────────────────
const authRoutes = require('./routes/auth');
const interviewRoutes = require('./routes/interview');
const resumeRoutes = require('./routes/resume');
const dashboardRoutes = require('./routes/dashboard');
const emailRoutes = require('./routes/email');

const app = express();

// ── Connect to MongoDB ───────────────────────────────────────────────────────
connectDB();

// ── Security Headers (Helmet) ─────────────────────────────────────────────────
app.use(helmet());

// ── CORS ─────────────────────────────────────────────────────────────────────
const isDev = (process.env.NODE_ENV || 'development') === 'development';

const allowedOrigins = [
    process.env.CLIENT_URL,             // set in Render env vars
    'https://ai-voice-interview.vercel.app',
    'https://ai-interview-gules-nine.vercel.app',
    'https://ai-interview-h12f.onrender.com',
].filter(Boolean);

app.use(
    cors({
        origin: (origin, callback) => {
            // Allow requests with no Origin header (health checks, curl, server-to-server).
            // These cannot be browser cross-origin attacks — browsers always send Origin.
            if (!origin) return callback(null, true);

            // In development: allow ALL localhost ports (5173, 5174, 5175, etc.)
            if (isDev && /^https?:\/\/localhost:\d+$/.test(origin)) {
                return callback(null, true);
            }

            // In production: strict whitelist only
            if (allowedOrigins.includes(origin)) return callback(null, true);

            console.warn(`🚫 CORS blocked origin: ${origin}`);
            callback(new Error(`CORS: origin '${origin}' not allowed`));
        },
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
        maxAge: 86400, // Cache preflight for 24 h
    })
);

// ── Rate Limiting ─────────────────────────────────────────────────────────────
// General API limiter — 100 requests per 15 minutes per IP
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,   // Return rate-limit info in RateLimit-* headers
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again later.' },
});

// Stricter limiter for auth endpoints to prevent brute-force
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many authentication attempts, please try again later.' },
});

app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Health Check ─────────────────────────────────────────────────────────────
app.get(['/health', '/api/health'], (req, res) => {
    res.json({ success: true, message: 'AI Interview API is running 🚀', timestamp: new Date().toISOString() });
});

// ── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/email', emailRoutes);

// ── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('❌ Error:', err.message);

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map((e) => e.message);
        return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    // Duplicate key (MongoDB)
    if (err.code === 11000) {
        return res.status(409).json({ success: false, message: 'Duplicate entry — resource already exists' });
    }
    // Multer - file too large
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'File too large. Maximum size is 10MB.' });
    }
    // LLM errors (invalid key, rate limit, etc.) have a statusCode set
    const statusCode = err.statusCode || err.status || 500;
    // Leak error message temporarily to debug Render 500 error
    const message = err.message || 'Internal server error';
    res.status(statusCode).json({ success: false, message, stack: err.stack });
});

// 404
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

module.exports = app;
