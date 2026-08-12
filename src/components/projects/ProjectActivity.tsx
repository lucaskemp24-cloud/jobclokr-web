"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

type ProjectActivityProps = {
  projectId: number;
};

type ActivityType =
  | "clock-in"
  | "clock-out"
  | "material"
  | "photo"
  | "note";

type TimeEntry = {
  id: number;
  employeeId: number;
  employeeName: string;
  projectId: number;
  projectName: string;
  clockIn: string;
  clockOut: string | null;
};

type MaterialEntry = {
  id: number;
  projectId: number;
  employeeId: number;
  employeeName: string;
  materialName: string;
  quantity: number;
  unit: string;
  notes: string;
  createdAt: string;
};

type PhotoEntry = {
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

type DailyNote = {
  id: number;
  projectId: number;
  projectName: string;
  employeeId: number;
  employeeName: string;
  note: string;
  createdAt: string;
};

type ProjectActivityItem = {
  id: string;
  type: ActivityType;
  employeeName: string;
  title: string;
  detail: string;
  createdAt: string;
};

function isToday(
  dateValue: string
) {
  const date =
    new Date(dateValue);

  const today =
    new Date();

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return false;
  }

  return (
    date.getFullYear() ===
      today.getFullYear() &&
    date.getMonth() ===
      today.getMonth() &&
    date.getDate() ===
      today.getDate()
  );
}

function formatActivityTime(
  dateValue: string
) {
  const date =
    new Date(dateValue);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Time unavailable";
  }

  return date.toLocaleTimeString(
    [],
    {
      hour: "numeric",
      minute: "2-digit",
    }
  );
}

function formatQuantity(
  quantity: number
) {
  return Number.isInteger(
    quantity
  )
    ? String(quantity)
    : quantity.toFixed(2);
}

function getActivityIcon(
  type: ActivityType
) {
  if (
    type === "clock-in"
  ) {
    return "🟢";
  }

  if (
    type === "clock-out"
  ) {
    return "🔴";
  }

  if (
    type === "material"
  ) {
    return "📦";
  }

  if (
    type === "photo"
  ) {
    return "📷";
  }

  return "📝";
}

function getActivityClasses(
  type: ActivityType
) {
  if (
    type === "clock-in"
  ) {
    return "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300";
  }

  if (
    type === "clock-out"
  ) {
    return "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300";
  }

  if (
    type === "material"
  ) {
    return "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300";
  }

  if (
    type === "photo"
  ) {
    return "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300";
  }

  return "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300";
}

export default function ProjectActivity({
  projectId,
}: ProjectActivityProps) {
  const [
    timeEntries,
    setTimeEntries,
  ] =
    useState<TimeEntry[]>(
      []
    );

  const [
    materials,
    setMaterials,
  ] =
    useState<MaterialEntry[]>(
      []
    );

  const [
    photos,
    setPhotos,
  ] =
    useState<PhotoEntry[]>(
      []
    );

  const [
    dailyNotes,
    setDailyNotes,
  ] =
    useState<DailyNote[]>(
      []
    );

  const [
    dataLoaded,
    setDataLoaded,
  ] =
    useState(false);

  const [
    loadError,
    setLoadError,
  ] =
    useState("");

  useEffect(() => {
    async function loadActivity() {
      try {
        setDataLoaded(false);
        setLoadError("");

        const [
          timeResponse,
          materialsResponse,
          photosResponse,
          notesResponse,
        ] =
          await Promise.all([
            fetch(
              `/api/time-entries?projectId=${projectId}`,
              {
                cache:
                  "no-store",
              }
            ),
            fetch(
              `/api/job-materials?projectId=${projectId}`,
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
            fetch(
              `/api/daily-notes?projectId=${projectId}`,
              {
                cache:
                  "no-store",
              }
            ),
          ]);

        const [
          timeData,
          materialsData,
          photosData,
          notesData,
        ] =
          await Promise.all([
            timeResponse.json(),
            materialsResponse.json(),
            photosResponse.json(),
            notesResponse.json(),
          ]);

        if (
          !timeResponse.ok
        ) {
          throw new Error(
            timeData.error ||
              "Unable to load time activity."
          );
        }

        if (
          !materialsResponse.ok
        ) {
          throw new Error(
            materialsData.error ||
              "Unable to load material activity."
          );
        }

        if (
          !photosResponse.ok
        ) {
          throw new Error(
            photosData.error ||
              "Unable to load photo activity."
          );
        }

        if (
          !notesResponse.ok
        ) {
          throw new Error(
            notesData.error ||
              "Unable to load note activity."
          );
        }

        setTimeEntries(
          Array.isArray(
            timeData
          )
            ? timeData
            : []
        );

        setMaterials(
          Array.isArray(
            materialsData
          )
            ? materialsData
            : []
        );

        setPhotos(
          Array.isArray(
            photosData
          )
            ? photosData
            : []
        );

        setDailyNotes(
          Array.isArray(
            notesData
          )
            ? notesData
            : []
        );
      } catch (error) {
        console.error(
          "Project activity load failed:",
          error
        );

        setLoadError(
          error instanceof Error
            ? error.message
            : "Unable to load project activity."
        );
      } finally {
        setDataLoaded(true);
      }
    }

    void loadActivity();
  }, [projectId]);

  const activities =
    useMemo(() => {
      const activityItems:
        ProjectActivityItem[] =
        [];

      timeEntries
        .filter(
          (entry) =>
            entry.projectId ===
              projectId &&
            isToday(
              entry.clockIn
            )
        )
        .forEach(
          (entry) => {
            activityItems.push({
              id:
                `clock-in-${entry.id}`,
              type:
                "clock-in",
              employeeName:
                entry.employeeName,
              title:
                "Clocked In",
              detail:
                entry.projectName,
              createdAt:
                entry.clockIn,
            });

            if (
              entry.clockOut &&
              isToday(
                entry.clockOut
              )
            ) {
              activityItems.push({
                id:
                  `clock-out-${entry.id}`,
                type:
                  "clock-out",
                employeeName:
                  entry.employeeName,
                title:
                  "Clocked Out",
                detail:
                  entry.projectName,
                createdAt:
                  entry.clockOut,
              });
            }
          }
        );

      materials
        .filter(
          (material) =>
            material.projectId ===
              projectId &&
            isToday(
              material.createdAt
            )
        )
        .forEach(
          (material) => {
            activityItems.push({
              id:
                `material-${material.id}`,
              type:
                "material",
              employeeName:
                material.employeeName,
              title:
                "Added Material",
              detail:
                `${formatQuantity(
                  material.quantity
                )} ${material.unit} ${material.materialName}`,
              createdAt:
                material.createdAt,
            });
          }
        );

      photos
        .filter(
          (photo) =>
            photo.projectId ===
              projectId &&
            isToday(
              photo.createdAt
            )
        )
        .forEach(
          (photo) => {
            activityItems.push({
              id:
                `photo-${photo.id}`,
              type:
                "photo",
              employeeName:
                photo.employeeName,
              title:
                "Uploaded Photo",
              detail:
                photo.note ||
                photo.fileName ||
                "Job photo",
              createdAt:
                photo.createdAt,
            });
          }
        );

      dailyNotes
        .filter(
          (note) =>
            note.projectId ===
              projectId &&
            isToday(
              note.createdAt
            )
        )
        .forEach(
          (note) => {
            activityItems.push({
              id:
                `note-${note.id}`,
              type:
                "note",
              employeeName:
                note.employeeName,
              title:
                "Added Daily Note",
              detail:
                note.note,
              createdAt:
                note.createdAt,
            });
          }
        );

      return activityItems.sort(
        (
          firstActivity,
          secondActivity
        ) =>
          new Date(
            secondActivity.createdAt
          ).getTime() -
          new Date(
            firstActivity.createdAt
          ).getTime()
      );
    }, [
      timeEntries,
      materials,
      photos,
      dailyNotes,
      projectId,
    ]);

  if (!dataLoaded) {
    return (
      <section className="rounded-xl bg-white p-6 shadow dark:bg-slate-900">
        <p className="text-slate-500 dark:text-slate-400">
          Loading project activity...
        </p>
      </section>
    );
  }

  if (loadError) {
    return (
      <section className="rounded-xl bg-white p-6 shadow dark:bg-slate-900">
        <p className="font-semibold text-red-600">
          Unable to load project activity
        </p>

        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {loadError}
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl bg-white p-6 shadow dark:bg-slate-900">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Live Updates
          </p>

          <h2 className="mt-1 text-2xl font-semibold">
            Today&apos;s Activity
          </h2>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Clock-ins, materials, photos, and notes added today.
          </p>
        </div>

        <span className="text-sm text-slate-500 dark:text-slate-400">
          {activities.length}{" "}
          {activities.length === 1
            ? "activity"
            : "activities"}
        </span>
      </div>

      {activities.length > 0 ? (
        <div className="mt-6 space-y-1">
          {activities.map(
            (
              activity,
              index
            ) => (
              <article
                key={
                  activity.id
                }
                className="relative flex gap-4 pb-6"
              >
                {index <
                  activities.length -
                    1 && (
                  <div className="absolute left-5 top-11 h-[calc(100%-28px)] w-px bg-slate-200 dark:bg-slate-700" />
                )}

                <div
                  className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${getActivityClasses(
                    activity.type
                  )}`}
                >
                  <span>
                    {getActivityIcon(
                      activity.type
                    )}
                  </span>
                </div>

                <div className="min-w-0 flex-1 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold">
                        {
                          activity.employeeName
                        }
                      </p>

                      <p className="mt-1 text-sm font-medium">
                        {
                          activity.title
                        }
                      </p>
                    </div>

                    <time className="shrink-0 text-sm text-slate-500 dark:text-slate-400">
                      {formatActivityTime(
                        activity.createdAt
                      )}
                    </time>
                  </div>

                  <p className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {
                      activity.detail
                    }
                  </p>
                </div>
              </article>
            )
          )}
        </div>
      ) : (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
          <div className="text-3xl">
            📋
          </div>

          <p className="mt-3 font-semibold">
            No activity today
          </p>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Clock-ins, materials, photos, and notes will appear here.
          </p>
        </div>
      )}
    </section>
  );
}