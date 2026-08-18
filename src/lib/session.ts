import "server-only";

import {
  createHmac,
  timingSafeEqual,
} from "node:crypto";

import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";

export type CompanySessionRole =
  | "Owner"
  | "Office"
  | "Employee";

export type PlatformAdminSession = {
  accountType: "PLATFORM_ADMIN";

  adminId: number;

  employeeId: null;
  companyId: null;

  name: string;

  role: "PlatformAdmin";

  isPlatformAdmin: true;
};

export type CompanySession = {
  accountType: "COMPANY_USER";

  adminId: null;

  employeeId: number;
  companyId: number;

  name: string;

  role: CompanySessionRole;

  isPlatformAdmin: false;
};

export type SessionUser =
  | PlatformAdminSession
  | CompanySession;

const SESSION_COOKIE_NAME =
  "jobclokr-session";

const SESSION_MAX_AGE_SECONDS =
  60 * 60 * 24 * 7;

function getSessionSecret() {
  const secret =
    process.env.SESSION_SECRET;

  if (!secret) {
    throw new Error(
      "SESSION_SECRET is not configured."
    );
  }

  return secret;
}

function signPayload(
  payload: string
) {
  return createHmac(
    "sha256",
    getSessionSecret()
  )
    .update(payload)
    .digest("base64url");
}

function encodeSession(
  user: SessionUser
) {
  const payload =
    Buffer.from(
      JSON.stringify(user)
    ).toString("base64url");

  const signature =
    signPayload(payload);

  return `${payload}.${signature}`;
}

function decodeSession(
  value: string
): SessionUser | null {
  const separatorIndex =
    value.lastIndexOf(".");

  if (separatorIndex <= 0) {
    return null;
  }

  const payload =
    value.slice(
      0,
      separatorIndex
    );

  const signature =
    value.slice(
      separatorIndex + 1
    );

  const expectedSignature =
    signPayload(payload);

  const signatureBuffer =
    Buffer.from(signature);

  const expectedBuffer =
    Buffer.from(
      expectedSignature
    );

  if (
    signatureBuffer.length !==
    expectedBuffer.length
  ) {
    return null;
  }

  if (
    !timingSafeEqual(
      signatureBuffer,
      expectedBuffer
    )
  ) {
    return null;
  }

  try {
    const parsed =
      JSON.parse(
        Buffer.from(
          payload,
          "base64url"
        ).toString("utf8")
      ) as Partial<SessionUser>;

    /*
      PLATFORM ADMIN SESSION
    */
    if (
      parsed.accountType ===
        "PLATFORM_ADMIN"
    ) {
      if (
        typeof parsed.adminId !==
          "number" ||
        typeof parsed.name !==
          "string" ||
        parsed.role !==
          "PlatformAdmin" ||
        parsed.isPlatformAdmin !==
          true
      ) {
        return null;
      }

      return {
        accountType:
          "PLATFORM_ADMIN",

        adminId:
          parsed.adminId,

        employeeId:
          null,

        companyId:
          null,

        name:
          parsed.name,

        role:
          "PlatformAdmin",

        isPlatformAdmin:
          true,
      };
    }

    /*
      COMPANY USER SESSION
    */
    if (
      parsed.accountType ===
        "COMPANY_USER"
    ) {
      if (
        typeof parsed.employeeId !==
          "number" ||
        typeof parsed.companyId !==
          "number" ||
        typeof parsed.name !==
          "string" ||
        parsed.isPlatformAdmin !==
          false ||
        (
          parsed.role !==
            "Owner" &&
          parsed.role !==
            "Office" &&
          parsed.role !==
            "Employee"
        )
      ) {
        return null;
      }

      return {
        accountType:
          "COMPANY_USER",

        adminId:
          null,

        employeeId:
          parsed.employeeId,

        companyId:
          parsed.companyId,

        name:
          parsed.name,

        role:
          parsed.role,

        isPlatformAdmin:
          false,
      };
    }

    return null;
  } catch {
    return null;
  }
}

function subscriptionAllowsAccess(
  status: string
) {
  return (
    status === "ACTIVE" ||
    status === "TRIALING"
  );
}

export async function createSession(
  user: SessionUser
) {
  const cookieStore =
    await cookies();

  const encodedSession =
    encodeSession(user);

  cookieStore.set(
    SESSION_COOKIE_NAME,
    encodedSession,
    {
      httpOnly: true,

      secure:
        process.env.NODE_ENV ===
        "production",

      sameSite: "lax",

      path: "/",

      maxAge:
        SESSION_MAX_AGE_SECONDS,
    }
  );

  console.log(
    "[SESSION] Session cookie created.",
    {
      accountType:
        user.accountType,

      adminId:
        user.adminId,

      employeeId:
        user.employeeId,

      companyId:
        user.companyId,

      role:
        user.role,

      isPlatformAdmin:
        user.isPlatformAdmin,

      length:
        encodedSession.length,
    }
  );
}

export async function getSession():
  Promise<SessionUser | null> {
  const cookieStore =
    await cookies();

  const value =
    cookieStore.get(
      SESSION_COOKIE_NAME
    )?.value;

  if (!value) {
    console.log(
      "[SESSION] No jobclokr-session cookie received."
    );

    return null;
  }

  const session =
    decodeSession(value);

  if (!session) {
    console.log(
      "[SESSION] Cookie exists but could not be decoded or signature validation failed."
    );

    return null;
  }

  /*
    ========================================
    PLATFORM ADMIN
    ========================================
  */

  if (
    session.accountType ===
    "PLATFORM_ADMIN"
  ) {
    const admin =
      await prisma.platformAdmin.findUnique({
        where: {
          id:
            session.adminId,
        },

        select: {
          id: true,
          firstName: true,
          lastName: true,
          active: true,
        },
      });

    if (
      !admin ||
      !admin.active
    ) {
      console.log(
        "[SESSION] Platform administrator no longer has access.",
        {
          adminId:
            session.adminId,
        }
      );

      return null;
    }

    const name =
      `${admin.firstName} ${admin.lastName}`.trim();

    const currentSession:
      PlatformAdminSession = {
        accountType:
          "PLATFORM_ADMIN",

        adminId:
          admin.id,

        employeeId:
          null,

        companyId:
          null,

        name,

        role:
          "PlatformAdmin",

        isPlatformAdmin:
          true,
      };

    console.log(
      "[SESSION] Valid platform admin session.",
      {
        adminId:
          currentSession.adminId,

        name:
          currentSession.name,

        role:
          currentSession.role,
      }
    );

    return currentSession;
  }

  /*
    ========================================
    COMPANY USER
    ========================================
  */

  const company =
    await prisma.company.findUnique({
      where: {
        id:
          session.companyId,
      },

      select: {
        id: true,

        subscriptionStatus:
          true,
      },
    });

  if (!company) {
    console.log(
      "[SESSION] Company no longer exists.",
      {
        companyId:
          session.companyId,
      }
    );

    return null;
  }

  if (
    !subscriptionAllowsAccess(
      company.subscriptionStatus
    )
  ) {
    console.log(
      "[SESSION] Company subscription does not allow access.",
      {
        companyId:
          session.companyId,

        subscriptionStatus:
          company.subscriptionStatus,
      }
    );

    return null;
  }

  const employee =
    await prisma.employee.findFirst({
      where: {
        id:
          session.employeeId,

        companyId:
          session.companyId,

        active:
          true,
      },

      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

  if (!employee) {
    console.log(
      "[SESSION] Employee no longer has access.",
      {
        employeeId:
          session.employeeId,

        companyId:
          session.companyId,
      }
    );

    return null;
  }

  const name =
    `${employee.firstName} ${employee.lastName}`.trim();

  let role:
    CompanySessionRole;

  if (
    employee.role ===
    "OWNER"
  ) {
    role =
      "Owner";
  } else if (
    employee.role ===
    "OFFICE"
  ) {
    role =
      "Office";
  } else {
    role =
      "Employee";
  }

  const currentSession:
    CompanySession = {
      accountType:
        "COMPANY_USER",

      adminId:
        null,

      employeeId:
        employee.id,

      companyId:
        session.companyId,

      name,

      role,

      isPlatformAdmin:
        false,
    };

  console.log(
    "[SESSION] Valid company session.",
    {
      employeeId:
        currentSession.employeeId,

      companyId:
        currentSession.companyId,

      role:
        currentSession.role,

      subscriptionStatus:
        company.subscriptionStatus,
    }
  );

  return currentSession;
}

export async function deleteSession() {
  const cookieStore =
    await cookies();

  cookieStore.delete(
    SESSION_COOKIE_NAME
  );

  console.log(
    "[SESSION] Session cookie deleted."
  );
}

export function isCompanySession(
  user: SessionUser | null
): user is CompanySession {
  return (
    user?.accountType ===
    "COMPANY_USER"
  );
}

export function isPlatformAdminSession(
  user: SessionUser | null
): user is PlatformAdminSession {
  return (
    user?.accountType ===
    "PLATFORM_ADMIN"
  );
}

export function isOfficeSession(
  user: SessionUser | null
) {
  return (
    user?.accountType ===
      "COMPANY_USER" &&
    (
      user.role ===
        "Owner" ||
      user.role ===
        "Office"
    )
  );
}