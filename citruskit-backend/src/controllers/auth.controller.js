const bcrypt = require("bcryptjs");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");

async function register(req, res) {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ 
                error: "Please provide name, email, and password" 
            });
        }

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(409).json({ 
                error: "User already exists with this email"
            });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const user = new User({
            name,
            email: email.toLowerCase(),
            passwordHash
        })

        const token = generateToken(user._id);
        
        await user.save();

        return res.status(201).json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            },
            token
        })
    } catch (error) {
        return res.status(500).json({
            error: "Server error during registration",
        });
    }
}

async function login(req, res) {
    try {
        const { email, password } = req.body;

        if ( !email || !password) {
            return res.status(400).json({
                error: "Email and password are required"
            })
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({
                error: "Invalid email"
            });
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({
                error: "Invalid password"
            })
        }

        const token = generateToken(user._id);
        return res.status(200).json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            },
            token
        })
    } catch (error) {
        return res.status(500).json({
            error: "Server error during login",
        });
    }
}

async function getMe(req, res) {
    return res.status(200).json({
        user: {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
        },
    });
}

module.exports = {
    register,
    login,
    getMe
}