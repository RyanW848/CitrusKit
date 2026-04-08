const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const authRoutes = require("./routes/auth.routes");
const leagueRoutes = require("./routes/leagues.routes");

const app = express();

const allowedOrigins = new Set(
    [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://www.citrus-kit.com",
        "https://citrus-kit.com",
        process.env.FRONTEND_URL,
    ].filter(Boolean)
);

function originIsAllowed(origin) {
    if (!origin) return true;
    if (allowedOrigins.has(origin)) return true;
    // Dev: allow any localhost / 127.0.0.1 port (CRA, alternate URLs)
    if (process.env.NODE_ENV !== "production") {
        return /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
    }
    return false;
}

app.use(cors({
    origin: (origin, callback) => {
        if (originIsAllowed(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`CORS: origin ${origin} not allowed`));
        }
    },
    credentials: true
}));

app.use(express.json());

app.get("/api/health", (req, res) => {
  const mongoOk = mongoose.connection.readyState === 1;
  res.json({
    message: mongoOk ? "Server is running" : "Server is running (MongoDB not connected)",
    mongo: mongoOk ? "connected" : "disconnected",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/leagues", leagueRoutes);

module.exports = app;