import type { jsPDF } from "jspdf";

import type { Project } from "@/lib/projects";
import type { DailyNote } from "@/lib/dailyNotes";

import {
  PDF_COLORS,
  PDF_CONTENT_WIDTH,
  PDF_LEFT_MARGIN,
  PDF_PAGE_HEIGHT,
  PDF_BOTTOM_MARGIN,
  addPdfPageHeader,
  addPdfSectionHeading,
  formatPdfDateTime,
  setPdfDrawColor,
  setPdfFillColor,
  setPdfTextColor,
} from "@/lib/reports/pdfTheme";

type AddDailyNotesSectionOptions = {
  project: Project;
  dailyNotes: DailyNote[];
};

function getProjectNotes(
  dailyNotes: DailyNote[],
  projectId: number
) {
  return dailyNotes
    .filter(
      (note) =>
        note.projectId === projectId
    )
    .sort(
      (firstNote, secondNote) =>
        new Date(
          firstNote.createdAt
        ).getTime() -
        new Date(
          secondNote.createdAt
        ).getTime()
    );
}

function addNewNotesPage(
  doc: jsPDF,
  projectName: string
) {
  doc.addPage();

  addPdfPageHeader(
    doc,
    projectName
  );

  return 44;
}

export function addDailyNotesSection(
  doc: jsPDF,
  {
    project,
    dailyNotes,
  }: AddDailyNotesSectionOptions
) {
  doc.addPage();

  addPdfPageHeader(
    doc,
    project.name
  );

  let yPosition = 44;

  yPosition = addPdfSectionHeading(
    doc,
    "Daily Notes",
    yPosition
  );

  const projectNotes =
    getProjectNotes(
      dailyNotes,
      project.id
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
    "Progress updates, delays, and jobsite details recorded by employees.",
    PDF_LEFT_MARGIN,
    yPosition
  );

  yPosition += 10;

  if (projectNotes.length === 0) {
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
      36,
      3,
      3,
      "FD"
    );

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(11);

    setPdfTextColor(
      doc,
      PDF_COLORS.heading
    );

    doc.text(
      "No daily notes recorded",
      PDF_LEFT_MARGIN + 6,
      yPosition + 13
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
      "Notes entered by employees will appear here automatically.",
      PDF_LEFT_MARGIN + 6,
      yPosition + 23
    );

    return;
  }

  projectNotes.forEach(
    (note, index) => {
      const noteText =
        note.note?.trim() ||
        "No note text provided.";

      const noteLines =
        doc.splitTextToSize(
          noteText,
          PDF_CONTENT_WIDTH - 12
        );

      const noteHeight =
        Math.max(
          38,
          noteLines.length * 5 + 27
        );

      if (
        yPosition +
          noteHeight >
        PDF_PAGE_HEIGHT -
          PDF_BOTTOM_MARGIN -
          12
      ) {
        yPosition =
          addNewNotesPage(
            doc,
            project.name
          );
      }

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
        noteHeight,
        3,
        3,
        "FD"
      );

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
        note.employeeName ||
          "Unknown Employee",
        PDF_LEFT_MARGIN + 6,
        yPosition + 9
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
        formatPdfDateTime(
          note.createdAt
        ),
        PDF_LEFT_MARGIN + 6,
        yPosition + 17
      );

      setPdfDrawColor(
        doc,
        PDF_COLORS.border
      );

      doc.line(
        PDF_LEFT_MARGIN + 6,
        yPosition + 21,
        PDF_LEFT_MARGIN +
          PDF_CONTENT_WIDTH -
          6,
        yPosition + 21
      );

      doc.setFontSize(9);

      setPdfTextColor(
        doc,
        PDF_COLORS.body
      );

      doc.text(
        noteLines,
        PDF_LEFT_MARGIN + 6,
        yPosition + 29
      );

      yPosition +=
        noteHeight + 6;

      if (
        index <
        projectNotes.length - 1
      ) {
        yPosition += 1;
      }
    }
  );
}