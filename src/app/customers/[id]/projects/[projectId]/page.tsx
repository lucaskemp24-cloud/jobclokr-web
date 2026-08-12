"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useParams } from "next/navigation";

import AppLayout from "@/components/layout/AppLayout";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/ToastProvider";

import ProjectHeader from "@/components/projects/ProjectHeader";
import ProjectTabs from "@/components/projects/ProjectTabs";
import ProjectOverview from "@/components/projects/ProjectOverview";
import ProjectActivity from "@/components/projects/ProjectActivity";
import ProjectDetails from "@/components/projects/ProjectDetails";
import ProjectLabor from "@/components/projects/ProjectLabor";
import ProjectMaterials from "@/components/projects/ProjectMaterials";
import ProjectNotes from "@/components/projects/ProjectNotes";
import ProjectPhotos from "@/components/projects/ProjectPhotos";
import ProjectDocuments from "@/components/projects/ProjectDocuments";

import type { Project } from "@/lib/projects";

type DatabaseEmployee = {
  id: number;
  companyId: number;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  role: "OWNER" | "OFFICE" | "FOREMAN" | "EMPLOYEE";
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

function getDatabaseEmployeeName(
  employee: DatabaseEmployee
) {
  return `${employee.firstName} ${employee.lastName}`.trim();
}

function formatEmployeeRole(
  role: DatabaseEmployee["role"]
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




export default function ProjectDetailsPage() {
  const params = useParams();
  const { showToast } = useToast();

  const customerId = Number(params.id);
  const projectId = Number(params.projectId);

  const [projects, setProjects] =
    useState<Project[]>([]);

  const [employees, setEmployees] =
    useState<DatabaseEmployee[]>([]);




  const [projectsLoaded, setProjectsLoaded] =
    useState(false);

  const [
    showAssignModal,
    setShowAssignModal,
  ] = useState(false);

  const [
    selectedEmployeeId,
    setSelectedEmployeeId,
  ] = useState("");

  useEffect(() => {
    async function loadProjectData() {
      try {
        setProjectsLoaded(false);

        const [
          projectsResponse,
          employeesResponse,
        ] = await Promise.all([
          fetch(
            `/api/projects?customerId=${customerId}`,
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
        ]);

        const projectsData =
          await projectsResponse.json();

        const employeesData =
          await employeesResponse.json();

        if (!projectsResponse.ok) {
          throw new Error(
            projectsData.error ||
              "Unable to load project."
          );
        }

        if (!employeesResponse.ok) {
          throw new Error(
            employeesData.error ||
              "Unable to load employees."
          );
        }

        setProjects(projectsData);
        setEmployees(employeesData);


      } catch (error) {
        console.error(
          "Project page load failed:",
          error
        );

        setProjects([]);
        setEmployees([]);



        showToast(
          error instanceof Error
            ? error.message
            : "Unable to load project data.",
          "error"
        );
      } finally {
        setProjectsLoaded(true);
      }
    }

    void loadProjectData();
  }, [customerId, showToast]);

  const project = projects.find(
    (savedProject) =>
      savedProject.id === projectId &&
      savedProject.customerId === customerId
  );

  const activeEmployees = useMemo(
    () =>
      employees.filter(
        (employee) =>
          employee.active
      ),
    [employees]
  );

  const availableEmployees = useMemo(() => {
    if (!project) {
      return [];
    }

    return activeEmployees.filter(
      (employee) =>
        !project.employees.includes(
          getDatabaseEmployeeName(
            employee
          )
        )
    );
  }, [activeEmployees, project]);




  const projectIsClosed =
    project?.status === "Closed";

  function closeAssignModal() {
    setShowAssignModal(false);
    setSelectedEmployeeId("");
  }

  async function handleAssignEmployee() {
    if (!project) {
      return;
    }

    if (projectIsClosed) {
      showToast(
        "Closed projects cannot be changed. Reopen the project first.",
        "warning"
      );

      closeAssignModal();
      return;
    }

    const employeeId =
      Number(selectedEmployeeId);

    if (
      !Number.isInteger(employeeId) ||
      employeeId <= 0
    ) {
      showToast(
        "Please select an employee.",
        "error"
      );

      return;
    }

    const selectedEmployee =
      employees.find(
        (employee) =>
          employee.id ===
          employeeId
      );

    if (!selectedEmployee) {
      showToast(
        "The selected employee could not be found.",
        "error"
      );

      return;
    }

    const employeeName =
      getDatabaseEmployeeName(
        selectedEmployee
      );

    if (
      project.employees.includes(
        employeeName
      )
    ) {
      showToast(
        "That employee is already assigned.",
        "warning"
      );

      return;
    }

    try {
      const response = await fetch(
        "/api/project-assignments",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            projectId: project.id,
            employeeId,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to assign employee."
        );
      }

      setProjects(
        (currentProjects) =>
          currentProjects.map(
            (savedProject) =>
              savedProject.id ===
              project.id
                ? {
                    ...savedProject,
                    employees: [
                      ...savedProject.employees,
                      employeeName,
                    ],
                  }
                : savedProject
          )
      );

      closeAssignModal();

      showToast(
        `${employeeName} was assigned to ${project.name}.`,
        "success"
      );
    } catch (error) {
      console.error(
        "Employee assignment failed:",
        error
      );

      showToast(
        error instanceof Error
          ? error.message
          : "Unable to assign employee.",
        "error"
      );
    }
  }

  async function handleRemoveEmployee(
    employeeName: string
  ) {
    if (!project) {
      return;
    }

    if (projectIsClosed) {
      showToast(
        "Closed projects cannot be changed. Reopen the project first.",
        "warning"
      );

      return;
    }

    const employee =
      employees.find(
        (savedEmployee) =>
          getDatabaseEmployeeName(
            savedEmployee
          ) === employeeName
      );

    if (!employee) {
      showToast(
        "The employee could not be found.",
        "error"
      );

      return;
    }

    try {
      const response = await fetch(
        `/api/project-assignments?projectId=${project.id}&employeeId=${employee.id}`,
        {
          method: "DELETE",
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

      setProjects(
        (currentProjects) =>
          currentProjects.map(
            (savedProject) =>
              savedProject.id ===
              project.id
                ? {
                    ...savedProject,
                    employees:
                      savedProject.employees.filter(
                        (
                          savedEmployeeName
                        ) =>
                          savedEmployeeName !==
                          employeeName
                      ),
                  }
                : savedProject
          )
      );

      showToast(
        `${employeeName} was removed from ${project.name}.`,
        "success"
      );
    } catch (error) {
      console.error(
        "Employee removal failed:",
        error
      );

      showToast(
        error instanceof Error
          ? error.message
          : "Unable to remove employee.",
        "error"
      );
    }
  }

  if (!projectsLoaded) {
    return (
      <AppLayout>
        <div className="rounded-xl bg-white p-8 text-center shadow dark:bg-slate-900">
          <p className="text-slate-500 dark:text-slate-400">
            Loading project...
          </p>
        </div>
      </AppLayout>
    );
  }

  if (!project) {
    return (
      <AppLayout>
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">
            Project Not Found
          </h1>

          <p className="text-slate-500 dark:text-slate-400">
            This project does not belong to the selected customer or may have been removed.
          </p>
        </div>
      </AppLayout>
    );
  }

  const assignedEmployeesSection = (
    <section className="rounded-xl bg-white p-6 shadow dark:bg-slate-900">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">
            Assigned Employees
          </h2>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Employees associated with this project.
          </p>
        </div>

        {!projectIsClosed && (
          <button
            type="button"
            onClick={() =>
              setShowAssignModal(true)
            }
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            + Assign Employee
          </button>
        )}
      </div>

      {project.employees.length > 0 ? (
        <div className="space-y-3">
          {project.employees.map(
            (employeeName) => (
              <div
                key={employeeName}
                className="flex items-center justify-between rounded-lg border border-slate-200 p-4 dark:border-slate-700"
              >
                <span>{employeeName}</span>

                {!projectIsClosed && (
                  <button
                    type="button"
                    onClick={() =>
                      handleRemoveEmployee(
                        employeeName
                      )
                    }
                    className="text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>
            )
          )}
        </div>
      ) : (
        <p className="text-slate-500 dark:text-slate-400">
          No employees have been assigned yet.
        </p>
      )}
    </section>
  );

  const overviewContent = (
    <div className="space-y-6">
      <ProjectOverview
        projectId={project.id}
        assignedEmployeeCount={
          project.employees.length
        }
        startDate={project.startDate}
      />

      <ProjectDetails project={project} />

      {assignedEmployeesSection}
    </div>
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <ProjectHeader project={project} />

        <ProjectTabs
          overview={overviewContent}
          activity={
            <ProjectActivity
              projectId={project.id}
            />
          }
          labor={
            <ProjectLabor
              projectId={project.id}
            />
          }
          materials={
            <ProjectMaterials
              projectId={project.id}
            />
          }
          photos={
            <ProjectPhotos
              projectId={project.id}
              projectName={project.name}
            />
          }
          notes={
            <ProjectNotes
              projectId={project.id}
            />
          }
         documents={
  <ProjectDocuments
    projectId={project.id}
  />
}
        />

        <Modal
          isOpen={showAssignModal}
          onClose={closeAssignModal}
          title="Assign Employee"
        >
          <div className="space-y-4">
            <select
              value={selectedEmployeeId}
              onChange={(event) =>
                setSelectedEmployeeId(
                  event.target.value
                )
              }
              className="w-full rounded-lg border p-3"
            >
              <option value="">
                Select an employee
              </option>

              {availableEmployees.map(
                (availableEmployee) => {
                  const employeeName =
                    getDatabaseEmployeeName(
                      availableEmployee
                    );

                  return (
                    <option
                      key={availableEmployee.id}
                      value={String(
                        availableEmployee.id
                      )}
                    >
                      {employeeName} —{" "}
                      {formatEmployeeRole(
                        availableEmployee.role
                      )}
                    </option>
                  );
                }
              )}
            </select>

            {availableEmployees.length ===
              0 && (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                All active employees are already assigned.
              </p>
            )}

            <button
              type="button"
              onClick={handleAssignEmployee}
              disabled={!selectedEmployeeId}
              className="w-full rounded-lg bg-blue-600 py-3 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              Assign Employee
            </button>
          </div>
        </Modal>
      </div>
    </AppLayout>
  );
}