"use client";

import React, { useState } from "react";
import DoctorLayout from "@/components/doctor/DoctorLayout";
import { useQuery, useMutation } from "convex/react";
import { api } from "@cvx/_generated/api";
import { useAuth } from "@/context/AuthContext";
import type { Doc, Id } from "@cvx/_generated/dataModel";
import { Calendar } from "lucide-react";

const ACCENT = "#059669";
const ACCENT_LIGHT = "#ecfdf5";
const ACCENT_BORDER = "#a7f3d0";

const th: React.CSSProperties = {
  textAlign: "left",
  padding: "9px 12px",
  background: ACCENT_LIGHT,
  color: "#065f46",
  fontWeight: 700,
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};
const td: React.CSSProperties = { padding: "9px 12px", borderBottom: "1px solid #d1fae5", fontSize: 13 };

const STATUS_META: Record<string, { color: string; bg: string; border: string }> = {
  pending:   { color: "#92400e", bg: "#fef3c7", border: "#fcd34d" },
  confirmed: { color: "#065f46", bg: "#d1fae5", border: "#6ee7b7" },
  completed: { color: "#1e40af", bg: "#dbeafe", border: "#93c5fd" },
  cancelled: { color: "#991b1b", bg: "#fee2e2", border: "#fca5a5" },
};

const actionBtn = (bg: string): React.CSSProperties => ({
  padding: "4px 10px",
  borderRadius: 6,
  border: "none",
  background: bg,
  color: "#fff",
  fontSize: 11,
  fontWeight: 700,
  cursor: "pointer",
  whiteSpace: "nowrap",
});

export default function DoctorAppointmentsPage() {
  const { user } = useAuth();
  const appointments = useQuery(
    api.doctorDashboard.getMyAppointments,
    user?._id ? { counsellorId: user._id } : "skip"
  );
  const updateStatus = useMutation(api.doctorDashboard.updateAppointmentStatus);
  const [filter, setFilter] = useState<string>("all");
  const [noteInput, setNoteInput] = useState<Record<string, string>>({});

  const filtered = appointments?.filter(
    (a: Doc<"appointments">) => filter === "all" || a.status === filter
  );

  const counts = appointments
    ? {
        all: appointments.length,
        pending: appointments.filter((a: Doc<"appointments">) => a.status === "pending").length,
        confirmed: appointments.filter((a: Doc<"appointments">) => a.status === "confirmed").length,
        completed: appointments.filter((a: Doc<"appointments">) => a.status === "completed").length,
        cancelled: appointments.filter((a: Doc<"appointments">) => a.status === "cancelled").length,
      }
    : null;

  const handleStatusChange = async (
    id: string,
    status: "pending" | "confirmed" | "completed" | "cancelled"
  ) => {
    await updateStatus({
      appointmentId: id as Id<"appointments">,
      status,
      notes: noteInput[id] || undefined,
    }).catch(console.error);
  };

  return (
    <DoctorLayout title="Appointments - Doctor" description="Manage your patient appointments">
      <div style={{ display: "grid", gap: 20 }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Calendar size={20} color={ACCENT} />
          <div>
            <h1 style={{ margin: 0, fontSize: "1.3rem", color: "#064e3b" }}>My Appointments</h1>
            <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>Confirm, complete or cancel patient appointments</p>
          </div>
        </div>

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {(["all", "pending", "confirmed", "completed", "cancelled"] as const).map((s) => {
            const active = filter === s;
            return (
              <button
                key={s}
                onClick={() => setFilter(s)}
                style={{
                  padding: "6px 16px",
                  borderRadius: 8,
                  border: active ? `2px solid ${ACCENT}` : `1px solid ${ACCENT_BORDER}`,
                  background: active ? ACCENT_LIGHT : "#fff",
                  color: active ? ACCENT : "#374151",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  textTransform: "capitalize",
                }}
              >
                {s} {counts ? <span style={{ opacity: 0.7 }}>({counts[s]})</span> : ""}
              </button>
            );
          })}
        </div>

        {!filtered ? (
          <p style={{ color: "#6b7280" }}>Loading appointments...</p>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", background: "#fff", borderRadius: 12, border: `1px solid ${ACCENT_BORDER}` }}>
            <Calendar size={32} color="#d1d5db" style={{ marginBottom: 8 }} />
            <p style={{ color: "#9ca3af", margin: 0 }}>No appointments in this category.</p>
          </div>
        ) : (
          <div style={{ background: "#fff", borderRadius: 12, border: `1px solid ${ACCENT_BORDER}`, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={th}>Patient</th>
                  <th style={th}>Contact</th>
                  <th style={th}>Department</th>
                  <th style={th}>Date</th>
                  <th style={th}>Status</th>
                  <th style={th}>Notes</th>
                  <th style={th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a: Doc<"appointments">) => {
                  const sm = STATUS_META[a.status] ?? STATUS_META.pending;
                  return (
                    <tr key={a._id}>
                      <td style={{ ...td, fontWeight: 700, color: "#064e3b" }}>{a.guestName || "Anonymous"}</td>
                      <td style={{ ...td, color: "#6b7280", fontSize: 12 }}>{a.guestEmail || "—"}</td>
                      <td style={td}>{a.department || "—"}</td>
                      <td style={{ ...td, fontWeight: 600 }}>{a.preferredDate || "—"}</td>
                      <td style={td}>
                        <span style={{
                          display: "inline-block",
                          padding: "2px 10px",
                          borderRadius: 10,
                          fontSize: 11,
                          fontWeight: 700,
                          color: sm.color,
                          background: sm.bg,
                          border: `1px solid ${sm.border}`,
                          textTransform: "capitalize",
                        }}>
                          {a.status}
                        </span>
                      </td>
                      <td style={td}>
                        <input
                          type="text"
                          placeholder="Add notes..."
                          value={noteInput[a._id] ?? a.notes ?? ""}
                          onChange={(e) => setNoteInput({ ...noteInput, [a._id]: e.target.value })}
                          style={{
                            padding: "4px 8px",
                            border: `1px solid ${ACCENT_BORDER}`,
                            borderRadius: 6,
                            fontSize: 12,
                            width: 130,
                            outline: "none",
                          }}
                        />
                      </td>
                      <td style={td}>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          {a.status === "pending" && (
                            <button onClick={() => handleStatusChange(a._id, "confirmed")} style={actionBtn(ACCENT)}>
                              Confirm
                            </button>
                          )}
                          {(a.status === "pending" || a.status === "confirmed") && (
                            <button onClick={() => handleStatusChange(a._id, "completed")} style={actionBtn("#7c3aed")}>
                              Complete
                            </button>
                          )}
                          {a.status !== "cancelled" && a.status !== "completed" && (
                            <button onClick={() => handleStatusChange(a._id, "cancelled")} style={actionBtn("#dc2626")}>
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DoctorLayout>
  );
}
