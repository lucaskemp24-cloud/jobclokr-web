import type { jsPDF } from "jspdf";

import type { Project } from "@/lib/projects";
import type { JobMaterial } from "@/lib/jobMaterials";
import type { JobPhoto } from "@/lib/jobPhotos";
import type { DailyNote } from "@/lib/dailyNotes";

import {
  calculateTimeEntryHours,
  type TimeEntry,
} from "@/lib/timeEntries";

import {
  PDF_COLORS,
  PDF_CONTENT_WIDTH,
  PDF_LEFT_MARGIN,
  PDF_PAGE_HEIGHT,
  PDF_PAGE_WIDTH,
  PDF_RIGHT_MARGIN,
  addPdfPageHeader,
  formatPdfDate,
  setPdfDrawColor,
  setPdfFillColor,
  setPdfTextColor,
} from "@/lib/reports/pdfTheme";

type AddExecutiveSummaryOptions = {
  project: Project;
  timeEntries: TimeEntry[];
  materials: JobMaterial[];
  photos: JobPhoto[];
  dailyNotes: DailyNote[];
};

type SummaryCard = {
  label: string;
  value: string;
  detail: string;
};

function getProjectLaborHours(
  timeEntries: TimeEntry[],
  projectId: number
) {
  return timeEntries
    .filter(
      (entry) =>
        entry.projectId === projectId
    )
    .reduce(
      (totalHours, entry) =>
        totalHours +
        calculateTimeEntryHours(entry),
      0
    );
}

function getUniqueEmployeeCount(
  project: Project,
  timeEntries: TimeEntry[]
) {
  const employeeNames = new Set<string>();

  project.employees.forEach(
    (employeeName) => {
      if (employeeName.trim()) {
        employeeNames.add(
          employeeName.trim()
        );
      }
    }
  );

  timeEntries
    .filter(
      (entry) =>
        entry.projectId === project.id
    )
    .forEach((entry) => {
      if (entry.employeeName.trim()) {
        employeeNames.add(
          entry.employeeName.trim()
        );
      }
    });

  return employeeNames.size;
}

function drawSummaryCard(
  doc: jsPDF,
  card: SummaryCard,
  xPosition: number,
  yPosition: number,
  width: number,
  height: number
) {
  setPdfFillColor(
    doc,
    PDF_COLORS.panel
  );

  setPdfDrawColor(
    doc,
    PDF_COLORS.border
  );

  doc.setLineWidth(0.3);

  doc.roundedRect(
    xPosition,
    yPosition,
    width,
    height,
    3,
    3,
    "FD"
  );

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
    card.label.toUpperCase(),
    xPosition + 5,
    yPosition + 8
  );

  doc.setFontSize(22);

  setPdfTextColor(
    doc,
    PDF_COLORS.heading
  );

  doc.text(
    card.value,
    xPosition + 5,
    yPosition + 21
  );

  doc.setFont(
    "helvetica",
    "normal"
  );

  doc.setFontSize(8);

  setPdfTextColor(
    doc,
    PDF_COLORS.muted
  );

  const detailLines =
    doc.splitTextToSize(
      card.detail,
      width - 10
    );

  doc.text(
    detailLines.slice(0, 2),
    xPosition + 5,
    yPosition + 29
  );
}

export function addExecutiveSummaryPage(
  doc: jsPDF,
  {
    project,
    timeEntries,
    materials,
    photos,
    dailyNotes,
  }: AddExecutiveSummaryOptions
) {
  doc.addPage();

  addPdfPageHeader(
    doc,
    project.name
  );

  const projectTimeEntries =
    timeEntries.filter(
      (entry) =>
        entry.projectId === project.id
    );

  const projectMaterials =
    materials.filter(
      (material) =>
        material.projectId === project.id
    );

  const projectPhotos =
    photos.filter(
      (photo) =>
        photo.projectId === project.id
    );

  const projectNotes =
    dailyNotes.filter(
      (note) =>
        note.projectId === project.id
    );

  const totalLaborHours =
    getProjectLaborHours(
      timeEntries,
      project.id
    );

  const employeeCount =
    getUniqueEmployeeCount(
      project,
      timeEntries
    );

  let yPosition = 46;

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(22);

  setPdfTextColor(
    doc,
    PDF_COLORS.heading
  );

  doc.text(
    "Executive Summary",
    PDF_LEFT_MARGIN,
    yPosition
  );

  yPosition += 9;

  doc.setFont(
    "helvetica",
    "normal"
  );

  doc.setFontSize(10);

  setPdfTextColor(
    doc,
    PDF_COLORS.muted
  );

  doc.text(
    "A high-level overview of project activity and field records.",
    PDF_LEFT_MARGIN,
    yPosition
  );

  yPosition += 14;

  setPdfFillColor(
    doc,
    PDF_COLORS.panel
  );

  setPdfDrawColor(
    doc,
    PDF_COLORS.border
  );

  doc.roundedRect(
    PDF_LEFT_MARGIN,
    yPosition,
    PDF_CONTENT_WIDTH,
    48,
    3,
    3,
    "FD"
  );

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
    "PROJECT",
    PDF_LEFT_MARGIN + 6,
    yPosition + 9
  );

  doc.setFontSize(15);

  setPdfTextColor(
    doc,
    PDF_COLORS.heading
  );

  const projectNameLines =
    doc.splitTextToSize(
      project.name,
      105
    );

  doc.text(
    projectNameLines,
    PDF_LEFT_MARGIN + 6,
    yPosition + 19
  );

  doc.setFont(
    "helvetica",
    "normal"
  );

  doc.setFontSize(10);

  setPdfTextColor(
    doc,
    PDF_COLORS.body
  );

  doc.text(
    project.customer,
    PDF_LEFT_MARGIN + 6,
    yPosition + 34
  );

  if (project.address) {
    doc.setFontSize(8);

    setPdfTextColor(
      doc,
      PDF_COLORS.muted
    );

    const addressLines =
      doc.splitTextToSize(
        project.address,
        105
      );

    doc.text(
      addressLines.slice(0, 2),
      PDF_LEFT_MARGIN + 6,
      yPosition + 41
    );
  }

  const statusColor =
    project.status === "Completed"
      ? PDF_COLORS.success
      : project.status === "In Progress"
        ? PDF_COLORS.primary
        : project.status === "Closed"
          ? PDF_COLORS.muted
          : PDF_COLORS.warning;

  setPdfFillColor(
    doc,
    statusColor
  );

  doc.roundedRect(
    PDF_PAGE_WIDTH -
      PDF_RIGHT_MARGIN -
      45,
    yPosition + 8,
    39,
    11,
    3,
    3,
    "F"
  );

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(8);

  setPdfTextColor(
    doc,
    PDF_COLORS.white
  );

  doc.text(
    project.status,
    PDF_PAGE_WIDTH -
      PDF_RIGHT_MARGIN -
      25.5,
    yPosition + 15,
    {
      align: "center",
    }
  );

  doc.setFont(
    "helvetica",
    "normal"
  );

  doc.setFontSize(8);

  setPdfTextColor(
    doc,
    PDF_COLORS.muted
  );

  doc.text(
    "START DATE",
    PDF_PAGE_WIDTH -
      PDF_RIGHT_MARGIN -
      45,
    yPosition + 29
  );

  doc.text(
    "DUE DATE",
    PDF_PAGE_WIDTH -
      PDF_RIGHT_MARGIN -
      45,
    yPosition + 40
  );

  doc.setFont(
    "helvetica",
    "bold"
  );

  setPdfTextColor(
    doc,
    PDF_COLORS.heading
  );

  doc.text(
    formatPdfDate(
      project.startDate
    ),
    PDF_PAGE_WIDTH -
      PDF_RIGHT_MARGIN -
      6,
    yPosition + 29,
    {
      align: "right",
    }
  );

  doc.text(
    formatPdfDate(
      project.dueDate
    ),
    PDF_PAGE_WIDTH -
      PDF_RIGHT_MARGIN -
      6,
    yPosition + 40,
    {
      align: "right",
    }
  );

  yPosition += 62;

  const summaryCards: SummaryCard[] = [
    {
      label: "Labor Hours",
      value:
        totalLaborHours.toFixed(2),
      detail:
        projectTimeEntries.length === 1
          ? "1 recorded time entry"
          : `${projectTimeEntries.length} recorded time entries`,
    },
    {
      label: "Employees",
      value: String(
        employeeCount
      ),
      detail:
        employeeCount === 1
          ? "1 employee connected to this project"
          : `${employeeCount} employees connected to this project`,
    },
    {
      label: "Materials",
      value: String(
        projectMaterials.length
      ),
      detail:
        projectMaterials.length === 1
          ? "1 material entry"
          : `${projectMaterials.length} material entries`,
    },
    {
      label: "Job Photos",
      value: String(
        projectPhotos.length
      ),
      detail:
        projectPhotos.length === 1
          ? "1 uploaded field photo"
          : `${projectPhotos.length} uploaded field photos`,
    },
    {
      label: "Daily Notes",
      value: String(
        projectNotes.length
      ),
      detail:
        projectNotes.length === 1
          ? "1 project note"
          : `${projectNotes.length} project notes`,
    },
    {
      label: "Assigned Crew",
      value: String(
        project.employees.length
      ),
      detail:
        project.employees.length === 1
          ? "1 currently assigned employee"
          : `${project.employees.length} currently assigned employees`,
    },
  ];

  const cardGap = 6;

  const cardWidth =
    (PDF_CONTENT_WIDTH -
      cardGap * 2) /
    3;

  const cardHeight = 39;

  summaryCards.forEach(
    (card, index) => {
      const column =
        index % 3;

      const row =
        Math.floor(index / 3);

      drawSummaryCard(
        doc,
        card,
        PDF_LEFT_MARGIN +
          column *
            (cardWidth +
              cardGap),
        yPosition +
          row *
            (cardHeight +
              cardGap),
        cardWidth,
        cardHeight
      );
    }
  );

  yPosition +=
    cardHeight * 2 +
    cardGap +
    17;

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(13);

  setPdfTextColor(
    doc,
    PDF_COLORS.heading
  );

  doc.text(
    "Project Description",
    PDF_LEFT_MARGIN,
    yPosition
  );

  yPosition += 8;

  setPdfFillColor(
    doc,
    PDF_COLORS.panel
  );

  setPdfDrawColor(
    doc,
    PDF_COLORS.border
  );

  const description =
    project.details ||
    "No project description has been added.";

  const descriptionLines =
    doc.splitTextToSize(
      description,
      PDF_CONTENT_WIDTH - 12
    );

  const descriptionHeight =
    Math.max(
      30,
      descriptionLines.length *
        5 +
        14
    );

  doc.roundedRect(
    PDF_LEFT_MARGIN,
    yPosition,
    PDF_CONTENT_WIDTH,
    descriptionHeight,
    3,
    3,
    "FD"
  );

  doc.setFont(
    "helvetica",
    "normal"
  );

  doc.setFontSize(10);

  setPdfTextColor(
    doc,
    PDF_COLORS.body
  );

  doc.text(
    descriptionLines,
    PDF_LEFT_MARGIN + 6,
    yPosition + 10
  );

  yPosition +=
    descriptionHeight +
    14;

  if (
    yPosition <
    PDF_PAGE_HEIGHT - 35
  ) {
    setPdfDrawColor(
      doc,
      PDF_COLORS.border
    );

    doc.line(
      PDF_LEFT_MARGIN,
      yPosition,
      PDF_PAGE_WIDTH -
        PDF_RIGHT_MARGIN,
      yPosition
    );

    yPosition += 9;

    doc.setFontSize(8);

    setPdfTextColor(
      doc,
      PDF_COLORS.muted
    );

    doc.text(
      "Summary values are calculated from the current JobClokr project records.",
      PDF_LEFT_MARGIN,
      yPosition
    );
  }

  setPdfTextColor(
    doc,
    PDF_COLORS.heading
  );
}