"use client";
import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import AppLayout from "@/components/layout/AppLayout";
import Link from "next/link";
import { loadProjects, saveProjects } from "@/lib/projects";
export default function CustomerDetailsPage()
 {
  const [activeTab, setActiveTab] = useState<
  "projects" | "documents" | "notes"
>("projects");
const [showProjectModal, setShowProjectModal] = useState(false);
const [projectName, setProjectName] = useState("");
const [projectStatus, setProjectStatus] = useState("Not Started");
const [projects, setProjects] = useState(loadProjects());
const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
useEffect(() => {
  saveProjects(projects);
}, [projects]);
  return (
    <AppLayout>
     
  <Link
    href="/customers"
    className="text-blue-600 hover:underline inline-block mb-4"
  >
    ← Back to Customers
  </Link>
<div className="flex gap-3 mb-6">
  <button
    onClick={() => setActiveTab("projects")}
    className={`px-4 py-2 rounded-lg ${
      activeTab === "projects"
        ? "bg-blue-600 text-white"
        : "bg-white border hover:bg-slate-50"
    }`}
  >
    Projects
  </button>

  <button
    onClick={() => setActiveTab("documents")}
    className={`px-4 py-2 rounded-lg ${
      activeTab === "documents"
        ? "bg-blue-600 text-white"
        : "bg-white border hover:bg-slate-50"
    }`}
  >
    Documents
  </button>

  <button
    onClick={() => setActiveTab("notes")}
    className={`px-4 py-2 rounded-lg ${
      activeTab === "notes"
        ? "bg-blue-600 text-white"
        : "bg-white border hover:bg-slate-50"
    }`}
  >
    Notes
  </button>
</div>
  {activeTab === "projects" && (
<div className="space-y-8">

        <div>
          <h1 className="text-4xl font-bold">
            Lucas Communications
          </h1>

          <p className="text-gray-500">
            Customer Profile
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6">

          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-semibold mb-4">
              Contact Information
            </h2>

            <p><strong>Contact:</strong> Lucas Kemp</p>
            <p><strong>Phone:</strong> (555) 555-0101</p>
            <p><strong>Email:</strong> lucas@example.com</p>
            <p><strong>Address:</strong> 123 Main St</p>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-semibold mb-4">
              Customer Stats
            </h2>

            <p>Total Projects: 12</p>
            <p>Active Projects: 4</p>
            <p>Total Revenue: $248,000</p>
          </div>

        </div>

        <div className="bg-white rounded-xl shadow p-6">
  <div className="flex justify-between items-center mb-4">
    <h2 className="text-2xl font-semibold">Projects</h2>

    <button
  onClick={() => setShowProjectModal(true)}
  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
>
  + New Project
</button>
  </div>

 <div className="space-y-3">
  {projects.map((project) => (
  <div
  key={project.id}
  className="border rounded-lg p-4 hover:bg-slate-50"
>
  <div className="flex items-start justify-between">
    <div>
      <Link
  href={`/customers/1/projects/${project.id}`}
  className="font-semibold text-blue-600 hover:underline"
>
  {project.name}
</Link>

      <p className="text-gray-500 text-sm">
        Status: {project.status}
        {project.details && ` • ${project.details}`}
      </p>
    </div>
<button
  onClick={() => {
    setEditingProjectId(project.id);
    setProjectName(project.name);
    setProjectStatus(project.status);
    setShowProjectModal(true);
  }}
  className="text-blue-600 hover:text-blue-800 font-medium mr-4"
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
      className="text-red-600 hover:text-red-800 font-medium"
    >
      
      Delete
    </button>
  </div>
</div>
  ))}
</div>
</div>
</div>
)}

{activeTab === "documents" && (
  <div className="bg-white rounded-xl shadow p-6">
    <h2 className="text-2xl font-semibold mb-4">Documents</h2>
    <p className="text-gray-500">
      No documents have been uploaded yet.
    </p>
  </div>
)}

{activeTab === "notes" && (
  <div className="bg-white rounded-xl shadow p-6">
    <h2 className="text-2xl font-semibold mb-4">Notes</h2>
    <p className="text-gray-500">
      No notes have been added yet.
    </p>
  </div>
)}
<Modal
  isOpen={showProjectModal}
  onClose={() => setShowProjectModal(false)}
  title={editingProjectId ? "Edit Project" : "New Project"}
>
  <div className="space-y-4">
    <input
      type="text"
      placeholder="Project Name"
      value={projectName}
      onChange={(e) => setProjectName(e.target.value)}
      className="w-full border rounded-lg p-3"
    />

    <select
      value={projectStatus}
      onChange={(e) => setProjectStatus(e.target.value)}
      className="w-full border rounded-lg p-3"
    >
      <option>Not Started</option>
      <option>In Progress</option>
      <option>Completed</option>
    </select>

    <button
      onClick={() => {
  if (!projectName.trim()) {
    alert("Please enter a project name.");
    return;
  }

  if (editingProjectId !== null) {
  setProjects(
    projects.map((project) =>
      project.id === editingProjectId
        ? {
            ...project,
            name: projectName,
            status: projectStatus,
          }
        : project
    )
  );
} else {
  setProjects([
    ...projects,
   {
  id: Date.now(),
  name: projectName,
  status: projectStatus,
  details: "",
  customer: "Lucas Communications",
  startDate: "",
  dueDate: "",
  address: "",
  totalHours: 0,
  employees: [],
},
  ]);
}

  setProjectName("");
  setProjectStatus("Not Started");
  setEditingProjectId(null);
  setShowProjectModal(false);
}}
      className="bg-blue-600 text-white px-4 py-3 rounded-lg w-full"
    >
      {editingProjectId !== null ? "Update Project" : "Save Project"}
    </button>
  </div>
</Modal>
</AppLayout>
);
}