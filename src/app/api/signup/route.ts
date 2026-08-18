import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Public business account creation is disabled. Please contact JobClokr administration to set up an account.",
      code:
        "PUBLIC_SIGNUP_DISABLED",
    },
    {
      status: 403,
    }
  );
}