"use client";
import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import Link from "next/link";
export default function CustomerDetailsPage()
 {
  const [activeTab, setActiveTab] = useState<
  "projects" | "documents" | "notes"
>("projects");
const [showProjectModal, setShowProjectModal] = useState(false);
const [projectName, setProjectName] = useState("");
const [projectStatus, setProjectStatus] = useState("Not Started");
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
{showProjectModal && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
      <h2 className="text-2xl font-semibold mb-4">New Project</h2>

      <input
        type="text"
        placeholder="Project Name"
        value={projectName}
        onChange={(e) => setProjectName(e.target.value)}
        className="w-full border rounded-lg p-3 mb-4"
      />

      <select
        value={projectStatus}
        onChange={(e) => setProjectStatus(e.target.value)}
        className="w-full border rounded-lg p-3 mb-6"
      >
        <option>Not Started</option>
        <option>In Progress</option>
        <option>Completed</option>
      </select>

      <div className="flex justify-end gap-3">
        <button
          onClick={() => setShowProjectModal(false)}
          className="px-4 py-2 border rounded-lg"
        >
          Cancel
        </button>

        <button
          onClick={() => setShowProjectModal(false)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          Save Project
        </button>
      </div>
    </div>
  </div>
)}
  <div className="space-y-3">

    <div className="border rounded-lg p-4 hover:bg-slate-50 cursor-pointer">
      <h3 className="font-semibold">Office Remodel</h3>
      <p className="text-gray-500 text-sm">
        Status: In Progress • Assigned: Mike & James
      </p>
    </div>

    <div className="border rounded-lg p-4 hover:bg-slate-50 cursor-pointer">
      <h3 className="font-semibold">Warehouse Lighting Upgrade</h3>
      <p className="text-gray-500 text-sm">
        Status: Scheduled • Assigned: Crew A
      </p>
    </div>

    <div className="border rounded-lg p-4 hover:bg-slate-50 cursor-pointer">
      <h3 className="font-semibold">Service Contract</h3>
      <p className="text-gray-500 text-sm">
        Status: Completed
      </p>
    </div>

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

</AppLayout>
);
}