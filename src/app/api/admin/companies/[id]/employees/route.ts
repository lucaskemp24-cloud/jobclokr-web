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

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const session =
      await getSession();

    if (
      !session ||
      !isPlatformAdminSession(
        session
      )
    ) {
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

    const { id } =
      await context.params;

    const companyId =
      Number(id);

    if (
      !Number.isInteger(
        companyId
      ) ||
      companyId <= 0
    ) {
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

    const company =
      await prisma.company.findUnique({
        where: {
          id:
            companyId,
        },

        select: {
          id:
            true,
        },
      });

    if (!company) {
      return NextResponse.json(
        {
          error:
            "Company not found.",
        },
        {
          status: 404,
        }
      );
    }

    const employees =
      await prisma.employee.findMany({
        where: {
          companyId,
        },

        select:
          employeeSelect,

        orderBy: [
          {
            lastName:
              "asc",
          },
          {
            firstName:
              "asc",
          },
        ],
      });

    return NextResponse.json(
      employees
    );
  } catch (error) {
    console.error(
      "Failed to load admin company employees:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to load employees.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(
  request: Request,
  context: RouteContext
) {
  try {
    const session =
      await getSession();

    if (
      !session ||
      !isPlatformAdminSession(
        session
      )
    ) {
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

    const { id } =
      await context.params;

    const companyId =
      Number(id);

    if (
      !Number.isInteger(
        companyId
      ) ||
      companyId <= 0
    ) {
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

    const company =
      await prisma.company.findUnique({
        where: {
          id:
            companyId,
        },

        select: {
          id:
            true,

          name:
            true,

          code:
            true,
        },
      });

    if (!company) {
      return NextResponse.json(
        {
          error:
            "Company not found.",
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

    const password =
      String(
        body.password ?? ""
      );

    const role =
      String(
        body.role ??
          "EMPLOYEE"
      )
        .trim()
        .toUpperCase();

    const active =
      body.active !== false;

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

    const existingEmployee =
      await prisma.employee.findFirst({
        where: {
          companyId,

          loginName,
        },

        select: {
          id:
            true,
        },
      });

    if (
      existingEmployee
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
      await hash(
        password,
        12
      );

    const employee =
      await prisma.employee.create({
        data: {
          companyId,

          firstName,
          lastName,

          email:
            email || null,

          phone:
            phone || null,

          loginName,
          passwordHash,

          mustChangePassword:
            true,

          role,
          active,
        },

        select:
          employeeSelect,
      });

    console.log(
      "[PLATFORM ADMIN] Employee created for company.",
      {
        adminId:
          session.adminId,

        companyId,

        companyName:
          company.name,

        employeeId:
          employee.id,

        role:
          employee.role,
      }
    );

    return NextResponse.json(
      employee,
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Failed to create admin company employee:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to create employee.",
      },
      {
        status: 500,
      }
    );
  }
}