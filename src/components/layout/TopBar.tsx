"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  loadAuthUser,
  logoutUser,
  type AuthUser,
} from "@/lib/auth";

import {
  applyTheme,
  loadSettings,
  saveSettings,
  SETTINGS_CHANGED_EVENT,
  type CompanySettings,
  type ThemeSetting,
} from "@/lib/settings";

function getThemeIcon(theme: ThemeSetting) {
  if (theme === "Dark") {
    return "☀️";
  }

  if (theme === "Light") {
    return "🌙";
  }

  return "🌓";
}

export default function TopBar() {
  const router = useRouter();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [settings, setSettings] =
    useState<CompanySettings | null>(null);

  useEffect(() => {
    setUser(loadAuthUser());
    setSettings(loadSettings());

    function handleSettingsChange(event: Event) {
      const customEvent =
        event as CustomEvent<CompanySettings>;

      setSettings(
        customEvent.detail ?? loadSettings()
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

  function handleLogout() {
    logoutUser();
    router.push("/login");
    router.refresh();
  }

  function handleThemeToggle() {
    const currentSettings =
      settings ?? loadSettings();

    const nextTheme: ThemeSetting =
      currentSettings.theme === "Dark"
        ? "Light"
        : "Dark";

    const updatedSettings: CompanySettings = {
      ...currentSettings,
      theme: nextTheme,
    };

    setSettings(updatedSettings);
    saveSettings(updatedSettings);
    applyTheme(nextTheme);
  }

  return (
    <header className="flex min-h-16 items-center justify-between border-b border-slate-200 bg-white px-6 transition-colors dark:border-slate-700 dark:bg-slate-900">
      <div>
        <h2 className="text-xl font-semibold">
          {settings?.companyName || "JobClokr"}
        </h2>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleThemeToggle}
          className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Toggle light and dark theme"
          title={`Current theme: ${
            settings?.theme ?? "System"
          }`}
        >
          {getThemeIcon(
            settings?.theme ?? "System"
          )}
        </button>

        <button
          type="button"
          className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Notifications"
        >
          🔔
        </button>

        <div className="text-right">
          <p className="font-medium">
            {user?.name ?? "Not signed in"}
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
            onClick={handleLogout}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Logout
          </button>
        )}
      </div>
    </header>
  );
}