export type Project = {
  id: number;
  name: string;
  status: string;
  details: string;
  customer: string;
  startDate: string;
  dueDate: string;
  address: string;
  totalHours: number;
  employees: string[];
};

export const defaultProjects: Project[] = [
  {
    id: 1,
    name: "Office Remodel",
    status: "In Progress",
    details: "Assigned: Mike & James",
    customer: "Lucas Communications",
    startDate: "Aug 1, 2026",
    dueDate: "Sept 15, 2026",
    address: "456 Market Street",
    totalHours: 126.5,
    employees: [
      "Mike Johnson",
      "James Miller",
      "Sarah Davis",
      "Robert Smith",
    ],
  },
  {
    id: 2,
    name: "Warehouse Lighting Upgrade",
    status: "Scheduled",
    details: "Assigned: Crew A",
    customer: "Lucas Communications",
    startDate: "Aug 10, 2026",
    dueDate: "Oct 1, 2026",
    address: "800 Industrial Drive",
    totalHours: 48,
    employees: ["Mike Johnson", "James Miller"],
  },
  {
    id: 3,
    name: "Service Contract",
    status: "Completed",
    details: "",
    customer: "Lucas Communications",
    startDate: "Jan 1, 2026",
    dueDate: "Dec 31, 2026",
    address: "Multiple Locations",
    totalHours: 212,
    employees: ["Robert Smith"],
  },
];

const STORAGE_KEY = "jobclokr-projects";

export function loadProjects(): Project[] {
  if (typeof window === "undefined") {
    return defaultProjects;
  }

  const savedProjects = window.localStorage.getItem(STORAGE_KEY);

  if (!savedProjects) {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(defaultProjects)
    );

    return defaultProjects;
  }

  try {
    return JSON.parse(savedProjects) as Project[];
  } catch {
    return defaultProjects;
  }
}

export function saveProjects(projects: Project[]): void {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(projects)
  );
}