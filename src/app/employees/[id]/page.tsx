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

type SessionUser = {
  accountType:
    | "COMPANY_USER"
    | "PLATFORM_ADMIN";

  employeeId:
    | number
    | null;

  companyId:
    | number
    | null;

  name: string;

  role:
    | "Owner"
    | "Office"
    | "Employee"
    | "PlatformAdmin";

  isPlatformAdmin: boolean;
};

type SessionResponse = {
  authenticated: boolean;
  user: SessionUser | null;
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

  const [
    savingProfile,
    setSavingProfile,
  ] =
    useState(false);

  const [
    savingLogin,
    setSavingLogin,
  ] =
    useState(false);

  const [
    canEdit,
    setCanEdit,
  ] =
    useState(false);

  const [
    firstName,
    setFirstName,
  ] =
    useState("");

  const [
    lastName,
    setLastName,
  ] =
    useState("");

  const [
    email,
    setEmail,
  ] =
    useState("");

  const [
    phone,
    setPhone,
  ] =
    useState("");

  const [
    loginName,
    setLoginName,
  ] =
    useState("");

  const [
    password,
    setPassword,
  ] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] =
    useState("");

  const employeeId =
    Array.isArray(params.id)
      ? params.id[0]
      : params.id;

  useEffect(() => {
    let cancelled = false;

    async function loadEmployee() {
      if (!employeeId) {
        return;
      }

      try {
        setLoading(true);

        const [
          sessionResponse,
          employeeResponse,
        ] =
          await Promise.all([
            fetch(
              "/api/session",
              {
                cache:
                  "no-store",
              }
            ),

            fetch(
              `/api/employees/${employeeId}`,
              {
                cache:
                  "no-store",
              }
            ),
          ]);

        const sessionData =
          (await sessionResponse.json()) as
            SessionResponse;

        const employeeData =
          await employeeResponse.json();

        if (cancelled) {
          return;
        }

        if (
          !sessionResponse.ok ||
          !sessionData.authenticated ||
          !sessionData.user
        ) {
          throw new Error(
            "Unable to verify your session."
          );
        }

        if (!employeeResponse.ok) {
          throw new Error(
            employeeData.error ||
              "Unable to load employee."
          );
        }

        const loadedEmployee =
          employeeData as Employee;

        setEmployee(
          loadedEmployee
        );

        setFirstName(
          loadedEmployee.firstName
        );

        setLastName(
          loadedEmployee.lastName
        );

        setEmail(
          loadedEmployee.email ??
            ""
        );

        setPhone(
          loadedEmployee.phone ??
            ""
        );

        setLoginName(
          loadedEmployee.loginName ??
            ""
        );

        setCanEdit(
          sessionData.user.accountType ===
            "COMPANY_USER" &&
            (
              sessionData.user.role ===
                "Owner" ||
              sessionData.user.role ===
                "Office"
            )
        );
      } catch (error) {
        console.error(
          "Employee load failed:",
          error
        );

        if (cancelled) {
          return;
        }

        showToast(
          error instanceof Error
            ? error.message
            : "Unable to load employee.",
          "error"
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadEmployee();

    return () => {
      cancelled = true;
    };
  }, [
    employeeId,
    showToast,
  ]);

  async function handleSaveProfile() {
    if (
      !employeeId ||
      !canEdit
    ) {
      return;
    }

    const trimmedFirstName =
      firstName.trim();

    const trimmedLastName =
      lastName.trim();

    if (!trimmedFirstName) {
      showToast(
        "Please enter a first name.",
        "error"
      );

      return;
    }

    if (!trimmedLastName) {
      showToast(
        "Please enter a last name.",
        "error"
      );

      return;
    }

    try {
      setSavingProfile(
        true
      );

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
                firstName:
                  trimmedFirstName,

                lastName:
                  trimmedLastName,

                email:
                  email.trim(),

                phone:
                  phone.trim(),
              }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to update employee."
        );
      }

      const updatedEmployee =
        data as Employee;

      setEmployee(
        updatedEmployee
      );

      setFirstName(
        updatedEmployee.firstName
      );

      setLastName(
        updatedEmployee.lastName
      );

      setEmail(
        updatedEmployee.email ??
          ""
      );

      setPhone(
        updatedEmployee.phone ??
          ""
      );

      showToast(
        "Employee information updated successfully.",
        "success"
      );
    } catch (error) {
      console.error(
        "Employee profile update failed:",
        error
      );

      showToast(
        error instanceof Error
          ? error.message
          : "Unable to update employee.",
        "error"
      );
    } finally {
      setSavingProfile(
        false
      );
    }
  }

  async function handleSaveLogin() {
    if (
      !employeeId ||
      !canEdit
    ) {
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
      trimmedLoginName.length <
      3
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

    if (
      password.length < 8
    ) {
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
      setSavingLogin(
        true
      );

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
      setSavingLogin(
        false
      );
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
              <div className="mb-5 flex items-center justify-between gap-4">
                <h2 className="text-xl font-semibold">
                  Employee Information
                </h2>

                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium dark:bg-slate-800">
                  {formatRole(
                    employee.role
                  )}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    First Name
                  </label>

                  <input
                    type="text"
                    value={firstName}
                    disabled={
                      !canEdit ||
                      savingProfile
                    }
                    onChange={(event) =>
                      setFirstName(
                        event.target
                          .value
                      )
                    }
                    className="w-full rounded-lg border border-slate-300 p-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:border-blue-500 dark:focus:ring-blue-950 dark:disabled:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Last Name
                  </label>

                  <input
                    type="text"
                    value={lastName}
                    disabled={
                      !canEdit ||
                      savingProfile
                    }
                    onChange={(event) =>
                      setLastName(
                        event.target
                          .value
                      )
                    }
                    className="w-full rounded-lg border border-slate-300 p-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:border-blue-500 dark:focus:ring-blue-950 dark:disabled:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Email
                  </label>

                  <input
                    type="email"
                    value={email}
                    disabled={
                      !canEdit ||
                      savingProfile
                    }
                    onChange={(event) =>
                      setEmail(
                        event.target
                          .value
                      )
                    }
                    className="w-full rounded-lg border border-slate-300 p-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:border-blue-500 dark:focus:ring-blue-950 dark:disabled:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Phone
                  </label>

                  <input
                    type="tel"
                    value={phone}
                    disabled={
                      !canEdit ||
                      savingProfile
                    }
                    onChange={(event) =>
                      setPhone(
                        event.target
                          .value
                      )
                    }
                    className="w-full rounded-lg border border-slate-300 p-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:border-blue-500 dark:focus:ring-blue-950 dark:disabled:bg-slate-800"
                  />
                </div>

                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Status
                  </p>

                  <p className="mt-2 font-medium">
                    {employee.active
                      ? "Active"
                      : "Inactive"}
                  </p>
                </div>
              </div>

              {canEdit && (
                <button
                  type="button"
                  onClick={() =>
                    void handleSaveProfile()
                  }
                  disabled={
                    savingProfile
                  }
                  className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingProfile
                    ? "Saving..."
                    : "Save Employee Information"}
                </button>
              )}
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
                    disabled={
                      !canEdit ||
                      savingLogin
                    }
                    onChange={(event) =>
                      setLoginName(
                        event.target
                          .value
                      )
                    }
                    className="w-full rounded-lg border border-slate-300 p-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:border-blue-500 dark:focus:ring-blue-950 dark:disabled:bg-slate-800"
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
                      disabled={
                        !canEdit ||
                        savingLogin
                      }
                      onChange={(event) =>
                        setPassword(
                          event.target
                            .value
                        )
                      }
                      className="w-full rounded-lg border border-slate-300 p-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:border-blue-500 dark:focus:ring-blue-950 dark:disabled:bg-slate-800"
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
                      disabled={
                        !canEdit ||
                        savingLogin
                      }
                      onChange={(event) =>
                        setConfirmPassword(
                          event.target
                            .value
                        )
                      }
                      className="w-full rounded-lg border border-slate-300 p-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:border-blue-500 dark:focus:ring-blue-950 dark:disabled:bg-slate-800"
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

                {canEdit && (
                  <button
                    type="button"
                    onClick={() =>
                      void handleSaveLogin()
                    }
                    disabled={
                      savingLogin
                    }
                    className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {savingLogin
                      ? "Saving..."
                      : employee.loginName
                        ? "Reset Login Password"
                        : "Create Employee Login"}
                  </button>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </AppLayout>
  );
}