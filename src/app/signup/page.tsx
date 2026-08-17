"use client";

import {
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useToast } from "@/components/ui/ToastProvider";

import {
  loginEmployee,
  logoutUser,
  type LoginEmployee,
} from "@/lib/auth";

type SignupResponse = {
  company: {
    id: number;
    name: string;
    code: string;
  };

  employee: LoginEmployee & {
    mustChangePassword: boolean;
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

function makeSuggestedCompanyCode(
  companyName: string
) {
  return companyName
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 20);
}

export default function SignupPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [
    companyName,
    setCompanyName,
  ] = useState("");

  const [
    companyCode,
    setCompanyCode,
  ] = useState("");

  const [
    companyCodeEdited,
    setCompanyCodeEdited,
  ] = useState(false);

  const [
    firstName,
    setFirstName,
  ] = useState("");

  const [
    lastName,
    setLastName,
  ] = useState("");

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    phone,
    setPhone,
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
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    creatingAccount,
    setCreatingAccount,
  ] = useState(false);

  function handleCompanyNameChange(
    value: string
  ) {
    setCompanyName(value);

    if (!companyCodeEdited) {
      setCompanyCode(
        makeSuggestedCompanyCode(
          value
        )
      );
    }
  }

  function handleCompanyCodeChange(
    value: string
  ) {
    setCompanyCodeEdited(true);

    setCompanyCode(
      value
        .toUpperCase()
        .replace(
          /[^A-Z0-9]/g,
          ""
        )
        .slice(0, 20)
    );
  }

  async function handleSignup() {
    const trimmedCompanyName =
      companyName.trim();

    const trimmedCompanyCode =
      companyCode
        .trim()
        .toUpperCase();

    const trimmedFirstName =
      firstName.trim();

    const trimmedLastName =
      lastName.trim();

    const trimmedEmail =
      email
        .trim()
        .toLowerCase();

    const trimmedPhone =
      phone.trim();

    const trimmedLoginName =
      loginName
        .trim()
        .toLowerCase();

    if (!trimmedCompanyName) {
      showToast(
        "Please enter your company name.",
        "error"
      );

      return;
    }

    if (
      trimmedCompanyCode.length <
      3
    ) {
      showToast(
        "Company code must be at least 3 characters.",
        "error"
      );

      return;
    }

    if (
      !trimmedFirstName ||
      !trimmedLastName
    ) {
      showToast(
        "Please enter your first and last name.",
        "error"
      );

      return;
    }

    if (!trimmedEmail) {
      showToast(
        "Please enter your email address.",
        "error"
      );

      return;
    }

    if (
      trimmedLoginName.length <
      3
    ) {
      showToast(
        "Login name must be at least 3 characters.",
        "error"
      );

      return;
    }

    if (
      password.length < 8
    ) {
      showToast(
        "Password must be at least 8 characters.",
        "error"
      );

      return;
    }

    if (
      password !==
      confirmPassword
    ) {
      showToast(
        "Passwords do not match.",
        "error"
      );

      return;
    }

    try {
      setCreatingAccount(true);

      logoutUser();

      const response =
        await fetch(
          "/api/signup",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                companyName:
                  trimmedCompanyName,

                companyCode:
                  trimmedCompanyCode,

                firstName:
                  trimmedFirstName,

                lastName:
                  trimmedLastName,

                email:
                  trimmedEmail,

                phone:
                  trimmedPhone,

                loginName:
                  trimmedLoginName,

                password,
              }),
          }
        );

      const data =
        (await response.json()) as
          | SignupResponse
          | {
              error?: string;
            };

      if (!response.ok) {
        throw new Error(
          "error" in data &&
            data.error
            ? data.error
            : "Unable to create your account."
        );
      }

      if (
        !(
          "employee" in data
        )
      ) {
        throw new Error(
          "Unable to create your account."
        );
      }

      const user =
        loginEmployee(
          data.employee
        );

      if (!user) {
        throw new Error(
          "Your business was created, but JobClokr could not save your login."
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
          "Your business was created, but the login session could not be saved."
        );
      }

      if (
        sessionData.user.employeeId !==
          user.employeeId ||
        sessionData.user.companyId !==
          user.companyId
      ) {
        logoutUser();

        throw new Error(
          "The saved session did not match the new business account."
        );
      }

      showToast(
        "Your JobClokr business account has been created.",
        "success"
      );

      router.replace("/");
    } catch (error) {
      console.error(
        "Signup failed:",
        error
      );

      showToast(
        error instanceof Error
          ? error.message
          : "Unable to create your account.",
        "error"
      );
    } finally {
      setCreatingAccount(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 dark:bg-slate-950">
      <div className="mx-auto w-full max-w-2xl rounded-2xl bg-white p-8 shadow-lg dark:bg-slate-900">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">
            Create your JobClokr account
          </h1>

          <p className="mt-2 text-slate-500 dark:text-slate-400">
            Set up your business and owner account.
          </p>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="mb-4 text-xl font-semibold">
              Business Information
            </h2>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block font-medium">
                  Company Name
                </label>

                <input
                  type="text"
                  value={companyName}
                  disabled={
                    creatingAccount
                  }
                  onChange={(
                    event
                  ) =>
                    handleCompanyNameChange(
                      event
                        .target
                        .value
                    )
                  }
                  className="w-full rounded-lg border p-3 dark:bg-slate-950"
                  placeholder="ABC Electric"
                  autoComplete="organization"
                />
              </div>

              <div>
                <label className="mb-2 block font-medium">
                  Company Code
                </label>

                <input
                  type="text"
                  value={companyCode}
                  disabled={
                    creatingAccount
                  }
                  onChange={(
                    event
                  ) =>
                    handleCompanyCodeChange(
                      event
                        .target
                        .value
                    )
                  }
                  className="w-full rounded-lg border p-3 uppercase dark:bg-slate-950"
                  placeholder="ABCELECTRIC"
                  autoCapitalize="characters"
                  autoCorrect="off"
                />

                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Employees will use this code when signing in.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold">
              Owner Information
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block font-medium">
                  First Name
                </label>

                <input
                  type="text"
                  value={firstName}
                  disabled={
                    creatingAccount
                  }
                  onChange={(
                    event
                  ) =>
                    setFirstName(
                      event
                        .target
                        .value
                    )
                  }
                  className="w-full rounded-lg border p-3 dark:bg-slate-950"
                  placeholder="John"
                  autoComplete="given-name"
                />
              </div>

              <div>
                <label className="mb-2 block font-medium">
                  Last Name
                </label>

                <input
                  type="text"
                  value={lastName}
                  disabled={
                    creatingAccount
                  }
                  onChange={(
                    event
                  ) =>
                    setLastName(
                      event
                        .target
                        .value
                    )
                  }
                  className="w-full rounded-lg border p-3 dark:bg-slate-950"
                  placeholder="Smith"
                  autoComplete="family-name"
                />
              </div>

              <div>
                <label className="mb-2 block font-medium">
                  Email
                </label>

                <input
                  type="email"
                  value={email}
                  disabled={
                    creatingAccount
                  }
                  onChange={(
                    event
                  ) =>
                    setEmail(
                      event
                        .target
                        .value
                    )
                  }
                  className="w-full rounded-lg border p-3 dark:bg-slate-950"
                  placeholder="owner@example.com"
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="mb-2 block font-medium">
                  Phone
                </label>

                <input
                  type="tel"
                  value={phone}
                  disabled={
                    creatingAccount
                  }
                  onChange={(
                    event
                  ) =>
                    setPhone(
                      event
                        .target
                        .value
                    )
                  }
                  className="w-full rounded-lg border p-3 dark:bg-slate-950"
                  placeholder="555-123-4567"
                  autoComplete="tel"
                />
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold">
              Login Information
            </h2>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block font-medium">
                  Login Name
                </label>

                <input
                  type="text"
                  value={loginName}
                  disabled={
                    creatingAccount
                  }
                  onChange={(
                    event
                  ) =>
                    setLoginName(
                      event
                        .target
                        .value
                    )
                  }
                  className="w-full rounded-lg border p-3 dark:bg-slate-950"
                  placeholder="john"
                  autoCapitalize="none"
                  autoCorrect="off"
                  autoComplete="username"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block font-medium">
                    Password
                  </label>

                  <input
                    type="password"
                    value={password}
                    disabled={
                      creatingAccount
                    }
                    onChange={(
                      event
                    ) =>
                      setPassword(
                        event
                          .target
                          .value
                      )
                    }
                    className="w-full rounded-lg border p-3 dark:bg-slate-950"
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                  />
                </div>

                <div>
                  <label className="mb-2 block font-medium">
                    Confirm Password
                  </label>

                  <input
                    type="password"
                    value={
                      confirmPassword
                    }
                    disabled={
                      creatingAccount
                    }
                    onChange={(
                      event
                    ) =>
                      setConfirmPassword(
                        event
                          .target
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
                        void handleSignup();
                      }
                    }}
                    className="w-full rounded-lg border p-3 dark:bg-slate-950"
                    placeholder="Re-enter password"
                    autoComplete="new-password"
                  />
                </div>
              </div>
            </div>
          </section>

          <button
            type="button"
            onClick={() =>
              void handleSignup()
            }
            disabled={
              creatingAccount
            }
            className="w-full rounded-lg bg-blue-600 p-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {creatingAccount
              ? "Creating Account..."
              : "Create Business Account"}
          </button>

          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            Already have a JobClokr account?{" "}
            <Link
              href="/login"
              className="font-semibold text-blue-600 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}