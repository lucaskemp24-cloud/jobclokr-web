import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

async function requireOfficeSession() {
  const session =
    await getSession();

  if (!session) {
    return {
      session: null,
      response:
        NextResponse.json(
          {
            error:
              "Authentication required.",
          },
          {
            status: 401,
          }
        ),
    };
  }

  if (
    session.role !== "Owner" &&
    session.role !== "Office"
  ) {
    return {
      session: null,
      response:
        NextResponse.json(
          {
            error:
              "Office access required.",
          },
          {
            status: 403,
          }
        ),
    };
  }

  return {
    session,
    response: null,
  };
}

export async function GET(
  request: Request
) {
  try {
    const auth =
      await requireOfficeSession();

    if (
      !auth.session ||
      auth.response
    ) {
      return auth.response;
    }

    const session =
      auth.session;

    const url =
      new URL(request.url);

    const projectId =
      Number(
        url.searchParams.get(
          "projectId"
        )
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

    const project =
      await prisma.project.findFirst({
        where: {
          id: projectId,
          companyId:
            session.companyId,
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

    const assignments =
      await prisma.employeeProject.findMany({
        where: {
          projectId,

          employee: {
            companyId:
              session.companyId,
          },
        },

        include: {
          employee: true,
        },

        orderBy: {
          employee: {
            lastName: "asc",
          },
        },
      });

    return NextResponse.json(
      assignments.map(
        ({ employee }) => ({
          id: employee.id,
          firstName:
            employee.firstName,
          lastName:
            employee.lastName,
          email:
            employee.email,
          phone:
            employee.phone,
          role:
            employee.role,
          active:
            employee.active,
        })
      )
    );
  } catch (error) {
    console.error(
      "Failed to load project assignments:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to load project assignments.",
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
    const auth =
      await requireOfficeSession();

    if (
      !auth.session ||
      auth.response
    ) {
      return auth.response;
    }

    const session =
      auth.session;

    const body =
      await request.json();

    const projectId =
      Number(
        body.projectId
      );

    const employeeId =
      Number(
        body.employeeId
      );

    if (
      !Number.isInteger(
        projectId
      ) ||
      projectId <= 0 ||
      !Number.isInteger(
        employeeId
      ) ||
      employeeId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "A valid project and employee are required.",
        },
        {
          status: 400,
        }
      );
    }

    const project =
      await prisma.project.findFirst({
        where: {
          id: projectId,
          companyId:
            session.companyId,
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

    if (
      project.status ===
      "Closed"
    ) {
      return NextResponse.json(
        {
          error:
            "Closed projects cannot be changed.",
        },
        {
          status: 409,
        }
      );
    }

    const employee =
      await prisma.employee.findFirst({
        where: {
          id: employeeId,
          companyId:
            session.companyId,
          active: true,
        },
      });

    if (!employee) {
      return NextResponse.json(
        {
          error:
            "Active employee not found.",
        },
        {
          status: 404,
        }
      );
    }

    const existing =
      await prisma.employeeProject.findUnique({
        where: {
          projectId_employeeId: {
            projectId,
            employeeId,
          },
        },
      });

    if (existing) {
      return NextResponse.json(
        {
          error:
            "That employee is already assigned to this project.",
        },
        {
          status: 409,
        }
      );
    }

    await prisma.employeeProject.create({
      data: {
        projectId,
        employeeId,
      },
    });

    return NextResponse.json(
      {
        success: true,

        employee: {
          id: employee.id,
          firstName:
            employee.firstName,
          lastName:
            employee.lastName,
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Employee assignment failed:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to assign employee.",
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
    const auth =
      await requireOfficeSession();

    if (
      !auth.session ||
      auth.response
    ) {
      return auth.response;
    }

    const session =
      auth.session;

    const url =
      new URL(request.url);

    const projectId =
      Number(
        url.searchParams.get(
          "projectId"
        )
      );

    const employeeId =
      Number(
        url.searchParams.get(
          "employeeId"
        )
      );

    if (
      !Number.isInteger(
        projectId
      ) ||
      projectId <= 0 ||
      !Number.isInteger(
        employeeId
      ) ||
      employeeId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "A valid project and employee are required.",
        },
        {
          status: 400,
        }
      );
    }

    const project =
      await prisma.project.findFirst({
        where: {
          id: projectId,
          companyId:
            session.companyId,
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

    if (
      project.status ===
      "Closed"
    ) {
      return NextResponse.json(
        {
          error:
            "Closed projects cannot be changed.",
        },
        {
          status: 409,
        }
      );
    }

    const employee =
      await prisma.employee.findFirst({
        where: {
          id: employeeId,
          companyId:
            session.companyId,
        },

        select: {
          id: true,
        },
      });

    if (!employee) {
      return NextResponse.json(
        {
          error:
            "Employee not found.",
        },
        {
          status: 404,
        }
      );
    }

    const assignment =
      await prisma.employeeProject.findUnique({
        where: {
          projectId_employeeId: {
            projectId,
            employeeId,
          },
        },
      });

    if (!assignment) {
      return NextResponse.json(
        {
          error:
            "Employee assignment not found.",
        },
        {
          status: 404,
        }
      );
    }

    await prisma.employeeProject.delete({
      where: {
        projectId_employeeId: {
          projectId,
          employeeId,
        },
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "Employee removal failed:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to remove employee.",
      },
      {
        status: 500,
      }
    );
  }
}