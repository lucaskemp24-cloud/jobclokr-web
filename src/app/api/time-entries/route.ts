import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  getSession,
  isCompanySession,
} from "@/lib/session";

function serializeTimeEntry(entry: {
  id: number;
  employeeId: number;
  projectId: number;
  clockIn: Date;
  clockOut: Date | null;
  notes: string | null;
  manuallyAdjusted: boolean;
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
    clockOut:
      entry.clockOut?.toISOString() ??
      null,
    notes: entry.notes ?? "",
    manuallyAdjusted:
      entry.manuallyAdjusted,
  };
}

function isOfficeUser(
  role: string
) {
  return (
    role === "Owner" ||
    role === "Office"
  );
}

function parseDateTime(
  value: unknown
) {
  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    return null;
  }

  const date =
    new Date(value);

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

    const companyId =
      session.companyId;

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

    const activeOnly =
      url.searchParams.get(
        "active"
      ) === "true";

    const where: {
      projectId?: number;
      employeeId?: number;
      clockOut?: null;
      project?: {
        companyId: number;
      };
    } = {
      project: {
        companyId,
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
                "You cannot access another employee's time entries.",
            },
            {
              status: 403,
            }
          );
        }
      }

      where.employeeId =
        session.employeeId;
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

    if (activeOnly) {
      where.clockOut =
        null;
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
      entries.map(
        serializeTimeEntry
      )
    );
  } catch (error) {
    console.error(
      "Failed to load time entries:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to load time entries.",
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

    const companyId =
      session.companyId;

    const body =
      await request.json();

    const requestedEmployeeId =
      Number(
        body.employeeId
      );

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
        requestedEmployeeId > 0 &&
        requestedEmployeeId !==
          session.employeeId
      ) {
        return NextResponse.json(
          {
            error:
              "You cannot clock in another employee.",
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
      employee,
      project,
    ] =
      await Promise.all([
        prisma.employee.findFirst({
          where: {
            id: employeeId,
            companyId,
            active: true,
          },
        }),

        prisma.project.findFirst({
          where: {
            id: projectId,
            companyId,
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
          error:
            "Project not found.",
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

          project: {
            companyId,
          },
        },

        include: {
          project: true,
        },

        orderBy: {
          clockIn: "desc",
        },
      });

    if (
      existingActiveEntry
    ) {
      return NextResponse.json(
        {
          error:
            `You are already clocked in to ${existingActiveEntry.project.name}.`,
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

          clockIn:
            new Date(),

          notes:
            typeof body.notes ===
              "string" &&
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
      serializeTimeEntry(
        entry
      ),
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
        error:
          "Unable to clock in.",
      },
      {
        status: 500,
      }
    );
  }
}

/*
  STOP PART 1 HERE.
  PART 2 STARTS WITH PATCH.
*/export async function PATCH(
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

    const companyId =
      session.companyId;

    const body =
      await request.json();

    const id =
      Number(
        body.id
      );

    const requestedEmployeeId =
      Number(
        body.employeeId
      );

    if (
      !Number.isInteger(
        id
      ) ||
      id <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "A valid time entry is required.",
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
              "You cannot clock out another employee.",
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
        requestedEmployeeId <=
          0
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

    const existingEntry =
      await prisma.timeEntry.findFirst({
        where: {
          id,
          employeeId,
          clockOut: null,

          project: {
            companyId,
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
          clockOut:
            new Date(),
        },

        include: {
          employee: true,
          project: true,
        },
      });

    return NextResponse.json(
      serializeTimeEntry(
        entry
      )
    );
  } catch (error) {
    console.error(
      "Failed to clock out:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to clock out.",
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

    if (
      !isOfficeUser(
        session.role
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

    const companyId =
      session.companyId;

    const body =
      await request.json();

    const rawId =
      body.id;

    const id =
      rawId ===
        undefined ||
      rawId ===
        null ||
      rawId ===
        ""
        ? null
        : Number(
            rawId
          );

    const employeeId =
      Number(
        body.employeeId
      );

    const projectId =
      Number(
        body.projectId
      );

    const clockIn =
      parseDateTime(
        body.clockIn
      );

    const hasClockOut =
      body.clockOut !==
        undefined &&
      body.clockOut !==
        null &&
      String(
        body.clockOut
      ).trim() !== "";

    const clockOut =
      hasClockOut
        ? parseDateTime(
            body.clockOut
          )
        : null;

    const notes =
      typeof body.notes ===
      "string"
        ? body.notes.trim()
        : "";

    if (
      id !== null &&
      (
        !Number.isInteger(
          id
        ) ||
        id <= 0
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid time entry.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isInteger(
        employeeId
      ) ||
      employeeId <= 0
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

    if (!clockIn) {
      return NextResponse.json(
        {
          error:
            "A valid clock-in date and time are required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      hasClockOut &&
      !clockOut
    ) {
      return NextResponse.json(
        {
          error:
            "A valid clock-out date and time are required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      clockOut &&
      clockOut.getTime() <=
        clockIn.getTime()
    ) {
      return NextResponse.json(
        {
          error:
            "Clock-out must be after clock-in.",
        },
        {
          status: 400,
        }
      );
    }

    const [
      employee,
      project,
    ] =
      await Promise.all([
        prisma.employee.findFirst({
          where: {
            id:
              employeeId,

            companyId,

            active:
              true,
          },
        }),

        prisma.project.findFirst({
          where: {
            id:
              projectId,

            companyId,
          },
        }),
      ]);

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
      id !== null
    ) {
      const existingEntry =
        await prisma.timeEntry.findFirst({
          where: {
            id,

            project: {
              companyId,
            },
          },

          select: {
            id:
              true,
          },
        });

      if (!existingEntry) {
        return NextResponse.json(
          {
            error:
              "Time entry not found.",
          },
          {
            status: 404,
          }
        );
      }
    }

    if (!clockOut) {
      const activeEntry =
        await prisma.timeEntry.findFirst({
          where: {
            employeeId,

            clockOut:
              null,

            ...(id !==
            null
              ? {
                  id: {
                    not:
                      id,
                  },
                }
              : {}),

            project: {
              companyId,
            },
          },

          include: {
            project:
              true,
          },
        });

      if (activeEntry) {
        return NextResponse.json(
          {
            error:
              `${employee.firstName} ${employee.lastName} is already clocked in to ${activeEntry.project.name}.`,
          },
          {
            status: 409,
          }
        );
      }
    }

    const entry =
      id === null
        ? await prisma.timeEntry.create({
            data: {
              employeeId,
              projectId,
              clockIn,
              clockOut,

              notes:
                notes ||
                null,

              manuallyAdjusted:
                true,
            },

            include: {
              employee:
                true,

              project:
                true,
            },
          })
        : await prisma.timeEntry.update({
            where: {
              id,
            },

            data: {
              employeeId,
              projectId,
              clockIn,
              clockOut,

              notes:
                notes ||
                null,

              manuallyAdjusted:
                true,
            },

            include: {
              employee:
                true,

              project:
                true,
            },
          });

    return NextResponse.json(
      serializeTimeEntry(
        entry
      ),
      {
        status:
          id === null
            ? 201
            : 200,
      }
    );
  } catch (error) {
    console.error(
      "Failed to manually adjust time entry:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to save the time adjustment.",
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

    if (
      !isOfficeUser(
        session.role
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

    const companyId =
      session.companyId;

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

    if (
      !Number.isInteger(
        id
      ) ||
      id <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "A valid time entry is required.",
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

          project: {
            companyId,
          },
        },

        select: {
          id:
            true,
        },
      });

    if (!existingEntry) {
      return NextResponse.json(
        {
          error:
            "Time entry not found.",
        },
        {
          status: 404,
        }
      );
    }

    await prisma.timeEntry.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success:
        true,
    });
  } catch (error) {
    console.error(
      "Failed to delete time entry:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to delete time entry.",
      },
      {
        status: 500,
      }
    );
  }
}