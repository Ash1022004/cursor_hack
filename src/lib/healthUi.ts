/** UI-only severity for symptom guidance (not clinical). */
export type ConditionSeverity = "low" | "moderate" | "high";

export function severityForCondition(
  name: string,
  advice: string,
  index: number
): ConditionSeverity {
  const blob = `${name} ${advice}`.toLowerCase();
  if (
    /\burgent|emergency|immediately|911|112|severe|stroke|heart attack|meningitis|appendicitis\b/.test(
      blob
    )
  ) {
    return "high";
  }
  if (
    /\bsee a clinician|doctor|if persists|worsens|monitor closely|possible\b/.test(blob) &&
    index === 0
  ) {
    return "moderate";
  }
  if (index === 0 && /pain|fever|infection|possible/i.test(name)) return "moderate";
  return "low";
}

const COMMON_OTC = [
  "paracetamol",
  "acetaminophen",
  "ibuprofen",
  "aspirin",
  "cetirizine",
  "loratadine",
  "ORS",
  "ors",
  "oral rehydration",
];

export function medicineTags(medicineName: string): { key: string; label: string }[] {
  const lower = medicineName.toLowerCase();
  const isCommon = COMMON_OTC.some((k) => lower.includes(k));
  const tags: { key: string; label: string }[] = [];
  if (isCommon) {
    tags.push({ key: "safe", label: "Safe" }, { key: "common", label: "Common" });
  }
  tags.push({ key: "consult", label: "Consult doctor" });
  return tags;
}

export const MEDICINE_SUGGESTIONS = [
  "Paracetamol",
  "Ibuprofen",
  "Cetirizine",
  "Omeprazole",
  "Amoxicillin",
  "Azithromycin",
  "Metformin",
];
