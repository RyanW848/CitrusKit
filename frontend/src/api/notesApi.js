import client from "./citrusClient";

export async function fetchNotes() {
  const { data } = await client.get("/notes");
  return data;
}

export async function upsertNote(payload) {
  const { data } = await client.put("/notes", payload);
  return data;
}

export async function deleteNote(noteId) {
  const { data } = await client.delete(`/notes/${noteId}`);
  return data;
}
