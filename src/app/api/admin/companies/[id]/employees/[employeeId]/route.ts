import { hash } from "bcryptjs";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  getSession,
  isPlatformAdminSession,
} from "@/lib/session";

type RouteContext = {
  params: Promise<{
    id: string;
    employeeId: string;
  }>;
};

const VALID_ROLES = [
  "OWNER",
  "OFFICE",
  "FOREMAN",
  "EMPLOYEE",
] as const;

type EmployeeRole =
  (typeof VALID_ROLES)[number];

function isEmployeeRole(
  value: string
): value is EmployeeRole {
  return VALID_ROLES.includes(
    value as EmployeeRole
  );
}

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

async function getAdminSession() {
  const session =
    await getSession();

  if (
    !session ||
    !isPlatformAdminSession(
      session
    )
  ) {
    return null;
  }

  return session;
}

function parsePositiveInteger(
  value: string
) {
  const parsed =
    Number(value);

  if (
    !Number.isInteger(
      parsed
    ) ||
    parsed <= 0
  ) {
    return null;
  }

  return parsed;
}

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const session =
      await getAdminSession();

    if (!session) {
      return NextResponse.json(
        {
          error:
            "Platform administrator access required.",
        },
        {
          status: 403,
        }
      );
    }

    const {
      id,
      employeeId,
    } =
      await context.params;

    const companyId =
      parsePositiveInteger(
        id
      );

    const parsedEmployeeId =
      parsePositiveInteger(
        employeeId
      );

    if (!companyId) {
      return NextResponse.json(
        {
          error:
            "Invalid company ID.",
        },
        {
          status: 400,
        }
      );
    }

    if (!parsedEmployeeId) {
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

    const employee =
      await prisma.employee.findFirst({
        where: {
          id:
            parsedEmployeeId,

          companyId,
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
      "Failed to load admin employee:",
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
      await getAdminSession();

    if (!session) {
      return NextResponse.json(
        {
          error:
            "Platform administrator access required.",
        },
        {
          status: 403,
        }
      );
    }

    const {
      id,
      employeeId,
    } =
      await context.params;

    const companyId =
      parsePositiveInteger(
        id
      );

    const parsedEmployeeId =
      parsePositiveInteger(
        employeeId
      );

    if (!companyId) {
      return NextResponse.json(
        {
          error:
            "Invalid company ID.",
        },
        {
          status: 400,
        }
      );
    }

    if (!parsedEmployeeId) {
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
            parsedEmployeeId,

          companyId,
        },

        select: {
          id: true,
          companyId: true,
          passwordHash: true,
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
      String(
        body.firstName ?? ""
      ).trim();

    const lastName =
      String(
        body.lastName ?? ""
      ).trim();

    const email =
      String(
        body.email ?? ""
      ).trim();

    const phone =
      String(
        body.phone ?? ""
      ).trim();

    const loginName =
      String(
        body.loginName ?? ""
      )
        .trim()
        .toLowerCase();

    const role =
      String(
        body.role ??
          "EMPLOYEE"
      )
        .trim()
        .toUpperCase();

    const active =
      body.active !== false;

    const password =
      typeof body.password ===
        "string"
        ? body.password
        : "";

    if (
      !firstName ||
      !lastName
    ) {
      return NextResponse.json(
        {
          error:
            "First and last name are required.",
        },
        {
          status: 400,
        }
      );
    }

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

    if (
      !isEmployeeRole(
        role
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid employee role.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      password &&
      password.length < 8
    ) {
      return NextResponse.json(
        {
          error:
            "New temporary password must be at least 8 characters.",
        },
        {
          status: 400,
        }
      );
    }

    const duplicateLogin =
      await prisma.employee.findFirst({
        where: {
          companyId,
          loginName,

          NOT: {
            id:
              parsedEmployeeId,
          },
        },

        select: {
          id:
            true,
        },
      });

    if (
      duplicateLogin
    ) {
      return NextResponse.json(
        {
          error:
            "That login name is already being used by this company.",
        },
        {
          status: 409,
        }
      );
    }

    const passwordHash =
      password
        ? await hash(
            password,
            12
          )
        : undefined;

    const employee =
      await prisma.employee.update({
        where: {
          id:
            parsedEmployeeId,
        },

        data: {
          firstName,
          lastName,

          email:
            email || null,

          phone:
            phone || null,

          loginName,

          role,
          active,

          ...(passwordHash
            ? {
                passwordHash,

                mustChangePassword:
                  true,
              }
            : {}),
        },

        select:
          employeeSelect,
      });

    console.log(
      "[PLATFORM ADMIN] Employee updated.",
      {
        adminId:
          session.adminId,

        companyId,

        employeeId:
          employee.id,

        role:
          employee.role,

        active:
          employee.active,

        passwordReset:
          Boolean(
            passwordHash
          ),
      }
    );

    return NextResponse.json(
      employee
    );
  } catch (error) {
    console.error(
      "Failed to update admin employee:",
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