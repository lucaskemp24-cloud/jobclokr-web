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
  companyId?: number;
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

function getCompanyId(
  sessionCompanyId: number | null,
  requestedCompanyId?: number
) {
  if (
    sessionCompanyId !==
    null
  ) {
    return sessionCompanyId;
  }

  if (
    requestedCompanyId !==
      undefined &&
    Number.isInteger(
      requestedCompanyId
    ) &&
    requestedCompanyId >
      0
  ) {
    return requestedCompanyId;
  }

  return null;
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

    const companyIdValue =
      url.searchParams.get(
        "companyId"
      );

    const requestedCompanyId =
      companyIdValue
        ? Number(
            companyIdValue
          )
        : undefined;

    const companyId =
      getCompanyId(
        session.companyId,
        requestedCompanyId
      );

    if (!companyId) {
      return NextResponse.json(
        {
          error:
            "A company is required.",
        },
        {
          status: 400,
        }
      );
    }

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

    const statuses =
      await prisma.projectInvoiceStatus.findMany({
        where: {
          companyId,
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
          projectId:
            "asc",
        },
      });

    return NextResponse.json(
      statuses.map(
        (
          status
        ) => ({
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

    const requestedCompanyId =
      body.companyId ===
        undefined ||
      body.companyId ===
        null
        ? undefined
        : Number(
            body.companyId
          );

    const companyId =
      getCompanyId(
        session.companyId,
        requestedCompanyId
      );

    if (!companyId) {
      return NextResponse.json(
        {
          error:
            "A company is required.",
        },
        {
          status: 400,
        }
      );
    }

    const projectId =
      Number(
        body.projectId
      );

    if (
      !Number.isInteger(
        projectId
      ) ||
      projectId <=
        0
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

          companyId,
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

    const markedByEmployeeId =
      session.accountType ===
        "COMPANY_USER"
        ? session.employeeId
        : null;

    const status =
      await prisma.projectInvoiceStatus.upsert({
        where: {
          companyId_projectId_startDate_endDate:
            {
              companyId,

              projectId,

              startDate,

              endDate,
            },
        },

        create: {
          companyId,

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
              ? markedByEmployeeId
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
              ? markedByEmployeeId
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
          : session.accountType ===
              "PLATFORM_ADMIN" &&
            status.invoiced
            ? session.name
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