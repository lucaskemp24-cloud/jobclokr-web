import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  getSession,
  isOfficeSession,
} from "@/lib/session";

const DEFAULT_LOOKBACK_DAYS = 30;
const MAX_LOOKBACK_DAYS = 365;

function getDateOnly(
  value: Date
) {
  return value
    .toISOString()
    .slice(0, 10);
}

function getUtcDate(
  value: string
) {
  return new Date(
    `${value}T00:00:00.000Z`
  );
}

function calculateHours(
  clockIn: Date,
  clockOut: Date
) {
  const milliseconds =
    clockOut.getTime() -
    clockIn.getTime();

  return Math.max(
    milliseconds /
      1000 /
      60 /
      60,
    0
  );
}

export async function GET(
  request: Request
) {
  try {
    const session =
      await getSession();

    if (
      !session ||
      !isOfficeSession(
        session
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Office access required.",
        },
        {
          status: 403,
        }
      );
    }

    const url =
      new URL(
        request.url
      );

    const requestedDays =
      Number(
        url.searchParams.get(
          "days"
        ) ??
          DEFAULT_LOOKBACK_DAYS
      );

    const lookbackDays =
      Number.isInteger(
        requestedDays
      ) &&
      requestedDays > 0
        ? Math.min(
            requestedDays,
            MAX_LOOKBACK_DAYS
          )
        : DEFAULT_LOOKBACK_DAYS;

    const today =
      new Date();

    const todayDate =
      getDateOnly(
        today
      );

    const todayStart =
      getUtcDate(
        todayDate
      );

    const rangeStart =
      new Date(
        todayStart
      );

    rangeStart.setUTCDate(
      rangeStart.getUTCDate() -
        lookbackDays
    );

    const timeEntries =
      await prisma.timeEntry.findMany({
        where: {
          clockOut: {
            not: null,
          },

          clockIn: {
            gte:
              rangeStart,

            lt:
              todayStart,
          },

          project: {
            companyId:
              session.companyId,
          },
        },

        select: {
          id: true,
          clockIn: true,
          clockOut: true,

          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },

          project: {
            select: {
              id: true,
              name: true,

              customer: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },

        orderBy: {
          clockIn: "asc",
        },
      });

    const grouped =
      new Map<
        string,
        {
          workDate: string;
          projectId: number;
          projectName: string;
          customerId: number;
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

    for (
      const entry of timeEntries
    ) {
      if (!entry.clockOut) {
        continue;
      }

      const workDate =
        getDateOnly(
          entry.clockIn
        );

      const key =
        `${workDate}:${entry.project.id}`;

      const group =
        grouped.get(
          key
        ) ?? {
          workDate,

          projectId:
            entry.project.id,

          projectName:
            entry.project.name,

          customerId:
            entry.project.customer.id,

          customerName:
            entry.project.customer.name,

          totalHours: 0,

          employees:
            new Map(),
        };

      const hours =
        calculateHours(
          entry.clockIn,
          entry.clockOut
        );

      group.totalHours +=
        hours;

      const employeeName =
        `${entry.employee.firstName} ${entry.employee.lastName}`.trim();

      const employee =
        group.employees.get(
          entry.employee.id
        ) ?? {
          employeeId:
            entry.employee.id,

          employeeName,

          hours: 0,
        };

      employee.hours +=
        hours;

      group.employees.set(
        entry.employee.id,
        employee
      );

      grouped.set(
        key,
        group
      );
    }

    const groups =
      Array.from(
        grouped.values()
      );

    if (
      groups.length === 0
    ) {
      return NextResponse.json(
        []
      );
    }

    const earliestDate =
      groups.reduce(
        (
          earliest,
          group
        ) =>
          group.workDate <
          earliest
            ? group.workDate
            : earliest,
        groups[0].workDate
      );

    const latestDate =
      groups.reduce(
        (
          latest,
          group
        ) =>
          group.workDate >
          latest
            ? group.workDate
            : latest,
        groups[0].workDate
      );

    const invoiceStatuses =
      await prisma.projectInvoiceStatus.findMany({
        where: {
          companyId:
            session.companyId,

          invoiced: true,

          startDate: {
            gte:
              getUtcDate(
                earliestDate
              ),
          },

          endDate: {
            lte:
              getUtcDate(
                latestDate
              ),
          },
        },

        select: {
          projectId: true,
          startDate: true,
          endDate: true,
          invoiced: true,
          invoicedAt: true,
          markedByEmployeeId: true,

          markedByEmployee: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      });

    const invoicedKeys =
      new Set<string>();

    for (
      const status of
      invoiceStatuses
    ) {
      if (
        !status.invoiced
      ) {
        continue;
      }

      const startDate =
        getDateOnly(
          status.startDate
        );

      const endDate =
        getDateOnly(
          status.endDate
        );

      /*
        A daily invoice status is the safest
        match for the queue.

        Range-based report statuses are also
        honored below for dates contained
        within that range.
      */

      for (
        const group of groups
      ) {
        if (
          group.projectId !==
          status.projectId
        ) {
          continue;
        }

        if (
          group.workDate >=
            startDate &&
          group.workDate <=
            endDate
        ) {
          invoicedKeys.add(
            `${group.workDate}:${group.projectId}`
          );
        }
      }
    }

    const queue =
      groups
        .filter(
          (group) =>
            !invoicedKeys.has(
              `${group.workDate}:${group.projectId}`
            )
        )
        .map(
          (group) => ({
            workDate:
              group.workDate,

            projectId:
              group.projectId,

            projectName:
              group.projectName,

            customerId:
              group.customerId,

            customerName:
              group.customerName,

            totalHours:
              Number(
                group.totalHours.toFixed(
                  2
                )
              ),

            employees:
              Array.from(
                group.employees.values()
              )
                .map(
                  (
                    employee
                  ) => ({
                    ...employee,

                    hours:
                      Number(
                        employee.hours.toFixed(
                          2
                        )
                      ),
                  })
                )
                .sort(
                  (
                    first,
                    second
                  ) =>
                    second.hours -
                    first.hours
                ),
          })
        )
        .sort(
          (
            first,
            second
          ) => {
            if (
              first.workDate !==
              second.workDate
            ) {
              return first.workDate.localeCompare(
                second.workDate
              );
            }

            return first.customerName.localeCompare(
              second.customerName
            );
          }
        );

    return NextResponse.json(
      queue
    );
  } catch (error) {
    console.error(
      "Invoice queue load failed:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to load invoice queue.",
      },
      {
        status: 500,
      }
    );
  }
}