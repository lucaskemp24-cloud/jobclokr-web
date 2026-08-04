"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import AppLayout from "@/components/layout/AppLayout";

import {
  applyTheme,
  defaultSettings,
  loadSettings,
  resetSettings,
  saveSettings,
  type CompanySettings,
} from "@/lib/settings";

function SettingToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-6 rounded-lg border border-slate-200 p-4 dark:border-slate-700">
      <div>
        <p className="font-medium">{label}</p>

        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
          {description}
        </p>
      </div>

      <input
        type="checkbox"
        checked={checked}
        onChange={(event) =>
          onChange(event.target.checked)
        }
        className="mt-1 h-5 w-5"
      />
    </label>
  );
}

export default function SettingsPage() {
  const importInputRef =
    useRef<HTMLInputElement | null>(null);

  const [settings, setSettings] =
    useState<CompanySettings>(defaultSettings);

  const [settingsLoaded, setSettingsLoaded] =
    useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] =
    useState<"success" | "error">("success");

  useEffect(() => {
    const loadedSettings = loadSettings();

    setSettings(loadedSettings);
    applyTheme(loadedSettings.theme);
    setSettingsLoaded(true);
  }, []);

  function showMessage(
    text: string,
    type: "success" | "error" = "success"
  ) {
    setMessage(text);
    setMessageType(type);

    window.setTimeout(() => {
      setMessage("");
    }, 3500);
  }

  function updateSetting<
    K extends keyof CompanySettings
  >(
    key: K,
    value: CompanySettings[K]
  ) {
    setSettings((currentSettings) => ({
      ...currentSettings,
      [key]: value,
    }));

    if (key === "theme") {
      applyTheme(value as CompanySettings["theme"]);
    }
  }

  function handleSave() {
    saveSettings(settings);
    applyTheme(settings.theme);
    showMessage("Settings saved successfully.");
  }

  function handleReset() {
    const confirmed = window.confirm(
      "Reset all settings to their default values?"
    );

    if (!confirmed) {
      return;
    }

    const resetValues = resetSettings();

    setSettings(resetValues);
    applyTheme(resetValues.theme);
    showMessage("Settings reset to defaults.");
  }

  function handleExportData() {
    try {
      const backup = {
        version: 1,
        exportedAt: new Date().toISOString(),
        settings: loadSettings(),
        employees: JSON.parse(
          window.localStorage.getItem(
            "jobclokr-employees"
          ) ?? "[]"
        ),
        projects: JSON.parse(
          window.localStorage.getItem(
            "jobclokr-projects"
          ) ?? "[]"
        ),
        customers: JSON.parse(
          window.localStorage.getItem(
            "jobclokr-customers"
          ) ?? "[]"
        ),
        schedule: JSON.parse(
          window.localStorage.getItem(
            "jobclokr-schedule"
          ) ?? "[]"
        ),
        timeEntries: JSON.parse(
          window.localStorage.getItem(
            "jobclokr-time-entries"
          ) ?? "[]"
        ),
      };

      const file = new Blob(
        [JSON.stringify(backup, null, 2)],
        {
          type: "application/json",
        }
      );

      const url = URL.createObjectURL(file);
      const link = document.createElement("a");

      link.href = url;
      link.download = `jobclokr-backup-${new Date()
        .toISOString()
        .slice(0, 10)}.json`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);

      showMessage("Backup exported successfully.");
    } catch {
      showMessage(
        "Unable to export the backup.",
        "error"
      );
    }
  }

  async function handleImportFile(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const text = await file.text();

      const backup = JSON.parse(text) as {
        settings?: Partial<CompanySettings>;
        employees?: unknown[];
        projects?: unknown[];
        customers?: unknown[];
        schedule?: unknown[];
        timeEntries?: unknown[];
      };

      const confirmed = window.confirm(
        "Importing this backup will replace your current local JobClokr data. Continue?"
      );

      if (!confirmed) {
        event.target.value = "";
        return;
      }

      if (backup.employees) {
        window.localStorage.setItem(
          "jobclokr-employees",
          JSON.stringify(backup.employees)
        );
      }

      if (backup.projects) {
        window.localStorage.setItem(
          "jobclokr-projects",
          JSON.stringify(backup.projects)
        );
      }

      if (backup.customers) {
        window.localStorage.setItem(
          "jobclokr-customers",
          JSON.stringify(backup.customers)
        );
      }

      if (backup.schedule) {
        window.localStorage.setItem(
          "jobclokr-schedule",
          JSON.stringify(backup.schedule)
        );
      }

      if (backup.timeEntries) {
        window.localStorage.setItem(
          "jobclokr-time-entries",
          JSON.stringify(backup.timeEntries)
        );
      }

      const importedSettings: CompanySettings = {
        ...defaultSettings,
        ...(backup.settings ?? {}),
      };

      saveSettings(importedSettings);
      applyTheme(importedSettings.theme);
      setSettings(importedSettings);

      showMessage(
        "Backup imported successfully. Refreshing..."
      );

      window.setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch {
      showMessage(
        "That file is not a valid JobClokr backup.",
        "error"
      );
    } finally {
      event.target.value = "";
    }
  }

  if (!settingsLoaded) {
    return (
      <AppLayout>
        <p className="text-gray-500 dark:text-slate-400">
          Loading settings...
        </p>
      </AppLayout>
    );
  }

  const sectionClass =
    "rounded-xl bg-white p-6 shadow transition-colors dark:bg-slate-900";

  const inputClass =
    "w-full rounded-lg border border-slate-300 bg-white p-3 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-bold">
              Settings
            </h1>

            <p className="mt-1 text-gray-500 dark:text-slate-400">
              Configure company, timekeeping, and employee options.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSave}
            className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700"
          >
            Save Settings
          </button>
        </div>

        {message && (
          <div
            className={`rounded-lg border px-4 py-3 ${
              messageType === "success"
                ? "border-green-300 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200"
                : "border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
            }`}
          >
            {message}
          </div>
        )}

        <section className={sectionClass}>
          <h2 className="text-2xl font-semibold">
            Company Information
          </h2>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <input
              type="text"
              placeholder="Company Name"
              value={settings.companyName}
              onChange={(event) =>
                updateSetting(
                  "companyName",
                  event.target.value
                )
              }
              className={inputClass}
            />

            <input
              type="tel"
              placeholder="Phone"
              value={settings.phone}
              onChange={(event) =>
                updateSetting(
                  "phone",
                  event.target.value
                )
              }
              className={inputClass}
            />

            <input
              type="email"
              placeholder="Email"
              value={settings.email}
              onChange={(event) =>
                updateSetting(
                  "email",
                  event.target.value
                )
              }
              className={inputClass}
            />

            <input
              type="url"
              placeholder="Website"
              value={settings.website}
              onChange={(event) =>
                updateSetting(
                  "website",
                  event.target.value
                )
              }
              className={inputClass}
            />

            <input
              type="text"
              placeholder="Company Address"
              value={settings.address}
              onChange={(event) =>
                updateSetting(
                  "address",
                  event.target.value
                )
              }
              className={`${inputClass} md:col-span-2`}
            />
          </div>
        </section>

        <section className={sectionClass}>
          <h2 className="text-2xl font-semibold">
            Time Tracking
          </h2>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <label>
              <span className="mb-1 block text-sm font-medium">
                Default Shift Start
              </span>

              <input
                type="time"
                value={settings.defaultShiftStart}
                onChange={(event) =>
                  updateSetting(
                    "defaultShiftStart",
                    event.target.value
                  )
                }
                className={inputClass}
              />
            </label>

            <label>
              <span className="mb-1 block text-sm font-medium">
                Default Shift End
              </span>

              <input
                type="time"
                value={settings.defaultShiftEnd}
                onChange={(event) =>
                  updateSetting(
                    "defaultShiftEnd",
                    event.target.value
                  )
                }
                className={inputClass}
              />
            </label>

            <label>
              <span className="mb-1 block text-sm font-medium">
                Weekly Overtime Threshold
              </span>

              <input
                type="number"
                min={0}
                value={settings.overtimeThreshold}
                onChange={(event) =>
                  updateSetting(
                    "overtimeThreshold",
                    Number(event.target.value)
                  )
                }
                className={inputClass}
              />
            </label>

            <label>
              <span className="mb-1 block text-sm font-medium">
                Lunch Duration (minutes)
              </span>

              <input
                type="number"
                min={0}
                value={settings.lunchDuration}
                onChange={(event) =>
                  updateSetting(
                    "lunchDuration",
                    Number(event.target.value)
                  )
                }
                className={inputClass}
              />
            </label>

            <label className="md:col-span-2">
              <span className="mb-1 block text-sm font-medium">
                Punch Rounding
              </span>

              <select
                value={settings.punchRounding}
                onChange={(event) =>
                  updateSetting(
                    "punchRounding",
                    event.target
                      .value as CompanySettings["punchRounding"]
                  )
                }
                className={inputClass}
              >
                <option>None</option>
                <option>5 Minutes</option>
                <option>10 Minutes</option>
                <option>15 Minutes</option>
              </select>
            </label>
          </div>
        </section>

        <section className={sectionClass}>
          <h2 className="text-2xl font-semibold">
            Employee Options
          </h2>

          <div className="mt-5 space-y-3">
            <SettingToggle
              label="Enable GPS tracking"
              description="Allow JobClokr to request location during clock events."
              checked={settings.gpsTrackingEnabled}
              onChange={(checked) =>
                updateSetting(
                  "gpsTrackingEnabled",
                  checked
                )
              }
            />

            <SettingToggle
              label="Allow employees to edit punches"
              description="Employees may request or make corrections to their punches."
              checked={settings.allowEmployeePunchEdits}
              onChange={(checked) =>
                updateSetting(
                  "allowEmployeePunchEdits",
                  checked
                )
              }
            />

            <SettingToggle
              label="Require notes when clocking out"
              description="Employees must enter a work note before clocking out."
              checked={settings.requireClockOutNotes}
              onChange={(checked) =>
                updateSetting(
                  "requireClockOutNotes",
                  checked
                )
              }
            />
          </div>
        </section>

        <section className={sectionClass}>
          <h2 className="text-2xl font-semibold">
            Appearance
          </h2>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <select
              value={settings.theme}
              onChange={(event) =>
                updateSetting(
                  "theme",
                  event.target
                    .value as CompanySettings["theme"]
                )
              }
              className={inputClass}
            >
              <option>Light</option>
              <option>Dark</option>
              <option>System</option>
            </select>

            <select
              value={settings.timeFormat}
              onChange={(event) =>
                updateSetting(
                  "timeFormat",
                  event.target
                    .value as CompanySettings["timeFormat"]
                )
              }
              className={inputClass}
            >
              <option>12 Hour</option>
              <option>24 Hour</option>
            </select>
          </div>
        </section>

        <section className={sectionClass}>
          <h2 className="text-2xl font-semibold">
            Notifications
          </h2>

          <div className="mt-5 space-y-3">
            <SettingToggle
              label="Clock-in reminders"
              description="Save the preference for scheduled clock-in reminders."
              checked={settings.clockInReminderEnabled}
              onChange={(checked) =>
                updateSetting(
                  "clockInReminderEnabled",
                  checked
                )
              }
            />

            <SettingToggle
              label="Missed clock-out alerts"
              description="Save the preference for missed clock-out warnings."
              checked={settings.missedClockOutNotification}
              onChange={(checked) =>
                updateSetting(
                  "missedClockOutNotification",
                  checked
                )
              }
            />

            <SettingToggle
              label="Overtime alerts"
              description="Save the preference for overtime warnings."
              checked={settings.overtimeNotification}
              onChange={(checked) =>
                updateSetting(
                  "overtimeNotification",
                  checked
                )
              }
            />
          </div>
        </section>

        <section className={sectionClass}>
          <h2 className="text-2xl font-semibold">
            Data Management
          </h2>

          <p className="mt-2 text-gray-500 dark:text-slate-400">
            Export or restore the browser&apos;s local JobClokr data.
          </p>

          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleImportFile}
            className="hidden"
          />

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleExportData}
              className="rounded-lg bg-slate-800 px-5 py-3 font-medium text-white hover:bg-slate-900"
            >
              Export Backup
            </button>

            <button
              type="button"
              onClick={() =>
                importInputRef.current?.click()
              }
              className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700"
            >
              Import Backup
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="rounded-lg border border-red-300 px-5 py-3 font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950"
            >
              Reset Settings
            </button>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}