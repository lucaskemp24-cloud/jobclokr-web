"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import { ToastProvider } from "@/components/ui/ToastProvider";

import {
  isOfficeUser,
  loadAuthUser,
  type AuthUser,
} from "@/lib/auth";

import {
  applySavedTheme,
  applyTheme,
  loadSettings,
  SETTINGS_CHANGED_EVENT,
  type CompanySettings,
} from "@/lib/settings";

type AppLayoutProps = {
  children: ReactNode;
};

export default function AppLayout({
  children,
}: AppLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);

  useEffect(() => {
    const savedUser = loadAuthUser();

    if (!savedUser) {
      setUser(null);
      setAuthLoaded(true);
      router.replace("/login");
      return;
    }

    const officeUser = isOfficeUser(savedUser);

    const employeePortalRoute =
      pathname === "/employee-portal" ||
      pathname.startsWith("/employee-portal/");

    if (!officeUser && !employeePortalRoute) {
      setUser(savedUser);
      setAuthLoaded(true);
      router.replace("/employee-portal");
      return;
    }

    if (officeUser && employeePortalRoute) {
      setUser(savedUser);
      setAuthLoaded(true);
      router.replace("/");
      return;
    }

    setUser(savedUser);
    setAuthLoaded(true);
  }, [pathname, router]);

  useEffect(() => {
    applySavedTheme();

    const mediaQuery = window.matchMedia(
      "(prefers-color-scheme: dark)"
    );

    function handleSystemThemeChange() {
      if (loadSettings().theme === "System") {
        applyTheme("System");
      }
    }

    function handleSettingsChange(event: Event) {
      const customEvent =
        event as CustomEvent<CompanySettings>;

      applyTheme(
        customEvent.detail?.theme ??
          loadSettings().theme
      );
    }

    mediaQuery.addEventListener(
      "change",
      handleSystemThemeChange
    );

    window.addEventListener(
      SETTINGS_CHANGED_EVENT,
      handleSettingsChange
    );

    return () => {
      mediaQuery.removeEventListener(
        "change",
        handleSystemThemeChange
      );

      window.removeEventListener(
        SETTINGS_CHANGED_EVENT,
        handleSettingsChange
      );
    };
  }, []);

  if (!authLoaded || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <div className="rounded-xl bg-white px-8 py-6 text-gray-500 shadow dark:bg-slate-900 dark:text-slate-300">
          Loading JobClokr...
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <div className="flex min-h-screen bg-slate-100 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />

          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}