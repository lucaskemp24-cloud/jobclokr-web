"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import EmployeeLayout from "@/components/layout/EmployeeLayout";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/ToastProvider";

type SessionUser = {
  accountType: "COMPANY_USER";
  adminId: null;
  employeeId: number;
  companyId: number;
  name: string;
  role:
    | "Owner"
    | "Office"
    | "Employee";
  isPlatformAdmin: false;
};

type SessionResponse = {
  authenticated: boolean;
  user: SessionUser | null;
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

type ScheduleAssignment = {
  id: number;
  date: string;
  projectId: number;
  projectName: string;
  customerName: string;
  address: string;
  status: string;
  employeeIds: number[];
};

function formatNoteDate(
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

function EmployeeDailyNotesContent() {
  const router =
    useRouter();

  const searchParams =
    useSearchParams();

  const { showToast } =
    useToast();

  const [
    authUser,
    setAuthUser,
  ] =
    useState<SessionUser | null>(
      null
    );

  const [
    assignment,
    setAssignment,
  ] =
    useState<ScheduleAssignment | null>(
      null
    );

  const [
    notes,
    setNotes,
  ] =
    useState<DailyNote[]>(
      []
    );

  const [
    newNote,
    setNewNote,
  ] =
    useState("");

  const [
    dataLoaded,
    setDataLoaded,
  ] =
    useState(false);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    noteToDelete,
    setNoteToDelete,
  ] =
    useState<DailyNote | null>(
      null
    );

  const projectId =
    Number(
      searchParams.get(
        "projectId"
      )
    );

  useEffect(() => {
    async function loadPage() {
      try {
        setDataLoaded(false);

        if (
          !Number.isInteger(
            projectId
          ) ||
          projectId <= 0
        ) {
          showToast(
            "No project was selected.",
            "error"
          );

          router.replace(
            "/employee-portal"
          );

          return;
        }

        const sessionResponse =
          await fetch(
            "/api/session",
            {
              cache:
                "no-store",
            }
          );

        const sessionData =
          (await sessionResponse.json()) as
            SessionResponse;

        if (
          !sessionResponse.ok ||
          !sessionData.authenticated ||
          !sessionData.user
        ) {
          router.replace(
            "/login"
          );

          return;
        }

        const sessionUser =
          sessionData.user;

        if (
          sessionUser.role ===
            "Owner" ||
          sessionUser.role ===
            "Office"
        ) {
          router.replace(
            "/"
          );

          return;
        }

        setAuthUser(
          sessionUser
        );

        const [
          scheduleResponse,
          notesResponse,
        ] =
          await Promise.all([
            fetch(
              `/api/schedule?employeeId=${sessionUser.employeeId}`,
              {
                cache:
                  "no-store",
              }
            ),
            fetch(
              `/api/daily-notes?projectId=${projectId}`,
              {
                cache:
                  "no-store",
              }
            ),
          ]);

        const scheduleData =
          await scheduleResponse.json();

        const notesData =
          await notesResponse.json();

        if (
          !scheduleResponse.ok
        ) {
          throw new Error(
            scheduleData.error ||
              "Unable to load schedule."
          );
        }

        if (
          !notesResponse.ok
        ) {
          throw new Error(
            notesData.error ||
              "Unable to load daily notes."
          );
        }

        const projectAssignment =
          (
            Array.isArray(
              scheduleData
            )
              ? scheduleData
              : []
          ).find(
            (
              savedAssignment: ScheduleAssignment
            ) =>
              savedAssignment.projectId ===
                projectId &&
              savedAssignment.employeeIds.includes(
                sessionUser.employeeId
              )
          );

        if (
          !projectAssignment
        ) {
          throw new Error(
            "This project is not assigned to you."
          );
        }

        setAssignment(
          projectAssignment
        );

        setNotes(
          Array.isArray(
            notesData
          )
            ? notesData
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
        setDataLoaded(
          true
        );
      }
    }

    void loadPage();
  }, [
    projectId,
    router,
    showToast,
  ]);

  const projectNotes =
    useMemo(
      () =>
        notes.filter(
          (note) =>
            note.projectId ===
            projectId
        ),
      [
        notes,
        projectId,
      ]
    );

  async function handleSaveNote() {
    if (
      !authUser ||
      !assignment
    ) {
      return;
    }

    const trimmedNote =
      newNote.trim();

    if (!trimmedNote) {
      showToast(
        "Please enter a note before saving.",
        "error"
      );

      return;
    }

    try {
      setSaving(true);

      const response =
        await fetch(
          "/api/daily-notes",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                projectId,

                employeeId:
                  authUser.employeeId,

                note:
                  trimmedNote,
              }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to save daily note."
        );
      }

      setNotes(
        (
          currentNotes
        ) => [
          data,
          ...currentNotes,
        ]
      );

      setNewNote("");

      showToast(
        "Daily note saved.",
        "success"
      );
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "Unable to save daily note.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmDelete() {
    if (
      !noteToDelete ||
      !authUser
    ) {
      return;
    }

    try {
      const response =
        await fetch(
          `/api/daily-notes?id=${noteToDelete.id}&employeeId=${authUser.employeeId}`,
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
            (note) =>
              note.id !==
              noteToDelete.id
          )
      );

      setNoteToDelete(
        null
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

  if (
    !dataLoaded ||
    !authUser ||
    !assignment
  ) {
    return (
      <EmployeeLayout>
        <div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center">
          <div className="w-full rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-blue-600 border-r-transparent" />

            <p className="mt-4 text-slate-500 dark:text-slate-400">
              Loading daily notes...
            </p>
          </div>
        </div>
      </EmployeeLayout>
    );
  }

  return (
    <EmployeeLayout>
      <div className="mx-auto w-full max-w-xl pb-28 sm:pb-8">
        <button
          type="button"
          onClick={() =>
            router.push(
              "/employee-portal"
            )
          }
          className="mb-4 text-sm font-semibold text-blue-600 hover:underline"
        >
          ← Back to Today&apos;s Jobs
        </button>

        <header className="mb-5">
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Field Records
          </p>

          <h1 className="mt-1 text-3xl font-bold">
            Daily Notes
          </h1>

          <p className="mt-1 text-slate-500 dark:text-slate-400">
            {
              assignment.projectName
            }
          </p>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-xl font-bold">
            Add Daily Note
          </h2>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Record progress, delays, issues, or anything the office should know.
          </p>

          <textarea
            value={
              newNote
            }
            onChange={(
              event
            ) =>
              setNewNote(
                event.target.value
              )
            }
            maxLength={
              5000
            }
            rows={6}
            placeholder="Example: Installed cable in offices 101–105. Waiting on ceiling access in office 106."
            className="mt-5 w-full resize-y rounded-xl border border-slate-300 p-3 dark:border-slate-700 dark:bg-slate-950"
          />

          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {
                newNote.length
              }
              /5000
            </span>

            <button
              type="button"
              disabled={
                saving ||
                !newNote.trim()
              }
              onClick={() =>
                void handleSaveNote()
              }
              className="min-h-12 rounded-xl bg-blue-600 px-6 font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : "Save Daily Note"}
            </button>
          </div>
        </section>

        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                Project History
              </p>

              <h2 className="mt-1 text-2xl font-bold">
                Daily Notes
              </h2>
            </div>

            <span className="text-sm text-slate-500 dark:text-slate-400">
              {
                projectNotes.length
              }{" "}
              {projectNotes.length ===
              1
                ? "note"
                : "notes"}
            </span>
          </div>

          {projectNotes.length >
          0 ? (
            <div className="mt-5 space-y-4">
              {projectNotes.map(
                (note) => (
                  <article
                    key={
                      note.id
                    }
                    className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold">
                          {
                            note.employeeName
                          }
                        </p>

                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {formatNoteDate(
                            note.createdAt
                          )}
                        </p>
                      </div>

                      {note.employeeId ===
                        authUser.employeeId && (
                        <button
                          type="button"
                          onClick={() =>
                            setNoteToDelete(
                              note
                            )
                          }
                          className="shrink-0 text-sm font-semibold text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      )}
                    </div>

                    <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-300">
                      {
                        note.note
                      }
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
                No daily notes yet
              </p>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Add the first field update for this job.
              </p>
            </div>
          )}
        </section>

        <ConfirmDialog
          isOpen={
            noteToDelete !==
            null
          }
          title="Delete Daily Note?"
          message="Are you sure you want to delete this note? This action cannot be undone."
          confirmLabel="Delete Note"
          cancelLabel="Cancel"
          danger
          onConfirm={() =>
            void handleConfirmDelete()
          }
          onCancel={() =>
            setNoteToDelete(
              null
            )
          }
        />
      </div>
    </EmployeeLayout>
  );
}

export default function EmployeeDailyNotesPage() {
  return (
    <Suspense
      fallback={
        <EmployeeLayout>
          <div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center">
            <div className="w-full rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-blue-600 border-r-transparent" />

              <p className="mt-4 text-slate-500 dark:text-slate-400">
                Loading daily notes...
              </p>
            </div>
          </div>
        </EmployeeLayout>
      }
    >
      <EmployeeDailyNotesContent />
    </Suspense>
  );
}