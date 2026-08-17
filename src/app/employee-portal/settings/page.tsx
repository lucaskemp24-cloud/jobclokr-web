"use client";

import {
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import EmployeeLayout from "@/components/layout/EmployeeLayout";
import { useToast } from "@/components/ui/ToastProvider";

type ThemePreference =
  | "System"
  | "Light"
  | "Dark";

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

const EMPLOYEE_THEME_STORAGE_KEY =
  "jobclokr-employee-theme";

function applyEmployeeTheme(
  theme: ThemePreference
) {
  const root =
    document.documentElement;

  if (theme === "Dark") {
    root.classList.add("dark");
    return;
  }

  if (theme === "Light") {
    root.classList.remove("dark");
    return;
  }

  const systemPrefersDark =
    window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

  root.classList.toggle(
    "dark",
    systemPrefersDark
  );
}

function loadEmployeeTheme():
  ThemePreference {
  const savedTheme =
    window.localStorage.getItem(
      EMPLOYEE_THEME_STORAGE_KEY
    );

  if (
    savedTheme === "Light" ||
    savedTheme === "Dark" ||
    savedTheme === "System"
  ) {
    return savedTheme;
  }

  return "System";
}

export default function EmployeeSettingsPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [
    theme,
    setTheme,
  ] =
    useState<ThemePreference>(
      "System"
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  useEffect(() => {
    async function loadSettingsPage() {
      try {
        const response =
          await fetch(
            "/api/session",
            {
              cache: "no-store",
            }
          );

        const data =
          (await response.json()) as
            SessionResponse;

        if (
          !response.ok ||
          !data.authenticated ||
          !data.user
        ) {
          router.replace(
            "/login"
          );

          return;
        }

        if (
          data.user.role ===
            "Owner" ||
          data.user.role ===
            "Office"
        ) {
          router.replace("/");

          return;
        }

        const savedTheme =
          loadEmployeeTheme();

        setTheme(
          savedTheme
        );

        applyEmployeeTheme(
          savedTheme
        );
      } catch (error) {
        console.error(
          "Employee settings load failed:",
          error
        );

        showToast(
          "Unable to load employee settings.",
          "error"
        );
      } finally {
        setLoading(false);
      }
    }

    void loadSettingsPage();
  }, [
    router,
    showToast,
  ]);

  useEffect(() => {
    const mediaQuery =
      window.matchMedia(
        "(prefers-color-scheme: dark)"
      );

    function handleSystemChange() {
      if (
        loadEmployeeTheme() ===
        "System"
      ) {
        applyEmployeeTheme(
          "System"
        );
      }
    }

    mediaQuery.addEventListener(
      "change",
      handleSystemChange
    );

    return () => {
      mediaQuery.removeEventListener(
        "change",
        handleSystemChange
      );
    };
  }, []);

  function handleThemeChange(
    newTheme:
      ThemePreference
  ) {
    setTheme(
      newTheme
    );

    window.localStorage.setItem(
      EMPLOYEE_THEME_STORAGE_KEY,
      newTheme
    );

    applyEmployeeTheme(
      newTheme
    );

    showToast(
      `Theme changed to ${newTheme}.`,
      "success"
    );
  }

  function resetPreferences() {
    window.localStorage.removeItem(
      EMPLOYEE_THEME_STORAGE_KEY
    );

    setTheme(
      "System"
    );

    applyEmployeeTheme(
      "System"
    );

    showToast(
      "Employee preferences reset.",
      "success"
    );
  }

  if (loading) {
    return (
      <EmployeeLayout>
        <div className="mx-auto flex min-h-[65vh] max-w-xl items-center justify-center">
          <div className="w-full rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-blue-600 border-r-transparent" />

            <p className="mt-4 text-slate-500 dark:text-slate-400">
              Loading settings...
            </p>
          </div>
        </div>
      </EmployeeLayout>
    );
  }

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

        <header>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            App Preferences
          </p>

          <h1 className="mt-1 text-3xl font-bold">
            Settings
          </h1>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Customize JobClokr on this device.
          </p>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div>
            <h2 className="text-xl font-bold">
              Appearance
            </h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Choose how JobClokr looks on this device.
            </p>
          </div>

          <div className="mt-5 space-y-3">
            <button
              type="button"
              onClick={() =>
                handleThemeChange(
                  "System"
                )
              }
              className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition ${
                theme === "System"
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40"
                  : "border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
              }`}
            >
              <div>
                <p className="font-semibold">
                  🌓 System
                </p>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Match your phone&apos;s appearance.
                </p>
              </div>

              {theme ===
                "System" && (
                <span className="text-xl text-blue-600">
                  ✓
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() =>
                handleThemeChange(
                  "Light"
                )
              }
              className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition ${
                theme === "Light"
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40"
                  : "border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
              }`}
            >
              <div>
                <p className="font-semibold">
                  ☀️ Light
                </p>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Always use light mode.
                </p>
              </div>

              {theme ===
                "Light" && (
                <span className="text-xl text-blue-600">
                  ✓
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() =>
                handleThemeChange(
                  "Dark"
                )
              }
              className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition ${
                theme === "Dark"
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40"
                  : "border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
              }`}
            >
              <div>
                <p className="font-semibold">
                  🌙 Dark
                </p>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Always use dark mode.
                </p>
              </div>

              {theme ===
                "Dark" && (
                <span className="text-xl text-blue-600">
                  ✓
                </span>
              )}
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-xl font-bold">
            About
          </h2>

          <div className="mt-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold">
                  JobClokr
                </p>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Employee Portal
                </p>
              </div>

              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                Mobile
              </span>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-xl font-bold">
            Reset Preferences
          </h2>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Restore this device to the default JobClokr appearance.
          </p>

          <button
            type="button"
            onClick={
              resetPreferences
            }
            className="mt-5 w-full rounded-xl border border-red-300 px-4 py-3 font-semibold text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/30"
          >
            Reset Preferences
          </button>
        </section>
      </div>
    </EmployeeLayout>
  );
}