import autoTable from "jspdf-autotable";
import type { jsPDF } from "jspdf";

import type { Project } from "@/lib/projects";

import {
  calculateTimeEntryHours,
  formatTimeEntryDate,
  formatTimeEntryTime,
  type TimeEntry,
} from "@/lib/timeEntries";

import {
  PDF_COLORS,
  PDF_LEFT_MARGIN,
  PDF_RIGHT_MARGIN,
  addPdfPageHeader,
  addPdfSectionHeading,
  setPdfTextColor,
} from "@/lib/reports/pdfTheme";

type AddLaborSectionOptions = {
  project: Project;
  timeEntries: TimeEntry[];
};

type EmployeeLaborSummary = {
  employeeName: string;
  entryCount: number;
  totalHours: number;
};

function getProjectEntries(
  timeEntries: TimeEntry[],
  projectId: number
) {
  return timeEntries
    .filter(
      (entry) =>
        entry.projectId === projectId
    )
    .sort(
      (firstEntry, secondEntry) =>
        new Date(
          firstEntry.clockIn
        ).getTime() -
        new Date(
          secondEntry.clockIn
        ).getTime()
    );
}

function getEmployeeSummaries(
  entries: TimeEntry[]
) {
  const summaries = new Map<
    string,
    EmployeeLaborSummary
  >();

  entries.forEach((entry) => {
    const employeeName =
      entry.employeeName ||
      "Unknown Employee";

    const existingSummary =
      summaries.get(employeeName);

    const entryHours =
      calculateTimeEntryHours(entry);

    if (existingSummary) {
      existingSummary.entryCount += 1;
      existingSummary.totalHours +=
        entryHours;

      return;
    }

    summaries.set(employeeName, {
      employeeName,
      entryCount: 1,
      totalHours: entryHours,
    });
  });

  return Array.from(
    summaries.values()
  ).sort(
    (firstSummary, secondSummary) =>
      secondSummary.totalHours -
      firstSummary.totalHours
  );
}

function getTotalLaborHours(
  entries: TimeEntry[]
) {
  return entries.reduce(
    (totalHours, entry) =>
      totalHours +
      calculateTimeEntryHours(entry),
    0
  );
}

export function addLaborSection(
  doc: jsPDF,
  {
    project,
    timeEntries,
  }: AddLaborSectionOptions
) {
  doc.addPage();

  addPdfPageHeader(
    doc,
    project.name
  );

  let yPosition = 44;

  yPosition = addPdfSectionHeading(
    doc,
    "Labor Report",
    yPosition
  );

  const projectEntries =
    getProjectEntries(
      timeEntries,
      project.id
    );

  const employeeSummaries =
    getEmployeeSummaries(
      projectEntries
    );

  const totalLaborHours =
    getTotalLaborHours(
      projectEntries
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
    "Calculated from employee clock-in and clock-out records.",
    PDF_LEFT_MARGIN,
    yPosition
  );

  yPosition += 8;

  autoTable(doc, {
    startY: yPosition,
    theme: "striped",

    head: [
      [
        "Employee",
        "Time Entries",
        "Total Hours",
      ],
    ],

    body:
      employeeSummaries.length > 0
        ? employeeSummaries.map(
            (summary) => [
              summary.employeeName,
              String(
                summary.entryCount
              ),
              summary.totalHours.toFixed(
                2
              ),
            ]
          )
        : [
            [
              "No labor recorded",
              "0",
              "0.00",
            ],
          ],

    foot: [
      [
        "Project Total",
        String(
          projectEntries.length
        ),
        totalLaborHours.toFixed(2),
      ],
    ],

    margin: {
      left: PDF_LEFT_MARGIN,
      right: PDF_RIGHT_MARGIN,
    },

    styles: {
      fontSize: 9,
      cellPadding: 3,
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

    footStyles: {
      fillColor: [
        219,
        234,
        254,
      ],
      textColor: [
        ...PDF_COLORS.primaryDark,
      ],
      fontStyle: "bold",
    },
  });

  yPosition =
    (doc.lastAutoTable?.finalY ??
      yPosition) + 14;

  yPosition = addPdfSectionHeading(
    doc,
    "Time Entry History",
    yPosition
  );

  autoTable(doc, {
    startY: yPosition,
    theme: "grid",

    head: [
      [
        "Employee",
        "Date",
        "Clock In",
        "Clock Out",
        "Hours",
        "Status",
      ],
    ],

    body:
      projectEntries.length > 0
        ? projectEntries.map(
            (entry) => [
              entry.employeeName,

              formatTimeEntryDate(
                entry.clockIn
              ),

              formatTimeEntryTime(
                entry.clockIn
              ),

              entry.clockOut
                ? formatTimeEntryTime(
                    entry.clockOut
                  )
                : "Present",

              calculateTimeEntryHours(
                entry
              ).toFixed(2),

              entry.clockOut
                ? "Completed"
                : "Active",
            ]
          )
        : [
            [
              "No time entries",
              "",
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
      fontSize: 7.5,
      cellPadding: 2.4,
      overflow: "linebreak",
    },

    headStyles: {
      fillColor: [
        ...PDF_COLORS.primary,
      ],
      textColor: [
        ...PDF_COLORS.white,
      ],
    },

    columnStyles: {
      0: {
        cellWidth: 34,
      },

      1: {
        cellWidth: 29,
      },

      2: {
        cellWidth: 25,
      },

      3: {
        cellWidth: 25,
      },

      4: {
        cellWidth: 21,
      },

      5: {
        cellWidth: 28,
      },
    },

    didParseCell: (hookData) => {
      if (
        hookData.section === "body" &&
        hookData.column.index === 5
      ) {
        const status =
          String(
            hookData.cell.raw
          );

        if (status === "Active") {
          hookData.cell.styles.textColor =
            [
              ...PDF_COLORS.success,
            ];
        }
      }
    },
  });
}