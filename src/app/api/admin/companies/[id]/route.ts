import { NextResponse } from "next/server";

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

function isValidTime(
  value: string
) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(
    value
  );
}

function optionalText(
  value: unknown
) {
  if (
    value === undefined
  ) {
    return undefined;
  }

  const text =
    String(
      value ?? ""
    ).trim();

  return text || null;
}

export async function GET(
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

    const company =
      await prisma.company.findUnique({
        where: {
          id:
            companyId,
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

          settings: {
            select: {
              phone:
                true,

              email:
                true,

              website:
                true,

              address:
                true,

              defaultShiftStart:
                true,

              defaultShiftEnd:
                true,

              overtimeThreshold:
                true,

              lunchDuration:
                true,

              gpsTrackingEnabled:
                true,

              allowEmployeePunchEdits:
                true,

              requireClockOutNotes:
                true,
            },
          },

          employees: {
            select: {
              id:
                true,

              firstName:
                true,

              lastName:
                true,

              email:
                true,

              phone:
                true,

              loginName:
                true,

              role:
                true,

              active:
                true,

              mustChangePassword:
                true,

              createdAt:
                true,
            },

            orderBy: [
              {
                lastName:
                  "asc",
              },
              {
                firstName:
                  "asc",
              },
            ],
          },

          customers: {
            select: {
              id:
                true,

              name:
                true,

              contactName:
                true,

              email:
                true,

              phone:
                true,

              city:
                true,

              state:
                true,

              createdAt:
                true,
            },

            orderBy: {
              name:
                "asc",
            },
          },

          projects: {
            select: {
              id:
                true,

              name:
                true,

              status:
                true,

              startDate:
                true,

              dueDate:
                true,

              createdAt:
                true,

              customer: {
                select: {
                  id:
                    true,

                  name:
                    true,
                },
              },
            },

            orderBy: {
              name:
                "asc",
            },
          },

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

    return NextResponse.json({
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

      createdAt:
        company.createdAt.toISOString(),

      updatedAt:
        company.updatedAt.toISOString(),

      counts: {
        employees:
          company._count
            .employees,

        customers:
          company._count
            .customers,

        projects:
          company._count
            .projects,
      },

      settings:
        company.settings,

      employees:
        company.employees.map(
          (
            employee
          ) => ({
            ...employee,

            createdAt:
              employee.createdAt.toISOString(),
          })
        ),

      customers:
        company.customers.map(
          (
            customer
          ) => ({
            ...customer,

            createdAt:
              customer.createdAt.toISOString(),
          })
        ),

      projects:
        company.projects.map(
          (
            project
          ) => ({
            ...project,

            startDate:
              project.startDate
                ? project.startDate.toISOString()
                : null,

            dueDate:
              project.dueDate
                ? project.dueDate.toISOString()
                : null,

            createdAt:
              project.createdAt.toISOString(),
          })
        ),
    });
  } catch (error) {
    console.error(
      "Failed to load admin company:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to load company.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PATCH(
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

    const existingCompany =
      await prisma.company.findUnique({
        where: {
          id:
            companyId,
        },

        select: {
          id:
            true,

          name:
            true,

          code:
            true,

          subscriptionStatus:
            true,
        },
      });

    if (!existingCompany) {
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

    const body =
      await request.json();

    const companyData: {
      name?: string;
      code?: string;
      subscriptionStatus?: string;
    } = {};

    const settingsData: {
      phone?: string | null;
      email?: string | null;
      website?: string | null;
      address?: string | null;
      defaultShiftStart?: string;
      defaultShiftEnd?: string;
      overtimeThreshold?: number;
      lunchDuration?: number;
    } = {};

    if (
      body.name !==
      undefined
    ) {
      const name =
        String(
          body.name ?? ""
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

      companyData.name =
        name;
    }

    if (
      body.code !==
      undefined
    ) {
      const code =
        String(
          body.code ?? ""
        )
          .trim()
          .toUpperCase();

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

      const duplicateCode =
        await prisma.company.findFirst({
          where: {
            code,

            NOT: {
              id:
                companyId,
            },
          },

          select: {
            id:
              true,
          },
        });

      if (
        duplicateCode
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

      companyData.code =
        code;
    }

    if (
      body.subscriptionStatus !==
      undefined
    ) {
      const subscriptionStatus =
        String(
          body.subscriptionStatus ??
            ""
        )
          .trim()
          .toUpperCase();

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

      companyData.subscriptionStatus =
        subscriptionStatus;
    }

    const phone =
      optionalText(
        body.phone
      );

    if (
      phone !==
      undefined
    ) {
      settingsData.phone =
        phone;
    }

    const email =
      optionalText(
        body.email
      );

    if (
      email !==
      undefined
    ) {
      settingsData.email =
        email;
    }

    const website =
      optionalText(
        body.website
      );

    if (
      website !==
      undefined
    ) {
      settingsData.website =
        website;
    }

    const address =
      optionalText(
        body.address
      );

    if (
      address !==
      undefined
    ) {
      settingsData.address =
        address;
    }

    if (
      body.defaultShiftStart !==
      undefined
    ) {
      const defaultShiftStart =
        String(
          body.defaultShiftStart ??
            ""
        ).trim();

      if (
        !isValidTime(
          defaultShiftStart
        )
      ) {
        return NextResponse.json(
          {
            error:
              "Default shift start must use HH:MM format.",
          },
          {
            status: 400,
          }
        );
      }

      settingsData.defaultShiftStart =
        defaultShiftStart;
    }

    if (
      body.defaultShiftEnd !==
      undefined
    ) {
      const defaultShiftEnd =
        String(
          body.defaultShiftEnd ??
            ""
        ).trim();

      if (
        !isValidTime(
          defaultShiftEnd
        )
      ) {
        return NextResponse.json(
          {
            error:
              "Default shift end must use HH:MM format.",
          },
          {
            status: 400,
          }
        );
      }

      settingsData.defaultShiftEnd =
        defaultShiftEnd;
    }

    if (
      body.overtimeThreshold !==
      undefined
    ) {
      const overtimeThreshold =
        Number(
          body.overtimeThreshold
        );

      if (
        !Number.isFinite(
          overtimeThreshold
        ) ||
        overtimeThreshold < 0 ||
        overtimeThreshold > 168
      ) {
        return NextResponse.json(
          {
            error:
              "Overtime threshold must be between 0 and 168 hours.",
          },
          {
            status: 400,
          }
        );
      }

      settingsData.overtimeThreshold =
        overtimeThreshold;
    }

    if (
      body.lunchDuration !==
      undefined
    ) {
      const lunchDuration =
        Number(
          body.lunchDuration
        );

      if (
        !Number.isInteger(
          lunchDuration
        ) ||
        lunchDuration < 0 ||
        lunchDuration > 480
      ) {
        return NextResponse.json(
          {
            error:
              "Lunch duration must be a whole number between 0 and 480 minutes.",
          },
          {
            status: 400,
          }
        );
      }

      settingsData.lunchDuration =
        lunchDuration;
    }

    const hasCompanyChanges =
      Object.keys(
        companyData
      ).length > 0;

    const hasSettingsChanges =
      Object.keys(
        settingsData
      ).length > 0;

    if (
      !hasCompanyChanges &&
      !hasSettingsChanges
    ) {
      return NextResponse.json(
        {
          error:
            "No company changes were provided.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      hasCompanyChanges
    ) {
      await prisma.company.update({
        where: {
          id:
            companyId,
        },

        data:
          companyData,
      });
    }

    if (
      hasSettingsChanges
    ) {
      await prisma.companySettings.upsert({
        where: {
          companyId,
        },

        create: {
          companyId,

          ...settingsData,
        },

        update:
          settingsData,
      });
    }

    const company =
      await prisma.company.findUnique({
        where: {
          id:
            companyId,
        },

        select: {
          id:
            true,

          name:
            true,

          code:
            true,

          subscriptionStatus:
            true,

          updatedAt:
            true,

          settings: {
            select: {
              phone:
                true,

              email:
                true,

              website:
                true,

              address:
                true,

              defaultShiftStart:
                true,

              defaultShiftEnd:
                true,

              overtimeThreshold:
                true,

              lunchDuration:
                true,

              gpsTrackingEnabled:
                true,

              allowEmployeePunchEdits:
                true,

              requireClockOutNotes:
                true,
            },
          },
        },
      });

    if (!company) {
      return NextResponse.json(
        {
          error:
            "Company could not be reloaded after update.",
        },
        {
          status: 500,
        }
      );
    }

    console.log(
      "[PLATFORM ADMIN] Company updated.",
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

        companyFieldsUpdated:
          Object.keys(
            companyData
          ),

        settingsFieldsUpdated:
          Object.keys(
            settingsData
          ),
      }
    );

    return NextResponse.json({
      id:
        company.id,

      name:
        company.name,

      code:
        company.code,

      subscriptionStatus:
        company.subscriptionStatus,

      updatedAt:
        company.updatedAt.toISOString(),

      settings:
        company.settings,
    });
  } catch (error) {
    console.error(
      "Failed to update admin company:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to update company.",
      },
      {
        status: 500,
      }
    );
  }
}