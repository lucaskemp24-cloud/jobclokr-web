"use client";

import { useEffect, useMemo, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import Modal from "@/components/ui/Modal";
import { loadProjects, type Project } from "@/lib/projects";
import {
  getEmployeeName,
  loadEmployees,
  type Employee,
} from "@/lib/employees";

type ScheduleAssignment = {
  id: number;
  date: string;
  projectId: number;
  projectName: string;
  employeeIds: number[];
};

const SCHEDULE_STORAGE_KEY = "jobclokr-schedule";

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
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

function saveSchedule(assignments: ScheduleAssignment[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    SCHEDULE_STORAGE_KEY,
    JSON.stringify(assignments)
  );
}

export default function SchedulePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [assignments, setAssignments] = useState<
    ScheduleAssignment[]
  >([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [showAssignmentModal, setShowAssignmentModal] =
    useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<
    number[]
  >([]);

  useEffect(() => {
    setProjects(loadProjects());
    setEmployees(loadEmployees());
    setAssignments(loadSchedule());
    setDataLoaded(true);
  }, []);

  useEffect(() => {
    if (!dataLoaded) {
      return;
    }

    saveSchedule(assignments);
  }, [assignments, dataLoaded]);

  const activeEmployees = employees.filter(
    (employee) => employee.status === "Active"
  );

  const assignmentsForDate = useMemo(
    () =>
      assignments.filter(
        (assignment) => assignment.date === selectedDate
      ),
    [assignments, selectedDate]
  );

  const assignedEmployeeIds = new Set(
    assignmentsForDate.flatMap(
      (assignment) => assignment.employeeIds
    )
  );

  const unassignedEmployees = activeEmployees.filter(
    (employee) => !assignedEmployeeIds.has(employee.id)
  );

  function resetModal() {
    setSelectedProjectId("");
    setSelectedEmployeeIds([]);
  }

  function toggleEmployee(employeeId: number) {
    setSelectedEmployeeIds((currentIds) =>
      currentIds.includes(employeeId)
        ? currentIds.filter((id) => id !== employeeId)
        : [...currentIds, employeeId]
    );
  }

  function handleSaveAssignment() {
    if (!selectedProjectId) {
      alert("Please select a project.");
      return;
    }

    if (selectedEmployeeIds.length === 0) {
      alert("Please select at least one employee.");
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

    const existingAssignment = assignments.find(
      (assignment) =>
        assignment.date === selectedDate &&
        assignment.projectId === project.id
    );

    if (existingAssignment) {
      setAssignments(
        assignments.map((assignment) =>
          assignment.id === existingAssignment.id
            ? {
                ...assignment,
                employeeIds: Array.from(
                  new Set([
                    ...assignment.employeeIds,
                    ...selectedEmployeeIds,
                  ])
                ),
              }
            : assignment
        )
      );
    } else {
      setAssignments([
        ...assignments,
        {
          id: Date.now(),
          date: selectedDate,
          projectId: project.id,
          projectName: project.name,
          employeeIds: selectedEmployeeIds,
        },
      ]);
    }

    resetModal();
    setShowAssignmentModal(false);
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-bold">Schedule</h1>
            <p className="text-gray-500 mt-1">
              Assign employees to projects by day.
            </p>
          </div>

          <button
            onClick={() => {
              resetModal();
              setShowAssignmentModal(true);
            }}
            className="bg-blue-600 text-white px-5 py-3 rounded-lg hover:bg-blue-700"
          >
            + New Assignment
          </button>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <label className="block text-sm font-medium mb-2">
            Schedule Date
          </label>

          <input
            type="date"
            value={selectedDate}
            onChange={(event) =>
              setSelectedDate(event.target.value)
            }
            className="border rounded-lg p-3"
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-5">
            {assignmentsForDate.length > 0 ? (
              assignmentsForDate.map((assignment) => {
                const assignedEmployees = employees.filter(
                  (employee) =>
                    assignment.employeeIds.includes(employee.id)
                );

                return (
                  <div
                    key={assignment.id}
                    className="bg-white rounded-xl shadow p-6"
                  >
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <h2 className="text-2xl font-semibold">
                          {assignment.projectName}
                        </h2>

                        <p className="text-sm text-gray-500">
                          {assignedEmployees.length} assigned
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          if (
                            window.confirm(
                              `Remove the schedule for "${assignment.projectName}"?`
                            )
                          ) {
                            setAssignments(
                              assignments.filter(
                                (savedAssignment) =>
                                  savedAssignment.id !==
                                  assignment.id
                              )
                            );
                          }
                        }}
                        className="text-red-600 hover:underline"
                      >
                        Remove Schedule
                      </button>
                    </div>

                    <div className="space-y-3">
                      {assignedEmployees.map((employee) => (
                        <div
                          key={employee.id}
                          className="border rounded-lg p-4 flex items-center justify-between"
                        >
                          <span>{getEmployeeName(employee)}</span>

                          <button
                            onClick={() => {
                              const remainingIds =
                                assignment.employeeIds.filter(
                                  (id) => id !== employee.id
                                );

                              if (remainingIds.length === 0) {
                                setAssignments(
                                  assignments.filter(
                                    (savedAssignment) =>
                                      savedAssignment.id !==
                                      assignment.id
                                  )
                                );
                              } else {
                                setAssignments(
                                  assignments.map(
                                    (savedAssignment) =>
                                      savedAssignment.id ===
                                      assignment.id
                                        ? {
                                            ...savedAssignment,
                                            employeeIds:
                                              remainingIds,
                                          }
                                        : savedAssignment
                                  )
                                );
                              }
                            }}
                            className="text-red-600 hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">
                No employees have been scheduled for this date.
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-2xl font-semibold mb-5">
              Unassigned Employees
            </h2>

            {unassignedEmployees.length > 0 ? (
              <div className="space-y-3">
                {unassignedEmployees.map((employee) => (
                  <div
                    key={employee.id}
                    className="border rounded-lg p-4"
                  >
                    {getEmployeeName(employee)}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">
                All active employees are assigned.
              </p>
            )}
          </div>
        </div>

        <Modal
          isOpen={showAssignmentModal}
          onClose={() => {
            setShowAssignmentModal(false);
            resetModal();
          }}
          title="New Schedule Assignment"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Project
              </label>

              <select
                value={selectedProjectId}
                onChange={(event) =>
                  setSelectedProjectId(event.target.value)
                }
                className="w-full border rounded-lg p-3"
              >
                <option value="">Select a project</option>

                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">
                Employees
              </p>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {unassignedEmployees.map((employee) => (
                  <label
                    key={employee.id}
                    className="border rounded-lg p-3 flex items-center gap-3 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedEmployeeIds.includes(
                        employee.id
                      )}
                      onChange={() =>
                        toggleEmployee(employee.id)
                      }
                    />

                    <span>{getEmployeeName(employee)}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={handleSaveAssignment}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
            >
              Save Assignment
            </button>
          </div>
        </Modal>
      </div>
    </AppLayout>
  );
}