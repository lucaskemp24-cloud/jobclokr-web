"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import Modal from "@/components/ui/Modal";

import {
  defaultProjects,
  loadProjects,
  saveProjects,
  type Project,
} from "@/lib/projects";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>(defaultProjects);
  const [projectsLoaded, setProjectsLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showProjectModal, setShowProjectModal] = useState(false);
const [projectName, setProjectName] = useState("");
const [projectCustomer, setProjectCustomer] = useState("");
const [projectStatus, setProjectStatus] = useState("Not Started");
const [projectAddress, setProjectAddress] = useState("");
const [projectStartDate, setProjectStartDate] = useState("");
const [projectDueDate, setProjectDueDate] = useState("");
const [editingProjectId, setEditingProjectId] =
  useState<number | null>(null);

  useEffect(() => {
    setProjects(loadProjects());
    setProjectsLoaded(true);
  }, []);

  useEffect(() => {
    if (projectsLoaded) {
      saveProjects(projects);
    }
  }, [projects, projectsLoaded]);

  const filteredProjects = projects.filter((project) => {
    const search = searchTerm.toLowerCase();

    return (
      project.name.toLowerCase().includes(search) ||
      project.customer.toLowerCase().includes(search) ||
      project.status.toLowerCase().includes(search)
    );
  });

  return (
    <AppLayout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Projects</h1>

        <button
  onClick={() => setShowProjectModal(true)}
  className="bg-blue-600 text-white px-5 py-3 rounded-lg hover:bg-blue-700"
>
  + New Project
</button>
      </div>

      <input
        type="text"
        placeholder="Search projects..."
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
        className="w-full p-3 rounded-lg border mb-8"
      />

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-200">
            <tr>
              <th className="text-left p-4">Project</th>
              <th className="text-left p-4">Customer</th>
              <th className="text-left p-4">Status</th>
              <th className="text-left p-4">Employees</th>
              <th className="text-left p-4">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredProjects.map((project) => (
              <tr key={project.id} className="border-t">
                <td className="p-4">
                  <Link
                    href={`/customers/1/projects/${project.id}`}
                    className="text-blue-600 font-medium hover:underline"
                  >
                    {project.name}
                  </Link>
                </td>

                <td className="p-4">{project.customer}</td>
                <td className="p-4">{project.status}</td>
                <td className="p-4">{project.employees.length}</td>
                <td className="p-4">
  <button
    onClick={() => {
      setEditingProjectId(project.id);
      setProjectName(project.name);
      setProjectCustomer(project.customer);
      setProjectStatus(project.status);
      setProjectAddress(project.address);
      setProjectStartDate(project.startDate);
      setProjectDueDate(project.dueDate);
      setShowProjectModal(true);
    }}
    className="text-blue-600 hover:underline mr-4"
  >
    Edit
  </button>

  <button
    onClick={() => {
      if (window.confirm(`Delete "${project.name}"?`)) {
        setProjects(
          projects.filter(
            (savedProject) => savedProject.id !== project.id
          )
        );
      }
    }}
    className="text-red-600 hover:underline"
  >
    Delete
  </button>
</td>
              </tr>
            ))}

            {filteredProjects.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="p-6 text-center text-gray-500"
                >
                  No projects found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
<Modal
  isOpen={showProjectModal}
  onClose={() => {
  setShowProjectModal(false);
  setEditingProjectId(null);
}}
  title={editingProjectId !== null ? "Edit Project" : "New Project"}
>
  <div className="space-y-4">
    <input
      type="text"
      placeholder="Project Name"
      value={projectName}
      onChange={(event) => setProjectName(event.target.value)}
      className="w-full border rounded-lg p-3"
    />

    <input
      type="text"
      placeholder="Customer"
      value={projectCustomer}
      onChange={(event) => setProjectCustomer(event.target.value)}
      className="w-full border rounded-lg p-3"
    />

    <select
      value={projectStatus}
      onChange={(event) => setProjectStatus(event.target.value)}
      className="w-full border rounded-lg p-3"
    >
      <option>Not Started</option>
      <option>Scheduled</option>
      <option>In Progress</option>
      <option>Completed</option>
    </select>

    <input
      type="text"
      placeholder="Project Address"
      value={projectAddress}
      onChange={(event) => setProjectAddress(event.target.value)}
      className="w-full border rounded-lg p-3"
    />

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium mb-1">
          Start Date
        </label>

        <input
          type="date"
          value={projectStartDate}
          onChange={(event) => setProjectStartDate(event.target.value)}
          className="w-full border rounded-lg p-3"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Due Date
        </label>

        <input
          type="date"
          value={projectDueDate}
          onChange={(event) => setProjectDueDate(event.target.value)}
          className="w-full border rounded-lg p-3"
        />
      </div>
    </div>

    <button
      onClick={() => {
        if (!projectName.trim() || !projectCustomer.trim()) {
          alert("Please enter a project name and customer.");
          return;
        }

        if (editingProjectId !== null) {
  setProjects(
    projects.map((project) =>
      project.id === editingProjectId
        ? {
            ...project,
            name: projectName.trim(),
            customer: projectCustomer.trim(),
            status: projectStatus,
            startDate: projectStartDate,
            dueDate: projectDueDate,
            address: projectAddress.trim(),
          }
        : project
    )
  );
} else {
  setProjects([
    ...projects,
    {
      id: Date.now(),
      name: projectName.trim(),
      customer: projectCustomer.trim(),
      status: projectStatus,
      details: "",
      startDate: projectStartDate,
      dueDate: projectDueDate,
      address: projectAddress.trim(),
      totalHours: 0,
      employees: [],
    },
  ]);
}

        setProjectName("");
        setProjectCustomer("");
        setProjectStatus("Not Started");
        setProjectAddress("");
        setProjectStartDate("");
        setProjectDueDate("");
        setEditingProjectId(null);
        setShowProjectModal(false);
      }}
      className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
    >
      {editingProjectId !== null ? "Update Project" : "Save Project"}
    </button>
  </div>
</Modal>
    </AppLayout>
  );
}