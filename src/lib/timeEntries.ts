export type TimeEntry = {
  id: number;
  employeeId: number;
  employeeName: string;
  projectId: number;
  projectName: string;
  clockIn: string;
  clockOut: string | null;
};

export type EmployeeLaborSummary = {
  employeeId: number;
  employeeName: string;
  totalHours: number;
  entries: TimeEntry[];
  isClockedIn: boolean;
};

const TIME_STORAGE_KEY =
  "jobclokr-time-entries";

function normalizeTimeEntry(
  entry: Partial<TimeEntry> & {
    employee?: string;
  },
  fallbackId: number
): TimeEntry {
  return {
    id:
      typeof entry.id === "number"
        ? entry.id
        : fallbackId,

    employeeId:
      typeof entry.employeeId === "number"
        ? entry.employeeId
        : 0,

    employeeName:
      typeof entry.employeeName === "string"
        ? entry.employeeName
        : typeof entry.employee === "string"
          ? entry.employee
          : "Unknown Employee",

    projectId:
      typeof entry.projectId === "number"
        ? entry.projectId
        : 0,

    projectName:
      typeof entry.projectName === "string"
        ? entry.projectName
        : "Unknown Project",

    clockIn:
      typeof entry.clockIn === "string"
        ? entry.clockIn
        : new Date().toISOString(),

    clockOut:
      typeof entry.clockOut === "string"
        ? entry.clockOut
        : null,
  };
}

export function loadTimeEntries(): TimeEntry[] {
  if (typeof window === "undefined") {
    return [];
  }

  const savedEntries =
    window.localStorage.getItem(
      TIME_STORAGE_KEY
    );

  if (!savedEntries) {
    return [];
  }

  try {
    const parsedEntries = JSON.parse(
      savedEntries
    );

    if (!Array.isArray(parsedEntries)) {
      return [];
    }

    const normalizedEntries =
      parsedEntries.map(
        (entry, index) =>
          normalizeTimeEntry(
            entry as Partial<TimeEntry> & {
              employee?: string;
            },
            Date.now() + index
          )
      );

    window.localStorage.setItem(
      TIME_STORAGE_KEY,
      JSON.stringify(normalizedEntries)
    );

    return normalizedEntries;
  } catch {
    return [];
  }
}

export function saveTimeEntries(
  entries: TimeEntry[]
): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    TIME_STORAGE_KEY,
    JSON.stringify(entries)
  );
}

export function calculateTimeEntryHours(
  entry: TimeEntry,
  currentTime = new Date()
): number {
  const clockInTime = new Date(
    entry.clockIn
  ).getTime();

  const clockOutTime = entry.clockOut
    ? new Date(entry.clockOut).getTime()
    : currentTime.getTime();

  if (
    Number.isNaN(clockInTime) ||
    Number.isNaN(clockOutTime) ||
    clockOutTime < clockInTime
  ) {
    return 0;
  }

  return (
    (clockOutTime - clockInTime) /
    1000 /
    60 /
    60
  );
}

export function getProjectTimeEntries(
  entries: TimeEntry[],
  projectId: number
): TimeEntry[] {
  return entries
    .filter(
      (entry) =>
        entry.projectId === projectId
    )
    .sort(
      (firstEntry, secondEntry) =>
        new Date(
          secondEntry.clockIn
        ).getTime() -
        new Date(
          firstEntry.clockIn
        ).getTime()
    );
}

export function getProjectTotalHours(
  entries: TimeEntry[],
  projectId: number,
  currentTime = new Date()
): number {
  return getProjectTimeEntries(
    entries,
    projectId
  ).reduce(
    (totalHours, entry) =>
      totalHours +
      calculateTimeEntryHours(
        entry,
        currentTime
      ),
    0
  );
}

export function getEmployeeLaborSummary(
  entries: TimeEntry[],
  projectId: number,
  currentTime = new Date()
): EmployeeLaborSummary[] {
  const projectEntries =
    getProjectTimeEntries(
      entries,
      projectId
    );

  const summaries = new Map<
    number,
    EmployeeLaborSummary
  >();

  projectEntries.forEach((entry) => {
    const existingSummary =
      summaries.get(entry.employeeId);

    const entryHours =
      calculateTimeEntryHours(
        entry,
        currentTime
      );

    if (existingSummary) {
      existingSummary.totalHours +=
        entryHours;

      existingSummary.entries.push(
        entry
      );

      if (entry.clockOut === null) {
        existingSummary.isClockedIn =
          true;
      }

      return;
    }

    summaries.set(entry.employeeId, {
      employeeId: entry.employeeId,
      employeeName:
        entry.employeeName,
      totalHours: entryHours,
      entries: [entry],
      isClockedIn:
        entry.clockOut === null,
    });
  });

  return Array.from(
    summaries.values()
  ).sort(
    (firstSummary, secondSummary) =>
      secondSummary.totalHours -
      firstSummary.totalHours
  );
}

export function getActiveTimeEntries(
  entries: TimeEntry[]
): TimeEntry[] {
  return entries.filter(
    (entry) => entry.clockOut === null
  );
}

export function getEmployeeActiveEntry(
  entries: TimeEntry[],
  employeeId: number
): TimeEntry | null {
  return (
    entries.find(
      (entry) =>
        entry.employeeId === employeeId &&
        entry.clockOut === null
    ) ?? null
  );
}

export function formatTimeEntryTime(
  dateValue: string
): string {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Time unavailable";
  }

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatTimeEntryDate(
  dateValue: string
): string {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}