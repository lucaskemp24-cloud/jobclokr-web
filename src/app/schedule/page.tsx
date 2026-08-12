"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import AppLayout from "@/components/layout/AppLayout";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/ToastProvider";

type DatabaseProject = {
  id: number;
  companyId: number;
  customerId: number;
  name: string;
  description: string | null;
  address: string | null;
  status: string;
  startDate: string | null;
  dueDate: string | null;
  closedAt: string | null;
};

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
};

type SchedulePriority =
  | "NORMAL"
  | "HIGH"
  | "EMERGENCY";

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
  employees: Array<{
    id: number;
    firstName: string;
    lastName: string;
    role:
      | "OWNER"
      | "OFFICE"
      | "FOREMAN"
      | "EMPLOYEE";
    active: boolean;
  }>;
};

function getTodayDate() {
  const now =
    new Date();

  const year =
    now.getFullYear();

  const month =
    String(
      now.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      now.getDate()
    ).padStart(
      2,
      "0"
    );

  return `${year}-${month}-${day}`;
}

function getEmployeeName(
  employee: {
    firstName: string;
    lastName: string;
  }
) {
  return `${employee.firstName} ${employee.lastName}`.trim();
}

function priorityLabel(
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

function priorityClasses(
  priority: SchedulePriority
) {
  if (
    priority ===
    "EMERGENCY"
  ) {
    return "bg-red-100 text-red-700";
  }

  if (
    priority === "HIGH"
  ) {
    return "bg-amber-100 text-amber-700";
  }

  return "bg-slate-100 text-slate-700";
}

export default function SchedulePage() {
  const { showToast } =
    useToast();

  const [
    projects,
    setProjects,
  ] =
    useState<
      DatabaseProject[]
    >([]);

  const [
    employees,
    setEmployees,
  ] =
    useState<
      DatabaseEmployee[]
    >([]);

  const [
    assignments,
    setAssignments,
  ] =
    useState<
      ScheduleAssignment[]
    >([]);

  const [
    selectedDate,
    setSelectedDate,
  ] =
    useState(
      getTodayDate()
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    showAssignmentModal,
    setShowAssignmentModal,
  ] =
    useState(false);

  const [
    selectedProjectId,
    setSelectedProjectId,
  ] =
    useState("");

  const [
    selectedEmployeeIds,
    setSelectedEmployeeIds,
  ] =
    useState<number[]>(
      []
    );

  const [
    priority,
    setPriority,
  ] =
    useState<SchedulePriority>(
      "NORMAL"
    );

  const [
    notes,
    setNotes,
  ] =
    useState("");

  async function loadPageData(
    dateValue = selectedDate
  ) {
    try {
      setLoading(true);

      const [
        projectsResponse,
        employeesResponse,
        scheduleResponse,
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
            `/api/schedule?date=${dateValue}`,
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

      const scheduleData =
        await scheduleResponse.json();

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
        !scheduleResponse.ok
      ) {
        throw new Error(
          scheduleData.error ||
            "Unable to load schedule."
        );
      }

      setProjects(
        (
          Array.isArray(
            projectsData
          )
            ? projectsData
            : []
        ).filter(
          (
            project: DatabaseProject
          ) =>
            project.status !==
            "Closed"
        )
      );

      setEmployees(
        Array.isArray(
          employeesData
        )
          ? employeesData
          : []
      );

      setAssignments(
        Array.isArray(
          scheduleData
        )
          ? scheduleData
          : []
      );
    } catch (error) {
      console.error(
        "Schedule load failed:",
        error
      );

      showToast(
        error instanceof Error
          ? error.message
          : "Unable to load schedule.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPageData(
      selectedDate
    );
  }, [selectedDate]);

  const activeEmployees =
    useMemo(
      () =>
        employees.filter(
          (employee) =>
            employee.active
        ),
      [employees]
    );

  const assignedEmployeeIds =
    useMemo(
      () =>
        new Set(
          assignments.flatMap(
            (assignment) =>
              assignment.employeeIds
          )
        ),
      [assignments]
    );

  const unassignedEmployees =
    useMemo(
      () =>
        activeEmployees.filter(
          (employee) =>
            !assignedEmployeeIds.has(
              employee.id
            )
        ),
      [
        activeEmployees,
        assignedEmployeeIds,
      ]
    );

  function resetModal() {
    setSelectedProjectId(
      ""
    );
    setSelectedEmployeeIds(
      []
    );
    setPriority(
      "NORMAL"
    );
    setNotes("");
  }

  function openNewAssignmentModal() {
    resetModal();
    setShowAssignmentModal(
      true
    );
  }

  function toggleEmployee(
    employeeId: number
  ) {
    setSelectedEmployeeIds(
      (currentIds) =>
        currentIds.includes(
          employeeId
        )
          ? currentIds.filter(
              (id) =>
                id !==
                employeeId
            )
          : [
              ...currentIds,
              employeeId,
            ]
    );
  }

  async function handleSaveAssignment() {
    const projectId =
      Number(
        selectedProjectId
      );

    if (
      !Number.isInteger(
        projectId
      ) ||
      projectId <= 0
    ) {
      showToast(
        "Please select a project.",
        "error"
      );
      return;
    }

    if (
      selectedEmployeeIds.length ===
      0
    ) {
      showToast(
        "Please select at least one employee.",
        "error"
      );
      return;
    }

    try {
      setSaving(true);

      const response =
        await fetch(
          "/api/schedule",
          {
            method:
              "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body:
              JSON.stringify({
                date:
                  selectedDate,
                projectId,
                employeeIds:
                  selectedEmployeeIds,
                priority,
                notes,
              }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to save schedule assignment."
        );
      }

      setShowAssignmentModal(
        false
      );
      resetModal();

      await loadPageData(
        selectedDate
      );

      showToast(
        "Schedule assignment saved.",
        "success"
      );
    } catch (error) {
      console.error(
        "Schedule save failed:",
        error
      );

      showToast(
        error instanceof Error
          ? error.message
          : "Unable to save schedule assignment.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveAssignment(
    assignment: ScheduleAssignment
  ) {
    const confirmed =
      window.confirm(
        `Remove the schedule for "${assignment.projectName}"?`
      );

    if (!confirmed) {
      return;
    }

    try {
      const response =
        await fetch(
          `/api/schedule?assignmentId=${assignment.id}`,
          {
            method:
              "DELETE",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to remove schedule."
        );
      }

      setAssignments(
        (
          currentAssignments
        ) =>
          currentAssignments.filter(
            (
              savedAssignment
            ) =>
              savedAssignment.id !==
              assignment.id
          )
      );

      showToast(
        "Schedule removed.",
        "success"
      );
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "Unable to remove schedule.",
        "error"
      );
    }
  }

  async function handleRemoveEmployee(
    assignment: ScheduleAssignment,
    employeeId: number
  ) {
    try {
      const response =
        await fetch(
          `/api/schedule?assignmentId=${assignment.id}&employeeId=${employeeId}`,
          {
            method:
              "DELETE",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to remove employee."
        );
      }

      await loadPageData(
        selectedDate
      );

      showToast(
        "Employee removed from schedule.",
        "success"
      );
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "Unable to remove employee.",
        "error"
      );
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-bold">
              Schedule
            </h1>

            <p className="mt-1 text-gray-500">
              Assign employees to projects by day.
            </p>
          </div>

          <button
            type="button"
            onClick={
              openNewAssignmentModal
            }
            className="rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
          >
            + New Assignment
          </button>
        </div>

        <div className="rounded-xl bg-white p-6 shadow dark:bg-slate-900">
          <label className="mb-2 block text-sm font-medium">
            Schedule Date
          </label>

          <input
            type="date"
            value={
              selectedDate
            }
            onChange={(
              event
            ) =>
              setSelectedDate(
                event.target.value
              )
            }
            className="rounded-lg border p-3 dark:bg-slate-950"
          />
        </div>

        {loading ? (
          <div className="rounded-xl bg-white p-8 text-center text-gray-500 shadow dark:bg-slate-900">
            Loading schedule...
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="space-y-5 xl:col-span-2">
              {assignments.length >
              0 ? (
                assignments.map(
                  (
                    assignment
                  ) => (
                    <div
                      key={
                        assignment.id
                      }
                      className="rounded-xl bg-white p-6 shadow dark:bg-slate-900"
                    >
                      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-2xl font-semibold">
                              {
                                assignment.projectName
                              }
                            </h2>

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${priorityClasses(
                                assignment.priority
                              )}`}
                            >
                              {priorityLabel(
                                assignment.priority
                              )}
                            </span>
                          </div>

                          <p className="mt-1 text-sm text-gray-500">
                            {
                              assignment.customerName
                            }
                            {assignment.address
                              ? ` • ${assignment.address}`
                              : ""}
                          </p>

                          <p className="mt-1 text-sm text-gray-500">
                            {
                              assignment.employees.length
                            }{" "}
                            {assignment.employees.length ===
                            1
                              ? "employee"
                              : "employees"}{" "}
                            assigned
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            void handleRemoveAssignment(
                              assignment
                            )
                          }
                          className="text-sm font-semibold text-red-600 hover:underline"
                        >
                          Remove Schedule
                        </button>
                      </div>

                      {assignment.notes && (
                        <div className="mb-5 rounded-lg bg-slate-50 p-4 text-sm dark:bg-slate-950/50">
                          <span className="font-semibold">
                            Notes:
                          </span>{" "}
                          {
                            assignment.notes
                          }
                        </div>
                      )}

                      <div className="space-y-3">
                        {assignment.employees.map(
                          (
                            employee
                          ) => (
                            <div
                              key={
                                employee.id
                              }
                              className="flex items-center justify-between rounded-lg border p-4 dark:border-slate-700"
                            >
                              <span>
                                {getEmployeeName(
                                  employee
                                )}
                              </span>

                              <button
                                type="button"
                                onClick={() =>
                                  void handleRemoveEmployee(
                                    assignment,
                                    employee.id
                                  )
                                }
                                className="text-sm font-semibold text-red-600 hover:underline"
                              >
                                Remove
                              </button>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )
                )
              ) : (
                <div className="rounded-xl bg-white p-8 text-center text-gray-500 shadow dark:bg-slate-900">
                  No employees have been scheduled for this date.
                </div>
              )}
            </div>

            <div className="rounded-xl bg-white p-6 shadow dark:bg-slate-900">
              <h2 className="mb-5 text-2xl font-semibold">
                Unassigned Employees
              </h2>

              {unassignedEmployees.length >
              0 ? (
                <div className="space-y-3">
                  {unassignedEmployees.map(
                    (
                      employee
                    ) => (
                      <div
                        key={
                          employee.id
                        }
                        className="rounded-lg border p-4 dark:border-slate-700"
                      >
                        {getEmployeeName(
                          employee
                        )}
                      </div>
                    )
                  )}
                </div>
              ) : (
                <p className="text-gray-500">
                  All active employees are assigned.
                </p>
              )}
            </div>
          </div>
        )}

        <Modal
          isOpen={
            showAssignmentModal
          }
          onClose={() => {
            setShowAssignmentModal(
              false
            );
            resetModal();
          }}
          title="New Schedule Assignment"
        >
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Project
              </label>

              <select
                value={
                  selectedProjectId
                }
                onChange={(
                  event
                ) =>
                  setSelectedProjectId(
                    event.target.value
                  )
                }
                className="w-full rounded-lg border p-3 dark:bg-slate-950"
              >
                <option value="">
                  Select a project
                </option>

                {projects.map(
                  (
                    project
                  ) => (
                    <option
                      key={
                        project.id
                      }
                      value={
                        project.id
                      }
                    >
                      {
                        project.name
                      }
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Priority
              </label>

              <select
                value={
                  priority
                }
                onChange={(
                  event
                ) =>
                  setPriority(
                    event.target
                      .value as SchedulePriority
                  )
                }
                className="w-full rounded-lg border p-3 dark:bg-slate-950"
              >
                <option value="NORMAL">
                  Normal
                </option>
                <option value="HIGH">
                  High
                </option>
                <option value="EMERGENCY">
                  Emergency
                </option>
              </select>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium">
                Employees
              </p>

              <div className="max-h-64 space-y-2 overflow-y-auto">
                {activeEmployees.map(
                  (
                    employee
                  ) => (
                    <label
                      key={
                        employee.id
                      }
                      className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 dark:border-slate-700"
                    >
                      <input
                        type="checkbox"
                        checked={selectedEmployeeIds.includes(
                          employee.id
                        )}
                        onChange={() =>
                          toggleEmployee(
                            employee.id
                          )
                        }
                      />

                      <span>
                        {getEmployeeName(
                          employee
                        )}
                      </span>
                    </label>
                  )
                )}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Assignment Notes
              </label>

              <textarea
                value={
                  notes
                }
                onChange={(
                  event
                ) =>
                  setNotes(
                    event.target.value
                  )
                }
                className="min-h-24 w-full rounded-lg border p-3 dark:bg-slate-950"
                placeholder="Optional instructions for the crew"
              />
            </div>

            <button
              type="button"
              disabled={
                saving
              }
              onClick={() =>
                void handleSaveAssignment()
              }
              className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : "Save Assignment"}
            </button>
          </div>
        </Modal>
      </div>
    </AppLayout>
  );
}