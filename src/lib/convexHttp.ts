import { ConvexHttpClient } from "convex/browser";

export function getConvexHttpClient(): ConvexHttpClient | null {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL?.trim();
  if (!url) return null;
  return new ConvexHttpClient(url);
}
