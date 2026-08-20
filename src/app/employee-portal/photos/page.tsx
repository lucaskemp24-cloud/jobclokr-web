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

import {
  Camera,
  CameraResultType,
  CameraSource,
} from "@capacitor/camera";

import EmployeeLayout from "@/components/layout/EmployeeLayout";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/ToastProvider";


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

type PendingPhoto = {
  id: number;
  imageData: string;
  fileName: string;
  note: string;
};

type SessionUser = {
  accountType:
    | "PLATFORM_ADMIN"
    | "COMPANY_USER";
  adminId: number | null;
  employeeId: number | null;
  companyId: number | null;
  name: string;
  role:
    | "PlatformAdmin"
    | "Owner"
    | "Office"
    | "Employee";
  isPlatformAdmin: boolean;
};

type SessionResponse = {
  authenticated: boolean;
  user: SessionUser | null;
};

type EmployeeSessionUser = {
  employeeId: number;
  companyId: number;
  name: string;
  role: "Employee";
  isPlatformAdmin: false;
};

const MAXIMUM_SOURCE_FILE_SIZE =
  10 * 1024 * 1024;

function formatPhotoDate(
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

function loadImage(
  source: string
) {
  return new Promise<HTMLImageElement>(
    (resolve, reject) => {
      const image =
        new Image();

      image.onload = () =>
        resolve(image);

      image.onerror = () =>
        reject(
          new Error(
            "The selected photo could not be processed."
          )
        );

      image.src = source;
    }
  );
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
              "The selected photo could not be read."
            )
          );
        }
      };

      reader.onerror = () => {
        reject(
          new Error(
            "The selected photo could not be read."
          )
        );
      };

      reader.readAsDataURL(
        file
      );
    }
  );
}

async function compressImage(
  file: File
) {
  const originalDataUrl =
    await readFileAsDataUrl(
      file
    );

  const image =
    await loadImage(
      originalDataUrl
    );

  const maximumDimension =
    1600;

  const scale =
    Math.min(
      1,
      maximumDimension /
        Math.max(
          image.width,
          image.height
        )
    );

  const width =
    Math.max(
      1,
      Math.round(
        image.width *
          scale
      )
    );

  const height =
    Math.max(
      1,
      Math.round(
        image.height *
          scale
      )
    );

  const canvas =
    document.createElement(
      "canvas"
    );

  canvas.width = width;
  canvas.height = height;

  const context =
    canvas.getContext(
      "2d"
    );

  if (!context) {
    throw new Error(
      "The selected photo could not be processed."
    );
  }

  context.drawImage(
    image,
    0,
    0,
    width,
    height
  );

  return canvas.toDataURL(
    "image/jpeg",
    0.82
  );
}

function EmployeeJobPhotosContent() {
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
    useState<EmployeeSessionUser | null>(
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
    photos,
    setPhotos,
  ] =
    useState<JobPhoto[]>(
      []
    );

  const [
    pendingPhotos,
    setPendingPhotos,
  ] =
    useState<PendingPhoto[]>(
      []
    );

  const [
    dataLoaded,
    setDataLoaded,
  ] =
    useState(false);

  const [
    savingPhotos,
    setSavingPhotos,
  ] =
    useState(false);

  const [
    photoToDelete,
    setPhotoToDelete,
  ] =
    useState<JobPhoto | null>(
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
        setDataLoaded(false);

        const sessionResponse =
          await fetch(
            "/api/session",
            {
              cache: "no-store",
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

        if (
          sessionData.user.accountType ===
          "PLATFORM_ADMIN"
        ) {
          router.replace(
            "/admin"
          );
          return;
        }

        if (
          sessionData.user.role !==
            "Employee" ||
          sessionData.user.employeeId ===
            null ||
          sessionData.user.companyId ===
            null
        ) {
          router.replace("/");
          return;
        }

        const currentUser: EmployeeSessionUser = {
          employeeId:
            sessionData.user.employeeId,
          companyId:
            sessionData.user.companyId,
          name:
            sessionData.user.name,
          role: "Employee",
          isPlatformAdmin: false,
        };

        setAuthUser(
          currentUser
        );

        const [
          scheduleResponse,
          photosResponse,
        ] =
          await Promise.all([
            fetch(
              `/api/schedule?employeeId=${currentUser.employeeId}`,
              {
                cache:
                  "no-store",
              }
            ),
            fetch(
              `/api/job-photos?projectId=${projectId}`,
              {
                cache:
                  "no-store",
              }
            ),
          ]);

        const scheduleData =
          await scheduleResponse.json();

        const photosData =
          await photosResponse.json();

        if (
          !scheduleResponse.ok
        ) {
          throw new Error(
            scheduleData.error ||
              "Unable to load schedule."
          );
        }

        if (
          !photosResponse.ok
        ) {
          throw new Error(
            photosData.error ||
              "Unable to load job photos."
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
                currentUser.employeeId
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

        setPhotos(
          Array.isArray(
            photosData
          )
            ? photosData
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

  const projectPhotos =
    useMemo(
      () =>
        photos.filter(
          (photo) =>
            photo.projectId ===
            projectId
        ),
      [
        photos,
        projectId,
      ]
    );

  async function processSelectedFiles(
    selectedFiles: File[]
  ) {
    const validFiles =
      selectedFiles.filter(
        (file) => {
          if (
            !file.type.startsWith(
              "image/"
            )
          ) {
            showToast(
              `${file.name} is not an image file.`,
              "error"
            );
            return false;
          }

          if (
            file.size >
            MAXIMUM_SOURCE_FILE_SIZE
          ) {
            showToast(
              `${file.name} is larger than 10 MB.`,
              "error"
            );
            return false;
          }

          return true;
        }
      );

    if (
      validFiles.length ===
      0
    ) {
      return;
    }

    try {
      const loadedPhotos =
        await Promise.all(
          validFiles.map(
            async (
              file,
              index
            ) => ({
              id:
                Date.now() +
                index,
              imageData:
                await compressImage(
                  file
                ),
              fileName:
                file.name,
              note: "",
            })
          )
        );

      setPendingPhotos(
        (
          currentPhotos
        ) => [
          ...currentPhotos,
          ...loadedPhotos,
        ]
      );

      showToast(
        `${loadedPhotos.length} photo${
          loadedPhotos.length ===
          1
            ? ""
            : "s"
        } ready to save.`,
        "success"
      );
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "One or more photos could not be loaded.",
        "error"
      );
    }
  }

  async function handleTakePhoto() {
    try {
      const photo =
        await Camera.getPhoto({
          quality: 85,
          allowEditing: false,
          resultType:
            CameraResultType.DataUrl,
          source:
            CameraSource.Camera,
          saveToGallery: false,
          correctOrientation: true,
        });

      if (!photo.dataUrl) {
        throw new Error(
          "The photo could not be loaded."
        );
      }

      const timestamp =
        Date.now();

      const newPhoto: PendingPhoto = {
        id: timestamp,
        imageData:
          photo.dataUrl,
        fileName:
          `job-photo-${timestamp}.${photo.format || "jpeg"}`,
        note: "",
      };

      setPendingPhotos(
        (currentPhotos) => [
          ...currentPhotos,
          newPhoto,
        ]
      );

      showToast(
        "Photo ready to save.",
        "success"
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "";

      if (
        message
          .toLowerCase()
          .includes("cancel")
      ) {
        return;
      }

      console.error(
        "Take photo failed:",
        error
      );

      showToast(
        "Unable to take photo.",
        "error"
      );
    }
  }

  async function handleChoosePhotos() {
    try {
      const result =
        await Camera.pickImages({
          quality: 85,
          limit: 10,
        });

      if (
        !result.photos ||
        result.photos.length === 0
      ) {
        return;
      }

      const selectedFiles: File[] =
        [];

      for (
        let index = 0;
        index < result.photos.length;
        index++
      ) {
        const photo =
          result.photos[index];

        const response =
          await fetch(
            photo.webPath
          );

        if (!response.ok) {
          throw new Error(
            "A selected photo could not be loaded."
          );
        }

        const blob =
          await response.blob();

        selectedFiles.push(
          new File(
            [blob],
            `job-photo-${Date.now()}-${index}.${photo.format || "jpeg"}`,
            {
              type:
                blob.type ||
                `image/${photo.format || "jpeg"}`,
            }
          )
        );
      }

      await processSelectedFiles(
        selectedFiles
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "";

      if (
        message
          .toLowerCase()
          .includes("cancel")
      ) {
        return;
      }

      console.error(
        "Choose photos failed:",
        error
      );

      showToast(
        "Unable to choose photos.",
        "error"
      );
    }
  }

  function updatePendingPhotoNote(
    photoId: number,
    note: string
  ) {
    setPendingPhotos(
      (
        currentPhotos
      ) =>
        currentPhotos.map(
          (photo) =>
            photo.id ===
            photoId
              ? {
                  ...photo,
                  note,
                }
              : photo
        )
    );
  }

  function removePendingPhoto(
    photoId: number
  ) {
    setPendingPhotos(
      (
        currentPhotos
      ) =>
        currentPhotos.filter(
          (photo) =>
            photo.id !==
            photoId
        )
    );
  }

  async function handleSavePhotos() {
    if (
      !authUser ||
      !assignment
    ) {
      return;
    }

    if (
      pendingPhotos.length ===
      0
    ) {
      showToast(
        "Please take or choose at least one photo.",
        "error"
      );
      return;
    }

    try {
      setSavingPhotos(
        true
      );

      const savedPhotos: JobPhoto[] =
        [];

      for (
        const photo of
        pendingPhotos
      ) {
        const response =
          await fetch(
            "/api/job-photos",
            {
              method:
                "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body:
                JSON.stringify({
                  projectId,
                  employeeId:
                    authUser.employeeId,
                  imageData:
                    photo.imageData,
                  fileName:
                    photo.fileName,
                  note:
                    photo.note.trim(),
                }),
            }
          );

        const data =
          await response.json();

        if (
          !response.ok
        ) {
          throw new Error(
            data.error ||
              `Unable to save ${photo.fileName}.`
          );
        }

        savedPhotos.push(
          data
        );
      }

      setPhotos(
        (
          currentPhotos
        ) => [
          ...savedPhotos.reverse(),
          ...currentPhotos,
        ]
      );

      setPendingPhotos(
        []
      );

      showToast(
        `${savedPhotos.length} job photo${
          savedPhotos.length ===
          1
            ? ""
            : "s"
        } saved.`,
        "success"
      );
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "Unable to save photos.",
        "error"
      );
    } finally {
      setSavingPhotos(
        false
      );
    }
  }

  async function handleConfirmDelete() {
    if (
      !photoToDelete ||
      !authUser
    ) {
      return;
    }

    try {
      const response =
        await fetch(
          `/api/job-photos?id=${photoToDelete.id}&employeeId=${authUser.employeeId}`,
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
            (photo) =>
              photo.id !==
              photoToDelete.id
          )
      );

      setPhotoToDelete(
        null
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
          <title>${assignment?.projectName ?? "Job Photo"}</title>
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
              Loading job photos...
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
            Job Photos
          </h1>

          <p className="mt-1 text-slate-500 dark:text-slate-400">
            {assignment.projectName}
          </p>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-xl font-bold">
            Add Photos
          </h2>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Take photos at the jobsite or choose them from your device.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() =>
                void handleTakePhoto()
              }
              className="min-h-14 rounded-xl bg-blue-600 px-4 font-bold text-white hover:bg-blue-700"
            >
              📷 Take Photo
            </button>

            <button
              type="button"
              onClick={() =>
                void handleChoosePhotos()
              }
              className="min-h-14 rounded-xl border border-blue-600 px-4 font-bold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
            >
              Choose Photos
            </button>
          </div>

          {pendingPhotos.length >
            0 && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold">
                    Ready to Save
                  </p>

                  <p className="text-sm text-slate-500">
                    {pendingPhotos.length} selected
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setPendingPhotos(
                      []
                    )
                  }
                  className="text-sm font-semibold text-red-600 hover:underline"
                >
                  Clear All
                </button>
              </div>

              {pendingPhotos.map(
                (photo) => (
                  <article
                    key={
                      photo.id
                    }
                    className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700"
                  >
                    <img
                      src={
                        photo.imageData
                      }
                      alt="Selected job photo preview"
                      className="aspect-[4/3] w-full object-cover"
                    />

                    <div className="space-y-3 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate text-sm font-semibold">
                          {
                            photo.fileName
                          }
                        </p>

                        <button
                          type="button"
                          onClick={() =>
                            removePendingPhoto(
                              photo.id
                            )
                          }
                          className="text-sm font-semibold text-red-600 hover:underline"
                        >
                          Remove
                        </button>
                      </div>

                      <textarea
                        value={
                          photo.note
                        }
                        onChange={(
                          event
                        ) =>
                          updatePendingPhotoNote(
                            photo.id,
                            event.target.value
                          )
                        }
                        placeholder="Optional photo note"
                        maxLength={
                          300
                        }
                        rows={3}
                        className="w-full resize-none rounded-xl border p-3 dark:bg-slate-950"
                      />
                    </div>
                  </article>
                )
              )}

              <button
                type="button"
                onClick={() =>
                  void handleSavePhotos()
                }
                disabled={
                  savingPhotos
                }
                className="min-h-14 w-full rounded-xl bg-blue-600 px-4 font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingPhotos
                  ? "Saving Photos..."
                  : `Save ${pendingPhotos.length} Photo${
                      pendingPhotos.length ===
                      1
                        ? ""
                        : "s"
                    }`}
              </button>
            </div>
          )}
        </section>

        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500">
                Project Gallery
              </p>

              <h2 className="mt-1 text-2xl font-bold">
                Job Photos
              </h2>
            </div>

            <span className="text-sm text-slate-500">
              {projectPhotos.length}{" "}
              {projectPhotos.length ===
              1
                ? "photo"
                : "photos"}
            </span>
          </div>

          {projectPhotos.length >
          0 ? (
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {projectPhotos.map(
                (photo) => (
                  <article
                    key={
                      photo.id
                    }
                    className="overflow-hidden rounded-xl border dark:border-slate-700"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        openPhoto(
                          photo
                        )
                      }
                      className="block w-full"
                    >
                      <img
                        src={
                          photo.imageData
                        }
                        alt={
                          photo.note ||
                          `Job photo for ${assignment.projectName}`
                        }
                        className="aspect-[4/3] w-full object-cover"
                      />
                    </button>

                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold">
                            {
                              photo.employeeName
                            }
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {formatPhotoDate(
                              photo.createdAt
                            )}
                          </p>
                        </div>

                        {photo.employeeId ===
                          authUser.employeeId && (
                          <button
                            type="button"
                            onClick={() =>
                              setPhotoToDelete(
                                photo
                              )
                            }
                            className="text-sm font-semibold text-red-600 hover:underline"
                          >
                            Delete
                          </button>
                        )}
                      </div>

                      {photo.note && (
                        <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">
                          {
                            photo.note
                          }
                        </p>
                      )}
                    </div>
                  </article>
                )
              )}
            </div>
          ) : (
            <div className="mt-5 rounded-xl border border-dashed p-8 text-center">
              <div className="text-3xl">
                📷
              </div>

              <p className="mt-3 font-semibold">
                No job photos yet
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Add the first photo from this job.
              </p>
            </div>
          )}
        </section>

        <ConfirmDialog
          isOpen={
            photoToDelete !==
            null
          }
          title="Delete Job Photo?"
          message="Are you sure you want to delete this photo? This action cannot be undone."
          confirmLabel="Delete Photo"
          cancelLabel="Cancel"
          danger
          onConfirm={() =>
            void handleConfirmDelete()
          }
          onCancel={() =>
            setPhotoToDelete(
              null
            )
          }
        />
      </div>
    </EmployeeLayout>
  );
}

export default function EmployeeJobPhotosPage() {
  return (
    <Suspense
      fallback={
        <EmployeeLayout>
          <div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center">
            <div className="w-full rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-blue-600 border-r-transparent" />

              <p className="mt-4 text-slate-500 dark:text-slate-400">
                Loading job photos...
              </p>
            </div>
          </div>
        </EmployeeLayout>
      }
    >
      <EmployeeJobPhotosContent />
    </Suspense>
  );
}