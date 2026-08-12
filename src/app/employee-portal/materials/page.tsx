"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import EmployeeLayout from "@/components/layout/EmployeeLayout";
import { useToast } from "@/components/ui/ToastProvider";

import {
  loadAuthUser,
  type AuthUser,
} from "@/lib/auth";

type JobMaterial = {
  id: number;
  projectId: number;
  projectName: string;
  employeeId: number;
  employeeName: string;
  materialName: string;
  quantity: number;
  unit: string;
  notes: string;
  createdAt: string;
};

type ScheduleAssignment = {
  id: number;
  date: string;
  projectId: number;
  projectName: string;
  customerId: number;
  customerName: string;
  address: string;
  status: string;
  priority:
    | "NORMAL"
    | "HIGH"
    | "EMERGENCY";
  notes: string;
  employeeIds: number[];
};

function formatDate(dateValue: string) {
  const date =
    new Date(dateValue);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Date unavailable";
  }

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function EmployeeMaterialsContent() {
  const router = useRouter();
  const searchParams =
    useSearchParams();

  const { showToast } =
    useToast();

  const [
    authUser,
    setAuthUser,
  ] =
    useState<AuthUser | null>(
      null
    );

  const [
    assignment,
    setAssignment,
  ] =
    useState<ScheduleAssignment | null>(
      null
    );

  const [
    materials,
    setMaterials,
  ] =
    useState<JobMaterial[]>(
      []
    );

  const [
    materialName,
    setMaterialName,
  ] =
    useState("");

  const [
    quantity,
    setQuantity,
  ] =
    useState("1");

  const [
    unit,
    setUnit,
  ] =
    useState("each");

  const [
    notes,
    setNotes,
  ] =
    useState("");

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const projectId =
    Number(
      searchParams.get(
        "projectId"
      )
    );

  useEffect(() => {
    async function loadPage() {
      const savedUser =
        loadAuthUser();

      if (!savedUser) {
        router.replace(
          "/login"
        );
        return;
      }

      if (
        savedUser.role ===
          "Owner" ||
        savedUser.role ===
          "Office"
      ) {
        router.replace("/");
        return;
      }

      if (
        !Number.isInteger(
          projectId
        ) ||
        projectId <= 0
      ) {
        showToast(
          "No project was selected.",
          "error"
        );

        router.replace(
          "/employee-portal"
        );
        return;
      }

      try {
        setLoading(true);
        setAuthUser(savedUser);

        const [
          scheduleResponse,
          materialsResponse,
        ] =
          await Promise.all([
            fetch(
              `/api/schedule?employeeId=${savedUser.employeeId}`,
              {
                cache:
                  "no-store",
              }
            ),
            fetch(
              `/api/job-materials?projectId=${projectId}`,
              {
                cache:
                  "no-store",
              }
            ),
          ]);

        const scheduleData =
          await scheduleResponse.json();

        const materialsData =
          await materialsResponse.json();

        if (
          !scheduleResponse.ok
        ) {
          throw new Error(
            scheduleData.error ||
              "Unable to load schedule."
          );
        }

        if (
          !materialsResponse.ok
        ) {
          throw new Error(
            materialsData.error ||
              "Unable to load materials."
          );
        }

        const projectAssignment =
          (
            Array.isArray(
              scheduleData
            )
              ? scheduleData
              : []
          ).find(
            (
              savedAssignment: ScheduleAssignment
            ) =>
              savedAssignment.projectId ===
              projectId &&
              savedAssignment.employeeIds.includes(
                savedUser.employeeId
              )
          );

        if (
          !projectAssignment
        ) {
          throw new Error(
            "This project is not assigned to you."
          );
        }

        setAssignment(
          projectAssignment
        );

        setMaterials(
          Array.isArray(
            materialsData
          )
            ? materialsData
            : []
        );
      } catch (error) {
        showToast(
          error instanceof Error
            ? error.message
            : "Unable to load materials.",
          "error"
        );
      } finally {
        setLoading(false);
      }
    }

    void loadPage();
  }, [
    projectId,
    router,
    showToast,
  ]);

  const myProjectMaterials =
    useMemo(
      () =>
        materials.filter(
          (material) =>
            material.projectId ===
            projectId
        ),
      [
        materials,
        projectId,
      ]
    );

  async function handleAddMaterial() {
    if (
      !authUser ||
      !assignment
    ) {
      return;
    }

    const numericQuantity =
      Number(quantity);

    if (
      !materialName.trim()
    ) {
      showToast(
        "Enter a material name.",
        "error"
      );
      return;
    }

    if (
      !Number.isFinite(
        numericQuantity
      ) ||
      numericQuantity <= 0
    ) {
      showToast(
        "Quantity must be greater than zero.",
        "error"
      );
      return;
    }

    if (!unit.trim()) {
      showToast(
        "Enter a unit.",
        "error"
      );
      return;
    }

    try {
      setSaving(true);

      const response =
        await fetch(
          "/api/job-materials",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body:
              JSON.stringify({
                projectId,
                employeeId:
                  authUser.employeeId,
                materialName:
                  materialName.trim(),
                quantity:
                  numericQuantity,
                unit:
                  unit.trim(),
                notes:
                  notes.trim(),
              }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to add material."
        );
      }

      setMaterials(
        (currentMaterials) => [
          data,
          ...currentMaterials,
        ]
      );

      setMaterialName("");
      setQuantity("1");
      setNotes("");

      showToast(
        "Material added.",
        "success"
      );
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "Unable to add material.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteMaterial(
    material: JobMaterial
  ) {
    if (!authUser) {
      return;
    }

    const confirmed =
      window.confirm(
        `Delete ${material.quantity} ${material.unit} of ${material.materialName}?`
      );

    if (!confirmed) {
      return;
    }

    try {
      const response =
        await fetch(
          `/api/job-materials?id=${material.id}&employeeId=${authUser.employeeId}`,
          {
            method:
              "DELETE",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to delete material."
        );
      }

      setMaterials(
        (
          currentMaterials
        ) =>
          currentMaterials.filter(
            (
              savedMaterial
            ) =>
              savedMaterial.id !==
              material.id
          )
      );

      showToast(
        "Material deleted.",
        "success"
      );
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "Unable to delete material.",
        "error"
      );
    }
  }

  if (
    loading ||
    !authUser ||
    !assignment
  ) {
    return (
      <EmployeeLayout>
        <div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center">
          <div className="w-full rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-blue-600 border-r-transparent" />

            <p className="mt-4 text-slate-500 dark:text-slate-400">
              Loading materials...
            </p>
          </div>
        </div>
      </EmployeeLayout>
    );
  }

  return (
    <EmployeeLayout>
      <div className="mx-auto w-full max-w-xl space-y-5 pb-28 sm:pb-8">
        <button
          type="button"
          onClick={() =>
            router.push(
              "/employee-portal"
            )
          }
          className="text-sm font-semibold text-blue-600 hover:underline"
        >
          ← Back to Today&apos;s Jobs
        </button>

        <header>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Field Records
          </p>

          <h1 className="mt-1 text-3xl font-bold">
            Materials
          </h1>

          <p className="mt-1 text-slate-500 dark:text-slate-400">
            {assignment.projectName}
          </p>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-xl font-bold">
            Add Material
          </h2>

          <div className="mt-5 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Material
              </label>

              <input
                value={
                  materialName
                }
                onChange={(
                  event
                ) =>
                  setMaterialName(
                    event.target.value
                  )
                }
                placeholder="Example: Cat6 cable"
                className="w-full rounded-xl border p-3 dark:bg-slate-950"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Quantity
                </label>

                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={
                    quantity
                  }
                  onChange={(
                    event
                  ) =>
                    setQuantity(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border p-3 dark:bg-slate-950"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Unit
                </label>

                <select
                  value={unit}
                  onChange={(
                    event
                  ) =>
                    setUnit(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border p-3 dark:bg-slate-950"
                >
                  <option value="each">
                    each
                  </option>
                  <option value="ft">
                    ft
                  </option>
                  <option value="box">
                    box
                  </option>
                  <option value="roll">
                    roll
                  </option>
                  <option value="bag">
                    bag
                  </option>
                  <option value="pair">
                    pair
                  </option>
                  <option value="hr">
                    hr
                  </option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Notes
              </label>

              <textarea
                value={notes}
                onChange={(
                  event
                ) =>
                  setNotes(
                    event.target.value
                  )
                }
                placeholder="Optional material notes"
                className="min-h-24 w-full rounded-xl border p-3 dark:bg-slate-950"
              />
            </div>

            <button
              type="button"
              disabled={saving}
              onClick={() =>
                void handleAddMaterial()
              }
              className="min-h-14 w-full rounded-xl bg-blue-600 text-lg font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : "Add Material"}
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">
              Recorded Materials
            </h2>

            <span className="text-sm text-slate-500">
              {
                myProjectMaterials.length
              }{" "}
              {myProjectMaterials.length ===
              1
                ? "entry"
                : "entries"}
            </span>
          </div>

          {myProjectMaterials.length >
          0 ? (
            <div className="mt-4 space-y-3">
              {myProjectMaterials.map(
                (material) => (
                  <article
                    key={
                      material.id
                    }
                    className="rounded-xl border p-4 dark:border-slate-700"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-bold">
                          {
                            material.materialName
                          }
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          {
                            material.employeeName
                          }
                          {" • "}
                          {formatDate(
                            material.createdAt
                          )}
                        </p>
                      </div>

                      <p className="shrink-0 text-lg font-bold">
                        {
                          material.quantity
                        }{" "}
                        {
                          material.unit
                        }
                      </p>
                    </div>

                    {material.notes && (
                      <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-800">
                        {
                          material.notes
                        }
                      </p>
                    )}

                    {material.employeeId ===
                      authUser.employeeId && (
                      <button
                        type="button"
                        onClick={() =>
                          void handleDeleteMaterial(
                            material
                          )
                        }
                        className="mt-4 text-sm font-semibold text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    )}
                  </article>
                )
              )}
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed p-8 text-center">
              <div className="text-3xl">
                📦
              </div>

              <p className="mt-3 font-semibold">
                No materials recorded
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Add the first material used on this job.
              </p>
            </div>
          )}
        </section>
      </div>
    </EmployeeLayout>
  );
}

export default function EmployeeMaterialsPage() {
  return (
    <Suspense
      fallback={
        <EmployeeLayout>
          <div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center">
            <div className="w-full rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-blue-600 border-r-transparent" />

              <p className="mt-4 text-slate-500 dark:text-slate-400">
                Loading materials...
              </p>
            </div>
          </div>
        </EmployeeLayout>
      }
    >
      <EmployeeMaterialsContent />
    </Suspense>
  );
}