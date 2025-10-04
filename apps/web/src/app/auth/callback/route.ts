import { db, schema } from "@workspace/db/db";
import { logger } from "@workspace/logger/logger";
import { NextResponse } from "next/server";

import { env } from "@/env";
import { createClient } from "@/supabase/utils/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const forwardedHost = request.headers.get("x-forwarded-host"); // original origin before load balancer
      const isLocalEnv = env.NODE_ENV === "development";

      try {
        const maybeUser = await db.query.users.findFirst({
          columns: { id: true, apiKey: true },
          where: (user, { eq }) => eq(user.id, data.session.user.id),
        });

        if (!maybeUser) {
          const [result] = await db
            .insert(schema.users)
            .values({
              id: data.session.user.id,
            })
            .returning({ userId: schema.users.id });

          if (!result) {
            // We can still set the user through user profile data update.
            logger.error("Could not set the user.");
          }

          if (isLocalEnv) {
            // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
            return NextResponse.redirect(`${origin}/settings/profile`);
          }

          if (forwardedHost) {
            return NextResponse.redirect(`https://${forwardedHost}/settings/profile`);
          }
          return NextResponse.redirect(`${origin}/settings/profile`);
        }

        const userProfile = await db.query.userProfiles.findFirst({
          where: (userProfile, { eq }) => eq(userProfile.userId, maybeUser.id),
        });

        if (!userProfile || !userProfile.username || !maybeUser.apiKey) {
          if (isLocalEnv) {
            // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
            return NextResponse.redirect(`${origin}/settings/profile`);
          }
          if (forwardedHost) {
            return NextResponse.redirect(`https://${forwardedHost}/settings/profile`);
          }
          return NextResponse.redirect(`${origin}/settings/profile`);
        }
      } catch (error) {
        logger.error(
          "Could not set the user or check profile data.",
          error instanceof Error ? error.message : String(error),
        );
      }

      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(`${origin}${next}`);
      }

      if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // return the user to an error page with instructions
  // TODO: add a page for this
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
