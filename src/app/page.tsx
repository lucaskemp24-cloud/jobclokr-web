"use client";

import { useEffect, useMemo, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { loadProjects, type Project } from "@/lib/projects";
import {
  getEmployeeName,
  loadEmployees,
  type Employee,
} from "@/lib/employees";

type TimeEntry = {
  id: number;
  employeeId: number;
  employeeName: string;
  projectId: number;
  projectName: string;
  clockIn: string;
  clockOut: string | null;
};

const TIME_STORAGE_KEY = "jobclokr-time-entries";

function loadTimeEntries(): TimeEntry[] {
  if (typeof window === "undefined") {
    return [];
  }

  const savedEntries = window.localStorage.getItem(TIME_STORAGE_KEY);

  if (!savedEntries) {
    return [];
  }

  try {
    const parsedEntries = JSON.parse(savedEntries) as Array<
      Partial<TimeEntry> & {
        employee?: string;
      }
    >;

    return parsedEntries.map((entry) => ({
      id: entry.id ?? Date.now(),
      employeeId: entry.employeeId ?? 0,
      employeeName:
        entry.employeeName ?? entry.employee ?? "Unknown Employee",
      projectId: entry.projectId ?? 0,
      projectName: entry.projectName ?? "Unknown Project",
      clockIn: entry.clockIn ?? new Date().toISOString(),
      clockOut: entry.clockOut ?? null,
    }));
  } catch {
    return [];
  }
}

function calculateHours(clockIn: string, clockOut: string | null) {
  const startTime = new Date(clockIn);
  const endTime = clockOut ? new Date(clockOut) : new Date();

  const milliseconds = endTime.getTime() - startTime.getTime();

  return Math.max(milliseconds / 1000 / 60 / 60, 0);
}

function formatTime(dateValue: string) {
  return new Date(dateValue).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    setProjects(loadProjects());
    setEmployees(loadEmployees());
    setEntries(loadTimeEntries());
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentTime(Date.now());
      setProjects(loadProjects());
      setEmployees(loadEmployees());
      setEntries(loadTimeEntries());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const activeEmployees = employees.filter(
    (employee) => employee.status === "Active"
  );

  const activeEntries = entries.filter(
    (entry) => entry.clockOut === null
  );

  const activeEmployeeIds = new Set(
    activeEntries
      .filter((entry) => entry.employeeId !== 0)
      .map((entry) => entry.employeeId)
  );

  const activeEmployeeNames = new Set(
    activeEntries.map((entry) => entry.employeeName)
  );

  const clockedOutEmployees = activeEmployees.filter(
    (employee) =>
      !activeEmployeeIds.has(employee.id) &&
      !activeEmployeeNames.has(getEmployeeName(employee))
  );

  const todaysEntries = useMemo(() => {
    const today = new Date().toDateString();

    return entries.filter(
      (entry) =>
        new Date(entry.clockIn).toDateString() === today
    );
  }, [entries]);

  const totalHoursToday = todaysEntries.reduce(
    (total, entry) =>
      total + calculateHours(entry.clockIn, entry.clockOut),
    0
  );

  const crewByProject = projects
    .map((project) => ({
      project,
      entries: activeEntries.filter(
        (entry) => entry.projectId === project.id
      ),
    }))
    .filter((group) => group.entries.length > 0);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold">Dashboard</h1>

          <p className="text-gray-500 mt-1">
            Live view of employees, projects, and hours.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow p-6">
            <p className="text-sm text-gray-500">
              Employees Working
            </p>

            <p className="text-4xl font-bold mt-2">
              {activeEntries.length}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <p className="text-sm text-gray-500">
              Active Projects
            </p>

            <p className="text-4xl font-bold mt-2">
              {crewByProject.length}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <p className="text-sm text-gray-500">
              Labor Hours Today
            </p>

            <p className="text-4xl font-bold mt-2">
              {totalHoursToday.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-2xl font-semibold">
                Currently Working
              </h2>

              <span className="text-sm text-green-700 bg-green-100 px-3 py-1 rounded-full">
                Live
              </span>
            </div>

            {crewByProject.length > 0 ? (
              <div className="space-y-5">
                {crewByProject.map(({ project, entries }) => (
                  <div
                    key={project.id}
                    className="border rounded-xl p-5"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold">
                          {project.name}
                        </h3>

                        <p className="text-sm text-gray-500">
                          {project.customer}
                        </p>
                      </div>

                      <span className="text-sm text-green-700 bg-green-100 px-3 py-1 rounded-full">
                        {entries.length} working
                      </span>
                    </div>

                    <div className="space-y-3">
                      {entries.map((entry) => (
                        <div
                          key={entry.id}
                          className="flex items-center justify-between border rounded-lg p-4"
                        >
                          <div>
                            <p className="font-medium">
                              {entry.employeeName}
                            </p>

                            <p className="text-sm text-gray-500">
                              Clocked in at{" "}
                              {formatTime(entry.clockIn)}
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
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border rounded-xl p-8 text-center text-gray-500">
                No employees are currently clocked in.
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-2xl font-semibold mb-5">
              Not Clocked In
            </h2>

            {clockedOutEmployees.length > 0 ? (
              <div className="space-y-3">
                {clockedOutEmployees.map((employee) => (
                  <div
                    key={employee.id}
                    className="border rounded-lg p-4 flex items-center gap-3"
                  >
                    <span className="w-3 h-3 bg-gray-300 rounded-full" />

                    <span>{getEmployeeName(employee)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">
                Everyone is currently clocked in.
              </p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-2xl font-semibold mb-5">
            Today&apos;s Time Entries
          </h2>

          {todaysEntries.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="text-left p-4">Employee</th>
                    <th className="text-left p-4">Project</th>
                    <th className="text-left p-4">Clock In</th>
                    <th className="text-left p-4">Clock Out</th>
                    <th className="text-left p-4">Hours</th>
                  </tr>
                </thead>

                <tbody>
                  {todaysEntries.map((entry) => (
                    <tr key={entry.id} className="border-t">
                      <td className="p-4">
                        {entry.employeeName}
                      </td>

                      <td className="p-4">
                        {entry.projectName}
                      </td>

                      <td className="p-4">
                        {formatTime(entry.clockIn)}
                      </td>

                      <td className="p-4">
                        {entry.clockOut
                          ? formatTime(entry.clockOut)
                          : "Present"}
                      </td>

                      <td className="p-4">
                        {calculateHours(
                          entry.clockIn,
                          entry.clockOut
                        ).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">
              No time entries have been recorded today.
            </p>
          )}
        </div>
      </div>
    </AppLayout>
  );
}