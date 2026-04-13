const express = require("express");
const router = express.Router();

const { register, login, getMe, updateMe } = require("../controllers/auth.controller");
const { protect } = require("../middleware/auth.middleware");

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe);
router.patch("/me", protect, updateMe);
router.put("/me", protect, updateMe);

module.exports = router;
