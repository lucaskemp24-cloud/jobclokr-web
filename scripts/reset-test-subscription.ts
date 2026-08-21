import "dotenv/config";

import { prisma } from "../src/lib/prisma";

async function main() {
  const company = await prisma.company.update({
    where: {
      id: 3,
    },

    data: {
      stripeSubscriptionId: null,
      subscriptionStatus: "INCOMPLETE",
      subscriptionCurrentPeriodStart: null,
      subscriptionCurrentPeriodEnd: null,
    },

    select: {
      id: true,
      name: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
      subscriptionStatus: true,
      subscriptionCurrentPeriodStart: true,
      subscriptionCurrentPeriodEnd: true,
    },
  });

  console.log("TEST company subscription reset:");
  console.log(company);
}

main()
  .catch((error) => {
    console.error("Reset failed:");
    console.error(error);
    process.exit(1);
  })
  .finally(() => {
    console.log("Reset script finished.");
  });