import type { jsPDF } from "jspdf";

import type { Project } from "@/lib/projects";

import {
  PDF_COLORS,
  PDF_CONTENT_WIDTH,
  PDF_LEFT_MARGIN,
  PDF_PAGE_HEIGHT,
  PDF_PAGE_WIDTH,
  PDF_RIGHT_MARGIN,
  formatPdfDate,
  setPdfDrawColor,
  setPdfFillColor,
  setPdfTextColor,
} from "@/lib/reports/pdfTheme";

type AddProjectCoverPageOptions = {
  project: Project;
  preparedBy?: string;
  companyName?: string;
};

function getStatusColor(status: string) {
  if (status === "Completed") {
    return PDF_COLORS.success;
  }

  if (status === "Closed") {
    return PDF_COLORS.muted;
  }

  if (status === "In Progress") {
    return PDF_COLORS.primary;
  }

  if (status === "Scheduled") {
    return PDF_COLORS.warning;
  }

  return PDF_COLORS.heading;
}

export function addProjectCoverPage(
  doc: jsPDF,
  {
    project,
    preparedBy = "JobClokr",
    companyName = "JobClokr",
  }: AddProjectCoverPageOptions
) {
  setPdfFillColor(
    doc,
    PDF_COLORS.primary
  );

  doc.rect(
    0,
    0,
    PDF_PAGE_WIDTH,
    74,
    "F"
  );

  setPdfFillColor(
    doc,
    PDF_COLORS.primaryDark
  );

  doc.rect(
    0,
    74,
    PDF_PAGE_WIDTH,
    8,
    "F"
  );

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(25);

  setPdfTextColor(
    doc,
    PDF_COLORS.white
  );

  doc.text(
    companyName,
    PDF_LEFT_MARGIN,
    24
  );

  doc.setFontSize(12);

  doc.setFont(
    "helvetica",
    "normal"
  );

  doc.text(
    "PROJECT REPORT",
    PDF_LEFT_MARGIN,
    36
  );

  doc.setFontSize(9);

  doc.text(
    "Labor • Materials • Photos • Notes",
    PDF_LEFT_MARGIN,
    45
  );

  const statusLabel =
    project.status || "Not Set";

  const statusColor =
    getStatusColor(statusLabel);

  setPdfFillColor(
    doc,
    PDF_COLORS.white
  );

  doc.roundedRect(
    PDF_PAGE_WIDTH -
      PDF_RIGHT_MARGIN -
      46,
    19,
    46,
    12,
    3,
    3,
    "F"
  );

  setPdfTextColor(
    doc,
    statusColor
  );

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(9);

  doc.text(
    statusLabel,
    PDF_PAGE_WIDTH -
      PDF_RIGHT_MARGIN -
      23,
    26.5,
    {
      align: "center",
    }
  );

  const projectTitle =
    doc.splitTextToSize(
      project.name,
      PDF_CONTENT_WIDTH
    );

  setPdfTextColor(
    doc,
    PDF_COLORS.heading
  );

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(28);

  doc.text(
    projectTitle,
    PDF_LEFT_MARGIN,
    112
  );

  const titleHeight =
    projectTitle.length * 11;

  doc.setFont(
    "helvetica",
    "normal"
  );

  doc.setFontSize(14);

  setPdfTextColor(
    doc,
    PDF_COLORS.body
  );

  doc.text(
    project.customer,
    PDF_LEFT_MARGIN,
    119 + titleHeight
  );

  if (project.address) {
    doc.setFontSize(10);

    setPdfTextColor(
      doc,
      PDF_COLORS.muted
    );

    const addressLines =
      doc.splitTextToSize(
        project.address,
        PDF_CONTENT_WIDTH
      );

    doc.text(
      addressLines,
      PDF_LEFT_MARGIN,
      128 + titleHeight
    );
  }

  const detailsTop =
    164 + titleHeight;

  setPdfDrawColor(
    doc,
    PDF_COLORS.border
  );

  doc.setLineWidth(0.4);

  doc.line(
    PDF_LEFT_MARGIN,
    detailsTop - 10,
    PDF_PAGE_WIDTH -
      PDF_RIGHT_MARGIN,
    detailsTop - 10
  );

  const details = [
    {
      label: "CUSTOMER",
      value:
        project.customer ||
        "Not set",
    },
    {
      label: "START DATE",
      value: formatPdfDate(
        project.startDate
      ),
    },
    {
      label: "DUE DATE",
      value: formatPdfDate(
        project.dueDate
      ),
    },
    {
      label: "PREPARED BY",
      value: preparedBy,
    },
  ];

  const columnWidth =
    PDF_CONTENT_WIDTH / 2;

  details.forEach(
    (detail, index) => {
      const column =
        index % 2;

      const row =
        Math.floor(index / 2);

      const xPosition =
        PDF_LEFT_MARGIN +
        column * columnWidth;

      const yPosition =
        detailsTop +
        row * 30;

      doc.setFont(
        "helvetica",
        "bold"
      );

      doc.setFontSize(8);

      setPdfTextColor(
        doc,
        PDF_COLORS.muted
      );

      doc.text(
        detail.label,
        xPosition,
        yPosition
      );

      doc.setFont(
        "helvetica",
        "normal"
      );

      doc.setFontSize(11);

      setPdfTextColor(
        doc,
        PDF_COLORS.heading
      );

      const valueLines =
        doc.splitTextToSize(
          detail.value,
          columnWidth - 10
        );

      doc.text(
        valueLines,
        xPosition,
        yPosition + 7
      );
    }
  );

  const generatedDate =
    formatPdfDate(
      new Date().toISOString()
    );

  setPdfFillColor(
    doc,
    PDF_COLORS.panel
  );

  doc.roundedRect(
    PDF_LEFT_MARGIN,
    PDF_PAGE_HEIGHT - 63,
    PDF_CONTENT_WIDTH,
    32,
    3,
    3,
    "F"
  );

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(9);

  setPdfTextColor(
    doc,
    PDF_COLORS.muted
  );

  doc.text(
    "REPORT GENERATED",
    PDF_LEFT_MARGIN + 6,
    PDF_PAGE_HEIGHT - 50
  );

  doc.setFont(
    "helvetica",
    "normal"
  );

  doc.setFontSize(12);

  setPdfTextColor(
    doc,
    PDF_COLORS.heading
  );

  doc.text(
    generatedDate,
    PDF_LEFT_MARGIN + 6,
    PDF_PAGE_HEIGHT - 41
  );

  doc.setFontSize(9);

  setPdfTextColor(
    doc,
    PDF_COLORS.muted
  );

  doc.text(
    "Generated by JobClokr",
    PDF_LEFT_MARGIN,
    PDF_PAGE_HEIGHT - 16
  );

  doc.text(
    "jobclokr.com",
    PDF_PAGE_WIDTH -
      PDF_RIGHT_MARGIN,
    PDF_PAGE_HEIGHT - 16,
    {
      align: "right",
    }
  );

  setPdfTextColor(
    doc,
    PDF_COLORS.heading
  );
}