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
  accountType?:
    | "COMPANY_USER"
    | "PLATFORM_ADMIN";

  adminId?: number | null;

  employeeId: number | null;
  companyId: number | null;

  name: string;

  role:
    | "Owner"
    | "Office"
    | "Employee"
    | "PlatformAdmin";

  isPlatformAdmin?: boolean;
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

  /*
    ========================================
    LOAD SERVER SESSION
    ========================================

    The server session is the single source
    of truth for authentication.

    Sidebar and TopBar should NOT perform
    their own redirects based on localStorage.
  */

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      try {
        const response =
          await fetch(
            "/api/session",
            {
              method: "GET",
              cache: "no-store",
              credentials: "include",
            }
          );

        const data =
          (await response.json()) as
            SessionResponse;

        if (cancelled) {
          return;
        }

        /*
          No valid server session.
        */

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

        const sessionUser =
          data.user;

        /*
          Platform admins belong in the
          platform administration area.

          AppLayout is for company users.
        */

        if (
          sessionUser.accountType ===
            "PLATFORM_ADMIN" ||
          sessionUser.isPlatformAdmin ===
            true ||
          sessionUser.role ===
            "PlatformAdmin"
        ) {
          setUser(null);
          setAuthLoaded(true);

          router.replace(
            "/admin"
          );

          return;
        }

        /*
          Company users must have a company
          and employee ID.
        */

        if (
          sessionUser.companyId == null ||
          sessionUser.employeeId == null
        ) {
          setUser(null);
          setAuthLoaded(true);

          router.replace(
            "/login"
          );

          return;
        }

        const officeUser =
          sessionUser.role ===
            "Owner" ||
          sessionUser.role ===
            "Office";

        const employeePortalRoute =
          pathname ===
            "/employee-portal" ||
          pathname.startsWith(
            "/employee-portal/"
          );

        /*
          Normal employees may only use the
          employee portal.
        */

        if (
          !officeUser &&
          !employeePortalRoute
        ) {
          setUser(
            sessionUser
          );

          setAuthLoaded(true);

          router.replace(
            "/employee-portal"
          );

          return;
        }

        /*
          Owners and office users should use
          the office/dashboard side.
        */

        if (
          officeUser &&
          employeePortalRoute
        ) {
          setUser(
            sessionUser
          );

          setAuthLoaded(true);

          router.replace(
            "/"
          );

          return;
        }

        /*
          Session and route are valid.
        */

        setUser(
          sessionUser
        );

        setAuthLoaded(true);
      } catch (error) {
        if (cancelled) {
          return;
        }

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

    return () => {
      cancelled = true;
    };
  }, [
    pathname,
    router,
  ]);

  /*
    ========================================
    THEME
    ========================================
  */

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
        applyTheme(
          "System"
        );
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

  /*
    Close mobile navigation whenever
    the route changes.
  */

  useEffect(() => {
    setMobileMenuOpen(
      false
    );
  }, [pathname]);

  /*
    Mobile menu behavior.
  */

  useEffect(() => {
    if (!mobileMenuOpen) {
      return;
    }

    function handleEscape(
      event: KeyboardEvent
    ) {
      if (
        event.key ===
        "Escape"
      ) {
        setMobileMenuOpen(
          false
        );
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

  /*
    ========================================
    LOADING
    ========================================
  */

  if (
    !authLoaded ||
    !user
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <div className="rounded-xl bg-white px-8 py-6 text-center text-gray-500 shadow dark:bg-slate-900 dark:text-slate-300">
          Loading JobClokr...
        </div>
      </div>
    );
  }

  /*
    ========================================
    APP
    ========================================
  */

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <Sidebar
        mobileOpen={
          mobileMenuOpen
        }
        onMobileClose={() =>
          setMobileMenuOpen(
            false
          )
        }
        userName={
          user.name
        }
      />

      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={() =>
            setMobileMenuOpen(
              false
            )
          }
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
        />
      )}

      <div className="min-w-0 lg:pl-56">
        <TopBar
          onMenuClick={() =>
            setMobileMenuOpen(
              true
            )
          }
        />

        <main className="min-w-0 flex-1 p-4 sm:p-5 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}