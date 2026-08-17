import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  getSession,
  isOfficeSession,
} from "@/lib/session";

type InvoiceStatusRequestBody = {
  projectId?: number;
  startDate?: string;
  endDate?: string;
  invoiced?: boolean;
};

function parseDateOnly(
  value: string
) {
  const date =
    new Date(
      `${value}T00:00:00.000Z`
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return date;
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

    const startDateValue =
      url.searchParams.get(
        "startDate"
      );

    const endDateValue =
      url.searchParams.get(
        "endDate"
      );

    if (
      !startDateValue ||
      !endDateValue
    ) {
      return NextResponse.json(
        {
          error:
            "Start date and end date are required.",
        },
        {
          status: 400,
        }
      );
    }

    const startDate =
      parseDateOnly(
        startDateValue
      );

    const endDate =
      parseDateOnly(
        endDateValue
      );

    if (
      !startDate ||
      !endDate
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid date range.",
        },
        {
          status: 400,
        }
      );
    }

    const statuses =
      await prisma.projectInvoiceStatus.findMany({
        where: {
          companyId:
            session.companyId,

          startDate,

          endDate,
        },

        select: {
          id: true,
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

        orderBy: {
          projectId: "asc",
        },
      });

    return NextResponse.json(
      statuses.map(
        (status) => ({
          id:
            status.id,

          projectId:
            status.projectId,

          startDate:
            status.startDate.toISOString(),

          endDate:
            status.endDate.toISOString(),

          invoiced:
            status.invoiced,

          invoicedAt:
            status.invoicedAt
              ? status.invoicedAt.toISOString()
              : null,

          markedByEmployeeId:
            status.markedByEmployeeId,

          markedByName:
            status.markedByEmployee
              ? `${status.markedByEmployee.firstName} ${status.markedByEmployee.lastName}`.trim()
              : null,
        })
      )
    );
  } catch (error) {
    console.error(
      "Invoice status load failed:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to load invoice statuses.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PUT(
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

    const body =
      (await request.json()) as
        InvoiceStatusRequestBody;

    const projectId =
      Number(
        body.projectId
      );

    if (
      !Number.isInteger(
        projectId
      ) ||
      projectId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "A valid project is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      typeof body.startDate !==
        "string" ||
      typeof body.endDate !==
        "string"
    ) {
      return NextResponse.json(
        {
          error:
            "Start date and end date are required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      typeof body.invoiced !==
      "boolean"
    ) {
      return NextResponse.json(
        {
          error:
            "Invoice status is required.",
        },
        {
          status: 400,
        }
      );
    }

    const startDate =
      parseDateOnly(
        body.startDate
      );

    const endDate =
      parseDateOnly(
        body.endDate
      );

    if (
      !startDate ||
      !endDate
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid date range.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      endDate <
      startDate
    ) {
      return NextResponse.json(
        {
          error:
            "End date cannot be before start date.",
        },
        {
          status: 400,
        }
      );
    }

    const project =
      await prisma.project.findFirst({
        where: {
          id:
            projectId,

          companyId:
            session.companyId,
        },

        select: {
          id: true,
        },
      });

    if (!project) {
      return NextResponse.json(
        {
          error:
            "Project could not be found.",
        },
        {
          status: 404,
        }
      );
    }

    const status =
      await prisma.projectInvoiceStatus.upsert({
        where: {
          companyId_projectId_startDate_endDate:
            {
              companyId:
                session.companyId,

              projectId,

              startDate,

              endDate,
            },
        },

        create: {
          companyId:
            session.companyId,

          projectId,

          startDate,

          endDate,

          invoiced:
            body.invoiced,

          invoicedAt:
            body.invoiced
              ? new Date()
              : null,

          markedByEmployeeId:
            body.invoiced
              ? session.employeeId
              : null,
        },

        update: {
          invoiced:
            body.invoiced,

          invoicedAt:
            body.invoiced
              ? new Date()
              : null,

          markedByEmployeeId:
            body.invoiced
              ? session.employeeId
              : null,
        },

        select: {
          id: true,
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

    return NextResponse.json({
      id:
        status.id,

      projectId:
        status.projectId,

      startDate:
        status.startDate.toISOString(),

      endDate:
        status.endDate.toISOString(),

      invoiced:
        status.invoiced,

      invoicedAt:
        status.invoicedAt
          ? status.invoicedAt.toISOString()
          : null,

      markedByEmployeeId:
        status.markedByEmployeeId,

      markedByName:
        status.markedByEmployee
          ? `${status.markedByEmployee.firstName} ${status.markedByEmployee.lastName}`.trim()
          : null,
    });
  } catch (error) {
    console.error(
      "Invoice status save failed:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to save invoice status.",
      },
      {
        status: 500,
      }
    );
  }
}