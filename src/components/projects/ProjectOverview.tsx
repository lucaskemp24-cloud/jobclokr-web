"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

type ProjectOverviewProps = {
  projectId: number;
  assignedEmployeeCount: number;
  startDate: string;
};

type TimeEntry = {
  id: number;
  employeeId: number;
  employeeName: string;
  projectId: number;
  projectName: string;
  clockIn: string;
  clockOut: string | null;
  notes: string;
};

type MaterialEntry = {
  id: number;
  projectId: number;
};

type PhotoEntry = {
  id: number;
  projectId: number;
};

type DailyNoteEntry = {
  id: number;
  projectId: number;
};

function calculateDaysActive(startDate: string) {
  if (!startDate) {
    return 0;
  }

  const start = new Date(startDate);

  if (Number.isNaN(start.getTime())) {
    return 0;
  }

  const today = new Date();

  start.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const milliseconds =
    today.getTime() - start.getTime();

  if (milliseconds < 0) {
    return 0;
  }

  return (
    Math.floor(
      milliseconds / 1000 / 60 / 60 / 24
    ) + 1
  );
}

function calculateHours(
  entry: TimeEntry,
  currentTime: Date
) {
  const clockIn = new Date(entry.clockIn);

  const clockOut = entry.clockOut
    ? new Date(entry.clockOut)
    : currentTime;

  if (
    Number.isNaN(clockIn.getTime()) ||
    Number.isNaN(clockOut.getTime())
  ) {
    return 0;
  }

  const milliseconds =
    clockOut.getTime() - clockIn.getTime();

  if (milliseconds <= 0) {
    return 0;
  }

  return milliseconds / 1000 / 60 / 60;
}

export default function ProjectOverview({
  projectId,
  assignedEmployeeCount,
  startDate,
}: ProjectOverviewProps) {
  const [timeEntries, setTimeEntries] =
    useState<TimeEntry[]>([]);

  const [materials, setMaterials] =
    useState<MaterialEntry[]>([]);

  const [photos, setPhotos] =
    useState<PhotoEntry[]>([]);

  const [dailyNotes, setDailyNotes] =
    useState<DailyNoteEntry[]>([]);

  const [dataLoaded, setDataLoaded] =
    useState(false);

  const [loadError, setLoadError] =
    useState("");

  const [currentTime, setCurrentTime] =
    useState(new Date());

  useEffect(() => {
    async function loadOverviewData() {
      try {
        setDataLoaded(false);
        setLoadError("");

        const [
          timeResponse,
          materialsResponse,
          photosResponse,
          notesResponse,
        ] = await Promise.all([
          fetch(
            `/api/time-entries?projectId=${projectId}`,
            {
              cache: "no-store",
            }
          ),
          fetch(
            `/api/job-materials?projectId=${projectId}`,
            {
              cache: "no-store",
            }
          ),
          fetch(
            `/api/job-photos?projectId=${projectId}`,
            {
              cache: "no-store",
            }
          ),
          fetch(
            `/api/daily-notes?projectId=${projectId}`,
            {
              cache: "no-store",
            }
          ),
        ]);

        const [
          timeData,
          materialsData,
          photosData,
          notesData,
        ] = await Promise.all([
          timeResponse.json(),
          materialsResponse.json(),
          photosResponse.json(),
          notesResponse.json(),
        ]);

        if (!timeResponse.ok) {
          throw new Error(
            timeData.error ||
              "Unable to load time entries."
          );
        }

        if (!materialsResponse.ok) {
          throw new Error(
            materialsData.error ||
              "Unable to load materials."
          );
        }

        if (!photosResponse.ok) {
          throw new Error(
            photosData.error ||
              "Unable to load photos."
          );
        }

        if (!notesResponse.ok) {
          throw new Error(
            notesData.error ||
              "Unable to load daily notes."
          );
        }

        setTimeEntries(
          Array.isArray(timeData)
            ? timeData
            : []
        );

        setMaterials(
          Array.isArray(materialsData)
            ? materialsData
            : []
        );

        setPhotos(
          Array.isArray(photosData)
            ? photosData
            : []
        );

        setDailyNotes(
          Array.isArray(notesData)
            ? notesData
            : []
        );
      } catch (error) {
        console.error(
          "Project overview load failed:",
          error
        );

        setLoadError(
          error instanceof Error
            ? error.message
            : "Unable to load project overview."
        );
      } finally {
        setDataLoaded(true);
      }
    }

    void loadOverviewData();
  }, [projectId]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  const totalLaborHours = useMemo(() => {
    return timeEntries.reduce(
      (total, entry) =>
        total +
        calculateHours(entry, currentTime),
      0
    );
  }, [timeEntries, currentTime]);

  const materialCount = materials.length;

  const photoCount = photos.length;

  const noteCount = dailyNotes.length;

  const daysActive = useMemo(() => {
    return calculateDaysActive(startDate);
  }, [startDate]);

  const cards = [
    {
      label: "Labor Hours",
      value: totalLaborHours.toFixed(2),
      icon: "👷",
      detail:
        "Calculated from database time entries",
    },
    {
      label: "Materials",
      value: String(materialCount),
      icon: "📦",
      detail:
        materialCount === 1
          ? "Material entry"
          : "Material entries",
    },
    {
      label: "Photos",
      value: String(photoCount),
      icon: "📷",
      detail:
        photoCount === 1
          ? "Job photo"
          : "Job photos",
    },
    {
      label: "Daily Notes",
      value: String(noteCount),
      icon: "📝",
      detail:
        noteCount === 1
          ? "Daily note"
          : "Daily notes",
    },
    {
      label: "Employees",
      value: String(
        assignedEmployeeCount
      ),
      icon: "👥",
      detail:
        assignedEmployeeCount === 1
          ? "Assigned employee"
          : "Assigned employees",
    },
    {
      label: "Days Active",
      value: String(daysActive),
      icon: "📅",
      detail: startDate
        ? "Since project start"
        : "Start date not set",
    },
  ];

  if (!dataLoaded) {
    return (
      <section className="rounded-xl bg-white p-6 shadow dark:bg-slate-900">
        <p className="text-slate-500 dark:text-slate-400">
          Loading project overview...
        </p>
      </section>
    );
  }

  if (loadError) {
    return (
      <section className="rounded-xl bg-white p-6 shadow dark:bg-slate-900">
        <p className="font-semibold text-red-600">
          Unable to load project overview
        </p>

        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {loadError}
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl bg-white p-6 shadow dark:bg-slate-900">
      <div>
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
          Live Project Data
        </p>

        <h2 className="mt-1 text-2xl font-semibold">
          Project Overview
        </h2>

        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          A live summary of labor and field
          activity.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <article
            key={card.label}
            className="rounded-xl border border-slate-200 p-5 dark:border-slate-700"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                  {card.label}
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {card.value}
                </p>
              </div>

              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-2xl dark:bg-blue-950/40">
                {card.icon}
              </span>
            </div>

            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
              {card.detail}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}