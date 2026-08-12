"use client";

import {
  useEffect,
  useState,
} from "react";

import { useToast } from "@/components/ui/ToastProvider";

type ProjectDocumentsProps = {
  projectId: number;
};

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

export default function ProjectDocuments({
  projectId,
}: ProjectDocumentsProps) {
  const { showToast } =
    useToast();

  const [
    documents,
    setDocuments,
  ] =
    useState<ProjectDocument[]>(
      []
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  useEffect(() => {
    async function loadDocuments() {
      try {
        setLoading(true);

        const response =
          await fetch(
            `/api/project-documents?projectId=${projectId}`,
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
              "Unable to load project documents."
          );
        }

        setDocuments(
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
            : "Unable to load project documents.",
          "error"
        );
      } finally {
        setLoading(false);
      }
    }

    void loadDocuments();
  }, [
    projectId,
    showToast,
  ]);

  async function handleDelete(
    document: ProjectDocument
  ) {
    const confirmed =
      window.confirm(
        `Delete "${document.fileName}"? This action cannot be undone.`
      );

    if (!confirmed) {
      return;
    }

    try {
      const response =
        await fetch(
          `/api/project-documents?id=${document.id}`,
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
            (
              savedDocument
            ) =>
              savedDocument.id !==
              document.id
          )
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

  return (
    <section className="rounded-xl bg-white p-6 shadow dark:bg-slate-900">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Project Files
          </p>

          <h2 className="mt-1 text-2xl font-semibold">
            Documents
          </h2>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Contracts, permits, invoices, reports, drawings, and other project files.
          </p>
        </div>

        <span className="text-sm text-slate-500">
          {documents.length}{" "}
          {documents.length ===
          1
            ? "file"
            : "files"}
        </span>
      </div>

      {loading ? (
        <div className="mt-5 rounded-xl border border-dashed p-8 text-center text-slate-500">
          Loading documents...
        </div>
      ) : documents.length >
        0 ? (
        <div className="mt-5 space-y-3">
          {documents.map(
            (document) => (
              <article
                key={
                  document.id
                }
                className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"
              >
                <div className="flex items-start gap-4">
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

                      <button
                        type="button"
                        onClick={() =>
                          void handleDelete(
                            document
                          )
                        }
                        className="text-sm font-semibold text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            )
          )}
        </div>
      ) : (
        <div className="mt-5 rounded-xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
          <div className="text-3xl">
            📄
          </div>

          <p className="mt-3 font-semibold">
            No project documents uploaded
          </p>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Documents uploaded by employees will appear here automatically.
          </p>
        </div>
      )}
    </section>
  );
}