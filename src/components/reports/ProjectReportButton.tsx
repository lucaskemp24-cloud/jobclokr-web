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
  const [loading, setLoading] =
    useState(false);

  async function handleGenerateReport() {
    if (loading) {
      return;
    }

    try {
      setLoading(true);

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
        "LIVE PDF REPORT DATA",
        {
          projectId:
            project.id,

          timeEntryCount:
            Array.isArray(
              timeEntries
            )
              ? timeEntries.length
              : 0,

          materialCount:
            Array.isArray(
              materials
            )
              ? materials.length
              : 0,

          photoCount:
            Array.isArray(
              photos
            )
              ? photos.length
              : 0,

          noteCount:
            Array.isArray(
              dailyNotes
            )
              ? dailyNotes.length
              : 0,
        }
      );

      generateProfessionalProjectReport({
        project: {
          ...project,
          id: Number(project.id),
        },

        timeEntries:
          Array.isArray(timeEntries)
            ? timeEntries.map(
                (entry) => ({
                  ...entry,
                  id: Number(
                    entry.id
                  ),
                  employeeId: Number(
                    entry.employeeId
                  ),
                  projectId: Number(
                    entry.projectId
                  ),
                })
              )
            : [],

        materials:
          Array.isArray(materials)
            ? materials.map(
                (material) => ({
                  ...material,
                  id: Number(
                    material.id
                  ),
                  employeeId: Number(
                    material.employeeId
                  ),
                  projectId: Number(
                    material.projectId
                  ),
                  quantity: Number(
                    material.quantity
                  ),
                })
              )
            : [],

        photos:
          Array.isArray(photos)
            ? photos.map(
                (photo) => ({
                  ...photo,
                  id: Number(
                    photo.id
                  ),
                  employeeId: Number(
                    photo.employeeId
                  ),
                  projectId: Number(
                    photo.projectId
                  ),
                })
              )
            : [],

        dailyNotes:
          Array.isArray(dailyNotes)
            ? dailyNotes.map(
                (note) => ({
                  ...note,
                  id: Number(
                    note.id
                  ),
                  employeeId: Number(
                    note.employeeId
                  ),
                  projectId: Number(
                    note.projectId
                  ),
                })
              )
            : [],

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
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() =>
        void handleGenerateReport()
      }
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span>
        📄
      </span>

      {loading
        ? "Generating..."
        : "Generate PDF Report"}
    </button>
  );
}