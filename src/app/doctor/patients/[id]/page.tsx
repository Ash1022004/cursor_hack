"use client";

import React from "react";
import { useParams } from "next/navigation";
import DoctorLayout from "@/components/doctor/DoctorLayout";
import { useQuery } from "convex/react";
import { api } from "@cvx/_generated/api";
import MoodSparkline from "@/components/saathi/MoodSparkline";
import { AlertTriangle, Heart, Pill, Zap, Brain, FileText, Mic, Calendar } from "lucide-react";
import type { Id } from "@cvx/_generated/dataModel";

type MoodHistoryRow = {
  score: number;
  emotion: string;
  triggers: string[];
  notes: string | null;
  date: number;
};
type SessionSummaryRow = {
  id: Id<"sessions">;
  startedAt: number;
  messageCount: number;
  dominantEmotion: string | null;
  summary: string | null;
};
type CommitmentRow = {
  id: Id<"commitments">;
  text: string;
  status: string;
  detectedAt: number;
  followedUpAt: number | null;
};
type VoiceJournalRow = {
  id: Id<"voiceJournals">;
  createdAt: number;
  duration: number;
  summary: string | null;
  moodScore: number | null;
  emotion: string | null;
};
type PatientAppointmentRow = {
  id: Id<"appointments">;
  status: string;
  slot: number;
  notes: string | null;
  preferredDate: string | null;
};

const sectionCard: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 20,
};
const sectionTitle: React.CSSProperties = { margin: "0 0 12px", fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 };
const tag = (color: string, bg: string): React.CSSProperties => ({
  display: "inline-block",
  padding: "3px 10px",
  borderRadius: 12,
  fontSize: 12,
  fontWeight: 600,
  color,
  background: bg,
  margin: "2px 3px",
});
const statusColors: Record<string, { color: string; bg: string }> = {
  pending: { color: "#ca8a04", bg: "#fefce8" },
  confirmed: { color: "#2563eb", bg: "#eff6ff" },
  completed: { color: "#16a34a", bg: "#f0fdf4" },
  cancelled: { color: "#dc2626", bg: "#fef2f2" },
  followed_up: { color: "#7c3aed", bg: "#f5f3ff" },
};

export default function PatientDetailPage() {
  const params = useParams();
  const patientId = params.id as string;

  const detail = useQuery(
    api.doctorDashboard.getPatientDetail,
    patientId ? { patientId: patientId as Id<"patients"> } : "skip"
  );

  return (
    <DoctorLayout title="Patient Detail - Doctor" description="Patient forwarded data">
      {!detail ? (
        <p style={{ color: "#6b7280", padding: 20 }}>Loading patient details...</p>
      ) : (
        <div style={{ display: "grid", gap: 20 }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h1 style={{ margin: 0, fontSize: "1.5rem" }}>Patient Profile</h1>
              <span style={{ fontFamily: "monospace", color: "#6b7280", fontSize: 13 }}>{detail.profile.anonymousId}</span>
            </div>
            {detail.profile.crisisFlag && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, color: "#dc2626", fontWeight: 700, fontSize: 14 }}>
                <AlertTriangle size={16} /> CRISIS FLAG ACTIVE
              </div>
            )}
          </div>

          {/* Profile cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={sectionCard}>
              <h3 style={sectionTitle}><Heart size={16} color="#dc2626" /> Conditions</h3>
              <div>{detail.profile.conditions.length > 0 ? detail.profile.conditions.map((c: string, i: number) => <span key={i} style={tag("#b91c1c", "#fef2f2")}>{c}</span>) : <span style={{ color: "#9ca3af" }}>None recorded</span>}</div>
            </div>

            <div style={sectionCard}>
              <h3 style={sectionTitle}><Pill size={16} color="#7c3aed" /> Medications</h3>
              <div>{detail.profile.medications.length > 0 ? detail.profile.medications.map((m: string, i: number) => <span key={i} style={tag("#5b21b6", "#f5f3ff")}>{m}</span>) : <span style={{ color: "#9ca3af" }}>None recorded</span>}</div>
            </div>

            <div style={sectionCard}>
              <h3 style={sectionTitle}><Zap size={16} color="#ca8a04" /> Triggers</h3>
              <div>{detail.profile.triggers.length > 0 ? detail.profile.triggers.map((t: string, i: number) => <span key={i} style={tag("#92400e", "#fefce8")}>{t}</span>) : <span style={{ color: "#9ca3af" }}>None recorded</span>}</div>
            </div>

            <div style={sectionCard}>
              <h3 style={sectionTitle}><Brain size={16} color="#059669" /> Coping Patterns</h3>
              <div>{detail.profile.copingPatterns.length > 0 ? detail.profile.copingPatterns.map((c: string, i: number) => <span key={i} style={tag("#065f46", "#ecfdf5")}>{c}</span>) : <span style={{ color: "#9ca3af" }}>None recorded</span>}</div>
            </div>
          </div>

          {/* Mood History */}
          <div style={sectionCard}>
            <h3 style={sectionTitle}>Mood History</h3>
            {detail.moodHistory.length > 0 ? (
              <>
                <div style={{ marginBottom: 12 }}>
                  <MoodSparkline data={detail.moodHistory} />
                </div>
                <div style={{ overflowX: "auto", maxHeight: 200, overflowY: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                        <th style={{ textAlign: "left", padding: "6px 8px", color: "#6b7280" }}>Date</th>
                        <th style={{ textAlign: "left", padding: "6px 8px", color: "#6b7280" }}>Score</th>
                        <th style={{ textAlign: "left", padding: "6px 8px", color: "#6b7280" }}>Emotion</th>
                        <th style={{ textAlign: "left", padding: "6px 8px", color: "#6b7280" }}>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.moodHistory.slice(0, 10).map((m: MoodHistoryRow, i: number) => (
                        <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                          <td style={{ padding: "6px 8px" }}>{new Date(m.date).toLocaleDateString()}</td>
                          <td style={{ padding: "6px 8px", fontWeight: 600 }}>{m.score}/10</td>
                          <td style={{ padding: "6px 8px", textTransform: "capitalize" }}>{m.emotion}</td>
                          <td style={{ padding: "6px 8px", color: "#6b7280" }}>{m.notes || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <p style={{ color: "#9ca3af", fontSize: 14 }}>No mood data available.</p>
            )}
          </div>

          {/* Session Summaries */}
          <div style={sectionCard}>
            <h3 style={sectionTitle}><FileText size={16} color="#2563eb" /> Session History</h3>
            {detail.sessionSummaries.length > 0 ? (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <th style={{ textAlign: "left", padding: "6px 8px", color: "#6b7280" }}>Date</th>
                    <th style={{ textAlign: "left", padding: "6px 8px", color: "#6b7280" }}>Messages</th>
                    <th style={{ textAlign: "left", padding: "6px 8px", color: "#6b7280" }}>Emotion</th>
                    <th style={{ textAlign: "left", padding: "6px 8px", color: "#6b7280" }}>Summary</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.sessionSummaries.map((s: SessionSummaryRow) => (
                    <tr key={s.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "6px 8px" }}>{new Date(s.startedAt).toLocaleDateString()}</td>
                      <td style={{ padding: "6px 8px" }}>{s.messageCount}</td>
                      <td style={{ padding: "6px 8px", textTransform: "capitalize" }}>{s.dominantEmotion || "\u2014"}</td>
                      <td style={{ padding: "6px 8px", color: "#6b7280", maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.summary || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ color: "#9ca3af", fontSize: 14 }}>No session data available.</p>
            )}
          </div>

          {/* Commitments */}
          <div style={sectionCard}>
            <h3 style={sectionTitle}>Commitments</h3>
            {detail.commitments.length > 0 ? (
              <div style={{ display: "grid", gap: 8 }}>
                {detail.commitments.map((c: CommitmentRow) => {
                  const sc = statusColors[c.status] || statusColors.pending;
                  return (
                    <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#f9fafb", borderRadius: 8 }}>
                      <span style={{ fontSize: 14 }}>{c.text}</span>
                      <span style={{ ...tag(sc.color, sc.bg), textTransform: "capitalize" }}>{c.status.replace("_", " ")}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ color: "#9ca3af", fontSize: 14 }}>No commitments recorded.</p>
            )}
          </div>

          {/* Voice Journals */}
          {detail.voiceJournalSummaries.length > 0 && (
            <div style={sectionCard}>
              <h3 style={sectionTitle}><Mic size={16} color="#7c3aed" /> Voice Journal Summaries</h3>
              <div style={{ display: "grid", gap: 8 }}>
                {detail.voiceJournalSummaries.map((vj: VoiceJournalRow) => (
                  <div key={vj.id} style={{ padding: "8px 12px", background: "#f9fafb", borderRadius: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                      <span>{new Date(vj.createdAt).toLocaleDateString()}</span>
                      <span>{Math.round(vj.duration / 60)}min {vj.moodScore !== null && `- Mood: ${vj.moodScore}/10`}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 14, color: "#374151" }}>{vj.summary || "No summary available"}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Appointment History */}
          <div style={sectionCard}>
            <h3 style={sectionTitle}><Calendar size={16} color="#ca8a04" /> Appointment History</h3>
            {detail.appointments.length > 0 ? (
              <div style={{ display: "grid", gap: 8 }}>
                {detail.appointments.map((a: PatientAppointmentRow) => {
                  const sc = statusColors[a.status] || statusColors.pending;
                  return (
                    <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#f9fafb", borderRadius: 8 }}>
                      <span style={{ fontSize: 14 }}>{a.preferredDate || new Date(a.slot).toLocaleDateString()}</span>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        {a.notes && <span style={{ fontSize: 12, color: "#6b7280" }}>{a.notes}</span>}
                        <span style={{ ...tag(sc.color, sc.bg), textTransform: "capitalize" }}>{a.status}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ color: "#9ca3af", fontSize: 14 }}>No appointment history.</p>
            )}
          </div>
        </div>
      )}
    </DoctorLayout>
  );
}
