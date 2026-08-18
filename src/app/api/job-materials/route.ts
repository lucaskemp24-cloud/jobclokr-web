import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

function serializeMaterial(material: {
  id: number;
  projectId: number;
  employeeId: number;
  materialName: string;
  quantity: number;
  unit: string;
  notes: string | null;
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
    id: material.id,
    projectId: material.projectId,
    projectName: material.project.name,
    employeeId: material.employeeId,
    employeeName:
      `${material.employee.firstName} ${material.employee.lastName}`.trim(),
    materialName: material.materialName,
    quantity: material.quantity,
    unit: material.unit,
    notes: material.notes ?? "",
    createdAt:
      material.createdAt.toISOString(),
  };
}

function isCompanySession(
  session: Awaited<
    ReturnType<typeof getSession>
  >
): session is NonNullable<
  Awaited<ReturnType<typeof getSession>>
> & {
  employeeId: number;
  companyId: number;
  role:
    | "Owner"
    | "Office"
    | "Employee";
} {
  return (
    session !== null &&
    session.role !== "PlatformAdmin" &&
    typeof session.employeeId ===
      "number" &&
    typeof session.companyId ===
      "number"
  );
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

    const companyIdValue =
      url.searchParams.get(
        "companyId"
      );

    let projectId:
      number | undefined;

    let employeeId:
      number | undefined;

    let requestedCompanyId:
      number | undefined;

    if (projectIdValue) {
      const parsedProjectId =
        Number(projectIdValue);

      if (
        !Number.isInteger(
          parsedProjectId
        ) ||
        parsedProjectId <= 0
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

      projectId =
        parsedProjectId;
    }

    if (employeeIdValue) {
      const parsedEmployeeId =
        Number(employeeIdValue);

      if (
        !Number.isInteger(
          parsedEmployeeId
        ) ||
        parsedEmployeeId <= 0
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
        parsedEmployeeId;
    }

    if (companyIdValue) {
      const parsedCompanyId =
        Number(companyIdValue);

      if (
        !Number.isInteger(
          parsedCompanyId
        ) ||
        parsedCompanyId <= 0
      ) {
        return NextResponse.json(
          {
            error:
              "Invalid company.",
          },
          {
            status: 400,
          }
        );
      }

      requestedCompanyId =
        parsedCompanyId;
    }

    /*
      PLATFORM ADMIN

      Gio is not an employee and is not
      assigned to a company.

      Platform admins may inspect materials
      across companies. A companyId can
      optionally be supplied to narrow the
      results.
    */
    if (
      session.role ===
      "PlatformAdmin"
    ) {
      const materials =
        await prisma.jobMaterial.findMany({
          where: {
            ...(projectId
              ? {
                  projectId,
                }
              : {}),

            ...(employeeId
              ? {
                  employeeId,
                }
              : {}),

            ...(requestedCompanyId
              ? {
                  project: {
                    companyId:
                      requestedCompanyId,
                  },
                }
              : {}),
          },

          include: {
            employee: true,
            project: true,
          },

          orderBy: {
            createdAt: "desc",
          },
        });

      return NextResponse.json(
        materials.map(
          serializeMaterial
        )
      );
    }

    /*
      Everything below this point must be
      a company employee session.
    */
    if (!isCompanySession(session)) {
      return NextResponse.json(
        {
          error:
            "Invalid company session.",
        },
        {
          status: 403,
        }
      );
    }

    if (
      session.role ===
        "Employee" &&
      employeeId !== undefined &&
      employeeId !==
        session.employeeId
    ) {
      return NextResponse.json(
        {
          error:
            "You cannot access another employee's materials.",
        },
        {
          status: 403,
        }
      );
    }

    const materials =
      await prisma.jobMaterial.findMany({
        where: {
          ...(projectId
            ? {
                projectId,
              }
            : {}),

          ...(session.role ===
          "Employee"
            ? {
                ...(employeeId !==
                undefined
                  ? {
                      employeeId:
                        session.employeeId,
                    }
                  : {}),

                OR: [
                  {
                    project: {
                      companyId:
                        session.companyId,

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
                      companyId:
                        session.companyId,

                      scheduleAssignments:
                        {
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
                ],
              }
            : {
                ...(employeeId !==
                undefined
                  ? {
                      employeeId,
                    }
                  : {}),

                project: {
                  companyId:
                    session.companyId,
                },
              }),
        },

        include: {
          employee: true,
          project: true,
        },

        orderBy: {
          createdAt: "desc",
        },
      });

    return NextResponse.json(
      materials.map(
        serializeMaterial
      )
    );
  } catch (error) {
    console.error(
      "Failed to load job materials:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to load job materials.",
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

    /*
      Platform admins are not employees.

      Materials must always belong to an
      actual employee, so Gio should not
      create a material entry as himself.
    */
    if (
      session.role ===
      "PlatformAdmin"
    ) {
      return NextResponse.json(
        {
          error:
            "Platform administrators cannot create job materials as an employee.",
        },
        {
          status: 403,
        }
      );
    }

    if (!isCompanySession(session)) {
      return NextResponse.json(
        {
          error:
            "Invalid company session.",
        },
        {
          status: 403,
        }
      );
    }

    const body =
      await request.json();

    const projectId =
      Number(body.projectId);

    const requestedEmployeeId =
      Number(body.employeeId);

    const materialName =
      String(
        body.materialName ?? ""
      ).trim();

    const quantity =
      Number(body.quantity);

    const unit =
      String(
        body.unit ?? ""
      ).trim();

    const notes =
      String(
        body.notes ?? ""
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

    if (!materialName) {
      return NextResponse.json(
        {
          error:
            "Enter a material name.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isFinite(
        quantity
      ) ||
      quantity <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Quantity must be greater than zero.",
        },
        {
          status: 400,
        }
      );
    }

    if (!unit) {
      return NextResponse.json(
        {
          error:
            "Enter a unit.",
        },
        {
          status: 400,
        }
      );
    }

    let employeeId: number;

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
              "You cannot add materials for another employee.",
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

    const today =
      new Date();

    const scheduleDate =
      new Date(
        Date.UTC(
          today.getFullYear(),
          today.getMonth(),
          today.getDate()
        )
      );

    const scheduledEmployee =
      await prisma
        .scheduleAssignmentEmployee
        .findFirst({
          where: {
            employeeId,

            assignment: {
              projectId,
              companyId:
                session.companyId,
              date:
                scheduleDate,
            },
          },
        });

    const projectAssignment =
      await prisma.employeeProject.findFirst({
        where: {
          projectId,
          employeeId,
        },
      });

    if (
      session.role ===
        "Employee" &&
      !scheduledEmployee &&
      !projectAssignment
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

    const material =
      await prisma.jobMaterial.create({
        data: {
          projectId,
          employeeId,
          materialName,
          quantity,
          unit,

          notes:
            notes || null,
        },

        include: {
          employee: true,
          project: true,
        },
      });

    return NextResponse.json(
      serializeMaterial(
        material
      ),
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Failed to add job material:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to add material.",
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
      new URL(request.url);

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
            "A valid material is required.",
        },
        {
          status: 400,
        }
      );
    }

    /*
      Platform admin can delete a material
      globally because the material itself
      belongs to an actual employee/project,
      not to the admin.
    */
    if (
      session.role ===
      "PlatformAdmin"
    ) {
      const material =
        await prisma.jobMaterial.findUnique({
          where: {
            id,
          },

          select: {
            id: true,
          },
        });

      if (!material) {
        return NextResponse.json(
          {
            error:
              "Material entry not found.",
          },
          {
            status: 404,
          }
        );
      }

      await prisma.jobMaterial.delete({
        where: {
          id,
        },
      });

      return NextResponse.json({
        success: true,
      });
    }

    if (!isCompanySession(session)) {
      return NextResponse.json(
        {
          error:
            "Invalid company session.",
        },
        {
          status: 403,
        }
      );
    }

    let employeeId:
      number | undefined;

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
                "A valid employee is required.",
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
                "You cannot delete another employee's material.",
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

    const material =
      await prisma.jobMaterial.findFirst({
        where: {
          id,

          ...(employeeId !==
          undefined
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

    if (!material) {
      return NextResponse.json(
        {
          error:
            "Material entry not found.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      session.role ===
        "Employee" &&
      material.employeeId !==
        session.employeeId
    ) {
      return NextResponse.json(
        {
          error:
            "You cannot delete another employee's material.",
        },
        {
          status: 403,
        }
      );
    }

    await prisma.jobMaterial.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "Failed to delete job material:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to delete material.",
      },
      {
        status: 500,
      }
    );
  }
}