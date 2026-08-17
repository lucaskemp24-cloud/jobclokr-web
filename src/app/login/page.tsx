"use client";

import {
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import { useToast } from "@/components/ui/ToastProvider";

import {
  loadAuthUser,
  loginEmployee,
  logoutUser,
  type LoginEmployee,
} from "@/lib/auth";

type LoginResponse = {
  employee: LoginEmployee & {
    mustChangePassword: boolean;
  };

  company: {
    id: number;
    name: string;
    code: string;
  };
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

export default function LoginPage() {
  const router = useRouter();
  const { showToast } = useToast();

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
    let cancelled = false;

    async function checkSession() {
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

        if (cancelled) {
          return;
        }

        const savedUser =
          loadAuthUser();

        if (
          response.ok &&
          data.authenticated &&
          data.user
        ) {
          if (
            savedUser &&
            savedUser.employeeId ===
              data.user.employeeId &&
            savedUser.companyId ===
              data.user.companyId &&
            savedUser.role ===
              data.user.role
          ) {
            if (
              data.user.role ===
              "Employee"
            ) {
              router.replace(
                "/employee-portal"
              );
            } else {
              router.replace("/");
            }

            return;
          }

          logoutUser();
        } else {
          logoutUser();
        }
      } catch (error) {
        console.error(
          "Session check failed:",
          error
        );

        logoutUser();
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
      cancelled = true;
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

    if (!trimmedCompanyCode) {
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
      setSigningIn(true);

      logoutUser();

      const response =
        await fetch(
          "/api/login",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                companyCode:
                  trimmedCompanyCode,

                loginName:
                  trimmedLoginName,

                password,
              }),
          }
        );

      const data =
        (await response.json()) as
          | LoginResponse
          | {
              error?: string;
            };

      if (!response.ok) {
        throw new Error(
          "error" in data &&
            data.error
            ? data.error
            : "Unable to sign in."
        );
      }

      if (
        !(
          "employee" in data
        )
      ) {
        throw new Error(
          "Unable to sign in."
        );
      }

      const user =
        loginEmployee(
          data.employee
        );

      if (!user) {
        throw new Error(
          "Unable to sign in."
        );
      }

      const sessionResponse =
        await fetch(
          "/api/session",
          {
            cache: "no-store",
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
        logoutUser();

        throw new Error(
          "Your login was accepted, but the session could not be saved. Please try again."
        );
      }

      if (
        sessionData.user.employeeId !==
          user.employeeId ||
        sessionData.user.companyId !==
          user.companyId ||
        sessionData.user.role !==
          user.role
      ) {
        logoutUser();

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

      if (
        user.role === "Employee"
      ) {
        router.replace(
          "/employee-portal"
        );
      } else {
        router.replace("/");
      }
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
      setSigningIn(false);
    }
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
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 dark:bg-slate-950">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg dark:bg-slate-900">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">
            JobClokr
          </h1>

          <p className="mt-2 text-slate-500 dark:text-slate-400">
            Sign in to your company
          </p>
        </div>

        <div className="space-y-5">
          <div>
            <label className="mb-2 block font-medium">
              Company Code
            </label>

            <input
              type="text"
              value={companyCode}
              disabled={signingIn}
              onChange={(event) =>
                setCompanyCode(
                  event.target.value
                )
              }
              onKeyDown={(event) => {
                if (
                  event.key ===
                  "Enter"
                ) {
                  void handleLogin();
                }
              }}
              className="w-full rounded-lg border p-3 uppercase dark:bg-slate-950"
              placeholder="Example: LUCAS"
              autoCapitalize="characters"
              autoCorrect="off"
              autoComplete="organization"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Login Name
            </label>

            <input
              type="text"
              value={loginName}
              disabled={signingIn}
              onChange={(event) =>
                setLoginName(
                  event.target.value
                )
              }
              onKeyDown={(event) => {
                if (
                  event.key ===
                  "Enter"
                ) {
                  void handleLogin();
                }
              }}
              className="w-full rounded-lg border p-3 dark:bg-slate-950"
              placeholder="Enter login name"
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
              value={password}
              disabled={signingIn}
              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
              onKeyDown={(event) => {
                if (
                  event.key ===
                  "Enter"
                ) {
                  void handleLogin();
                }
              }}
              className="w-full rounded-lg border p-3 dark:bg-slate-950"
              placeholder="Enter password"
              autoComplete="current-password"
            />
          </div>

          <button
            type="button"
            onClick={() =>
              void handleLogin()
            }
            disabled={signingIn}
            className="w-full rounded-lg bg-blue-600 p-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {signingIn
              ? "Signing In..."
              : "Sign In"}
          </button>

          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            New to JobClokr?{" "}
            <a
              href="/signup"
              className="font-semibold text-blue-600 hover:underline"
            >
              Create Business Account
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}