"use client";

import {
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { Capacitor } from "@capacitor/core";

import {
  logoutUser,
} from "@/lib/auth";

import {
  applyTheme,
  loadSettings,
  saveSettings,
  SETTINGS_CHANGED_EVENT,
  type CompanySettings,
  type ThemeSetting,
} from "@/lib/settings";

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

type TopBarProps = {
  onMenuClick?: () => void;
};

function getThemeIcon(
  theme: ThemeSetting
) {
  if (theme === "Dark") {
    return "☀️";
  }

  if (theme === "Light") {
    return "🌙";
  }

  return "🌓";
}

export default function TopBar({
  onMenuClick,
}: TopBarProps) {
  const router = useRouter();

  const [
    user,
    setUser,
  ] = useState<SessionUser | null>(
    null
  );

  const [
    settings,
    setSettings,
  ] = useState<CompanySettings | null>(
    null
  );

  const [
    isNativeIOS,
    setIsNativeIOS,
  ] = useState(false);

  useEffect(() => {
    setIsNativeIOS(
      Capacitor.isNativePlatform() &&
        Capacitor.getPlatform() ===
          "ios"
    );

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
          response.ok &&
          data.authenticated &&
          data.user
        ) {
          setUser(
            data.user
          );
        } else {
          setUser(
            null
          );
        }
      } catch (error) {
        console.error(
          "Top bar session load failed:",
          error
        );

        setUser(
          null
        );
      }
    }

    void loadSessionUser();

    setSettings(
      loadSettings()
    );

    function handleSettingsChange(
      event: Event
    ) {
      const customEvent =
        event as CustomEvent<CompanySettings>;

      setSettings(
        customEvent.detail ??
          loadSettings()
      );
    }

    window.addEventListener(
      SETTINGS_CHANGED_EVENT,
      handleSettingsChange
    );

    return () => {
      window.removeEventListener(
        SETTINGS_CHANGED_EVENT,
        handleSettingsChange
      );
    };
  }, []);

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

    router.replace(
      "/login"
    );

    router.refresh();
  }

  function handleThemeToggle() {
    const currentSettings =
      settings ??
      loadSettings();

    const nextTheme:
      ThemeSetting =
      currentSettings.theme ===
      "Dark"
        ? "Light"
        : "Dark";

    const updatedSettings:
      CompanySettings = {
      ...currentSettings,
      theme: nextTheme,
    };

    setSettings(
      updatedSettings
    );

    saveSettings(
      updatedSettings
    );

    applyTheme(
      nextTheme
    );
  }

  return (
    <header
      className={`
        sticky
        top-0
        z-50
        border-b
        border-slate-200
        bg-white
        transition-colors
        dark:border-slate-700
        dark:bg-slate-900
        ${
          isNativeIOS
            ? "pt-8"
            : ""
        }
      `}
    >
      <div
        className="
          flex
          min-h-16
          items-center
          justify-between
          gap-3
          px-4
          sm:px-5
          lg:px-6
        "
      >
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => {
              onMenuClick?.();
            }}
            className="
              relative
              z-50
              flex
              h-10
              w-10
              shrink-0
              touch-manipulation
              items-center
              justify-center
              rounded-lg
              border
              border-slate-200
              text-xl
              hover:bg-slate-100
              active:bg-slate-200
              dark:border-slate-700
              dark:hover:bg-slate-800
              dark:active:bg-slate-700
              lg:hidden
            "
            aria-label="Open navigation menu"
          >
            ☰
          </button>

          <h2 className="truncate text-base font-semibold sm:text-lg lg:text-xl">
            {settings?.companyName ||
              "JobClokr"}
          </h2>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2 lg:gap-4">
          <button
            type="button"
            onClick={
              handleThemeToggle
            }
            className="
              flex
              h-10
              w-10
              touch-manipulation
              items-center
              justify-center
              rounded-lg
              hover:bg-slate-100
              active:bg-slate-200
              dark:hover:bg-slate-800
              dark:active:bg-slate-700
            "
            aria-label="Toggle light and dark theme"
            title={`Current theme: ${
              settings?.theme ??
              "System"
            }`}
          >
            {getThemeIcon(
              settings?.theme ??
                "System"
            )}
          </button>

          <button
            type="button"
            className="
              hidden
              h-10
              w-10
              items-center
              justify-center
              rounded-lg
              hover:bg-slate-100
              dark:hover:bg-slate-800
              sm:flex
            "
            aria-label="Notifications"
          >
            🔔
          </button>

          <div className="hidden text-right md:block">
            <p className="max-w-40 truncate font-medium">
              {user?.name ??
                "Not signed in"}
            </p>

            {user && (
              <p className="text-xs text-gray-500 dark:text-slate-400">
                {user.role}
              </p>
            )}
          </div>

          {user && (
            <button
              type="button"
              onClick={() =>
                void handleLogout()
              }
              className="
                touch-manipulation
                rounded-lg
                bg-red-600
                px-3
                py-2
                text-sm
                font-medium
                text-white
                hover:bg-red-700
                active:bg-red-800
                sm:px-4
              "
            >
              <span className="sm:hidden">
                Exit
              </span>

              <span className="hidden sm:inline">
                Logout
              </span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}