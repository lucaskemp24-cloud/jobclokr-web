import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

const COMPANY_ID = 1;
const MAX_FILE_DATA_LENGTH = 8_000_000;

function serializeDocument(document: {
  id: number;
  projectId: number;
  employeeId: number;
  fileName: string;
  fileUrl: string;
  fileType: string | null;
  note: string | null;
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
    id: document.id,
    projectId: document.projectId,
    projectName: document.project.name,
    employeeId: document.employeeId,
    employeeName:
      `${document.employee.firstName} ${document.employee.lastName}`.trim(),
    fileName: document.fileName,
    fileUrl: document.fileUrl,
    fileType: document.fileType ?? "",
    note: document.note ?? "",
    createdAt: document.createdAt.toISOString(),
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

    const documents =
      await prisma.projectDocument.findMany({
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
      documents.map(serializeDocument)
    );
  } catch (error) {
    console.error(
      "Failed to load project documents:",
      error
    );

    return NextResponse.json(
      { error: "Unable to load project documents." },
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

    const fileName =
      String(body.fileName ?? "").trim();

    const fileUrl =
      String(body.fileUrl ?? "");

    const fileType =
      String(body.fileType ?? "").trim();

    const note =
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

    if (!fileName) {
      return NextResponse.json(
        { error: "A file name is required." },
        { status: 400 }
      );
    }

    if (
      !fileUrl.startsWith("data:")
    ) {
      return NextResponse.json(
        { error: "A valid file is required." },
        { status: 400 }
      );
    }

    if (
      fileUrl.length >
      MAX_FILE_DATA_LENGTH
    ) {
      return NextResponse.json(
        {
          error:
            "The selected file is too large. Try a file smaller than about 5 MB.",
        },
        { status: 413 }
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

    const document =
      await prisma.projectDocument.create({
        data: {
          projectId,
          employeeId,
          fileName,
          fileUrl,
          fileType:
            fileType || null,
          note:
            note || null,
        },
        include: {
          employee: true,
          project: true,
        },
      });

    return NextResponse.json(
      serializeDocument(document),
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Failed to save project document:",
      error
    );

    return NextResponse.json(
      { error: "Unable to save project document." },
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
        { error: "A valid document is required." },
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

    const document =
      await prisma.projectDocument.findFirst({
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

    if (!document) {
      return NextResponse.json(
        { error: "Project document not found." },
        { status: 404 }
      );
    }

    await prisma.projectDocument.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "Failed to delete project document:",
      error
    );

    return NextResponse.json(
      { error: "Unable to delete project document." },
      { status: 500 }
    );
  }
}