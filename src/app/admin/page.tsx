"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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

export default function AdminPage() {
  const router =
    useRouter();

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    adminName,
    setAdminName,
  ] = useState(
    "Administrator"
  );

  useEffect(() => {
    let cancelled =
      false;

    async function checkAccess() {
      try {
        const response =
          await fetch(
            "/api/session",
            {
              cache:
                "no-store",
            }
          );

        if (!response.ok) {
          router.replace(
            "/login"
          );

          return;
        }

        const data =
          (await response.json()) as
            SessionResponse;

        if (
          !data.authenticated ||
          !data.user ||
          data.user.accountType !==
            "PLATFORM_ADMIN"
        ) {
          router.replace(
            "/login"
          );

          return;
        }

        if (!cancelled) {
          setAdminName(
            data.user.name
          );

          setLoading(
            false
          );
        }
      } catch (error) {
        console.error(
          "Admin access check failed:",
          error
        );

        router.replace(
          "/login"
        );
      }
    }

    void checkAccess();

    return () => {
      cancelled =
        true;
    };
  }, [router]);

  async function handleLogout() {
    try {
      await fetch(
        "/api/logout",
        {
          method:
            "POST",
        }
      );
    } catch (error) {
      console.error(
        "Admin logout failed:",
        error
      );
    } finally {
      router.replace(
        "/login"
      );

      router.refresh();
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 dark:bg-slate-950">
        <div className="rounded-2xl bg-white px-8 py-6 shadow dark:bg-slate-900">
          <p className="text-slate-500 dark:text-slate-400">
            Loading JobClokr administration...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 dark:bg-slate-950">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-950 dark:text-white">
              JobClokr
            </h1>

            <p className="text-sm text-slate-500 dark:text-slate-400">
              Platform Administration
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-semibold text-slate-950 dark:text-white">
                {adminName}
              </p>

              <p className="text-sm text-slate-500 dark:text-slate-400">
                Platform Administrator
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                void handleLogout()
              }
              className="rounded-lg border border-slate-300 px-4 py-2 font-medium transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
            JobClokr Administration
          </p>

          <h2 className="mt-2 text-4xl font-bold text-slate-950 dark:text-white">
            Welcome, {adminName}
          </h2>

          <p className="mt-2 max-w-2xl text-slate-500 dark:text-slate-400">
            Manage JobClokr companies, subscriptions, and platform access from one place.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-6 shadow dark:bg-slate-900">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-2xl dark:bg-blue-950">
              🏢
            </div>

            <h3 className="text-xl font-bold">
              Companies
            </h3>

            <p className="mt-2 text-slate-500 dark:text-slate-400">
              View and manage JobClokr customer companies.
            </p>

            <Link
              href="/admin/companies"
              className="mt-6 block w-full rounded-lg bg-blue-600 px-4 py-3 text-center font-semibold text-white transition hover:bg-blue-700"
            >
              Manage Companies
            </Link>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow dark:bg-slate-900">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-2xl dark:bg-green-950">
              💳
            </div>

            <h3 className="text-xl font-bold">
              Subscriptions
            </h3>

            <p className="mt-2 text-slate-500 dark:text-slate-400">
              Review billing and company subscription status.
            </p>

            <button
              type="button"
              disabled
              className="mt-6 w-full rounded-lg bg-slate-200 px-4 py-3 font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400"
            >
              Billing Coming Next
            </button>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow dark:bg-slate-900">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-2xl dark:bg-purple-950">
              🛡️
            </div>

            <h3 className="text-xl font-bold">
              Platform Access
            </h3>

            <p className="mt-2 text-slate-500 dark:text-slate-400">
              Manage JobClokr administrator accounts and access.
            </p>

            <button
              type="button"
              disabled
              className="mt-6 w-full rounded-lg bg-slate-200 px-4 py-3 font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400"
            >
              Admin Tools Coming Next
            </button>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 p-6 dark:border-blue-900 dark:bg-blue-950/30">
          <h3 className="text-lg font-bold text-blue-950 dark:text-blue-100">
            Platform Admin mode is active
          </h3>

          <p className="mt-2 text-blue-800 dark:text-blue-200">
            This account is not assigned to any customer company or employee record.
          </p>
        </div>
      </div>
    </main>
  );
}