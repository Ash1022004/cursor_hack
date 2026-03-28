import { v } from "convex/values";
import { query } from "./_generated/server";

export const getAdminOverview = query({
  args: {},
  handler: async (ctx) => {
    const patients = await ctx.db.query("patients").collect();
    const sessions = await ctx.db.query("sessions").collect();
    const appointments = await ctx.db.query("appointments").collect();
    const moodLogs = await ctx.db.query("moodLogs").order("desc").take(100);

    const crisisCount = patients.filter((p) => p.crisisFlag).length;

    const pendingAppointments = appointments.filter((a) => a.status === "pending").length;
    const confirmedAppointments = appointments.filter((a) => a.status === "confirmed").length;
    const completedAppointments = appointments.filter((a) => a.status === "completed").length;
    const cancelledAppointments = appointments.filter((a) => a.status === "cancelled").length;

    const avgMood =
      moodLogs.length > 0
        ? Math.round((moodLogs.reduce((s, m) => s + m.score, 0) / moodLogs.length) * 10) / 10
        : null;

    const recentSessions = sessions
      .sort((a, b) => b.startedAt - a.startedAt)
      .slice(0, 10)
      .map((s) => ({
        id: s._id,
        patientId: s.patientId,
        startedAt: s.startedAt,
        messageCount: s.messages.length,
        dominantEmotion: s.dominantEmotion ?? null,
      }));

    return {
      totalPatients: patients.length,
      totalSessions: sessions.length,
      totalAppointments: appointments.length,
      crisisCount,
      avgMood,
      appointmentBreakdown: {
        pending: pendingAppointments,
        confirmed: confirmedAppointments,
        completed: completedAppointments,
        cancelled: cancelledAppointments,
      },
      recentSessions,
    };
  },
});

export const listAllPatients = query({
  args: {},
  handler: async (ctx) => {
    const patients = await ctx.db.query("patients").collect();
    const results = [];
    for (const patient of patients) {
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

export const listAllAppointments = query({
  args: {},
  handler: async (ctx) => {
    const appointments = await ctx.db
      .query("appointments")
      .order("desc")
      .take(200);

    // Fetch counsellor names for assigned appointments
    const counsellorIds = [...new Set(appointments.map((a) => a.counsellorId).filter(Boolean))];
    const counsellorMap: Record<string, string> = {};
    for (const cId of counsellorIds) {
      if (!cId) continue;
      try {
        const user = await ctx.db.get(cId as any);
        if (user && "firstName" in user) {
          counsellorMap[cId] = `${(user as any).firstName} ${(user as any).lastName}`;
        }
      } catch {
        // counsellorId might not be a valid ID
      }
    }

    return appointments.map((a) => ({
      ...a,
      counsellorName: a.counsellorId ? counsellorMap[a.counsellorId] ?? null : null,
    }));
  },
});

export const listCounsellorsPublic = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("users").collect();
    return all
      .filter((u) => u.role === "counsellor")
      .map((u) => ({
        _id: u._id,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        specialization: u.specialization ?? [],
        availability: u.availability ?? "",
      }));
  },
});
