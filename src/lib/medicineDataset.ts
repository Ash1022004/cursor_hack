import { readFile } from "fs/promises";
import path from "path";

export type MedicineEntry = {
  name: string;
  genericNames: string[];
  uses: string;
  dosage: string;
  sideEffects: string;
  precautions: string;
};

let cache: MedicineEntry[] | null = null;

export async function loadMedicines(): Promise<MedicineEntry[]> {
  if (cache) return cache;
  const file = path.join(process.cwd(), "data", "medicines.json");
  const raw = await readFile(file, "utf-8");
  const parsed = JSON.parse(raw) as MedicineEntry[];
  cache = parsed;
  return parsed;
}

export function searchMedicines(query: string, list: MedicineEntry[]): MedicineEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return list.filter((m) => {
    const pool = [m.name, ...m.genericNames].join(" ").toLowerCase();
    return pool.includes(q) || q.split(/\s+/).every((w) => w.length > 1 && pool.includes(w));
  });
}

/** Best-effort match medicine name from OCR text against dataset. */
export function matchMedicineFromText(
  ocrText: string,
  list: MedicineEntry[]
): MedicineEntry | null {
  const lower = ocrText.toLowerCase();
  let best: MedicineEntry | null = null;
  let bestLen = 0;
  for (const m of list) {
    const names = [m.name, ...m.genericNames];
    for (const n of names) {
      const nl = n.toLowerCase();
      if (nl.length < 3) continue;
      if (lower.includes(nl) && nl.length > bestLen) {
        best = m;
        bestLen = nl.length;
      }
    }
  }
  return best;
}
