"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import AppLayout from "@/components/layout/AppLayout";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/ToastProvider";

type ProjectStatus =
  | "Not Started"
  | "Scheduled"
  | "In Progress"
  | "Completed"
  | "Closed";

type Project = {
  id: number;
  name: string;
  status: ProjectStatus;
  details: string;
  customerId: number;
  customer: string;
  startDate: string;
  dueDate: string;
  address: string;
  totalHours: number;
  employees: string[];
  closedAt: string;
};

type CustomerOption = {
  id: number;
  company: string;
};

type ProjectView =
  | "active"
  | "closed"
  | "all";

function normalizeCustomer(
  value: unknown
): CustomerOption | null {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return null;
  }

  const customer =
    value as Record<string, unknown>;

  const id =
    Number(customer.id);

  const company =
    typeof customer.company === "string"
      ? customer.company
      : typeof customer.name === "string"
        ? customer.name
        : "";

  if (
    !Number.isInteger(id) ||
    id <= 0 ||
    !company.trim()
  ) {
    return null;
  }

  return {
    id,
    company:
      company.trim(),
  };
}

function normalizeProject(
  value: unknown
): Project | null {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return null;
  }

  const project =
    value as Record<string, unknown>;

  const id =
    Number(project.id);

  const customerId =
    Number(project.customerId);

  const status =
    String(
      project.status ??
        "Not Started"
    ) as ProjectStatus;

  if (
    !Number.isInteger(id) ||
    id <= 0 ||
    !Number.isInteger(customerId) ||
    customerId <= 0
  ) {
    return null;
  }

  return {
    id,
    name:
      String(
        project.name ?? ""
      ),
    status,
    details:
      String(
        project.details ?? ""
      ),
    customerId,
    customer:
      String(
        project.customer ?? ""
      ),
    startDate:
      String(
        project.startDate ?? ""
      ),
    dueDate:
      String(
        project.dueDate ?? ""
      ),
    address:
      String(
        project.address ?? ""
      ),
    totalHours:
      Number(
        project.totalHours ?? 0
      ),
    employees:
      Array.isArray(
        project.employees
      )
        ? project.employees.filter(
            (
              employee
            ): employee is string =>
              typeof employee ===
              "string"
          )
        : [],
    closedAt:
      String(
        project.closedAt ?? ""
      ),
  };
}

export default function ProjectsPage() {
  const { showToast } =
    useToast();

  const [
    projects,
    setProjects,
  ] =
    useState<Project[]>([]);

  const [
    customers,
    setCustomers,
  ] =
    useState<CustomerOption[]>(
      []
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
    searchTerm,
    setSearchTerm,
  ] =
    useState("");

  const [
    projectView,
    setProjectView,
  ] =
    useState<ProjectView>(
      "active"
    );

  const [
    showProjectModal,
    setShowProjectModal,
  ] =
    useState(false);

  const [
    projectToDelete,
    setProjectToDelete,
  ] =
    useState<Project | null>(
      null
    );

  const [
    projectToClose,
    setProjectToClose,
  ] =
    useState<Project | null>(
      null
    );

  const [
    projectToReopen,
    setProjectToReopen,
  ] =
    useState<Project | null>(
      null
    );

  const [
    projectName,
    setProjectName,
  ] =
    useState("");

  const [
    projectCustomerId,
    setProjectCustomerId,
  ] =
    useState<number | null>(
      null
    );

  const [
    projectStatus,
    setProjectStatus,
  ] =
    useState<ProjectStatus>(
      "Not Started"
    );

  const [
    projectAddress,
    setProjectAddress,
  ] =
    useState("");

  const [
    projectStartDate,
    setProjectStartDate,
  ] =
    useState("");

  const [
    projectDueDate,
    setProjectDueDate,
  ] =
    useState("");

  const [
    editingProjectId,
    setEditingProjectId,
  ] =
    useState<number | null>(
      null
    );

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        const [
          customersResponse,
          projectsResponse,
        ] =
          await Promise.all([
            fetch(
              "/api/customers",
              {
                cache:
                  "no-store",
              }
            ),
            fetch(
              "/api/projects",
              {
                cache:
                  "no-store",
              }
            ),
          ]);

        const customersData =
          await customersResponse.json();

        const projectsData =
          await projectsResponse.json();

        if (
          !customersResponse.ok
        ) {
          throw new Error(
            customersData.error ||
              "Unable to load customers."
          );
        }

        if (
          !projectsResponse.ok
        ) {
          throw new Error(
            projectsData.error ||
              "Unable to load projects."
          );
        }

        const normalizedCustomers =
          Array.isArray(
            customersData
          )
            ? customersData
                .map(
                  normalizeCustomer
                )
                .filter(
                  (
                    customer
                  ): customer is CustomerOption =>
                    customer !==
                    null
                )
            : [];

        const normalizedProjects =
          Array.isArray(
            projectsData
          )
            ? projectsData
                .map(
                  normalizeProject
                )
                .filter(
                  (
                    project
                  ): project is Project =>
                    project !==
                    null
                )
            : [];

        setCustomers(
          normalizedCustomers
        );

        setProjects(
          normalizedProjects
        );
      } catch (error) {
        console.error(
          "Failed to load projects:",
          error
        );

        showToast(
          error instanceof Error
            ? error.message
            : "Unable to load projects.",
          "error"
        );
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, [showToast]);

  const activeProjectCount =
    projects.filter(
      (project) =>
        project.status !==
        "Closed"
    ).length;

  const closedProjectCount =
    projects.filter(
      (project) =>
        project.status ===
        "Closed"
    ).length;

  const filteredProjects =
    useMemo(() => {
      const search =
        searchTerm
          .trim()
          .toLowerCase();

      return projects.filter(
        (project) => {
          const matchesView =
            projectView ===
              "all" ||
            (projectView ===
              "active" &&
              project.status !==
                "Closed") ||
            (projectView ===
              "closed" &&
              project.status ===
                "Closed");

          if (!matchesView) {
            return false;
          }

          return (
            project.name
              .toLowerCase()
              .includes(
                search
              ) ||
            project.customer
              .toLowerCase()
              .includes(
                search
              ) ||
            project.status
              .toLowerCase()
              .includes(
                search
              ) ||
            project.address
              .toLowerCase()
              .includes(
                search
              ) ||
            project.employees.some(
              (
                employeeName
              ) =>
                employeeName
                  .toLowerCase()
                  .includes(
                    search
                  )
            )
          );
        }
      );
    }, [
      projects,
      projectView,
      searchTerm,
    ]);

  function resetProjectForm() {
    setProjectName("");
    setProjectCustomerId(
      null
    );
    setProjectStatus(
      "Not Started"
    );
    setProjectAddress("");
    setProjectStartDate("");
    setProjectDueDate("");
    setEditingProjectId(
      null
    );
  }

  function openNewProjectModal() {
    resetProjectForm();
    setShowProjectModal(
      true
    );
  }

  function openEditProjectModal(
    project: Project
  ) {
    setEditingProjectId(
      project.id
    );
    setProjectName(
      project.name
    );
    setProjectCustomerId(
      project.customerId
    );
    setProjectStatus(
      project.status
    );
    setProjectAddress(
      project.address
    );
    setProjectStartDate(
      project.startDate
    );
    setProjectDueDate(
      project.dueDate
    );
    setShowProjectModal(
      true
    );
  }

  function closeProjectModal() {
    if (saving) {
      return;
    }

    setShowProjectModal(
      false
    );

    resetProjectForm();
  }

  async function handleSaveProject() {
    const trimmedName =
      projectName.trim();

    const trimmedAddress =
      projectAddress.trim();

    if (!trimmedName) {
      showToast(
        "Please enter a project name.",
        "error"
      );
      return;
    }

    if (
      projectCustomerId ===
      null
    ) {
      showToast(
        "Please select a customer.",
        "error"
      );
      return;
    }

    const selectedCustomer =
      customers.find(
        (customer) =>
          customer.id ===
          projectCustomerId
      );

    if (!selectedCustomer) {
      showToast(
        "The selected customer could not be found.",
        "error"
      );
      return;
    }

    if (
      projectStartDate &&
      projectDueDate &&
      new Date(
        projectDueDate
      ) <
        new Date(
          projectStartDate
        )
    ) {
      showToast(
        "The due date cannot be before the start date.",
        "error"
      );
      return;
    }

    const duplicateProject =
      projects.some(
        (project) =>
          project.name
            .trim()
            .toLowerCase() ===
            trimmedName.toLowerCase() &&
          project.customerId ===
            projectCustomerId &&
          project.id !==
            editingProjectId
      );

    if (duplicateProject) {
      showToast(
        "That customer already has a project with this name.",
        "error"
      );
      return;
    }

    const existingProject =
      editingProjectId !==
      null
        ? projects.find(
            (project) =>
              project.id ===
              editingProjectId
          ) ?? null
        : null;

    try {
      setSaving(true);

      const response =
        await fetch(
          "/api/projects",
          {
            method:
              editingProjectId !==
              null
                ? "PATCH"
                : "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body:
              JSON.stringify({
                ...(editingProjectId !==
                null
                  ? {
                      id:
                        editingProjectId,
                    }
                  : {}),
                name:
                  trimmedName,
                customerId:
                  projectCustomerId,
                status:
                  projectStatus,
                address:
                  trimmedAddress,
                details:
                  existingProject?.details ??
                  "",
                startDate:
                  projectStartDate,
                dueDate:
                  projectDueDate,
              }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to save project."
        );
      }

      const savedProject =
        normalizeProject(
          data
        );

      if (!savedProject) {
        throw new Error(
          "The project response was invalid."
        );
      }

      if (
        editingProjectId !==
        null
      ) {
        setProjects(
          (
            currentProjects
          ) =>
            currentProjects.map(
              (project) =>
                project.id ===
                editingProjectId
                  ? savedProject
                  : project
            )
        );

        if (
          existingProject?.status !==
            "Closed" &&
          savedProject.status ===
            "Closed"
        ) {
          showToast(
            "Project updated and moved to Closed Projects.",
            "success"
          );
        } else if (
          existingProject?.status ===
            "Closed" &&
          savedProject.status !==
            "Closed"
        ) {
          showToast(
            "Project updated and reopened.",
            "success"
          );
        } else {
          showToast(
            "Project updated successfully.",
            "success"
          );
        }
      } else {
        setProjects(
          (
            currentProjects
          ) => [
            savedProject,
            ...currentProjects,
          ]
        );

        showToast(
          savedProject.status ===
            "Closed"
            ? "Closed project created successfully."
            : "Project created successfully.",
          "success"
        );
      }

      setShowProjectModal(
        false
      );

      resetProjectForm();
    } catch (error) {
      console.error(
        "Failed to save project:",
        error
      );

      showToast(
        error instanceof Error
          ? error.message
          : "Unable to save project.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  }

  async function changeProjectStatus(
    project: Project,
    status: ProjectStatus
  ) {
    const response =
      await fetch(
        "/api/projects",
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
                project.id,
              name:
                project.name,
              customerId:
                project.customerId,
              status,
              address:
                project.address,
              details:
                project.details,
              startDate:
                project.startDate,
              dueDate:
                project.dueDate,
            }),
        }
      );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
          "Unable to update project."
      );
    }

    const updatedProject =
      normalizeProject(
        data
      );

    if (!updatedProject) {
      throw new Error(
        "The project response was invalid."
      );
    }

    setProjects(
      (
        currentProjects
      ) =>
        currentProjects.map(
          (
            savedProject
          ) =>
            savedProject.id ===
            project.id
              ? updatedProject
              : savedProject
        )
    );
  }

  async function handleConfirmClose() {
    if (!projectToClose) {
      return;
    }

    const project =
      projectToClose;

    try {
      await changeProjectStatus(
        project,
        "Closed"
      );

      setProjectToClose(
        null
      );

      showToast(
        `${project.name} was closed and archived.`,
        "success"
      );
    } catch (error) {
      console.error(
        "Failed to close project:",
        error
      );

      showToast(
        error instanceof Error
          ? error.message
          : "Unable to close project.",
        "error"
      );
    }
  }

  async function handleConfirmReopen() {
    if (!projectToReopen) {
      return;
    }

    const project =
      projectToReopen;

    try {
      await changeProjectStatus(
        project,
        "In Progress"
      );

      setProjectToReopen(
        null
      );

      showToast(
        `${project.name} was reopened.`,
        "success"
      );
    } catch (error) {
      console.error(
        "Failed to reopen project:",
        error
      );

      showToast(
        error instanceof Error
          ? error.message
          : "Unable to reopen project.",
        "error"
      );
    }
  }

  async function handleConfirmDelete() {
    if (!projectToDelete) {
      return;
    }

    const project =
      projectToDelete;

    try {
      const response =
        await fetch(
          `/api/projects?id=${project.id}`,
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
            "Unable to delete project."
        );
      }

      setProjects(
        (
          currentProjects
        ) =>
          currentProjects.filter(
            (
              savedProject
            ) =>
              savedProject.id !==
              project.id
          )
      );

      setProjectToDelete(
        null
      );

      showToast(
        `${project.name} was permanently deleted.`,
        "success"
      );
    } catch (error) {
      console.error(
        "Failed to delete project:",
        error
      );

      showToast(
        error instanceof Error
          ? error.message
          : "Unable to delete project.",
        "error"
      );
    }
  }

  function formatClosedDate(
    dateValue: string
  ) {
    if (!dateValue) {
      return "Date unavailable";
    }

    return new Date(
      dateValue
    ).toLocaleDateString(
      [],
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      }
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold">
              Projects
            </h1>

            <p className="mt-1 text-gray-500 dark:text-slate-400">
              Manage active work and archived projects.
            </p>
          </div>

          <button
            type="button"
            onClick={openNewProjectModal}
            className="rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
          >
            + New Project
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-white p-5 shadow dark:bg-slate-900">
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Total Projects
            </p>

            <p className="mt-2 text-3xl font-bold">
              {projects.length}
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow dark:bg-slate-900">
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Active Projects
            </p>

            <p className="mt-2 text-3xl font-bold text-blue-600">
              {activeProjectCount}
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow dark:bg-slate-900">
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Closed Projects
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-600 dark:text-slate-300">
              {closedProjectCount}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4 rounded-xl bg-white p-4 shadow dark:bg-slate-900 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                setProjectView("active")
              }
              className={`rounded-lg px-4 py-2 font-medium ${
                projectView === "active"
                  ? "bg-blue-600 text-white"
                  : "border border-slate-300 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
              }`}
            >
              Active ({activeProjectCount})
            </button>

            <button
              type="button"
              onClick={() =>
                setProjectView("closed")
              }
              className={`rounded-lg px-4 py-2 font-medium ${
                projectView === "closed"
                  ? "bg-blue-600 text-white"
                  : "border border-slate-300 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
              }`}
            >
              Closed ({closedProjectCount})
            </button>

            <button
              type="button"
              onClick={() =>
                setProjectView("all")
              }
              className={`rounded-lg px-4 py-2 font-medium ${
                projectView === "all"
                  ? "bg-blue-600 text-white"
                  : "border border-slate-300 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
              }`}
            >
              All
            </button>
          </div>

          <input
            type="search"
            placeholder="Search projects or employees..."
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(event.target.value)
            }
            className="w-full rounded-lg border p-3 md:max-w-md"
          />
        </div>

        <div className="overflow-hidden rounded-xl bg-white shadow dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead className="bg-slate-200 dark:bg-slate-800">
                <tr>
                  <th className="p-4 text-left">
                    Project
                  </th>

                  <th className="p-4 text-left">
                    Customer
                  </th>

                  <th className="p-4 text-left">
                    Status
                  </th>

                  <th className="p-4 text-left">
                    Employees Involved
                  </th>

                  <th className="p-4 text-left">
                    Closed
                  </th>

                  <th className="p-4 text-left">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredProjects.map((project) => {
                  const projectIsClosed =
                    project.status === "Closed";

                  return (
                    <tr
                      key={project.id}
                      className={`border-t border-slate-200 transition dark:border-slate-800 ${
                        projectIsClosed
                          ? "bg-slate-50 dark:bg-slate-950/50"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      <td className="p-4">
                        <Link
                          href={`/customers/${project.customerId}/projects/${project.id}`}
                          className="font-medium text-blue-600 hover:underline"
                        >
                          {project.name}
                        </Link>

                        {project.address && (
                          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            {project.address}
                          </p>
                        )}
                      </td>

                      <td className="p-4">
                        <Link
                          href={`/customers/${project.customerId}`}
                          className="text-blue-600 hover:underline"
                        >
                          {project.customer}
                        </Link>
                      </td>

                      <td className="p-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${
                            projectIsClosed
                              ? "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                              : project.status ===
                                  "Completed"
                                ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
                                : project.status ===
                                    "In Progress"
                                  ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                                  : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                          }`}
                        >
                          {project.status}
                        </span>
                      </td>

                      <td className="p-4">
                        {project.employees.length > 0 ? (
                          <div className="flex max-w-sm flex-wrap gap-2">
                            {project.employees.map(
                              (employeeName) => (
                                <span
                                  key={employeeName}
                                  className="rounded-full bg-slate-100 px-3 py-1 text-xs dark:bg-slate-800"
                                >
                                  {employeeName}
                                </span>
                              )
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-slate-500 dark:text-slate-400">
                            No employees assigned
                          </span>
                        )}
                      </td>

                      <td className="p-4 text-sm text-slate-500 dark:text-slate-400">
                        {projectIsClosed
                          ? formatClosedDate(
                              project.closedAt
                            )
                          : "—"}
                      </td>

                      <td className="p-4">
                        <div className="flex flex-wrap gap-4">
                          <button
                            type="button"
                            onClick={() =>
                              openEditProjectModal(
                                project
                              )
                            }
                            className="text-blue-600 hover:underline"
                          >
                            Edit
                          </button>

                          {projectIsClosed ? (
                            <button
                              type="button"
                              onClick={() =>
                                setProjectToReopen(
                                  project
                                )
                              }
                              className="text-green-600 hover:underline"
                            >
                              Reopen
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                setProjectToClose(
                                  project
                                )
                              }
                              className="text-amber-600 hover:underline"
                            >
                              Close
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              setProjectToDelete(
                                project
                              )
                            }
                            className="text-red-600 hover:underline"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredProjects.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-8 text-center text-gray-500 dark:text-slate-400"
                    >
                      {loading
                        ? "Loading projects..."
                        : projectView === "closed"
                          ? "No closed projects found."
                          : projectView === "active"
                            ? "No active projects found."
                            : "No projects found."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <Modal
          isOpen={showProjectModal}
          onClose={closeProjectModal}
          title={
            editingProjectId !== null
              ? "Edit Project"
              : "New Project"
          }
        >
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Project Name"
              value={projectName}
              onChange={(event) =>
                setProjectName(event.target.value)
              }
              className="w-full rounded-lg border p-3"
            />

            <div>
              <label className="mb-1 block text-sm font-medium">
                Customer
              </label>

              <select
                value={projectCustomerId ?? ""}
                onChange={(event) =>
                  setProjectCustomerId(
                    event.target.value
                      ? Number(event.target.value)
                      : null
                  )
                }
                className="w-full rounded-lg border p-3"
              >
                <option value="">
                  Select a customer
                </option>

                {customers.map((customer) => (
                  <option
                    key={customer.id}
                    value={customer.id}
                  >
                    {customer.company}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Project Status
              </label>

              <select
                value={projectStatus}
                onChange={(event) =>
                  setProjectStatus(
                    event.target
                      .value as ProjectStatus
                  )
                }
                className="w-full rounded-lg border p-3"
              >
                <option value="Not Started">
                  Not Started
                </option>

                <option value="Scheduled">
                  Scheduled
                </option>

                <option value="In Progress">
                  In Progress
                </option>

                <option value="Completed">
                  Completed
                </option>

                <option value="Closed">
                  Closed — Archive Project
                </option>
              </select>

              {projectStatus === "Closed" && (
                <p className="mt-2 text-sm text-amber-600">
                  Closing this project will archive it while preserving its employees, hours, photos, and notes.
                </p>
              )}
            </div>

            <input
              type="text"
              placeholder="Project Address"
              value={projectAddress}
              onChange={(event) =>
                setProjectAddress(
                  event.target.value
                )
              }
              className="w-full rounded-lg border p-3"
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Start Date
                </label>

                <input
                  type="date"
                  value={projectStartDate}
                  onChange={(event) =>
                    setProjectStartDate(
                      event.target.value
                    )
                  }
                  className="w-full rounded-lg border p-3"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Due Date
                </label>

                <input
                  type="date"
                  value={projectDueDate}
                  onChange={(event) =>
                    setProjectDueDate(
                      event.target.value
                    )
                  }
                  className="w-full rounded-lg border p-3"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => void handleSaveProject()}
              disabled={saving}
              className="w-full rounded-lg bg-blue-600 py-3 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : editingProjectId !== null
                  ? "Update Project"
                  : "Save Project"}
            </button>
          </div>
        </Modal>

        <ConfirmDialog
          isOpen={projectToClose !== null}
          title="Close and Archive Project?"
          message={
            projectToClose
              ? `Close ${projectToClose.name}? The project will move to Closed Projects, and its employees, hours, photos, notes, and history will be preserved.`
              : ""
          }
          confirmLabel="Close Project"
          cancelLabel="Cancel"
          onConfirm={() => void handleConfirmClose()}
          onCancel={() =>
            setProjectToClose(null)
          }
        />

        <ConfirmDialog
          isOpen={projectToReopen !== null}
          title="Reopen Project?"
          message={
            projectToReopen
              ? `Reopen ${projectToReopen.name}? It will return to the active project list with an In Progress status.`
              : ""
          }
          confirmLabel="Reopen Project"
          cancelLabel="Cancel"
          onConfirm={() => void handleConfirmReopen()}
          onCancel={() =>
            setProjectToReopen(null)
          }
        />

        <ConfirmDialog
          isOpen={projectToDelete !== null}
          title="Permanently Delete Project?"
          message={
            projectToDelete
              ? `Permanently delete ${projectToDelete.name}? Unlike closing a project, this removes the project from customer history and cannot be undone.`
              : ""
          }
          confirmLabel="Delete Permanently"
          cancelLabel="Cancel"
          danger
          onConfirm={() => void handleConfirmDelete()}
          onCancel={() =>
            setProjectToDelete(null)
          }
        />
      </div>
    </AppLayout>
  );
}