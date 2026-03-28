import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    passwordHash: v.string(),
    role: v.union(
      v.literal("student"),
      v.literal("counsellor"),
      v.literal("admin")
    ),
    firstName: v.string(),
    lastName: v.string(),
    contactNo: v.optional(v.number()),
    university: v.optional(v.string()),
    program: v.optional(v.string()),
    branch: v.optional(v.string()),
    semester: v.optional(v.string()),
    qualifications: v.optional(v.string()),
    specialization: v.optional(v.array(v.string())),
    availability: v.optional(v.union(v.string(), v.array(v.string()))),
  }).index("by_email", ["email"]),

  stickyNotes: defineTable({
    userId: v.id("users"),
    content: v.string(),
    color: v.string(),
    position: v.object({ x: v.number(), y: v.number() }),
    size: v.object({ width: v.number(), height: v.number() }),
    zIndex: v.number(),
    isVisible: v.boolean(),
  }).index("by_user", ["userId"]),

  patients: defineTable({
    anonymousId: v.string(),
    age: v.optional(v.number()),
    conditions: v.array(v.string()),
    medications: v.array(v.string()),
    triggers: v.array(v.string()),
    copingPatterns: v.array(v.string()),
    phqScore: v.optional(v.number()),
    gadScore: v.optional(v.number()),
    crisisFlag: v.boolean(),
    totalSessions: v.number(),
    lastSeen: v.number(),
    language: v.string(),
    institution: v.optional(v.string()),
  }).index("by_anonymousId", ["anonymousId"]),

  sessions: defineTable({
    patientId: v.id("patients"),
    messages: v.array(
      v.object({
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
        agentUsed: v.optional(v.string()),
        timestamp: v.number(),
      })
    ),
    summary: v.optional(v.string()),
    dominantEmotion: v.optional(v.string()),
    startedAt: v.number(),
    endedAt: v.optional(v.number()),
  }).index("by_patientId", ["patientId"]),

  moodLogs: defineTable({
    patientId: v.id("patients"),
    score: v.number(),
    emotion: v.string(),
    triggers: v.array(v.string()),
    notes: v.optional(v.string()),
    date: v.number(),
  }).index("by_patientId", ["patientId"]),

  appointments: defineTable({
    patientId: v.optional(v.id("patients")),
    guestName: v.optional(v.string()),
    guestEmail: v.optional(v.string()),
    guestPhone: v.optional(v.string()),
    department: v.optional(v.string()),
    preferredDate: v.optional(v.string()),
    counsellorId: v.string(),
    slot: v.number(),
    aiSummary: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    notes: v.optional(v.string()),
  })
    .index("by_patientId", ["patientId"])
    .index("by_counsellorId", ["counsellorId"]),

  helplines: defineTable({
    name: v.string(),
    number: v.string(),
    region: v.string(),
    type: v.string(),
    available: v.string(),
    language: v.array(v.string()),
  }).index("by_region", ["region"]),

  counsellors: defineTable({
    clerkUserId: v.string(),
    email: v.optional(v.string()),
    name: v.string(),
    specialization: v.array(v.string()),
    institution: v.string(),
    available: v.boolean(),
  }).index("by_clerkUserId", ["clerkUserId"]),

  resources: defineTable({
    topic: v.string(),
    title: v.string(),
    url: v.string(),
    snippet: v.string(),
    source: v.string(),
    language: v.string(),
    tags: v.array(v.string()),
    fetchedAt: v.number(),
  })
    .index("by_topic", ["topic"])
    .index("by_url", ["url"]),

  voiceJournals: defineTable({
    patientId: v.id("patients"),
    storageId: v.id("_storage"),
    transcription: v.optional(v.string()),
    summary: v.optional(v.string()),
    moodScore: v.optional(v.number()),
    emotion: v.optional(v.string()),
    duration: v.number(),
    createdAt: v.number(),
  }).index("by_patientId", ["patientId"]),

  commitments: defineTable({
    patientId: v.id("patients"),
    text: v.string(),
    detectedAt: v.number(),
    followedUpAt: v.optional(v.number()),
    status: v.string(), // "pending" | "followed_up" | "completed"
  }).index("by_patientId", ["patientId"]),

  /** Curated medicine monographs (Apify/seed); hybrid lookup with Exa fallback. */
  medicines: defineTable({
    name: v.string(),
    nameNormalized: v.string(),
    genericNames: v.array(v.string()),
    uses: v.string(),
    dosage: v.string(),
    sideEffects: v.string(),
    precautions: v.string(),
    source: v.optional(v.string()),
    updatedAt: v.number(),
    searchBlob: v.string(),
  })
    .index("by_name_normalized", ["nameNormalized"])
    .searchIndex("search_medicine", {
      searchField: "searchBlob",
    }),
});
