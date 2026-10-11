const jwt = require('jsonwebtoken');
const User = require('../../../libs/database/User');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '7d';

const generateToken = (user) => {
    return jwt.sign(
        { id: user._id, name: user.name, email: user.email },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
};

const registerUser = async ({ name, email, password }) => {
    if (!name || !email || !password) {
        throw new Error('Name, email, and password are required');
    }

    if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check existing user
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
        throw new Error('An account with this email address already exists');
    }

    // Create user
    const user = await User.create({
        name: name.trim(),
        email: cleanEmail,
        password
    });

    const token = generateToken(user);

    return {
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt
        }
    };
};

const loginUser = async ({ email, password }) => {
    if (!email || !password) {
        throw new Error('Email and password are required');
    }

    const cleanEmail = email.toLowerCase().trim();

    // Find user
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
        throw new Error('Invalid email or password');
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        throw new Error('Invalid email or password');
    }

    const token = generateToken(user);

    return {
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt
        }
    };
};

const getUserProfile = async (userId) => {
    const user = await User.findById(userId).select('-password');
    if (!user) {
        throw new Error('User not found');
    }
    return user;
};

module.exports = { registerUser, loginUser, getUserProfile };
