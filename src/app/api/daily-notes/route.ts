import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

const COMPANY_ID = 1;

function serializeNote(note: {
  id: number;
  projectId: number;
  employeeId: number;
  note: string;
  createdAt: Date;
  employee: {
    firstName: string;
    lastName: string;
  };
  project: {
    name: string;
  };
}) {
  return {
    id: note.id,
    projectId: note.projectId,
    projectName: note.project.name,
    employeeId: note.employeeId,
    employeeName:
      `${note.employee.firstName} ${note.employee.lastName}`.trim(),
    note: note.note,
    createdAt: note.createdAt.toISOString(),
  };
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);

    const projectIdValue =
      url.searchParams.get("projectId");

    const employeeIdValue =
      url.searchParams.get("employeeId");

    const where: {
      projectId?: number;
      employeeId?: number;
      project?: {
        companyId: number;
      };
    } = {
      project: {
        companyId: COMPANY_ID,
      },
    };

    if (projectIdValue) {
      const projectId =
        Number(projectIdValue);

      if (
        !Number.isInteger(projectId) ||
        projectId <= 0
      ) {
        return NextResponse.json(
          { error: "Invalid project." },
          { status: 400 }
        );
      }

      where.projectId = projectId;
    }

    if (employeeIdValue) {
      const employeeId =
        Number(employeeIdValue);

      if (
        !Number.isInteger(employeeId) ||
        employeeId <= 0
      ) {
        return NextResponse.json(
          { error: "Invalid employee." },
          { status: 400 }
        );
      }

      where.employeeId = employeeId;
    }

    const notes =
      await prisma.dailyNote.findMany({
        where,
        include: {
          employee: true,
          project: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

    return NextResponse.json(
      notes.map(serializeNote)
    );
  } catch (error) {
    console.error(
      "Failed to load daily notes:",
      error
    );

    return NextResponse.json(
      { error: "Unable to load daily notes." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body =
      await request.json();

    const projectId =
      Number(body.projectId);

    const employeeId =
      Number(body.employeeId);

    const noteText =
      String(body.note ?? "").trim();

    if (
      !Number.isInteger(projectId) ||
      projectId <= 0
    ) {
      return NextResponse.json(
        { error: "A valid project is required." },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(employeeId) ||
      employeeId <= 0
    ) {
      return NextResponse.json(
        { error: "A valid employee is required." },
        { status: 400 }
      );
    }

    if (!noteText) {
      return NextResponse.json(
        { error: "Enter a daily note." },
        { status: 400 }
      );
    }

    if (noteText.length > 5000) {
      return NextResponse.json(
        {
          error:
            "Daily notes must be 5,000 characters or fewer.",
        },
        { status: 400 }
      );
    }

    const [project, employee] =
      await Promise.all([
        prisma.project.findFirst({
          where: {
            id: projectId,
            companyId: COMPANY_ID,
          },
        }),
        prisma.employee.findFirst({
          where: {
            id: employeeId,
            companyId: COMPANY_ID,
            active: true,
          },
        }),
      ]);

    if (!project) {
      return NextResponse.json(
        { error: "Project not found." },
        { status: 404 }
      );
    }

    if (!employee) {
      return NextResponse.json(
        {
          error:
            "Active employee account not found.",
        },
        { status: 404 }
      );
    }

    const projectAssignment =
      await prisma.employeeProject.findFirst({
        where: {
          projectId,
          employeeId,
        },
      });

    const scheduleAssignment =
      await prisma.scheduleAssignmentEmployee.findFirst({
        where: {
          employeeId,
          assignment: {
            projectId,
            companyId: COMPANY_ID,
          },
        },
      });

    if (
      !projectAssignment &&
      !scheduleAssignment
    ) {
      return NextResponse.json(
        {
          error:
            "You are not assigned to this project.",
        },
        { status: 403 }
      );
    }

    const note =
      await prisma.dailyNote.create({
        data: {
          projectId,
          employeeId,
          note: noteText,
        },
        include: {
          employee: true,
          project: true,
        },
      });

    return NextResponse.json(
      serializeNote(note),
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Failed to save daily note:",
      error
    );

    return NextResponse.json(
      { error: "Unable to save daily note." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const url =
      new URL(request.url);

    const id =
      Number(
        url.searchParams.get("id")
      );

    const employeeIdValue =
      url.searchParams.get("employeeId");

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return NextResponse.json(
        { error: "A valid daily note is required." },
        { status: 400 }
      );
    }

    const employeeId =
      employeeIdValue
        ? Number(employeeIdValue)
        : null;

    if (
      employeeIdValue &&
      (
        !Number.isInteger(employeeId) ||
        Number(employeeId) <= 0
      )
    ) {
      return NextResponse.json(
        { error: "Invalid employee." },
        { status: 400 }
      );
    }

    const note =
      await prisma.dailyNote.findFirst({
        where: {
          id,
          ...(employeeId
            ? { employeeId }
            : {}),
          project: {
            companyId: COMPANY_ID,
          },
        },
      });

    if (!note) {
      return NextResponse.json(
        { error: "Daily note not found." },
        { status: 404 }
      );
    }

    await prisma.dailyNote.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "Failed to delete daily note:",
      error
    );

    return NextResponse.json(
      { error: "Unable to delete daily note." },
      { status: 500 }
    );
  }
}