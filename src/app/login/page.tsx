"use client";

import {
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import { useToast } from "@/components/ui/ToastProvider";

import {
  loginEmployee,
  loadAuthUser,
  type DatabaseEmployeeRole,
  type LoginEmployee,
} from "@/lib/auth";

type DatabaseEmployee = LoginEmployee & {
  companyId: number;
  email: string | null;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
};

function getEmployeeName(
  employee: DatabaseEmployee
) {
  return `${employee.firstName} ${employee.lastName}`.trim();
}

function formatRole(
  role: DatabaseEmployeeRole
) {
  if (role === "OWNER") {
    return "Owner";
  }

  if (role === "OFFICE") {
    return "Office";
  }

  if (role === "FOREMAN") {
    return "Foreman";
  }

  return "Employee";
}

export default function LoginPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [employees, setEmployees] =
    useState<DatabaseEmployee[]>([]);

  const [
    selectedEmployeeId,
    setSelectedEmployeeId,
  ] = useState("");

  const [loading, setLoading] =
    useState(true);

  const [signingIn, setSigningIn] =
    useState(false);

  useEffect(() => {
    const user =
      loadAuthUser();

    if (user) {
      if (user.role === "Employee") {
        router.replace(
          "/employee-portal"
        );
      } else {
        router.replace("/");
      }

      return;
    }

    async function loadLoginEmployees() {
      try {
        setLoading(true);

        const response =
          await fetch(
            "/api/employees",
            {
              cache: "no-store",
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Unable to load employees."
          );
        }

        const activeEmployees =
          (
            Array.isArray(data)
              ? data
              : []
          ).filter(
            (
              employee: DatabaseEmployee
            ) => employee.active
          );

        setEmployees(
          activeEmployees
        );
      } catch (error) {
        console.error(
          "Login employee load failed:",
          error
        );

        showToast(
          error instanceof Error
            ? error.message
            : "Unable to load employees.",
          "error"
        );
      } finally {
        setLoading(false);
      }
    }

    void loadLoginEmployees();
  }, [router, showToast]);

  function handleLogin() {
    const employeeId =
      Number(selectedEmployeeId);

    if (
      !Number.isInteger(employeeId) ||
      employeeId <= 0
    ) {
      showToast(
        "Select an employee.",
        "error"
      );

      return;
    }

    const employee =
      employees.find(
        (savedEmployee) =>
          savedEmployee.id ===
          employeeId
      );

    if (!employee) {
      showToast(
        "Unable to find that employee.",
        "error"
      );

      return;
    }

    try {
      setSigningIn(true);

      const user =
        loginEmployee(employee);

      if (!user) {
        showToast(
          "Unable to sign in.",
          "error"
        );

        return;
      }

      if (
        user.role === "Employee"
      ) {
        router.push(
          "/employee-portal"
        );
      } else {
        router.push("/");
      }
    } finally {
      setSigningIn(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 dark:bg-slate-950">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg dark:bg-slate-900">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">
            JobClokr
          </h1>

          <p className="mt-2 text-slate-500 dark:text-slate-400">
            Sign in
          </p>
        </div>

        {loading ? (
          <div className="py-8 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-r-transparent" />

            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
              Loading employees...
            </p>
          </div>
        ) : (
          <>
            <label className="mb-2 block font-medium">
              Employee
            </label>

            <select
              value={
                selectedEmployeeId
              }
              onChange={(event) =>
                setSelectedEmployeeId(
                  event.target.value
                )
              }
              className="mb-6 w-full rounded-lg border p-3 dark:bg-slate-950"
            >
              <option value="">
                Select employee
              </option>

              {employees.map(
                (employee) => (
                  <option
                    key={
                      employee.id
                    }
                    value={
                      employee.id
                    }
                  >
                    {getEmployeeName(
                      employee
                    )}{" "}
                    —{" "}
                    {formatRole(
                      employee.role
                    )}
                  </option>
                )
              )}
            </select>

            {employees.length ===
              0 && (
              <p className="-mt-3 mb-6 text-sm text-slate-500 dark:text-slate-400">
                No active employees are available.
              </p>
            )}

            <button
              type="button"
              onClick={
                handleLogin
              }
              disabled={
                signingIn ||
                employees.length === 0
              }
              className="w-full rounded-lg bg-blue-600 p-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {signingIn
                ? "Signing In..."
                : "Sign In"}
            </button>
          </>
        )}

        <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
          Development sign-in uses your PostgreSQL employee records.
        </p>
      </div>
    </main>
  );
}