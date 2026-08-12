"use client";

import { useState, type ReactNode } from "react";

type ProjectTab =
  | "overview"
  | "activity"
  | "labor"
  | "materials"
  | "photos"
  | "notes"
  | "documents";

type ProjectTabsProps = {
  overview: ReactNode;
  activity: ReactNode;
  labor: ReactNode;
  materials: ReactNode;
  photos: ReactNode;
  notes: ReactNode;
  documents: ReactNode;
};

const tabs: Array<{
  id: ProjectTab;
  label: string;
}> = [
  {
    id: "overview",
    label: "Overview",
  },
  {
    id: "activity",
    label: "Activity",
  },
  {
    id: "labor",
    label: "Labor",
  },
  {
    id: "materials",
    label: "Materials",
  },
  {
    id: "photos",
    label: "Photos",
  },
  {
    id: "notes",
    label: "Notes",
  },
  {
    id: "documents",
    label: "Documents",
  },
];

export default function ProjectTabs({
  overview,
  activity,
  labor,
  materials,
  photos,
  notes,
  documents,
}: ProjectTabsProps) {
  const [activeTab, setActiveTab] =
    useState<ProjectTab>("overview");

  const tabContent: Record<
    ProjectTab,
    ReactNode
  > = {
    overview,
    activity,
    labor,
    materials,
    photos,
    notes,
    documents,
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-white p-2 shadow dark:bg-slate-900">
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive =
              activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() =>
                  setActiveTab(tab.id)
                }
                className={`shrink-0 rounded-lg px-4 py-3 text-sm font-semibold transition ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>{tabContent[activeTab]}</div>
    </div>
  );
}