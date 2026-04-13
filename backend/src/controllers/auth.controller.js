const bcrypt = require("bcryptjs");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");

function serializeUser(user) {
    return {
        id: user._id,
        name: user.name,
        email: user.email,
    };
}

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
            user: serializeUser(user),
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
            user: serializeUser(user),
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
        user: serializeUser(req.user),
    });
}

async function updateMe(req, res) {
    try {
        const { name, email, password } = req.body;
        const hasPasswordUpdate = password !== undefined && password !== "";

        if (name === undefined && email === undefined && !hasPasswordUpdate) {
            return res.status(400).json({
                error: "Please provide name, email, or password to update",
            });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                error: "User not found",
            });
        }

        if (name !== undefined) {
            const trimmedName = typeof name === "string" ? name.trim() : "";
            if (!trimmedName) {
                return res.status(400).json({
                    error: "Name is required",
                });
            }
            user.name = trimmedName;
        }

        if (email !== undefined) {
            const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
            if (!normalizedEmail) {
                return res.status(400).json({
                    error: "Email is required",
                });
            }

            const existingUser = await User.findOne({
                email: normalizedEmail,
                _id: { $ne: user._id },
            });

            if (existingUser) {
                return res.status(409).json({
                    error: "User already exists with this email",
                });
            }

            user.email = normalizedEmail;
        }

        if (hasPasswordUpdate) {
            if (typeof password !== "string") {
                return res.status(400).json({
                    error: "Password is required",
                });
            }

            const salt = await bcrypt.genSalt(10);
            user.passwordHash = await bcrypt.hash(password, salt);
        }

        await user.save();

        return res.status(200).json({
            user: serializeUser(user),
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                error: "User already exists with this email",
            });
        }

        return res.status(500).json({
            error: "Server error during account update",
        });
    }
}

module.exports = {
    register,
    login,
    getMe,
    updateMe
}
