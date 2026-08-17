import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const MAX_IMAGE_DATA_LENGTH = 6_000_000;

function serializePhoto(photo: {
  id: number;
  projectId: number;
  employeeId: number;
  imageUrl: string;
  fileName: string | null;
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
    id: photo.id,
    projectId: photo.projectId,
    projectName: photo.project.name,
    employeeId: photo.employeeId,
    employeeName:
      `${photo.employee.firstName} ${photo.employee.lastName}`.trim(),
    imageData: photo.imageUrl,
    imageUrl: photo.imageUrl,
    fileName: photo.fileName ?? "",
    note: photo.note ?? "",
    createdAt:
      photo.createdAt.toISOString(),
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
                "You cannot access another employee's photos.",
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

    const photos =
      await prisma.jobPhoto.findMany({
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
      photos.map(
        serializePhoto
      )
    );
  } catch (error) {
    console.error(
      "Failed to load job photos:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to load job photos.",
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

    const imageData =
      String(
        body.imageData ?? ""
      );

    const fileName =
      String(
        body.fileName ?? ""
      ).trim();

    const note =
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

    if (
      !imageData.startsWith(
        "data:image/"
      )
    ) {
      return NextResponse.json(
        {
          error:
            "A valid image is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      imageData.length >
      MAX_IMAGE_DATA_LENGTH
    ) {
      return NextResponse.json(
        {
          error:
            "The processed photo is too large. Try a smaller image.",
        },
        {
          status: 413,
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
              "You cannot upload photos for another employee.",
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

    const photo =
      await prisma.jobPhoto.create({
        data: {
          projectId,
          employeeId,
          imageUrl:
            imageData,

          fileName:
            fileName || null,

          note:
            note || null,
        },

        include: {
          employee: true,
          project: true,
        },
      });

    return NextResponse.json(
      serializePhoto(
        photo
      ),
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Failed to save job photo:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to save job photo.",
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
            "A valid photo is required.",
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
                "You cannot delete another employee's photo.",
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

    const photo =
      await prisma.jobPhoto.findFirst({
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

    if (!photo) {
      return NextResponse.json(
        {
          error:
            "Job photo not found.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      session.role ===
        "Employee" &&
      photo.employeeId !==
        session.employeeId
    ) {
      return NextResponse.json(
        {
          error:
            "You cannot delete another employee's photo.",
        },
        {
          status: 403,
        }
      );
    }

    await prisma.jobPhoto.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "Failed to delete job photo:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to delete job photo.",
      },
      {
        status: 500,
      }
    );
  }
}