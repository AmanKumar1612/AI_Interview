const User = require('../models/User');
const jwt = require('jsonwebtoken');

// ── Helpers ───────────────────────────────────────────────────────────────────
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
};

// Password must be 8+ chars with at least: one uppercase, one lowercase, one digit, one special char
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

// @desc   Register user
// @route  POST /api/auth/signup
const signup = async (req, res) => {
    const { name, email, password } = req.body;

    // ── Basic presence check ──────────────────────────────────────────────────
    if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'Please provide name, email, and password' });
    }

    // ── Field length guards (before hitting DB) ───────────────────────────────
    if (name.length > 100) {
        return res.status(400).json({ success: false, message: 'Name must be at most 100 characters' });
    }
    if (email.length > 254) {
        return res.status(400).json({ success: false, message: 'Email must be at most 254 characters' });
    }

    // ── Password strength ─────────────────────────────────────────────────────
    if (!PASSWORD_REGEX.test(password)) {
        return res.status(400).json({
            success: false,
            message: 'Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character',
        });
    }

    // Normalize email (lowercase + trim) before lookup to avoid case-bypass
    const normalizedEmail = email.toLowerCase().trim();

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
        return res.status(409).json({ success: false, message: 'Email already in use' });
    }

    const user = await User.create({ name: name.trim(), email: normalizedEmail, password });
    const token = generateToken(user._id);

    res.status(201).json({
        success: true,
        token,
        user: { id: user._id, name: user.name, email: user.email, createdAt: user.createdAt },
    });
};

// @desc   Login user
// @route  POST /api/auth/login
const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    // Normalize before lookup
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
        // Same message for both cases — don't reveal which one was wrong
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);

    res.json({
        success: true,
        token,
        user: { id: user._id, name: user.name, email: user.email, createdAt: user.createdAt },
    });
};

// @desc   Get current user
// @route  GET /api/auth/me
const getMe = async (req, res) => {
    res.json({ success: true, user: req.user });
};

module.exports = { signup, login, getMe };
