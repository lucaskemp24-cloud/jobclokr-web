import { hash } from "bcryptjs";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  getSession,
  isCompanySession,
} from "@/lib/session";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const employeeSelect = {
  id: true,
  companyId: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  loginName: true,
  mustChangePassword: true,
  role: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function GET(
  request: Request,
  context: RouteContext
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

    const { id } =
      await context.params;

    const employeeId =
      Number(id);

    if (
      !Number.isInteger(
        employeeId
      ) ||
      employeeId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid employee ID.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      session.role ===
        "Employee" &&
      employeeId !==
        session.employeeId
    ) {
      return NextResponse.json(
        {
          error:
            "You cannot access another employee.",
        },
        {
          status: 403,
        }
      );
    }

    const employee =
      await prisma.employee.findFirst({
        where: {
          id:
            employeeId,

          companyId:
            session.companyId,
        },

        select:
          employeeSelect,
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

    return NextResponse.json(
      employee
    );
  } catch (error) {
    console.error(
      "Failed to load employee:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to load employee.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PATCH(
  request: Request,
  context: RouteContext
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
      session.role !==
        "Owner" &&
      session.role !==
        "Office"
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

    const { id } =
      await context.params;

    const employeeId =
      Number(id);

    if (
      !Number.isInteger(
        employeeId
      ) ||
      employeeId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid employee ID.",
        },
        {
          status: 400,
        }
      );
    }

    const existingEmployee =
      await prisma.employee.findFirst({
        where: {
          id:
            employeeId,

          companyId:
            session.companyId,
        },

        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          loginName: true,
        },
      });

    if (!existingEmployee) {
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

    const body =
      await request.json();

    const firstName =
      typeof body.firstName ===
      "string"
        ? body.firstName.trim()
        : undefined;

    const lastName =
      typeof body.lastName ===
      "string"
        ? body.lastName.trim()
        : undefined;

    const email =
      typeof body.email ===
      "string"
        ? body.email.trim()
        : undefined;

    const phone =
      typeof body.phone ===
      "string"
        ? body.phone.trim()
        : undefined;

    const loginName =
      typeof body.loginName ===
      "string"
        ? body.loginName
            .trim()
            .toLowerCase()
        : undefined;

    const password =
      typeof body.password ===
      "string"
        ? body.password
        : undefined;

    /*
      ========================================
      PROFILE UPDATE
      ========================================
    */

    if (
      firstName !== undefined &&
      !firstName
    ) {
      return NextResponse.json(
        {
          error:
            "First name is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      lastName !== undefined &&
      !lastName
    ) {
      return NextResponse.json(
        {
          error:
            "Last name is required.",
        },
        {
          status: 400,
        }
      );
    }

    /*
      ========================================
      LOGIN UPDATE
      ========================================
    */

    if (
      loginName !== undefined
    ) {
      if (!loginName) {
        return NextResponse.json(
          {
            error:
              "A login name is required.",
          },
          {
            status: 400,
          }
        );
      }

      if (
        loginName.length < 3
      ) {
        return NextResponse.json(
          {
            error:
              "Login name must be at least 3 characters.",
          },
          {
            status: 400,
          }
        );
      }

      const existingLogin =
        await prisma.employee.findFirst({
          where: {
            companyId:
              session.companyId,

            loginName,

            NOT: {
              id:
                employeeId,
            },
          },

          select: {
            id: true,
          },
        });

      if (
        existingLogin
      ) {
        return NextResponse.json(
          {
            error:
              "That login name is already being used.",
          },
          {
            status: 409,
          }
        );
      }
    }

    if (
      password !== undefined &&
      password.length < 8
    ) {
      return NextResponse.json(
        {
          error:
            "Password must be at least 8 characters.",
        },
        {
          status: 400,
        }
      );
    }

    const updateData: {
      firstName?: string;
      lastName?: string;
      email?: string | null;
      phone?: string | null;
      loginName?: string;
      passwordHash?: string;
      mustChangePassword?: boolean;
    } = {};

    if (
      firstName !== undefined
    ) {
      updateData.firstName =
        firstName;
    }

    if (
      lastName !== undefined
    ) {
      updateData.lastName =
        lastName;
    }

    if (
      email !== undefined
    ) {
      updateData.email =
        email || null;
    }

    if (
      phone !== undefined
    ) {
      updateData.phone =
        phone || null;
    }

    if (
      loginName !== undefined
    ) {
      updateData.loginName =
        loginName;
    }

    if (
      password !== undefined
    ) {
      updateData.passwordHash =
        await hash(
          password,
          12
        );

      updateData.mustChangePassword =
        true;
    }

    if (
      Object.keys(
        updateData
      ).length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "No employee changes were provided.",
        },
        {
          status: 400,
        }
      );
    }

    const updatedEmployee =
      await prisma.employee.update({
        where: {
          id:
            employeeId,
        },

        data:
          updateData,

        select:
          employeeSelect,
      });

    return NextResponse.json(
      updatedEmployee
    );
  } catch (error) {
    console.error(
      "Failed to update employee:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to update employee.",
      },
      {
        status: 500,
      }
    );
  }
}