import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const getMyAppointments = query({
  args: { counsellorId: v.string() },
  handler: async (ctx, { counsellorId }) => {
    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_counsellorId", (q) => q.eq("counsellorId", counsellorId))
      .order("desc")
      .take(100);
    return appointments;
  },
});

export const getMyPatients = query({
  args: { counsellorId: v.string() },
  handler: async (ctx, { counsellorId }) => {
    // Get appointments for this counsellor
    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_counsellorId", (q) => q.eq("counsellorId", counsellorId))
      .collect();

    // Get unique patient IDs from appointments that have patientId
    const patientIds = [...new Set(appointments.filter((a) => a.patientId).map((a) => a.patientId!))];

    // Also match by guest email → patient anonymousId
    const guestEmails = [...new Set(appointments.filter((a) => a.guestEmail).map((a) => a.guestEmail!))];

    const allPatients = await ctx.db.query("patients").collect();

    // Find patients linked by ID or by email matching anonymousId
    const matchedPatients = allPatients.filter(
      (p) => patientIds.includes(p._id) || guestEmails.some((e) => p.anonymousId.includes(e))
    );

    const results = [];
    for (const patient of matchedPatients) {
      const moods = await ctx.db
        .query("moodLogs")
        .withIndex("by_patientId", (q) => q.eq("patientId", patient._id))
        .order("desc")
        .take(1);

      const sessionCount = (
        await ctx.db
          .query("sessions")
          .withIndex("by_patientId", (q) => q.eq("patientId", patient._id))
          .collect()
      ).length;

      results.push({
        _id: patient._id,
        anonymousId: patient.anonymousId,
        conditions: patient.conditions,
        medications: patient.medications,
        triggers: patient.triggers,
        copingPatterns: patient.copingPatterns,
        crisisFlag: patient.crisisFlag,
        totalSessions: patient.totalSessions,
        lastSeen: patient.lastSeen,
        lastMoodScore: moods[0]?.score ?? null,
        lastEmotion: moods[0]?.emotion ?? null,
        sessionCount,
      });
    }
    return results;
  },
});

export const getPatientDetail = query({
  args: { patientId: v.id("patients") },
  handler: async (ctx, { patientId }) => {
    const patient = await ctx.db.get(patientId);
    if (!patient) return null;

    // Mood history (last 30)
    const moodHistory = await ctx.db
      .query("moodLogs")
      .withIndex("by_patientId", (q) => q.eq("patientId", patientId))
      .order("desc")
      .take(30);

    // Session summaries (NOT raw messages)
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_patientId", (q) => q.eq("patientId", patientId))
      .order("desc")
      .take(20);

    const sessionSummaries = sessions.map((s) => ({
      id: s._id,
      startedAt: s.startedAt,
      endedAt: s.endedAt ?? null,
      messageCount: s.messages.length,
      dominantEmotion: s.dominantEmotion ?? null,
      summary: s.summary ?? null,
    }));

    // Commitments
    const commitments = await ctx.db
      .query("commitments")
      .withIndex("by_patientId", (q) => q.eq("patientId", patientId))
      .order("desc")
      .take(20);

    // Voice journals
    const voiceJournals = await ctx.db
      .query("voiceJournals")
      .withIndex("by_patientId", (q) => q.eq("patientId", patientId))
      .order("desc")
      .take(10);

    const voiceJournalSummaries = voiceJournals.map((vj) => ({
      id: vj._id,
      createdAt: vj.createdAt,
      duration: vj.duration,
      summary: vj.summary ?? null,
      moodScore: vj.moodScore ?? null,
      emotion: vj.emotion ?? null,
    }));

    // Appointment history
    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_patientId", (q) => q.eq("patientId", patientId))
      .order("desc")
      .take(20);

    return {
      profile: {
        anonymousId: patient.anonymousId,
        age: patient.age ?? null,
        conditions: patient.conditions,
        medications: patient.medications,
        triggers: patient.triggers,
        copingPatterns: patient.copingPatterns,
        crisisFlag: patient.crisisFlag,
        totalSessions: patient.totalSessions,
        lastSeen: patient.lastSeen,
        language: patient.language,
        institution: patient.institution ?? null,
      },
      moodHistory: moodHistory.map((m) => ({
        score: m.score,
        emotion: m.emotion,
        triggers: m.triggers,
        notes: m.notes ?? null,
        date: m.date,
      })),
      sessionSummaries,
      commitments: commitments.map((c) => ({
        id: c._id,
        text: c.text,
        status: c.status,
        detectedAt: c.detectedAt,
        followedUpAt: c.followedUpAt ?? null,
      })),
      voiceJournalSummaries,
      appointments: appointments.map((a) => ({
        id: a._id,
        status: a.status,
        slot: a.slot,
        notes: a.notes ?? null,
        preferredDate: a.preferredDate ?? null,
      })),
    };
  },
});

export const getDoctorOverview = query({
  args: { counsellorId: v.string() },
  handler: async (ctx, { counsellorId }) => {
    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_counsellorId", (q) => q.eq("counsellorId", counsellorId))
      .collect();

    const pending = appointments.filter((a) => a.status === "pending").length;
    const confirmed = appointments.filter((a) => a.status === "confirmed").length;
    const completed = appointments.filter((a) => a.status === "completed").length;

    // Count unique patients
    const patientIds = new Set(appointments.filter((a) => a.patientId).map((a) => a.patientId!));
    const guestEmails = new Set(appointments.filter((a) => a.guestEmail).map((a) => a.guestEmail!));

    // Check for crisis flags among linked patients
    let crisisCount = 0;
    for (const pid of patientIds) {
      const p = await ctx.db.get(pid);
      if (p?.crisisFlag) crisisCount++;
    }

    // Upcoming appointments (pending or confirmed)
    const upcoming = appointments
      .filter((a) => a.status === "pending" || a.status === "confirmed")
      .sort((a, b) => {
        const da = a.preferredDate || "";
        const db = b.preferredDate || "";
        return da.localeCompare(db);
      })
      .slice(0, 5);

    return {
      totalPatients: patientIds.size + guestEmails.size,
      pendingAppointments: pending,
      confirmedAppointments: confirmed,
      completedAppointments: completed,
      crisisCount,
      upcomingAppointments: upcoming.map((a) => ({
        id: a._id,
        guestName: a.guestName ?? null,
        guestEmail: a.guestEmail ?? null,
        preferredDate: a.preferredDate ?? null,
        status: a.status,
        department: a.department ?? null,
      })),
    };
  },
});

export const updateAppointmentStatus = mutation({
  args: {
    appointmentId: v.id("appointments"),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { appointmentId, status, notes }) => {
    const patch: Record<string, unknown> = { status };
    if (notes !== undefined) patch.notes = notes;
    await ctx.db.patch(appointmentId, patch);
    return { ok: true };
  },
});
