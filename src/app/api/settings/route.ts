import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

type SettingsRequestBody = {
  companyName?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;

  defaultShiftStart?: string;
  defaultShiftEnd?: string;

  overtimeThreshold?: number;
  lunchDuration?: number;

  punchRounding?: string;

  gpsTrackingEnabled?: boolean;
  allowEmployeePunchEdits?: boolean;
  requireClockOutNotes?: boolean;

  clockInReminderEnabled?: boolean;
  missedClockOutNotification?: boolean;
  overtimeNotification?: boolean;
};

async function requireOfficeSession() {
  const session =
    await getSession();

  if (!session) {
    return {
      session: null,
      response:
        NextResponse.json(
          {
            error:
              "Authentication required.",
          },
          {
            status: 401,
          }
        ),
    };
  }

  if (
    session.role !== "Owner" &&
    session.role !== "Office"
  ) {
    return {
      session: null,
      response:
        NextResponse.json(
          {
            error:
              "Office access required.",
          },
          {
            status: 403,
          }
        ),
    };
  }

  return {
    session,
    response: null,
  };
}

export async function GET() {
  try {
    console.log(
      "GET /api/settings started"
    );

    const auth =
      await requireOfficeSession();

    if (
      !auth.session ||
      auth.response
    ) {
      console.log(
        "GET /api/settings blocked by session check"
      );

      return auth.response;
    }

    console.log(
      "Settings session:",
      {
        employeeId:
          auth.session.employeeId,
        companyId:
          auth.session.companyId,
        role:
          auth.session.role,
      }
    );

    const company =
      await prisma.company.findUnique({
        where: {
          id:
            auth.session.companyId,
        },

        include: {
          settings: true,
        },
      });

    console.log(
      "Settings company lookup result:",
      company
        ? {
            id: company.id,
            name: company.name,
            hasSettings:
              Boolean(
                company.settings
              ),
          }
        : null
    );

    if (!company) {
      return NextResponse.json(
        {
          error:
            "Company could not be found.",
        },
        {
          status: 404,
        }
      );
    }

    const settings =
      company.settings ??
      (await prisma.companySettings.create({
        data: {
          companyId:
            company.id,
        },
      }));

    console.log(
      "GET /api/settings completed successfully"
    );

    return NextResponse.json({
      companyName:
        company.name,

      phone:
        settings.phone ?? "",

      email:
        settings.email ?? "",

      website:
        settings.website ?? "",

      address:
        settings.address ?? "",

      defaultShiftStart:
        settings.defaultShiftStart,

      defaultShiftEnd:
        settings.defaultShiftEnd,

      overtimeThreshold:
        settings.overtimeThreshold,

      lunchDuration:
        settings.lunchDuration,

      punchRounding:
        settings.punchRounding,

      gpsTrackingEnabled:
        settings.gpsTrackingEnabled,

      allowEmployeePunchEdits:
        settings.allowEmployeePunchEdits,

      requireClockOutNotes:
        settings.requireClockOutNotes,

      clockInReminderEnabled:
        settings.clockInReminderEnabled,

      missedClockOutNotification:
        settings.missedClockOutNotification,

      overtimeNotification:
        settings.overtimeNotification,
    });
  } catch (error) {
    console.error(
      "Failed to load company settings:"
    );

    console.error(error);

    if (error instanceof Error) {
      console.error(
        "Error name:",
        error.name
      );

      console.error(
        "Error message:",
        error.message
      );

      console.error(
        "Error stack:",
        error.stack
      );
    }

    return NextResponse.json(
      {
        error:
          "Unable to load company settings.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PUT(
  request: Request
) {
  try {
    console.log(
      "PUT /api/settings started"
    );

    const auth =
      await requireOfficeSession();

    if (
      !auth.session ||
      auth.response
    ) {
      console.log(
        "PUT /api/settings blocked by session check"
      );

      return auth.response;
    }

    const body =
      (await request.json()) as SettingsRequestBody;

    const company =
      await prisma.company.findUnique({
        where: {
          id:
            auth.session.companyId,
        },
      });

    if (!company) {
      return NextResponse.json(
        {
          error:
            "Company could not be found.",
        },
        {
          status: 404,
        }
      );
    }

    const companyName =
      typeof body.companyName ===
      "string"
        ? body.companyName.trim()
        : company.name;

    if (!companyName) {
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

    await prisma.company.update({
      where: {
        id:
          company.id,
      },

      data: {
        name:
          companyName,
      },
    });

    const settings =
      await prisma.companySettings.upsert({
        where: {
          companyId:
            company.id,
        },

        create: {
          companyId:
            company.id,

          phone:
            body.phone?.trim() ||
            null,

          email:
            body.email?.trim() ||
            null,

          website:
            body.website?.trim() ||
            null,

          address:
            body.address?.trim() ||
            null,

          defaultShiftStart:
            body.defaultShiftStart ||
            "07:00",

          defaultShiftEnd:
            body.defaultShiftEnd ||
            "15:30",

          overtimeThreshold:
            typeof body.overtimeThreshold ===
            "number"
              ? body.overtimeThreshold
              : 40,

          lunchDuration:
            typeof body.lunchDuration ===
            "number"
              ? body.lunchDuration
              : 30,

          punchRounding:
            body.punchRounding ||
            "None",

          gpsTrackingEnabled:
            body.gpsTrackingEnabled ??
            false,

          allowEmployeePunchEdits:
            body.allowEmployeePunchEdits ??
            false,

          requireClockOutNotes:
            body.requireClockOutNotes ??
            false,

          clockInReminderEnabled:
            body.clockInReminderEnabled ??
            false,

          missedClockOutNotification:
            body.missedClockOutNotification ??
            false,

          overtimeNotification:
            body.overtimeNotification ??
            false,
        },

        update: {
          phone:
            body.phone?.trim() ||
            null,

          email:
            body.email?.trim() ||
            null,

          website:
            body.website?.trim() ||
            null,

          address:
            body.address?.trim() ||
            null,

          defaultShiftStart:
            body.defaultShiftStart ||
            "07:00",

          defaultShiftEnd:
            body.defaultShiftEnd ||
            "15:30",

          overtimeThreshold:
            typeof body.overtimeThreshold ===
            "number"
              ? body.overtimeThreshold
              : 40,

          lunchDuration:
            typeof body.lunchDuration ===
            "number"
              ? body.lunchDuration
              : 30,

          punchRounding:
            body.punchRounding ||
            "None",

          gpsTrackingEnabled:
            body.gpsTrackingEnabled ??
            false,

          allowEmployeePunchEdits:
            body.allowEmployeePunchEdits ??
            false,

          requireClockOutNotes:
            body.requireClockOutNotes ??
            false,

          clockInReminderEnabled:
            body.clockInReminderEnabled ??
            false,

          missedClockOutNotification:
            body.missedClockOutNotification ??
            false,

          overtimeNotification:
            body.overtimeNotification ??
            false,
        },
      });

    console.log(
      "PUT /api/settings completed successfully"
    );

    return NextResponse.json({
      companyName,

      phone:
        settings.phone ?? "",

      email:
        settings.email ?? "",

      website:
        settings.website ?? "",

      address:
        settings.address ?? "",

      defaultShiftStart:
        settings.defaultShiftStart,

      defaultShiftEnd:
        settings.defaultShiftEnd,

      overtimeThreshold:
        settings.overtimeThreshold,

      lunchDuration:
        settings.lunchDuration,

      punchRounding:
        settings.punchRounding,

      gpsTrackingEnabled:
        settings.gpsTrackingEnabled,

      allowEmployeePunchEdits:
        settings.allowEmployeePunchEdits,

      requireClockOutNotes:
        settings.requireClockOutNotes,

      clockInReminderEnabled:
        settings.clockInReminderEnabled,

      missedClockOutNotification:
        settings.missedClockOutNotification,

      overtimeNotification:
        settings.overtimeNotification,
    });
  } catch (error) {
    console.error(
      "Failed to save company settings:"
    );

    console.error(error);

    if (error instanceof Error) {
      console.error(
        "Error name:",
        error.name
      );

      console.error(
        "Error message:",
        error.message
      );

      console.error(
        "Error stack:",
        error.stack
      );
    }

    return NextResponse.json(
      {
        error:
          "Unable to save company settings.",
      },
      {
        status: 500,
      }
    );
  }
}