"use client";

import {
  ChangeEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import EmployeeLayout from "@/components/layout/EmployeeLayout";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/ToastProvider";

import {
  loadAuthUser,
  type AuthUser,
} from "@/lib/auth";

type ProjectDocument = {
  id: number;
  projectId: number;
  projectName: string;
  employeeId: number;
  employeeName: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  note: string;
  createdAt: string;
};

type ScheduleAssignment = {
  id: number;
  projectId: number;
  projectName: string;
  employeeIds: number[];
};

const MAX_FILE_SIZE =
  5 * 1024 * 1024;

const ACCEPTED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/plain",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

function formatDate(
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

function readFileAsDataUrl(
  file: File
) {
  return new Promise<string>(
    (resolve, reject) => {
      const reader =
        new FileReader();

      reader.onload = () => {
        if (
          typeof reader.result ===
          "string"
        ) {
          resolve(
            reader.result
          );
        } else {
          reject(
            new Error(
              "The selected file could not be read."
            )
          );
        }
      };

      reader.onerror = () =>
        reject(
          new Error(
            "The selected file could not be read."
          )
        );

      reader.readAsDataURL(
        file
      );
    }
  );
}

function getDocumentIcon(
  fileType: string
) {
  if (
    fileType.includes(
      "pdf"
    )
  ) {
    return "📕";
  }

  if (
    fileType.startsWith(
      "image/"
    )
  ) {
    return "🖼️";
  }

  if (
    fileType.includes(
      "word"
    )
  ) {
    return "📘";
  }

  if (
    fileType.includes(
      "excel"
    ) ||
    fileType.includes(
      "spreadsheet"
    ) ||
    fileType.includes(
      "csv"
    )
  ) {
    return "📗";
  }

  return "📄";
}

export default function EmployeeDocumentsPage() {
  const router =
    useRouter();

  const searchParams =
    useSearchParams();

  const { showToast } =
    useToast();

  const fileInputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const [
    authUser,
    setAuthUser,
  ] =
    useState<AuthUser | null>(
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
    documents,
    setDocuments,
  ] =
    useState<ProjectDocument[]>(
      []
    );

  const [
    selectedFile,
    setSelectedFile,
  ] =
    useState<File | null>(
      null
    );

  const [
    note,
    setNote,
  ] =
    useState("");

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    documentToDelete,
    setDocumentToDelete,
  ] =
    useState<ProjectDocument | null>(
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
      const savedUser =
        loadAuthUser();

      if (!savedUser) {
        router.replace(
          "/login"
        );
        return;
      }

      if (
        savedUser.role ===
          "Owner" ||
        savedUser.role ===
          "Office"
      ) {
        router.replace("/");
        return;
      }

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

      try {
        setLoading(true);
        setAuthUser(savedUser);

        const [
          scheduleResponse,
          documentsResponse,
        ] =
          await Promise.all([
            fetch(
              `/api/schedule?employeeId=${savedUser.employeeId}`,
              {
                cache:
                  "no-store",
              }
            ),
            fetch(
              `/api/project-documents?projectId=${projectId}`,
              {
                cache:
                  "no-store",
              }
            ),
          ]);

        const scheduleData =
          await scheduleResponse.json();

        const documentsData =
          await documentsResponse.json();

        if (!scheduleResponse.ok) {
          throw new Error(
            scheduleData.error ||
              "Unable to load schedule."
          );
        }

        if (!documentsResponse.ok) {
          throw new Error(
            documentsData.error ||
              "Unable to load documents."
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
                savedUser.employeeId
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

        setDocuments(
          Array.isArray(
            documentsData
          )
            ? documentsData
            : []
        );
      } catch (error) {
        showToast(
          error instanceof Error
            ? error.message
            : "Unable to load documents.",
          "error"
        );
      } finally {
        setLoading(false);
      }
    }

    void loadPage();
  }, [
    projectId,
    router,
    showToast,
  ]);

  const projectDocuments =
    useMemo(
      () =>
        documents.filter(
          (document) =>
            document.projectId ===
            projectId
        ),
      [
        documents,
        projectId,
      ]
    );

  function handleFileSelection(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0] ??
      null;

    event.target.value =
      "";

    if (!file) {
      return;
    }

    if (
      file.size >
      MAX_FILE_SIZE
    ) {
      showToast(
        "Files must be 5 MB or smaller for now.",
        "error"
      );
      return;
    }

    if (
      file.type &&
      !ACCEPTED_TYPES.includes(
        file.type
      )
    ) {
      showToast(
        "That file type is not supported yet.",
        "error"
      );
      return;
    }

    setSelectedFile(
      file
    );
  }

  async function handleUpload() {
    if (
      !authUser ||
      !assignment ||
      !selectedFile
    ) {
      showToast(
        "Choose a document first.",
        "error"
      );
      return;
    }

    try {
      setSaving(true);

      const fileUrl =
        await readFileAsDataUrl(
          selectedFile
        );

      const response =
        await fetch(
          "/api/project-documents",
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
                fileName:
                  selectedFile.name,
                fileUrl,
                fileType:
                  selectedFile.type ||
                  "application/octet-stream",
                note:
                  note.trim(),
              }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to upload document."
        );
      }

      setDocuments(
        (
          currentDocuments
        ) => [
          data,
          ...currentDocuments,
        ]
      );

      setSelectedFile(
        null
      );
      setNote("");

      showToast(
        "Document uploaded.",
        "success"
      );
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "Unable to upload document.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (
      !documentToDelete ||
      !authUser
    ) {
      return;
    }

    try {
      const response =
        await fetch(
          `/api/project-documents?id=${documentToDelete.id}&employeeId=${authUser.employeeId}`,
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
            "Unable to delete document."
        );
      }

      setDocuments(
        (
          currentDocuments
        ) =>
          currentDocuments.filter(
            (document) =>
              document.id !==
              documentToDelete.id
          )
      );

      setDocumentToDelete(
        null
      );

      showToast(
        "Document deleted.",
        "success"
      );
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "Unable to delete document.",
        "error"
      );
    }
  }

  function openDocument(
    document: ProjectDocument
  ) {
    const documentWindow =
      window.open(
        document.fileUrl,
        "_blank",
        "noopener,noreferrer"
      );

    if (!documentWindow) {
      showToast(
        "Your browser blocked the document window.",
        "warning"
      );
    }
  }

  if (
    loading ||
    !authUser ||
    !assignment
  ) {
    return (
      <EmployeeLayout>
        <div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center">
          <div className="w-full rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-blue-600 border-r-transparent" />

            <p className="mt-4 text-slate-500 dark:text-slate-400">
              Loading documents...
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
            Project Files
          </p>

          <h1 className="mt-1 text-3xl font-bold">
            Documents
          </h1>

          <p className="mt-1 text-slate-500 dark:text-slate-400">
            {assignment.projectName}
          </p>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-xl font-bold">
            Upload Document
          </h2>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Upload permits, drawings, PDFs, spreadsheets, or other project files.
          </p>

          <input
            ref={
              fileInputRef
            }
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp,.txt,.csv,.doc,.docx,.xls,.xlsx"
            onChange={
              handleFileSelection
            }
            className="hidden"
          />

          <button
            type="button"
            onClick={() =>
              fileInputRef.current?.click()
            }
            className="mt-5 min-h-14 w-full rounded-xl border border-blue-600 px-4 font-bold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
          >
            📎 Choose Document
          </button>

          {selectedFile && (
            <div className="mt-4 rounded-xl border p-4 dark:border-slate-700">
              <p className="font-semibold">
                {selectedFile.name}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>

              <textarea
                value={note}
                onChange={(
                  event
                ) =>
                  setNote(
                    event.target.value
                  )
                }
                rows={3}
                placeholder="Optional document note"
                className="mt-4 w-full resize-none rounded-xl border p-3 dark:bg-slate-950"
              />

              <button
                type="button"
                disabled={
                  saving
                }
                onClick={() =>
                  void handleUpload()
                }
                className="mt-3 min-h-12 w-full rounded-xl bg-blue-600 font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Uploading..."
                  : "Upload Document"}
              </button>
            </div>
          )}
        </section>

        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500">
                Project Files
              </p>

              <h2 className="mt-1 text-2xl font-bold">
                Documents
              </h2>
            </div>

            <span className="text-sm text-slate-500">
              {projectDocuments.length}{" "}
              {projectDocuments.length ===
              1
                ? "file"
                : "files"}
            </span>
          </div>

          {projectDocuments.length >
          0 ? (
            <div className="mt-5 space-y-3">
              {projectDocuments.map(
                (document) => (
                  <article
                    key={
                      document.id
                    }
                    className="rounded-xl border p-4 dark:border-slate-700"
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-3xl">
                        {getDocumentIcon(
                          document.fileType
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="break-words font-semibold">
                          {
                            document.fileName
                          }
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {
                            document.employeeName
                          }
                          {" • "}
                          {formatDate(
                            document.createdAt
                          )}
                        </p>

                        {document.note && (
                          <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">
                            {
                              document.note
                            }
                          </p>
                        )}

                        <div className="mt-4 flex gap-4">
                          <button
                            type="button"
                            onClick={() =>
                              openDocument(
                                document
                              )
                            }
                            className="text-sm font-semibold text-blue-600 hover:underline"
                          >
                            Open
                          </button>

                          {document.employeeId ===
                            authUser.employeeId && (
                            <button
                              type="button"
                              onClick={() =>
                                setDocumentToDelete(
                                  document
                                )
                              }
                              className="text-sm font-semibold text-red-600 hover:underline"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                )
              )}
            </div>
          ) : (
            <div className="mt-5 rounded-xl border border-dashed p-8 text-center">
              <div className="text-3xl">
                📄
              </div>

              <p className="mt-3 font-semibold">
                No project documents yet
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Upload the first file for this project.
              </p>
            </div>
          )}
        </section>

        <ConfirmDialog
          isOpen={
            documentToDelete !==
            null
          }
          title="Delete Document?"
          message="Are you sure you want to delete this document? This action cannot be undone."
          confirmLabel="Delete Document"
          cancelLabel="Cancel"
          danger
          onConfirm={() =>
            void handleDelete()
          }
          onCancel={() =>
            setDocumentToDelete(
              null
            )
          }
        />
      </div>
    </EmployeeLayout>
  );
}