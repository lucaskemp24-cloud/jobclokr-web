"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import AppLayout from "@/components/layout/AppLayout";

import {
  getEmployeeName,
  loadEmployees,
  type Employee,
} from "@/lib/employees";

import {
  loadProjects,
  type Project,
} from "@/lib/projects";

import {
  loadAuthUser,
  type AuthUser,
} from "@/lib/auth";

type ScheduleAssignment = {
  id: number;
  date: string;
  projectId: number;
  projectName: string;
  employeeIds: number[];
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

const SCHEDULE_STORAGE_KEY = "jobclokr-schedule";
const TIME_STORAGE_KEY = "jobclokr-time-entries";

function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function loadSchedule(): ScheduleAssignment[] {
  if (typeof window === "undefined") {
    return [];
  }

  const savedSchedule = window.localStorage.getItem(
    SCHEDULE_STORAGE_KEY
  );

  if (!savedSchedule) {
    return [];
  }

  try {
    return JSON.parse(savedSchedule) as ScheduleAssignment[];
  } catch {
    return [];
  }
}

function loadTimeEntries(): TimeEntry[] {
  if (typeof window === "undefined") {
    return [];
  }

  const savedEntries = window.localStorage.getItem(
    TIME_STORAGE_KEY
  );

  if (!savedEntries) {
    return [];
  }

  try {
    const parsedEntries = JSON.parse(savedEntries) as Array<
      Partial<TimeEntry> & {
        employee?: string;
      }
    >;

    return parsedEntries.map((entry, index) => ({
      id: entry.id ?? Date.now() + index,
      employeeId: entry.employeeId ?? 0,
      employeeName:
        entry.employeeName ??
        entry.employee ??
        "Unknown Employee",
      projectId: entry.projectId ?? 0,
      projectName: entry.projectName ?? "Unknown Project",
      clockIn: entry.clockIn ?? new Date().toISOString(),
      clockOut: entry.clockOut ?? null,
    }));
  } catch {
    return [];
  }
}

function saveTimeEntries(entries: TimeEntry[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    TIME_STORAGE_KEY,
    JSON.stringify(entries)
  );
}

function formatTime(dateValue: string) {
  return new Date(dateValue).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function calculateHours(
  clockIn: string,
  clockOut: string | null
) {
  const startTime = new Date(clockIn);
  const endTime = clockOut
    ? new Date(clockOut)
    : new Date();

  const milliseconds =
    endTime.getTime() - startTime.getTime();

  return Math.max(
    milliseconds / 1000 / 60 / 60,
    0
  );
}

export default function EmployeePortalPage() {
  const router = useRouter();

  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [assignments, setAssignments] = useState<
    ScheduleAssignment[]
  >([]);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  const [, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const savedUser = loadAuthUser();

    if (!savedUser) {
      router.replace("/login");
      return;
    }

    if (
      savedUser.role === "Owner" ||
      savedUser.role === "Office"
    ) {
      router.replace("/");
      return;
    }

    const loadedEmployees = loadEmployees();

    const loggedInEmployee = loadedEmployees.find(
      (savedEmployee) =>
        savedEmployee.id === savedUser.employeeId &&
        savedEmployee.status === "Active"
    );

    if (!loggedInEmployee) {
      router.replace("/login");
      return;
    }

    setAuthUser(savedUser);
    setEmployee(loggedInEmployee);
    setEmployees(loadedEmployees);
    setProjects(loadProjects());
    setAssignments(loadSchedule());
    setEntries(loadTimeEntries());
    setDataLoaded(true);
  }, [router]);

  useEffect(() => {
    if (dataLoaded) {
      saveTimeEntries(entries);
    }
  }, [entries, dataLoaded]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const todaysAssignment = assignments.find(
    (assignment) =>
      assignment.date === getTodayDate() &&
      assignment.employeeIds.includes(
        authUser?.employeeId ?? 0
      )
  );

  const assignedProject = projects.find(
    (project) =>
      project.id === todaysAssignment?.projectId
  );

  const crewMembers = useMemo(() => {
    if (!todaysAssignment) {
      return [];
    }

    return employees.filter((savedEmployee) =>
      todaysAssignment.employeeIds.includes(savedEmployee.id)
    );
  }, [employees, todaysAssignment]);

  const activeEntry = entries.find(
    (entry) =>
      entry.employeeId === authUser?.employeeId &&
      entry.clockOut === null
  );

  const todaysEmployeeEntries = useMemo(() => {
    if (!authUser) {
      return [];
    }

    const today = new Date().toDateString();

    return entries.filter(
      (entry) =>
        entry.employeeId === authUser.employeeId &&
        new Date(entry.clockIn).toDateString() === today
    );
  }, [entries, authUser]);

  const hoursToday = todaysEmployeeEntries.reduce(
    (total, entry) =>
      total +
      calculateHours(entry.clockIn, entry.clockOut),
    0
  );

  function handleClockIn() {
    if (!authUser || !employee) {
      return;
    }

    if (!assignedProject) {
      alert(
        "You do not have a project assignment for today."
      );
      return;
    }

    if (activeEntry) {
      alert(`${authUser.name} is already clocked in.`);
      return;
    }

    setEntries((currentEntries) => [
      ...currentEntries,
      {
        id: Date.now(),
        employeeId: authUser.employeeId,
        employeeName: authUser.name,
        projectId: assignedProject.id,
        projectName: assignedProject.name,
        clockIn: new Date().toISOString(),
        clockOut: null,
      },
    ]);
  }

  function handleClockOut() {
    if (!authUser || !activeEntry) {
      return;
    }

    setEntries((currentEntries) =>
      currentEntries.map((entry) =>
        entry.id === activeEntry.id
          ? {
              ...entry,
              clockOut: new Date().toISOString(),
            }
          : entry
      )
    );
  }

  if (!dataLoaded || !authUser || !employee) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-2xl">
          <div className="rounded-xl bg-white p-8 text-center text-gray-500 shadow">
            Loading employee portal...
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-4xl font-bold">
            Employee Portal
          </h1>

          <p className="mt-1 text-gray-500">
            View today&apos;s assignment and track your time.
          </p>
        </div>

        <div>
          <p className="text-gray-500">
            Good morning,
          </p>

          <h2 className="text-3xl font-bold">
            {employee.firstName}
          </h2>
        </div>

        {assignedProject ? (
          <div className="rounded-xl bg-white p-6 shadow">
            <p className="text-sm font-medium uppercase tracking-wide text-blue-600">
              Today&apos;s Assignment
            </p>

            <h2 className="mt-2 text-3xl font-bold">
              {assignedProject.name}
            </h2>

            <p className="mt-1 text-gray-500">
              {assignedProject.customer}
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <p className="text-sm text-gray-500">
                  Job Address
                </p>

                <p className="font-medium">
                  {assignedProject.address ||
                    "No address added"}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Status
                </p>

                <p className="font-medium">
                  {assignedProject.status}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Crew
                </p>

                <div className="mt-2 flex flex-wrap gap-2">
                  {crewMembers.map((crewMember) => (
                    <span
                      key={crewMember.id}
                      className="rounded-full bg-slate-100 px-3 py-1 text-sm"
                    >
                      {getEmployeeName(crewMember)}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {activeEntry ? (
              <div className="mt-6 rounded-xl border border-green-300 bg-green-50 p-5">
                <p className="font-semibold text-green-800">
                  Currently Working
                </p>

                <p className="mt-3">
                  <strong>Started:</strong>{" "}
                  {formatTime(activeEntry.clockIn)}
                </p>

                <p>
                  <strong>Current Hours:</strong>{" "}
                  {calculateHours(
                    activeEntry.clockIn,
                    activeEntry.clockOut
                  ).toFixed(2)}
                </p>
              </div>
            ) : (
              <div className="mt-6 rounded-xl border bg-slate-50 p-5 text-gray-500">
                Status: Not Clocked In
              </div>
            )}

            <div className="mt-5">
              {activeEntry ? (
                <button
                  type="button"
                  onClick={handleClockOut}
                  className="w-full rounded-xl bg-red-600 py-4 text-lg font-semibold text-white hover:bg-red-700"
                >
                  Clock Out
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleClockIn}
                  className="w-full rounded-xl bg-green-600 py-4 text-lg font-semibold text-white hover:bg-green-700"
                >
                  Clock In
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-xl bg-white p-8 text-center shadow">
            <h2 className="text-2xl font-semibold">
              No Assignment Today
            </h2>

            <p className="mt-2 text-gray-500">
              Contact the office for your daily assignment.
            </p>
          </div>
        )}

        <div className="rounded-xl bg-white p-6 shadow">
          <h2 className="text-2xl font-semibold">
            Today&apos;s Hours
          </h2>

          <p className="mt-3 text-4xl font-bold">
            {hoursToday.toFixed(2)}
          </p>

          <p className="text-gray-500">
            Total hours recorded today
          </p>

          <div className="mt-5 space-y-3">
            {todaysEmployeeEntries.length > 0 ? (
              todaysEmployeeEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-lg border p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium">
                        {entry.projectName}
                      </p>

                      <p className="text-sm text-gray-500">
                        {formatTime(entry.clockIn)} –{" "}
                        {entry.clockOut
                          ? formatTime(entry.clockOut)
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
              <p className="text-gray-500">
                No time has been recorded today.
              </p>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}