"use client";

import {
  useEffect,
  useState,
} from "react";

import { useToast } from "@/components/ui/ToastProvider";

type ProjectPhotosProps = {
  projectId: number;
  projectName: string;
};

type JobPhoto = {
  id: number;
  projectId: number;
  projectName: string;
  employeeId: number;
  employeeName: string;
  imageData: string;
  imageUrl: string;
  fileName: string;
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

export default function ProjectPhotos({
  projectId,
  projectName,
}: ProjectPhotosProps) {
  const { showToast } =
    useToast();

  const [
    photos,
    setPhotos,
  ] =
    useState<JobPhoto[]>(
      []
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  useEffect(() => {
    async function loadPhotos() {
      try {
        setLoading(true);

        const response =
          await fetch(
            `/api/job-photos?projectId=${projectId}`,
            {
              cache:
                "no-store",
            }
          );

        const data =
          await response.json();

        if (
          !response.ok
        ) {
          throw new Error(
            data.error ||
              "Unable to load job photos."
          );
        }

        setPhotos(
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
            : "Unable to load job photos.",
          "error"
        );
      } finally {
        setLoading(false);
      }
    }

    void loadPhotos();
  }, [
    projectId,
    showToast,
  ]);

  function openPhoto(
    photo: JobPhoto
  ) {
    const photoWindow =
      window.open(
        "",
        "_blank",
        "noopener,noreferrer"
      );

    if (!photoWindow) {
      return;
    }

    photoWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>${projectName}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <style>
            body {
              margin: 0;
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              background: #0f172a;
            }
            img {
              display: block;
              max-width: 100%;
              max-height: 100vh;
              object-fit: contain;
            }
          </style>
        </head>
        <body>
          <img src="${photo.imageData}" alt="Job photo" />
        </body>
      </html>
    `);

    photoWindow.document.close();
  }

  async function handleDelete(
    photo: JobPhoto
  ) {
    const confirmed =
      window.confirm(
        "Delete this job photo? This action cannot be undone."
      );

    if (!confirmed) {
      return;
    }

    try {
      const response =
        await fetch(
          `/api/job-photos?id=${photo.id}`,
          {
            method:
              "DELETE",
          }
        );

      const data =
        await response.json();

      if (
        !response.ok
      ) {
        throw new Error(
          data.error ||
            "Unable to delete photo."
        );
      }

      setPhotos(
        (
          currentPhotos
        ) =>
          currentPhotos.filter(
            (
              savedPhoto
            ) =>
              savedPhoto.id !==
              photo.id
          )
      );

      showToast(
        "Job photo deleted.",
        "success"
      );
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "Unable to delete photo.",
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
            Job Photos
          </h2>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Jobsite photos uploaded by employees.
          </p>
        </div>

        <span className="text-sm text-slate-500 dark:text-slate-400">
          {photos.length}{" "}
          {photos.length ===
          1
            ? "photo"
            : "photos"}
        </span>
      </div>

      {loading ? (
        <div className="mt-5 rounded-xl border border-dashed p-8 text-center text-slate-500">
          Loading job photos...
        </div>
      ) : photos.length >
        0 ? (
        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {photos.map(
            (photo) => (
              <article
                key={
                  photo.id
                }
                className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700"
              >
                <button
                  type="button"
                  onClick={() =>
                    openPhoto(
                      photo
                    )
                  }
                  className="block w-full overflow-hidden bg-slate-100 text-left dark:bg-slate-800"
                >
                  <img
                    src={
                      photo.imageData
                    }
                    alt={
                      photo.note ||
                      `Job photo for ${projectName}`
                    }
                    className="aspect-[4/3] w-full object-cover transition hover:scale-[1.02]"
                  />
                </button>

                <div className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold">
                        {
                          photo.employeeName
                        }
                      </p>

                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {formatRecordDate(
                          photo.createdAt
                        )}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        void handleDelete(
                          photo
                        )
                      }
                      className="text-sm font-semibold text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </div>

                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-300">
                    {photo.note ||
                      "No photo note"}
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      openPhoto(
                        photo
                      )
                    }
                    className="mt-4 text-sm font-semibold text-blue-600 hover:underline"
                  >
                    View Full Size
                  </button>
                </div>
              </article>
            )
          )}
        </div>
      ) : (
        <div className="mt-5 rounded-xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
          <div className="text-3xl">
            📷
          </div>

          <p className="mt-3 font-semibold">
            No job photos recorded
          </p>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Photos uploaded by employees will appear here automatically.
          </p>
        </div>
      )}
    </section>
  );
}