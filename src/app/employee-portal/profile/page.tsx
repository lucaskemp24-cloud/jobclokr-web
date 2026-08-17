"use client";

import {
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import EmployeeLayout from "@/components/layout/EmployeeLayout";
import { useToast } from "@/components/ui/ToastProvider";

type SessionUser = {
  employeeId: number;
  companyId: number;
  name: string;
  role:
    | "Owner"
    | "Office"
    | "Employee";
};

type SessionResponse = {
  authenticated: boolean;
  user: SessionUser | null;
};

type Employee = {
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
};

function formatRole(
  role: Employee["role"]
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

export default function EmployeeProfilePage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [
    employee,
    setEmployee,
  ] =
    useState<Employee | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);

        const sessionResponse =
          await fetch(
            "/api/session",
            {
              cache: "no-store",
            }
          );

        const sessionData =
          (await sessionResponse.json()) as
            SessionResponse;

        if (
          !sessionResponse.ok ||
          !sessionData.authenticated ||
          !sessionData.user
        ) {
          router.replace(
            "/login"
          );

          return;
        }

        if (
          sessionData.user.role ===
            "Owner" ||
          sessionData.user.role ===
            "Office"
        ) {
          router.replace("/");

          return;
        }

        const employeesResponse =
          await fetch(
            "/api/employees",
            {
              cache: "no-store",
            }
          );

        const employeesData =
          await employeesResponse.json();

        if (!employeesResponse.ok) {
          throw new Error(
            employeesData.error ||
              "Unable to load employee profile."
          );
        }

        const matchingEmployee =
          (
            Array.isArray(
              employeesData
            )
              ? employeesData
              : []
          ).find(
            (
              savedEmployee: Employee
            ) =>
              savedEmployee.id ===
              sessionData.user
                ?.employeeId
          );

        if (!matchingEmployee) {
          throw new Error(
            "Your employee profile could not be found."
          );
        }

        setEmployee(
          matchingEmployee
        );
      } catch (error) {
        console.error(
          "Employee profile load failed:",
          error
        );

        showToast(
          error instanceof Error
            ? error.message
            : "Unable to load your profile.",
          "error"
        );
      } finally {
        setLoading(false);
      }
    }

    void loadProfile();
  }, [
    router,
    showToast,
  ]);

  if (loading) {
    return (
      <EmployeeLayout>
        <div className="mx-auto flex min-h-[65vh] max-w-xl items-center justify-center">
          <div className="w-full rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-blue-600 border-r-transparent" />

            <p className="mt-4 text-slate-500 dark:text-slate-400">
              Loading profile...
            </p>
          </div>
        </div>
      </EmployeeLayout>
    );
  }

  if (!employee) {
    return (
      <EmployeeLayout>
        <div className="mx-auto max-w-xl">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
            Unable to load your employee profile.
          </div>
        </div>
      </EmployeeLayout>
    );
  }

  const fullName =
    `${employee.firstName} ${employee.lastName}`.trim();

  const initials =
    `${employee.firstName.charAt(
      0
    )}${employee.lastName.charAt(
      0
    )}`.toUpperCase();

  return (
    <EmployeeLayout>
      <div className="mx-auto w-full max-w-xl space-y-5 pb-24 sm:pb-8">
        <button
          type="button"
          onClick={() =>
            router.push(
              "/employee-portal"
            )
          }
          className="text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          ← Back to Employee Portal
        </button>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xl font-bold text-white">
              {initials}
            </div>

            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                Employee Profile
              </p>

              <h1 className="mt-1 truncate text-2xl font-bold">
                {fullName}
              </h1>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {formatRole(
                  employee.role
                )}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-xl font-bold">
            Personal Information
          </h2>

          <div className="mt-5 space-y-4">
            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Name
              </p>

              <p className="mt-1 font-medium">
                {fullName}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Role
              </p>

              <p className="mt-1 font-medium">
                {formatRole(
                  employee.role
                )}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Email
              </p>

              <p className="mt-1 break-words font-medium">
                {employee.email ||
                  "Not provided"}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Phone
              </p>

              <p className="mt-1 font-medium">
                {employee.phone ||
                  "Not provided"}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-xl font-bold">
            Account Status
          </h2>

          <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
            <div>
              <p className="font-medium">
                Employee Account
              </p>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Your JobClokr employee access.
              </p>
            </div>

            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                employee.active
                  ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
                  : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
              }`}
            >
              {employee.active
                ? "Active"
                : "Inactive"}
            </span>
          </div>
        </section>
      </div>
    </EmployeeLayout>
  );
}