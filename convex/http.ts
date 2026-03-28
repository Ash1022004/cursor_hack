import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { json } from "./http/common";
import { registerAllHttpRoutes } from "./http/registerAll";

const http = httpRouter();
registerAllHttpRoutes(http);

// Hospitals from Apify (uses APIFY_API_KEY on Convex); used by Next /api rewrites.
http.route({
  path: "/api/apify/hospitals",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    try {
      const url = new URL(request.url);
      const state = url.searchParams.get("state")?.trim() ?? "";
      if (!state) {
        return json({ hospitals: [] });
      }
      const hospitals = await ctx.runAction(
        internal.hospitalsNode.fetchApifyHospitals,
        { state }
      );
      return json({ hospitals });
    } catch (e) {
      console.error("[http /api/apify/hospitals]", e);
      return json({ hospitals: [] });
    }
  }),
});

http.route({
  path: "/api/apify/doctors",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    try {
      const url = new URL(request.url);
      const hospitalId = url.searchParams.get("hospitalId")?.trim() ?? "";
      if (!hospitalId) {
        return json({ doctors: [] });
      }
      const hospitalName = url.searchParams.get("hospitalName")?.trim();
      const specialtyHint = url.searchParams.get("speciality")?.trim();
      const doctors = await ctx.runAction(internal.doctorsNode.doctorsForHospital, {
        hospitalId,
        hospitalName: hospitalName || undefined,
        specialtyHint: specialtyHint || undefined,
      });
      return json({ doctors });
    } catch (e) {
      console.error("[http /api/apify/doctors]", e);
      return json({ doctors: [] });
    }
  }),
});

export default http;
