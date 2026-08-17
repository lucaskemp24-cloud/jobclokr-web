import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

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
    createdAt:
      note.createdAt.toISOString(),
  };
}

export async function GET(
  request: Request
) {
  try {
    const session =
      await getSession();

    if (!session) {
      return NextResponse.json(
        {
          error:
            "Authentication required.",
        },
        {
          status: 401,
        }
      );
    }

    const url =
      new URL(request.url);

    const projectIdValue =
      url.searchParams.get(
        "projectId"
      );

    const employeeIdValue =
      url.searchParams.get(
        "employeeId"
      );

    const where: {
      projectId?: number;
      employeeId?: number;
      project?: {
        companyId: number;
      };
      OR?: Array<{
        project?: {
          assignments?: {
            some: {
              employeeId: number;
            };
          };
        };
      } | {
        project?: {
          scheduleAssignments?: {
            some: {
              employees: {
                some: {
                  employeeId: number;
                };
              };
            };
          };
        };
      }>;
    } = {
      project: {
        companyId:
          session.companyId,
      },
    };

    if (projectIdValue) {
      const projectId =
        Number(
          projectIdValue
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
              "Invalid project.",
          },
          {
            status: 400,
          }
        );
      }

      where.projectId =
        projectId;
    }

    if (
      session.role ===
      "Employee"
    ) {
      if (employeeIdValue) {
        const requestedEmployeeId =
          Number(
            employeeIdValue
          );

        if (
          !Number.isInteger(
            requestedEmployeeId
          ) ||
          requestedEmployeeId <= 0
        ) {
          return NextResponse.json(
            {
              error:
                "Invalid employee.",
            },
            {
              status: 400,
            }
          );
        }

        if (
          requestedEmployeeId !==
          session.employeeId
        ) {
          return NextResponse.json(
            {
              error:
                "You cannot access another employee's daily notes.",
            },
            {
              status: 403,
            }
          );
        }

        where.employeeId =
          session.employeeId;
      }

      where.OR = [
        {
          project: {
            assignments: {
              some: {
                employeeId:
                  session.employeeId,
              },
            },
          },
        },
        {
          project: {
            scheduleAssignments: {
              some: {
                employees: {
                  some: {
                    employeeId:
                      session.employeeId,
                  },
                },
              },
            },
          },
        },
      ];
    } else if (
      employeeIdValue
    ) {
      const employeeId =
        Number(
          employeeIdValue
        );

      if (
        !Number.isInteger(
          employeeId
        ) ||
        employeeId <= 0
      ) {
        return NextResponse.json(
          {
            error:
              "Invalid employee.",
          },
          {
            status: 400,
          }
        );
      }

      where.employeeId =
        employeeId;
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
      notes.map(
        serializeNote
      )
    );
  } catch (error) {
    console.error(
      "Failed to load daily notes:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to load daily notes.",
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
    const session =
      await getSession();

    if (!session) {
      return NextResponse.json(
        {
          error:
            "Authentication required.",
        },
        {
          status: 401,
        }
      );
    }

    const body =
      await request.json();

    const projectId =
      Number(
        body.projectId
      );

    const requestedEmployeeId =
      Number(
        body.employeeId
      );

    const noteText =
      String(
        body.note ?? ""
      ).trim();

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

    if (!noteText) {
      return NextResponse.json(
        {
          error:
            "Enter a daily note.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      noteText.length >
      5000
    ) {
      return NextResponse.json(
        {
          error:
            "Daily notes must be 5,000 characters or fewer.",
        },
        {
          status: 400,
        }
      );
    }

    let employeeId:
      number;

    if (
      session.role ===
      "Employee"
    ) {
      if (
        Number.isInteger(
          requestedEmployeeId
        ) &&
        requestedEmployeeId >
          0 &&
        requestedEmployeeId !==
          session.employeeId
      ) {
        return NextResponse.json(
          {
            error:
              "You cannot create a daily note for another employee.",
          },
          {
            status: 403,
          }
        );
      }

      employeeId =
        session.employeeId;
    } else {
      if (
        !Number.isInteger(
          requestedEmployeeId
        ) ||
        requestedEmployeeId <= 0
      ) {
        return NextResponse.json(
          {
            error:
              "A valid employee is required.",
          },
          {
            status: 400,
          }
        );
      }

      employeeId =
        requestedEmployeeId;
    }

    const [
      project,
      employee,
    ] =
      await Promise.all([
        prisma.project.findFirst({
          where: {
            id: projectId,
            companyId:
              session.companyId,
          },
        }),

        prisma.employee.findFirst({
          where: {
            id: employeeId,
            companyId:
              session.companyId,
            active: true,
          },
        }),
      ]);

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
            companyId:
              session.companyId,
          },
        },
      });

    if (
      session.role ===
        "Employee" &&
      !projectAssignment &&
      !scheduleAssignment
    ) {
      return NextResponse.json(
        {
          error:
            "You are not assigned to this project.",
        },
        {
          status: 403,
        }
      );
    }

    const note =
      await prisma.dailyNote.create({
        data: {
          projectId,
          employeeId,
          note:
            noteText,
        },

        include: {
          employee: true,
          project: true,
        },
      });

    return NextResponse.json(
      serializeNote(
        note
      ),
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Failed to save daily note:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to save daily note.",
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
    const session =
      await getSession();

    if (!session) {
      return NextResponse.json(
        {
          error:
            "Authentication required.",
        },
        {
          status: 401,
        }
      );
    }

    const url =
      new URL(
        request.url
      );

    const id =
      Number(
        url.searchParams.get(
          "id"
        )
      );

    const employeeIdValue =
      url.searchParams.get(
        "employeeId"
      );

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "A valid daily note is required.",
        },
        {
          status: 400,
        }
      );
    }

    let employeeId:
      number | null =
        null;

    if (
      session.role ===
      "Employee"
    ) {
      if (
        employeeIdValue
      ) {
        const requestedEmployeeId =
          Number(
            employeeIdValue
          );

        if (
          !Number.isInteger(
            requestedEmployeeId
          ) ||
          requestedEmployeeId <= 0
        ) {
          return NextResponse.json(
            {
              error:
                "Invalid employee.",
            },
            {
              status: 400,
            }
          );
        }

        if (
          requestedEmployeeId !==
          session.employeeId
        ) {
          return NextResponse.json(
            {
              error:
                "You cannot delete another employee's daily note.",
            },
            {
              status: 403,
            }
          );
        }
      }

      employeeId =
        session.employeeId;
    } else if (
      employeeIdValue
    ) {
      const requestedEmployeeId =
        Number(
          employeeIdValue
        );

      if (
        !Number.isInteger(
          requestedEmployeeId
        ) ||
        requestedEmployeeId <= 0
      ) {
        return NextResponse.json(
          {
            error:
              "Invalid employee.",
          },
          {
            status: 400,
          }
        );
      }

      employeeId =
        requestedEmployeeId;
    }

    const note =
      await prisma.dailyNote.findFirst({
        where: {
          id,

          ...(employeeId
            ? {
                employeeId,
              }
            : {}),

          project: {
            companyId:
              session.companyId,
          },
        },
      });

    if (!note) {
      return NextResponse.json(
        {
          error:
            "Daily note not found.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      session.role ===
        "Employee" &&
      note.employeeId !==
        session.employeeId
    ) {
      return NextResponse.json(
        {
          error:
            "You cannot delete another employee's daily note.",
        },
        {
          status: 403,
        }
      );
    }

    await prisma.dailyNote.delete({
      where: {
        id,
      },
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
      {
        error:
          "Unable to delete daily note.",
      },
      {
        status: 500,
      }
    );
  }
}