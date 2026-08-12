import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const existingCompany =
      await prisma.company.findFirst();

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
            "Lucas Communications",
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