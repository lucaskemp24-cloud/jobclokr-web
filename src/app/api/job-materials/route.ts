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
      OR?: Array<
        | {
            project: {
              assignments: {
                some: {
                  employeeId: number;
                };
              };
            };
          }
        | {
            project: {
              scheduleAssignments: {
                some: {
                  employees: {
                    some: {
                      employeeId: number;
                    };
                  };
                };
              };
            };
          }
      >;
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
                "You cannot access another employee's materials.",
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

    const materials =
      await prisma.jobMaterial.findMany({
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

    const materialName =
      String(
        body.materialName ?? ""
      ).trim();

    const quantity =
      Number(
        body.quantity
      );

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
      await prisma.scheduleAssignmentEmployee.findFirst({
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
            "A valid material is required.",
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