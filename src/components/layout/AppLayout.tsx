"use client";

import {
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  usePathname,
  useRouter,
} from "next/navigation";

import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";

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

export default function AppLayout({
  children,
}: AppLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] =
    useState<SessionUser | null>(
      null
    );

  const [authLoaded, setAuthLoaded] =
    useState(false);

  const [
    mobileMenuOpen,
    setMobileMenuOpen,
  ] = useState(false);

  useEffect(() => {
    async function loadSession() {
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
          setAuthLoaded(true);

          router.replace(
            "/login"
          );

          return;
        }

        const officeUser =
          data.user.role ===
            "Owner" ||
          data.user.role ===
            "Office";

        const employeePortalRoute =
          pathname ===
            "/employee-portal" ||
          pathname.startsWith(
            "/employee-portal/"
          );

        if (
          !officeUser &&
          !employeePortalRoute
        ) {
          setUser(data.user);
          setAuthLoaded(true);

          router.replace(
            "/employee-portal"
          );

          return;
        }

        if (
          officeUser &&
          employeePortalRoute
        ) {
          setUser(data.user);
          setAuthLoaded(true);

          router.replace("/");

          return;
        }

        setUser(data.user);
        setAuthLoaded(true);
      } catch (error) {
        console.error(
          "Session load failed:",
          error
        );

        setUser(null);
        setAuthLoaded(true);

        router.replace(
          "/login"
        );
      }
    }

    void loadSession();
  }, [pathname, router]);

  useEffect(() => {
    applySavedTheme();

    const mediaQuery =
      window.matchMedia(
        "(prefers-color-scheme: dark)"
      );

    function handleSystemThemeChange() {
      if (
        loadSettings().theme ===
        "System"
      ) {
        applyTheme("System");
      }
    }

    function handleSettingsChange(
      event: Event
    ) {
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

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) {
      return;
    }

    function handleEscape(
      event: KeyboardEvent
    ) {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    }

    document.body.style.overflow =
      "hidden";

    window.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.body.style.overflow =
        "";

      window.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [mobileMenuOpen]);

  if (!authLoaded || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <div className="rounded-xl bg-white px-8 py-6 text-center text-gray-500 shadow dark:bg-slate-900 dark:text-slate-300">
          Loading JobClokr...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <Sidebar
        mobileOpen={
          mobileMenuOpen
        }
        onMobileClose={() =>
          setMobileMenuOpen(false)
        }
      />

      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={() =>
            setMobileMenuOpen(false)
          }
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
        />
      )}

      <div className="min-w-0 lg:pl-56">
        <TopBar
          onMenuClick={() =>
            setMobileMenuOpen(true)
          }
        />

        <main className="min-w-0 flex-1 p-4 sm:p-5 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}