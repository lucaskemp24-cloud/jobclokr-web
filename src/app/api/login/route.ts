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

function companyHasAccess(
  status: string
) {
  return (
    status === "ACTIVE" ||
    status === "TRIALING"
  );
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

    /*
      Login name and password are always
      required.

      Company code is NOT required for a
      PlatformAdmin.
    */
    if (
      !loginName ||
      !password
    ) {
      return NextResponse.json(
        {
          error:
            "Login name and password are required.",
        },
        {
          status: 400,
        }
      );
    }

    /*
      ========================================
      PLATFORM ADMIN LOGIN
      ========================================

      Platform administrators are completely
      separate from employees and companies.

      We check PlatformAdmin first.
    */

    const platformAdmin =
      await prisma.platformAdmin.findUnique({
        where: {
          loginName,
        },

        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          loginName: true,
          passwordHash: true,
          mustChangePassword: true,
          active: true,
        },
      });

    if (
      platformAdmin &&
      platformAdmin.active
    ) {
      const passwordMatches =
        await compare(
          password,
          platformAdmin.passwordHash
        );

      if (passwordMatches) {
        const name =
          `${platformAdmin.firstName} ${platformAdmin.lastName}`.trim();

        await createSession({
          accountType:
            "PLATFORM_ADMIN",

          adminId:
            platformAdmin.id,

          employeeId:
            null,

          companyId:
            null,

          name,

          role:
            "PlatformAdmin",

          isPlatformAdmin:
            true,
        });

        console.log(
          "[LOGIN] Platform administrator signed in.",
          {
            adminId:
              platformAdmin.id,

            loginName:
              platformAdmin.loginName,
          }
        );

        return NextResponse.json({
          accountType:
            "PLATFORM_ADMIN",

          user: {
            id:
              platformAdmin.id,

            firstName:
              platformAdmin.firstName,

            lastName:
              platformAdmin.lastName,

            email:
              platformAdmin.email,

            loginName:
              platformAdmin.loginName,

            active:
              platformAdmin.active,

            mustChangePassword:
              platformAdmin.mustChangePassword,

            isPlatformAdmin:
              true,
          },

          company:
            null,
        });
      }
    }

    /*
      ========================================
      COMPANY USER LOGIN
      ========================================

      If this was not a valid platform-admin
      login, continue with normal company
      authentication.
    */

    if (!companyCode) {
      return NextResponse.json(
        {
          error:
            "Company code is required for company users.",
        },
        {
          status: 400,
        }
      );
    }

    const company =
      await prisma.company.findUnique({
        where: {
          code:
            companyCode,
        },

        select: {
          id: true,
          name: true,
          code: true,

          subscriptionStatus:
            true,
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

    if (
      !companyHasAccess(
        company.subscriptionStatus
      )
    ) {
      return NextResponse.json(
        {
          error:
            "This company's JobClokr subscription is not active. Please contact JobClokr administration.",

          code:
            "SUBSCRIPTION_INACTIVE",

          subscriptionStatus:
            company.subscriptionStatus,
        },
        {
          status: 403,
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
      accountType:
        "COMPANY_USER",

      adminId:
        null,

      employeeId:
        employee.id,

      companyId:
        employee.companyId,

      name,

      role:
        getSessionRole(
          employee.role
        ),

      isPlatformAdmin:
        false,
    });

    console.log(
      "[LOGIN] Company user signed in.",
      {
        employeeId:
          employee.id,

        companyId:
          employee.companyId,

        role:
          employee.role,
      }
    );

    return NextResponse.json({
      accountType:
        "COMPANY_USER",

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

        isPlatformAdmin:
          false,

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

        subscriptionStatus:
          company.subscriptionStatus,
      },
    });
  } catch (error) {
    console.error(
      "Login failed:",
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