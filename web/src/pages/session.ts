import type { APIRoute, AstroCookies } from "astro";

// A long-lived backup of the member's sign-in, kept in a cookie set by the server.
// Safari clears localStorage (where the PocketBase SDK keeps the sign-in) after 7 days without
// a visit, but not cookies set by the server, so this lets a member stay signed in on a device
// they only use now and then. See memberReady in lib/client.ts.
// Lives at /session because /api/* is routed to PocketBase.

const PB_URL = process.env.PB_URL ?? "http://127.0.0.1:8090";
const COOKIE = "member_session";

function remember(cookies: AstroCookies, token: string) {
  cookies.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    // Only sent to this endpoint, not with every page.
    path: "/session",
    // 400 days, the longest browsers allow; renewed whenever the member uses the site.
    maxAge: 400 * 24 * 60 * 60,
    secure: (process.env.SITE_URL ?? "").startsWith("https:"),
  });
}

function forget(cookies: AstroCookies) {
  cookies.delete(COOKIE, { path: "/session" });
}

/** The member's sign-in from the cookie, renewed, or 204 if there isn't a valid one. */
export const GET: APIRoute = async ({ cookies, request, clientAddress }) => {
  const token = cookies.get(COOKIE)?.value;
  if (!token) return new Response(null, { status: 204 });

  let res: Response;
  try {
    res = await fetch(`${PB_URL}/api/collections/users/auth-refresh`, {
      method: "POST",
      headers: {
        Authorization: token,
        // So PocketBase rate-limits per visitor rather than per web server.
        "X-Forwarded-For": request.headers.get("X-Forwarded-For") ?? clientAddress,
      },
    });
  } catch {
    return new Response(null, { status: 503 });
  }
  if (!res.ok) {
    // Signed out elsewhere, password changed or account deleted. Server errors keep the cookie.
    if (res.status < 500) forget(cookies);
    return new Response(null, { status: res.status < 500 ? 204 : 503 });
  }
  const { token: fresh, record } = await res.json();
  remember(cookies, fresh);
  return new Response(JSON.stringify({ token: fresh, record }), {
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
};

/** Keep a copy of a new sign-in. It's checked with PocketBase when it's next used. */
export const POST: APIRoute = async ({ cookies, request }) => {
  const body = await request.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token : "";
  if (!token || token.length > 4096) return new Response(null, { status: 400 });
  remember(cookies, token);
  return new Response(null, { status: 204 });
};

/** Signing out. */
export const DELETE: APIRoute = async ({ cookies }) => {
  forget(cookies);
  return new Response(null, { status: 204 });
};
