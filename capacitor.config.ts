import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.jobclokr.app",
  appName: "JobClokr",

  webDir: "public",

  server: {
    url: "https://www.jobclokr.com",
    cleartext: false,
  },
};

export default config;