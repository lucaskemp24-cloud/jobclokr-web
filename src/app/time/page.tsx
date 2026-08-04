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

function calculateHours(clockIn: string, clockOut: string | null) {
  const startTime = new Date(clockIn);
  const endTime = clockOut ? new Date(clockOut) : new Date();

  const milliseconds = endTime.getTime() - startTime.getTime();

  return Math.max(milliseconds / 1000 / 60 / 60, 0);
}

export default function TimePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    setProjects(loadProjects());
    setEmployees(loadEmployees());
    setEntries(loadTimeEntries());
    setDataLoaded(true);
  }, []);

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

  const activeEmployees = employees.filter(
    (employee) => employee.status === "Active"
  );

  const selectedEmployee = employees.find(
    (employee) => employee.id === Number(selectedEmployeeId)
  );

  const selectedEmployeeName = selectedEmployee
    ? getEmployeeName(selectedEmployee)
    : "";

  const activeEntry = entries.find(
    (entry) =>
      entry.employeeId === Number(selectedEmployeeId) &&
      entry.clockOut === null
  );

  const todaysEntries = useMemo(() => {
    if (!selectedEmployeeId) {
      return [];
    }

    const today = new Date().toDateString();

    return entries.filter(
      (entry) =>
        entry.employeeId === Number(selectedEmployeeId) &&
        new Date(entry.clockIn).toDateString() === today
    );
  }, [entries, selectedEmployeeId]);

  const totalHoursToday = todaysEntries.reduce(
    (total, entry) =>
      total + calculateHours(entry.clockIn, entry.clockOut),
    0
  );

  function handleClockIn() {
    if (!selectedEmployee) {
      alert("Please select an employee.");
      return;
    }

    if (!selectedProjectId) {
      alert("Please select a project.");
      return;
    }

    if (activeEntry) {
      alert(`${selectedEmployeeName} is already clocked in.`);
      return;
    }

    const project = projects.find(
      (savedProject) =>
        savedProject.id === Number(selectedProjectId)
    );

    if (!project) {
      alert("Project not found.");
      return;
    }

    setEntries([
      ...entries,
      {
        id: Date.now(),
        employeeId: selectedEmployee.id,
        employeeName: selectedEmployeeName,
        projectId: project.id,
        projectName: project.name,
        clockIn: new Date().toISOString(),
        clockOut: null,
      },
    ]);
  }

  function handleClockOut() {
    if (!selectedEmployee) {
      alert("Please select an employee.");
      return;
    }

    if (!activeEntry) {
      alert(`${selectedEmployeeName} is not clocked in.`);
      return;
    }

    setEntries(
      entries.map((entry) =>
        entry.id === activeEntry.id
          ? {
              ...entry,
              clockOut: new Date().toISOString(),
            }
          : entry
      )
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold">Time Tracking</h1>

          <p className="text-gray-500 mt-1">
            Clock employees in and out of projects.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow p-6 space-y-4">
            <h2 className="text-2xl font-semibold">
              Clock In / Out
            </h2>

            <div>
              <label className="block text-sm font-medium mb-1">
                Employee
              </label>

              <select
                value={selectedEmployeeId}
                onChange={(event) => {
                  setSelectedEmployeeId(event.target.value);
                  setSelectedProjectId("");
                }}
                className="w-full border rounded-lg p-3"
              >
                <option value="">Select an employee</option>

                {activeEmployees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {getEmployeeName(employee)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Project
              </label>

              <select
                value={selectedProjectId}
                onChange={(event) =>
                  setSelectedProjectId(event.target.value)
                }
                disabled={Boolean(activeEntry)}
                className="w-full border rounded-lg p-3 disabled:bg-gray-100"
              >
                <option value="">Select a project</option>

                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedEmployee ? (
              activeEntry ? (
                <div className="rounded-lg border border-green-300 bg-green-50 p-4">
                  <p className="font-semibold text-green-800">
                    Currently Clocked In
                  </p>

                  <p className="mt-2">
                    <strong>Employee:</strong>{" "}
                    {activeEntry.employeeName}
                  </p>

                  <p>
                    <strong>Project:</strong>{" "}
                    {activeEntry.projectName}
                  </p>

                  <p>
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
                <div className="rounded-lg border bg-gray-50 p-4 text-gray-500">
                  {selectedEmployeeName} is currently clocked out.
                </div>
              )
            ) : (
              <div className="rounded-lg border bg-gray-50 p-4 text-gray-500">
                Select an employee to view their time status.
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleClockIn}
                disabled={!selectedEmployee || Boolean(activeEntry)}
                className="bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-300"
              >
                Clock In
              </button>

              <button
                onClick={handleClockOut}
                disabled={!selectedEmployee || !activeEntry}
                className="bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 disabled:bg-gray-300"
              >
                Clock Out
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-2xl font-semibold mb-4">
              Today&apos;s Summary
            </h2>

            <p className="text-4xl font-bold">
              {totalHoursToday.toFixed(2)}
            </p>

            <p className="text-gray-500 mt-1">
              Total hours today
            </p>

            <div className="mt-6 space-y-3">
              {!selectedEmployee ? (
                <p className="text-gray-500">
                  Select an employee to view their time entries.
                </p>
              ) : todaysEntries.length > 0 ? (
                todaysEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="border rounded-lg p-4"
                  >
                    <div className="flex justify-between gap-4">
                      <div>
                        <p className="font-semibold">
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
      </div>
    </AppLayout>
  );
}