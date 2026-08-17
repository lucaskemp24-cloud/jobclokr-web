import { hash } from "bcryptjs";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";

function normalizeCompanyCode(
  value: string
) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 20);
}

function normalizeLoginName(
  value: string
) {
  return value
    .trim()
    .toLowerCase();
}

function getOwnerName(
  firstName: string,
  lastName: string
) {
  return `${firstName} ${lastName}`.trim();
}

export async function POST(
  request: Request
) {
  try {
    const body =
      await request.json();

    const companyName =
      String(
        body.companyName ?? ""
      ).trim();

    const companyCode =
      normalizeCompanyCode(
        String(
          body.companyCode ?? ""
        )
      );

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

    const phone =
      String(
        body.phone ?? ""
      ).trim();

    const loginName =
      normalizeLoginName(
        String(
          body.loginName ?? ""
        )
      );

    const password =
      String(
        body.password ?? ""
      );

    if (!companyName) {
      return NextResponse.json(
        {
          error:
            "Company name is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      companyCode.length < 3
    ) {
      return NextResponse.json(
        {
          error:
            "Company code must be at least 3 characters.",
        },
        {
          status: 400,
        }
      );
    }

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

    if (!email) {
      return NextResponse.json(
        {
          error:
            "Email address is required.",
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

    const existingCompany =
      await prisma.company.findUnique({
        where: {
          code:
            companyCode,
        },

        select: {
          id: true,
        },
      });

    if (existingCompany) {
      return NextResponse.json(
        {
          error:
            "That company code is already in use.",
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

    const result =
      await prisma.$transaction(
        async (tx) => {
          const company =
            await tx.company.create({
              data: {
                name:
                  companyName,

                code:
                  companyCode,

                settings: {
                  create: {
                    email,
                    phone:
                      phone || null,
                  },
                },
              },

              select: {
                id: true,
                name: true,
                code: true,
              },
            });

          const owner =
            await tx.employee.create({
              data: {
                companyId:
                  company.id,

                firstName,
                lastName,

                email,

                phone:
                  phone || null,

                loginName,

                passwordHash,

                mustChangePassword:
                  false,

                role:
                  "OWNER",

                active:
                  true,
              },

              select: {
                id: true,
                companyId: true,
                firstName: true,
                lastName: true,
                role: true,
                active: true,
                mustChangePassword:
                  true,
              },
            });

          return {
            company,
            owner,
          };
        }
      );

    await createSession({
      employeeId:
        result.owner.id,

      companyId:
        result.owner.companyId,

      name:
        getOwnerName(
          result.owner.firstName,
          result.owner.lastName
        ),

      role:
        "Owner",
    });

    return NextResponse.json(
      {
        company:
          result.company,

        employee: {
          id:
            result.owner.id,

          companyId:
            result.owner.companyId,

          firstName:
            result.owner.firstName,

          lastName:
            result.owner.lastName,

          role:
            result.owner.role,

          active:
            result.owner.active,

          mustChangePassword:
            result.owner.mustChangePassword,
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Business signup failed:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to create business account.",
      },
      {
        status: 500,
      }
    );
  }
}