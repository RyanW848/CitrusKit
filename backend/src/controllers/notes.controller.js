const PlayerNote = require("../models/PlayerNote");

function serializeNote(note) {
    return {
        id: note._id,
        player: note.player,
        playerName: note.playerName,
        note: note.note,
        isCustom: note.isCustom,
        updatedAt: note.updatedAt,
    };
}

async function listNotes(req, res) {
    try {
        const notes = await PlayerNote.find({ user: req.user._id }).sort({ updatedAt: -1 });
        return res.status(200).json({ notes: notes.map(serializeNote) });
    } catch (err) {
        console.error("LIST NOTES ERROR:", err);
        return res.status(500).json({ error: "Error fetching notes" });
    }
}

async function upsertNote(req, res) {
    try {
        const { playerName, playerId, note, isCustom } = req.body;

        if (!playerName) {
            return res.status(400).json({ error: "playerName is required" });
        }

        const trimmedName = playerName.trim();
        const noteText = (note ?? "").trim();
        const custom = !!isCustom;

        let saved;
        if (playerId) {
            saved = await PlayerNote.findOneAndUpdate(
                { user: req.user._id, player: playerId },
                { $set: { playerName: trimmedName, note: noteText, isCustom: custom } },
                { upsert: true, new: true },
            );
        } else {
            saved = await PlayerNote.findOneAndUpdate(
                { user: req.user._id, playerName: trimmedName, player: { $exists: false } },
                { $set: { note: noteText, isCustom: custom } },
                { upsert: true, new: true },
            );
        }

        return res.status(200).json(serializeNote(saved));
    } catch (err) {
        console.error("UPSERT NOTE ERROR:", err);
        return res.status(500).json({ error: "Error saving note" });
    }
}

async function deleteNote(req, res) {
    try {
        const note = await PlayerNote.findOneAndDelete({
            _id: req.params.noteId,
            user: req.user._id,
        });

        if (!note) {
            return res.status(404).json({ error: "Note not found" });
        }

        return res.status(200).json({ deleted: true, note: serializeNote(note) });
    } catch (err) {
        console.error("DELETE NOTE ERROR:", err);
        return res.status(500).json({ error: "Error deleting note" });
    }
}

module.exports = { listNotes, upsertNote, deleteNote };
