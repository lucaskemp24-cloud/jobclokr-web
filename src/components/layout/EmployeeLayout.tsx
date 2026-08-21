"use client";

import {
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

import { logoutUser } from "@/lib/auth";

type EmployeeLayoutProps = {
  children: ReactNode;
};

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

export default function EmployeeLayout({
  children,
}: EmployeeLayoutProps) {
  const router = useRouter();

  const [user, setUser] =
    useState<SessionUser | null>(
      null
    );

  const [
    showProfileMenu,
    setShowProfileMenu,
  ] = useState(false);

  const [
    showMoreMenu,
    setShowMoreMenu,
  ] = useState(false);

  useEffect(() => {
    async function loadSessionUser() {
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
          setUser(null);

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
          setUser(
            data.user
          );

          router.replace("/");

          return;
        }

        setUser(
          data.user
        );
      } catch (error) {
        console.error(
          "Employee layout session load failed:",
          error
        );

        setUser(null);

        router.replace(
          "/login"
        );
      }
    }

    void loadSessionUser();
  }, [router]);

  const initials = user?.name
    ? user.name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((namePart) =>
          namePart.charAt(0)
        )
        .join("")
        .toUpperCase()
    : "JC";

  function closeMenus() {
    setShowProfileMenu(false);
    setShowMoreMenu(false);
  }

  function scrollToSection(
    sectionId: string
  ) {
    closeMenus();

    if (sectionId === "top") {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    document
      .getElementById(
        sectionId
      )
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  }

  async function handleLogout() {
    try {
      await fetch(
        "/api/logout",
        {
          method: "POST",
        }
      );
    } catch (error) {
      console.error(
        "Server logout failed:",
        error
      );
    }

    logoutUser();
    closeMenus();

    router.replace(
      "/login"
    );

    router.refresh();
  }

  function handleProfile() {
    closeMenus();

    router.push(
      "/employee-portal/profile"
    );
  }

  function handleSettings() {
    closeMenus();

    router.push(
      "/employee-portal/settings"
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <header
        className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95"
        style={{
          paddingTop:
            "max(0.75rem, env(safe-area-inset-top))",
        }}
      >
        <div className="mx-auto flex max-w-xl items-center justify-between">
          <button
            type="button"
            onClick={() =>
              scrollToSection(
                "top"
              )
            }
            className="text-left"
          >
            <p className="text-xl font-bold text-blue-600">
              JobClokr
            </p>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Employee Portal
            </p>
          </button>

          <button
            type="button"
            onClick={() => {
              setShowMoreMenu(
                false
              );

              setShowProfileMenu(
                (
                  currentValue
                ) =>
                  !currentValue
              );
            }}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700 transition hover:bg-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:hover:bg-blue-900"
            aria-label="Open profile menu"
            aria-expanded={
              showProfileMenu
            }
          >
            {initials}
          </button>
        </div>
      </header>

      <main
        id="employee-page-top"
        className="px-4 py-5 pb-28 sm:p-6 sm:pb-10"
      >
        {children}
      </main>

      {showProfileMenu && (
        <>
          <button
            type="button"
            aria-label="Close profile menu"
            onClick={() =>
              setShowProfileMenu(
                false
              )
            }
            className="fixed inset-0 z-40 bg-black/30"
          />

          <section className="fixed right-4 top-20 z-50 w-[calc(100%-2rem)] max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:right-6">
            <div className="border-b border-slate-200 bg-blue-50 p-5 dark:border-slate-700 dark:bg-blue-950/40">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white">
                  {initials}
                </div>

                <div className="min-w-0">
                  <p className="truncate font-bold">
                    {user?.name ??
                      "Employee"}
                  </p>

                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {user?.role ??
                      "Employee"}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2 p-3">
              <button
                type="button"
                onClick={
                  handleProfile
                }
                className="flex min-h-12 w-full items-center gap-3 rounded-xl px-4 text-left transition hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <span className="text-xl">
                  👤
                </span>

                <div>
                  <p className="font-semibold">
                    My Profile
                  </p>

                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    View your employee
                    information
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={
                  handleSettings
                }
                className="flex min-h-12 w-full items-center gap-3 rounded-xl px-4 text-left transition hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <span className="text-xl">
                  ⚙️
                </span>

                <div>
                  <p className="font-semibold">
                    Settings
                  </p>

                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Manage your app
                    preferences
                  </p>
                </div>
              </button>

              <div className="my-2 border-t border-slate-200 dark:border-slate-700" />

              <button
                type="button"
                onClick={() =>
                  void handleLogout()
                }
                className="flex min-h-12 w-full items-center gap-3 rounded-xl px-4 text-left font-semibold text-red-600 transition hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                <span className="text-xl">
                  ↪
                </span>
                Logout
              </button>
            </div>
          </section>
        </>
      )}

      {showMoreMenu && (
        <>
          <button
            type="button"
            aria-label="Close more menu"
            onClick={() =>
              setShowMoreMenu(
                false
              )
            }
            className="fixed inset-0 z-40 bg-black/30 sm:hidden"
          />

          <section
            className="fixed inset-x-0 bottom-20 z-50 mx-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl sm:hidden dark:border-slate-700 dark:bg-slate-900"
            style={{
              marginBottom:
                "env(safe-area-inset-bottom)",
            }}
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="font-bold">
                  More
                </p>

                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Additional employee
                  tools
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowMoreMenu(
                    false
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xl dark:bg-slate-800"
                aria-label="Close more menu"
              >
                ×
              </button>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={
                  handleProfile
                }
                className="flex min-h-12 w-full items-center rounded-xl border border-slate-200 px-4 text-left font-medium dark:border-slate-700"
              >
                👤 My Profile
              </button>

              <button
                type="button"
                onClick={
                  handleSettings
                }
                className="flex min-h-12 w-full items-center rounded-xl border border-slate-200 px-4 text-left font-medium dark:border-slate-700"
              >
                ⚙️ Settings
              </button>

              <button
                type="button"
                onClick={() =>
                  void handleLogout()
                }
                className="flex min-h-12 w-full items-center rounded-xl border border-red-200 px-4 text-left font-semibold text-red-600 dark:border-red-900"
              >
                ↪ Logout
              </button>
            </div>
          </section>
        </>
      )}

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-2 pt-2 shadow-[0_-8px_30px_rgba(15,23,42,0.10)] backdrop-blur sm:hidden dark:border-slate-800 dark:bg-slate-950/95"
        style={{
          paddingBottom:
            "max(0.5rem, env(safe-area-inset-bottom))",
        }}
        aria-label="Employee navigation"
      >
        <div className="mx-auto grid max-w-xl grid-cols-2 gap-1">
          <button
            type="button"
            onClick={() =>
              scrollToSection(
                "top"
              )
            }
            className="flex min-h-14 flex-col items-center justify-center rounded-xl text-blue-600"
          >
            <span className="text-xl">
              ⌂
            </span>

            <span className="mt-1 text-xs font-semibold">
              Home
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setShowProfileMenu(
                false
              );

              setShowMoreMenu(
                (
                  currentValue
                ) =>
                  !currentValue
              );
            }}
            className="flex min-h-14 flex-col items-center justify-center rounded-xl text-slate-500 dark:text-slate-400"
          >
            <span className="text-xl">
              •••
            </span>

            <span className="mt-1 text-xs font-semibold">
              More
            </span>
          </button>
        </div>
      </nav>
    </div>
  );
}