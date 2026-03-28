import { type NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function convexHttpBase(): string | null {
  const site = process.env.CONVEX_SITE_URL?.trim();
  if (site) return site.replace(/\/$/, "");
  const cloud = process.env.NEXT_PUBLIC_CONVEX_URL?.trim();
  if (cloud?.includes(".convex.cloud")) {
    return cloud.replace(".convex.cloud", ".convex.site").replace(/\/$/, "");
  }
  return null;
}

export async function GET(request: NextRequest) {
  const base = convexHttpBase();
  if (!base) {
    return NextResponse.json(
      {
        error:
          "Missing CONVEX_SITE_URL (or NEXT_PUBLIC_CONVEX_URL with .convex.cloud). Add one to .env.local.",
        doctors: [],
      },
      { status: 503 }
    );
  }

  const qs = request.nextUrl.search;
  const url = `${base}/api/apify/doctors${qs}`;
  try {
    const res = await fetch(url, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    const body = await res.text();
    return new NextResponse(body, {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("Content-Type") ?? "application/json",
      },
    });
  } catch (e) {
    console.error("[api/apify/doctors] Convex proxy failed", e);
    return NextResponse.json(
      {
        error:
          "Could not reach Convex at CONVEX_SITE_URL. Is `npx convex dev` running and the URL correct?",
        doctors: [],
      },
      { status: 502 }
    );
  }
}
