"use client";

import { useState } from "react";

import type { Project } from "@/lib/projects";

import {
  generateProfessionalProjectReport,
} from "@/lib/reports/generateProjectReport";

type ProjectReportButtonProps = {
  project: Project;
};

export default function ProjectReportButton({
  project,
}: ProjectReportButtonProps) {
  const [generating, setGenerating] =
    useState(false);

  async function handleGenerateReport() {
    if (generating) {
      return;
    }

    setGenerating(true);

    try {
      const [
        timeResponse,
        materialsResponse,
        photosResponse,
        notesResponse,
      ] = await Promise.all([
        fetch(
          `/api/time-entries?projectId=${project.id}`,
          {
            cache: "no-store",
          }
        ),

        fetch(
          `/api/job-materials?projectId=${project.id}`,
          {
            cache: "no-store",
          }
        ),

        fetch(
          `/api/job-photos?projectId=${project.id}`,
          {
            cache: "no-store",
          }
        ),

        fetch(
          `/api/daily-notes?projectId=${project.id}`,
          {
            cache: "no-store",
          }
        ),
      ]);

      if (!timeResponse.ok) {
        throw new Error(
          "Unable to load project time entries."
        );
      }

      if (!materialsResponse.ok) {
        throw new Error(
          "Unable to load project materials."
        );
      }

      if (!photosResponse.ok) {
        throw new Error(
          "Unable to load project photos."
        );
      }

      if (!notesResponse.ok) {
        throw new Error(
          "Unable to load project notes."
        );
      }

      const [
        timeEntries,
        materials,
        photos,
        dailyNotes,
      ] = await Promise.all([
        timeResponse.json(),
        materialsResponse.json(),
        photosResponse.json(),
        notesResponse.json(),
      ]);

      console.log(
        "PDF REPORT DEBUG",
        {
          projectId:
            project.id,

          projectIdType:
            typeof project.id,

          timeEntries,

          materials,

          photos,

          dailyNotes,

          timeEntryCount:
            Array.isArray(
              timeEntries
            )
              ? timeEntries.length
              : "NOT ARRAY",

          materialCount:
            Array.isArray(
              materials
            )
              ? materials.length
              : "NOT ARRAY",

          photoCount:
            Array.isArray(
              photos
            )
              ? photos.length
              : "NOT ARRAY",

          noteCount:
            Array.isArray(
              dailyNotes
            )
              ? dailyNotes.length
              : "NOT ARRAY",
        }
      );

      const reportProject = {
        ...project,
        id: Number(
          project.id
        ),
      };

      const normalizedTimeEntries =
        Array.isArray(
          timeEntries
        )
          ? timeEntries.map(
              (entry) => ({
                ...entry,

                id:
                  Number(
                    entry.id
                  ),

                employeeId:
                  Number(
                    entry.employeeId
                  ),

                projectId:
                  Number(
                    entry.projectId
                  ),
              })
            )
          : [];

      const normalizedMaterials =
        Array.isArray(
          materials
        )
          ? materials.map(
              (material) => ({
                ...material,

                id:
                  Number(
                    material.id
                  ),

                employeeId:
                  Number(
                    material.employeeId
                  ),

                projectId:
                  Number(
                    material.projectId
                  ),

                quantity:
                  Number(
                    material.quantity
                  ),
              })
            )
          : [];

      const normalizedPhotos =
        Array.isArray(
          photos
        )
          ? photos.map(
              (photo) => ({
                ...photo,

                id:
                  Number(
                    photo.id
                  ),

                employeeId:
                  Number(
                    photo.employeeId
                  ),

                projectId:
                  Number(
                    photo.projectId
                  ),
              })
            )
          : [];

      const normalizedDailyNotes =
        Array.isArray(
          dailyNotes
        )
          ? dailyNotes.map(
              (note) => ({
                ...note,

                id:
                  Number(
                    note.id
                  ),

                employeeId:
                  Number(
                    note.employeeId
                  ),

                projectId:
                  Number(
                    note.projectId
                  ),
              })
            )
          : [];

      console.log(
        "PDF NORMALIZED DATA",
        {
          reportProject,

          normalizedTimeEntries,

          normalizedMaterials,

          normalizedPhotos,

          normalizedDailyNotes,
        }
      );

      generateProfessionalProjectReport({
        project:
          reportProject,

        timeEntries:
          normalizedTimeEntries,

        materials:
          normalizedMaterials,

        photos:
          normalizedPhotos,

        dailyNotes:
          normalizedDailyNotes,

        preparedBy:
          "Lucas Kemp",

        companyName:
          "Lucas Communications",
      });
    } catch (error) {
      console.error(
        "Project report generation failed:",
        error
      );

      window.alert(
        error instanceof Error
          ? error.message
          : "The project report could not be generated."
      );
    } finally {
      setGenerating(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() =>
        void handleGenerateReport()
      }
      disabled={generating}
      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span>
        📄
      </span>

      {generating
        ? "Generating Report..."
        : "Generate PDF Report"}
    </button>
  );
}