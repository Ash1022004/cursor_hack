/**
 * Rule-based symptom fallback (mirrors src/lib/symptomCheck.ts); used when Exa returns no results.
 */

export type SymptomRulesInput = {
  symptoms: string | string[];
  age: number;
  gender: string;
  duration: string;
};

export type SymptomRulesResult = {
  possible_conditions: string[];
  suggested_medicines: { generic: string; note: string }[];
  advice: string;
  source: "rules";
  sources: { title: string; url: string }[];
};

function normalizeSymptoms(input: string | string[]): string {
  if (Array.isArray(input)) return input.join(", ").toLowerCase();
  return String(input).toLowerCase();
}

const RULES: {
  keys: string[];
  conditions: string[];
  generics: { generic: string; note: string }[];
  advice: string;
}[] = [
  {
    keys: ["fever", "temperature", "chills"],
    conditions: ["Viral fever", "Common cold / flu-like illness"],
    generics: [
      {
        generic: "Paracetamol (acetaminophen)",
        note: "OTC antipyretic; use only as per label and if not contraindicated.",
      },
    ],
    advice:
      "Rest, fluids, and monitor temperature. Seek urgent care for high fever, confusion, stiff neck, or breathing difficulty.",
  },
  {
    keys: ["cough", "dry cough", "wet cough", "phlegm"],
    conditions: ["Upper respiratory tract infection", "Allergic/post-viral cough"],
    generics: [
      {
        generic: "Honey (for adults) / warm fluids",
        note: "Supportive care; avoid honey in infants under 1 year.",
      },
    ],
    advice:
      "Hydration and humidified air may help. See a clinician if cough persists beyond 2–3 weeks, you cough blood, or have fever with shortness of breath.",
  },
  {
    keys: ["headache", "migraine", "head pain"],
    conditions: [
      "Tension headache",
      "Migraine (possible)",
      "Dehydration-related headache",
    ],
    generics: [
      {
        generic: "Paracetamol (acetaminophen)",
        note: "Use lowest effective dose; avoid if liver disease unless advised.",
      },
      {
        generic: "Ibuprofen (NSAID)",
        note: "Take with food; avoid if kidney disease, ulcers, or bleeding risk unless advised.",
      },
    ],
    advice:
      "Rest in a dark room, hydrate. Seek emergency care for sudden severe headache, neurological symptoms, fever with stiff neck, or head injury.",
  },
  {
    keys: ["sore throat", "throat pain", "painful swallowing"],
    conditions: [
      "Pharyngitis (viral or bacterial possible)",
      "Tonsillitis (possible)",
    ],
    generics: [
      {
        generic: "Paracetamol (acetaminophen)",
        note: "For pain relief; throat lozenges may help.",
      },
    ],
    advice:
      "Salt-water gargles and warm fluids. See a clinician if severe pain, drooling, difficulty breathing, or rash with fever.",
  },
  {
    keys: ["nausea", "vomiting", "throwing up"],
    conditions: [
      "Gastroenteritis (possible)",
      "Food intolerance / medication side effect",
    ],
    generics: [
      {
        generic: "Oral rehydration salts (ORS)",
        note: "Replace fluids and electrolytes; avoid dehydration.",
      },
    ],
    advice:
      "Small frequent sips of clear fluids. Seek care if persistent vomiting, blood in vomit, severe abdominal pain, or signs of dehydration.",
  },
  {
    keys: ["diarrhea", "loose stools", "diarrhoea"],
    conditions: ["Acute gastroenteritis (possible)", "Foodborne illness"],
    generics: [
      {
        generic: "Oral rehydration salts (ORS)",
        note: "Priority is hydration; consider zinc supplements for children per local guidance.",
      },
    ],
    advice:
      "Bland diet as tolerated. Seek care if fever, blood in stool, severe pain, or dehydration signs.",
  },
  {
    keys: ["chest pain", "crushing chest", "pressure chest"],
    conditions: ["Requires urgent evaluation — not self-diagnosed"],
    generics: [],
    advice:
      "Chest pain can be serious. Call emergency services or go to the nearest emergency department if pain is severe, new, radiates, or with shortness of breath.",
  },
  {
    keys: [
      "shortness of breath",
      "breathless",
      "breathing difficulty",
      "can't breathe",
    ],
    conditions: ["Requires urgent evaluation — many causes"],
    generics: [],
    advice:
      "Breathing difficulty warrants prompt medical assessment. Seek emergency care if severe or worsening.",
  },
  {
    keys: ["rash", "hives", "itching", "skin rash"],
    conditions: [
      "Allergic reaction (possible)",
      "Dermatitis / viral exanthem (possible)",
    ],
    generics: [
      {
        generic: "Cetirizine (non-sedating antihistamine)",
        note: "OTC antihistamine; avoid driving if drowsy; consult if pregnant or on other meds.",
      },
    ],
    advice:
      "Avoid suspected triggers. Seek urgent care for lip/tongue swelling, breathing difficulty, or widespread blistering rash.",
  },
  {
    keys: ["back pain", "lower back pain", "lumbar pain"],
    conditions: ["Mechanical low back pain", "Muscle strain (possible)"],
    generics: [
      {
        generic: "Paracetamol (acetaminophen) or NSAID (if suitable)",
        note: "Short duration; use heat packs and gentle movement.",
      },
    ],
    advice:
      "Avoid heavy lifting; gentle mobility. Seek care for numbness, weakness, bowel/bladder changes, fever, or trauma.",
  },
];

export function ruleBasedSymptomCheck(input: SymptomRulesInput): SymptomRulesResult {
  const text = normalizeSymptoms(input.symptoms);
  const matched: typeof RULES = [];
  for (const rule of RULES) {
    if (rule.keys.some((k) => text.includes(k))) matched.push(rule);
  }

  const conditions = new Set<string>();
  const generics: { generic: string; note: string }[] = [];
  const adviceParts: string[] = [];

  if (matched.length === 0) {
    return {
      possible_conditions: [
        "Non-specific symptoms — insufficient pattern for a specific condition",
      ],
      suggested_medicines: [
        {
          generic: "No specific OTC recommendation suggested",
          note: "Please consult a qualified clinician for diagnosis and treatment.",
        },
      ],
      advice:
        "Keep a symptom diary and seek in-person evaluation if symptoms worsen, persist, or are severe.",
      source: "rules",
      sources: [],
    };
  }

  for (const m of matched) {
    m.conditions.forEach((c) => conditions.add(c));
    m.generics.forEach((g) => {
      if (!generics.some((x) => x.generic === g.generic)) generics.push(g);
    });
    adviceParts.push(m.advice);
  }

  return {
    possible_conditions: [...conditions],
    suggested_medicines: generics.slice(0, 6),
    advice: [...new Set(adviceParts)].join(" "),
    source: "rules",
    sources: [],
  };
}
