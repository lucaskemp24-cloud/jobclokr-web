"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Company = {
  id: number;
  name: string;
  code: string;
  subscriptionStatus: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  subscriptionCurrentPeriodStart: string | null;
  subscriptionCurrentPeriodEnd: string | null;
  employeeCount: number;
  customerCount: number;
  projectCount: number;
  createdAt: string;
  updatedAt: string;
};

type PlatformAdminSession = {
  accountType: "PLATFORM_ADMIN";
  adminId: number;
  employeeId: null;
  companyId: null;
  name: string;
  role: "PlatformAdmin";
  isPlatformAdmin: true;
};

type SessionResponse = {
  authenticated: boolean;
  user: PlatformAdminSession | null;
};

type CompanyForm = {
  name: string;
  code: string;
  subscriptionStatus: string;
  phone: string;
  email: string;
  website: string;
  address: string;
};

const EMPTY_COMPANY_FORM: CompanyForm = {
  name: "",
  code: "",
  subscriptionStatus: "TRIALING",
  phone: "",
  email: "",
  website: "",
  address: "",
};

function formatStatus(
  status: string
) {
  if (status === "ACTIVE") {
    return "Active";
  }

  if (status === "TRIALING") {
    return "Trial";
  }

  if (status === "PAST_DUE") {
    return "Past Due";
  }

  if (status === "CANCELED") {
    return "Canceled";
  }

  if (status === "INCOMPLETE") {
    return "Incomplete";
  }

  return status;
}

function getStatusClass(
  status: string
) {
  if (
    status === "ACTIVE" ||
    status === "TRIALING"
  ) {
    return "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300";
  }

  if (status === "PAST_DUE") {
    return "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300";
  }

  if (status === "CANCELED") {
    return "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300";
  }

  return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
}

function sortCompanies(
  companies: Company[]
) {
  return [
    ...companies,
  ].sort(
    (
      first,
      second
    ) =>
      first.name.localeCompare(
        second.name
      )
  );
}

export default function AdminCompaniesPage() {
  const router =
    useRouter();

  const [
    companies,
    setCompanies,
  ] =
    useState<Company[]>([]);

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
    showCompanyForm,
    setShowCompanyForm,
  ] =
    useState(false);

  const [
    companyForm,
    setCompanyForm,
  ] =
    useState<CompanyForm>(
      EMPTY_COMPANY_FORM
    );

  const [
    savingCompany,
    setSavingCompany,
  ] =
    useState(false);

  const [
    companyError,
    setCompanyError,
  ] =
    useState("");

  const [
    companyMessage,
    setCompanyMessage,
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

        const companiesResponse =
          await fetch(
            "/api/admin/companies",
            {
              cache:
                "no-store",
            }
          );

        if (
          !companiesResponse.ok
        ) {
          throw new Error(
            "Unable to load companies."
          );
        }

        const data =
          await companiesResponse.json();

        if (
          !cancelled
        ) {
          setCompanies(
            Array.isArray(data)
              ? data
              : []
          );
        }
      } catch (
        loadError
      ) {
        console.error(
          "Admin companies load failed:",
          loadError
        );

        if (
          !cancelled
        ) {
          setError(
            "Unable to load companies."
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
  }, [router]);

  function openCompanyForm() {
    setCompanyForm({
      ...EMPTY_COMPANY_FORM,
    });

    setCompanyError(
      ""
    );

    setCompanyMessage(
      ""
    );

    setShowCompanyForm(
      true
    );
  }

  function closeCompanyForm() {
    if (
      savingCompany
    ) {
      return;
    }

    setShowCompanyForm(
      false
    );

    setCompanyError(
      ""
    );
  }

  function updateCompanyForm<
    Key extends keyof CompanyForm
  >(
    key: Key,
    value: CompanyForm[Key]
  ) {
    setCompanyForm(
      (
        current
      ) => ({
        ...current,
        [key]:
          value,
      })
    );

    setCompanyError(
      ""
    );

    setCompanyMessage(
      ""
    );
  }

  async function createCompany() {
    const name =
      companyForm.name
        .trim();

    const code =
      companyForm.code
        .trim()
        .toUpperCase();

    if (!name) {
      setCompanyError(
        "Company name is required."
      );

      return;
    }

    if (
      code.length < 3
    ) {
      setCompanyError(
        "Company code must be at least 3 characters."
      );

      return;
    }

    try {
      setSavingCompany(
        true
      );

      setCompanyError(
        ""
      );

      setCompanyMessage(
        ""
      );

      const response =
        await fetch(
          "/api/admin/companies",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                name,

                code,

                subscriptionStatus:
                  companyForm.subscriptionStatus,

                phone:
                  companyForm.phone.trim(),

                email:
                  companyForm.email.trim(),

                website:
                  companyForm.website.trim(),

                address:
                  companyForm.address.trim(),
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
            : "Unable to create company."
        );
      }

      const newCompany =
        data as Company;

      setCompanies(
        (
          currentCompanies
        ) =>
          sortCompanies([
            ...currentCompanies,
            newCompany,
          ])
      );

      setCompanyMessage(
        `${newCompany.name} was created successfully.`
      );

      setCompanyForm({
        ...EMPTY_COMPANY_FORM,
      });

      setShowCompanyForm(
        false
      );
    } catch (
      saveError
    ) {
      console.error(
        "Company creation failed:",
        saveError
      );

      setCompanyError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to create company."
      );
    } finally {
      setSavingCompany(
        false
      );
    }
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
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
                Platform Administration
              </p>

              <h1 className="mt-2 text-4xl font-bold text-slate-950 dark:text-white">
                Companies
              </h1>

              <p className="mt-2 text-slate-500 dark:text-slate-400">
                View and manage every company registered with JobClokr.
              </p>
            </div>

            <button
              type="button"
              onClick={
                openCompanyForm
              }
              className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              + Add Company
            </button>
          </div>

          {companyMessage ? (
            <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-medium text-green-700 dark:border-green-900 dark:bg-green-950/30 dark:text-green-300">
              {
                companyMessage
              }
            </div>
          ) : null}

          {loading ? (
            <div className="rounded-2xl bg-white p-8 text-center shadow dark:bg-slate-900">
              <p className="text-slate-500 dark:text-slate-400">
                Loading companies...
              </p>
            </div>
          ) : error ? (
            <div className="rounded-2xl bg-white p-8 text-center shadow dark:bg-slate-900">
              <p className="text-red-600">
                {error}
              </p>
            </div>
          ) : companies.length ===
            0 ? (
            <div className="rounded-2xl bg-white p-8 text-center shadow dark:bg-slate-900">
              <p className="text-slate-500 dark:text-slate-400">
                No companies found.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl bg-white shadow dark:bg-slate-900">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px]">
                  <thead className="bg-slate-200 dark:bg-slate-800">
                    <tr>
                      <th className="p-4 text-left">
                        Company
                      </th>

                      <th className="p-4 text-left">
                        Code
                      </th>

                      <th className="p-4 text-left">
                        Subscription
                      </th>

                      <th className="p-4 text-left">
                        Employees
                      </th>

                      <th className="p-4 text-left">
                        Customers
                      </th>

                      <th className="p-4 text-left">
                        Projects
                      </th>

                      <th className="p-4 text-left">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {companies.map(
                      (
                        company
                      ) => (
                        <tr
                          key={
                            company.id
                          }
                          className="border-t border-slate-200 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"
                        >
                          <td className="p-4">
                            <div>
                              <p className="font-semibold">
                                {
                                  company.name
                                }
                              </p>

                              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                Company ID{" "}
                                {
                                  company.id
                                }
                              </p>
                            </div>
                          </td>

                          <td className="p-4">
                            <span className="rounded-lg bg-slate-100 px-3 py-1 font-mono text-sm dark:bg-slate-800">
                              {
                                company.code
                              }
                            </span>
                          </td>

                          <td className="p-4">
                            <span
                              className={`rounded-full px-3 py-1 text-sm font-semibold ${getStatusClass(
                                company.subscriptionStatus
                              )}`}
                            >
                              {formatStatus(
                                company.subscriptionStatus
                              )}
                            </span>
                          </td>

                          <td className="p-4">
                            {
                              company.employeeCount
                            }
                          </td>

                          <td className="p-4">
                            {
                              company.customerCount
                            }
                          </td>

                          <td className="p-4">
                            {
                              company.projectCount
                            }
                          </td>

                          <td className="p-4">
                            <Link
                              href={`/admin/companies/${company.id}`}
                              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700"
                            >
                              Manage
                            </Link>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {showCompanyForm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 p-6 dark:border-slate-800">
              <div>
                <h2 className="text-2xl font-bold">
                  Add Company
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Create a new JobClokr customer company.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeCompanyForm
                }
                disabled={
                  savingCompany
                }
                className="rounded-lg px-3 py-2 text-xl text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ×
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block font-medium">
                    Company Name
                  </label>

                  <input
                    type="text"
                    value={
                      companyForm.name
                    }
                    onChange={(
                      event
                    ) =>
                      updateCompanyForm(
                        "name",
                        event.target.value
                      )
                    }
                    disabled={
                      savingCompany
                    }
                    placeholder="Example Electric"
                    className="w-full rounded-lg border border-slate-300 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>

                <div>
                  <label className="mb-2 block font-medium">
                    Company Code
                  </label>

                  <input
                    type="text"
                    value={
                      companyForm.code
                    }
                    onChange={(
                      event
                    ) =>
                      updateCompanyForm(
                        "code",
                        event.target.value.toUpperCase()
                      )
                    }
                    disabled={
                      savingCompany
                    }
                    placeholder="EXAMPLE"
                    autoCapitalize="characters"
                    autoCorrect="off"
                    className="w-full rounded-lg border border-slate-300 p-3 uppercase outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950"
                  />

                  <p className="mt-1 text-xs text-slate-500">
                    At least 3 characters. Letters, numbers, hyphens, and underscores only.
                  </p>
                </div>
              </div>

              <div>
                <label className="mb-2 block font-medium">
                  Subscription Status
                </label>

                <select
                  value={
                    companyForm.subscriptionStatus
                  }
                  onChange={(
                    event
                  ) =>
                    updateCompanyForm(
                      "subscriptionStatus",
                      event.target.value
                    )
                  }
                  disabled={
                    savingCompany
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950"
                >
                  <option value="TRIALING">
                    Trial
                  </option>

                  <option value="ACTIVE">
                    Active
                  </option>

                  <option value="PAST_DUE">
                    Past Due
                  </option>

                  <option value="CANCELED">
                    Canceled
                  </option>

                  <option value="INCOMPLETE">
                    Incomplete
                  </option>
                </select>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block font-medium">
                    Phone
                  </label>

                  <input
                    type="text"
                    value={
                      companyForm.phone
                    }
                    onChange={(
                      event
                    ) =>
                      updateCompanyForm(
                        "phone",
                        event.target.value
                      )
                    }
                    disabled={
                      savingCompany
                    }
                    className="w-full rounded-lg border border-slate-300 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>

                <div>
                  <label className="mb-2 block font-medium">
                    Email
                  </label>

                  <input
                    type="email"
                    value={
                      companyForm.email
                    }
                    onChange={(
                      event
                    ) =>
                      updateCompanyForm(
                        "email",
                        event.target.value
                      )
                    }
                    disabled={
                      savingCompany
                    }
                    className="w-full rounded-lg border border-slate-300 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block font-medium">
                  Website
                </label>

                <input
                  type="text"
                  value={
                    companyForm.website
                  }
                  onChange={(
                    event
                  ) =>
                    updateCompanyForm(
                      "website",
                      event.target.value
                    )
                  }
                  disabled={
                    savingCompany
                  }
                  placeholder="https://example.com"
                  className="w-full rounded-lg border border-slate-300 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950"
                />
              </div>

              <div>
                <label className="mb-2 block font-medium">
                  Address
                </label>

                <textarea
                  value={
                    companyForm.address
                  }
                  onChange={(
                    event
                  ) =>
                    updateCompanyForm(
                      "address",
                      event.target.value
                    )
                  }
                  disabled={
                    savingCompany
                  }
                  rows={3}
                  className="w-full resize-none rounded-lg border border-slate-300 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950"
                />
              </div>

              {companyError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                  {
                    companyError
                  }
                </div>
              ) : null}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 dark:border-slate-800 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={
                    closeCompanyForm
                  }
                  disabled={
                    savingCompany
                  }
                  className="rounded-lg border border-slate-300 px-5 py-3 font-semibold transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() =>
                    void createCompany()
                  }
                  disabled={
                    savingCompany
                  }
                  className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingCompany
                    ? "Creating Company..."
                    : "Create Company"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}