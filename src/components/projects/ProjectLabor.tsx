"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useToast } from "@/components/ui/ToastProvider";

import {
  calculateTimeEntryHours,
  formatTimeEntryDate,
  formatTimeEntryTime,
  getEmployeeLaborSummary,
  getProjectTimeEntries,
  getProjectTotalHours,
  type TimeEntry,
} from "@/lib/timeEntries";

type ProjectLaborProps = {
  projectId: number;
};

type AssignedEmployee = {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  role:
    | "OWNER"
    | "OFFICE"
    | "FOREMAN"
    | "EMPLOYEE";
  active: boolean;
};

function getEmployeeName(
  employee: AssignedEmployee
) {
  return `${employee.firstName} ${employee.lastName}`.trim();
}

export default function ProjectLabor({
  projectId,
}: ProjectLaborProps) {
  const { showToast } = useToast();

  const [entries, setEntries] =
    useState<TimeEntry[]>([]);

  const [
    assignedEmployees,
    setAssignedEmployees,
  ] = useState<AssignedEmployee[]>([]);

  const [dataLoaded, setDataLoaded] =
    useState(false);

  const [loadError, setLoadError] =
    useState("");

  const [currentTime, setCurrentTime] =
    useState(new Date());

  const [
    busyEmployeeId,
    setBusyEmployeeId,
  ] = useState<number | null>(null);

  async function loadLaborData() {
    try {
      setDataLoaded(false);
      setLoadError("");

      const [
        entriesResponse,
        assignmentsResponse,
      ] = await Promise.all([
        fetch(
          `/api/time-entries?projectId=${projectId}`,
          {
            method: "GET",
            cache: "no-store",
          }
        ),
        fetch(
          `/api/project-assignments?projectId=${projectId}`,
          {
            method: "GET",
            cache: "no-store",
          }
        ),
      ]);

      const entriesData =
        await entriesResponse.json();

      const assignmentsData =
        await assignmentsResponse.json();

      if (!entriesResponse.ok) {
        throw new Error(
          entriesData.error ||
            "Unable to load project labor."
        );
      }

      if (!assignmentsResponse.ok) {
        throw new Error(
          assignmentsData.error ||
            "Unable to load assigned employees."
        );
      }

      setEntries(
        Array.isArray(entriesData)
          ? entriesData
          : []
      );

      setAssignedEmployees(
        Array.isArray(assignmentsData)
          ? assignmentsData
          : []
      );
    } catch (error) {
      console.error(
        "Project labor load failed:",
        error
      );

      setEntries([]);
      setAssignedEmployees([]);

      setLoadError(
        error instanceof Error
          ? error.message
          : "Unable to load project labor."
      );
    } finally {
      setDataLoaded(true);
    }
  }

  useEffect(() => {
    void loadLaborData();
  }, [projectId]);

  useEffect(() => {
    const timer =
      window.setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  const projectEntries = useMemo(() => {
    return getProjectTimeEntries(
      entries,
      projectId
    );
  }, [entries, projectId]);

  const employeeSummaries = useMemo(() => {
    return getEmployeeLaborSummary(
      entries,
      projectId,
      currentTime
    );
  }, [
    entries,
    projectId,
    currentTime,
  ]);

  const totalProjectHours = useMemo(() => {
    return getProjectTotalHours(
      entries,
      projectId,
      currentTime
    );
  }, [
    entries,
    projectId,
    currentTime,
  ]);

  const activeEntries = useMemo(() => {
    return projectEntries.filter(
      (entry) =>
        entry.clockOut === null
    );
  }, [projectEntries]);

  function getActiveEntryForEmployee(
    employeeId: number
  ) {
    return projectEntries.find(
      (entry) =>
        entry.employeeId === employeeId &&
        entry.clockOut === null
    );
  }

  async function handleClockIn(
    employee: AssignedEmployee
  ) {
    try {
      setBusyEmployeeId(employee.id);

      const response = await fetch(
        "/api/time-entries",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            projectId,
            employeeId: employee.id,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to clock in."
        );
      }

      setEntries(
        (currentEntries) => [
          data,
          ...currentEntries,
        ]
      );

      showToast(
        `${getEmployeeName(
          employee
        )} clocked in.`,
        "success"
      );
    } catch (error) {
      console.error(
        "Clock in failed:",
        error
      );

      showToast(
        error instanceof Error
          ? error.message
          : "Unable to clock in.",
        "error"
      );
    } finally {
      setBusyEmployeeId(null);
    }
  }

  async function handleClockOut(
    employee: AssignedEmployee
  ) {
    const activeEntry =
      getActiveEntryForEmployee(
        employee.id
      );

    if (!activeEntry) {
      showToast(
        "No active time entry was found for this employee.",
        "error"
      );
      return;
    }

    try {
      setBusyEmployeeId(employee.id);

      const response = await fetch(
        "/api/time-entries",
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            id: activeEntry.id,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to clock out."
        );
      }

      setEntries(
        (currentEntries) =>
          currentEntries.map(
            (entry) =>
              entry.id === data.id
                ? data
                : entry
          )
      );

      showToast(
        `${getEmployeeName(
          employee
        )} clocked out.`,
        "success"
      );
    } catch (error) {
      console.error(
        "Clock out failed:",
        error
      );

      showToast(
        error instanceof Error
          ? error.message
          : "Unable to clock out.",
        "error"
      );
    } finally {
      setBusyEmployeeId(null);
    }
  }

  if (!dataLoaded) {
    return (
      <section className="rounded-xl bg-white p-6 shadow dark:bg-slate-900">
        <p className="text-slate-500 dark:text-slate-400">
          Loading project labor...
        </p>
      </section>
    );
  }

  if (loadError) {
    return (
      <section className="rounded-xl bg-white p-6 shadow dark:bg-slate-900">
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 dark:border-red-900 dark:bg-red-950/30">
          <h2 className="font-semibold text-red-700 dark:text-red-300">
            Unable to load project labor
          </h2>

          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {loadError}
          </p>

          <button
            type="button"
            onClick={() =>
              void loadLaborData()
            }
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-xl bg-white p-6 shadow dark:bg-slate-900">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Time Tracking
          </p>

          <h2 className="mt-1 text-2xl font-semibold">
            Project Labor
          </h2>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Clock assigned employees in and out. All time is stored in PostgreSQL.
          </p>
        </div>

        <div className="rounded-xl bg-blue-50 px-5 py-4 text-right dark:bg-blue-950/40">
          <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
            Total Labor
          </p>

          <p className="mt-1 text-3xl font-bold text-blue-950 dark:text-white">
            {totalProjectHours.toFixed(2)}
          </p>

          <p className="text-sm text-blue-700 dark:text-blue-300">
            hours
          </p>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-xl font-semibold">
            Assigned Employees
          </h3>

          <span className="text-sm text-slate-500 dark:text-slate-400">
            {assignedEmployees.length}{" "}
            {assignedEmployees.length === 1
              ? "employee"
              : "employees"}
          </span>
        </div>

        {assignedEmployees.length > 0 ? (
          <div className="mt-4 space-y-3">
            {assignedEmployees.map(
              (employee) => {
                const activeEntry =
                  getActiveEntryForEmployee(
                    employee.id
                  );

                const isBusy =
                  busyEmployeeId ===
                  employee.id;

                return (
                  <div
                    key={employee.id}
                    className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">
                          {getEmployeeName(
                            employee
                          )}
                        </p>

                        {activeEntry && (
                          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-950 dark:text-green-300">
                            Clocked In
                          </span>
                        )}
                      </div>

                      {activeEntry && (
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          Since{" "}
                          {formatTimeEntryTime(
                            activeEntry.clockIn
                          )}
                        </p>
                      )}
                    </div>

                    {activeEntry ? (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() =>
                          void handleClockOut(
                            employee
                          )
                        }
                        className="rounded-lg bg-red-600 px-5 py-2 font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isBusy
                          ? "Clocking Out..."
                          : "Clock Out"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={
                          isBusy ||
                          !employee.active
                        }
                        onClick={() =>
                          void handleClockIn(
                            employee
                          )
                        }
                        className="rounded-lg bg-green-600 px-5 py-2 font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isBusy
                          ? "Clocking In..."
                          : "Clock In"}
                      </button>
                    )}
                  </div>
                );
              }
            )}
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-slate-300 p-6 text-center dark:border-slate-700">
            <p className="font-semibold">
              No assigned employees
            </p>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Assign an employee to this project before recording labor.
            </p>
          </div>
        )}
      </div>

      {activeEntries.length > 0 && (
        <div className="mt-6 rounded-xl border border-green-300 bg-green-50 p-5 dark:border-green-800 dark:bg-green-950/30">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">
                Working Right Now
              </h3>

              <p className="mt-1 text-sm text-green-700 dark:text-green-300">
                {activeEntries.length} active{" "}
                {activeEntries.length === 1
                  ? "timer"
                  : "timers"}
              </p>
            </div>

            <span className="h-3 w-3 rounded-full bg-green-500" />
          </div>

          <div className="mt-4 space-y-3">
            {activeEntries.map(
              (entry) => (
                <div
                  key={entry.id}
                  className="flex flex-col gap-2 rounded-lg bg-white p-4 sm:flex-row sm:items-center sm:justify-between dark:bg-slate-900"
                >
                  <div>
                    <p className="font-semibold">
                      {entry.employeeName}
                    </p>

                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Started{" "}
                      {formatTimeEntryTime(
                        entry.clockIn
                      )}
                    </p>
                  </div>

                  <p className="text-lg font-bold text-green-700 dark:text-green-300">
                    {calculateTimeEntryHours(
                      entry,
                      currentTime
                    ).toFixed(2)}{" "}
                    hrs
                  </p>
                </div>
              )
            )}
          </div>
        </div>
      )}

      <div className="mt-6">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-xl font-semibold">
            Employee Labor Summary
          </h3>

          <span className="text-sm text-slate-500 dark:text-slate-400">
            {employeeSummaries.length}{" "}
            {employeeSummaries.length === 1
              ? "employee"
              : "employees"}
          </span>
        </div>

        {employeeSummaries.length > 0 ? (
          <div className="mt-4 space-y-3">
            {employeeSummaries.map(
              (summary) => (
                <div
                  key={summary.employeeId}
                  className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">
                          {summary.employeeName}
                        </p>

                        {summary.isClockedIn && (
                          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-950 dark:text-green-300">
                            Clocked In
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {summary.entries.length}{" "}
                        {summary.entries.length === 1
                          ? "time entry"
                          : "time entries"}
                      </p>
                    </div>

                    <p className="text-2xl font-bold">
                      {summary.totalHours.toFixed(
                        2
                      )}
                    </p>
                  </div>
                </div>
              )
            )}
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
            <div className="text-3xl">
              ⏱️
            </div>

            <p className="mt-3 font-semibold">
              No labor recorded
            </p>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Employee clock-ins for this project will appear here automatically.
            </p>
          </div>
        )}
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-xl font-semibold">
            Time Entry History
          </h3>

          <span className="text-sm text-slate-500 dark:text-slate-400">
            {projectEntries.length}{" "}
            {projectEntries.length === 1
              ? "entry"
              : "entries"}
          </span>
        </div>

        {projectEntries.length > 0 ? (
          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px]">
                <thead className="bg-slate-100 dark:bg-slate-800">
                  <tr>
                    <th className="p-4 text-left">
                      Employee
                    </th>

                    <th className="p-4 text-left">
                      Date
                    </th>

                    <th className="p-4 text-left">
                      Clock In
                    </th>

                    <th className="p-4 text-left">
                      Clock Out
                    </th>

                    <th className="p-4 text-left">
                      Hours
                    </th>

                    <th className="p-4 text-left">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {projectEntries.map(
                    (entry) => (
                      <tr
                        key={entry.id}
                        className="border-t border-slate-200 dark:border-slate-700"
                      >
                        <td className="p-4 font-semibold">
                          {entry.employeeName}
                        </td>

                        <td className="p-4">
                          {formatTimeEntryDate(
                            entry.clockIn
                          )}
                        </td>

                        <td className="p-4">
                          {formatTimeEntryTime(
                            entry.clockIn
                          )}
                        </td>

                        <td className="p-4">
                          {entry.clockOut
                            ? formatTimeEntryTime(
                                entry.clockOut
                              )
                            : "Present"}
                        </td>

                        <td className="p-4 font-semibold">
                          {calculateTimeEntryHours(
                            entry,
                            currentTime
                          ).toFixed(2)}
                        </td>

                        <td className="p-4">
                          {entry.clockOut ? (
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                              Completed
                            </span>
                          ) : (
                            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-950 dark:text-green-300">
                              Active
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
            <p className="font-semibold">
              No time entries yet
            </p>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Clock-in and clock-out history for this project will appear here.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}