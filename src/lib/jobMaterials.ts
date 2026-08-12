export type MaterialUnit =
  | "Each"
  | "Feet"
  | "Meters"
  | "Boxes"
  | "Rolls"
  | "Pounds"
  | "Gallons"
  | "Hours"
  | "Other";

export type JobMaterial = {
  id: number;
  projectId: number;
  projectName: string;
  employeeId: number;
  employeeName: string;
  materialName: string;
  quantity: number;
  unit: MaterialUnit;
  notes: string;
  createdAt: string;
};

const MATERIALS_STORAGE_KEY =
  "jobclokr-job-materials";

function isMaterialUnit(
  value: unknown
): value is MaterialUnit {
  return (
    value === "Each" ||
    value === "Feet" ||
    value === "Meters" ||
    value === "Boxes" ||
    value === "Rolls" ||
    value === "Pounds" ||
    value === "Gallons" ||
    value === "Hours" ||
    value === "Other"
  );
}

function normalizeMaterial(
  material: Partial<JobMaterial>,
  fallbackId: number
): JobMaterial {
  return {
    id:
      typeof material.id === "number"
        ? material.id
        : fallbackId,

    projectId:
      typeof material.projectId === "number"
        ? material.projectId
        : 0,

    projectName:
      typeof material.projectName === "string"
        ? material.projectName
        : "Unknown Project",

    employeeId:
      typeof material.employeeId === "number"
        ? material.employeeId
        : 0,

    employeeName:
      typeof material.employeeName === "string"
        ? material.employeeName
        : "Unknown Employee",

    materialName:
      typeof material.materialName === "string"
        ? material.materialName
        : "Unnamed Material",

    quantity:
      typeof material.quantity === "number" &&
      Number.isFinite(material.quantity)
        ? material.quantity
        : 0,

    unit: isMaterialUnit(material.unit)
      ? material.unit
      : "Each",

    notes:
      typeof material.notes === "string"
        ? material.notes
        : "",

    createdAt:
      typeof material.createdAt === "string"
        ? material.createdAt
        : new Date().toISOString(),
  };
}

export function loadJobMaterials(): JobMaterial[] {
  if (typeof window === "undefined") {
    return [];
  }

  const savedMaterials =
    window.localStorage.getItem(
      MATERIALS_STORAGE_KEY
    );

  if (!savedMaterials) {
    return [];
  }

  try {
    const parsedMaterials = JSON.parse(
      savedMaterials
    );

    if (!Array.isArray(parsedMaterials)) {
      return [];
    }

    return parsedMaterials.map(
      (material, index) =>
        normalizeMaterial(
          material as Partial<JobMaterial>,
          Date.now() + index
        )
    );
  } catch {
    return [];
  }
}

export function saveJobMaterials(
  materials: JobMaterial[]
) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    MATERIALS_STORAGE_KEY,
    JSON.stringify(materials)
  );
}

export function deleteJobMaterial(
  materialId: number
) {
  const remainingMaterials =
    loadJobMaterials().filter(
      (material) =>
        material.id !== materialId
    );

  saveJobMaterials(remainingMaterials);

  return remainingMaterials;
}