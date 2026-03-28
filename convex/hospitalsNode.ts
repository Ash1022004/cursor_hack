"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import {
  apifyListDatasetItems,
  apifyRunActorSync,
} from "./lib/apifyRest";
import {
  filterHospitalsByIndianState,
  mapRawApifyItemToHospital,
} from "./lib/hospitalMap";

/** Store default: Apify Google Maps Scraper is `compass/crawler-google-places` (not apify/google-maps-scraper). */
const DEFAULT_MAPS_ACTOR = "compass/crawler-google-places";

function buildActorInput(
  actorId: string,
  indianState: string
): Record<string, unknown> {
  const stateTrim = indianState.trim();
  const raw = process.env.APIFY_HOSPITAL_ACTOR_INPUT?.trim();
  if (raw && !stateTrim) {
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      /* fall through */
    }
  }

  const q =
    stateTrim.length > 0
      ? `hospitals in ${stateTrim}, India`
      : process.env.APIFY_HOSPITAL_SEARCH_QUERY?.trim() || "hospitals in India";

  const id = actorId.toLowerCase();
  const envLocation = process.env.APIFY_HOSPITAL_LOCATION_QUERY?.trim();
  /** Bias Maps to the selected state; env override wins for fixed deployments. */
  const locationQuery =
    envLocation ||
    (stateTrim.length > 0 ? `${stateTrim}, India` : undefined);

  const maxPlaces =
    stateTrim.length > 0
      ? Math.min(
          80,
          Math.max(
            20,
            Number.parseInt(
              process.env.APIFY_HOSPITAL_MAX_PLACES_PER_SEARCH?.trim() ?? "",
              10
            ) || 40
          )
        )
      : 20;

  // compass/crawler-google-places expects searchStringsArray (not searchStrings).
  if (
    id.includes("compass") ||
    id.includes("crawler-google-places") ||
    id.includes("google-maps-scraper")
  ) {
    const input: Record<string, unknown> = {
      searchStringsArray: [q],
      maxCrawledPlacesPerSearch: maxPlaces,
      language: "en",
    };
    if (locationQuery) {
      input.locationQuery = locationQuery;
    }
    return input;
  }
  return {
    searchStringsArray: [q],
    maxCrawledPlacesPerSearch: maxPlaces,
    language: "en",
    ...(locationQuery ? { locationQuery } : {}),
  };
}

/**
 * Loads hospitals for a given Indian state/UT from Apify on Convex.
 * Uses `APIFY_API_KEY` or `APIFY_TOKEN` (Apify bearer token).
 *
 * Priority:
 * 1. APIFY_HOSPITAL_DATASET_ID — read dataset (fast, no actor run); rows filtered by state in address/name.
 * 2. Else APIFY_HOSPITAL_ACTOR_ID — run that actor.
 * 3. Else run DEFAULT_MAPS_ACTOR (compass/crawler-google-places), unless opted out.
 *
 * Opt out of automatic Maps runs: APIFY_HOSPITAL_AUTO_RUN_DEFAULTS=false
 * (then you must set a dataset ID or explicit actor, or the list stays empty.)
 *
 * Per-state runs use search + default `locationQuery` of `{state}, India` unless
 * APIFY_HOSPITAL_LOCATION_QUERY is set. Results are filtered to that state/UT in code.
 * Optional: APIFY_HOSPITAL_MAX_PLACES_PER_SEARCH (default 40 when state is set, else 20).
 */
export const fetchApifyHospitals = internalAction({
  args: { state: v.string() },
  handler: async (_ctx, { state }) => {
    const stateTrim = state.trim();
    if (!stateTrim) {
      return [];
    }

    const apiKey =
      process.env.APIFY_API_KEY?.trim() || process.env.APIFY_TOKEN?.trim();
    if (!apiKey) {
      console.warn(
        "[hospitalsNode] APIFY_API_KEY or APIFY_TOKEN not set on Convex; returning no hospitals."
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
      let items: unknown[] = [];
      let runStatus: string | undefined;

      if (datasetId) {
        items = await apifyListDatasetItems(apiKey, datasetId, {
          clean: true,
          limit: 1000,
        });
      } else {
        const actorToRun = explicitActor || DEFAULT_MAPS_ACTOR;
        const input = buildActorInput(actorToRun, stateTrim);
        const waitSecs = Math.min(
          Math.max(
            60,
            Number.parseInt(
              process.env.APIFY_HOSPITAL_WAIT_SECS?.trim() ?? "",
              10
            ) || 180
          ),
          300
        );
        console.log("[hospitalsNode] running actor", actorToRun, {
          waitSecs,
          state: stateTrim,
          inputKeys: Object.keys(input),
        });
        const { datasetId: outDatasetId, status } = await apifyRunActorSync(
          apiKey,
          actorToRun,
          input,
          waitSecs
        );
        runStatus = status;
        items = await apifyListDatasetItems(apiKey, outDatasetId, {
          clean: true,
          limit: 1000,
        });
        if (items.length === 0) {
          console.warn(
            "[hospitalsNode] 0 dataset rows; Apify run status=",
            runStatus ?? "?",
            "— if RUNNING/TIMED-OUT, raise APIFY_HOSPITAL_WAIT_SECS (max 300) or set APIFY_HOSPITAL_DATASET_ID from a finished run."
          );
        }
      }

      console.log("[hospitalsNode] raw items", items.length);

      let mapped = items
        .map((raw, i) => mapRawApifyItemToHospital(raw, i))
        .filter((x): x is NonNullable<typeof x> => x != null);

      // Actor runs can still return out-of-area rows; keep only the chosen state/UT.
      mapped = filterHospitalsByIndianState(mapped, stateTrim);

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
