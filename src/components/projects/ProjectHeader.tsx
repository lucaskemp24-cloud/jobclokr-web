import Link from "next/link";

import ProjectReportButton from "@/components/reports/ProjectReportButton";
import type { Project } from "@/lib/projects";

type ProjectHeaderProps = {
  project: Project;
};

function getStatusClasses(status: string) {
  if (status === "Closed") {
    return "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200";
  }

  if (status === "Completed") {
    return "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300";
  }

  if (status === "In Progress") {
    return "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300";
  }

  if (status === "Scheduled") {
    return "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300";
  }

  return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
}

export default function ProjectHeader({
  project,
}: ProjectHeaderProps) {
  const projectIsClosed =
    project.status === "Closed";

  return (
    <header className="space-y-5">
      <div className="flex flex-wrap gap-4">
        <Link
          href={`/customers/${project.customerId}`}
          className="text-blue-600 hover:underline"
        >
          ← Back to {project.customer}
        </Link>

        <Link
          href="/projects"
          className="text-blue-600 hover:underline"
        >
          View All Projects
        </Link>
      </div>

      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Project
          </p>

          <h1 className="mt-1 text-4xl font-bold tracking-tight">
            {project.name}
          </h1>

          <p className="mt-2 text-slate-500 dark:text-slate-400">
            {project.customer}
          </p>

          {project.address && (
            <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              📍 {project.address}
            </p>
          )}
        </div>

        <div className="flex flex-col items-start gap-3 sm:items-end">
          <span
            className={`inline-flex w-fit rounded-full px-4 py-2 text-sm font-semibold ${getStatusClasses(
              project.status
            )}`}
          >
            {project.status}
          </span>

          <ProjectReportButton
            project={project}
          />
        </div>
      </div>

      {projectIsClosed && (
        <div className="rounded-xl border border-slate-300 bg-slate-100 p-4 dark:border-slate-700 dark:bg-slate-800">
          <p className="font-semibold">
            Archived Project
          </p>

          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            This project is closed. Labor, materials,
            photos, notes, employees, and project history
            remain available. Reopen the project before
            changing assignments.
          </p>
        </div>
      )}
    </header>
  );
}