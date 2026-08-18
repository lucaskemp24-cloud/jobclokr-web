"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import AppLayout from "@/components/layout/AppLayout";
import type { Project } from "@/lib/projects";

type DatabaseEmployee = {
  id: number;
  companyId: number;
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
  createdAt: string;
  updatedAt: string;
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

type SessionData = {
  authenticated?: boolean;
  user?: {
    employeeId: number;
    companyId: number;
    name: string;
    role: "Owner" | "Office" | "Employee";
    isPlatformAdmin?: boolean;
  };
};

function getEmployeeName(
  employee: DatabaseEmployee
) {
  return `${employee.firstName} ${employee.lastName}`.trim();
}

function calculateHours(
  clockIn: string,
  clockOut: string | null
) {
  const startTime =
    new Date(clockIn);

  const endTime = clockOut
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

function formatTime(
  dateValue: string
) {
  return new Date(
    dateValue
  ).toLocaleTimeString(
    [],
    {
      hour: "numeric",
      minute: "2-digit",
    }
  );
}

export default function DashboardPage() {
  const router = useRouter();

  const [
    accessChecked,
    setAccessChecked,
  ] = useState(false);

  const [
    dashboardAllowed,
    setDashboardAllowed,
  ] = useState(false);

  const [
    projects,
    setProjects,
  ] = useState<Project[]>([]);

  const [
    employees,
    setEmployees,
  ] = useState<
    DatabaseEmployee[]
  >([]);

  const [
    entries,
    setEntries,
  ] = useState<TimeEntry[]>([]);

  const [
    currentTime,
    setCurrentTime,
  ] = useState(Date.now());

  async function loadDashboardData() {
    try {
      const [
        projectsResponse,
        employeesResponse,
        timeResponse,
      ] = await Promise.all([
        fetch(
          "/api/projects",
          {
            cache: "no-store",
          }
        ),

        fetch(
          "/api/employees",
          {
            cache: "no-store",
          }
        ),

        fetch(
          "/api/time-entries",
          {
            cache: "no-store",
          }
        ),
      ]);

      if (!projectsResponse.ok) {
        throw new Error(
          "Unable to load projects."
        );
      }

      if (!employeesResponse.ok) {
        throw new Error(
          "Unable to load employees."
        );
      }

      if (!timeResponse.ok) {
        throw new Error(
          "Unable to load time entries."
        );
      }

      const [
        projectData,
        employeeData,
        timeData,
      ] = await Promise.all([
        projectsResponse.json(),
        employeesResponse.json(),
        timeResponse.json(),
      ]);

      setProjects(
        Array.isArray(projectData)
          ? projectData
          : []
      );

      setEmployees(
        Array.isArray(employeeData)
          ? employeeData
          : []
      );

      setEntries(
        Array.isArray(timeData)
          ? timeData
          : []
      );
    } catch (error) {
      console.error(
        "Dashboard database load failed:",
        error
      );
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function checkDashboardAccess() {
      try {
        const response =
          await fetch(
            "/api/session",
            {
              cache: "no-store",
            }
          );

        if (!response.ok) {
          router.replace("/login");
          return;
        }

        const data =
          (await response.json()) as
            SessionData;

        if (
          !data.authenticated ||
          !data.user
        ) {
          router.replace("/login");
          return;
        }

        const user =
          data.user;

        const isPlatformAdmin =
          user.isPlatformAdmin ===
          true;

        const isOfficeUser =
          user.role === "Owner" ||
          user.role === "Office";

        if (
          !isPlatformAdmin &&
          !isOfficeUser
        ) {
          router.replace(
            "/employee-portal"
          );
          return;
        }

        if (!cancelled) {
          setDashboardAllowed(true);
          setAccessChecked(true);
        }
      } catch (error) {
        console.error(
          "Dashboard access check failed:",
          error
        );

        router.replace(
          "/login"
        );
      }
    }

    void checkDashboardAccess();

    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (!dashboardAllowed) {
      return;
    }

    void loadDashboardData();

    const refreshTimer =
      window.setInterval(
        () => {
          void loadDashboardData();
        },
        30000
      );

    return () => {
      window.clearInterval(
        refreshTimer
      );
    };
  }, [dashboardAllowed]);

  useEffect(() => {
    const clockTimer =
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
        clockTimer
      );
    };
  }, []);

  const activeEmployees =
    employees.filter(
      (employee) =>
        employee.active
    );

  const activeEntries =
    entries.filter(
      (entry) =>
        entry.clockOut === null
    );

  const activeEmployeeIds =
    new Set(
      activeEntries.map(
        (entry) =>
          entry.employeeId
      )
    );

  const activeEmployeeNames =
    new Set(
      activeEntries.map(
        (entry) =>
          entry.employeeName
      )
    );

  const clockedOutEmployees =
    activeEmployees.filter(
      (employee) =>
        !activeEmployeeIds.has(
          employee.id
        ) &&
        !activeEmployeeNames.has(
          getEmployeeName(
            employee
          )
        )
    );

  const todaysEntries =
    useMemo(() => {
      const today =
        new Date(
          currentTime
        ).toDateString();

      return entries.filter(
        (entry) =>
          new Date(
            entry.clockIn
          ).toDateString() ===
          today
      );
    }, [
      entries,
      currentTime,
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

  const crewByProject =
    projects
      .map(
        (project) => ({
          project,

          entries:
            activeEntries.filter(
              (entry) =>
                entry.projectId ===
                project.id
            ),
        })
      )
      .filter(
        (group) =>
          group.entries.length >
          0
      );

  if (
    !accessChecked ||
    !dashboardAllowed
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 dark:bg-slate-950">
        <p className="text-slate-500 dark:text-slate-400">
          Loading JobClokr...
        </p>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold">
            Dashboard
          </h1>

          <p className="mt-1 text-gray-500">
            Live view of employees,
            projects, and hours.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-xl bg-white p-6 shadow dark:bg-slate-900">
            <p className="text-sm text-gray-500">
              Employees Working
            </p>

            <p className="mt-2 text-4xl font-bold">
              {activeEntries.length}
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow dark:bg-slate-900">
            <p className="text-sm text-gray-500">
              Active Projects
            </p>

            <p className="mt-2 text-4xl font-bold">
              {crewByProject.length}
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow dark:bg-slate-900">
            <p className="text-sm text-gray-500">
              Labor Hours Today
            </p>

            <p className="mt-2 text-4xl font-bold">
              {totalHoursToday.toFixed(
                2
              )}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="rounded-xl bg-white p-6 shadow dark:bg-slate-900 xl:col-span-2">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl font-semibold">
                Currently Working
              </h2>

              <span className="rounded-full bg-green-100 px-3 py-1 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
                Live
              </span>
            </div>

            {crewByProject.length >
            0 ? (
              <div className="space-y-5">
                {crewByProject.map(
                  ({
                    project,
                    entries,
                  }) => (
                    <div
                      key={
                        project.id
                      }
                      className="rounded-xl border border-slate-200 p-5 dark:border-slate-700"
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-semibold">
                            {
                              project.name
                            }
                          </h3>

                          <p className="text-sm text-gray-500">
                            {
                              project.customer
                            }
                          </p>
                        </div>

                        <span className="rounded-full bg-green-100 px-3 py-1 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
                          {
                            entries.length
                          }{" "}
                          working
                        </span>
                      </div>

                      <div className="space-y-3">
                        {entries.map(
                          (entry) => (
                            <div
                              key={
                                entry.id
                              }
                              className="flex items-center justify-between rounded-lg border border-slate-200 p-4 dark:border-slate-700"
                            >
                              <div>
                                <p className="font-medium">
                                  {
                                    entry.employeeName
                                  }
                                </p>

                                <p className="text-sm text-gray-500">
                                  Clocked
                                  in at{" "}
                                  {formatTime(
                                    entry.clockIn
                                  )}
                                </p>
                              </div>

                              <p className="font-semibold">
                                {calculateHours(
                                  entry.clockIn,
                                  entry.clockOut
                                ).toFixed(
                                  2
                                )}{" "}
                                hrs
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 p-8 text-center text-gray-500 dark:border-slate-700">
                No employees are
                currently clocked
                in.
              </div>
            )}
          </div>

          <div className="rounded-xl bg-white p-6 shadow dark:bg-slate-900">
            <h2 className="mb-5 text-2xl font-semibold">
              Not Clocked In
            </h2>

            {clockedOutEmployees.length >
            0 ? (
              <div className="space-y-3">
                {clockedOutEmployees.map(
                  (employee) => (
                    <div
                      key={
                        employee.id
                      }
                      className="flex items-center gap-3 rounded-lg border border-slate-200 p-4 dark:border-slate-700"
                    >
                      <span className="h-3 w-3 rounded-full bg-gray-300" />

                      <span>
                        {getEmployeeName(
                          employee
                        )}
                      </span>
                    </div>
                  )
                )}
              </div>
            ) : (
              <p className="text-gray-500">
                Everyone is
                currently clocked
                in.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-xl bg-white p-5 shadow dark:bg-slate-900 sm:p-6">
          <h2 className="mb-5 text-2xl font-semibold">
            Today&apos;s Time
            Entries
          </h2>

          {todaysEntries.length >
          0 ? (
            <>
              <div className="space-y-4 md:hidden">
                {todaysEntries.map(
                  (entry) => (
                    <div
                      key={
                        entry.id
                      }
                      className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold">
                            {
                              entry.employeeName
                            }
                          </p>

                          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            {
                              entry.projectName
                            }
                          </p>
                        </div>

                        <div className="rounded-lg bg-blue-50 px-3 py-2 text-right dark:bg-blue-950/40">
                          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">
                            Hours
                          </p>

                          <p className="mt-1 text-lg font-bold text-blue-950 dark:text-blue-100">
                            {calculateHours(
                              entry.clockIn,
                              entry.clockOut
                            ).toFixed(
                              2
                            )}
                          </p>
                        </div>
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
                    </div>
                  )
                )}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full">
                  <thead className="bg-slate-100 dark:bg-slate-800">
                    <tr>
                      <th className="p-4 text-left">
                        Employee
                      </th>

                      <th className="p-4 text-left">
                        Project
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
                    </tr>
                  </thead>

                  <tbody>
                    {todaysEntries.map(
                      (entry) => (
                        <tr
                          key={
                            entry.id
                          }
                          className="border-t dark:border-slate-700"
                        >
                          <td className="p-4">
                            {
                              entry.employeeName
                            }
                          </td>

                          <td className="p-4">
                            {
                              entry.projectName
                            }
                          </td>

                          <td className="p-4">
                            {formatTime(
                              entry.clockIn
                            )}
                          </td>

                          <td className="p-4">
                            {entry.clockOut
                              ? formatTime(
                                  entry.clockOut
                                )
                              : "Present"}
                          </td>

                          <td className="p-4">
                            {calculateHours(
                              entry.clockIn,
                              entry.clockOut
                            ).toFixed(
                              2
                            )}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="text-gray-500 dark:text-slate-400">
              No time entries
              have been recorded
              today.
            </p>
          )}
        </div>
      </div>
    </AppLayout>
  );
}