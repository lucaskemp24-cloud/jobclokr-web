import type { Project } from "@/lib/projects";

type ProjectDetailsProps = {
  project: Project;
};

function formatDate(dateValue: string) {
  if (!dateValue) {
    return "Not set";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ProjectDetails({
  project,
}: ProjectDetailsProps) {
  const projectIsClosed =
    project.status === "Closed";

  const details = [
    {
      label: "Customer",
      value: project.customer,
    },
    {
      label: "Status",
      value: project.status,
    },
    {
      label: "Address",
      value:
        project.address ||
        "No address added",
    },
    {
      label: "Start Date",
      value: formatDate(
        project.startDate
      ),
    },
    {
      label: "Due Date",
      value: formatDate(
        project.dueDate
      ),
    },
    {
      label: "Assigned Employees",
      value: String(
        project.employees.length
      ),
    },
  ];

  if (projectIsClosed) {
    details.push({
      label: "Closed Date",
      value: project.closedAt
        ? formatDate(project.closedAt)
        : "Not recorded",
    });
  }

  return (
    <section className="rounded-xl bg-white p-6 shadow dark:bg-slate-900">
      <div>
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
          Project Record
        </p>

        <h2 className="mt-1 text-2xl font-semibold">
          Project Details
        </h2>

        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Customer, location, dates, and project information.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {details.map((detail) => (
          <div
            key={detail.label}
            className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"
          >
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              {detail.label}
            </p>

            <p className="mt-2 font-semibold">
              {detail.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
          Project Description
        </p>

        <p className="mt-2 whitespace-pre-wrap leading-7 text-slate-700 dark:text-slate-300">
          {project.details ||
            "No project details have been added."}
        </p>
      </div>
    </section>
  );
}