import Stripe from "stripe";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

function getStripe() {
  const secretKey =
    process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error(
      "STRIPE_SECRET_KEY is not configured."
    );
  }

  return new Stripe(
    secretKey
  );
}

function getWebhookSecret() {
  const secret =
    process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    throw new Error(
      "STRIPE_WEBHOOK_SECRET is not configured."
    );
  }

  return secret;
}

function mapSubscriptionStatus(
  status: Stripe.Subscription.Status
):
  | "INCOMPLETE"
  | "TRIALING"
  | "ACTIVE"
  | "PAST_DUE"
  | "CANCELED" {
  switch (status) {
    case "trialing":
      return "TRIALING";

    case "active":
      return "ACTIVE";

    case "past_due":
      return "PAST_DUE";

    case "canceled":
      return "CANCELED";

    case "incomplete":
    case "incomplete_expired":
    case "unpaid":
    case "paused":
    default:
      return "INCOMPLETE";
  }
}

function getStripeCustomerId(
  subscription:
    Stripe.Subscription
) {
  if (
    typeof subscription.customer ===
    "string"
  ) {
    return subscription.customer;
  }

  return subscription.customer.id;
}

function getCompanyIdFromMetadata(
  subscription:
    Stripe.Subscription
) {
  const value =
    subscription.metadata
      ?.companyId;

  if (!value) {
    return null;
  }

  const companyId =
    Number(value);

  if (
    !Number.isInteger(companyId) ||
    companyId <= 0
  ) {
    return null;
  }

  return companyId;
}

function toDate(
  unixSeconds:
    number | null | undefined
) {
  if (
    typeof unixSeconds !==
    "number"
  ) {
    return null;
  }

  return new Date(
    unixSeconds * 1000
  );
}

function getSubscriptionPeriod(
  subscription:
    Stripe.Subscription
) {
  const firstSubscriptionItem =
    subscription.items.data[0];

  const periodStart =
    toDate(
      firstSubscriptionItem
        ?.current_period_start
    );

  const periodEnd =
    toDate(
      firstSubscriptionItem
        ?.current_period_end
    );

  return {
    periodStart,
    periodEnd,
  };
}

async function updateCompanyFromSubscription(
  subscription:
    Stripe.Subscription
) {
  const stripeCustomerId =
    getStripeCustomerId(
      subscription
    );

  const companyId =
    getCompanyIdFromMetadata(
      subscription
    );

  const subscriptionStatus =
    mapSubscriptionStatus(
      subscription.status
    );

  const {
    periodStart,
    periodEnd,
  } =
    getSubscriptionPeriod(
      subscription
    );

  let company:
    | {
        id: number;
      }
    | null = null;

  if (companyId) {
    company =
      await prisma.company.findUnique({
        where: {
          id:
            companyId,
        },

        select: {
          id: true,
        },
      });
  }

  if (!company) {
    company =
      await prisma.company.findFirst({
        where: {
          OR: [
            {
              stripeSubscriptionId:
                subscription.id,
            },
            {
              stripeCustomerId,
            },
          ],
        },

        select: {
          id: true,
        },
      });
  }

  if (!company) {
    console.warn(
      "[STRIPE WEBHOOK] No JobClokr company matched subscription.",
      {
        subscriptionId:
          subscription.id,

        stripeCustomerId,

        companyIdFromMetadata:
          companyId,
      }
    );

    return;
  }

  await prisma.company.update({
    where: {
      id:
        company.id,
    },

    data: {
      stripeCustomerId,

      stripeSubscriptionId:
        subscription.id,

      subscriptionStatus,

      subscriptionCurrentPeriodStart:
        periodStart,

      subscriptionCurrentPeriodEnd:
        periodEnd,
    },
  });

  console.log(
    "[STRIPE WEBHOOK] Company subscription updated.",
    {
      companyId:
        company.id,

      stripeSubscriptionId:
        subscription.id,

      stripeCustomerId,

      stripeStatus:
        subscription.status,

      jobClokrStatus:
        subscriptionStatus,

      periodStart,

      periodEnd,
    }
  );
}

export async function POST(
  request: Request
) {
  try {
    const signature =
      request.headers.get(
        "stripe-signature"
      );

    if (!signature) {
      return NextResponse.json(
        {
          error:
            "Missing Stripe signature.",
        },
        {
          status: 400,
        }
      );
    }

    const rawBody =
      await request.text();

    const stripe =
      getStripe();

    let event:
      Stripe.Event;

    try {
      event =
        stripe.webhooks.constructEvent(
          rawBody,
          signature,
          getWebhookSecret()
        );
    } catch (error) {
      console.error(
        "[STRIPE WEBHOOK] Signature verification failed:",
        error
      );

      return NextResponse.json(
        {
          error:
            "Invalid webhook signature.",
        },
        {
          status: 400,
        }
      );
    }

    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription =
          event.data
            .object as
            Stripe.Subscription;

        await updateCompanyFromSubscription(
          subscription
        );

        break;
      }

      default:
        console.log(
          "[STRIPE WEBHOOK] Ignored event:",
          event.type
        );
    }

    return NextResponse.json({
      received: true,
    });
  } catch (error) {
    console.error(
      "[STRIPE WEBHOOK] Failed:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Webhook processing failed.",
      },
      {
        status: 500,
      }
    );
  }
}