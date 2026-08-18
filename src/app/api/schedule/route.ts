import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  getSession,
  isCompanySession,
} from "@/lib/session";

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
    !isCompanySession(
      session
    )
  ) {
    return {
      session: null,
      response:
        NextResponse.json(
          {
            error:
              "Company access required.",
          },
          {
            status: 403,
          }
        ),
    };
  }

  if (
    session.role !==
      "Owner" &&
    session.role !==
      "Office"
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

type AssignmentPriority =
  | "NORMAL"
  | "HIGH"
  | "EMERGENCY";

function parseDateOnly(
  dateValue: string
) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      dateValue
    )
  ) {
    return null;
  }

  const date =
    new Date(
      `${dateValue}T00:00:00.000Z`
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

function formatDateOnly(
  date: Date
) {
  return date
    .toISOString()
    .slice(0, 10);
}

function normalizePriority(
  value: unknown
): AssignmentPriority {
  if (value === "HIGH") {
    return "HIGH";
  }

  if (
    value ===
    "EMERGENCY"
  ) {
    return "EMERGENCY";
  }

  return "NORMAL";
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

    if (
      !isCompanySession(
        session
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Company access required.",
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

    const dateValue =
      url.searchParams.get(
        "date"
      );

    const employeeIdValue =
      url.searchParams.get(
        "employeeId"
      );

    const where: {
      companyId: number;
      date?: Date;
      employees?: {
        some: {
          employeeId: number;
        };
      };
    } = {
      companyId:
        session.companyId,
    };

    if (dateValue) {
      const date =
        parseDateOnly(
          dateValue
        );

      if (!date) {
        return NextResponse.json(
          {
            error:
              "Invalid schedule date.",
          },
          {
            status: 400,
          }
        );
      }

      where.date =
        date;
    }

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
          requestedEmployeeId <=
            0
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
                "You cannot access another employee's schedule.",
            },
            {
              status: 403,
            }
          );
        }
      }

      where.employees = {
        some: {
          employeeId:
            session.employeeId,
        },
      };
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
        employeeId <=
          0
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

      where.employees = {
        some: {
          employeeId,
        },
      };
    }

    const assignments =
      await prisma.scheduleAssignment.findMany({
        where,

        include: {
          project: {
            include: {
              customer:
                true,
            },
          },

          employees: {
            include: {
              employee:
                true,
            },

            orderBy: {
              employeeId:
                "asc",
            },
          },
        },

        orderBy: [
          {
            date:
              "asc",
          },
          {
            projectId:
              "asc",
          },
        ],
      });

    return NextResponse.json(
      assignments.map(
        (
          assignment
        ) => ({
          id:
            assignment.id,

          date:
            formatDateOnly(
              assignment.date
            ),

          projectId:
            assignment.projectId,

          projectName:
            assignment.project.name,

          customerId:
            assignment.project.customerId,

          customerName:
            assignment.project.customer.name,

          address:
            assignment.project.address ??
            "",

          status:
            assignment.project.status,

          priority:
            assignment.priority,

          notes:
            assignment.notes ??
            "",

          employeeIds:
            assignment.employees.map(
              (
                item
              ) =>
                item.employeeId
            ),

          employees:
            assignment.employees.map(
              (
                item
              ) => ({
                id:
                  item.employee.id,

                firstName:
                  item.employee.firstName,

                lastName:
                  item.employee.lastName,

                role:
                  item.employee.role,

                active:
                  item.employee.active,
              })
            ),
        })
      )
    );
  } catch (error) {
    console.error(
      "Failed to load schedule:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to load schedule.",
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

    const dateValue =
      String(
        body.date ?? ""
      );

    const date =
      parseDateOnly(
        dateValue
      );

    const rawEmployeeIds:
      unknown[] =
      Array.isArray(
        body.employeeIds
      )
        ? body.employeeIds
        : [];

    const employeeIds:
      number[] =
      Array.from(
        new Set<number>(
          rawEmployeeIds
            .map(
              (
                value
              ) =>
                Number(
                  value
                )
            )
            .filter(
              (
                employeeId
              ): employeeId is number =>
                Number.isInteger(
                  employeeId
                ) &&
                employeeId >
                  0
            )
        )
      );

    const priority =
      normalizePriority(
        body.priority
      );

    const notes =
      String(
        body.notes ?? ""
      ).trim();

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
            "Please select a project.",
        },
        {
          status: 400,
        }
      );
    }

    if (!date) {
      return NextResponse.json(
        {
          error:
            "Please choose a valid schedule date.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      employeeIds.length ===
      0
    ) {
      return NextResponse.json(
        {
          error:
            "Please select at least one employee.",
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
            "Closed projects cannot be scheduled.",
        },
        {
          status: 409,
        }
      );
    }

    const employees =
      await prisma.employee.findMany({
        where: {
          id: {
            in:
              employeeIds,
          },

          companyId:
            session.companyId,

          active:
            true,
        },

        select: {
          id: true,
        },
      });

    if (
      employees.length !==
      employeeIds.length
    ) {
      return NextResponse.json(
        {
          error:
            "One or more selected employees are invalid or inactive.",
        },
        {
          status: 400,
        }
      );
    }

    const assignment =
      await prisma.$transaction(
        async (
          tx
        ) => {
          const savedAssignment =
            await tx.scheduleAssignment.upsert({
              where: {
                companyId_projectId_date:
                  {
                    companyId:
                      session.companyId,

                    projectId,

                    date,
                  },
              },

              create: {
                companyId:
                  session.companyId,

                projectId,

                date,

                priority,

                notes:
                  notes ||
                  null,
              },

              update: {
                priority,

                notes:
                  notes ||
                  null,
              },
            });

          await tx.scheduleAssignmentEmployee.deleteMany({
            where: {
              assignmentId:
                savedAssignment.id,
            },
          });

          await tx.scheduleAssignmentEmployee.createMany({
            data:
              employeeIds.map(
                (
                  employeeId
                ) => ({
                  assignmentId:
                    savedAssignment.id,

                  employeeId,
                })
              ),
          });

          return tx.scheduleAssignment.findUniqueOrThrow({
            where: {
              id:
                savedAssignment.id,
            },

            include: {
              project: {
                include: {
                  customer:
                    true,
                },
              },

              employees: {
                include: {
                  employee:
                    true,
                },
              },
            },
          });
        }
      );

    return NextResponse.json(
      {
        id:
          assignment.id,

        date:
          formatDateOnly(
            assignment.date
          ),

        projectId:
          assignment.projectId,

        projectName:
          assignment.project.name,

        customerId:
          assignment.project.customerId,

        customerName:
          assignment.project.customer.name,

        address:
          assignment.project.address ??
          "",

        status:
          assignment.project.status,

        priority:
          assignment.priority,

        notes:
          assignment.notes ??
          "",

        employeeIds:
          assignment.employees.map(
            (
              item
            ) =>
              item.employeeId
          ),

        employees:
          assignment.employees.map(
            (
              item
            ) => ({
              id:
                item.employee.id,

              firstName:
                item.employee.firstName,

              lastName:
                item.employee.lastName,

              role:
                item.employee.role,

              active:
                item.employee.active,
            })
          ),
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Failed to save schedule:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to save schedule.",
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
      new URL(
        request.url
      );

    const assignmentId =
      Number(
        url.searchParams.get(
          "assignmentId"
        )
      );

    const employeeIdValue =
      url.searchParams.get(
        "employeeId"
      );

    if (
      !Number.isInteger(
        assignmentId
      ) ||
      assignmentId <=
        0
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid schedule assignment.",
        },
        {
          status: 400,
        }
      );
    }

    const assignment =
      await prisma.scheduleAssignment.findFirst({
        where: {
          id:
            assignmentId,

          companyId:
            session.companyId,
        },

        include: {
          employees:
            true,
        },
      });

    if (!assignment) {
      return NextResponse.json(
        {
          error:
            "Schedule assignment not found.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      !employeeIdValue
    ) {
      await prisma.scheduleAssignment.delete({
        where: {
          id:
            assignmentId,
        },
      });

      return NextResponse.json({
        success:
          true,
      });
    }

    const employeeId =
      Number(
        employeeIdValue
      );

    if (
      !Number.isInteger(
        employeeId
      ) ||
      employeeId <=
        0
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

    await prisma.scheduleAssignmentEmployee.deleteMany({
      where: {
        assignmentId,
        employeeId,
      },
    });

    const remainingCount =
      await prisma.scheduleAssignmentEmployee.count({
        where: {
          assignmentId,
        },
      });

    if (
      remainingCount ===
      0
    ) {
      await prisma.scheduleAssignment.delete({
        where: {
          id:
            assignmentId,
        },
      });
    }

    return NextResponse.json({
      success:
        true,
    });
  } catch (error) {
    console.error(
      "Failed to remove schedule assignment:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to remove schedule assignment.",
      },
      {
        status: 500,
      }
    );
  }
}