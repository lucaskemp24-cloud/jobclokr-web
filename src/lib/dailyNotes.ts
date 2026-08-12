export type DailyNote = {
  id: number;
  projectId: number;
  projectName: string;
  employeeId: number;
  employeeName: string;
  note: string;
  createdAt: string;
};

const DAILY_NOTES_STORAGE_KEY = "jobclokr-daily-notes";

export function loadDailyNotes(): DailyNote[] {
  if (typeof window === "undefined") {
    return [];
  }

  const savedNotes = window.localStorage.getItem(
    DAILY_NOTES_STORAGE_KEY
  );

  if (!savedNotes) {
    return [];
  }

  try {
    const parsedNotes = JSON.parse(savedNotes);

    if (!Array.isArray(parsedNotes)) {
      return [];
    }

    return parsedNotes as DailyNote[];
  } catch {
    return [];
  }
}

export function saveDailyNotes(notes: DailyNote[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    DAILY_NOTES_STORAGE_KEY,
    JSON.stringify(notes)
  );
}

export function deleteDailyNote(noteId: number) {
  const remainingNotes = loadDailyNotes().filter(
    (note) => note.id !== noteId
  );

  saveDailyNotes(remainingNotes);

  return remainingNotes;
}