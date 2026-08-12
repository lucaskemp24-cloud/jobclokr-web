import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

const COMPANY_ID = 1;

const VALID_STATUSES = [
  "Not Started",
  "Scheduled",
  "In Progress",
  "Completed",
  "Closed",
] as const;

type ProjectStatus = (typeof VALID_STATUSES)[number];

function isProjectStatus(value: string): value is ProjectStatus {
  return VALID_STATUSES.includes(value as ProjectStatus);
}

function dateOrNull(value: unknown) {
  if (!value) {
    return null;
  }

  const parsed = new Date(String(value));

  return Number.isNaN(parsed.getTime())
    ? null
    : parsed;
}

function serializeProject(project: {
  id: number;
  name: string;
  status: string;
  description: string | null;
  customerId: number;
  startDate: Date | null;
  dueDate: Date | null;
  address: string | null;
  closedAt: Date | null;
  customer: {
    name: string;
  };
  assignments?: {
    employee: {
      firstName: string;
      lastName: string;
    };
  }[];
  timeEntries?: {
    clockIn: Date;
    clockOut: Date | null;
  }[];
}) {
  const totalMilliseconds =
    project.timeEntries?.reduce((total, entry) => {
      if (!entry.clockOut) {
        return total;
      }

      return (
        total +
        (entry.clockOut.getTime() -
          entry.clockIn.getTime())
      );
    }, 0) ?? 0;

  return {
    id: project.id,
    name: project.name,
    status: project.status,
    details: project.description ?? "",
    customerId: project.customerId,
    customer: project.customer.name,
    startDate: project.startDate
      ? project.startDate.toISOString().slice(0, 10)
      : "",
    dueDate: project.dueDate
      ? project.dueDate.toISOString().slice(0, 10)
      : "",
    address: project.address ?? "",
    totalHours:
      totalMilliseconds / 3_600_000,
    employees:
      project.assignments?.map(
        ({ employee }) =>
          `${employee.firstName} ${employee.lastName}`
      ) ?? [],
    closedAt: project.closedAt
      ? project.closedAt.toISOString()
      : "",
  };
}

export async function GET(
  request: Request
) {
  try {
    const url =
      new URL(request.url);

    const customerIdValue =
      url.searchParams.get(
        "customerId"
      );

    const customerId =
      customerIdValue
        ? Number(customerIdValue)
        : null;

    if (
      customerIdValue &&
      (
        !Number.isInteger(customerId) ||
        Number(customerId) <= 0
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid customer.",
        },
        {
          status: 400,
        }
      );
    }

    const projects =
      await prisma.project.findMany({
        where: {
          companyId:
            COMPANY_ID,

          ...(customerId
            ? {
                customerId,
              }
            : {}),
        },

        include: {
          customer: true,

          assignments: {
            include: {
              employee: true,
            },
          },

          timeEntries: true,
        },

        orderBy: {
          createdAt: "desc",
        },
      });

    return NextResponse.json(
      projects.map(
        serializeProject
      )
    );
  } catch (error) {
    console.error(
      "Failed to load projects:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to load projects.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(
  request: Request
) {
  try {
    const body =
      await request.json();

    const name =
      String(
        body.name ?? ""
      ).trim();

    const customerId =
      Number(
        body.customerId
      );

    const status =
      String(
        body.status ??
          "Not Started"
      ).trim();

    const address =
      String(
        body.address ?? ""
      ).trim();

    const description =
      String(
        body.details ?? ""
      ).trim();

    if (!name) {
      return NextResponse.json(
        {
          error:
            "Project name is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isInteger(
        customerId
      ) ||
      customerId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "A valid customer is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !isProjectStatus(
        status
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid project status.",
        },
        {
          status: 400,
        }
      );
    }

    const customer =
      await prisma.customer.findFirst({
        where: {
          id: customerId,
          companyId:
            COMPANY_ID,
        },
      });

    if (!customer) {
      return NextResponse.json(
        {
          error:
            "Customer not found.",
        },
        {
          status: 404,
        }
      );
    }

    const duplicate =
      await prisma.project.findFirst({
        where: {
          companyId:
            COMPANY_ID,
          customerId,

          name: {
            equals: name,
            mode: "insensitive",
          },
        },
      });

    if (duplicate) {
      return NextResponse.json(
        {
          error:
            "This customer already has a project with that name.",
        },
        {
          status: 409,
        }
      );
    }

    const project =
      await prisma.project.create({
        data: {
          companyId:
            COMPANY_ID,

          customerId,

          name,

          description:
            description ||
            null,

          address:
            address ||
            null,

          status,

          startDate:
            dateOrNull(
              body.startDate
            ),

          dueDate:
            dateOrNull(
              body.dueDate
            ),

          closedAt:
            status ===
            "Closed"
              ? new Date()
              : null,
        },

        include: {
          customer: true,

          assignments: {
            include: {
              employee: true,
            },
          },

          timeEntries: true,
        },
      });

    return NextResponse.json(
      serializeProject(project),
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Failed to create project:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to create project.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PATCH(
  request: Request
) {
  try {
    const body =
      await request.json();

    const id =
      Number(body.id);

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid project.",
        },
        {
          status: 400,
        }
      );
    }

    const existing =
      await prisma.project.findFirst({
        where: {
          id,
          companyId:
            COMPANY_ID,
        },
      });

    if (!existing) {
      return NextResponse.json(
        {
          error:
            "Project not found.",
        },
        {
          status: 404,
        }
      );
    }

    const name =
      String(
        body.name ??
          existing.name
      ).trim();

    const status =
      String(
        body.status ??
          existing.status
      ).trim();

    const customerId =
      body.customerId ===
        undefined
        ? existing.customerId
        : Number(
            body.customerId
          );

    if (!name) {
      return NextResponse.json(
        {
          error:
            "Project name is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isInteger(
        customerId
      ) ||
      customerId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "A valid customer is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !isProjectStatus(
        status
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid project status.",
        },
        {
          status: 400,
        }
      );
    }

    const customer =
      await prisma.customer.findFirst({
        where: {
          id: customerId,
          companyId:
            COMPANY_ID,
        },
      });

    if (!customer) {
      return NextResponse.json(
        {
          error:
            "Customer not found.",
        },
        {
          status: 404,
        }
      );
    }

    const duplicate =
      await prisma.project.findFirst({
        where: {
          companyId:
            COMPANY_ID,
          customerId,

          name: {
            equals: name,
            mode: "insensitive",
          },

          NOT: {
            id,
          },
        },
      });

    if (duplicate) {
      return NextResponse.json(
        {
          error:
            "This customer already has a project with that name.",
        },
        {
          status: 409,
        }
      );
    }

    const project =
      await prisma.project.update({
        where: {
          id,
        },

        data: {
          name,

          customerId,

          status,

          address:
            String(
              body.address ??
                existing.address ??
                ""
            ).trim() ||
            null,

          description:
            String(
              body.details ??
                existing.description ??
                ""
            ).trim() ||
            null,

          startDate:
            body.startDate ===
              undefined
              ? existing.startDate
              : dateOrNull(
                  body.startDate
                ),

          dueDate:
            body.dueDate ===
              undefined
              ? existing.dueDate
              : dateOrNull(
                  body.dueDate
                ),

          closedAt:
            status ===
            "Closed"
              ? existing.closedAt ??
                new Date()
              : null,
        },

        include: {
          customer: true,

          assignments: {
            include: {
              employee: true,
            },
          },

          timeEntries: true,
        },
      });

    return NextResponse.json(
      serializeProject(project)
    );
  } catch (error) {
    console.error(
      "Failed to update project:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to update project.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(
  request: Request
) {
  try {
    const url =
      new URL(request.url);

    const id =
      Number(
        url.searchParams.get(
          "id"
        )
      );

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid project.",
        },
        {
          status: 400,
        }
      );
    }

    const project =
      await prisma.project.findFirst({
        where: {
          id,
          companyId:
            COMPANY_ID,
        },
      });

    if (!project) {
      return NextResponse.json(
        {
          error:
            "Project not found.",
        },
        {
          status: 404,
        }
      );
    }

    await prisma.project.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "Failed to delete project:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to delete project.",
      },
      {
        status: 500,
      }
    );
  }
}