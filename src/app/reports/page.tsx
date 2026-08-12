"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import AppLayout from "@/components/layout/AppLayout";

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

type TimeEntry = {
  id: number;
  employeeId: number;
  employeeName: string;
  projectId: number;
  projectName: string;
  clockIn: string;
  clockOut: string | null;
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
      getTodayDate()
    );

  const [
    endDate,
    setEndDate,
  ] =
    useState(
      getTodayDate()
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

  async function loadReportData() {
    try {
      setLoadError("");

      const [
        employeesResponse,
        timeResponse,
      ] =
        await Promise.all([
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
        employeeData,
        timeData,
      ] =
        await Promise.all([
          employeesResponse.json(),
          timeResponse.json(),
        ]);

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
  }, []);

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

  function handlePrint() {
    window.print();
  }

  return (
    <AppLayout>
      <div className="space-y-6">
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

        <div className="grid grid-cols-1 gap-4 rounded-xl bg-white p-6 shadow md:grid-cols-3">
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

        <div className="rounded-xl bg-white p-6 shadow">
          <h2 className="mb-5 text-2xl font-semibold">
            Time Entry Details
          </h2>

          {filteredEntries.length >
          0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-100">
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
                    (
                      entry
                    ) => (
                      <tr
                        key={
                          entry.id
                        }
                        className="border-t"
                      >
                        <td className="p-4">
                          {formatDate(
                            entry.clockIn
                          )}
                        </td>

                        <td className="p-4">
                          {
                            entry.employeeName
                          }
                        </td>

                        <td className="p-4">
                          {
                            entry.projectName
                          }
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
                          ).toFixed(
                            2
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">
              No time entries found
              for this date range.
            </p>
          )}
        </div>
      </div>
    </AppLayout>
  );
}