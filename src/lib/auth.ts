import {
  getEmployeeName,
  loadEmployees,
  type Employee,
} from "@/lib/employees";

export type UserRole = "Owner" | "Office" | "Employee";

export type AuthUser = {
  employeeId: number;
  name: string;
  role: UserRole;
};

const AUTH_STORAGE_KEY = "jobclokr-auth-user";

function getRole(employee: Employee): UserRole {
  const position = employee.position.toLowerCase();

  if (position === "owner") {
    return "Owner";
  }

  if (position === "office") {
    return "Office";
  }

  return "Employee";
}

export function loadAuthUser(): AuthUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  const savedUser = window.localStorage.getItem(
    AUTH_STORAGE_KEY
  );

  if (!savedUser) {
    return null;
  }

  try {
    return JSON.parse(savedUser) as AuthUser;
  } catch {
    return null;
  }
}

export function loginEmployee(
  employeeId: number
): AuthUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  const employees = loadEmployees();

  const employee = employees.find(
    (savedEmployee) =>
      savedEmployee.id === employeeId &&
      savedEmployee.status === "Active"
  );

  if (!employee) {
    return null;
  }

  const authUser: AuthUser = {
    employeeId: employee.id,
    name: getEmployeeName(employee),
    role: getRole(employee),
  };

  window.localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify(authUser)
  );

  return authUser;
}

export function logoutUser() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function isOfficeUser(user: AuthUser | null) {
  return user?.role === "Owner" || user?.role === "Office";
}