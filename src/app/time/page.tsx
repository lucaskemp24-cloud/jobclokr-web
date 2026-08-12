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

  const todaysEntries =
    useMemo(() => {
      if (
        !selectedEmployeeId
      ) {
        return [];
      }

      const today =
        new Date().toDateString();

      return entries.filter(
        (entry) =>
          entry.employeeId ===
            Number(
              selectedEmployeeId
            ) &&
          new Date(
            entry.clockIn
          ).toDateString() ===
            today
      );
    }, [
      entries,
      selectedEmployeeId,
    ]);

  const totalHoursToday =
    todaysEntries.reduce(
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

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold">
            Time Tracking
          </h1>

          <p className="mt-1 text-gray-500 dark:text-slate-400">
            Clock employees in and out of projects.
          </p>
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
              Today&apos;s Summary
            </h2>

            <p className="text-4xl font-bold">
              {totalHoursToday.toFixed(2)}
            </p>

            <p className="mt-1 text-gray-500 dark:text-slate-400">
              Total hours today
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
              ) : todaysEntries.length > 0 ? (
                todaysEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-lg border p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold">
                          {entry.projectName}
                        </p>

                        <p className="text-sm text-gray-500 dark:text-slate-400">
                          {formatTime(entry.clockIn)} –{" "}
                          {entry.clockOut
                            ? formatTime(
                                entry.clockOut
                              )
                            : "Present"}
                        </p>
                      </div>

                      <p className="font-semibold">
                        {calculateHours(
                          entry.clockIn,
                          entry.clockOut
                        ).toFixed(2)}{" "}
                        hrs
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-dashed p-6 text-center">
                  <p className="font-medium">
                    No time recorded today
                  </p>

                  <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                    Clock the employee in to begin
                    recording hours.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}