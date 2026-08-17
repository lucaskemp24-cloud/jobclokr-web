import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

const DEFAULT_COMPANY_NAME =
  "Lucas Communications";

const DEFAULT_COMPANY_CODE =
  "LUCAS";

export async function GET() {
  try {
    const existingCompany =
      await prisma.company.findFirst({
        where: {
          code:
            DEFAULT_COMPANY_CODE,
        },
      });

    if (existingCompany) {
      return NextResponse.json({
        success: true,
        message:
          "Company already exists.",
        company:
          existingCompany,
      });
    }

    const company =
      await prisma.company.create({
        data: {
          name:
            DEFAULT_COMPANY_NAME,

          code:
            DEFAULT_COMPANY_CODE,
        },
      });

    return NextResponse.json({
      success: true,
      message:
        "Company created.",
      company,
    });
  } catch (error) {
    console.error(
      "Setup failed:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to create company.",
      },
      {
        status: 500,
      }
    );
  }
}