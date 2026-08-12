import autoTable from "jspdf-autotable";
import type { jsPDF } from "jspdf";

import type { Project } from "@/lib/projects";
import type { JobMaterial } from "@/lib/jobMaterials";

import {
  PDF_COLORS,
  PDF_LEFT_MARGIN,
  PDF_RIGHT_MARGIN,
  addPdfPageHeader,
  addPdfSectionHeading,
  formatPdfDateTime,
  setPdfTextColor,
} from "@/lib/reports/pdfTheme";

type AddMaterialsSectionOptions = {
  project: Project;
  materials: JobMaterial[];
};

function formatQuantity(quantity: number) {
  return Number.isInteger(quantity)
    ? String(quantity)
    : quantity.toFixed(2);
}

export function addMaterialsSection(
  doc: jsPDF,
  {
    project,
    materials,
  }: AddMaterialsSectionOptions
) {
  doc.addPage();

  addPdfPageHeader(
    doc,
    project.name
  );

  let yPosition = 44;

  yPosition = addPdfSectionHeading(
    doc,
    "Materials Report",
    yPosition
  );

  const projectMaterials =
    materials
      .filter(
        (material) =>
          material.projectId ===
          project.id
      )
      .sort(
        (firstMaterial, secondMaterial) =>
          new Date(
            firstMaterial.createdAt
          ).getTime() -
          new Date(
            secondMaterial.createdAt
          ).getTime()
      );

  doc.setFont(
    "helvetica",
    "normal"
  );

  doc.setFontSize(9);

  setPdfTextColor(
    doc,
    PDF_COLORS.muted
  );

  doc.text(
    "Materials recorded by employees for this project.",
    PDF_LEFT_MARGIN,
    yPosition
  );

  yPosition += 8;

  autoTable(doc, {
    startY: yPosition,
    theme: "striped",

    head: [
      [
        "Material",
        "Quantity",
        "Employee",
        "Date",
        "Notes",
      ],
    ],

    body:
      projectMaterials.length > 0
        ? projectMaterials.map(
            (material) => [
              material.materialName,

              `${formatQuantity(
                material.quantity
              )} ${material.unit}`,

              material.employeeName,

              formatPdfDateTime(
                material.createdAt
              ),

              material.notes ||
                "No notes",
            ]
          )
        : [
            [
              "No materials recorded",
              "",
              "",
              "",
              "",
            ],
          ],

    margin: {
      left: PDF_LEFT_MARGIN,
      right: PDF_RIGHT_MARGIN,
    },

    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      overflow: "linebreak",
    },

    headStyles: {
      fillColor: [
        ...PDF_COLORS.heading,
      ],
      textColor: [
        ...PDF_COLORS.white,
      ],
    },

    columnStyles: {
      0: {
        cellWidth: 38,
      },

      1: {
        cellWidth: 27,
      },

      2: {
        cellWidth: 32,
      },

      3: {
        cellWidth: 38,
      },

      4: {
        cellWidth: 45,
      },
    },
  });

  const finalY =
    (doc.lastAutoTable?.finalY ??
      yPosition) + 12;

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(10);

  setPdfTextColor(
    doc,
    PDF_COLORS.heading
  );

  doc.text(
    `Total Material Entries: ${projectMaterials.length}`,
    PDF_LEFT_MARGIN,
    finalY
  );
}