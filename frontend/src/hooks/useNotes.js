import { useCallback, useMemo, useState } from "react";
import { fetchNotes, upsertNote as apiUpsertNote, deleteNote as apiDeleteNote } from "../api/notesApi";

export default function useNotes() {
  const [notes, setNotes] = useState([]);

  const load = useCallback(async () => {
    try {
      const data = await fetchNotes();
      setNotes(data.notes || []);
    } catch {
      // notes are non-critical; fail silently
    }
  }, []);

  // Map keyed by API player ID, or "name:<playerName>" for custom players
  const noteMap = useMemo(() => {
    const map = new Map();
    notes.forEach((n) => {
      if (n.player) map.set(n.player, n);
      else map.set(`name:${n.playerName}`, n);
    });
    return map;
  }, [notes]);

  const findNote = useCallback(
    (playerId, playerName) => {
      if (playerId) return noteMap.get(playerId) ?? null;
      if (playerName) return noteMap.get(`name:${playerName}`) ?? null;
      return null;
    },
    [noteMap],
  );

  const saveNote = useCallback(async (payload) => {
    try {
      const saved = await apiUpsertNote(payload);
      setNotes((prev) => {
        const idx = prev.findIndex((n) => n.id === saved.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = saved;
          return next;
        }
        return [saved, ...prev];
      });
      return saved;
    } catch {
      // non-critical
    }
  }, []);

  const removeNote = useCallback(async (noteId) => {
    try {
      await apiDeleteNote(noteId);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
    } catch {
      // non-critical
    }
  }, []);

  return { notes, load, findNote, saveNote, removeNote };
}
