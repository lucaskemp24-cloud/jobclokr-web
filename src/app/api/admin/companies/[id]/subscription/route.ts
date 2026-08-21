import { NextResponse } from "next/server";
import Stripe from "stripe";

import { prisma } from "@/lib/prisma";
import {
  getSession,
  isPlatformAdminSession,
} from "@/lib/session";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function getStripe() {
  const secretKey =
    process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error(
      "STRIPE_SECRET_KEY is not configured."
    );
  }

  return new Stripe(secretKey);
}

export async function POST(
  request: Request,
  context: RouteContext
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

    const { id } =
      await context.params;

    const companyId =
      Number(id);

    if (
      !Number.isInteger(
        companyId
      ) ||
      companyId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid company ID.",
        },
        {
          status: 400,
        }
      );
    }

    const basePriceId =
      process.env
        .STRIPE_BASE_PRICE_ID;

    const userPriceId =
      process.env
        .STRIPE_USER_PRICE_ID;

    if (!basePriceId) {
      return NextResponse.json(
        {
          error:
            "STRIPE_BASE_PRICE_ID is not configured.",
        },
        {
          status: 500,
        }
      );
    }

    if (!userPriceId) {
      return NextResponse.json(
        {
          error:
            "STRIPE_USER_PRICE_ID is not configured.",
        },
        {
          status: 500,
        }
      );
    }

    const company =
      await prisma.company.findUnique({
        where: {
          id: companyId,
        },

        select: {
          id: true,
          name: true,
          code: true,

          stripeCustomerId:
            true,

          stripeSubscriptionId:
            true,

          settings: {
            select: {
              email: true,
            },
          },

          employees: {
            where: {
              active: true,

              role: {
                in: [
                  "OFFICE",
                  "FOREMAN",
                  "EMPLOYEE",
                ],
              },
            },

            select: {
              id: true,
            },
          },
        },
      });

    if (!company) {
      return NextResponse.json(
        {
          error:
            "Company not found.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      company.stripeSubscriptionId
    ) {
      return NextResponse.json(
        {
          error:
            "This company already has a Stripe subscription.",
        },
        {
          status: 409,
        }
      );
    }

    const stripe =
      getStripe();

    let stripeCustomerId =
      company.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer =
        await stripe.customers.create({
          name: company.name,

          email:
            company.settings
              ?.email ??
            undefined,

          metadata: {
            companyId:
              String(
                company.id
              ),

            companyCode:
              company.code,
          },
        });

      stripeCustomerId =
        customer.id;

      await prisma.company.update({
        where: {
          id: company.id,
        },

        data: {
          stripeCustomerId,
        },
      });
    }

    const billableUserCount =
      company.employees.length;

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
      [
        {
          price:
            basePriceId,
          quantity: 1,
        },
      ];

    if (
      billableUserCount > 0
    ) {
      lineItems.push({
        price:
          userPriceId,

        quantity:
          billableUserCount,
      });
    }

    const origin =
      new URL(
        request.url
      ).origin;

    const checkoutSession =
      await stripe.checkout.sessions.create({
        mode: "subscription",

        customer:
          stripeCustomerId,

        line_items:
          lineItems,

        success_url:
          `${origin}/admin/companies/${company.id}?stripe=success`,

        cancel_url:
          `${origin}/admin/companies/${company.id}?stripe=cancelled`,

        allow_promotion_codes:
          true,

        billing_address_collection:
          "auto",

        customer_update: {
          address: "auto",
          name: "auto",
        },

        subscription_data: {
          metadata: {
            companyId:
              String(
                company.id
              ),

            companyCode:
              company.code,

            billableUsers:
              String(
                billableUserCount
            ),
          },
        },

        metadata: {
          companyId:
            String(
              company.id
            ),

          companyCode:
            company.code,

          billableUsers:
            String(
              billableUserCount
            ),
        },
      });

    if (!checkoutSession.url) {
      throw new Error(
        "Stripe Checkout did not return a URL."
      );
    }

    console.log(
      "[STRIPE] Checkout session created.",
      {
        adminId:
          session.adminId,

        companyId:
          company.id,

        companyName:
          company.name,

        stripeCustomerId,

        checkoutSessionId:
          checkoutSession.id,

        billableUserCount,
      }
    );

    return NextResponse.json({
      success: true,

      companyId:
        company.id,

      stripeCustomerId,

      checkoutSessionId:
        checkoutSession.id,

      checkoutUrl:
        checkoutSession.url,

      billableUserCount,

      pricing: {
        baseMonthly:
          40,

        userMonthly:
          5,

        estimatedMonthlyTotal:
          40 +
          billableUserCount *
            5,
      },
    });
  } catch (error) {
    console.error(
      "[STRIPE] Failed to create checkout session:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to create Stripe checkout session.",
      },
      {
        status: 500,
      }
    );
  }
}