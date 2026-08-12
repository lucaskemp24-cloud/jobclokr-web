"use client";

import {
  useEffect,
  useState,
} from "react";

import AppLayout from "@/components/layout/AppLayout";

import {
  applyTheme,
  defaultSettings,
  loadSettings,
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
  onChange: (
    checked: boolean
  ) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-6 rounded-lg border border-slate-200 p-4 dark:border-slate-700">
      <div>
        <p className="font-medium">
          {label}
        </p>

        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
          {description}
        </p>
      </div>

      <input
        type="checkbox"
        checked={checked}
        onChange={(event) =>
          onChange(
            event.target.checked
          )
        }
        className="mt-1 h-5 w-5"
      />
    </label>
  );
}

export default function SettingsPage() {
  const [
    settings,
    setSettings,
  ] =
    useState<CompanySettings>(
      defaultSettings
    );

  const [
    settingsLoaded,
    setSettingsLoaded,
  ] =
    useState(false);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    message,
    setMessage,
  ] =
    useState("");

  const [
    messageType,
    setMessageType,
  ] =
    useState<
      "success" | "error"
    >("success");

  function showMessage(
    text: string,
    type:
      | "success"
      | "error" = "success"
  ) {
    setMessage(text);
    setMessageType(type);

    window.setTimeout(
      () => {
        setMessage("");
      },
      3500
    );
  }

  useEffect(() => {
    let cancelled = false;

    async function loadPageSettings() {
      /*
        Theme and time format stay
        device-specific for now.
      */
      const localSettings =
        loadSettings();

      applyTheme(
        localSettings.theme
      );

      try {
        const response =
          await fetch(
            "/api/settings",
            {
              cache:
                "no-store",
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Unable to load company settings."
          );
        }

        if (cancelled) {
          return;
        }

        setSettings({
          ...localSettings,
          ...data,

          /*
            Keep these two
            device-specific.
          */
          theme:
            localSettings.theme,

          timeFormat:
            localSettings.timeFormat,
        });
      } catch (error) {
        console.error(
          "Settings load failed:",
          error
        );

        if (!cancelled) {
          setSettings(
            localSettings
          );

          showMessage(
            error instanceof Error
              ? error.message
              : "Unable to load company settings.",
            "error"
          );
        }
      } finally {
        if (!cancelled) {
          setSettingsLoaded(
            true
          );
        }
      }
    }

    void loadPageSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  function updateSetting<
    K extends keyof CompanySettings
  >(
    key: K,
    value: CompanySettings[K]
  ) {
    setSettings(
      (
        currentSettings
      ) => ({
        ...currentSettings,
        [key]: value,
      })
    );

    if (
      key === "theme"
    ) {
      applyTheme(
        value as CompanySettings["theme"]
      );
    }
  }

  async function handleSave() {
    if (saving) {
      return;
    }

    setSaving(true);

    try {
      const response =
        await fetch(
          "/api/settings",
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                companyName:
                  settings.companyName,

                phone:
                  settings.phone,

                email:
                  settings.email,

                website:
                  settings.website,

                address:
                  settings.address,

                defaultShiftStart:
                  settings.defaultShiftStart,

                defaultShiftEnd:
                  settings.defaultShiftEnd,

                overtimeThreshold:
                  settings.overtimeThreshold,

                lunchDuration:
                  settings.lunchDuration,

                punchRounding:
                  settings.punchRounding,

                gpsTrackingEnabled:
                  settings.gpsTrackingEnabled,

                allowEmployeePunchEdits:
                  settings.allowEmployeePunchEdits,

                requireClockOutNotes:
                  settings.requireClockOutNotes,

                clockInReminderEnabled:
                  settings.clockInReminderEnabled,

                missedClockOutNotification:
                  settings.missedClockOutNotification,

                overtimeNotification:
                  settings.overtimeNotification,
              }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to save settings."
        );
      }

      const savedSettings: CompanySettings =
        {
          ...settings,
          ...data,

          /*
            Database response
            does not control
            these device settings.
          */
          theme:
            settings.theme,

          timeFormat:
            settings.timeFormat,
        };

      setSettings(
        savedSettings
      );

      /*
        Keep appearance
        preferences available
        on this device.
      */
      saveSettings(
        savedSettings
      );

      applyTheme(
        savedSettings.theme
      );

      showMessage(
        "Settings saved successfully."
      );
    } catch (error) {
      console.error(
        "Settings save failed:",
        error
      );

      showMessage(
        error instanceof Error
          ? error.message
          : "Settings could not be saved.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    const confirmed =
      window.confirm(
        "Reset all settings to their default values?"
      );

    if (!confirmed) {
      return;
    }

    setSaving(true);

    try {
      const resetValues: CompanySettings =
        {
          ...defaultSettings,
        };

      const response =
        await fetch(
          "/api/settings",
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                companyName:
                  resetValues.companyName,

                phone:
                  resetValues.phone,

                email:
                  resetValues.email,

                website:
                  resetValues.website,

                address:
                  resetValues.address,

                defaultShiftStart:
                  resetValues.defaultShiftStart,

                defaultShiftEnd:
                  resetValues.defaultShiftEnd,

                overtimeThreshold:
                  resetValues.overtimeThreshold,

                lunchDuration:
                  resetValues.lunchDuration,

                punchRounding:
                  resetValues.punchRounding,

                gpsTrackingEnabled:
                  resetValues.gpsTrackingEnabled,

                allowEmployeePunchEdits:
                  resetValues.allowEmployeePunchEdits,

                requireClockOutNotes:
                  resetValues.requireClockOutNotes,

                clockInReminderEnabled:
                  resetValues.clockInReminderEnabled,

                missedClockOutNotification:
                  resetValues.missedClockOutNotification,

                overtimeNotification:
                  resetValues.overtimeNotification,
              }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to reset settings."
        );
      }

      const finalSettings: CompanySettings =
        {
          ...resetValues,
          ...data,

          theme:
            resetValues.theme,

          timeFormat:
            resetValues.timeFormat,
        };

      setSettings(
        finalSettings
      );

      saveSettings(
        finalSettings
      );

      applyTheme(
        finalSettings.theme
      );

      showMessage(
        "Settings reset to defaults."
      );
    } catch (error) {
      console.error(
        "Settings reset failed:",
        error
      );

      showMessage(
        error instanceof Error
          ? error.message
          : "Settings could not be reset.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  }

  if (
    !settingsLoaded
  ) {
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
              Configure company,
              timekeeping, and
              employee options.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              void handleSave()
            }
            disabled={saving}
            className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving
              ? "Saving..."
              : "Save Settings"}
          </button>
        </div>

        {message && (
          <div
            className={`rounded-lg border px-4 py-3 ${
              messageType ===
              "success"
                ? "border-green-300 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200"
                : "border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
            }`}
          >
            {message}
          </div>
        )}

        <section
          className={
            sectionClass
          }
        >
          <h2 className="text-2xl font-semibold">
            Company Information
          </h2>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <input
              type="text"
              placeholder="Company Name"
              value={
                settings.companyName
              }
              onChange={(
                event
              ) =>
                updateSetting(
                  "companyName",
                  event.target
                    .value
                )
              }
              className={
                inputClass
              }
            />

            <input
              type="tel"
              placeholder="Phone"
              value={
                settings.phone
              }
              onChange={(
                event
              ) =>
                updateSetting(
                  "phone",
                  event.target
                    .value
                )
              }
              className={
                inputClass
              }
            />

            <input
              type="email"
              placeholder="Email"
              value={
                settings.email
              }
              onChange={(
                event
              ) =>
                updateSetting(
                  "email",
                  event.target
                    .value
                )
              }
              className={
                inputClass
              }
            />

            <input
              type="url"
              placeholder="Website"
              value={
                settings.website
              }
              onChange={(
                event
              ) =>
                updateSetting(
                  "website",
                  event.target
                    .value
                )
              }
              className={
                inputClass
              }
            />

            <input
              type="text"
              placeholder="Company Address"
              value={
                settings.address
              }
              onChange={(
                event
              ) =>
                updateSetting(
                  "address",
                  event.target
                    .value
                )
              }
              className={`${inputClass} md:col-span-2`}
            />
          </div>
        </section>

        <section
          className={
            sectionClass
          }
        >
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
                value={
                  settings.defaultShiftStart
                }
                onChange={(
                  event
                ) =>
                  updateSetting(
                    "defaultShiftStart",
                    event
                      .target
                      .value
                  )
                }
                className={
                  inputClass
                }
              />
            </label>

            <label>
              <span className="mb-1 block text-sm font-medium">
                Default Shift End
              </span>

              <input
                type="time"
                value={
                  settings.defaultShiftEnd
                }
                onChange={(
                  event
                ) =>
                  updateSetting(
                    "defaultShiftEnd",
                    event
                      .target
                      .value
                  )
                }
                className={
                  inputClass
                }
              />
            </label>

            <label>
              <span className="mb-1 block text-sm font-medium">
                Weekly Overtime
                Threshold
              </span>

              <input
                type="number"
                min={0}
                value={
                  settings.overtimeThreshold
                }
                onChange={(
                  event
                ) =>
                  updateSetting(
                    "overtimeThreshold",
                    Number(
                      event
                        .target
                        .value
                    )
                  )
                }
                className={
                  inputClass
                }
              />
            </label>

            <label>
              <span className="mb-1 block text-sm font-medium">
                Lunch Duration
                (minutes)
              </span>

              <input
                type="number"
                min={0}
                value={
                  settings.lunchDuration
                }
                onChange={(
                  event
                ) =>
                  updateSetting(
                    "lunchDuration",
                    Number(
                      event
                        .target
                        .value
                    )
                  )
                }
                className={
                  inputClass
                }
              />
            </label>

            <label className="md:col-span-2">
              <span className="mb-1 block text-sm font-medium">
                Punch Rounding
              </span>

              <select
                value={
                  settings.punchRounding
                }
                onChange={(
                  event
                ) =>
                  updateSetting(
                    "punchRounding",
                    event
                      .target
                      .value as CompanySettings["punchRounding"]
                  )
                }
                className={
                  inputClass
                }
              >
                <option>
                  None
                </option>

                <option>
                  5 Minutes
                </option>

                <option>
                  10 Minutes
                </option>

                <option>
                  15 Minutes
                </option>
              </select>
            </label>
          </div>
        </section>

        <section
          className={
            sectionClass
          }
        >
          <h2 className="text-2xl font-semibold">
            Employee Options
          </h2>

          <div className="mt-5 space-y-3">
            <SettingToggle
              label="Enable GPS tracking"
              description="Allow JobClokr to request location during clock events."
              checked={
                settings.gpsTrackingEnabled
              }
              onChange={(
                checked
              ) =>
                updateSetting(
                  "gpsTrackingEnabled",
                  checked
                )
              }
            />

            <SettingToggle
              label="Allow employees to edit punches"
              description="Employees may request or make corrections to their punches."
              checked={
                settings.allowEmployeePunchEdits
              }
              onChange={(
                checked
              ) =>
                updateSetting(
                  "allowEmployeePunchEdits",
                  checked
                )
              }
            />

            <SettingToggle
              label="Require notes when clocking out"
              description="Employees must enter a work note before clocking out."
              checked={
                settings.requireClockOutNotes
              }
              onChange={(
                checked
              ) =>
                updateSetting(
                  "requireClockOutNotes",
                  checked
                )
              }
            />
          </div>
        </section>

        <section
          className={
            sectionClass
          }
        >
          <h2 className="text-2xl font-semibold">
            Appearance
          </h2>

          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
            Appearance settings
            apply to this device.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <select
              value={
                settings.theme
              }
              onChange={(
                event
              ) =>
                updateSetting(
                  "theme",
                  event
                    .target
                    .value as CompanySettings["theme"]
                )
              }
              className={
                inputClass
              }
            >
              <option>
                Light
              </option>

              <option>
                Dark
              </option>

              <option>
                System
              </option>
            </select>

            <select
              value={
                settings.timeFormat
              }
              onChange={(
                event
              ) =>
                updateSetting(
                  "timeFormat",
                  event
                    .target
                    .value as CompanySettings["timeFormat"]
                )
              }
              className={
                inputClass
              }
            >
              <option>
                12 Hour
              </option>

              <option>
                24 Hour
              </option>
            </select>
          </div>
        </section>

        <section
          className={
            sectionClass
          }
        >
          <h2 className="text-2xl font-semibold">
            Notifications
          </h2>

          <div className="mt-5 space-y-3">
            <SettingToggle
              label="Clock-in reminders"
              description="Enable scheduled clock-in reminders."
              checked={
                settings.clockInReminderEnabled
              }
              onChange={(
                checked
              ) =>
                updateSetting(
                  "clockInReminderEnabled",
                  checked
                )
              }
            />

            <SettingToggle
              label="Missed clock-out alerts"
              description="Enable missed clock-out warnings."
              checked={
                settings.missedClockOutNotification
              }
              onChange={(
                checked
              ) =>
                updateSetting(
                  "missedClockOutNotification",
                  checked
                )
              }
            />

            <SettingToggle
              label="Overtime alerts"
              description="Enable overtime warnings."
              checked={
                settings.overtimeNotification
              }
              onChange={(
                checked
              ) =>
                updateSetting(
                  "overtimeNotification",
                  checked
                )
              }
            />
          </div>
        </section>

        <section
          className={
            sectionClass
          }
        >
          <h2 className="text-2xl font-semibold">
            Settings Management
          </h2>

          <p className="mt-2 text-gray-500 dark:text-slate-400">
            Reset JobClokr
            preferences and
            company settings to
            their default values.
          </p>

          <div className="mt-5">
            <button
              type="button"
              onClick={() =>
                void handleReset()
              }
              disabled={saving}
              className="rounded-lg border border-red-300 px-5 py-3 font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-800 dark:hover:bg-red-950"
            >
              Reset Settings
            </button>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}