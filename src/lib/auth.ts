export type UserRole =
  | "Owner"
  | "Office"
  | "Employee";

export type DatabaseEmployeeRole =
  | "OWNER"
  | "OFFICE"
  | "FOREMAN"
  | "EMPLOYEE";

export type LoginEmployee = {
  id: number;
  companyId: number;
  firstName: string;
  lastName: string;
  role: DatabaseEmployeeRole;
  active: boolean;
};

export type AuthUser = {
  employeeId: number;
  companyId: number;
  name: string;
  role: UserRole;
};

const AUTH_STORAGE_KEY =
  "jobclokr-auth-user";

function getEmployeeName(
  employee: LoginEmployee
) {
  return `${employee.firstName} ${employee.lastName}`.trim();
}

function getRole(
  employee: LoginEmployee
): UserRole {
  if (employee.role === "OWNER") {
    return "Owner";
  }

  if (employee.role === "OFFICE") {
    return "Office";
  }

  // Foremen use the field/employee portal for now.
  return "Employee";
}

export function loadAuthUser():
  | AuthUser
  | null {
  if (typeof window === "undefined") {
    return null;
  }

  const savedUser =
    window.localStorage.getItem(
      AUTH_STORAGE_KEY
    );

  if (!savedUser) {
    return null;
  }

  try {
    const parsedUser =
      JSON.parse(savedUser) as
        Partial<AuthUser>;

    if (
      typeof parsedUser.employeeId !==
        "number" ||
      typeof parsedUser.companyId !==
        "number" ||
      typeof parsedUser.name !==
        "string" ||
      (
        parsedUser.role !== "Owner" &&
        parsedUser.role !== "Office" &&
        parsedUser.role !== "Employee"
      )
    ) {
      window.localStorage.removeItem(
        AUTH_STORAGE_KEY
      );

      return null;
    }

    return {
      employeeId:
        parsedUser.employeeId,

      companyId:
        parsedUser.companyId,

      name:
        parsedUser.name,

      role:
        parsedUser.role,
    };
  } catch {
    window.localStorage.removeItem(
      AUTH_STORAGE_KEY
    );

    return null;
  }
}

export function loginEmployee(
  employee: LoginEmployee
): AuthUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  if (!employee.active) {
    return null;
  }

  const authUser: AuthUser = {
    employeeId:
      employee.id,

    companyId:
      employee.companyId,

    name:
      getEmployeeName(employee),

    role:
      getRole(employee),
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

  window.localStorage.removeItem(
    AUTH_STORAGE_KEY
  );
}

export function isOfficeUser(
  user: AuthUser | null
) {
  return (
    user?.role === "Owner" ||
    user?.role === "Office"
  );
}