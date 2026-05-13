const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/auth.middleware");
const { listNotes, upsertNote, deleteNote } = require("../controllers/notes.controller");

router.get("/", protect, listNotes);
router.put("/", protect, upsertNote);
router.delete("/:noteId", protect, deleteNote);

module.exports = router;
