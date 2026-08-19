"use client";

import {
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import {
  useRouter,
} from "next/navigation";

type PlatformAdmin = {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  loginName: string;
  active: boolean;
  mustChangePassword: boolean;
  createdAt: string;
  updatedAt: string;
};

type PlatformAdminSession = {
  accountType:
    "PLATFORM_ADMIN";

  adminId: number;

  employeeId:
    null;

  companyId:
    null;

  name: string;

  role:
    "PlatformAdmin";

  isPlatformAdmin:
    true;
};

type SessionResponse = {
  authenticated: boolean;

  user:
    | PlatformAdminSession
    | null;
};

type AdminForm = {
  firstName: string;
  lastName: string;
  email: string;
  loginName: string;
  password: string;
  confirmPassword: string;
};

const EMPTY_ADMIN_FORM:
  AdminForm = {
  firstName: "",
  lastName: "",
  email: "",
  loginName: "",
  password: "",
  confirmPassword: "",
};

export default function PlatformAccessPage() {
  const router =
    useRouter();

  const [
    sessionUser,
    setSessionUser,
  ] =
    useState<
      PlatformAdminSession | null
    >(null);

  const [
    admins,
    setAdmins,
  ] =
    useState<
      PlatformAdmin[]
    >([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    showAddForm,
    setShowAddForm,
  ] =
    useState(false);

  const [
    adminForm,
    setAdminForm,
  ] =
    useState<AdminForm>(
      EMPTY_ADMIN_FORM
    );

  const [
    savingAdmin,
    setSavingAdmin,
  ] =
    useState(false);

  const [
    adminError,
    setAdminError,
  ] =
    useState("");

  const [
    adminMessage,
    setAdminMessage,
  ] =
    useState("");

  useEffect(() => {
    let cancelled =
      false;

    async function loadPage() {
      try {
        setLoading(
          true
        );

        setError(
          ""
        );

        const sessionResponse =
          await fetch(
            "/api/session",
            {
              cache:
                "no-store",
            }
          );

        if (
          !sessionResponse.ok
        ) {
          router.replace(
            "/login"
          );

          return;
        }

        const sessionData =
          (await sessionResponse.json()) as
            SessionResponse;

        if (
          !sessionData.authenticated ||
          !sessionData.user ||
          sessionData.user.accountType !==
            "PLATFORM_ADMIN"
        ) {
          router.replace(
            "/login"
          );

          return;
        }

        const adminsResponse =
          await fetch(
            "/api/admin/platform-admins",
            {
              cache:
                "no-store",
            }
          );

        const adminsData =
          await adminsResponse.json();

        if (
          !adminsResponse.ok
        ) {
          throw new Error(
            typeof adminsData?.error ===
              "string"
              ? adminsData.error
              : "Unable to load platform administrators."
          );
        }

        if (
          cancelled
        ) {
          return;
        }

        setSessionUser(
          sessionData.user
        );

        setAdmins(
          Array.isArray(
            adminsData
          )
            ? adminsData
            : []
        );
      } catch (
        loadError
      ) {
        console.error(
          "Platform access load failed:",
          loadError
        );

        if (
          !cancelled
        ) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load platform administrators."
          );
        }
      } finally {
        if (
          !cancelled
        ) {
          setLoading(
            false
          );
        }
      }
    }

    void loadPage();

    return () => {
      cancelled =
        true;
    };
  }, [
    router,
  ]);

  function openAddForm() {
    setAdminForm({
      ...EMPTY_ADMIN_FORM,
    });

    setAdminError(
      ""
    );

    setAdminMessage(
      ""
    );

    setShowAddForm(
      true
    );
  }

  function closeAddForm() {
    if (
      savingAdmin
    ) {
      return;
    }

    setShowAddForm(
      false
    );

    setAdminError(
      ""
    );

    setAdminForm({
      ...EMPTY_ADMIN_FORM,
    });
  }

  function updateAdminForm<
    Key extends keyof AdminForm
  >(
    key: Key,
    value: AdminForm[Key]
  ) {
    setAdminForm(
      (
        current
      ) => ({
        ...current,
        [key]:
          value,
      })
    );

    setAdminError(
      ""
    );

    setAdminMessage(
      ""
    );
  }

  async function createAdmin() {
    const firstName =
      adminForm.firstName.trim();

    const lastName =
      adminForm.lastName.trim();

    const email =
      adminForm.email
        .trim()
        .toLowerCase();

    const loginName =
      adminForm.loginName
        .trim()
        .toLowerCase();

    if (
      !firstName ||
      !lastName
    ) {
      setAdminError(
        "First and last name are required."
      );

      return;
    }

    if (
      loginName.length < 3
    ) {
      setAdminError(
        "Login name must be at least 3 characters."
      );

      return;
    }

    if (
      !/^[a-z0-9._-]+$/.test(
        loginName
      )
    ) {
      setAdminError(
        "Login name can only contain letters, numbers, periods, hyphens, and underscores."
      );

      return;
    }

    if (
      adminForm.password.length <
      8
    ) {
      setAdminError(
        "Temporary password must be at least 8 characters."
      );

      return;
    }

    if (
      adminForm.password !==
      adminForm.confirmPassword
    ) {
      setAdminError(
        "Passwords do not match."
      );

      return;
    }

    try {
      setSavingAdmin(
        true
      );

      setAdminError(
        ""
      );

      setAdminMessage(
        ""
      );

      const response =
        await fetch(
          "/api/admin/platform-admins",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                firstName,
                lastName,
                email,
                loginName,
                password:
                  adminForm.password,
              }),
          }
        );

      const data =
        await response.json();

      if (
        !response.ok
      ) {
        throw new Error(
          typeof data?.error ===
            "string"
            ? data.error
            : "Unable to create platform administrator."
        );
      }

      const newAdmin =
        data as PlatformAdmin;

      setAdmins(
        (
          current
        ) =>
          [
            ...current,
            newAdmin,
          ].sort(
            (
              first,
              second
            ) => {
              if (
                first.active !==
                second.active
              ) {
                return first.active
                  ? -1
                  : 1;
              }

              const firstNameCompare =
                first.firstName.localeCompare(
                  second.firstName
                );

              if (
                firstNameCompare !==
                0
              ) {
                return firstNameCompare;
              }

              return first.lastName.localeCompare(
                second.lastName
              );
            }
          )
      );

      setAdminMessage(
        `${newAdmin.firstName} ${newAdmin.lastName} was added as a platform administrator.`
      );

      setShowAddForm(
        false
      );

      setAdminForm({
        ...EMPTY_ADMIN_FORM,
      });
    } catch (
      saveError
    ) {
      console.error(
        "Platform administrator creation failed:",
        saveError
      );

      setAdminError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to create platform administrator."
      );
    } finally {
      setSavingAdmin(
        false
      );
    }
  }

  if (
    loading
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 dark:bg-slate-950">
        <div className="rounded-2xl bg-white px-8 py-6 shadow dark:bg-slate-900">
          <p className="text-slate-500 dark:text-slate-400">
            Loading platform access...
          </p>
        </div>
      </main>
    );
  }

  if (
    error
  ) {
    return (
      <main className="min-h-screen bg-slate-100 px-6 py-10 dark:bg-slate-950">
        <div className="mx-auto max-w-4xl rounded-2xl bg-white p-8 shadow dark:bg-slate-900">
          <h1 className="text-2xl font-bold">
            Unable to load platform access
          </h1>

          <p className="mt-2 text-red-600">
            {error}
          </p>

          <Link
            href="/admin"
            className="mt-6 inline-block rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
          >
            Back to Admin
          </Link>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-slate-100 dark:bg-slate-950">
        <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
            <div>
              <Link
                href="/admin"
                className="text-2xl font-bold text-slate-950 dark:text-white"
              >
                JobClokr
              </Link>

              <p className="text-sm text-slate-500 dark:text-slate-400">
                Platform Administration
              </p>
            </div>

            <Link
              href="/admin"
              className="rounded-lg border border-slate-300 px-4 py-2 font-medium transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              Back to Admin
            </Link>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
              Platform Access
            </p>

            <h1 className="mt-2 text-4xl font-bold text-slate-950 dark:text-white">
              Platform Administrators
            </h1>

            <p className="mt-2 max-w-3xl text-slate-600 dark:text-slate-400">
              Manage JobClokr administrator
              accounts with access to companies,
              subscriptions, and platform controls.
            </p>
          </div>

          {sessionUser ? (
            <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 px-5 py-4 dark:border-blue-900 dark:bg-blue-950/30">
              <p className="font-semibold text-blue-950 dark:text-blue-100">
                Signed in as{" "}
                {
                  sessionUser.name
                }
              </p>

              <p className="mt-1 text-sm text-blue-800 dark:text-blue-200">
                Platform administrator access is active.
              </p>
            </div>
          ) : null}

          {adminMessage ? (
            <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-medium text-green-700 dark:border-green-900 dark:bg-green-950/30 dark:text-green-300">
              {
                adminMessage
              }
            </div>
          ) : null}

          <section className="overflow-hidden rounded-2xl bg-white shadow dark:bg-slate-900">
            <div className="flex flex-col gap-4 border-b border-slate-200 p-6 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold">
                  Administrators
                </h2>

                <p className="mt-1 text-slate-500 dark:text-slate-400">
                  JobClokr platform administrator accounts.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  openAddForm
                }
                className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
              >
                + Add Administrator
              </button>
            </div>

            {admins.length ===
            0 ? (
              <p className="p-6 text-slate-500 dark:text-slate-400">
                No platform administrators found.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead className="bg-slate-100 dark:bg-slate-800">
                    <tr>
                      <th className="p-4 text-left">
                        Administrator
                      </th>

                      <th className="p-4 text-left">
                        Login
                      </th>

                      <th className="p-4 text-left">
                        Email
                      </th>

                      <th className="p-4 text-left">
                        Status
                      </th>

                      <th className="p-4 text-left">
                        Password
                      </th>

                      <th className="p-4 text-left">
                        Created
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {admins.map(
                      (
                        admin
                      ) => (
                        <tr
                          key={
                            admin.id
                          }
                          className="border-t border-slate-200 dark:border-slate-800"
                        >
                          <td className="p-4">
                            <p className="font-semibold">
                              {
                                admin.firstName
                              }{" "}
                              {
                                admin.lastName
                              }
                            </p>

                            {sessionUser?.adminId ===
                            admin.id ? (
                              <p className="mt-1 text-xs font-medium text-blue-600">
                                Current account
                              </p>
                            ) : null}
                          </td>

                          <td className="p-4 font-mono">
                            {
                              admin.loginName
                            }
                          </td>

                          <td className="p-4">
                            {
                              admin.email ||
                              "—"
                            }
                          </td>

                          <td className="p-4">
                            <span
                              className={
                                admin.active
                                  ? "rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700 dark:bg-green-950 dark:text-green-300"
                                  : "rounded-full bg-slate-200 px-3 py-1 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                              }
                            >
                              {
                                admin.active
                                  ? "Active"
                                  : "Inactive"
                              }
                            </span>
                          </td>

                          <td className="p-4">
                            {admin.mustChangePassword ? (
                              <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-semibold text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300">
                                Change Required
                              </span>
                            ) : (
                              <span className="text-sm text-slate-500 dark:text-slate-400">
                                Set
                              </span>
                            )}
                          </td>

                          <td className="p-4">
                            {
                              new Date(
                                admin.createdAt
                              ).toLocaleDateString()
                            }
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>

      {showAddForm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 p-6 dark:border-slate-800">
              <div>
                <h2 className="text-2xl font-bold">
                  Add Administrator
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Create a JobClokr platform
                  administrator account.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeAddForm
                }
                disabled={
                  savingAdmin
                }
                className="rounded-lg px-3 py-2 text-2xl text-slate-500 hover:bg-slate-100 disabled:opacity-50 dark:hover:bg-slate-800"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block font-medium">
                    First Name
                  </label>

                  <input
                    type="text"
                    value={
                      adminForm.firstName
                    }
                    onChange={(
                      event
                    ) =>
                      updateAdminForm(
                        "firstName",
                        event.target.value
                      )
                    }
                    disabled={
                      savingAdmin
                    }
                    className="w-full rounded-lg border border-slate-300 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-blue-950"
                  />
                </div>

                <div>
                  <label className="mb-2 block font-medium">
                    Last Name
                  </label>

                  <input
                    type="text"
                    value={
                      adminForm.lastName
                    }
                    onChange={(
                      event
                    ) =>
                      updateAdminForm(
                        "lastName",
                        event.target.value
                      )
                    }
                    disabled={
                      savingAdmin
                    }
                    className="w-full rounded-lg border border-slate-300 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-blue-950"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block font-medium">
                  Email
                </label>

                <input
                  type="email"
                  value={
                    adminForm.email
                  }
                  onChange={(
                    event
                  ) =>
                    updateAdminForm(
                      "email",
                      event.target.value
                    )
                  }
                  disabled={
                    savingAdmin
                  }
                  className="w-full rounded-lg border border-slate-300 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-blue-950"
                  placeholder="admin@jobclokr.com"
                />
              </div>

              <div>
                <label className="mb-2 block font-medium">
                  Login Name
                </label>

                <input
                  type="text"
                  value={
                    adminForm.loginName
                  }
                  onChange={(
                    event
                  ) =>
                    updateAdminForm(
                      "loginName",
                      event.target.value.toLowerCase()
                    )
                  }
                  disabled={
                    savingAdmin
                  }
                  autoCapitalize="none"
                  autoCorrect="off"
                  className="w-full rounded-lg border border-slate-300 p-3 font-mono outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-blue-950"
                  placeholder="adminname"
                />

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Login names are stored in
                  lowercase.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block font-medium">
                    Temporary Password
                  </label>

                  <input
                    type="password"
                    value={
                      adminForm.password
                    }
                    onChange={(
                      event
                    ) =>
                      updateAdminForm(
                        "password",
                        event.target.value
                      )
                    }
                    disabled={
                      savingAdmin
                    }
                    autoComplete="new-password"
                    className="w-full rounded-lg border border-slate-300 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-blue-950"
                    placeholder="At least 8 characters"
                  />
                </div>

                <div>
                  <label className="mb-2 block font-medium">
                    Confirm Password
                  </label>

                  <input
                    type="password"
                    value={
                      adminForm.confirmPassword
                    }
                    onChange={(
                      event
                    ) =>
                      updateAdminForm(
                        "confirmPassword",
                        event.target.value
                      )
                    }
                    disabled={
                      savingAdmin
                    }
                    autoComplete="new-password"
                    className="w-full rounded-lg border border-slate-300 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-blue-950"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800 dark:border-yellow-900 dark:bg-yellow-950/30 dark:text-yellow-200">
                The new administrator will be
                required to change the temporary
                password after signing in.
              </div>

              {adminError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                  {
                    adminError
                  }
                </div>
              ) : null}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={
                    closeAddForm
                  }
                  disabled={
                    savingAdmin
                  }
                  className="rounded-lg border border-slate-300 px-5 py-3 font-semibold transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() =>
                    void createAdmin()
                  }
                  disabled={
                    savingAdmin
                  }
                  className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingAdmin
                    ? "Creating..."
                    : "Create Administrator"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}