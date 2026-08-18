import {
  compare,
  hash,
} from "bcryptjs";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  getSession,
  isCompanySession,
  isPlatformAdminSession,
} from "@/lib/session";

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

    const currentPassword =
      String(
        body.currentPassword ?? ""
      );

    const newPassword =
      String(
        body.newPassword ?? ""
      );

    if (!currentPassword) {
      return NextResponse.json(
        {
          error:
            "Current password is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      newPassword.length < 8
    ) {
      return NextResponse.json(
        {
          error:
            "New password must be at least 8 characters.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      currentPassword ===
      newPassword
    ) {
      return NextResponse.json(
        {
          error:
            "Your new password must be different from your current password.",
        },
        {
          status: 400,
        }
      );
    }

    /*
      ========================================
      PLATFORM ADMIN PASSWORD CHANGE
      ========================================
    */

    if (
      isPlatformAdminSession(
        session
      )
    ) {
      const admin =
        await prisma.platformAdmin.findUnique({
          where: {
            id:
              session.adminId,
          },

          select: {
            id: true,
            active: true,
            passwordHash: true,
          },
        });

      if (
        !admin ||
        !admin.active
      ) {
        return NextResponse.json(
          {
            error:
              "Unable to update password.",
          },
          {
            status: 404,
          }
        );
      }

      const passwordMatches =
        await compare(
          currentPassword,
          admin.passwordHash
        );

      if (!passwordMatches) {
        return NextResponse.json(
          {
            error:
              "Current password is incorrect.",
          },
          {
            status: 401,
          }
        );
      }

      const newPasswordHash =
        await hash(
          newPassword,
          12
        );

      await prisma.platformAdmin.update({
        where: {
          id:
            admin.id,
        },

        data: {
          passwordHash:
            newPasswordHash,

          mustChangePassword:
            false,
        },
      });

      return NextResponse.json({
        success: true,
      });
    }

    /*
      ========================================
      COMPANY USER PASSWORD CHANGE
      ========================================
    */

    if (
      !isCompanySession(
        session
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Unable to update password.",
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
            session.employeeId,

          companyId:
            session.companyId,

          active:
            true,
        },

        select: {
          id: true,
          passwordHash: true,
        },
      });

    if (
      !employee ||
      !employee.passwordHash
    ) {
      return NextResponse.json(
        {
          error:
            "Unable to update password.",
        },
        {
          status: 404,
        }
      );
    }

    const passwordMatches =
      await compare(
        currentPassword,
        employee.passwordHash
      );

    if (!passwordMatches) {
      return NextResponse.json(
        {
          error:
            "Current password is incorrect.",
        },
        {
          status: 401,
        }
      );
    }

    const newPasswordHash =
      await hash(
        newPassword,
        12
      );

    await prisma.employee.update({
      where: {
        id:
          employee.id,
      },

      data: {
        passwordHash:
          newPasswordHash,

        mustChangePassword:
          false,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "Password change failed:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to change password.",
      },
      {
        status: 500,
      }
    );
  }
}