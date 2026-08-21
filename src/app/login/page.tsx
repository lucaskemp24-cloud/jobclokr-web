"use client";

import {
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import { useToast } from "@/components/ui/ToastProvider";

type LoginMode =
  | "company"
  | "admin";

type PlatformAdminLoginResponse = {
  accountType: "PLATFORM_ADMIN";

  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string | null;
    loginName: string;
    active: boolean;
    mustChangePassword: boolean;
    isPlatformAdmin: true;
  };

  company: null;
};

type CompanyLoginResponse = {
  accountType: "COMPANY_USER";

  employee: {
    id: number;
    companyId: number;
    firstName: string;
    lastName: string;

    role:
      | "OWNER"
      | "OFFICE"
      | "FOREMAN"
      | "EMPLOYEE";

    active: boolean;
    isPlatformAdmin: false;
    mustChangePassword: boolean;
  };

  company: {
    id: number;
    name: string;
    code: string;
    subscriptionStatus: string;
  };
};

type SuccessfulLoginResponse =
  | PlatformAdminLoginResponse
  | CompanyLoginResponse;

type PlatformAdminSessionUser = {
  accountType:
    "PLATFORM_ADMIN";

  adminId: number;

  employeeId: null;
  companyId: null;

  name: string;

  role:
    "PlatformAdmin";

  isPlatformAdmin:
    true;
};

type CompanySessionUser = {
  accountType:
    "COMPANY_USER";

  adminId: null;

  employeeId: number;
  companyId: number;

  name: string;

  role:
    | "Owner"
    | "Office"
    | "Employee";

  isPlatformAdmin:
    false;
};

type SessionUser =
  | PlatformAdminSessionUser
  | CompanySessionUser;

type SessionResponse = {
  authenticated: boolean;
  user: SessionUser | null;
};

function isSuccessfulLoginResponse(
  value: unknown
): value is SuccessfulLoginResponse {
  if (
    typeof value !==
      "object" ||
    value === null
  ) {
    return false;
  }

  if (
    !(
      "accountType" in
      value
    )
  ) {
    return false;
  }

  const accountType =
    (
      value as {
        accountType?:
          unknown;
      }
    ).accountType;

  return (
    accountType ===
      "PLATFORM_ADMIN" ||
    accountType ===
      "COMPANY_USER"
  );
}

function getErrorMessage(
  value: unknown
) {
  if (
    typeof value !==
      "object" ||
    value === null ||
    !(
      "error" in value
    )
  ) {
    return null;
  }

  const error =
    (
      value as {
        error?: unknown;
      }
    ).error;

  return typeof error ===
    "string"
    ? error
    : null;
}

export default function LoginPage() {
  const router =
    useRouter();

  const {
    showToast,
  } = useToast();

  const [
    loginMode,
    setLoginMode,
  ] =
    useState<LoginMode>(
      "company"
    );

  const [
    companyCode,
    setCompanyCode,
  ] = useState("");

  const [
    loginName,
    setLoginName,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    signingIn,
    setSigningIn,
  ] = useState(false);

  const [
    checkingSession,
    setCheckingSession,
  ] = useState(true);

  useEffect(() => {
    let cancelled =
      false;

    async function checkSession() {
      try {
        const response =
          await fetch(
            "/api/session",
            {
              cache:
                "no-store",
            }
          );

        if (
          !response.ok
        ) {
          return;
        }

        const data =
          (await response.json()) as
            SessionResponse;

        if (
          cancelled ||
          !data.authenticated ||
          !data.user
        ) {
          return;
        }

        /*
          PLATFORM ADMIN
        */
        if (
          data.user.accountType ===
          "PLATFORM_ADMIN"
        ) {
          router.replace(
            "/admin"
          );

          return;
        }

        /*
          EMPLOYEE
        */
        if (
          data.user.role ===
          "Employee"
        ) {
          router.replace(
            "/employee-portal"
          );

          return;
        }

        /*
          OWNER / OFFICE
        */
        router.replace(
          "/"
        );
      } catch (error) {
        console.error(
          "Session check failed:",
          error
        );
      } finally {
        if (!cancelled) {
          setCheckingSession(
            false
          );
        }
      }
    }

    void checkSession();

    return () => {
      cancelled =
        true;
    };
  }, [router]);

  async function handleLogin() {
    const trimmedCompanyCode =
      companyCode
        .trim()
        .toUpperCase();

    const trimmedLoginName =
      loginName
        .trim()
        .toLowerCase();

    if (
      loginMode ===
        "company" &&
      !trimmedCompanyCode
    ) {
      showToast(
        "Please enter your company code.",
        "error"
      );

      return;
    }

    if (!trimmedLoginName) {
      showToast(
        "Please enter your login name.",
        "error"
      );

      return;
    }

    if (!password) {
      showToast(
        "Please enter your password.",
        "error"
      );

      return;
    }

    try {
      setSigningIn(
        true
      );

      const response =
        await fetch(
          "/api/login",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                companyCode:
                  loginMode ===
                  "company"
                    ? trimmedCompanyCode
                    : "",

                loginName:
                  trimmedLoginName,

                password,
              }),
          }
        );

      const rawData:
        unknown =
        await response.json();

      if (
        !response.ok
      ) {
        throw new Error(
          getErrorMessage(
            rawData
          ) ||
            "Unable to sign in."
        );
      }

      if (
        !isSuccessfulLoginResponse(
          rawData
        )
      ) {
        throw new Error(
          "Unable to sign in."
        );
      }

      const data =
        rawData;

      /*
        Verify that the server actually
        created the correct session.
      */
      const sessionResponse =
        await fetch(
          "/api/session",
          {
            cache:
              "no-store",
          }
        );

      const sessionData =
        (await sessionResponse.json()) as
          SessionResponse;

      if (
        !sessionResponse.ok ||
        !sessionData.authenticated ||
        !sessionData.user
      ) {
        throw new Error(
          "Your login was accepted, but the session could not be saved. Please try again."
        );
      }

      /*
        PLATFORM ADMIN
      */
      if (
        data.accountType ===
        "PLATFORM_ADMIN"
      ) {
        if (
          sessionData.user.accountType !==
          "PLATFORM_ADMIN"
        ) {
          throw new Error(
            "The administrator session could not be verified."
          );
        }

        if (
          sessionData.user.adminId !==
          data.user.id
        ) {
          throw new Error(
            "The administrator session did not match the signed-in account."
          );
        }

        if (
          data.user
            .mustChangePassword
        ) {
          router.replace(
            "/change-password"
          );

          return;
        }

        /*
          Platform admins go to the
          JobClokr administration area.
        */
        router.replace(
          "/admin"
        );

        return;
      }

      /*
        COMPANY USER
      */
      if (
        sessionData.user.accountType !==
        "COMPANY_USER"
      ) {
        throw new Error(
          "The company session could not be verified."
        );
      }

      if (
        sessionData.user.employeeId !==
          data.employee.id ||
        sessionData.user.companyId !==
          data.employee.companyId
      ) {
        throw new Error(
          "The saved session did not match the selected company. Please sign in again."
        );
      }

      if (
        data.employee
          .mustChangePassword
      ) {
        router.replace(
          "/change-password"
        );

        return;
      }

      /*
        REGULAR EMPLOYEE
      */
      if (
        sessionData.user.role ===
        "Employee"
      ) {
        router.replace(
          "/employee-portal"
        );

        return;
      }

      /*
        OWNER / OFFICE
      */
      router.replace(
        "/"
      );
    } catch (error) {
      console.error(
        "Login failed:",
        error
      );

      showToast(
        error instanceof Error
          ? error.message
          : "Unable to sign in.",
        "error"
      );
    } finally {
      setSigningIn(
        false
      );
    }
  }

  function selectLoginMode(
    mode: LoginMode
  ) {
    if (signingIn) {
      return;
    }

    setLoginMode(
      mode
    );

    setPassword(
      ""
    );
  }

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 dark:bg-slate-950">
        <div className="rounded-xl bg-white px-8 py-6 text-slate-500 shadow dark:bg-slate-900 dark:text-slate-300">
          Checking session...
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10 dark:bg-slate-950">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg dark:bg-slate-900">
        <div className="mb-7 text-center">
          <h1 className="text-3xl font-bold">
            JobClokr
          </h1>

          <p className="mt-2 text-slate-500 dark:text-slate-400">
            {loginMode ===
            "company"
              ? "Sign in to your company"
              : "JobClokr administration"}
          </p>
        </div>

        <div className="mb-7 grid grid-cols-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          <button
            type="button"
            disabled={
              signingIn
            }
            onClick={() =>
              selectLoginMode(
                "company"
              )
            }
            className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
              loginMode ===
              "company"
                ? "bg-white shadow dark:bg-slate-700"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            Company Login
          </button>

          <button
            type="button"
            disabled={
              signingIn
            }
            onClick={() =>
              selectLoginMode(
                "admin"
              )
            }
            className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
              loginMode ===
              "admin"
                ? "bg-white shadow dark:bg-slate-700"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            Admin Login
          </button>
        </div>

        <div className="space-y-5">
          {loginMode ===
            "company" && (
            <div>
              <label className="mb-2 block font-medium">
                Company Code
              </label>

              <input
                type="text"
                value={
                  companyCode
                }
                disabled={
                  signingIn
                }
                onChange={(
                  event
                ) =>
                  setCompanyCode(
                    event.target
                      .value
                  )
                }
                onKeyDown={(
                  event
                ) => {
                  if (
                    event.key ===
                    "Enter"
                  ) {
                    void handleLogin();
                  }
                }}
                className="w-full rounded-lg border border-slate-300 p-3 uppercase outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:border-blue-500 dark:focus:ring-blue-950"
                placeholder="Example: LUCAS"
                autoCapitalize="characters"
                autoCorrect="off"
                autoComplete="organization"
              />
            </div>
          )}

          <div>
            <label className="mb-2 block font-medium">
              Login Name
            </label>

            <input
              type="text"
              value={
                loginName
              }
              disabled={
                signingIn
              }
              onChange={(
                event
              ) =>
                setLoginName(
                  event.target
                    .value
                )
              }
              onKeyDown={(
                event
              ) => {
                if (
                  event.key ===
                  "Enter"
                ) {
                  void handleLogin();
                }
              }}
              className="w-full rounded-lg border border-slate-300 p-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:border-blue-500 dark:focus:ring-blue-950"
              placeholder={
                loginMode ===
                "admin"
                  ? "Admin login name"
                  : "Enter login name"
              }
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="username"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Password
            </label>

            <input
              type="password"
              value={
                password
              }
              disabled={
                signingIn
              }
              onChange={(
                event
              ) =>
                setPassword(
                  event.target
                    .value
                )
              }
              onKeyDown={(
                event
              ) => {
                if (
                  event.key ===
                    "Enter"
                ) {
                  void handleLogin();
                }
              }}
              className="w-full rounded-lg border border-slate-300 p-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:border-blue-500 dark:focus:ring-blue-950"
              placeholder="Enter password"
              autoComplete="current-password"
            />
          </div>

          <button
            type="button"
            onClick={() =>
              void handleLogin()
            }
            disabled={
              signingIn
            }
            className="w-full rounded-lg bg-blue-600 p-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {signingIn
              ? "Signing In..."
              : loginMode ===
                  "admin"
                ? "Sign In as Admin"
                : "Sign In"}
          </button>

          <div className="text-center text-sm text-slate-500 dark:text-slate-400">
            <p>
              {loginMode ===
              "company"
                ? "Need a JobClokr account? Contact JobClokr administration."
                : "Platform administrator access only."}
            </p>

            <p className="mt-3">
              Need help?{" "}
              <a
                href="/support"
                className="font-semibold text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
              >
                Visit JobClokr Support
              </a>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}