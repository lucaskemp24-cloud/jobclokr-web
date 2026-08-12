import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

const COMPANY_ID = 1;

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const customerId = Number(id);

    if (
      !Number.isInteger(customerId) ||
      customerId <= 0
    ) {
      return NextResponse.json(
        {
          error: "Invalid customer.",
        },
        {
          status: 400,
        }
      );
    }

    const customer =
      await prisma.customer.findFirst({
        where: {
          id: customerId,
          companyId: COMPANY_ID,
        },
      });

    if (!customer) {
      return NextResponse.json(
        {
          error: "Customer not found.",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error(
      "Failed to load customer:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to load customer.",
      },
      {
        status: 500,
      }
    );
  }
}