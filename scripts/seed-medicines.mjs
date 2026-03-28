#!/usr/bin/env node
/**
 * Loads data/medicines.json and upserts into Convex `medicines` table.
 * Requires: npx convex dev (or linked project), CONVEX_DEPLOY_KEY or logged-in CLI.
 *
 * Usage: node scripts/seed-medicines.mjs
 *    or: npm run convex:seed-medicines
 */

import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const raw = readFileSync(join(root, "data", "medicines.json"), "utf8");
const items = JSON.parse(raw);
if (!Array.isArray(items)) {
  console.error("medicines.json must be a JSON array");
  process.exit(1);
}

const payload = JSON.stringify({ items });
const r = spawnSync("npx", ["convex", "run", "internal/medicinesDb:seedBatch", payload], {
  cwd: root,
  stdio: "inherit",
  shell: false,
});
process.exit(r.status ?? 1);
