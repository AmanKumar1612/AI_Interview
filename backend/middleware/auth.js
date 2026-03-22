const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    // 1. Check Authorization header (primary)
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer ')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ success: false, message: 'Not authorized — no token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Ensure the user still exists (e.g. account wasn't deleted after token issued)
        req.user = await User.findById(decoded.id).select('-password');
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Not authorized — account no longer exists' });
        }

        next();
    } catch (error) {
        // Give specific, actionable messages without revealing token internals
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Session expired — please log in again' });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ success: false, message: 'Not authorized — invalid token' });
        }
        // Fallback
        return res.status(401).json({ success: false, message: 'Not authorized' });
    }
};

module.exports = { protect };
