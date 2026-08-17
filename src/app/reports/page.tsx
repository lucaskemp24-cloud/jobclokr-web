"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Capacitor,
  registerPlugin,
} from "@capacitor/core";

import AppLayout from "@/components/layout/AppLayout";
import { useToast } from "@/components/ui/ToastProvider";

type NativePrintPlugin = {
  printHtml(options: {
    html: string;
    jobName?: string;
  }): Promise<{
    started: boolean;
  }>;
};

const NativePrint =
  registerPlugin<NativePrintPlugin>(
    "NativePrint"
  );

type DatabaseEmployee = {
  id: number;
  companyId: number;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  role:
    | "OWNER"
    | "OFFICE"
    | "FOREMAN"
    | "EMPLOYEE";
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

type ReportProject = {
  id: number;
  name: string;
  customer: string;
};

type TimeEntry = {
  id: number;
  employeeId: number;
  employeeName: string;
  projectId: number;
  projectName: string;
  clockIn: string;
  clockOut: string | null;
};

type InvoiceStatus = {
  id: number;
  projectId: number;
  startDate: string;
  endDate: string;
  invoiced: boolean;
  invoicedAt: string | null;
  markedByEmployeeId: number | null;
  markedByName: string | null;
};

type InvoiceStatusMap = Record<
  number,
  InvoiceStatus
>;

type InvoiceFilter =
  | "all"
  | "uninvoiced"
  | "invoiced";

type InvoiceQueueEmployee = {
  employeeId: number;
  employeeName: string;
  hours: number;
};

type InvoiceQueueItem = {
  workDate: string;
  projectId: number;
  projectName: string;
  customerId: number;
  customerName: string;
  totalHours: number;
  employees: InvoiceQueueEmployee[];
};

function getTodayDate() {
  const today = new Date();

  const year =
    today.getFullYear();

  const month = String(
    today.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    today.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getYesterdayDate() {
  const yesterday =
    new Date();

  yesterday.setDate(
    yesterday.getDate() - 1
  );

  const year =
    yesterday.getFullYear();

  const month = String(
    yesterday.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    yesterday.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getEmployeeName(
  employee: DatabaseEmployee
) {
  return `${employee.firstName} ${employee.lastName}`.trim();
}

function calculateHours(
  clockIn: string,
  clockOut: string | null
) {
  const startTime =
    new Date(clockIn);

  const endTime = clockOut
    ? new Date(clockOut)
    : new Date();

  const milliseconds =
    endTime.getTime() -
    startTime.getTime();

  return Math.max(
    milliseconds /
      1000 /
      60 /
      60,
    0
  );
}

function formatDate(
  dateValue: string
) {
  return new Date(
    dateValue
  ).toLocaleDateString();
}

function formatTime(
  dateValue: string
) {
  return new Date(
    dateValue
  ).toLocaleTimeString(
    [],
    {
      hour: "numeric",
      minute: "2-digit",
    }
  );
}

export default function ReportsPage() {
  const { showToast } = useToast();

  const [
    projects,
    setProjects,
  ] =
    useState<ReportProject[]>(
      []
    );

  const [
    employees,
    setEmployees,
  ] =
    useState<
      DatabaseEmployee[]
    >([]);

  const [
    entries,
    setEntries,
  ] =
    useState<TimeEntry[]>(
      []
    );

  const [
    startDate,
    setStartDate,
  ] =
    useState(
      getYesterdayDate()
    );

  const [
    endDate,
    setEndDate,
  ] =
    useState(
      getYesterdayDate()
    );

  const [
    selectedEmployeeId,
    setSelectedEmployeeId,
  ] =
    useState("");

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    loadError,
    setLoadError,
  ] =
    useState("");

  const [
    invoiceStatuses,
    setInvoiceStatuses,
  ] =
    useState<InvoiceStatusMap>(
      {}
    );

  const [
    invoiceStatusesLoading,
    setInvoiceStatusesLoading,
  ] =
    useState(false);

  const [
    savingInvoiceProjectId,
    setSavingInvoiceProjectId,
  ] =
    useState<number | null>(
      null
    );

  const [
    invoiceFilter,
    setInvoiceFilter,
  ] =
    useState<InvoiceFilter>(
      "uninvoiced"
    );

  const [
    invoiceQueue,
    setInvoiceQueue,
  ] =
    useState<InvoiceQueueItem[]>(
      []
    );

  const [
    invoiceQueueLoading,
    setInvoiceQueueLoading,
  ] =
    useState(true);

  const [
    invoiceQueueError,
    setInvoiceQueueError,
  ] =
    useState("");

  const [
    savingQueueKey,
    setSavingQueueKey,
  ] =
    useState<string | null>(
      null
    );

  async function loadInvoiceQueue() {
    try {
      setInvoiceQueueLoading(
        true
      );
      setInvoiceQueueError("");

      const response =
        await fetch(
          "/api/invoice-queue?days=30",
          {
            cache: "no-store",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to load invoice queue."
        );
      }

      setInvoiceQueue(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (error) {
      console.error(
        "Invoice queue load failed:",
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : "Unable to load invoice queue.";

      setInvoiceQueueError(
        message
      );
      setInvoiceQueue([]);
    } finally {
      setInvoiceQueueLoading(
        false
      );
    }
  }

  async function loadInvoiceStatuses() {
    try {
      setInvoiceStatusesLoading(
        true
      );

      const response =
        await fetch(
          `/api/invoice-status?startDate=${encodeURIComponent(
            startDate
          )}&endDate=${encodeURIComponent(
            endDate
          )}`,
          {
            cache: "no-store",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to load invoice statuses."
        );
      }

      const nextStatuses:
        InvoiceStatusMap = {};

      if (Array.isArray(data)) {
        data.forEach(
          (
            status:
              InvoiceStatus
          ) => {
            nextStatuses[
              status.projectId
            ] = status;
          }
        );
      }

      setInvoiceStatuses(
        nextStatuses
      );
    } catch (error) {
      console.error(
        "Invoice status load failed:",
        error
      );

      setInvoiceStatuses(
        {}
      );

      showToast(
        error instanceof Error
          ? error.message
          : "Unable to load invoice statuses.",
        "error"
      );
    } finally {
      setInvoiceStatusesLoading(
        false
      );
    }
  }

  async function loadReportData() {
    try {
      setLoadError("");

      const [
        projectsResponse,
        employeesResponse,
        timeResponse,
      ] =
        await Promise.all([
          fetch(
            "/api/projects",
            {
              cache:
                "no-store",
            }
          ),

          fetch(
            "/api/employees",
            {
              cache:
                "no-store",
            }
          ),

          fetch(
            "/api/time-entries",
            {
              cache:
                "no-store",
            }
          ),
        ]);

      if (
        !projectsResponse.ok
      ) {
        throw new Error(
          "Unable to load projects."
        );
      }

      if (
        !employeesResponse.ok
      ) {
        throw new Error(
          "Unable to load employees."
        );
      }

      if (
        !timeResponse.ok
      ) {
        throw new Error(
          "Unable to load time entries."
        );
      }

      const [
        projectData,
        employeeData,
        timeData,
      ] =
        await Promise.all([
          projectsResponse.json(),
          employeesResponse.json(),
          timeResponse.json(),
        ]);

      setProjects(
        Array.isArray(
          projectData
        )
          ? projectData
          : []
      );

      setEmployees(
        Array.isArray(
          employeeData
        )
          ? employeeData
          : []
      );

      setEntries(
        Array.isArray(
          timeData
        )
          ? timeData
          : []
      );
    } catch (error) {
      console.error(
        "Reports database load failed:",
        error
      );

      setLoadError(
        error instanceof Error
          ? error.message
          : "Unable to load report data."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadReportData();
    void loadInvoiceQueue();
  }, []);

  useEffect(() => {
    void loadInvoiceStatuses();
  }, [
    startDate,
    endDate,
  ]);

  const filteredEntries =
    useMemo(() => {
      const start =
        new Date(
          `${startDate}T00:00:00`
        );

      const end =
        new Date(
          `${endDate}T23:59:59`
        );

      return entries.filter(
        (entry) => {
          const clockInDate =
            new Date(
              entry.clockIn
            );

          const matchesDate =
            clockInDate >=
              start &&
            clockInDate <=
              end;

          const matchesEmployee =
            !selectedEmployeeId ||
            entry.employeeId ===
              Number(
                selectedEmployeeId
              );

          return (
            matchesDate &&
            matchesEmployee
          );
        }
      );
    }, [
      entries,
      startDate,
      endDate,
      selectedEmployeeId,
    ]);

  const totalHours =
    filteredEntries.reduce(
      (
        total,
        entry
      ) =>
        total +
        calculateHours(
          entry.clockIn,
          entry.clockOut
        ),
      0
    );

  const employeeSummary =
    useMemo(() => {
      const totals =
        new Map<
          string,
          {
            employeeName: string;
            hours: number;
          }
        >();

      filteredEntries.forEach(
        (entry) => {
          const current =
            totals.get(
              entry.employeeName
            ) ?? {
              employeeName:
                entry.employeeName,
              hours: 0,
            };

          current.hours +=
            calculateHours(
              entry.clockIn,
              entry.clockOut
            );

          totals.set(
            entry.employeeName,
            current
          );
        }
      );

      return Array.from(
        totals.values()
      ).sort(
        (a, b) =>
          b.hours -
          a.hours
      );
    }, [filteredEntries]);

  const projectSummary =
    useMemo(() => {
      const totals =
        new Map<
          string,
          {
            projectName: string;
            hours: number;
          }
        >();

      filteredEntries.forEach(
        (entry) => {
          const current =
            totals.get(
              entry.projectName
            ) ?? {
              projectName:
                entry.projectName,
              hours: 0,
            };

          current.hours +=
            calculateHours(
              entry.clockIn,
              entry.clockOut
            );

          totals.set(
            entry.projectName,
            current
          );
        }
      );

      return Array.from(
        totals.values()
      ).sort(
        (a, b) =>
          b.hours -
          a.hours
      );
    }, [filteredEntries]);

  const quickBooksSummary =
    useMemo(() => {
      const projectLookup =
        new Map(
          projects.map(
            (project) => [
              project.id,
              project,
            ]
          )
        );

      const grouped =
        new Map<
          number,
          {
            projectId: number;
            projectName: string;
            customerName: string;
            totalHours: number;
            employees: Map<
              number,
              {
                employeeId: number;
                employeeName: string;
                hours: number;
              }
            >;
          }
        >();

      filteredEntries.forEach(
        (entry) => {
          const project =
            projectLookup.get(
              entry.projectId
            );

          const existing =
            grouped.get(
              entry.projectId
            ) ?? {
              projectId:
                entry.projectId,
              projectName:
                entry.projectName,
              customerName:
                project?.customer ||
                "Customer not available",
              totalHours: 0,
              employees:
                new Map(),
            };

          const entryHours =
            calculateHours(
              entry.clockIn,
              entry.clockOut
            );

          existing.totalHours +=
            entryHours;

          const employee =
            existing.employees.get(
              entry.employeeId
            ) ?? {
              employeeId:
                entry.employeeId,
              employeeName:
                entry.employeeName,
              hours: 0,
            };

          employee.hours +=
            entryHours;

          existing.employees.set(
            entry.employeeId,
            employee
          );

          grouped.set(
            entry.projectId,
            existing
          );
        }
      );

      return Array.from(
        grouped.values()
      )
        .map((group) => ({
          ...group,
          employees:
            Array.from(
              group.employees.values()
            ).sort(
              (a, b) =>
                b.hours - a.hours
            ),
        }))
        .sort(
          (a, b) =>
            b.totalHours -
            a.totalHours
        );
    }, [
      filteredEntries,
      projects,
    ]);

  function setDatePreset(
    preset:
      | "today"
      | "yesterday"
      | "week"
  ) {
    if (preset === "today") {
      const today =
        getTodayDate();

      setStartDate(today);
      setEndDate(today);

      return;
    }

    if (
      preset === "yesterday"
    ) {
      const yesterday =
        getYesterdayDate();

      setStartDate(
        yesterday
      );

      setEndDate(
        yesterday
      );

      return;
    }

    const today =
      new Date();

    const day =
      today.getDay();

    const diffToMonday =
      day === 0
        ? -6
        : 1 - day;

    const monday =
      new Date(today);

    monday.setDate(
      today.getDate() +
        diffToMonday
    );

    const start =
      `${monday.getFullYear()}-${String(
        monday.getMonth() + 1
      ).padStart(2, "0")}-${String(
        monday.getDate()
      ).padStart(2, "0")}`;

    setStartDate(start);
    setEndDate(
      getTodayDate()
    );
  }

  function getProjectInvoiceStatus(
    projectId: number
  ) {
    return (
      invoiceStatuses[
        projectId
      ] ?? null
    );
  }

  function isProjectInvoiced(
    projectId: number
  ) {
    return Boolean(
      getProjectInvoiceStatus(
        projectId
      )?.invoiced
    );
  }

  async function toggleProjectInvoiced(
    projectId: number
  ) {
    if (
      selectedEmployeeId
    ) {
      showToast(
        "Select All employees before changing invoice status.",
        "warning"
      );

      return;
    }

    const currentStatus =
      getProjectInvoiceStatus(
        projectId
      );

    const nextInvoiced =
      !currentStatus?.invoiced;

    try {
      setSavingInvoiceProjectId(
        projectId
      );

      const response =
        await fetch(
          "/api/invoice-status",
          {
            method: "PUT",
            headers: {
              "Content-Type":
                "application/json",
            },
            body:
              JSON.stringify({
                projectId,
                startDate,
                endDate,
                invoiced:
                  nextInvoiced,
              }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to save invoice status."
        );
      }

      const savedStatus =
        data as InvoiceStatus;

      setInvoiceStatuses(
        (current) => ({
          ...current,
          [projectId]:
            savedStatus,
        })
      );

      showToast(
        nextInvoiced
          ? "Project marked as invoiced."
          : "Invoice status removed.",
        "success"
      );
    } catch (error) {
      console.error(
        "Invoice status save failed:",
        error
      );

      showToast(
        error instanceof Error
          ? error.message
          : "Unable to save invoice status.",
        "error"
      );
    } finally {
      setSavingInvoiceProjectId(
        null
      );
    }
  }

  async function markQueueItemInvoiced(
    item: InvoiceQueueItem
  ) {
    const queueKey =
      `${item.workDate}:${item.projectId}`;

    try {
      setSavingQueueKey(
        queueKey
      );

      const response =
        await fetch(
          "/api/invoice-status",
          {
            method: "PUT",
            headers: {
              "Content-Type":
                "application/json",
            },
            body:
              JSON.stringify({
                projectId:
                  item.projectId,
                startDate:
                  item.workDate,
                endDate:
                  item.workDate,
                invoiced: true,
              }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to mark invoice queue item."
        );
      }

      setInvoiceQueue(
        (current) =>
          current.filter(
            (queueItem) =>
              !(
                queueItem.projectId ===
                  item.projectId &&
                queueItem.workDate ===
                  item.workDate
              )
          )
      );

      /*
        If the currently selected report is the
        same single day, refresh its invoice
        status too so both sections stay synced.
      */
      if (
        startDate ===
          item.workDate &&
        endDate ===
          item.workDate
      ) {
        await loadInvoiceStatuses();
      }

      showToast(
        "Work marked as invoiced.",
        "success"
      );
    } catch (error) {
      console.error(
        "Invoice queue save failed:",
        error
      );

      showToast(
        error instanceof Error
          ? error.message
          : "Unable to mark invoice queue item.",
        "error"
      );
    } finally {
      setSavingQueueKey(
        null
      );
    }
  }

  const invoiceQueueHours =
    invoiceQueue.reduce(
      (total, item) =>
        total +
        item.totalHours,
      0
    );

  const invoiceQueueProjects =
    new Set(
      invoiceQueue.map(
        (item) =>
          item.projectId
      )
    ).size;

  const invoicedProjectCount =
    quickBooksSummary.filter(
      (group) =>
        isProjectInvoiced(
          group.projectId
        )
    ).length;

  const uninvoicedProjectCount =
    quickBooksSummary.length -
    invoicedProjectCount;

  const uninvoicedHours =
    quickBooksSummary.reduce(
      (total, group) =>
        isProjectInvoiced(
          group.projectId
        )
          ? total
          : total +
            group.totalHours,
      0
    );

  const visibleQuickBooksSummary =
    quickBooksSummary.filter(
      (group) => {
        if (
          invoiceFilter ===
          "invoiced"
        ) {
          return isProjectInvoiced(
            group.projectId
          );
        }

        if (
          invoiceFilter ===
          "uninvoiced"
        ) {
          return !isProjectInvoiced(
            group.projectId
          );
        }

        return true;
      }
    );

  const selectedEmployeeName =
    selectedEmployeeId
      ? getEmployeeName(
          employees.find(
            (employee) =>
              employee.id ===
              Number(
                selectedEmployeeId
              )
          ) ??
            {
              id: 0,
              companyId: 0,
              firstName: "Selected",
              lastName: "Employee",
              email: null,
              phone: null,
              role: "EMPLOYEE",
              active: true,
              createdAt: "",
              updatedAt: "",
            }
        )
      : "All employees";

  const reportDateLabel =
    startDate === endDate
      ? new Date(
          `${startDate}T00:00:00`
        ).toLocaleDateString()
      : `${new Date(
          `${startDate}T00:00:00`
        ).toLocaleDateString()} - ${new Date(
          `${endDate}T00:00:00`
        ).toLocaleDateString()}`;

  async function handlePrint() {
    try {
      if (
        !Capacitor.isNativePlatform() ||
        Capacitor.getPlatform() !==
          "android"
      ) {
        window.print();
        return;
      }

      const printReport =
        document.getElementById(
          "print-report"
        );

      if (!printReport) {
        showToast(
          "Unable to prepare the report.",
          "error"
        );
        return;
      }

      const stylesheetHtml =
        Array.from(
          document.querySelectorAll<
            HTMLLinkElement
          >(
            'link[rel="stylesheet"]'
          )
        )
          .map((link) => {
            const absoluteUrl =
              new URL(
                link.href,
                window.location.href
              ).href;

            return `<link rel="stylesheet" href="${absoluteUrl}">`;
          })
          .join("");

      const inlineStyles =
        Array.from(
          document.querySelectorAll<
            HTMLStyleElement
          >("style")
        )
          .map(
            (style) =>
              style.outerHTML
          )
          .join("");

      const reportHtml = `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />

            <meta
              name="viewport"
              content="width=device-width, initial-scale=1"
            />

            ${stylesheetHtml}
            ${inlineStyles}

            <style>
              html,
              body {
                margin: 0;
                padding: 0;
                background: white !important;
                color: black !important;
                font-family: Arial, Helvetica, sans-serif;
              }

              #print-report {
                display: block !important;
                visibility: visible !important;
                background: white !important;
                color: black !important;
              }

              #print-report,
              #print-report * {
                visibility: visible !important;
              }

              @page {
                size: letter;
                margin: 0.45in;
              }
            </style>
          </head>

          <body>
            ${printReport.outerHTML}
          </body>
        </html>
      `;

      await NativePrint.printHtml({
        html: reportHtml,
        jobName:
          `JobClokr Labor Report - ${reportDateLabel}`,
      });
    } catch (error) {
      console.error(
        "Native printing failed:",
        error
      );

      showToast(
        error instanceof Error
          ? error.message
          : "Unable to open the print screen.",
        "error"
      );
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6 print:hidden">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-bold">
              Reports
            </h1>

            <p className="mt-1 text-gray-500">
              Review employee and
              project labor hours.
            </p>
          </div>

          <button
            type="button"
            onClick={
              handlePrint
            }
            className="rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
          >
            Print Report
          </button>
        </div>

        {loading && (
          <div className="rounded-xl bg-white p-6 shadow">
            <p className="text-gray-500">
              Loading report data...
            </p>
          </div>
        )}

        {loadError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {loadError}
          </div>
        )}

        <div className="rounded-xl bg-white p-5 shadow dark:bg-slate-900 sm:p-6">
          <div className="mb-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                setDatePreset(
                  "yesterday"
                )
              }
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Yesterday
            </button>

            <button
              type="button"
              onClick={() =>
                setDatePreset(
                  "today"
                )
              }
              className="rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Today
            </button>

            <button
              type="button"
              onClick={() =>
                setDatePreset(
                  "week"
                )
              }
              className="rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              This Week
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Start Date
            </label>

            <input
              type="date"
              value={
                startDate
              }
              onChange={(
                event
              ) =>
                setStartDate(
                  event.target
                    .value
                )
              }
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              End Date
            </label>

            <input
              type="date"
              value={endDate}
              onChange={(
                event
              ) =>
                setEndDate(
                  event.target
                    .value
                )
              }
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Employee
            </label>

            <select
              value={
                selectedEmployeeId
              }
              onChange={(
                event
              ) =>
                setSelectedEmployeeId(
                  event.target
                    .value
                )
              }
              className="w-full rounded-lg border p-3"
            >
              <option value="">
                All employees
              </option>

              {employees.map(
                (employee) => (
                  <option
                    key={
                      employee.id
                    }
                    value={
                      employee.id
                    }
                  >
                    {getEmployeeName(
                      employee
                    )}
                  </option>
                )
              )}
            </select>
          </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-xl bg-white p-6 shadow">
            <p className="text-sm text-gray-500">
              Total Labor Hours
            </p>

            <p className="mt-2 text-4xl font-bold">
              {totalHours.toFixed(
                2
              )}
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow">
            <p className="text-sm text-gray-500">
              Time Entries
            </p>

            <p className="mt-2 text-4xl font-bold">
              {
                filteredEntries.length
              }
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow">
            <p className="text-sm text-gray-500">
              Employees Included
            </p>

            <p className="mt-2 text-4xl font-bold">
              {
                employeeSummary.length
              }
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-white p-5 shadow dark:bg-slate-900 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                Office / Receptionist
              </p>

              <h2 className="mt-1 text-2xl font-semibold">
                Invoice Queue
              </h2>

              <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                Outstanding completed labor from the previous 30 days that still needs to be entered into QuickBooks.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                void loadInvoiceQueue()
              }
              disabled={
                invoiceQueueLoading
              }
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              {invoiceQueueLoading
                ? "Refreshing..."
                : "Refresh Queue"}
            </button>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-amber-50 p-3 dark:bg-amber-950/30">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
                Queue Items
              </p>

              <p className="mt-1 text-xl font-bold text-amber-950 dark:text-amber-100">
                {invoiceQueue.length}
              </p>
            </div>

            <div className="rounded-xl bg-blue-50 p-3 dark:bg-blue-950/30">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">
                Outstanding Hours
              </p>

              <p className="mt-1 text-xl font-bold text-blue-950 dark:text-blue-100">
                {invoiceQueueHours.toFixed(
                  2
                )}
              </p>
            </div>

            <div className="col-span-2 rounded-xl bg-slate-50 p-3 sm:col-span-1 dark:bg-slate-800">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                Projects
              </p>

              <p className="mt-1 text-xl font-bold">
                {invoiceQueueProjects}
              </p>
            </div>
          </div>

          {invoiceQueueError && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
              {invoiceQueueError}
            </div>
          )}

          {invoiceQueueLoading ? (
            <div className="mt-4 rounded-xl border border-dashed p-6 text-center text-gray-500 dark:text-slate-400">
              Loading outstanding invoice work...
            </div>
          ) : invoiceQueue.length >
            0 ? (
            <div className="mt-4 space-y-4">
              {invoiceQueue.map(
                (item) => {
                  const queueKey =
                    `${item.workDate}:${item.projectId}`;

                  return (
                    <div
                      key={queueKey}
                      className="rounded-xl border border-amber-200 p-4 dark:border-amber-900/70"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
                            Needs Invoicing
                          </p>

                          <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
                            {item.customerName}
                          </p>

                          <h3 className="mt-1 text-lg font-bold">
                            {item.projectName}
                          </h3>

                          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            {new Date(
                              `${item.workDate}T00:00:00`
                            ).toLocaleDateString()}
                          </p>
                        </div>

                        <div className="shrink-0 rounded-lg bg-blue-50 px-3 py-2 text-right dark:bg-blue-950/40">
                          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">
                            Total
                          </p>

                          <p className="mt-1 text-xl font-bold text-blue-950 dark:text-blue-100">
                            {item.totalHours.toFixed(
                              2
                            )}{" "}
                            hrs
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 space-y-2">
                        {item.employees.map(
                          (employee) => (
                            <div
                              key={
                                employee.employeeId
                              }
                              className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-3 dark:bg-slate-800"
                            >
                              <span className="font-medium">
                                {employee.employeeName}
                              </span>

                              <span className="font-semibold">
                                {employee.hours.toFixed(
                                  2
                                )}{" "}
                                hrs
                              </span>
                            </div>
                          )
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          void markQueueItemInvoiced(
                            item
                          )
                        }
                        disabled={
                          savingQueueKey ===
                          queueKey
                        }
                        className="mt-4 flex w-full items-center justify-between rounded-xl bg-green-600 px-4 py-3 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <span>
                          {savingQueueKey ===
                          queueKey
                            ? "Saving..."
                            : "✓ Mark as Invoiced"}
                        </span>

                        <span className="text-xs font-medium text-green-100">
                          QuickBooks
                        </span>
                      </button>
                    </div>
                  );
                }
              )}
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-green-300 bg-green-50 p-6 text-center dark:border-green-900 dark:bg-green-950/20">
              <p className="font-semibold text-green-800 dark:text-green-300">
                Invoice queue is clear.
              </p>

              <p className="mt-1 text-sm text-green-700 dark:text-green-400">
                No completed labor from the previous 30 days is waiting to be invoiced.
              </p>
            </div>
          )}
        </div>

        <div className="rounded-xl bg-white p-5 shadow dark:bg-slate-900 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                Office / Receptionist
              </p>

              <h2 className="mt-1 text-2xl font-semibold">
                QuickBooks Daily Summary
              </h2>

              <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                Review where employees worked and the labor hours to enter on customer invoices.
              </p>
            </div>

            <div className="text-right text-sm text-gray-500 dark:text-slate-400">
              <p>
                {quickBooksSummary.length}{" "}
                {quickBooksSummary.length === 1
                  ? "project"
                  : "projects"}
              </p>

              <p className="mt-1 font-medium">
                {invoiceStatusesLoading
                  ? "Loading invoice status..."
                  : `${uninvoicedProjectCount} need invoicing`}
              </p>
            </div>
          </div>

          {quickBooksSummary.length > 0 ? (
            <div className="mt-5">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-amber-50 p-3 dark:bg-amber-950/30">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
                    Needs Invoicing
                  </p>

                  <p className="mt-1 text-xl font-bold text-amber-950 dark:text-amber-100">
                    {uninvoicedProjectCount}
                  </p>
                </div>

                <div className="rounded-xl bg-blue-50 p-3 dark:bg-blue-950/30">
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">
                    Uninvoiced Hours
                  </p>

                  <p className="mt-1 text-xl font-bold text-blue-950 dark:text-blue-100">
                    {uninvoicedHours.toFixed(
                      2
                    )}
                  </p>
                </div>

                <div className="col-span-2 rounded-xl bg-green-50 p-3 sm:col-span-1 dark:bg-green-950/30">
                  <p className="text-xs font-semibold uppercase tracking-wide text-green-700 dark:text-green-300">
                    Invoiced
                  </p>

                  <p className="mt-1 text-xl font-bold text-green-950 dark:text-green-100">
                    {invoicedProjectCount}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setInvoiceFilter(
                      "uninvoiced"
                    )
                  }
                  className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                    invoiceFilter ===
                    "uninvoiced"
                      ? "bg-blue-600 text-white"
                      : "border border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                  }`}
                >
                  Needs Invoicing
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setInvoiceFilter(
                      "invoiced"
                    )
                  }
                  className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                    invoiceFilter ===
                    "invoiced"
                      ? "bg-blue-600 text-white"
                      : "border border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                  }`}
                >
                  Invoiced
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setInvoiceFilter(
                      "all"
                    )
                  }
                  className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                    invoiceFilter ===
                    "all"
                      ? "bg-blue-600 text-white"
                      : "border border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                  }`}
                >
                  All
                </button>
              </div>

              {visibleQuickBooksSummary.length >
              0 ? (
                <div className="mt-4 space-y-4">
                  {visibleQuickBooksSummary.map(
                (group) => (
                  <div
                    key={
                      group.projectId
                    }
                    className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                          {group.customerName}
                        </p>

                        <h3 className="mt-1 text-lg font-bold">
                          {group.projectName}
                        </h3>
                      </div>

                      <div className="shrink-0 rounded-lg bg-blue-50 px-3 py-2 text-right dark:bg-blue-950/40">
                        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">
                          Total
                        </p>

                        <p className="mt-1 text-xl font-bold text-blue-950 dark:text-blue-100">
                          {group.totalHours.toFixed(
                            2
                          )}{" "}
                          hrs
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      {group.employees.map(
                        (employee) => (
                          <div
                            key={
                              employee.employeeId
                            }
                            className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-3 dark:bg-slate-800"
                          >
                            <span className="font-medium">
                              {employee.employeeName}
                            </span>

                            <span className="font-semibold">
                              {employee.hours.toFixed(
                                2
                              )}{" "}
                              hrs
                            </span>
                          </div>
                        )
                      )}
                    </div>

                    <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={() =>
                          void toggleProjectInvoiced(
                            group.projectId
                          )
                        }
                        disabled={
                          invoiceStatusesLoading ||
                          savingInvoiceProjectId ===
                            group.projectId ||
                          Boolean(
                            selectedEmployeeId
                          )
                        }
                        className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                          isProjectInvoiced(
                            group.projectId
                          )
                            ? "border-green-300 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950/30 dark:text-green-300"
                            : "border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <span
                            className={`flex h-6 w-6 items-center justify-center rounded-md border text-sm ${
                              isProjectInvoiced(
                                group.projectId
                              )
                                ? "border-green-600 bg-green-600 text-white"
                                : "border-slate-400"
                            }`}
                            aria-hidden="true"
                          >
                            {isProjectInvoiced(
                              group.projectId
                            )
                              ? "✓"
                              : ""}
                          </span>

                          <span>
                            {savingInvoiceProjectId ===
                            group.projectId
                              ? "Saving..."
                              : isProjectInvoiced(
                                  group.projectId
                                )
                                ? "Invoiced"
                                : "Mark as Invoiced"}
                          </span>
                        </span>

                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                          QuickBooks
                        </span>
                      </button>

                      {selectedEmployeeId ? (
                        <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
                          Select All employees to change invoice status for this project.
                        </p>
                      ) : isProjectInvoiced(
                          group.projectId
                        ) ? (
                        <div className="mt-2 text-xs text-green-700 dark:text-green-300">
                          <p>
                            Marked invoiced for this selected date range.
                          </p>

                          {getProjectInvoiceStatus(
                            group.projectId
                          )?.markedByName && (
                            <p className="mt-1">
                              By{" "}
                              {
                                getProjectInvoiceStatus(
                                  group.projectId
                                )?.markedByName
                              }
                              {getProjectInvoiceStatus(
                                group.projectId
                              )?.invoicedAt
                                ? ` • ${new Date(
                                    getProjectInvoiceStatus(
                                      group.projectId
                                    )!.invoicedAt!
                                  ).toLocaleString()}`
                                : ""}
                            </p>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </div>
                  )
                )}
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-dashed p-6 text-center text-gray-500 dark:text-slate-400">
                  {invoiceFilter ===
                  "uninvoiced"
                    ? "Everything in this date range has been invoiced."
                    : invoiceFilter ===
                        "invoiced"
                      ? "No projects in this date range have been marked invoiced yet."
                      : "No projects match this filter."}
                </div>
              )}
            </div>
          ) : (
            <div className="mt-5 rounded-xl border border-dashed p-6 text-center text-gray-500 dark:text-slate-400">
              No labor was recorded for the selected date range.
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="rounded-xl bg-white p-6 shadow">
            <h2 className="mb-5 text-2xl font-semibold">
              Hours by Employee
            </h2>

            {employeeSummary.length >
            0 ? (
              <div className="space-y-3">
                {employeeSummary.map(
                  (
                    summary
                  ) => (
                    <div
                      key={
                        summary.employeeName
                      }
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <span>
                        {
                          summary.employeeName
                        }
                      </span>

                      <span className="font-semibold">
                        {summary.hours.toFixed(
                          2
                        )}{" "}
                        hrs
                      </span>
                    </div>
                  )
                )}
              </div>
            ) : (
              <p className="text-gray-500">
                No employee hours
                found for this date
                range.
              </p>
            )}
          </div>

          <div className="rounded-xl bg-white p-6 shadow">
            <h2 className="mb-5 text-2xl font-semibold">
              Hours by Project
            </h2>

            {projectSummary.length >
            0 ? (
              <div className="space-y-3">
                {projectSummary.map(
                  (
                    summary
                  ) => (
                    <div
                      key={
                        summary.projectName
                      }
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <span>
                        {
                          summary.projectName
                        }
                      </span>

                      <span className="font-semibold">
                        {summary.hours.toFixed(
                          2
                        )}{" "}
                        hrs
                      </span>
                    </div>
                  )
                )}
              </div>
            ) : (
              <p className="text-gray-500">
                No project hours
                found for this date
                range.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-xl bg-white p-5 shadow dark:bg-slate-900 sm:p-6">
          <h2 className="mb-5 text-2xl font-semibold">
            Time Entry Details
          </h2>

          {filteredEntries.length > 0 ? (
            <>
              <div className="space-y-4 md:hidden">
                {filteredEntries.map(
                  (entry) => (
                    <div
                      key={entry.id}
                      className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold">
                            {entry.employeeName}
                          </p>

                          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            {entry.projectName}
                          </p>
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            Date
                          </p>

                          <p className="mt-1 text-sm font-medium">
                            {formatDate(
                              entry.clockIn
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            Clock In
                          </p>

                          <p className="mt-1 font-semibold">
                            {formatTime(
                              entry.clockIn
                            )}
                          </p>
                        </div>

                        <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            Clock Out
                          </p>

                          <p className="mt-1 font-semibold">
                            {entry.clockOut
                              ? formatTime(
                                  entry.clockOut
                                )
                              : "Present"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 rounded-lg bg-blue-50 p-3 dark:bg-blue-950/40">
                        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">
                          Hours
                        </p>

                        <p className="mt-1 text-xl font-bold text-blue-950 dark:text-blue-100">
                          {calculateHours(
                            entry.clockIn,
                            entry.clockOut
                          ).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  )
                )}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full">
                  <thead className="bg-slate-100 dark:bg-slate-800">
                    <tr>
                      <th className="p-4 text-left">
                        Date
                      </th>

                      <th className="p-4 text-left">
                        Employee
                      </th>

                      <th className="p-4 text-left">
                        Project
                      </th>

                      <th className="p-4 text-left">
                        Clock In
                      </th>

                      <th className="p-4 text-left">
                        Clock Out
                      </th>

                      <th className="p-4 text-left">
                        Hours
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredEntries.map(
                      (entry) => (
                        <tr
                          key={entry.id}
                          className="border-t dark:border-slate-700"
                        >
                          <td className="p-4">
                            {formatDate(
                              entry.clockIn
                            )}
                          </td>

                          <td className="p-4">
                            {entry.employeeName}
                          </td>

                          <td className="p-4">
                            {entry.projectName}
                          </td>

                          <td className="p-4">
                            {formatTime(
                              entry.clockIn
                            )}
                          </td>

                          <td className="p-4">
                            {entry.clockOut
                              ? formatTime(
                                  entry.clockOut
                                )
                              : "Present"}
                          </td>

                          <td className="p-4">
                            {calculateHours(
                              entry.clockIn,
                              entry.clockOut
                            ).toFixed(2)}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="text-gray-500 dark:text-slate-400">
              No time entries found for this date range.
            </p>
          )}
        </div>
      </div>

      <div
        id="print-report"
        className="hidden bg-white text-black print:block"
      >
        <div className="mx-auto max-w-[8.5in] px-8 py-6">
          <div className="border-b-2 border-slate-900 pb-4">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                  JobClokr
                </p>

                <h1 className="mt-1 text-3xl font-bold">
                  Labor Report
                </h1>

                <p className="mt-1 text-sm text-slate-600">
                  Time tracking report for office records
                </p>
              </div>

              <div className="text-right text-sm">
                <p className="font-semibold">
                  Lucas Communications
                </p>

                <p className="mt-1 text-slate-600">
                  {reportDateLabel}
                </p>

                <p className="mt-1 text-slate-600">
                  {selectedEmployeeName}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-slate-300 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Total Labor Hours
              </p>

              <p className="mt-1 text-2xl font-bold">
                {totalHours.toFixed(
                  2
                )}
              </p>
            </div>

            <div className="rounded-lg border border-slate-300 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Time Entries
              </p>

              <p className="mt-1 text-2xl font-bold">
                {filteredEntries.length}
              </p>
            </div>

            <div className="rounded-lg border border-slate-300 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Employees
              </p>

              <p className="mt-1 text-2xl font-bold">
                {employeeSummary.length}
              </p>
            </div>
          </div>

          <section className="mt-6">
            <h2 className="text-xl font-bold">
              Hours by Employee
            </h2>

            {employeeSummary.length >
            0 ? (
              <table className="mt-3 w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b-2 border-slate-900">
                    <th className="py-2 text-left">
                      Employee
                    </th>

                    <th className="py-2 text-right">
                      Hours
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {employeeSummary.map(
                    (summary) => (
                      <tr
                        key={
                          summary.employeeName
                        }
                        className="border-b border-slate-300"
                      >
                        <td className="py-2">
                          {summary.employeeName}
                        </td>

                        <td className="py-2 text-right font-semibold">
                          {summary.hours.toFixed(
                            2
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            ) : (
              <p className="mt-2 text-sm text-slate-500">
                No employee hours found for this date range.
              </p>
            )}
          </section>

          <section className="mt-6">
            <h2 className="text-xl font-bold">
              Hours by Project
            </h2>

            {quickBooksSummary.length >
            0 ? (
              <div className="mt-3 space-y-3">
                {quickBooksSummary.map(
                  (group) => (
                    <div
                      key={
                        group.projectId
                      }
                      className="break-inside-avoid rounded-lg border border-slate-300 p-3"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            {group.customerName}
                          </p>

                          <p className="mt-1 font-bold">
                            {group.projectName}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Total
                          </p>

                          <p className="mt-1 font-bold">
                            {group.totalHours.toFixed(
                              2
                            )}{" "}
                            hrs
                          </p>
                        </div>
                      </div>

                      <div className="mt-2 space-y-1">
                        {group.employees.map(
                          (
                            employee
                          ) => (
                            <div
                              key={
                                employee.employeeId
                              }
                              className="flex justify-between gap-4 text-sm"
                            >
                              <span>
                                {employee.employeeName}
                              </span>

                              <span className="font-medium">
                                {employee.hours.toFixed(
                                  2
                                )}{" "}
                                hrs
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-500">
                No project hours found for this date range.
              </p>
            )}
          </section>

          <section className="mt-6">
            <h2 className="text-xl font-bold">
              Time Entry Details
            </h2>

            {filteredEntries.length >
            0 ? (
              <table className="mt-3 w-full border-collapse text-xs">
                <thead>
                  <tr className="border-b-2 border-slate-900">
                    <th className="py-2 pr-3 text-left">
                      Date
                    </th>

                    <th className="py-2 pr-3 text-left">
                      Employee
                    </th>

                    <th className="py-2 pr-3 text-left">
                      Project
                    </th>

                    <th className="py-2 pr-3 text-left">
                      Clock In
                    </th>

                    <th className="py-2 pr-3 text-left">
                      Clock Out
                    </th>

                    <th className="py-2 text-right">
                      Hours
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredEntries.map(
                    (entry) => (
                      <tr
                        key={entry.id}
                        className="break-inside-avoid border-b border-slate-300"
                      >
                        <td className="py-2 pr-3">
                          {formatDate(
                            entry.clockIn
                          )}
                        </td>

                        <td className="py-2 pr-3">
                          {entry.employeeName}
                        </td>

                        <td className="py-2 pr-3">
                          {entry.projectName}
                        </td>

                        <td className="py-2 pr-3">
                          {formatTime(
                            entry.clockIn
                          )}
                        </td>

                        <td className="py-2 pr-3">
                          {entry.clockOut
                            ? formatTime(
                                entry.clockOut
                              )
                            : "Present"}
                        </td>

                        <td className="py-2 text-right font-semibold">
                          {calculateHours(
                            entry.clockIn,
                            entry.clockOut
                          ).toFixed(2)}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            ) : (
              <p className="mt-2 text-sm text-slate-500">
                No time entries found for this date range.
              </p>
            )}
          </section>

          <div className="mt-8 border-t border-slate-300 pt-3 text-xs text-slate-500">
            Generated from JobClokr.
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: auto;
            margin: 0.45in;
          }

          html,
          body {
            background: #ffffff !important;
            color: #000000 !important;
          }

          body * {
            visibility: hidden !important;
          }

          #print-report,
          #print-report * {
            visibility: visible !important;
          }

          #print-report {
            display: block !important;
            position: absolute !important;
            inset: 0 auto auto 0 !important;
            width: 100% !important;
            min-height: 100% !important;
            background: #ffffff !important;
            color: #000000 !important;
          }

          #print-report table {
            color: #000000 !important;
          }

          #print-report thead {
            display: table-header-group;
            background: #ffffff !important;
          }

          #print-report tr,
          #print-report section,
          #print-report .break-inside-avoid {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>
    </AppLayout>
  );
}