import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

const COMPANY_ID = 1;

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

export async function GET() {
  try {
    const company =
      await prisma.company.findUnique({
        where: {
          id: COMPANY_ID,
        },
        include: {
          settings: true,
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

    const settings =
      company.settings ??
      (await prisma.companySettings.create({
        data: {
          companyId: company.id,
        },
      }));

    return NextResponse.json({
      companyName: company.name,

      phone: settings.phone ?? "",
      email: settings.email ?? "",
      website: settings.website ?? "",
      address: settings.address ?? "",

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
      "Failed to load company settings:",
      error
    );

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
    const body =
      (await request.json()) as SettingsRequestBody;

    const company =
      await prisma.company.findUnique({
        where: {
          id: COMPANY_ID,
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
      typeof body.companyName === "string"
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
        id: company.id,
      },
      data: {
        name: companyName,
      },
    });

    const settings =
      await prisma.companySettings.upsert({
        where: {
          companyId: company.id,
        },

        create: {
          companyId: company.id,

          phone:
            body.phone?.trim() || null,

          email:
            body.email?.trim() || null,

          website:
            body.website?.trim() || null,

          address:
            body.address?.trim() || null,

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
            body.phone?.trim() || null,

          email:
            body.email?.trim() || null,

          website:
            body.website?.trim() || null,

          address:
            body.address?.trim() || null,

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

    return NextResponse.json({
      companyName,

      phone: settings.phone ?? "",
      email: settings.email ?? "",
      website: settings.website ?? "",
      address: settings.address ?? "",

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
      "Failed to save company settings:",
      error
    );

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