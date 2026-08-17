"use client";

import { useEffect, useMemo, useState } from "react";

import AppLayout from "@/components/layout/AppLayout";
import { useToast } from "@/components/ui/ToastProvider";

type Project = {
  id: number;
  name: string;
  status: string;
};

type Employee = {
  id: number;
  firstName: string;
  lastName: string;
  active: boolean;
};

type TimeEntry = {
  id: number;
  employeeId: number;
  employeeName: string;
  projectId: number;
  projectName: string;
  clockIn: string;
  clockOut: string | null;
  notes?: string;
  manuallyAdjusted: boolean;
};

type TimeAdjustmentForm = {
  id: number | null;
  employeeId: string;
  projectId: string;
  date: string;
  clockIn: string;
  clockOut: string;
  notes: string;
};

function getEmployeeName(
  employee: Employee
) {
  return `${employee.firstName} ${employee.lastName}`.trim();
}

function formatTime(
  dateValue: string
) {
  return new Date(
    dateValue
  ).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function calculateHours(
  clockIn: string,
  clockOut: string | null
) {
  const startTime =
    new Date(clockIn);

  const endTime =
    clockOut
      ? new Date(clockOut)
      : new Date();

  const milliseconds =
    endTime.getTime() -
    startTime.getTime();

  return Math.max(
    milliseconds /
      1000 /
      60 /
      60,
    0
  );
}

function toDateInputValue(
  dateValue: Date
) {
  const year =
    dateValue.getFullYear();

  const month =
    String(
      dateValue.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      dateValue.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function toTimeInputValue(
  dateValue: Date
) {
  const hours =
    String(
      dateValue.getHours()
    ).padStart(2, "0");

  const minutes =
    String(
      dateValue.getMinutes()
    ).padStart(2, "0");

  return `${hours}:${minutes}`;
}

function buildDateTimeIso(
  dateValue: string,
  timeValue: string
) {
  if (
    !dateValue ||
    !timeValue
  ) {
    return null;
  }

  const localDate =
    new Date(
      `${dateValue}T${timeValue}:00`
    );

  if (
    Number.isNaN(
      localDate.getTime()
    )
  ) {
    return null;
  }

  return localDate.toISOString();
}

export default function TimePage() {
  const { showToast } =
    useToast();

  const [
    projects,
    setProjects,
  ] =
    useState<Project[]>([]);

  const [
    employees,
    setEmployees,
  ] =
    useState<Employee[]>([]);

  const [
    entries,
    setEntries,
  ] =
    useState<TimeEntry[]>([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    working,
    setWorking,
  ] =
    useState(false);

  const [
    adjustmentOpen,
    setAdjustmentOpen,
  ] =
    useState(false);

  const [
    savingAdjustment,
    setSavingAdjustment,
  ] =
    useState(false);

  const [
    deletingAdjustment,
    setDeletingAdjustment,
  ] =
    useState(false);

  const [
    adjustmentForm,
    setAdjustmentForm,
  ] =
    useState<TimeAdjustmentForm>({
      id: null,
      employeeId: "",
      projectId: "",
      date:
        toDateInputValue(
          new Date()
        ),
      clockIn: "",
      clockOut: "",
      notes: "",
    });

  const [
    selectedEmployeeId,
    setSelectedEmployeeId,
  ] =
    useState("");

  const [
    selectedProjectId,
    setSelectedProjectId,
  ] =
    useState("");

  const [
    selectedDate,
    setSelectedDate,
  ] =
    useState(
      toDateInputValue(
        new Date()
      )
    );

  const [
    ,
    setCurrentTime,
  ] =
    useState(
      Date.now()
    );

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        const [
          projectsResponse,
          employeesResponse,
          timeEntriesResponse,
        ] =
          await Promise.all([
            fetch(
              "/api/projects",
              {
                cache:
                  "no-store",
              }
            ),
            fetch(
              "/api/employees",
              {
                cache:
                  "no-store",
              }
            ),
            fetch(
              "/api/time-entries",
              {
                cache:
                  "no-store",
              }
            ),
          ]);

        const projectsData =
          await projectsResponse.json();

        const employeesData =
          await employeesResponse.json();

        const timeEntriesData =
          await timeEntriesResponse.json();

        if (
          !projectsResponse.ok
        ) {
          throw new Error(
            projectsData.error ||
              "Unable to load projects."
          );
        }

        if (
          !employeesResponse.ok
        ) {
          throw new Error(
            employeesData.error ||
              "Unable to load employees."
          );
        }

        if (
          !timeEntriesResponse.ok
        ) {
          throw new Error(
            timeEntriesData.error ||
              "Unable to load time entries."
          );
        }

        setProjects(
          Array.isArray(
            projectsData
          )
            ? projectsData
            : []
        );

        setEmployees(
          Array.isArray(
            employeesData
          )
            ? employeesData
            : []
        );

        setEntries(
          Array.isArray(
            timeEntriesData
          )
            ? timeEntriesData
            : []
        );
      } catch (error) {
        console.error(
          "Failed to load Time page:",
          error
        );

        showToast(
          error instanceof Error
            ? error.message
            : "Unable to load time tracking data.",
          "error"
        );
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, [showToast]);

  useEffect(() => {
    const timer =
      window.setInterval(
        () => {
          setCurrentTime(
            Date.now()
          );
        },
        1000
      );

    return () => {
      window.clearInterval(
        timer
      );
    };
  }, []);

  const activeEmployees =
    employees.filter(
      (employee) =>
        employee.active
    );

  const activeProjects =
    projects.filter(
      (project) =>
        project.status !==
          "Completed" &&
        project.status !==
          "Closed"
    );

  const selectedEmployee =
    employees.find(
      (employee) =>
        employee.id ===
        Number(
          selectedEmployeeId
        )
    );

  const selectedEmployeeName =
    selectedEmployee
      ? getEmployeeName(
          selectedEmployee
        )
      : "";

  const activeEntry =
    entries.find(
      (entry) =>
        entry.employeeId ===
          Number(
            selectedEmployeeId
          ) &&
        entry.clockOut ===
          null
    );

  const selectedDateEntries =
    useMemo(() => {
      if (
        !selectedEmployeeId ||
        !selectedDate
      ) {
        return [];
      }

      return entries
        .filter(
          (entry) => {
            const entryDate =
              toDateInputValue(
                new Date(
                  entry.clockIn
                )
              );

            return (
              entry.employeeId ===
                Number(
                  selectedEmployeeId
                ) &&
              entryDate ===
                selectedDate
            );
          }
        )
        .sort(
          (
            firstEntry,
            secondEntry
          ) =>
            new Date(
              firstEntry.clockIn
            ).getTime() -
            new Date(
              secondEntry.clockIn
            ).getTime()
        );
    }, [
      entries,
      selectedEmployeeId,
      selectedDate,
    ]);

  const totalHoursForDate =
    selectedDateEntries.reduce(
      (
        total,
        entry
      ) =>
        total +
        calculateHours(
          entry.clockIn,
          entry.clockOut
        ),
      0
    );

  const selectedDateLabel =
    new Date(
      `${selectedDate}T12:00:00`
    ).toLocaleDateString(
      [],
      {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }
    );

  const isToday =
    selectedDate ===
    toDateInputValue(
      new Date()
    );


  const dailyEntries =
    useMemo(() => {
      if (!selectedDate) {
        return [];
      }

      return entries
        .filter(
          (entry) =>
            toDateInputValue(
              new Date(
                entry.clockIn
              )
            ) ===
            selectedDate
        )
        .sort(
          (
            firstEntry,
            secondEntry
          ) => {
            const employeeCompare =
              firstEntry.employeeName.localeCompare(
                secondEntry.employeeName
              );

            if (
              employeeCompare !== 0
            ) {
              return employeeCompare;
            }

            return (
              new Date(
                firstEntry.clockIn
              ).getTime() -
              new Date(
                secondEntry.clockIn
              ).getTime()
            );
          }
        );
    }, [
      entries,
      selectedDate,
    ]);

  const dailyTotalHours =
    dailyEntries.reduce(
      (
        total,
        entry
      ) =>
        total +
        calculateHours(
          entry.clockIn,
          entry.clockOut
        ),
      0
    );

  const employeesWithTime =
    new Set(
      dailyEntries.map(
        (entry) =>
          entry.employeeId
      )
    ).size;

  function handleEmployeeChange(
    employeeId: string
  ) {
    setSelectedEmployeeId(
      employeeId
    );

    setSelectedProjectId(
      ""
    );
  }

  async function handleClockIn() {
    if (!selectedEmployee) {
      showToast(
        "Please select an employee.",
        "error"
      );
      return;
    }

    if (
      !selectedProjectId
    ) {
      showToast(
        "Please select a project.",
        "error"
      );
      return;
    }

    if (activeEntry) {
      showToast(
        `${selectedEmployeeName} is already clocked in.`,
        "warning"
      );
      return;
    }

    const project =
      projects.find(
        (
          savedProject
        ) =>
          savedProject.id ===
          Number(
            selectedProjectId
          )
      );

    if (!project) {
      showToast(
        "The selected project could not be found.",
        "error"
      );
      return;
    }

    if (
      project.status ===
        "Completed" ||
      project.status ===
        "Closed"
    ) {
      showToast(
        "Employees cannot clock in to a completed or closed project.",
        "error"
      );
      return;
    }

    try {
      setWorking(true);

      const response =
        await fetch(
          "/api/time-entries",
          {
            method:
              "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body:
              JSON.stringify({
                employeeId:
                  selectedEmployee.id,
                projectId:
                  project.id,
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
        (
          currentEntries
        ) => [
          data,
          ...currentEntries,
        ]
      );

      showToast(
        `${selectedEmployeeName} clocked in to ${project.name}.`,
        "success"
      );
    } catch (error) {
      console.error(
        "Failed to clock in:",
        error
      );

      showToast(
        error instanceof Error
          ? error.message
          : "Unable to clock in.",
        "error"
      );
    } finally {
      setWorking(false);
    }
  }

  async function handleClockOut() {
    if (!selectedEmployee) {
      showToast(
        "Please select an employee.",
        "error"
      );
      return;
    }

    if (!activeEntry) {
      showToast(
        `${selectedEmployeeName} is not currently clocked in.`,
        "warning"
      );
      return;
    }

    try {
      setWorking(true);

      const response =
        await fetch(
          "/api/time-entries",
          {
            method:
              "PATCH",
            headers: {
              "Content-Type":
                "application/json",
            },
            body:
              JSON.stringify({
                id:
                  activeEntry.id,
                employeeId:
                  selectedEmployee.id,
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
        (
          currentEntries
        ) =>
          currentEntries.map(
            (entry) =>
              entry.id ===
              activeEntry.id
                ? data
                : entry
          )
      );

      showToast(
        `${selectedEmployeeName} clocked out of ${activeEntry.projectName}.`,
        "success"
      );

      setSelectedProjectId(
        ""
      );
    } catch (error) {
      console.error(
        "Failed to clock out:",
        error
      );

      showToast(
        error instanceof Error
          ? error.message
          : "Unable to clock out.",
        "error"
      );
    } finally {
      setWorking(false);
    }
  }

  function openAddAdjustment() {
    const now =
      new Date();

    setAdjustmentForm({
      id: null,
      employeeId:
        selectedEmployeeId,
      projectId: "",
      date:
        selectedDate ||
        toDateInputValue(
          now
        ),
      clockIn: "",
      clockOut: "",
      notes: "",
    });

    setAdjustmentOpen(
      true
    );
  }

  function openEditAdjustment(
    entry: TimeEntry
  ) {
    const clockInDate =
      new Date(
        entry.clockIn
      );

    const clockOutDate =
      entry.clockOut
        ? new Date(
            entry.clockOut
          )
        : null;

    setAdjustmentForm({
      id:
        entry.id,
      employeeId:
        String(
          entry.employeeId
        ),
      projectId:
        String(
          entry.projectId
        ),
      date:
        toDateInputValue(
          clockInDate
        ),
      clockIn:
        toTimeInputValue(
          clockInDate
        ),
      clockOut:
        clockOutDate
          ? toTimeInputValue(
              clockOutDate
            )
          : "",
      notes:
        entry.notes ?? "",
    });

    setAdjustmentOpen(
      true
    );
  }

  async function deleteAdjustment() {
    if (
      !adjustmentForm.id
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        "Delete this time entry? This cannot be undone."
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingAdjustment(
        true
      );

      const response =
        await fetch(
          `/api/time-entries?id=${adjustmentForm.id}`,
          {
            method: "DELETE",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to delete time entry."
        );
      }

      setEntries(
        (
          currentEntries
        ) =>
          currentEntries.filter(
            (entry) =>
              entry.id !==
              adjustmentForm.id
          )
      );

      showToast(
        "Time entry deleted.",
        "success"
      );

      setAdjustmentOpen(
        false
      );
    } catch (error) {
      console.error(
        "Failed to delete time entry:",
        error
      );

      showToast(
        error instanceof Error
          ? error.message
          : "Unable to delete time entry.",
        "error"
      );
    } finally {
      setDeletingAdjustment(
        false
      );
    }
  }

  async function saveAdjustment() {
    if (
      !adjustmentForm.employeeId
    ) {
      showToast(
        "Please select an employee.",
        "error"
      );
      return;
    }

    if (
      !adjustmentForm.projectId
    ) {
      showToast(
        "Please select a project.",
        "error"
      );
      return;
    }

    if (
      !adjustmentForm.date ||
      !adjustmentForm.clockIn
    ) {
      showToast(
        "Date and clock-in time are required.",
        "error"
      );
      return;
    }

    const clockInIso =
      buildDateTimeIso(
        adjustmentForm.date,
        adjustmentForm.clockIn
      );

    const clockOutIso =
      adjustmentForm.clockOut
        ? buildDateTimeIso(
            adjustmentForm.date,
            adjustmentForm.clockOut
          )
        : null;

    if (!clockInIso) {
      showToast(
        "Enter a valid clock-in time.",
        "error"
      );
      return;
    }

    if (
      adjustmentForm.clockOut &&
      !clockOutIso
    ) {
      showToast(
        "Enter a valid clock-out time.",
        "error"
      );
      return;
    }

    try {
      setSavingAdjustment(
        true
      );

      const response =
        await fetch(
          "/api/time-entries",
          {
            method: "PUT",
            headers: {
              "Content-Type":
                "application/json",
            },
            body:
              JSON.stringify({
                id:
                  adjustmentForm.id,
                employeeId:
                  Number(
                    adjustmentForm.employeeId
                  ),
                projectId:
                  Number(
                    adjustmentForm.projectId
                  ),
                clockIn:
                  clockInIso,
                clockOut:
                  clockOutIso,
                notes:
                  adjustmentForm.notes,
              }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to save time adjustment."
        );
      }

      setEntries(
        (
          currentEntries
        ) => {
          const exists =
            currentEntries.some(
              (entry) =>
                entry.id ===
                data.id
            );

          if (!exists) {
            return [
              data,
              ...currentEntries,
            ];
          }

          return currentEntries.map(
            (entry) =>
              entry.id ===
              data.id
                ? data
                : entry
          );
        }
      );

      setSelectedEmployeeId(
        String(
          data.employeeId
        )
      );

      setSelectedDate(
        toDateInputValue(
          new Date(
            data.clockIn
          )
        )
      );

      showToast(
        adjustmentForm.id
          ? "Time entry updated."
          : "Missing time entry added.",
        "success"
      );

      setAdjustmentOpen(
        false
      );
    } catch (error) {
      console.error(
        "Failed to save time adjustment:",
        error
      );

      showToast(
        error instanceof Error
          ? error.message
          : "Unable to save time adjustment.",
        "error"
      );
    } finally {
      setSavingAdjustment(
        false
      );
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold">
              Time Tracking
            </h1>

            <p className="mt-1 text-gray-500 dark:text-slate-400">
              Clock employees in and out of projects.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddAdjustment}
            className="rounded-lg bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700"
          >
            + Add Missing Time
          </button>
        </div>

        <div className="rounded-xl bg-white p-5 shadow dark:bg-slate-900">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="w-full sm:max-w-xs">
              <label className="mb-1 block text-sm font-medium">
                Timesheet Date
              </label>

              <input
                type="date"
                value={selectedDate}
                onChange={(event) =>
                  setSelectedDate(
                    event.target.value
                  )
                }
                className="w-full rounded-lg border p-3"
              />
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Viewing {selectedDateLabel}
              </p>

              {!isToday && (
                <button
                  type="button"
                  onClick={() =>
                    setSelectedDate(
                      toDateInputValue(
                        new Date()
                      )
                    )
                  }
                  className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Go to Today
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-5 shadow dark:bg-slate-900 sm:p-6">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">
                Daily Timesheet
              </h2>

              <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                All employee time entries for {selectedDateLabel}.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6 text-sm sm:flex">
              <div>
                <p className="text-gray-500 dark:text-slate-400">
                  Employees
                </p>

                <p className="text-xl font-semibold">
                  {employeesWithTime}
                </p>
              </div>

              <div>
                <p className="text-gray-500 dark:text-slate-400">
                  Total Hours
                </p>

                <p className="text-xl font-semibold">
                  {dailyTotalHours.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {dailyEntries.length > 0 ? (
            <>
              <div className="space-y-4 md:hidden">
                {dailyEntries.map(
                  (entry) => (
                    <div
                      key={entry.id}
                      className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold">
                              {entry.employeeName}
                            </p>

                            {entry.manuallyAdjusted && (
                              <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                                Edited
                              </span>
                            )}
                          </div>

                          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            {entry.projectName}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            openEditAdjustment(
                              entry
                            )
                          }
                          className="shrink-0 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                          Edit
                        </button>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            Clock In
                          </p>

                          <p className="mt-1 font-semibold">
                            {formatTime(
                              entry.clockIn
                            )}
                          </p>
                        </div>

                        <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            Clock Out
                          </p>

                          <p className="mt-1 font-semibold">
                            {entry.clockOut
                              ? formatTime(
                                  entry.clockOut
                                )
                              : "Present"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 rounded-lg bg-blue-50 p-3 dark:bg-blue-950/40">
                        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">
                          Hours
                        </p>

                        <p className="mt-1 text-xl font-bold text-blue-950 dark:text-blue-100">
                          {calculateHours(
                            entry.clockIn,
                            entry.clockOut
                          ).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  )
                )}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full">
                  <thead className="bg-slate-100 dark:bg-slate-800">
                    <tr>
                      <th className="p-3 text-left text-sm font-semibold">
                        Employee
                      </th>

                      <th className="p-3 text-left text-sm font-semibold">
                        Project
                      </th>

                      <th className="p-3 text-left text-sm font-semibold">
                        Clock In
                      </th>

                      <th className="p-3 text-left text-sm font-semibold">
                        Clock Out
                      </th>

                      <th className="p-3 text-right text-sm font-semibold">
                        Hours
                      </th>

                      <th className="p-3 text-right text-sm font-semibold">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {dailyEntries.map(
                      (entry) => (
                        <tr
                          key={entry.id}
                          className="border-t dark:border-slate-700"
                        >
                          <td className="p-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <span>
                                {entry.employeeName}
                              </span>

                              {entry.manuallyAdjusted && (
                                <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                                  Edited
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="p-3">
                            {entry.projectName}
                          </td>

                          <td className="p-3">
                            {formatTime(
                              entry.clockIn
                            )}
                          </td>

                          <td className="p-3">
                            {entry.clockOut
                              ? formatTime(
                                  entry.clockOut
                                )
                              : "Present"}
                          </td>

                          <td className="p-3 text-right font-semibold">
                            {calculateHours(
                              entry.clockIn,
                              entry.clockOut
                            ).toFixed(2)}
                          </td>

                          <td className="p-3 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                openEditAdjustment(
                                  entry
                                )
                              }
                              className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <p className="font-medium">
                No time entries for this date
              </p>

              <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                Use Add Missing Time if an employee forgot to clock in.
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-4 rounded-xl bg-white p-6 shadow dark:bg-slate-900">
            <h2 className="text-2xl font-semibold">
              Clock In / Out
            </h2>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Employee
              </label>

              <select
                value={selectedEmployeeId}
                onChange={(event) =>
                  handleEmployeeChange(
                    event.target.value
                  )
                }
                className="w-full rounded-lg border p-3"
              >
                <option value="">
                  Select an employee
                </option>

                {activeEmployees.map((employee) => (
                  <option
                    key={employee.id}
                    value={employee.id}
                  >
                    {getEmployeeName(employee)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Project
              </label>

              <select
                value={selectedProjectId}
                onChange={(event) =>
                  setSelectedProjectId(
                    event.target.value
                  )
                }
                disabled={
                  loading ||
                  working ||
                  !selectedEmployee ||
                  Boolean(activeEntry)
                }
                className="w-full rounded-lg border p-3 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 dark:disabled:bg-slate-800"
              >
                <option value="">
                  Select a project
                </option>

                {activeProjects.map((project) => (
                  <option
                    key={project.id}
                    value={project.id}
                  >
                    {project.name}
                  </option>
                ))}
              </select>

              {selectedEmployee && activeEntry && (
                <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                  Clock out before choosing another
                  project.
                </p>
              )}
            </div>

            {selectedEmployee ? (
              activeEntry ? (
                <div className="rounded-lg border border-green-300 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
                  <p className="font-semibold text-green-800 dark:text-green-200">
                    Currently Clocked In
                  </p>

                  <div className="mt-3 space-y-1">
                    <p>
                      <strong>Employee:</strong>{" "}
                      {activeEntry.employeeName}
                    </p>

                    <p>
                      <strong>Project:</strong>{" "}
                      {activeEntry.projectName}
                    </p>

                    <p>
                      <strong>Started:</strong>{" "}
                      {formatTime(
                        activeEntry.clockIn
                      )}
                    </p>

                    <p>
                      <strong>
                        Current Hours:
                      </strong>{" "}
                      {calculateHours(
                        activeEntry.clockIn,
                        activeEntry.clockOut
                      ).toFixed(2)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border bg-slate-50 p-4 text-gray-500 dark:bg-slate-800 dark:text-slate-400">
                  {selectedEmployeeName} is currently
                  clocked out.
                </div>
              )
            ) : (
              <div className="rounded-lg border bg-slate-50 p-4 text-gray-500 dark:bg-slate-800 dark:text-slate-400">
                Select an employee to view their time
                status.
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => void handleClockIn()}
                disabled={
                  loading ||
                  working ||
                  !selectedEmployee ||
                  !selectedProjectId ||
                  Boolean(activeEntry)
                }
                className="rounded-lg bg-green-600 py-3 font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300 dark:disabled:bg-slate-700"
              >
                Clock In
              </button>

              <button
                type="button"
                onClick={() => void handleClockOut()}
                disabled={
                  loading ||
                  working ||
                  !selectedEmployee ||
                  !activeEntry
                }
                className="rounded-lg bg-red-600 py-3 font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300 dark:disabled:bg-slate-700"
              >
                Clock Out
              </button>
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow dark:bg-slate-900">
            <h2 className="mb-4 text-2xl font-semibold">
  Employee Summary
</h2>

            <p className="text-4xl font-bold">
              {totalHoursForDate.toFixed(2)}
            </p>

            <p className="mt-1 text-gray-500 dark:text-slate-400">
              Total hours for {selectedDateLabel}
            </p>

            <div className="mt-6 space-y-3">
              {!selectedEmployee ? (
                <div className="rounded-lg border border-dashed p-6 text-center">
                  <p className="font-medium">
                    No employee selected
                  </p>

                  <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                    Select an employee to view today&apos;s
                    time entries.
                  </p>
                </div>
              ) : selectedDateEntries.length > 0 ? (
                selectedDateEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-lg border p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold">
                            {entry.projectName}
                          </p>

                          {entry.manuallyAdjusted && (
                            <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                              Edited
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-gray-500 dark:text-slate-400">
                          {formatTime(entry.clockIn)} –{" "}
                          {entry.clockOut
                            ? formatTime(
                                entry.clockOut
                              )
                            : "Present"}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <p className="font-semibold">
                          {calculateHours(
                            entry.clockIn,
                            entry.clockOut
                          ).toFixed(2)}{" "}
                          hrs
                        </p>

                        <button
                          type="button"
                          onClick={() =>
                            openEditAdjustment(
                              entry
                            )
                          }
                          className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-dashed p-6 text-center">
                  <p className="font-medium">
                    No time recorded
                  </p>

                  <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                    No entries are recorded for this employee on
                    the selected date. Use Add Missing Time if a
                    correction is needed.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {adjustmentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold">
                  {adjustmentForm.id
                    ? "Edit Time Entry"
                    : "Add Missing Time"}
                </h2>

                <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                  Owner/Office manual timesheet adjustment.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setAdjustmentOpen(
                    false
                  )
                }
                className="rounded-lg px-3 py-2 text-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Employee
                </label>

                <select
                  value={
                    adjustmentForm.employeeId
                  }
                  onChange={(event) =>
                    setAdjustmentForm(
                      (current) => ({
                        ...current,
                        employeeId:
                          event.target.value,
                      })
                    )
                  }
                  className="w-full rounded-lg border p-3"
                >
                  <option value="">
                    Select an employee
                  </option>

                  {employees.map(
                    (employee) => (
                      <option
                        key={employee.id}
                        value={employee.id}
                      >
                        {getEmployeeName(
                          employee
                        )}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Project
                </label>

                <select
                  value={
                    adjustmentForm.projectId
                  }
                  onChange={(event) =>
                    setAdjustmentForm(
                      (current) => ({
                        ...current,
                        projectId:
                          event.target.value,
                      })
                    )
                  }
                  className="w-full rounded-lg border p-3"
                >
                  <option value="">
                    Select a project
                  </option>

                  {projects.map(
                    (project) => (
                      <option
                        key={project.id}
                        value={project.id}
                      >
                        {project.name}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Date
                </label>

                <input
                  type="date"
                  value={
                    adjustmentForm.date
                  }
                  onChange={(event) =>
                    setAdjustmentForm(
                      (current) => ({
                        ...current,
                        date:
                          event.target.value,
                      })
                    )
                  }
                  className="w-full rounded-lg border p-3"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Clock In
                </label>

                <input
                  type="time"
                  value={
                    adjustmentForm.clockIn
                  }
                  onChange={(event) =>
                    setAdjustmentForm(
                      (current) => ({
                        ...current,
                        clockIn:
                          event.target.value,
                      })
                    )
                  }
                  className="w-full rounded-lg border p-3"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Clock Out
                </label>

                <input
                  type="time"
                  value={
                    adjustmentForm.clockOut
                  }
                  onChange={(event) =>
                    setAdjustmentForm(
                      (current) => ({
                        ...current,
                        clockOut:
                          event.target.value,
                      })
                    )
                  }
                  className="w-full rounded-lg border p-3"
                />

                <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                  Leave blank only if the employee should remain clocked in.
                </p>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium">
                  Notes
                </label>

                <textarea
                  value={
                    adjustmentForm.notes
                  }
                  onChange={(event) =>
                    setAdjustmentForm(
                      (current) => ({
                        ...current,
                        notes:
                          event.target.value,
                      })
                    )
                  }
                  rows={3}
                  placeholder="Optional adjustment note"
                  className="w-full rounded-lg border p-3"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                {adjustmentForm.id && (
                  <button
                    type="button"
                    onClick={() =>
                      void deleteAdjustment()
                    }
                    disabled={
                      savingAdjustment ||
                      deletingAdjustment
                    }
                    className="rounded-lg bg-red-600 px-4 py-3 font-medium text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {deletingAdjustment
                      ? "Deleting..."
                      : "Delete Entry"}
                  </button>
                )}
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() =>
                    setAdjustmentOpen(
                      false
                    )
                  }
                  disabled={
                    savingAdjustment ||
                    deletingAdjustment
                  }
                  className="rounded-lg border px-4 py-3 font-medium hover:bg-slate-50 disabled:opacity-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() =>
                    void saveAdjustment()
                  }
                  disabled={
                    savingAdjustment ||
                    deletingAdjustment
                  }
                  className="rounded-lg bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {savingAdjustment
                    ? "Saving..."
                    : adjustmentForm.id
                      ? "Save Changes"
                      : "Add Time Entry"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}