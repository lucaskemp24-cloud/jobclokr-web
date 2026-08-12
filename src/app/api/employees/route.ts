import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

const COMPANY_ID = 1;

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

export async function GET() {
  try {
    const employees =
      await prisma.employee.findMany({
        where: {
          companyId:
            COMPANY_ID,
        },

        orderBy: [
          {
            lastName: "asc",
          },
          {
            firstName: "asc",
          },
        ],
      });

    return NextResponse.json(
      employees
    );
  } catch (error) {
    console.error(
      "Failed to load employees:",
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
  request: Request
) {
  try {
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

    const role =
      String(
        body.role ??
          "EMPLOYEE"
      );

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

    if (
      !isEmployeeRole(role)
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

    const employee =
      await prisma.employee.create({
        data: {
          companyId:
            COMPANY_ID,

          firstName,
          lastName,

          email:
            email || null,

          phone:
            phone || null,

          role,
          active,
        },
      });

    return NextResponse.json(
      employee,
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Failed to create employee:",
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