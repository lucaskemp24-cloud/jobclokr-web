export type ProjectStatus =
  | "Not Started"
  | "Scheduled"
  | "In Progress"
  | "Completed"
  | "Closed";

export type Project = {
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

export function closeProject(
  projects: Project[],
  projectId: number
): Project[] {
  return projects.map((project) =>
    project.id === projectId
      ? {
          ...project,
          status: "Closed",
          closedAt: new Date().toISOString(),
        }
      : project
  );
}

export function reopenProject(
  projects: Project[],
  projectId: number
): Project[] {
  return projects.map((project) =>
    project.id === projectId
      ? {
          ...project,
          status: "In Progress",
          closedAt: "",
        }
      : project
  );
}