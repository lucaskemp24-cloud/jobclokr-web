export type ThemeSetting = "Light" | "Dark" | "System";

export type CompanySettings = {
  companyName: string;
  address: string;
  phone: string;
  email: string;
  website: string;

  defaultShiftStart: string;
  defaultShiftEnd: string;
  overtimeThreshold: number;
  lunchDuration: number;
  punchRounding:
    | "None"
    | "5 Minutes"
    | "10 Minutes"
    | "15 Minutes";

  gpsTrackingEnabled: boolean;
  allowEmployeePunchEdits: boolean;
  requireClockOutNotes: boolean;

  theme: ThemeSetting;
  timeFormat: "12 Hour" | "24 Hour";

  clockInReminderEnabled: boolean;
  missedClockOutNotification: boolean;
  overtimeNotification: boolean;
};

export const SETTINGS_STORAGE_KEY = "jobclokr-settings";
export const SETTINGS_CHANGED_EVENT = "jobclokr-settings-changed";

export const defaultSettings: CompanySettings = {
  companyName: "Lucas Communications",
  address: "",
  phone: "",
  email: "",
  website: "",

  defaultShiftStart: "07:00",
  defaultShiftEnd: "15:30",
  overtimeThreshold: 40,
  lunchDuration: 30,
  punchRounding: "None",

  gpsTrackingEnabled: false,
  allowEmployeePunchEdits: false,
  requireClockOutNotes: false,

  theme: "System",
  timeFormat: "12 Hour",

  clockInReminderEnabled: false,
  missedClockOutNotification: true,
  overtimeNotification: true,
};

export function loadSettings(): CompanySettings {
  if (typeof window === "undefined") {
    return defaultSettings;
  }

  const savedSettings = window.localStorage.getItem(
    SETTINGS_STORAGE_KEY
  );

  if (!savedSettings) {
    return defaultSettings;
  }

  try {
    return {
      ...defaultSettings,
      ...(JSON.parse(savedSettings) as Partial<CompanySettings>),
    };
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(settings: CompanySettings): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    SETTINGS_STORAGE_KEY,
    JSON.stringify(settings)
  );

  window.dispatchEvent(
    new CustomEvent(SETTINGS_CHANGED_EVENT, {
      detail: settings,
    })
  );
}

export function resetSettings(): CompanySettings {
  const settings = { ...defaultSettings };
  saveSettings(settings);
  return settings;
}

export function applyTheme(theme: ThemeSetting): void {
  if (typeof window === "undefined") {
    return;
  }

  const systemUsesDark = window.matchMedia(
    "(prefers-color-scheme: dark)"
  ).matches;

  const useDark =
    theme === "Dark" ||
    (theme === "System" && systemUsesDark);

  document.documentElement.classList.toggle("dark", useDark);
  document.documentElement.style.colorScheme = useDark
    ? "dark"
    : "light";
}

export function applySavedTheme(): void {
  applyTheme(loadSettings().theme);
}

export function formatConfiguredTime(
  dateValue: string | Date
): string {
  const settings = loadSettings();

  return new Date(dateValue).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    hour12: settings.timeFormat === "12 Hour",
  });
}