import { hash } from "bcryptjs";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  getSession,
  isPlatformAdminSession,
} from "@/lib/session";

const adminSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  loginName: true,
  mustChangePassword: true,
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

/*
  ========================================
  GET PLATFORM ADMINS
  ========================================
*/

export async function GET() {
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

    const admins =
      await prisma.platformAdmin.findMany({
        select:
          adminSelect,

        orderBy: [
          {
            active:
              "desc",
          },
          {
            firstName:
              "asc",
          },
          {
            lastName:
              "asc",
          },
        ],
      });

    return NextResponse.json(
      admins
    );
  } catch (error) {
    console.error(
      "Failed to load platform administrators:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to load platform administrators.",
      },
      {
        status: 500,
      }
    );
  }
}

/*
  ========================================
  CREATE PLATFORM ADMIN
  ========================================
*/

export async function POST(
  request: Request
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
      )
        .trim()
        .toLowerCase();

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
            "Login name is required.",
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
      !/^[a-z0-9._-]+$/.test(
        loginName
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Login name can only contain letters, numbers, periods, hyphens, and underscores.",
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
            "Temporary password must be at least 8 characters.",
        },
        {
          status: 400,
        }
      );
    }

    const duplicateLogin =
      await prisma.platformAdmin.findUnique({
        where: {
          loginName,
        },

        select: {
          id: true,
        },
      });

    if (
      duplicateLogin
    ) {
      return NextResponse.json(
        {
          error:
            "That administrator login name is already in use.",
        },
        {
          status: 409,
        }
      );
    }

    if (email) {
      const duplicateEmail =
        await prisma.platformAdmin.findUnique({
          where: {
            email,
          },

          select: {
            id: true,
          },
        });

      if (
        duplicateEmail
      ) {
        return NextResponse.json(
          {
            error:
              "That email address is already assigned to a platform administrator.",
          },
          {
            status: 409,
          }
        );
      }
    }

    const passwordHash =
      await hash(
        password,
        12
      );

    const admin =
      await prisma.platformAdmin.create({
        data: {
          firstName,
          lastName,

          email:
            email || null,

          loginName,

          passwordHash,

          mustChangePassword:
            true,

          active:
            true,
        },

        select:
          adminSelect,
      });

    console.log(
      "[PLATFORM ADMIN] Administrator created.",
      {
        actingAdminId:
          session.adminId,

        newAdminId:
          admin.id,

        loginName:
          admin.loginName,
      }
    );

    return NextResponse.json(
      admin,
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Failed to create platform administrator:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to create platform administrator.",
      },
      {
        status: 500,
      }
    );
  }
}