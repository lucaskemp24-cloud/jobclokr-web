"use client";

import {
  useEffect,
  useState,
} from "react";

import { useToast } from "@/components/ui/ToastProvider";

type ProjectMaterialsProps = {
  projectId: number;
};

type MaterialEntry = {
  id: number;
  projectId: number;
  employeeId: number;
  employeeName: string;
  materialName: string;
  quantity: number;
  unit: string;
  notes: string;
  createdAt: string;
};

type AssignedEmployee = {
  id: number;
  firstName: string;
  lastName: string;
  active: boolean;
};

function getEmployeeName(
  employee: AssignedEmployee
) {
  return `${employee.firstName} ${employee.lastName}`.trim();
}

export default function ProjectMaterials({
  projectId,
}: ProjectMaterialsProps) {
  const { showToast } = useToast();

  const [materials, setMaterials] =
    useState<MaterialEntry[]>([]);

  const [
    assignedEmployees,
    setAssignedEmployees,
  ] = useState<AssignedEmployee[]>([]);

  const [dataLoaded, setDataLoaded] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [
    selectedEmployeeId,
    setSelectedEmployeeId,
  ] = useState("");

  const [
    materialName,
    setMaterialName,
  ] = useState("");

  const [quantity, setQuantity] =
    useState("1");

  const [unit, setUnit] =
    useState("each");

  const [notes, setNotes] =
    useState("");

  async function loadMaterials() {
    try {
      setDataLoaded(false);

      const [
        materialsResponse,
        assignmentsResponse,
      ] = await Promise.all([
        fetch(
          `/api/job-materials?projectId=${projectId}`,
          {
            cache: "no-store",
          }
        ),
        fetch(
          `/api/project-assignments?projectId=${projectId}`,
          {
            cache: "no-store",
          }
        ),
      ]);

      const materialsData =
        await materialsResponse.json();

      const assignmentsData =
        await assignmentsResponse.json();

      if (!materialsResponse.ok) {
        throw new Error(
          materialsData.error ||
            "Unable to load materials."
        );
      }

      if (!assignmentsResponse.ok) {
        throw new Error(
          assignmentsData.error ||
            "Unable to load assigned employees."
        );
      }

      setMaterials(
        Array.isArray(materialsData)
          ? materialsData
          : []
      );

      setAssignedEmployees(
        Array.isArray(assignmentsData)
          ? assignmentsData
          : []
      );

      if (
        !selectedEmployeeId &&
        Array.isArray(assignmentsData) &&
        assignmentsData.length === 1
      ) {
        setSelectedEmployeeId(
          String(assignmentsData[0].id)
        );
      }
    } catch (error) {
      console.error(
        "Materials load failed:",
        error
      );

      showToast(
        error instanceof Error
          ? error.message
          : "Unable to load materials.",
        "error"
      );
    } finally {
      setDataLoaded(true);
    }
  }

  useEffect(() => {
    void loadMaterials();
  }, [projectId]);

  function resetForm() {
    setMaterialName("");
    setQuantity("1");
    setUnit("each");
    setNotes("");
  }

  async function handleAddMaterial() {
    const employeeId =
      Number(selectedEmployeeId);

    const parsedQuantity =
      Number(quantity);

    if (
      !Number.isInteger(employeeId) ||
      employeeId <= 0
    ) {
      showToast(
        "Please select an employee.",
        "error"
      );
      return;
    }

    if (!materialName.trim()) {
      showToast(
        "Please enter a material name.",
        "error"
      );
      return;
    }

    if (
      !Number.isFinite(parsedQuantity) ||
      parsedQuantity <= 0
    ) {
      showToast(
        "Quantity must be greater than zero.",
        "error"
      );
      return;
    }

    if (!unit.trim()) {
      showToast(
        "Please enter a unit.",
        "error"
      );
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        "/api/job-materials",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            projectId,
            employeeId,
            materialName:
              materialName.trim(),
            quantity:
              parsedQuantity,
            unit: unit.trim(),
            notes: notes.trim(),
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to save material."
        );
      }

      setMaterials(
        (currentMaterials) => [
          data,
          ...currentMaterials,
        ]
      );

      resetForm();

      showToast(
        "Material saved.",
        "success"
      );
    } catch (error) {
      console.error(
        "Material save failed:",
        error
      );

      showToast(
        error instanceof Error
          ? error.message
          : "Unable to save material.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteMaterial(
    material: MaterialEntry
  ) {
    const confirmed =
      window.confirm(
        `Delete ${material.materialName}?`
      );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `/api/job-materials?id=${material.id}`,
        {
          method: "DELETE",
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
        (currentMaterials) =>
          currentMaterials.filter(
            (savedMaterial) =>
              savedMaterial.id !==
              material.id
          )
      );

      showToast(
        "Material deleted.",
        "success"
      );
    } catch (error) {
      console.error(
        "Material delete failed:",
        error
      );

      showToast(
        error instanceof Error
          ? error.message
          : "Unable to delete material.",
        "error"
      );
    }
  }

  if (!dataLoaded) {
    return (
      <section className="rounded-xl bg-white p-6 shadow dark:bg-slate-900">
        <p className="text-slate-500 dark:text-slate-400">
          Loading materials...
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl bg-white p-6 shadow dark:bg-slate-900">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Field Records
          </p>

          <h2 className="mt-1 text-3xl font-bold">
            Materials Used
          </h2>

          <p className="mt-2 text-slate-500 dark:text-slate-400">
            Materials recorded by employees for this project.
          </p>
        </div>

        <span className="text-sm text-slate-500 dark:text-slate-400">
          {materials.length}{" "}
          {materials.length === 1
            ? "entry"
            : "entries"}
        </span>
      </div>

      <div className="mb-8 rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-950/40">
        <h3 className="text-lg font-semibold">
          Add Material
        </h3>

        {assignedEmployees.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            Assign an employee to this project before recording materials.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Employee
              </label>

              <select
                value={selectedEmployeeId}
                onChange={(event) =>
                  setSelectedEmployeeId(
                    event.target.value
                  )
                }
                className="w-full rounded-lg border p-3"
              >
                <option value="">
                  Select employee
                </option>

                {assignedEmployees.map(
                  (employee) => (
                    <option
                      key={employee.id}
                      value={String(
                        employee.id
                      )}
                    >
                      {getEmployeeName(
                        employee
                      )}
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Material
              </label>

              <input
                type="text"
                value={materialName}
                onChange={(event) =>
                  setMaterialName(
                    event.target.value
                  )
                }
                className="w-full rounded-lg border p-3"
                placeholder="Cat6 cable"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Quantity
              </label>

              <input
                type="number"
                min="0.01"
                step="0.01"
                value={quantity}
                onChange={(event) =>
                  setQuantity(
                    event.target.value
                  )
                }
                className="w-full rounded-lg border p-3"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Unit
              </label>

              <input
                type="text"
                value={unit}
                onChange={(event) =>
                  setUnit(
                    event.target.value
                  )
                }
                className="w-full rounded-lg border p-3"
                placeholder="each, ft, box, roll"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">
                Notes
              </label>

              <textarea
                value={notes}
                onChange={(event) =>
                  setNotes(
                    event.target.value
                  )
                }
                className="min-h-24 w-full rounded-lg border p-3"
                placeholder="Optional material notes"
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  void handleAddMaterial()
                }
                className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : "Add Material"}
              </button>
            </div>
          </div>
        )}
      </div>

      {materials.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-slate-200 py-12 text-center dark:border-slate-700">
          <div className="text-5xl">
            📦
          </div>

          <h3 className="mt-4 text-xl font-semibold">
            No materials recorded
          </h3>

          <p className="mt-2 text-slate-500 dark:text-slate-400">
            Materials entered by employees will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {materials.map(
            (material) => (
              <div
                key={material.id}
                className="rounded-xl border border-slate-200 p-5 dark:border-slate-700"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {material.materialName}
                    </h3>

                    <p className="mt-1 text-slate-500 dark:text-slate-400">
                      {material.employeeName}
                    </p>
                  </div>

                  <div className="sm:text-right">
                    <div className="text-xl font-bold">
                      {material.quantity}{" "}
                      {material.unit}
                    </div>

                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      {new Date(
                        material.createdAt
                      ).toLocaleString()}
                    </div>
                  </div>
                </div>

                {material.notes && (
                  <div className="mt-4 rounded-lg bg-slate-100 p-3 dark:bg-slate-800">
                    {material.notes}
                  </div>
                )}

                <div className="mt-4 text-right">
                  <button
                    type="button"
                    onClick={() =>
                      void handleDeleteMaterial(
                        material
                      )
                    }
                    className="text-sm font-medium text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </section>
  );
}