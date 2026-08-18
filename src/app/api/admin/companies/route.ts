import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  getSession,
  isPlatformAdminSession,
} from "@/lib/session";

const ALLOWED_SUBSCRIPTION_STATUSES = [
  "ACTIVE",
  "TRIALING",
  "PAST_DUE",
  "CANCELED",
  "INCOMPLETE",
] as const;

type SubscriptionStatus =
  (typeof ALLOWED_SUBSCRIPTION_STATUSES)[number];

function isSubscriptionStatus(
  value: string
): value is SubscriptionStatus {
  return ALLOWED_SUBSCRIPTION_STATUSES.includes(
    value as SubscriptionStatus
  );
}

export async function GET() {
  try {
    const session =
      await getSession();

    if (
      !session ||
      !isPlatformAdminSession(
        session
      )
    ) {
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

    const companies =
      await prisma.company.findMany({
        select: {
          id: true,
          name: true,
          code: true,

          subscriptionStatus:
            true,

          stripeCustomerId:
            true,

          stripeSubscriptionId:
            true,

          subscriptionCurrentPeriodStart:
            true,

          subscriptionCurrentPeriodEnd:
            true,

          createdAt:
            true,

          updatedAt:
            true,

          _count: {
            select: {
              employees:
                true,

              customers:
                true,

              projects:
                true,
            },
          },
        },

        orderBy: {
          name:
            "asc",
        },
      });

    return NextResponse.json(
      companies.map(
        (
          company
        ) => ({
          id:
            company.id,

          name:
            company.name,

          code:
            company.code,

          subscriptionStatus:
            company.subscriptionStatus,

          stripeCustomerId:
            company.stripeCustomerId,

          stripeSubscriptionId:
            company.stripeSubscriptionId,

          subscriptionCurrentPeriodStart:
            company.subscriptionCurrentPeriodStart
              ? company.subscriptionCurrentPeriodStart.toISOString()
              : null,

          subscriptionCurrentPeriodEnd:
            company.subscriptionCurrentPeriodEnd
              ? company.subscriptionCurrentPeriodEnd.toISOString()
              : null,

          employeeCount:
            company._count
              .employees,

          customerCount:
            company._count
              .customers,

          projectCount:
            company._count
              .projects,

          createdAt:
            company.createdAt.toISOString(),

          updatedAt:
            company.updatedAt.toISOString(),
        })
      )
    );
  } catch (error) {
    console.error(
      "Failed to load platform companies:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to load companies.",
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
    const session =
      await getSession();

    if (
      !session ||
      !isPlatformAdminSession(
        session
      )
    ) {
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

    const name =
      String(
        body.name ?? ""
      ).trim();

    const code =
      String(
        body.code ?? ""
      )
        .trim()
        .toUpperCase();

    const subscriptionStatus =
      String(
        body.subscriptionStatus ??
          "TRIALING"
      )
        .trim()
        .toUpperCase();

    const phone =
      String(
        body.phone ?? ""
      ).trim();

    const email =
      String(
        body.email ?? ""
      ).trim();

    const website =
      String(
        body.website ?? ""
      ).trim();

    const address =
      String(
        body.address ?? ""
      ).trim();

    if (!name) {
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

    if (!code) {
      return NextResponse.json(
        {
          error:
            "Company code is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      code.length < 3
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
      !/^[A-Z0-9_-]+$/.test(
        code
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Company code can only contain letters, numbers, hyphens, and underscores.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !isSubscriptionStatus(
        subscriptionStatus
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid subscription status.",
        },
        {
          status: 400,
        }
      );
    }

    const existingCompany =
      await prisma.company.findUnique({
        where: {
          code,
        },

        select: {
          id:
            true,
        },
      });

    if (
      existingCompany
    ) {
      return NextResponse.json(
        {
          error:
            "That company code is already being used.",
        },
        {
          status: 409,
        }
      );
    }

    const company =
      await prisma.company.create({
        data: {
          name,
          code,

          subscriptionStatus,

          settings: {
            create: {
              phone:
                phone || null,

              email:
                email || null,

              website:
                website || null,

              address:
                address || null,
            },
          },
        },

        select: {
          id: true,
          name: true,
          code: true,

          subscriptionStatus:
            true,

          stripeCustomerId:
            true,

          stripeSubscriptionId:
            true,

          subscriptionCurrentPeriodStart:
            true,

          subscriptionCurrentPeriodEnd:
            true,

          createdAt:
            true,

          updatedAt:
            true,

          _count: {
            select: {
              employees:
                true,

              customers:
                true,

              projects:
                true,
            },
          },
        },
      });

    console.log(
      "[PLATFORM ADMIN] Company created.",
      {
        adminId:
          session.adminId,

        companyId:
          company.id,

        companyName:
          company.name,

        companyCode:
          company.code,

        subscriptionStatus:
          company.subscriptionStatus,
      }
    );

    return NextResponse.json(
      {
        id:
          company.id,

        name:
          company.name,

        code:
          company.code,

        subscriptionStatus:
          company.subscriptionStatus,

        stripeCustomerId:
          company.stripeCustomerId,

        stripeSubscriptionId:
          company.stripeSubscriptionId,

        subscriptionCurrentPeriodStart:
          company.subscriptionCurrentPeriodStart
            ? company.subscriptionCurrentPeriodStart.toISOString()
            : null,

        subscriptionCurrentPeriodEnd:
          company.subscriptionCurrentPeriodEnd
            ? company.subscriptionCurrentPeriodEnd.toISOString()
            : null,

        employeeCount:
          company._count
            .employees,

        customerCount:
          company._count
            .customers,

        projectCount:
          company._count
            .projects,

        createdAt:
          company.createdAt.toISOString(),

        updatedAt:
          company.updatedAt.toISOString(),
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Failed to create company:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to create company.",
      },
      {
        status: 500,
      }
    );
  }
}