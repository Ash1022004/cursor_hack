import { v } from "convex/values";
import { internalAction } from "./_generated/server";

const SPECIALTIES = [
  "General Physician",
  "Cardiology",
  "Orthopedics",
  "Pediatrics",
  "ENT",
  "Dermatology",
  "Gynecology",
  "Neurology",
];

const FIRST = ["Anita", "Rahul", "Priya", "Vikram", "Sneha", "Arjun", "Kavita", "Rohan"];
const LAST = ["Sharma", "Patel", "Singh", "Iyer", "Reddy", "Kapoor", "Menon", "Desai"];

/**
 * Demo doctors per hospital (deterministic from hospitalId). Replace with a real provider later.
 */
export const doctorsForHospital = internalAction({
  args: {
    hospitalId: v.string(),
    hospitalName: v.optional(v.string()),
    specialtyHint: v.optional(v.string()),
  },
  handler: async (_ctx, { hospitalId, hospitalName, specialtyHint }) => {
    void hospitalName;
    let h = 0;
    for (let i = 0; i < hospitalId.length; i++) {
      h = (h * 31 + hospitalId.charCodeAt(i)) | 0;
    }
    const n = Math.abs(h);
    const count = 5;
    const out: {
      id: string;
      name: string;
      specialty: string;
      department: string;
    }[] = [];

    for (let i = 0; i < count; i++) {
      const fi = (n + i * 7) % FIRST.length;
      const li = (n + i * 11) % LAST.length;
      const si = (n + i * 13) % SPECIALTIES.length;
      out.push({
        id: `${hospitalId}-doc-${i}`,
        name: `Dr. ${FIRST[fi]} ${LAST[li]}`,
        specialty: SPECIALTIES[si],
        department: specialtyHint?.trim() || "Outpatient",
      });
    }

    return out;
  },
});
