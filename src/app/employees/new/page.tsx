"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import AppLayout from "@/components/layout/AppLayout";
import { useToast } from "@/components/ui/ToastProvider";

type EmployeeRole =
  | "OWNER"
  | "OFFICE"
  | "FOREMAN"
  | "EMPLOYEE";

export default function NewEmployeePage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [firstName, setFirstName] =
    useState("");

  const [lastName, setLastName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [role, setRole] =
    useState<EmployeeRole>("EMPLOYEE");

  const [active, setActive] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  async function handleSubmit() {
    const trimmedFirstName =
      firstName.trim();

    const trimmedLastName =
      lastName.trim();

    if (
      !trimmedFirstName ||
      !trimmedLastName
    ) {
      showToast(
        "Please enter the employee's first and last name.",
        "error"
      );

      return;
    }

    try {
      setSaving(true);

      const response =
        await fetch(
          "/api/employees",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                firstName:
                  trimmedFirstName,

                lastName:
                  trimmedLastName,

                email:
                  email.trim(),

                phone:
                  phone.trim(),

                role,

                active,
              }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to create employee."
        );
      }

      showToast(
        "Employee created successfully.",
        "success"
      );

      router.push("/employees");
      router.refresh();
    } catch (error) {
      console.error(
        "Employee creation failed:",
        error
      );

      showToast(
        error instanceof Error
          ? error.message
          : "Unable to create employee.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <button
            type="button"
            onClick={() =>
              router.push(
                "/employees"
              )
            }
            className="text-blue-600 hover:underline"
          >
            ← Back to Employees
          </button>

          <h1 className="mt-4 text-4xl font-bold">
            New Employee
          </h1>

          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Add a new employee to JobClokr.
          </p>
        </div>

        <section className="rounded-xl bg-white p-6 shadow dark:bg-slate-900">
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  First Name
                </label>

                <input
                  type="text"
                  value={firstName}
                  disabled={saving}
                  onChange={(event) =>
                    setFirstName(
                      event.target
                        .value
                    )
                  }
                  className="w-full rounded-lg border p-3"
                  placeholder="First name"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Last Name
                </label>

                <input
                  type="text"
                  value={lastName}
                  disabled={saving}
                  onChange={(event) =>
                    setLastName(
                      event.target
                        .value
                    )
                  }
                  className="w-full rounded-lg border p-3"
                  placeholder="Last name"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Email
              </label>

              <input
                type="email"
                value={email}
                disabled={saving}
                onChange={(event) =>
                  setEmail(
                    event.target.value
                  )
                }
                className="w-full rounded-lg border p-3"
                placeholder="employee@example.com"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Phone
              </label>

              <input
                type="tel"
                value={phone}
                disabled={saving}
                onChange={(event) =>
                  setPhone(
                    event.target.value
                  )
                }
                className="w-full rounded-lg border p-3"
                placeholder="Phone number"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Role
              </label>

              <select
                value={role}
                disabled={saving}
                onChange={(event) =>
                  setRole(
                    event.target
                      .value as EmployeeRole
                  )
                }
                className="w-full rounded-lg border p-3"
              >
                <option value="EMPLOYEE">
                  Employee
                </option>

                <option value="FOREMAN">
                  Foreman
                </option>

                <option value="OFFICE">
                  Office
                </option>

                <option value="OWNER">
                  Owner
                </option>
              </select>
            </div>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={active}
                disabled={saving}
                onChange={(event) =>
                  setActive(
                    event.target
                      .checked
                  )
                }
              />

              <span>
                Employee is active
              </span>
            </label>

            <button
              type="button"
              onClick={
                handleSubmit
              }
              disabled={saving}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : "Save Employee"}
            </button>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}