import { jsPDF } from "jspdf";

import type { Project } from "@/lib/projects";
import type { JobMaterial } from "@/lib/jobMaterials";
import type { JobPhoto } from "@/lib/jobPhotos";
import type { DailyNote } from "@/lib/dailyNotes";
import type { TimeEntry } from "@/lib/timeEntries";

import {
  addPdfPageFooter,
  sanitizePdfFileName,
} from "@/lib/reports/pdfTheme";

import {
  addProjectCoverPage,
} from "@/lib/reports/coverPage";

import {
  addExecutiveSummaryPage,
} from "@/lib/reports/executiveSummary";

import {
  addLaborSection,
} from "@/lib/reports/laborSection";

import {
  addMaterialsSection,
} from "./materialsSection";

import {
  addDailyNotesSection,
} from "./dailyNotesSection";

import {
  addPhotoSection,
} from "./photoSection";

export type ProjectReportData = {
  project: Project;
  timeEntries: TimeEntry[];
  materials: JobMaterial[];
  photos: JobPhoto[];
  dailyNotes: DailyNote[];
  preparedBy?: string;
  companyName?: string;
};

function addReportFooters(
  doc: jsPDF
) {
  const totalPages =
    doc.getNumberOfPages();

  for (
    let pageNumber = 1;
    pageNumber <= totalPages;
    pageNumber += 1
  ) {
    doc.setPage(pageNumber);

    if (pageNumber > 1) {
      addPdfPageFooter(
        doc,
        pageNumber,
        totalPages
      );
    }
  }
}

function createReportFileName(
  projectName: string
) {
  const generatedDate =
    new Date()
      .toISOString()
      .slice(0, 10);

  const safeProjectName =
    sanitizePdfFileName(
      projectName
    );

  return `${safeProjectName}-project-report-${generatedDate}.pdf`;
}

export function generateProfessionalProjectReport({
  project,
  timeEntries,
  materials,
  photos,
  dailyNotes,
  preparedBy = "JobClokr",
  companyName = "JobClokr",
}: ProjectReportData) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  // Page 1 — Cover
  addProjectCoverPage(doc, {
    project,
    preparedBy,
    companyName,
  });

  // Page 2 — Executive Summary
  addExecutiveSummaryPage(doc, {
    project,
    timeEntries,
    materials,
    photos,
    dailyNotes,
  });

  // Page 3 — Labor
  addLaborSection(doc, {
    project,
    timeEntries,
  });

  // Page 4 — Materials
  addMaterialsSection(doc, {
    project,
    materials,
  });

  // Page 5 — Daily Notes
  addDailyNotesSection(doc, {
    project,
    dailyNotes,
  });

  // Page 6+ — Photo Gallery
  addPhotoSection(doc, {
    project,
    photos,
  });

  /*
    Final remaining section:

    addClosingPage(...)
  */

  addReportFooters(doc);

  const fileName =
    createReportFileName(
      project.name
    );

  doc.save(fileName);
}