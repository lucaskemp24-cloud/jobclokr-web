import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const companyCount = await prisma.company.count();

    return NextResponse.json({
      success: true,
      message: "JobClokr is connected to PostgreSQL!",
      companyCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: String(error),
      },
      { status: 500 }
    );
  }
}