export type Employee = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  status: "Active" | "Inactive";
};

const EMPLOYEE_STORAGE_KEY = "jobclokr-employees";

export const defaultEmployees: Employee[] = [
  {
    id: 1,
    firstName: "Lucas",
    lastName: "Kemp",
    email: "lucas@example.com",
    phone: "(555) 555-0101",
    position: "Owner",
    status: "Active",
  },
  {
    id: 2,
    firstName: "Mike",
    lastName: "Johnson",
    email: "mike@example.com",
    phone: "(555) 555-0102",
    position: "Technician",
    status: "Active",
  },
  {
    id: 3,
    firstName: "James",
    lastName: "Miller",
    email: "james@example.com",
    phone: "(555) 555-0103",
    position: "Technician",
    status: "Active",
  },
  {
    id: 4,
    firstName: "Sarah",
    lastName: "Davis",
    email: "sarah@example.com",
    phone: "(555) 555-0104",
    position: "Office",
    status: "Active",
  },
  {
    id: 5,
    firstName: "Robert",
    lastName: "Smith",
    email: "robert@example.com",
    phone: "(555) 555-0105",
    position: "Apprentice",
    status: "Active",
  },
];

export function getEmployeeName(employee: Employee) {
  return `${employee.firstName} ${employee.lastName}`;
}

export function loadEmployees(): Employee[] {
  if (typeof window === "undefined") {
    return defaultEmployees;
  }

  const savedEmployees = window.localStorage.getItem(
    EMPLOYEE_STORAGE_KEY
  );

  if (!savedEmployees) {
    return defaultEmployees;
  }

  try {
    return JSON.parse(savedEmployees) as Employee[];
  } catch {
    return defaultEmployees;
  }
}

export function saveEmployees(employees: Employee[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    EMPLOYEE_STORAGE_KEY,
    JSON.stringify(employees)
  );
}