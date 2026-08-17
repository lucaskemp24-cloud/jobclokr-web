import "server-only";

import {
  createHmac,
  timingSafeEqual,
} from "node:crypto";

import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";

export type SessionRole =
  | "Owner"
  | "Office"
  | "Employee";

export type SessionUser = {
  employeeId: number;
  companyId: number;
  name: string;
  role: SessionRole;
};

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

    if (
      typeof parsed.employeeId !==
        "number" ||
      typeof parsed.companyId !==
        "number" ||
      typeof parsed.name !==
        "string" ||
      (
        parsed.role !== "Owner" &&
        parsed.role !== "Office" &&
        parsed.role !== "Employee"
      )
    ) {
      return null;
    }

    return {
      employeeId:
        parsed.employeeId,

      companyId:
        parsed.companyId,

      name:
        parsed.name,

      role:
        parsed.role,
    };
  } catch {
    return null;
  }
}

function subscriptionAllowsAccess(
  status:
    | "INCOMPLETE"
    | "TRIALING"
    | "ACTIVE"
    | "PAST_DUE"
    | "CANCELED"
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
      employeeId:
        user.employeeId,

      companyId:
        user.companyId,

      role:
        user.role,

      length:
        encodedSession.length,
    }
  );
}

export async function getSession() {
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

  console.log(
    "[SESSION] Valid session.",
    {
      employeeId:
        session.employeeId,

      companyId:
        session.companyId,

      role:
        session.role,

      subscriptionStatus:
        company.subscriptionStatus,
    }
  );

  return session;
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

export function isOfficeSession(
  user: SessionUser | null
) {
  return (
    user?.role === "Owner" ||
    user?.role === "Office"
  );
}