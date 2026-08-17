import { NextResponse } from "next/server";

import { getSession } from "@/lib/session";

export async function GET() {
  try {
    const session =
      await getSession();

    if (!session) {
      return NextResponse.json(
        {
          authenticated: false,
          user: null,
        },
        {
          status: 401,
        }
      );
    }

    return NextResponse.json({
      authenticated: true,
      user: session,
    });
  } catch (error) {
    console.error(
      "Failed to load session:",
      error
    );

    return NextResponse.json(
      {
        authenticated: false,
        user: null,
        error:
          "Unable to load session.",
      },
      {
        status: 500,
      }
    );
  }
}