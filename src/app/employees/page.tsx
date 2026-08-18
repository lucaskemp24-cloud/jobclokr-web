"use client";

import Link from "next/link";
import {
  useEffect,
  useState,
} from "react";

import AppLayout from "@/components/layout/AppLayout";

import {
  loadAuthUser,
} from "@/lib/auth";

type DatabaseEmployee = {
  id: number;
  companyId: number;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;

  role:
    | "OWNER"
    | "OFFICE"
    | "FOREMAN"
    | "EMPLOYEE";

  active: boolean;

  isPlatformAdmin: boolean;

  createdAt: string;
  updatedAt: string;
};

export default function EmployeesPage() {
  const [
    employees,
    setEmployees,
  ] = useState<
    DatabaseEmployee[]
  >([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    loadError,
    setLoadError,
  ] = useState("");

  const [
    canAddEmployees,
    setCanAddEmployees,
  ] = useState(false);

  useEffect(() => {
    async function loadEmployees() {
      try {
        setLoading(true);
        setLoadError("");

        const response =
          await fetch(
            "/api/employees",
            {
              cache:
                "no-store",
            }
          );

        if (!response.ok) {
          throw new Error(
            "Unable to load employees."
          );
        }

        const data =
          await response.json();

        const loadedEmployees:
          DatabaseEmployee[] =
          Array.isArray(data)
            ? data
            : [];

        setEmployees(
          loadedEmployees
        );

        const authUser =
          loadAuthUser();

        if (!authUser) {
          setCanAddEmployees(
            false
          );

          return;
        }

        const currentEmployee =
          loadedEmployees.find(
            (employee) =>
              employee.id ===
              authUser.employeeId
          );

        setCanAddEmployees(
          currentEmployee
            ?.isPlatformAdmin ===
            true
        );
      } catch (error) {
        console.error(
          "Employees database load failed:",
          error
        );

        setLoadError(
          "Unable to load employees."
        );

        setCanAddEmployees(
          false
        );
      } finally {
        setLoading(false);
      }
    }

    void loadEmployees();
  }, []);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              Employees
            </h1>

            <p className="mt-1 text-slate-500 dark:text-slate-400">
              View employees, roles,
              and account status.
            </p>
          </div>

          {canAddEmployees && (
            <Link
              href="/employees/new"
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700"
            >
              + New Employee
            </Link>
          )}
        </div>

        <div className="overflow-hidden rounded-xl bg-white shadow dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px]">
              <thead className="bg-slate-200 dark:bg-slate-800">
                <tr>
                  <th className="p-4 text-left">
                    Name
                  </th>

                  <th className="p-4 text-left">
                    Role
                  </th>

                  <th className="p-4 text-left">
                    Phone
                  </th>

                  <th className="p-4 text-left">
                    Email
                  </th>

                  <th className="p-4 text-left">
                    Status
                  </th>

                  <th className="p-4 text-left">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-8 text-center text-slate-500 dark:text-slate-400"
                    >
                      Loading employees...
                    </td>
                  </tr>
                ) : loadError ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-8 text-center text-red-600"
                    >
                      {loadError}
                    </td>
                  </tr>
                ) : employees.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-8 text-center text-slate-500 dark:text-slate-400"
                    >
                      {canAddEmployees
                        ? 'No employees yet. Click "+ New Employee" to add the first employee.'
                        : "No employees are available."}
                    </td>
                  </tr>
                ) : (
                  employees.map(
                    (employee) => (
                      <tr
                        key={
                          employee.id
                        }
                        className="border-t border-slate-200 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"
                      >
                        <td className="p-4">
                          <Link
                            href={`/employees/${employee.id}`}
                            className="font-semibold text-blue-600 hover:underline"
                          >
                            {
                              employee.firstName
                            }{" "}
                            {
                              employee.lastName
                            }
                          </Link>
                        </td>

                        <td className="p-4">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium dark:bg-slate-800">
                            {formatEmployeeRole(
                              employee.role
                            )}
                          </span>
                        </td>

                        <td className="p-4">
                          {employee.phone ||
                            "—"}
                        </td>

                        <td className="p-4">
                          {employee.email ||
                            "—"}
                        </td>

                        <td className="p-4">
                          <span
                            className={
                              employee.active
                                ? "rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700 dark:bg-green-950 dark:text-green-300"
                                : "rounded-full bg-slate-200 px-3 py-1 text-sm font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                            }
                          >
                            {employee.active
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </td>

                        <td className="p-4">
                          <Link
                            href={`/employees/${employee.id}`}
                            className="text-blue-600 hover:underline"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    )
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>

        {!loading &&
          !canAddEmployees && (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              New employee accounts are created by JobClokr administration.
            </p>
          )}
      </div>
    </AppLayout>
  );
}

function formatEmployeeRole(
  role: string
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