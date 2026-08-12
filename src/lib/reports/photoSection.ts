import type { jsPDF } from "jspdf";

import type { Project } from "@/lib/projects";
import type { JobPhoto } from "@/lib/jobPhotos";

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

type AddPhotoSectionOptions = {
  project: Project;
  photos: JobPhoto[];
};

function getProjectPhotos(
  photos: JobPhoto[],
  projectId: number
) {
  return photos
    .filter(
      (photo) =>
        photo.projectId === projectId
    )
    .sort(
      (firstPhoto, secondPhoto) =>
        new Date(
          firstPhoto.createdAt
        ).getTime() -
        new Date(
          secondPhoto.createdAt
        ).getTime()
    );
}

function startPhotoPage(
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

function getImageFormat(
  dataUrl: string
) {
  if (
    dataUrl.startsWith(
      "data:image/png"
    )
  ) {
    return "PNG";
  }

  if (
    dataUrl.startsWith(
      "data:image/webp"
    )
  ) {
    return "WEBP";
  }

  return "JPEG";
}

export function addPhotoSection(
  doc: jsPDF,
  {
    project,
    photos,
  }: AddPhotoSectionOptions
) {
  doc.addPage();

  addPdfPageHeader(
    doc,
    project.name
  );

  let yPosition = 44;

  yPosition = addPdfSectionHeading(
    doc,
    "Photo Gallery",
    yPosition
  );

  const projectPhotos =
    getProjectPhotos(
      photos,
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
    "Jobsite photos uploaded by employees for this project.",
    PDF_LEFT_MARGIN,
    yPosition
  );

  yPosition += 10;

  if (projectPhotos.length === 0) {
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
      40,
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
      "No project photos uploaded",
      PDF_LEFT_MARGIN + 6,
      yPosition + 14
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
      "Photos uploaded by employees will appear here automatically.",
      PDF_LEFT_MARGIN + 6,
      yPosition + 25
    );

    return;
  }

  projectPhotos.forEach(
    (photo, index) => {
      const imageHeight = 95;
      const detailsHeight = 34;

      const cardHeight =
        imageHeight +
        detailsHeight +
        12;

      if (
        yPosition +
          cardHeight >
        PDF_PAGE_HEIGHT -
          PDF_BOTTOM_MARGIN -
          12
      ) {
        yPosition =
          startPhotoPage(
            doc,
            project.name
          );
      }

      setPdfFillColor(
        doc,
        PDF_COLORS.white
      );

      setPdfDrawColor(
        doc,
        PDF_COLORS.border
      );

      doc.roundedRect(
        PDF_LEFT_MARGIN,
        yPosition,
        PDF_CONTENT_WIDTH,
        cardHeight,
        3,
        3,
        "FD"
      );

      const imageX =
        PDF_LEFT_MARGIN + 6;

      const imageY =
        yPosition + 6;

      const imageWidth =
        PDF_CONTENT_WIDTH - 12;

      try {
        if (photo.imageData) {
          doc.addImage(
            photo.imageData,
            getImageFormat(
              photo.imageData
            ),
            imageX,
            imageY,
            imageWidth,
            imageHeight,
            undefined,
            "FAST"
          );
        } else {
          throw new Error(
            "Photo data missing"
          );
        }
      } catch {
        setPdfFillColor(
          doc,
          PDF_COLORS.panel
        );

        doc.roundedRect(
          imageX,
          imageY,
          imageWidth,
          imageHeight,
          2,
          2,
          "F"
        );

        doc.setFont(
          "helvetica",
          "bold"
        );

        doc.setFontSize(11);

        setPdfTextColor(
          doc,
          PDF_COLORS.muted
        );

        doc.text(
          "Photo unavailable",
          imageX +
            imageWidth / 2,
          imageY +
            imageHeight / 2,
          {
            align: "center",
          }
        );
      }

      const detailsY =
        imageY +
        imageHeight +
        8;

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
        photo.employeeName ||
          "Unknown Employee",
        PDF_LEFT_MARGIN + 6,
        detailsY
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
          photo.createdAt
        ),
        PDF_LEFT_MARGIN + 6,
        detailsY + 7
      );

      const note =
        photo.note?.trim() ||
        "No note provided.";

      const noteLines =
        doc.splitTextToSize(
          note,
          PDF_CONTENT_WIDTH - 12
        );

      doc.setFontSize(9);

      setPdfTextColor(
        doc,
        PDF_COLORS.body
      );

      doc.text(
        noteLines.slice(0, 2),
        PDF_LEFT_MARGIN + 6,
        detailsY + 16
      );

      if (photo.fileName) {
        doc.setFontSize(7);

        setPdfTextColor(
          doc,
          PDF_COLORS.muted
        );

        doc.text(
          photo.fileName,
          PDF_LEFT_MARGIN + 6,
          detailsY + 25
        );
      }

      yPosition +=
        cardHeight + 8;

      if (
        index <
        projectPhotos.length - 1
      ) {
        yPosition += 2;
      }
    }
  );
}