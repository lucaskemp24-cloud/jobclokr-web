"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import { useToast } from "@/components/ui/ToastProvider";
import {
  loadAuthUser,
  type AuthUser,
} from "@/lib/auth";

export default function ChangePasswordPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [user, setUser] =
    useState<AuthUser | null>(
      null
    );

  const [
    currentPassword,
    setCurrentPassword,
  ] = useState("");

  const [
    newPassword,
    setNewPassword,
  ] = useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [saving, setSaving] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    const authUser =
      loadAuthUser();

    if (!authUser) {
      router.replace("/login");
      return;
    }

    setUser(authUser);
    setLoading(false);
  }, [router]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!user) {
      return;
    }

    if (!currentPassword) {
      showToast(
        "Enter your temporary password.",
        "error"
      );

      return;
    }

    if (newPassword.length < 8) {
      showToast(
        "New password must be at least 8 characters.",
        "error"
      );

      return;
    }

    if (
      newPassword !==
      confirmPassword
    ) {
      showToast(
        "New passwords do not match.",
        "error"
      );

      return;
    }

    if (
      currentPassword ===
      newPassword
    ) {
      showToast(
        "Your new password must be different from your temporary password.",
        "error"
      );

      return;
    }

    try {
      setSaving(true);

      const response =
        await fetch(
          "/api/change-password",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                employeeId:
                  user.employeeId,

                currentPassword,
                newPassword,
              }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to change password."
        );
      }

      showToast(
        "Password changed successfully.",
        "success"
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

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
        "Password change failed:",
        error
      );

      showToast(
        error instanceof Error
          ? error.message
          : "Unable to change password.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 dark:bg-slate-950">
        <p className="text-slate-500 dark:text-slate-400">
          Loading...
        </p>
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
            Create your password
          </p>
        </div>

        <div className="mb-6 rounded-lg bg-blue-50 p-4 dark:bg-blue-950/30">
          <p className="font-medium">
            Welcome, {user?.name}
          </p>

          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Your account is using a
            temporary password. Choose
            your own password to continue.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <div>
            <label className="mb-1 block font-medium">
              Temporary Password
            </label>

            <input
              type="password"
              value={currentPassword}
              onChange={(event) =>
                setCurrentPassword(
                  event.target.value
                )
              }
              disabled={saving}
              autoComplete="current-password"
              className="w-full rounded-lg border p-3 dark:bg-slate-950"
              placeholder="Enter temporary password"
            />
          </div>

          <div>
            <label className="mb-1 block font-medium">
              New Password
            </label>

            <input
              type="password"
              value={newPassword}
              onChange={(event) =>
                setNewPassword(
                  event.target.value
                )
              }
              disabled={saving}
              autoComplete="new-password"
              className="w-full rounded-lg border p-3 dark:bg-slate-950"
              placeholder="At least 8 characters"
            />
          </div>

          <div>
            <label className="mb-1 block font-medium">
              Confirm New Password
            </label>

            <input
              type="password"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(
                  event.target.value
                )
              }
              disabled={saving}
              autoComplete="new-password"
              className="w-full rounded-lg border p-3 dark:bg-slate-950"
              placeholder="Enter new password again"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-blue-600 p-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving
              ? "Saving..."
              : "Change Password"}
          </button>
        </form>
      </div>
    </main>
  );
}