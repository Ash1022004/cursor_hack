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
    patientId: v.id("patients"),
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
});
