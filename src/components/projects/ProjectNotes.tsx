"use client";

import {
  useEffect,
  useState,
} from "react";

import { useToast } from "@/components/ui/ToastProvider";

type ProjectNotesProps = {
  projectId: number;
};

type DailyNote = {
  id: number;
  projectId: number;
  projectName: string;
  employeeId: number;
  employeeName: string;
  note: string;
  createdAt: string;
};

function formatRecordDate(
  dateValue: string
) {
  const date =
    new Date(dateValue);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Date unavailable";
  }

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ProjectNotes({
  projectId,
}: ProjectNotesProps) {
  const { showToast } =
    useToast();

  const [
    notes,
    setNotes,
  ] =
    useState<DailyNote[]>(
      []
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  useEffect(() => {
    async function loadNotes() {
      try {
        setLoading(true);

        const response =
          await fetch(
            `/api/daily-notes?projectId=${projectId}`,
            {
              cache:
                "no-store",
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Unable to load daily notes."
          );
        }

        setNotes(
          Array.isArray(
            data
          )
            ? data
            : []
        );
      } catch (error) {
        showToast(
          error instanceof Error
            ? error.message
            : "Unable to load daily notes.",
          "error"
        );
      } finally {
        setLoading(false);
      }
    }

    void loadNotes();
  }, [
    projectId,
    showToast,
  ]);

  async function handleDelete(
    note: DailyNote
  ) {
    const confirmed =
      window.confirm(
        "Delete this daily note? This action cannot be undone."
      );

    if (!confirmed) {
      return;
    }

    try {
      const response =
        await fetch(
          `/api/daily-notes?id=${note.id}`,
          {
            method:
              "DELETE",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to delete daily note."
        );
      }

      setNotes(
        (
          currentNotes
        ) =>
          currentNotes.filter(
            (
              savedNote
            ) =>
              savedNote.id !==
              note.id
          )
      );

      showToast(
        "Daily note deleted.",
        "success"
      );
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "Unable to delete daily note.",
        "error"
      );
    }
  }

  return (
    <section className="rounded-xl bg-white p-6 shadow dark:bg-slate-900">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Field Records
          </p>

          <h2 className="mt-1 text-2xl font-semibold">
            Daily Notes
          </h2>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Progress updates, delays, and jobsite details recorded by employees.
          </p>
        </div>

        <span className="text-sm text-slate-500 dark:text-slate-400">
          {notes.length}{" "}
          {notes.length ===
          1
            ? "note"
            : "notes"}
        </span>
      </div>

      {loading ? (
        <div className="mt-5 rounded-xl border border-dashed p-8 text-center text-slate-500">
          Loading daily notes...
        </div>
      ) : notes.length >
        0 ? (
        <div className="mt-5 space-y-4">
          {notes.map(
            (note) => (
              <article
                key={
                  note.id
                }
                className="rounded-xl border border-slate-200 p-5 dark:border-slate-700"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold">
                      {
                        note.employeeName
                      }
                    </p>

                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {formatRecordDate(
                        note.createdAt
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="w-fit rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                      Daily Note
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        void handleDelete(
                          note
                        )
                      }
                      className="text-sm font-semibold text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <p className="mt-4 whitespace-pre-wrap leading-7 text-slate-700 dark:text-slate-300">
                  {note.note}
                </p>
              </article>
            )
          )}
        </div>
      ) : (
        <div className="mt-5 rounded-xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
          <div className="text-3xl">
            📝
          </div>

          <p className="mt-3 font-semibold">
            No daily notes recorded
          </p>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Notes entered by employees will appear here automatically.
          </p>
        </div>
      )}
    </section>
  );
}