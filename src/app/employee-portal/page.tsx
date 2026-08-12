"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import EmployeeLayout from "@/components/layout/EmployeeLayout";
import { useToast } from "@/components/ui/ToastProvider";

import {
  loadAuthUser,
  type AuthUser,
} from "@/lib/auth";

type DatabaseEmployee = {
  id: number;
  companyId: number;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  role: "OWNER" | "OFFICE" | "FOREMAN" | "EMPLOYEE";
  active: boolean;
};

type SchedulePriority =
  | "NORMAL"
  | "HIGH"
  | "EMERGENCY";

type ScheduledEmployee = {
  id: number;
  firstName: string;
  lastName: string;
  role: "OWNER" | "OFFICE" | "FOREMAN" | "EMPLOYEE";
  active: boolean;
};

type ScheduleAssignment = {
  id: number;
  date: string;
  projectId: number;
  projectName: string;
  customerId: number;
  customerName: string;
  address: string;
  status: string;
  priority: SchedulePriority;
  notes: string;
  employeeIds: number[];
  employees: ScheduledEmployee[];
};

type PortalProject = {
  id: number;
  name: string;
  customer: string;
  address: string;
  status: string;
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

const SELECTED_PROJECT_STORAGE_KEY =
  "jobclokr-employee-selected-project";

const OFFICE_PHONE_NUMBER =
  "5555550101";

function getTodayDate() {
  const today = new Date();

  const year = today.getFullYear();

  const month = String(
    today.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    today.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
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

function getPriorityLabel(
  priority: SchedulePriority
) {
  if (
    priority ===
    "EMERGENCY"
  ) {
    return "Emergency";
  }

  if (
    priority === "HIGH"
  ) {
    return "High";
  }

  return "Normal";
}

function getPriorityClasses(
  priority: SchedulePriority
) {
  if (
    priority ===
    "EMERGENCY"
  ) {
    return "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300";
  }

  if (
    priority === "HIGH"
  ) {
    return "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300";
  }

  return "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300";
}

function formatRole(
  role: ScheduledEmployee["role"]
) {
  if (role === "OWNER") {
    return "Owner";
  }

  if (role === "OFFICE") {
    return "Office";
  }

  if (role === "FOREMAN") {
    return "Foreman";
  }

  return "Employee";
}

export default function EmployeePortalPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [
    authUser,
    setAuthUser,
  ] =
    useState<AuthUser | null>(
      null
    );

  const [
    employee,
    setEmployee,
  ] =
    useState<DatabaseEmployee | null>(
      null
    );

  const [
    assignments,
    setAssignments,
  ] =
    useState<
      ScheduleAssignment[]
    >([]);

  const [
    entries,
    setEntries,
  ] =
    useState<TimeEntry[]>(
      []
    );

  const [
    dataLoaded,
    setDataLoaded,
  ] =
    useState(false);

  const [
    ,
    setCurrentTime,
  ] =
    useState(Date.now());

  useEffect(() => {
    async function loadPortal() {
      const savedUser =
        loadAuthUser();

      if (!savedUser) {
        router.replace(
          "/login"
        );
        return;
      }

      if (
        savedUser.role ===
          "Owner" ||
        savedUser.role ===
          "Office"
      ) {
        router.replace("/");
        return;
      }

      try {
        setDataLoaded(false);

        const [
          employeesResponse,
          scheduleResponse,
          timeEntriesResponse,
        ] =
          await Promise.all([
            fetch(
              "/api/employees",
              {
                cache:
                  "no-store",
              }
            ),
            fetch(
              `/api/schedule?date=${getTodayDate()}&employeeId=${savedUser.employeeId}`,
              {
                cache:
                  "no-store",
              }
            ),
            fetch(
              `/api/time-entries?employeeId=${savedUser.employeeId}`,
              {
                cache:
                  "no-store",
              }
            ),
          ]);

        const employeesData =
          await employeesResponse.json();

        const scheduleData =
          await scheduleResponse.json();

        const timeEntriesData =
          await timeEntriesResponse.json();

        if (
          !employeesResponse.ok
        ) {
          throw new Error(
            employeesData.error ||
              "Unable to load employee."
          );
        }

        if (
          !scheduleResponse.ok
        ) {
          throw new Error(
            scheduleData.error ||
              "Unable to load today's schedule."
          );
        }

        if (
          !timeEntriesResponse.ok
        ) {
          throw new Error(
            timeEntriesData.error ||
              "Unable to load your time entries."
          );
        }

        const loggedInEmployee =
          (
            Array.isArray(
              employeesData
            )
              ? employeesData
              : []
          ).find(
            (
              savedEmployee: DatabaseEmployee
            ) =>
              savedEmployee.id ===
                savedUser.employeeId &&
              savedEmployee.active
          );

        if (
          !loggedInEmployee
        ) {
          throw new Error(
            "Your active employee account could not be found."
          );
        }

        setAuthUser(
          savedUser
        );

        setEmployee(
          loggedInEmployee
        );

        setAssignments(
          Array.isArray(
            scheduleData
          )
            ? scheduleData
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
          "Employee portal load failed:",
          error
        );

        showToast(
          error instanceof Error
            ? error.message
            : "Unable to load the employee portal.",
          "error"
        );
      } finally {
        setDataLoaded(
          true
        );
      }
    }

    void loadPortal();
  }, [router, showToast]);

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

    return () =>
      window.clearInterval(
        timer
      );
  }, []);

  const scheduledJobs =
    useMemo(() => {
      const priorityOrder: Record<
        SchedulePriority,
        number
      > = {
        EMERGENCY: 0,
        HIGH: 1,
        NORMAL: 2,
      };

      return assignments
        .map(
          (
            assignment
          ) => ({
            assignment,
            project: {
              id:
                assignment.projectId,
              name:
                assignment.projectName,
              customer:
                assignment.customerName,
              address:
                assignment.address,
              status:
                assignment.status,
            } satisfies PortalProject,
            crewMembers:
              assignment.employees,
          })
        )
        .sort(
          (
            first,
            second
          ) =>
            priorityOrder[
              first.assignment
                .priority
            ] -
            priorityOrder[
              second.assignment
                .priority
            ]
        );
    }, [assignments]);

  const activeEntry =
    entries.find(
      (entry) =>
        entry.employeeId ===
          authUser?.employeeId &&
        entry.clockOut ===
          null
    );

  const activeProject =
    activeEntry
      ? scheduledJobs.find(
          (job) =>
            job.project.id ===
            activeEntry.projectId
        )?.project ??
        null
      : null;

  const todaysEmployeeEntries =
    useMemo(() => {
      if (!authUser) {
        return [];
      }

      const today =
        new Date().toDateString();

      return entries
        .filter(
          (entry) =>
            entry.employeeId ===
              authUser.employeeId &&
            new Date(
              entry.clockIn
            ).toDateString() ===
              today
        )
        .sort(
          (
            firstEntry,
            secondEntry
          ) =>
            new Date(
              secondEntry.clockIn
            ).getTime() -
            new Date(
              firstEntry.clockIn
            ).getTime()
        );
    }, [
      entries,
      authUser,
    ]);

  const hoursToday =
    todaysEmployeeEntries.reduce(
      (total, entry) =>
        total +
        calculateHours(
          entry.clockIn,
          entry.clockOut
        ),
      0
    );

  function rememberSelectedProject(
    projectId: number
  ) {
    window.localStorage.setItem(
      SELECTED_PROJECT_STORAGE_KEY,
      String(projectId)
    );
  }

  async function handleClockIn(
    project: PortalProject
  ) {
    if (
      !authUser ||
      !employee
    ) {
      showToast(
        "Your employee account could not be loaded.",
        "error"
      );
      return;
    }

    if (activeEntry) {
      showToast(
        `You are already clocked in to ${activeEntry.projectName}. Clock out before switching jobs.`,
        "warning"
      );
      return;
    }

    const isScheduled =
      assignments.some(
        (assignment) =>
          assignment.projectId ===
          project.id
      );

    if (!isScheduled) {
      showToast(
        "This project is not assigned to you today.",
        "error"
      );
      return;
    }

    try {
      const response =
        await fetch(
          "/api/time-entries",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body:
              JSON.stringify({
                employeeId:
                  authUser.employeeId,
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

      rememberSelectedProject(
        project.id
      );

      setEntries(
        (currentEntries) => [
          data,
          ...currentEntries,
        ]
      );

      showToast(
        `Clocked in to ${project.name}.`,
        "success"
      );
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "Unable to clock in.",
        "error"
      );
    }
  }

  async function handleClockOut() {
    if (
      !authUser ||
      !activeEntry
    ) {
      showToast(
        "You are not currently clocked in.",
        "warning"
      );
      return;
    }

    try {
      const response =
        await fetch(
          "/api/time-entries",
          {
            method: "PATCH",
            headers: {
              "Content-Type":
                "application/json",
            },
            body:
              JSON.stringify({
                id:
                  activeEntry.id,
                employeeId:
                  authUser.employeeId,
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
              entry.id ===
              data.id
                ? data
                : entry
          )
      );

      showToast(
        `Clocked out of ${data.projectName}.`,
        "success"
      );
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "Unable to clock out.",
        "error"
      );
    }
  }

  function handleOpenMaps(
    project: PortalProject
  ) {
    if (
      !project.address
    ) {
      showToast(
        "No job address has been added.",
        "error"
      );
      return;
    }

    const encodedAddress =
      encodeURIComponent(
        project.address
      );

    window.open(
      `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  function handlePhotos(
    project: PortalProject
  ) {
    rememberSelectedProject(
      project.id
    );

    router.push(
      `/employee-portal/photos?projectId=${project.id}`
    );
  }

  function handleNotes(
    project: PortalProject
  ) {
    rememberSelectedProject(
      project.id
    );

    router.push(
      `/employee-portal/notes?projectId=${project.id}`
    );
  }

  function handleMaterials(
    project: PortalProject
  ) {
    rememberSelectedProject(
      project.id
    );

    router.push(
      `/employee-portal/materials?projectId=${project.id}`
    );
  }

  function handleDocuments(
    project: PortalProject
  ) {
    rememberSelectedProject(
      project.id
    );

    router.push(
      `/employee-portal/documents?projectId=${project.id}`
    );
  }

  function handleContactOffice() {
    window.location.href =
      `tel:${OFFICE_PHONE_NUMBER}`;
  }

  if (
    !dataLoaded ||
    !authUser ||
    !employee
  ) {
    return (
      <EmployeeLayout>
        <div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center">
          <div className="w-full rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-blue-600 border-r-transparent" />

            <p className="mt-4 text-slate-500 dark:text-slate-400">
              Loading employee portal...
            </p>
          </div>
        </div>
      </EmployeeLayout>
    );
  }

  return (
    <EmployeeLayout>
      <div className="mx-auto w-full max-w-xl pb-48 sm:pb-8">
        <header className="mb-5">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Good morning,
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
            {employee.firstName}
          </h1>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Here&apos;s your workday at a glance.
          </p>
        </header>

        {activeEntry && (
          <section className="mb-5 rounded-2xl border border-blue-300 bg-blue-50 p-5 shadow-sm dark:border-blue-800 dark:bg-blue-950/40">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-xl font-bold text-white">
                ✓
              </span>

              <div className="min-w-0">
                <p className="font-bold text-blue-950 dark:text-blue-100">
                  Currently Working
                </p>

                <p className="truncate text-lg font-semibold text-blue-900 dark:text-blue-200">
                  {activeEntry.projectName}
                </p>

                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Started at{" "}
                  {formatTime(
                    activeEntry.clockIn
                  )}
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-end justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">
                  Current Hours
                </p>

                <p className="mt-1 text-4xl font-bold text-blue-950 dark:text-white">
                  {calculateHours(
                    activeEntry.clockIn,
                    activeEntry.clockOut
                  ).toFixed(2)}
                </p>
              </div>

              <span className="pb-1 text-sm text-blue-700 dark:text-blue-300">
                hours
              </span>
            </div>

            <button
              type="button"
              onClick={
                handleClockOut
              }
              className="mt-5 min-h-14 w-full rounded-xl bg-red-600 text-lg font-bold text-white hover:bg-red-700"
            >
              Clock Out
            </button>
          </section>
        )}

        <section>
          <div className="mb-4 flex items-end justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                Today&apos;s Schedule
              </p>

              <h2 className="mt-1 text-2xl font-bold">
                Your Jobs
              </h2>
            </div>

            <span className="text-sm text-slate-500 dark:text-slate-400">
              {
                scheduledJobs.length
              }{" "}
              {scheduledJobs.length ===
              1
                ? "job"
                : "jobs"}
            </span>
          </div>

          {scheduledJobs.length >
          0 ? (
            <div className="space-y-5">
              {scheduledJobs.map(
                ({
                  assignment,
                  project,
                  crewMembers,
                }) => {
                  const isCurrentProject =
                    activeEntry?.projectId ===
                    project.id;

                  const anotherJobIsActive =
                    Boolean(
                      activeEntry
                    ) &&
                    !isCurrentProject;

                  return (
                    <article
                      key={
                        assignment.id
                      }
                      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
                    >
                      <div className="border-b border-blue-100 bg-blue-50 px-5 py-4 dark:border-blue-900 dark:bg-blue-950/40">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600 dark:text-blue-400">
                            Today&apos;s Job
                          </p>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${getPriorityClasses(
                              assignment.priority
                            )}`}
                          >
                            {getPriorityLabel(
                              assignment.priority
                            )}
                          </span>
                        </div>

                        <h3 className="mt-2 text-2xl font-bold">
                          {
                            project.name
                          }
                        </h3>

                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          {
                            project.customer
                          }
                        </p>

                        {project.address && (
                          <p className="mt-3 text-sm font-medium">
                            📍{" "}
                            {
                              project.address
                            }
                          </p>
                        )}
                      </div>

                      <div className="space-y-5 p-5">
                        {assignment.notes && (
                          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
                            <p className="text-sm font-semibold">
                              Dispatch Notes
                            </p>

                            <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">
                              {
                                assignment.notes
                              }
                            </p>
                          </div>
                        )}

                        {!isCurrentProject && (
                          <button
                            type="button"
                            onClick={() =>
                              handleClockIn(
                                project
                              )
                            }
                            disabled={
                              anotherJobIsActive
                            }
                            className="min-h-14 w-full rounded-xl bg-blue-600 text-lg font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
                          >
                            {anotherJobIsActive
                              ? "Clock Out to Switch"
                              : `Clock In to ${project.name}`}
                          </button>
                        )}

                        <div>
                          <h4 className="mb-3 font-bold">
                            Quick Actions
                          </h4>

                          <div className="grid grid-cols-2 gap-3">
                            <button
                              type="button"
                              onClick={() =>
                                handleOpenMaps(
                                  project
                                )
                              }
                              className="min-h-24 rounded-xl border p-3 font-bold text-blue-600"
                            >
                              🗺️
                              <div className="mt-2">
                                Navigate
                              </div>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handlePhotos(
                                  project
                                )
                              }
                              className="min-h-24 rounded-xl border p-3 font-bold text-blue-600"
                            >
                              📷
                              <div className="mt-2">
                                Photos
                              </div>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleNotes(
                                  project
                                )
                              }
                              className="min-h-24 rounded-xl border p-3 font-bold text-blue-600"
                            >
                              📝
                              <div className="mt-2">
                                Notes
                              </div>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleMaterials(
                                  project
                                )
                              }
                              className="min-h-24 rounded-xl border p-3 font-bold text-blue-600"
                            >
                              📦
                              <div className="mt-2">
                                Materials
                              </div>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDocuments(
                                  project
                                )
                              }
                              className="min-h-24 rounded-xl border p-3 font-bold text-blue-600"
                            >
                              📄
                              <div className="mt-2">
                                Documents
                              </div>
                            </button>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between">
                            <p className="font-bold">
                              Crew
                            </p>

                            <span className="text-sm text-slate-500">
                              {
                                crewMembers.length
                              }{" "}
                              assigned
                            </span>
                          </div>

                          <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
                            {crewMembers.map(
                              (
                                crewMember
                              ) => {
                                const initials =
                                  `${crewMember.firstName.charAt(
                                    0
                                  )}${crewMember.lastName.charAt(
                                    0
                                  )}`.toUpperCase();

                                return (
                                  <div
                                    key={
                                      crewMember.id
                                    }
                                    className="min-w-24 rounded-xl border p-3 text-center"
                                  >
                                    <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 font-bold text-white">
                                      {
                                        initials
                                      }
                                    </div>

                                    <p className="mt-2 truncate text-sm font-medium">
                                      {
                                        crewMember.firstName
                                      }
                                    </p>

                                    <p className="truncate text-xs text-slate-500">
                                      {formatRole(
                                        crewMember.role
                                      )}
                                    </p>
                                  </div>
                                );
                              }
                            )}
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-2xl dark:bg-blue-950">
                📅
              </div>

              <h2 className="mt-4 text-2xl font-bold">
                No Jobs Today
              </h2>

              <p className="mt-2 text-slate-500 dark:text-slate-400">
                Contact the office for your daily assignments.
              </p>

              <button
                type="button"
                onClick={
                  handleContactOffice
                }
                className="mt-5 min-h-12 w-full rounded-xl bg-blue-600 px-4 font-bold text-white hover:bg-blue-700"
              >
                Contact Office
              </button>
            </div>
          )}
        </section>

        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500">
                Today&apos;s Hours
              </p>

              <p className="mt-1 text-4xl font-bold">
                {hoursToday.toFixed(
                  2
                )}
              </p>
            </div>

            <p className="pb-1 text-sm text-slate-500">
              hours
            </p>
          </div>

          <div className="mt-5 space-y-3">
            {todaysEmployeeEntries.length >
            0 ? (
              todaysEmployeeEntries.map(
                (entry) => (
                  <div
                    key={
                      entry.id
                    }
                    className="rounded-xl border p-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold">
                          {
                            entry.projectName
                          }
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          {formatTime(
                            entry.clockIn
                          )}{" "}
                          –{" "}
                          {entry.clockOut
                            ? formatTime(
                                entry.clockOut
                              )
                            : "Present"}
                        </p>
                      </div>

                      <p className="font-bold">
                        {calculateHours(
                          entry.clockIn,
                          entry.clockOut
                        ).toFixed(2)}
                      </p>
                    </div>
                  </div>
                )
              )
            ) : (
              <div className="rounded-xl border border-dashed p-6 text-center">
                <p className="font-medium">
                  No time recorded today
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Your time entries will appear here.
                </p>
              </div>
            )}
          </div>
        </section>

        {activeEntry && (
          <div className="fixed inset-x-0 bottom-[76px] z-30 border-t bg-white/95 p-4 shadow sm:hidden">
            <div className="mx-auto max-w-xl">
              <p className="mb-2 truncate text-center text-xs font-semibold text-slate-500">
                Working on{" "}
                {activeProject?.name ??
                  activeEntry.projectName}
              </p>

              <button
                type="button"
                onClick={
                  handleClockOut
                }
                className="min-h-14 w-full rounded-xl bg-red-600 text-lg font-bold text-white"
              >
                Clock Out
              </button>
            </div>
          </div>
        )}
      </div>
    </EmployeeLayout>
  );
}