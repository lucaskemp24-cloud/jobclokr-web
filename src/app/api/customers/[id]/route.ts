import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

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

    if (
      session.role !== "Owner" &&
      session.role !== "Office"
    ) {
      return NextResponse.json(
        {
          error:
            "Office access required.",
        },
        {
          status: 403,
        }
      );
    }

    const { id } =
      await context.params;

    const customerId =
      Number(id);

    if (
      !Number.isInteger(
        customerId
      ) ||
      customerId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid customer.",
        },
        {
          status: 400,
        }
      );
    }

    const customer =
      await prisma.customer.findFirst({
        where: {
          id:
            customerId,

          companyId:
            session.companyId,
        },
      });

    if (!customer) {
      return NextResponse.json(
        {
          error:
            "Customer not found.",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(
      customer
    );
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