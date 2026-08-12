import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

const COMPANY_ID = 1;

function serializeTimeEntry(entry: {
  id: number;
  employeeId: number;
  projectId: number;
  clockIn: Date;
  clockOut: Date | null;
  notes: string | null;
  employee: {
    firstName: string;
    lastName: string;
  };
  project: {
    name: string;
  };
}) {
  return {
    id: entry.id,
    employeeId: entry.employeeId,
    employeeName:
      `${entry.employee.firstName} ${entry.employee.lastName}`.trim(),
    projectId: entry.projectId,
    projectName: entry.project.name,
    clockIn: entry.clockIn.toISOString(),
    clockOut: entry.clockOut?.toISOString() ?? null,
    notes: entry.notes ?? "",
  };
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);

    const projectIdValue =
      url.searchParams.get("projectId");

    const employeeIdValue =
      url.searchParams.get("employeeId");

    const activeOnly =
      url.searchParams.get("active") === "true";

    const where: {
      projectId?: number;
      employeeId?: number;
      clockOut?: null;
      project?: {
        companyId: number;
      };
    } = {
      project: {
        companyId: COMPANY_ID,
      },
    };

    if (projectIdValue) {
      const projectId = Number(projectIdValue);

      if (
        !Number.isInteger(projectId) ||
        projectId <= 0
      ) {
        return NextResponse.json(
          {
            error: "Invalid project.",
          },
          {
            status: 400,
          }
        );
      }

      where.projectId = projectId;
    }

    if (employeeIdValue) {
      const employeeId = Number(employeeIdValue);

      if (
        !Number.isInteger(employeeId) ||
        employeeId <= 0
      ) {
        return NextResponse.json(
          {
            error: "Invalid employee.",
          },
          {
            status: 400,
          }
        );
      }

      where.employeeId = employeeId;
    }

    if (activeOnly) {
      where.clockOut = null;
    }

    const entries =
      await prisma.timeEntry.findMany({
        where,
        include: {
          employee: true,
          project: true,
        },
        orderBy: {
          clockIn: "desc",
        },
      });

    return NextResponse.json(
      entries.map(serializeTimeEntry)
    );
  } catch (error) {
    console.error(
      "Failed to load time entries:",
      error
    );

    return NextResponse.json(
      {
        error: "Unable to load time entries.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const employeeId = Number(body.employeeId);
    const projectId = Number(body.projectId);

    if (
      !Number.isInteger(employeeId) ||
      employeeId <= 0 ||
      !Number.isInteger(projectId) ||
      projectId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "A valid employee and project are required.",
        },
        {
          status: 400,
        }
      );
    }

    const [employee, project] =
      await Promise.all([
        prisma.employee.findFirst({
          where: {
            id: employeeId,
            companyId: COMPANY_ID,
            active: true,
          },
        }),
        prisma.project.findFirst({
          where: {
            id: projectId,
            companyId: COMPANY_ID,
          },
        }),
      ]);

    if (!employee) {
      return NextResponse.json(
        {
          error:
            "Active employee account not found.",
        },
        {
          status: 404,
        }
      );
    }

    if (!project) {
      return NextResponse.json(
        {
          error: "Project not found.",
        },
        {
          status: 404,
        }
      );
    }

    const existingActiveEntry =
      await prisma.timeEntry.findFirst({
        where: {
          employeeId,
          clockOut: null,
        },
        include: {
          project: true,
        },
        orderBy: {
          clockIn: "desc",
        },
      });

    if (existingActiveEntry) {
      return NextResponse.json(
        {
          error: `You are already clocked in to ${existingActiveEntry.project.name}.`,
        },
        {
          status: 409,
        }
      );
    }

    const entry =
      await prisma.timeEntry.create({
        data: {
          employeeId,
          projectId,
          clockIn: new Date(),
          notes:
            typeof body.notes === "string" &&
            body.notes.trim()
              ? body.notes.trim()
              : null,
        },
        include: {
          employee: true,
          project: true,
        },
      });

    return NextResponse.json(
      serializeTimeEntry(entry),
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Failed to clock in:",
      error
    );

    return NextResponse.json(
      {
        error: "Unable to clock in.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    const id = Number(body.id);
    const employeeId = Number(body.employeeId);

    if (
      !Number.isInteger(id) ||
      id <= 0 ||
      !Number.isInteger(employeeId) ||
      employeeId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "A valid time entry and employee are required.",
        },
        {
          status: 400,
        }
      );
    }

    const existingEntry =
      await prisma.timeEntry.findFirst({
        where: {
          id,
          employeeId,
          clockOut: null,
          project: {
            companyId: COMPANY_ID,
          },
        },
      });

    if (!existingEntry) {
      return NextResponse.json(
        {
          error:
            "Active time entry not found.",
        },
        {
          status: 404,
        }
      );
    }

    const entry =
      await prisma.timeEntry.update({
        where: {
          id,
        },
        data: {
          clockOut: new Date(),
        },
        include: {
          employee: true,
          project: true,
        },
      });

    return NextResponse.json(
      serializeTimeEntry(entry)
    );
  } catch (error) {
    console.error(
      "Failed to clock out:",
      error
    );

    return NextResponse.json(
      {
        error: "Unable to clock out.",
      },
      {
        status: 500,
      }
    );
  }
}