"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

import AppLayout from "@/components/layout/AppLayout";
import Modal from "@/components/ui/Modal";

import {
  defaultProjects,
  loadProjects,
  saveProjects,
  type Project,
} from "@/lib/projects";

import {
  getEmployeeName,
  loadEmployees,
  type Employee,
} from "@/lib/employees";

export default function ProjectDetailsPage() {
  const params = useParams();
  const projectId = Number(params.projectId);

  const [projects, setProjects] =
    useState<Project[]>(defaultProjects);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projectsLoaded, setProjectsLoaded] = useState(false);

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedEmployeeName, setSelectedEmployeeName] =
    useState("");

  useEffect(() => {
    setProjects(loadProjects());
    setEmployees(loadEmployees());
    setProjectsLoaded(true);
  }, []);

  const project = projects.find(
    (savedProject) => savedProject.id === projectId
  );

  const activeEmployees = employees.filter(
    (employee) => employee.status === "Active"
  );

  function closeAssignModal() {
    setShowAssignModal(false);
    setSelectedEmployeeName("");
  }

  function handleAssignEmployee() {
    if (!project) {
      return;
    }

    if (!selectedEmployeeName) {
      alert("Please select an employee.");
      return;
    }

    if (project.employees.includes(selectedEmployeeName)) {
      alert("That employee is already assigned.");
      return;
    }

    const updatedProjects = projects.map((savedProject) =>
      savedProject.id === project.id
        ? {
            ...savedProject,
            employees: [
              ...savedProject.employees,
              selectedEmployeeName,
            ],
          }
        : savedProject
    );

    setProjects(updatedProjects);
    saveProjects(updatedProjects);
    closeAssignModal();
  }

  function handleRemoveEmployee(employeeName: string) {
    if (!project) {
      return;
    }

    const updatedProjects = projects.map((savedProject) =>
      savedProject.id === project.id
        ? {
            ...savedProject,
            employees: savedProject.employees.filter(
              (savedEmployee) =>
                savedEmployee !== employeeName
            ),
          }
        : savedProject
    );

    setProjects(updatedProjects);
    saveProjects(updatedProjects);
  }

  if (!projectsLoaded) {
    return (
      <AppLayout>
        <p className="text-gray-500">Loading project...</p>
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

          <Link
            href="/projects"
            className="text-blue-600 hover:underline"
          >
            ← Back to Projects
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <Link
          href="/projects"
          className="text-blue-600 hover:underline inline-block"
        >
          ← Back to Projects
        </Link>

        <div>
          <h1 className="text-4xl font-bold">
            {project.name}
          </h1>

          <p className="text-gray-500 mt-1">
            {project.customer}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-2xl font-semibold mb-4">
              Project Information
            </h2>

            <div className="space-y-3">
              <p>
                <strong>Status:</strong> {project.status}
              </p>

              <p>
                <strong>Address:</strong>{" "}
                {project.address || "No address added"}
              </p>

              <p>
                <strong>Start Date:</strong>{" "}
                {project.startDate || "Not set"}
              </p>

              <p>
                <strong>Due Date:</strong>{" "}
                {project.dueDate || "Not set"}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-2xl font-semibold mb-4">
              Project Summary
            </h2>

            <div className="space-y-3">
              <p>
                <strong>Total Hours:</strong>{" "}
                {project.totalHours}
              </p>

              <p>
                <strong>Assigned Employees:</strong>{" "}
                {project.employees.length}
              </p>

              <p>
                <strong>Details:</strong>{" "}
                {project.details || "No details added"}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-2xl font-semibold">
              Assigned Employees
            </h2>

            <button
              onClick={() => setShowAssignModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              + Assign Employee
            </button>
          </div>

          {project.employees.length > 0 ? (
            <div className="space-y-3">
              {project.employees.map((employeeName) => (
                <div
                  key={employeeName}
                  className="border rounded-lg p-4 flex items-center justify-between"
                >
                  <span>{employeeName}</span>

                  <button
                    onClick={() =>
                      handleRemoveEmployee(employeeName)
                    }
                    className="text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">
              No employees have been assigned yet.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-2xl font-semibold mb-4">
              Notes
            </h2>

            <p className="text-gray-500">
              No notes have been added yet.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-2xl font-semibold mb-4">
              Documents
            </h2>

            <p className="text-gray-500">
              No documents have been uploaded yet.
            </p>
          </div>
        </div>

        <Modal
          isOpen={showAssignModal}
          onClose={closeAssignModal}
          title="Assign Employee"
        >
          <div className="space-y-4">
            <select
              value={selectedEmployeeName}
              onChange={(event) =>
                setSelectedEmployeeName(event.target.value)
              }
              className="w-full border rounded-lg p-3"
            >
              <option value="">
                Select an employee
              </option>

              {activeEmployees
                .filter(
                  (employee) =>
                    !project.employees.includes(
                      getEmployeeName(employee)
                    )
                )
                .map((employee) => {
                  const employeeName =
                    getEmployeeName(employee);

                  return (
                    <option
                      key={employee.id}
                      value={employeeName}
                    >
                      {employeeName} — {employee.position}
                    </option>
                  );
                })}
            </select>

            {activeEmployees.filter(
              (employee) =>
                !project.employees.includes(
                  getEmployeeName(employee)
                )
            ).length === 0 && (
              <p className="text-sm text-gray-500">
                All active employees are already assigned.
              </p>
            )}

            <button
              onClick={handleAssignEmployee}
              disabled={!selectedEmployeeName}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
            >
              Assign Employee
            </button>
          </div>
        </Modal>
      </div>
    </AppLayout>
  );
}