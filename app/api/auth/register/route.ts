import { NextResponse } from "next/server";

import {
  createAdminClient,
  isServiceRoleSignupEnabled,
} from "@/lib/supabase/admin";
import { createRouteHandlerClient } from "@/lib/supabase/route-handler";

type RegisterBody = {
  email?: string;
  password?: string;
};

function isExistingUserError(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes("already") || lower.includes("registered");
}

export async function POST(request: Request) {
  if (!isServiceRoleSignupEnabled()) {
    return NextResponse.json(
      { error: "Server-side signup is not enabled." },
      { status: 503 },
    );
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Server signup is not configured." },
      { status: 503 },
    );
  }

  let body: RegisterBody;
  try {
    body = (await request.json()) as RegisterBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const email = body.email?.trim();
  const password = body.password;

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 },
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters." },
      { status: 400 },
    );
  }

  const { error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  let userAlreadyExists = false;
  if (createError) {
    if (isExistingUserError(createError.message)) {
      userAlreadyExists = true;
    } else {
      return NextResponse.json({ error: createError.message }, { status: 400 });
    }
  }

  const supabase = await createRouteHandlerClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    if (userAlreadyExists) {
      return NextResponse.json(
        {
          error:
            "An account with this email already exists. Log in with your password.",
        },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: signInError.message }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
