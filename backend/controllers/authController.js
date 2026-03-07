const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
};

// @desc   Register user
// @route  POST /api/auth/signup
const signup = async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'Please provide name, email, and password' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
        return res.status(409).json({ success: false, message: 'Email already in use' });
    }

    const user = await User.create({ name, email, password });
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

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
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
