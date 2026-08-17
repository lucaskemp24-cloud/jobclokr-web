import { hash } from "bcryptjs";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

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
          id: employeeId,
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
      session.role !== "Owner" &&
      session.role !== "Office"
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

    const body =
      await request.json();

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

    const existingLogin =
      await prisma.employee.findFirst({
        where: {
          companyId:
            session.companyId,

          loginName,

          NOT: {
            id: employeeId,
          },
        },

        select: {
          id: true,
        },
      });

    if (existingLogin) {
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

    const passwordHash =
      await hash(
        password,
        12
      );

    const updatedEmployee =
      await prisma.employee.update({
        where: {
          id: employeeId,
        },

        data: {
          loginName,
          passwordHash,
          mustChangePassword:
            true,
        },

        select:
          employeeSelect,
      });

    return NextResponse.json(
      updatedEmployee
    );
  } catch (error) {
    console.error(
      "Failed to update employee login:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to update employee login.",
      },
      {
        status: 500,
      }
    );
  }
}