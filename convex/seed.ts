"use node";

import bcrypt from "bcryptjs";
import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

type SeedResult = { ok: boolean; code?: string; user?: unknown; counsellor?: unknown };

/**
 * One-time admin:
 * npx convex run internal/seed:seedAdmin '{"email":"admin@example.com","password":"YourSecurePassword","firstName":"Admin","lastName":"User"}'
 */
export const seedAdmin = internalAction({
  args: {
    email: v.string(),
    password: v.string(),
    firstName: v.string(),
    lastName: v.string(),
  },
  handler: async (ctx, args): Promise<SeedResult> => {
    const passwordHash = await bcrypt.hash(args.password, 10);
    return await ctx.runMutation(internal.users.createAdmin, {
      email: args.email.trim().toLowerCase(),
      passwordHash,
      firstName: args.firstName,
      lastName: args.lastName,
    });
  },
});

/**
 * One-time student:
 * npx convex run internal/seed:seedStudent '{"email":"student@example.com","password":"...","firstName":"Ada","lastName":"Student","contactNo":9876543210,"university":"Demo University","program":"B.Tech","branch":"CSE","semester":"4"}'
 */
export const seedStudent = internalAction({
  args: {
    email: v.string(),
    password: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    contactNo: v.number(),
    university: v.string(),
    program: v.string(),
    branch: v.optional(v.string()),
    semester: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<SeedResult> => {
    const passwordHash = await bcrypt.hash(args.password, 10);
    return await ctx.runMutation(internal.users.createStudent, {
      email: args.email.trim().toLowerCase(),
      passwordHash,
      firstName: args.firstName,
      lastName: args.lastName,
      contactNo: args.contactNo,
      university: args.university,
      program: args.program,
      branch: args.branch,
      semester: args.semester,
    });
  },
});

/**
 * One-time counsellor:
 * npx convex run internal/seed:seedCounsellor '{"email":"counsellor@example.com","password":"...","firstName":"Dr.","lastName":"Counsellor","contactNo":9876543211,"qualifications":"M.Phil Psychology","specialization":["Stress","Academic"],"availability":["Mon 10-12","Wed 14-16"]}'
 */
export const seedCounsellor = internalAction({
  args: {
    email: v.string(),
    password: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    contactNo: v.number(),
    qualifications: v.string(),
    specialization: v.optional(v.array(v.string())),
    availability: v.union(v.string(), v.array(v.string())),
  },
  handler: async (ctx, args): Promise<SeedResult> => {
    const passwordHash = await bcrypt.hash(args.password, 10);
    return await ctx.runMutation(internal.users.createCounsellor, {
      email: args.email.trim().toLowerCase(),
      passwordHash,
      firstName: args.firstName,
      lastName: args.lastName,
      contactNo: args.contactNo,
      qualifications: args.qualifications,
      specialization: args.specialization,
      availability: args.availability,
    });
  },
});

/**
 * Seeds one student, one counsellor, and one admin in a single run (dev/demo).
 * Uses one bcrypt hash for all three (same plaintext password).
 *
 * npx convex run internal/seed:seedDemoUsers '{"password":"YourDevPassword"}'
 *
 * Optional overrides: studentEmail, counsellorEmail, adminEmail
 */
export const seedDemoUsers = internalAction({
  args: {
    password: v.string(),
    studentEmail: v.optional(v.string()),
    counsellorEmail: v.optional(v.string()),
    adminEmail: v.optional(v.string()),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ student: SeedResult; counsellor: SeedResult; admin: SeedResult }> => {
    const passwordHash = await bcrypt.hash(args.password, 10);
    const studentEmail = (args.studentEmail ?? "student@demo.local").trim().toLowerCase();
    const counsellorEmail = (args.counsellorEmail ?? "counsellor@demo.local").trim().toLowerCase();
    const adminEmail = (args.adminEmail ?? "admin@demo.local").trim().toLowerCase();

    const student: SeedResult = await ctx.runMutation(internal.users.createStudent, {
      email: studentEmail,
      passwordHash,
      firstName: "Demo",
      lastName: "Student",
      contactNo: 9876543210,
      university: "Demo University",
      program: "B.Tech Computer Science",
      branch: "CSE",
      semester: "4",
    });

    const counsellor: SeedResult = await ctx.runMutation(internal.users.createCounsellor, {
      email: counsellorEmail,
      passwordHash,
      firstName: "Demo",
      lastName: "Counsellor",
      contactNo: 9876543211,
      qualifications: "M.Phil Clinical Psychology",
      specialization: ["Academic stress", "Career guidance"],
      availability: ["Mon 10:00–12:00", "Wed 14:00–16:00"],
    });

    const admin: SeedResult = await ctx.runMutation(internal.users.createAdmin, {
      email: adminEmail,
      passwordHash,
      firstName: "Demo",
      lastName: "Admin",
    });

    return { student, counsellor, admin };
  },
});

