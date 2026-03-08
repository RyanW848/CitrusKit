const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const leagueRoutes = require("./routes/leagues.routes");

const app = express();

app.use(cors({
    origin: "http://localhost:3000",  // Testing purposes, change later to actual server
    credentials: true
}));

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ message: "Server is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/leagues", leagueRoutes);

module.exports = app;