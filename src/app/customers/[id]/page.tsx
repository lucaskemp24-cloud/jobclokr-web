"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

import AppLayout from "@/components/layout/AppLayout";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/ToastProvider";

type DatabaseCustomer = {
  id: number;
  companyId: number;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

import type {
  Project,
  ProjectStatus,
} from "@/lib/projects";

type CustomerTab =
  | "projects"
  | "documents"
  | "notes";

export default function CustomerDetailsPage() {
  const params = useParams();
  const { showToast } = useToast();

  const customerId = Number(params.id);

  const [activeTab, setActiveTab] =
    useState<CustomerTab>("projects");

  const [customer, setCustomer] =
    useState<DatabaseCustomer | null>(null);

  const [projects, setProjects] =
    useState<Project[]>([]);

  const [dataLoaded, setDataLoaded] =
    useState(false);

  const [showProjectModal, setShowProjectModal] =
    useState(false);

  const [editingProjectId, setEditingProjectId] =
    useState<number | null>(null);

  const [projectName, setProjectName] =
    useState("");

  const [projectStatus, setProjectStatus] =
    useState<ProjectStatus>("Not Started");

  const [projectAddress, setProjectAddress] =
    useState("");

  const [projectStartDate, setProjectStartDate] =
    useState("");

  const [projectDueDate, setProjectDueDate] =
    useState("");

  const [projectToClose, setProjectToClose] =
    useState<Project | null>(null);

  const [projectToReopen, setProjectToReopen] =
    useState<Project | null>(null);

  const [projectToDelete, setProjectToDelete] =
    useState<Project | null>(null);

  useEffect(() => {
    async function loadCustomerAndProjects() {
      try {
        setDataLoaded(false);

        const [
          customerResponse,
          projectsResponse,
        ] = await Promise.all([
          fetch(
            `/api/customers/${customerId}`,
            {
              cache: "no-store",
            }
          ),
          fetch(
            `/api/projects?customerId=${customerId}`,
            {
              cache: "no-store",
            }
          ),
        ]);

        const customerData =
          await customerResponse.json();

        const projectsData =
          await projectsResponse.json();

        if (!customerResponse.ok) {
          throw new Error(
            customerData.error ||
              "Unable to load customer."
          );
        }

        if (!projectsResponse.ok) {
          throw new Error(
            projectsData.error ||
              "Unable to load projects."
          );
        }

        setCustomer(customerData);
        setProjects(projectsData);
      } catch (error) {
        console.error(
          "Customer/project load failed:",
          error
        );

        setCustomer(null);
        setProjects([]);

        showToast(
          error instanceof Error
            ? error.message
            : "Unable to load customer data.",
          "error"
        );
      } finally {
        setDataLoaded(true);
      }
    }

    void loadCustomerAndProjects();
  }, [customerId, showToast]);

  const customerProjects = useMemo(() => {
    return projects.filter(
      (project) =>
        project.customerId === customerId
    );
  }, [projects, customerId]);

  const activeProjects = useMemo(() => {
    return customerProjects.filter(
      (project) => project.status !== "Closed"
    );
  }, [customerProjects]);

  const closedProjects = useMemo(() => {
    return customerProjects
      .filter(
        (project) => project.status === "Closed"
      )
      .sort(
        (firstProject, secondProject) =>
          new Date(
            secondProject.closedAt || 0
          ).getTime() -
          new Date(
            firstProject.closedAt || 0
          ).getTime()
      );
  }, [customerProjects]);

  const totalProjectHours =
    customerProjects.reduce(
      (total, project) =>
        total + project.totalHours,
      0
    );

  const employeesInvolved = Array.from(
    new Set(
      customerProjects.flatMap(
        (project) => project.employees
      )
    )
  );

  function resetProjectForm() {
    setProjectName("");
    setProjectStatus("Not Started");
    setProjectAddress("");
    setProjectStartDate("");
    setProjectDueDate("");
    setEditingProjectId(null);
  }

  function openNewProjectModal() {
    resetProjectForm();
    setShowProjectModal(true);
  }

  function openEditProjectModal(
    project: Project
  ) {
    setEditingProjectId(project.id);
    setProjectName(project.name);
    setProjectStatus(project.status);
    setProjectAddress(project.address);
    setProjectStartDate(project.startDate);
    setProjectDueDate(project.dueDate);
    setShowProjectModal(true);
  }

  function closeProjectModal() {
    setShowProjectModal(false);
    resetProjectForm();
  }

  async function handleSaveProject() {
    if (!customer) {
      showToast(
        "The customer could not be found.",
        "error"
      );
      return;
    }

    const trimmedProjectName =
      projectName.trim();

    const trimmedAddress =
      projectAddress.trim();

    if (!trimmedProjectName) {
      showToast(
        "Please enter a project name.",
        "error"
      );
      return;
    }

    if (
      projectStartDate &&
      projectDueDate &&
      new Date(projectDueDate) <
        new Date(projectStartDate)
    ) {
      showToast(
        "The due date cannot be before the start date.",
        "error"
      );
      return;
    }

    try {
      const isEditing =
        editingProjectId !== null;

      const response = await fetch(
        "/api/projects",
        {
          method: isEditing
            ? "PATCH"
            : "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            id: editingProjectId,
            customerId: customer.id,
            name: trimmedProjectName,
            status: projectStatus,
            address: trimmedAddress,
            startDate: projectStartDate,
            dueDate: projectDueDate,
            details: "",
          }),
        }
      );

      const savedProject =
        await response.json();

      if (!response.ok) {
        throw new Error(
          savedProject.error ||
            "Unable to save project."
        );
      }

      if (isEditing) {
        setProjects(
          (currentProjects) =>
            currentProjects.map(
              (project) =>
                project.id ===
                editingProjectId
                  ? savedProject
                  : project
            )
        );

        showToast(
          projectStatus === "Closed"
            ? "Project updated and moved to customer history."
            : "Project updated successfully.",
          "success"
        );
      } else {
        setProjects(
          (currentProjects) => [
            ...currentProjects,
            savedProject,
          ]
        );

        showToast(
          projectStatus === "Closed"
            ? "Closed project created and added to customer history."
            : "Project created successfully.",
          "success"
        );
      }

      closeProjectModal();
    } catch (error) {
      console.error(
        "Project save failed:",
        error
      );

      showToast(
        error instanceof Error
          ? error.message
          : "Unable to save project.",
        "error"
      );
    }
  }

  async function handleConfirmClose() {
    if (!projectToClose) {
      return;
    }

    try {
      const response = await fetch(
        "/api/projects",
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            id: projectToClose.id,
            name: projectToClose.name,
            status: "Closed",
            address: projectToClose.address,
            startDate: projectToClose.startDate,
            dueDate: projectToClose.dueDate,
            details: projectToClose.details,
          }),
        }
      );

      const updatedProject =
        await response.json();

      if (!response.ok) {
        throw new Error(
          updatedProject.error ||
            "Unable to close project."
        );
      }

      setProjects(
        (currentProjects) =>
          currentProjects.map(
            (project) =>
              project.id ===
              updatedProject.id
                ? updatedProject
                : project
          )
      );

      setProjectToClose(null);

      showToast(
        `${updatedProject.name} was closed and archived.`,
        "success"
      );
    } catch (error) {
      console.error(
        "Project close failed:",
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

    try {
      const response = await fetch(
        "/api/projects",
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            id: projectToReopen.id,
            name: projectToReopen.name,
            status: "In Progress",
            address: projectToReopen.address,
            startDate: projectToReopen.startDate,
            dueDate: projectToReopen.dueDate,
            details: projectToReopen.details,
          }),
        }
      );

      const updatedProject =
        await response.json();

      if (!response.ok) {
        throw new Error(
          updatedProject.error ||
            "Unable to reopen project."
        );
      }

      setProjects(
        (currentProjects) =>
          currentProjects.map(
            (project) =>
              project.id ===
              updatedProject.id
                ? updatedProject
                : project
          )
      );

      setProjectToReopen(null);

      showToast(
        `${updatedProject.name} was reopened.`,
        "success"
      );
    } catch (error) {
      console.error(
        "Project reopen failed:",
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

    const projectNameToDelete =
      projectToDelete.name;

    try {
      const response = await fetch(
        `/api/projects?id=${projectToDelete.id}`,
        {
          method: "DELETE",
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Unable to delete project."
        );
      }

      setProjects(
        (currentProjects) =>
          currentProjects.filter(
            (project) =>
              project.id !==
              projectToDelete.id
          )
      );

      setProjectToDelete(null);

      showToast(
        `${projectNameToDelete} was permanently deleted.`,
        "success"
      );
    } catch (error) {
      console.error(
        "Project delete failed:",
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
    ).toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function getStatusClasses(
    status: ProjectStatus
  ) {
    if (status === "Closed") {
      return "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200";
    }

    if (status === "Completed") {
      return "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300";
    }

    if (status === "In Progress") {
      return "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300";
    }

    return "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300";
  }

  if (!dataLoaded) {
    return (
      <AppLayout>
        <div className="rounded-xl bg-white p-8 text-center text-slate-500 shadow dark:bg-slate-900 dark:text-slate-400">
          Loading customer...
        </div>
      </AppLayout>
    );
  }

  if (!customer) {
    return (
      <AppLayout>
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">
            Customer Not Found
          </h1>

          <p className="text-slate-500 dark:text-slate-400">
            This customer may have been removed.
          </p>

          <Link
            href="/customers"
            className="inline-block text-blue-600 hover:underline"
          >
            ← Back to Customers
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <Link
          href="/customers"
          className="inline-block text-blue-600 hover:underline"
        >
          ← Back to Customers
        </Link>

        <div>
          <h1 className="text-4xl font-bold">
            {customer.name}
          </h1>

          <p className="mt-1 text-gray-500 dark:text-slate-400">
            Customer profile and project history.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() =>
              setActiveTab("projects")
            }
            className={`rounded-lg px-4 py-2 ${
              activeTab === "projects"
                ? "bg-blue-600 text-white"
                : "border bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800"
            }`}
          >
            Projects
          </button>

          <button
            type="button"
            onClick={() =>
              setActiveTab("documents")
            }
            className={`rounded-lg px-4 py-2 ${
              activeTab === "documents"
                ? "bg-blue-600 text-white"
                : "border bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800"
            }`}
          >
            Documents
          </button>

          <button
            type="button"
            onClick={() =>
              setActiveTab("notes")
            }
            className={`rounded-lg px-4 py-2 ${
              activeTab === "notes"
                ? "bg-blue-600 text-white"
                : "border bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800"
            }`}
          >
            Notes
          </button>
        </div>

        {activeTab === "projects" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <section className="rounded-xl bg-white p-6 shadow dark:bg-slate-900">
                <h2 className="mb-4 text-xl font-semibold">
                  Contact Information
                </h2>

                <div className="space-y-2">
                  <p>
                    <strong>Contact:</strong>{" "}
                    {customer.contactName ||
                      "Not provided"}
                  </p>

                  <p>
                    <strong>Phone:</strong>{" "}
                    {customer.phone ||
                      "Not provided"}
                  </p>

                  <p>
                    <strong>Email:</strong>{" "}
                    {customer.email ||
                      "Not provided"}
                  </p>

                  <p>
                    <strong>Address:</strong>{" "}
                    {customer.address ||
                      "Not provided"}
                  </p>
                </div>
              </section>

              <section className="rounded-xl bg-white p-6 shadow dark:bg-slate-900">
                <h2 className="mb-4 text-xl font-semibold">
                  Customer Stats
                </h2>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Total Projects
                    </p>

                    <p className="mt-1 text-2xl font-bold">
                      {customerProjects.length}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Active Projects
                    </p>

                    <p className="mt-1 text-2xl font-bold text-blue-600">
                      {activeProjects.length}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Closed Projects
                    </p>

                    <p className="mt-1 text-2xl font-bold">
                      {closedProjects.length}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Total Hours
                    </p>

                    <p className="mt-1 text-2xl font-bold">
                      {totalProjectHours.toFixed(1)}
                    </p>
                  </div>
                </div>

                <div className="mt-5">
                  <p className="text-sm font-semibold">
                    Employees Involved
                  </p>

                  {employeesInvolved.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {employeesInvolved.map(
                        (employeeName) => (
                          <span
                            key={employeeName}
                            className="rounded-full bg-slate-100 px-3 py-1 text-sm dark:bg-slate-800"
                          >
                            {employeeName}
                          </span>
                        )
                      )}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                      No employees recorded.
                    </p>
                  )}
                </div>
              </section>
            </div>

            <section className="rounded-xl bg-white p-6 shadow dark:bg-slate-900">
              <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold">
                    Active Projects
                  </h2>

                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Current and upcoming work for this customer.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={openNewProjectModal}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                  + New Project
                </button>
              </div>

              {activeProjects.length > 0 ? (
                <div className="space-y-3">
                  {activeProjects.map(
                    (project) => (
                      <article
                        key={project.id}
                        className="rounded-lg border border-slate-200 p-4 dark:border-slate-700"
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <Link
                              href={`/customers/${customer.id}/projects/${project.id}`}
                              className="font-semibold text-blue-600 hover:underline"
                            >
                              {project.name}
                            </Link>

                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClasses(
                                  project.status
                                )}`}
                              >
                                {project.status}
                              </span>

                              <span className="text-sm text-slate-500 dark:text-slate-400">
                                {project.totalHours.toFixed(
                                  1
                                )}{" "}
                                hours
                              </span>
                            </div>

                            {project.address && (
                              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                                {project.address}
                              </p>
                            )}
                          </div>

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
                        </div>

                        <div className="mt-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            Employees
                          </p>

                          {project.employees.length > 0 ? (
                            <div className="mt-2 flex flex-wrap gap-2">
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
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                              No employees assigned.
                            </p>
                          )}
                        </div>
                      </article>
                    )
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
                  <p className="font-semibold">
                    No active projects
                  </p>

                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Create a project for this customer to get started.
                  </p>
                </div>
              )}
            </section>

            <section className="rounded-xl bg-white p-6 shadow dark:bg-slate-900">
              <div>
                <h2 className="text-2xl font-semibold">
                  Closed Project History
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Archived work and everyone involved.
                </p>
              </div>

              {closedProjects.length > 0 ? (
                <div className="mt-5 space-y-4">
                  {closedProjects.map(
                    (project) => (
                      <article
                        key={project.id}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-950/50"
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-3">
                              <Link
                                href={`/customers/${customer.id}/projects/${project.id}`}
                                className="text-lg font-semibold text-blue-600 hover:underline"
                              >
                                {project.name}
                              </Link>

                              <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                                Closed
                              </span>
                            </div>

                            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                              Closed{" "}
                              {formatClosedDate(
                                project.closedAt
                              )}
                            </p>

                            {project.address && (
                              <p className="mt-2 text-sm">
                                {project.address}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-4">
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

                            <button
                              type="button"
                              onClick={() =>
                                setProjectToDelete(
                                  project
                                )
                              }
                              className="text-red-600 hover:underline"
                            >
                              Delete Permanently
                            </button>
                          </div>
                        </div>

                        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
                          <div className="rounded-lg bg-white p-4 dark:bg-slate-900">
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              Total Hours
                            </p>

                            <p className="mt-1 text-xl font-bold">
                              {project.totalHours.toFixed(
                                1
                              )}
                            </p>
                          </div>

                          <div className="rounded-lg bg-white p-4 dark:bg-slate-900">
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              Start Date
                            </p>

                            <p className="mt-1 font-semibold">
                              {project.startDate ||
                                "Not recorded"}
                            </p>
                          </div>

                          <div className="rounded-lg bg-white p-4 dark:bg-slate-900">
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              Due Date
                            </p>

                            <p className="mt-1 font-semibold">
                              {project.dueDate ||
                                "Not recorded"}
                            </p>
                          </div>
                        </div>

                        <div className="mt-5">
                          <p className="text-sm font-semibold">
                            Employees Involved
                          </p>

                          {project.employees.length > 0 ? (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {project.employees.map(
                                (employeeName) => (
                                  <span
                                    key={employeeName}
                                    className="rounded-full bg-white px-3 py-1 text-sm dark:bg-slate-900"
                                  >
                                    {employeeName}
                                  </span>
                                )
                              )}
                            </div>
                          ) : (
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                              No employees were recorded.
                            </p>
                          )}
                        </div>
                      </article>
                    )
                  )}
                </div>
              ) : (
                <div className="mt-5 rounded-xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
                  <p className="font-semibold">
                    No closed projects
                  </p>

                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Closed projects will remain here as permanent customer history.
                  </p>
                </div>
              )}
            </section>
          </div>
        )}

        {activeTab === "documents" && (
          <section className="rounded-xl bg-white p-6 shadow dark:bg-slate-900">
            <h2 className="mb-4 text-2xl font-semibold">
              Documents
            </h2>

            <p className="text-gray-500 dark:text-slate-400">
              No documents have been uploaded yet.
            </p>
          </section>
        )}

        {activeTab === "notes" && (
          <section className="rounded-xl bg-white p-6 shadow dark:bg-slate-900">
            <h2 className="mb-4 text-2xl font-semibold">
              Notes
            </h2>

            <p className="text-gray-500 dark:text-slate-400">
              No customer notes have been added yet.
            </p>
          </section>
        )}

        <Modal
          isOpen={showProjectModal}
          onClose={closeProjectModal}
          title={
            editingProjectId !== null
              ? "Edit Project"
              : `New Project for ${customer.name}`
          }
        >
          <div className="space-y-4">
            <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
              This project will be saved under{" "}
              <strong>{customer.name}</strong>.
            </div>

            <input
              type="text"
              placeholder="Project Name"
              value={projectName}
              onChange={(event) =>
                setProjectName(
                  event.target.value
                )
              }
              className="w-full rounded-lg border p-3"
            />

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
              onClick={handleSaveProject}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 text-white hover:bg-blue-700"
            >
              {editingProjectId !== null
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
              ? `Close ${projectToClose.name}? It will remain saved under ${customer.name}.`
              : ""
          }
          confirmLabel="Close Project"
          cancelLabel="Cancel"
          onConfirm={handleConfirmClose}
          onCancel={() =>
            setProjectToClose(null)
          }
        />

        <ConfirmDialog
          isOpen={projectToReopen !== null}
          title="Reopen Project?"
          message={
            projectToReopen
              ? `Reopen ${projectToReopen.name}? It will return to Active Projects for ${customer.name}.`
              : ""
          }
          confirmLabel="Reopen Project"
          cancelLabel="Cancel"
          onConfirm={handleConfirmReopen}
          onCancel={() =>
            setProjectToReopen(null)
          }
        />

        <ConfirmDialog
          isOpen={projectToDelete !== null}
          title="Permanently Delete Project?"
          message={
            projectToDelete
              ? `Permanently delete ${projectToDelete.name}? This removes it from ${customer.name}'s history and cannot be undone.`
              : ""
          }
          confirmLabel="Delete Permanently"
          cancelLabel="Cancel"
          danger
          onConfirm={handleConfirmDelete}
          onCancel={() =>
            setProjectToDelete(null)
          }
        />
      </div>
    </AppLayout>
  );
}