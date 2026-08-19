"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useRouter,
} from "next/navigation";

type PlatformAdminSession = {
  accountType:
    "PLATFORM_ADMIN";

  adminId: number;
  employeeId: null;
  companyId: null;

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

type SubscriptionCompany = {
  id: number;
  name: string;
  code: string;

  subscriptionStatus: string;

  stripeCustomerId:
    | string
    | null;

  stripeSubscriptionId:
    | string
    | null;

  subscriptionCurrentPeriodStart:
    | string
    | null;

  subscriptionCurrentPeriodEnd:
    | string
    | null;

  createdAt: string;
  updatedAt: string;
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

  if (
    status === "PAST_DUE"
  ) {
    return "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300";
  }

  if (
    status === "CANCELED"
  ) {
    return "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300";
  }

  return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
}

function formatDate(
  value:
    | string
    | null
) {
  if (!value) {
    return "—";
  }

  return new Date(
    value
  ).toLocaleDateString();
}

export default function SubscriptionsPage() {
  const router =
    useRouter();

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
    adminName,
    setAdminName,
  ] =
    useState(
      "Administrator"
    );

  const [
    companies,
    setCompanies,
  ] =
    useState<
      SubscriptionCompany[]
    >([]);

  const [
    search,
    setSearch,
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

        const companiesData =
          await companiesResponse.json();

        if (
          !companiesResponse.ok
        ) {
          throw new Error(
            typeof companiesData?.error ===
              "string"
              ? companiesData.error
              : "Unable to load subscriptions."
          );
        }

        if (
          cancelled
        ) {
          return;
        }

        setAdminName(
          sessionData.user.name
        );

        const loadedCompanies =
          Array.isArray(
            companiesData
          )
            ? companiesData
            : Array.isArray(
                  companiesData?.companies
                )
              ? companiesData.companies
              : [];

        setCompanies(
          loadedCompanies
        );
      } catch (
        loadError
      ) {
        console.error(
          "Subscriptions load failed:",
          loadError
        );

        if (
          !cancelled
        ) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load subscriptions."
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

  const filteredCompanies =
    useMemo(
      () => {
        const query =
          search
            .trim()
            .toLowerCase();

        if (!query) {
          return companies;
        }

        return companies.filter(
          (
            company
          ) =>
            company.name
              .toLowerCase()
              .includes(
                query
              ) ||
            company.code
              .toLowerCase()
              .includes(
                query
              ) ||
            company.subscriptionStatus
              .toLowerCase()
              .includes(
                query
              )
        );
      },
      [
        companies,
        search,
      ]
    );

  const activeCount =
    companies.filter(
      (
        company
      ) =>
        company.subscriptionStatus ===
          "ACTIVE" ||
        company.subscriptionStatus ===
          "TRIALING"
    ).length;

  const pastDueCount =
    companies.filter(
      (
        company
      ) =>
        company.subscriptionStatus ===
        "PAST_DUE"
    ).length;

  const canceledCount =
    companies.filter(
      (
        company
      ) =>
        company.subscriptionStatus ===
        "CANCELED"
    ).length;

  if (
    loading
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 dark:bg-slate-950">
        <div className="rounded-2xl bg-white px-8 py-6 shadow dark:bg-slate-900">
          <p className="text-slate-500 dark:text-slate-400">
            Loading subscriptions...
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
            Unable to load subscriptions
          </h1>

          <p className="mt-2 text-red-600">
            {
              error
            }
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

          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="font-semibold text-slate-950 dark:text-white">
                {
                  adminName
                }
              </p>

              <p className="text-sm text-slate-500 dark:text-slate-400">
                Platform Administrator
              </p>
            </div>

            <Link
              href="/admin"
              className="rounded-lg border border-slate-300 px-4 py-2 font-medium transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              Back to Admin
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-green-600">
            Subscriptions
          </p>

          <h1 className="mt-2 text-4xl font-bold text-slate-950 dark:text-white">
            Billing & Subscription Status
          </h1>

          <p className="mt-2 max-w-3xl text-slate-600 dark:text-slate-400">
            Review subscription status,
            billing periods, and Stripe
            connections for JobClokr
            customer companies.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          <div className="rounded-2xl bg-white p-6 shadow dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Total Companies
            </p>

            <p className="mt-2 text-4xl font-bold">
              {
                companies.length
              }
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Active / Trial
            </p>

            <p className="mt-2 text-4xl font-bold text-green-600">
              {
                activeCount
              }
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Past Due
            </p>

            <p className="mt-2 text-4xl font-bold text-yellow-600">
              {
                pastDueCount
              }
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Canceled
            </p>

            <p className="mt-2 text-4xl font-bold text-red-600">
              {
                canceledCount
              }
            </p>
          </div>
        </div>

        <section className="mt-6 overflow-hidden rounded-2xl bg-white shadow dark:bg-slate-900">
          <div className="flex flex-col gap-4 border-b border-slate-200 p-6 dark:border-slate-800 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                Company Subscriptions
              </h2>

              <p className="mt-1 text-slate-500 dark:text-slate-400">
                Current billing state for all
                JobClokr companies.
              </p>
            </div>

            <input
              type="search"
              value={
                search
              }
              onChange={(
                event
              ) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search companies..."
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-blue-950 lg:max-w-sm"
            />
          </div>

          {filteredCompanies.length ===
          0 ? (
            <p className="p-6 text-slate-500 dark:text-slate-400">
              No companies found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1150px]">
                <thead className="bg-slate-100 dark:bg-slate-800">
                  <tr>
                    <th className="p-4 text-left">
                      Company
                    </th>

                    <th className="p-4 text-left">
                      Status
                    </th>

                    <th className="p-4 text-left">
                      Billing Period
                    </th>

                    <th className="p-4 text-left">
                      Stripe Customer
                    </th>

                    <th className="p-4 text-left">
                      Stripe Subscription
                    </th>

                    <th className="p-4 text-left">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredCompanies.map(
                    (
                      company
                    ) => (
                      <tr
                        key={
                          company.id
                        }
                        className="border-t border-slate-200 dark:border-slate-800"
                      >
                        <td className="p-4">
                          <p className="font-semibold">
                            {
                              company.name
                            }
                          </p>

                          <p className="mt-1 font-mono text-xs text-slate-500 dark:text-slate-400">
                            {
                              company.code
                            }
                          </p>
                        </td>

                        <td className="p-4">
                          <span
                            className={`rounded-full px-3 py-1 text-sm font-semibold ${getStatusClass(
                              company.subscriptionStatus
                            )}`}
                          >
                            {
                              formatStatus(
                                company.subscriptionStatus
                              )
                            }
                          </span>
                        </td>

                        <td className="p-4">
                          {formatDate(
                            company.subscriptionCurrentPeriodStart
                          )}{" "}
                          –{" "}
                          {formatDate(
                            company.subscriptionCurrentPeriodEnd
                          )}
                        </td>

                        <td className="p-4">
                          {company.stripeCustomerId ? (
                            <span className="font-mono text-sm">
                              {
                                company.stripeCustomerId
                              }
                            </span>
                          ) : (
                            <span className="text-slate-500 dark:text-slate-400">
                              Not connected
                            </span>
                          )}
                        </td>

                        <td className="p-4">
                          {company.stripeSubscriptionId ? (
                            <span className="font-mono text-sm">
                              {
                                company.stripeSubscriptionId
                              }
                            </span>
                          ) : (
                            <span className="text-slate-500 dark:text-slate-400">
                              Not connected
                            </span>
                          )}
                        </td>

                        <td className="p-4">
                          <Link
                            href={`/admin/companies/${company.id}`}
                            className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700"
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
          )}
        </section>
      </div>
    </main>
  );
}