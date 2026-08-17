"use client";

import {
  useEffect,
  useState,
} from "react";
import {
  useParams,
  useRouter,
} from "next/navigation";

import AppLayout from "@/components/layout/AppLayout";
import { useToast } from "@/components/ui/ToastProvider";

type EmployeeRole =
  | "OWNER"
  | "OFFICE"
  | "FOREMAN"
  | "EMPLOYEE";

type Employee = {
  id: number;
  companyId: number;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  loginName: string | null;
  mustChangePassword: boolean;
  role: EmployeeRole;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

function formatRole(
  role: EmployeeRole
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

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();

  const [employee, setEmployee] =
    useState<Employee | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [loginName, setLoginName] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const employeeId =
    Array.isArray(params.id)
      ? params.id[0]
      : params.id;

  useEffect(() => {
    async function loadEmployee() {
      if (!employeeId) {
        return;
      }

      try {
        setLoading(true);

        const response =
          await fetch(
            `/api/employees/${employeeId}`,
            {
              cache: "no-store",
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Unable to load employee."
          );
        }

        const loadedEmployee =
          data as Employee;

        setEmployee(
          loadedEmployee
        );

        setLoginName(
          loadedEmployee.loginName ??
            ""
        );
      } catch (error) {
        console.error(
          "Employee load failed:",
          error
        );

        showToast(
          error instanceof Error
            ? error.message
            : "Unable to load employee.",
          "error"
        );
      } finally {
        setLoading(false);
      }
    }

    void loadEmployee();
  }, [
    employeeId,
    showToast,
  ]);

  async function handleSaveLogin() {
    if (!employeeId) {
      return;
    }

    const trimmedLoginName =
      loginName
        .trim()
        .toLowerCase();

    if (!trimmedLoginName) {
      showToast(
        "Please enter a login name.",
        "error"
      );

      return;
    }

    if (
      trimmedLoginName.length < 3
    ) {
      showToast(
        "Login name must be at least 3 characters.",
        "error"
      );

      return;
    }

    if (!password) {
      showToast(
        "Please enter a temporary password.",
        "error"
      );

      return;
    }

    if (password.length < 8) {
      showToast(
        "Password must be at least 8 characters.",
        "error"
      );

      return;
    }

    if (
      password !==
      confirmPassword
    ) {
      showToast(
        "Passwords do not match.",
        "error"
      );

      return;
    }

    try {
      setSaving(true);

      const response =
        await fetch(
          `/api/employees/${employeeId}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                loginName:
                  trimmedLoginName,
                password,
              }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to update employee login."
        );
      }

      const updatedEmployee =
        data as Employee;

      setEmployee(
        updatedEmployee
      );

      setLoginName(
        updatedEmployee.loginName ??
          ""
      );

      setPassword("");
      setConfirmPassword("");

      showToast(
        "Employee login updated successfully.",
        "success"
      );
    } catch (error) {
      console.error(
        "Employee login update failed:",
        error
      );

      showToast(
        error instanceof Error
          ? error.message
          : "Unable to update employee login.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        <button
          type="button"
          onClick={() =>
            router.push(
              "/employees"
            )
          }
          className="text-blue-600 hover:underline"
        >
          ← Back to Employees
        </button>

        {loading ? (
          <div className="rounded-xl bg-white p-8 shadow dark:bg-slate-900">
            <p className="text-slate-500 dark:text-slate-400">
              Loading employee...
            </p>
          </div>
        ) : !employee ? (
          <div className="rounded-xl bg-white p-8 shadow dark:bg-slate-900">
            <p className="text-slate-500 dark:text-slate-400">
              Employee not found.
            </p>
          </div>
        ) : (
          <>
            <div>
              <h1 className="text-4xl font-bold">
                {employee.firstName}{" "}
                {employee.lastName}
              </h1>

              <p className="mt-1 text-slate-500 dark:text-slate-400">
                Employee details and
                JobClokr account
                information.
              </p>
            </div>

            <section className="rounded-xl bg-white p-6 shadow dark:bg-slate-900">
              <h2 className="mb-5 text-xl font-semibold">
                Employee Information
              </h2>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Name
                  </p>

                  <p className="font-medium">
                    {
                      employee.firstName
                    }{" "}
                    {
                      employee.lastName
                    }
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Role
                  </p>

                  <p className="font-medium">
                    {formatRole(
                      employee.role
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Email
                  </p>

                  <p className="font-medium">
                    {employee.email ||
                      "—"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Phone
                  </p>

                  <p className="font-medium">
                    {employee.phone ||
                      "—"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Status
                  </p>

                  <p className="font-medium">
                    {employee.active
                      ? "Active"
                      : "Inactive"}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-xl bg-white p-6 shadow dark:bg-slate-900">
              <h2 className="text-xl font-semibold">
                Login Information
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Set or reset this
                employee&apos;s JobClokr
                login credentials.
              </p>

              <div className="mt-6 space-y-5">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Login Name
                  </label>

                  <input
                    type="text"
                    value={loginName}
                    disabled={saving}
                    onChange={(event) =>
                      setLoginName(
                        event.target
                          .value
                      )
                    }
                    className="w-full rounded-lg border p-3"
                    placeholder="Example: gio"
                    autoCapitalize="none"
                    autoCorrect="off"
                    autoComplete="off"
                  />

                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Login names are not
                    case-sensitive.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Temporary Password
                    </label>

                    <input
                      type="password"
                      value={password}
                      disabled={saving}
                      onChange={(
                        event
                      ) =>
                        setPassword(
                          event.target
                            .value
                        )
                      }
                      className="w-full rounded-lg border p-3"
                      placeholder="At least 8 characters"
                      autoComplete="new-password"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Confirm Password
                    </label>

                    <input
                      type="password"
                      value={
                        confirmPassword
                      }
                      disabled={saving}
                      onChange={(
                        event
                      ) =>
                        setConfirmPassword(
                          event.target
                            .value
                        )
                      }
                      className="w-full rounded-lg border p-3"
                      placeholder="Enter password again"
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-950">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Current login
                  </p>

                  <p className="font-medium">
                    {employee.loginName ||
                      "Not configured"}
                  </p>

                  <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                    Password status
                  </p>

                  <p className="font-medium">
                    {!employee.loginName
                      ? "No login configured"
                      : employee.mustChangePassword
                        ? "Temporary password"
                        : "Password active"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    void handleSaveLogin()
                  }
                  disabled={saving}
                  className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : employee.loginName
                      ? "Reset Login Password"
                      : "Create Employee Login"}
                </button>
              </div>
            </section>
          </>
        )}
      </div>
    </AppLayout>
  );
}