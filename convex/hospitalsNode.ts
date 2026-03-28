"use node";

import { internalAction } from "./_generated/server";
import { ApifyClient } from "apify-client";
import { mapRawApifyItemToHospital } from "./lib/hospitalMap";

const DEFAULT_MAPS_ACTOR = "apify/google-maps-scraper";

function buildActorInput(actorId: string): Record<string, unknown> {
  const q =
    process.env.APIFY_HOSPITAL_SEARCH_QUERY?.trim() || "hospitals in India";

  const raw = process.env.APIFY_HOSPITAL_ACTOR_INPUT?.trim();
  if (raw) {
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      /* use generated input */
    }
  }

  const id = actorId.toLowerCase();
  if (id.includes("google-maps-scraper")) {
    return {
      searchStringsArray: [q],
      maxCrawledPlacesPerSearch: 20,
      language: "en",
    };
  }
  if (id.includes("compass") || id.includes("crawler-google-places")) {
    return {
      searchStrings: [q],
      maxCrawledPlacesPerSearch: 20,
    };
  }
  return {
    searchStrings: [q],
    maxCrawledPlacesPerSearch: 20,
  };
}

/**
 * Loads hospitals from Apify on Convex (uses APIFY_TOKEN).
 *
 * Priority:
 * 1. APIFY_HOSPITAL_DATASET_ID — read dataset (fast, no actor run).
 * 2. Else APIFY_HOSPITAL_ACTOR_ID — run that actor.
 * 3. Else run DEFAULT_MAPS_ACTOR (Google Maps scraper), unless opted out.
 *
 * Opt out of automatic Maps runs: APIFY_HOSPITAL_AUTO_RUN_DEFAULTS=false
 * (then you must set a dataset ID or explicit actor, or the list stays empty.)
 */
export const fetchApifyHospitals = internalAction({
  args: {},
  handler: async () => {
    const token = process.env.APIFY_TOKEN?.trim();
    if (!token) {
      console.warn(
        "[hospitalsNode] APIFY_TOKEN not set on Convex; returning no hospitals."
      );
      return [];
    }

    const datasetId = process.env.APIFY_HOSPITAL_DATASET_ID?.trim();
    const explicitActor = process.env.APIFY_HOSPITAL_ACTOR_ID?.trim();
    const disableDefaultMaps =
      process.env.APIFY_HOSPITAL_AUTO_RUN_DEFAULTS === "false" ||
      process.env.APIFY_HOSPITAL_AUTO_RUN_DEFAULTS === "0";

    if (!datasetId && !explicitActor && disableDefaultMaps) {
      console.warn(
        "[hospitalsNode] Default Maps run disabled. Set APIFY_HOSPITAL_DATASET_ID or APIFY_HOSPITAL_ACTOR_ID, or remove APIFY_HOSPITAL_AUTO_RUN_DEFAULTS=false."
      );
      return [];
    }

    try {
      const client = new ApifyClient({ token });
      let items: unknown[] = [];

      if (datasetId) {
        const page = await client.dataset(datasetId).listItems({
          clean: true,
          limit: 1000,
        });
        items = (page.items ?? []) as unknown[];
      } else {
        const actorToRun = explicitActor || DEFAULT_MAPS_ACTOR;
        const input = buildActorInput(actorToRun);
        console.log("[hospitalsNode] running actor", actorToRun);
        const run = await client.actor(actorToRun).call(input, { waitSecs: 120 });
        const page = await client.dataset(run.defaultDatasetId).listItems({
          clean: true,
          limit: 1000,
        });
        items = (page.items ?? []) as unknown[];
      }

      console.log("[hospitalsNode] raw items", items.length);

      const mapped = items
        .map((raw, i) => mapRawApifyItemToHospital(raw, i))
        .filter((x): x is NonNullable<typeof x> => x != null);

      if (items.length > 0 && mapped.length === 0) {
        const first = items[0];
        console.warn(
          "[hospitalsNode] No rows mapped to hospitals. First item keys:",
          first != null && typeof first === "object"
            ? Object.keys(first as object)
            : typeof first
        );
      }

      return mapped;
    } catch (e) {
      console.error("[hospitalsNode] Apify error", e);
      return [];
    }
  },
});
