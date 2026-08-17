import { compare } from "bcryptjs";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";

function getSessionRole(
  role:
    | "OWNER"
    | "OFFICE"
    | "FOREMAN"
    | "EMPLOYEE"
) {
  if (role === "OWNER") {
    return "Owner" as const;
  }

  if (role === "OFFICE") {
    return "Office" as const;
  }

  return "Employee" as const;
}

export async function POST(
  request: Request
) {
  try {
    const body =
      await request.json();

    const companyCode =
      String(
        body.companyCode ?? ""
      )
        .trim()
        .toUpperCase();

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

    if (
      !companyCode ||
      !loginName ||
      !password
    ) {
      return NextResponse.json(
        {
          error:
            "Company code, login name, and password are required.",
        },
        {
          status: 400,
        }
      );
    }

    const company =
      await prisma.company.findUnique({
        where: {
          code: companyCode,
        },

        select: {
          id: true,
          name: true,
          code: true,
        },
      });

    if (!company) {
      return NextResponse.json(
        {
          error:
            "Invalid company code, login name, or password.",
        },
        {
          status: 401,
        }
      );
    }

    const employee =
      await prisma.employee.findFirst({
        where: {
          companyId:
            company.id,

          loginName,
        },

        select: {
          id: true,
          companyId: true,
          firstName: true,
          lastName: true,
          role: true,
          active: true,
          passwordHash: true,
          mustChangePassword: true,
        },
      });

    if (
      !employee ||
      !employee.active ||
      !employee.passwordHash
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid company code, login name, or password.",
        },
        {
          status: 401,
        }
      );
    }

    const passwordMatches =
      await compare(
        password,
        employee.passwordHash
      );

    if (!passwordMatches) {
      return NextResponse.json(
        {
          error:
            "Invalid company code, login name, or password.",
        },
        {
          status: 401,
        }
      );
    }

    const name =
      `${employee.firstName} ${employee.lastName}`.trim();

    await createSession({
      employeeId:
        employee.id,

      companyId:
        employee.companyId,

      name,

      role:
        getSessionRole(
          employee.role
        ),
    });

    return NextResponse.json({
      employee: {
        id:
          employee.id,

        companyId:
          employee.companyId,

        firstName:
          employee.firstName,

        lastName:
          employee.lastName,

        role:
          employee.role,

        active:
          employee.active,

        mustChangePassword:
          employee.mustChangePassword,
      },

      company: {
        id:
          company.id,

        name:
          company.name,

        code:
          company.code,
      },
    });
  } catch (error) {
    console.error(
      "Employee login failed:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to sign in.",
      },
      {
        status: 500,
      }
    );
  }
}