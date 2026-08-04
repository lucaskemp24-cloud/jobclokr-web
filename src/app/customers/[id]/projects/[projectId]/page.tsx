"use client";

import AppLayout from "@/components/layout/AppLayout";
import Link from "next/link";
import { useParams } from "next/navigation";

const projects = [
  {
    id: "1",
    name: "Office Remodel",
    customer: "Lucas Communications",
    status: "In Progress",
    startDate: "Aug 1, 2026",
    dueDate: "Sept 15, 2026",
    address: "456 Market Street",
    totalHours: 126.5,
    employees: ["Mike Johnson", "James Miller", "Sarah Davis", "Robert Smith"],
  },
  {
    id: "2",
    name: "Warehouse Lighting Upgrade",
    customer: "Lucas Communications",
    status: "Scheduled",
    startDate: "Aug 10, 2026",
    dueDate: "Oct 1, 2026",
    address: "800 Industrial Drive",
    totalHours: 48,
    employees: ["Mike Johnson", "James Miller"],
  },
  {
    id: "3",
    name: "Service Contract",
    customer: "Lucas Communications",
    status: "Completed",
    startDate: "Jan 1, 2026",
    dueDate: "Dec 31, 2026",
    address: "Multiple Locations",
    totalHours: 212,
    employees: ["Robert Smith"],
  },
];

export default function ProjectDetailsPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const project = projects.find(
    (savedProject) => savedProject.id === projectId
  );

  if (!project) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Link
            href="/customers/1"
            className="text-blue-600 hover:underline"
          >
            ← Back to Customer
          </Link>

          <div className="bg-white rounded-xl shadow p-6">
            <h1 className="text-3xl font-bold">Project not found</h1>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <Link
          href="/customers/1"
          className="text-blue-600 hover:underline"
        >
          ← Back to Customer
        </Link>

        <div>
          <h1 className="text-4xl font-bold">{project.name}</h1>
          <p className="text-gray-500">{project.customer}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-2xl font-semibold mb-4">
              Project Information
            </h2>

            <p>
              <strong>Status:</strong> {project.status}
            </p>
            <p>
              <strong>Start Date:</strong> {project.startDate}
            </p>
            <p>
              <strong>Due Date:</strong> {project.dueDate}
            </p>
            <p>
              <strong>Address:</strong> {project.address}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-2xl font-semibold mb-4">
              Job Summary
            </h2>

            <p>Total Hours: {project.totalHours}</p>
            <p>Employees: {project.employees.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">
            Assigned Employees
          </h2>

          <ul className="space-y-2">
            {project.employees.map((employee) => (
              <li key={employee}>{employee}</li>
            ))}
          </ul>
        </div>
      </div>
    </AppLayout>
  );
}