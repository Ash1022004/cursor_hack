"use client";

import React, { useState } from "react";
import DoctorLayout from "@/components/doctor/DoctorLayout";
import { useQuery, useMutation } from "convex/react";
import { api } from "@cvx/_generated/api";
import { useAuth } from "@/context/AuthContext";
import type { Doc, Id } from "@cvx/_generated/dataModel";

const thStyle: React.CSSProperties = { textAlign: "left", padding: "10px 12px", color: "#6b7280", fontWeight: 600, fontSize: 13, borderBottom: "2px solid #e5e7eb" };
const tdStyle: React.CSSProperties = { padding: "10px 12px", borderBottom: "1px solid #f3f4f6", fontSize: 14 };
const statusColors: Record<string, { color: string; bg: string }> = {
  pending: { color: "#ca8a04", bg: "#fefce8" },
  confirmed: { color: "#2563eb", bg: "#eff6ff" },
  completed: { color: "#16a34a", bg: "#f0fdf4" },
  cancelled: { color: "#dc2626", bg: "#fef2f2" },
};
const btnStyle = (bg: string): React.CSSProperties => ({
  padding: "4px 10px",
  borderRadius: 6,
  border: "none",
  background: bg,
  color: "#fff",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
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

  const handleStatusChange = async (id: string, status: "pending" | "confirmed" | "completed" | "cancelled") => {
    try {
      await updateStatus({
        appointmentId: id as Id<"appointments">,
        status,
        notes: noteInput[id] || undefined,
      });
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  return (
    <DoctorLayout title="Appointments - Doctor" description="Manage your appointments">
      <div style={{ display: "grid", gap: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 style={{ margin: 0, fontSize: "1.5rem" }}>My Appointments</h1>
          <div style={{ display: "flex", gap: 8 }}>
            {["all", "pending", "confirmed", "completed", "cancelled"].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 8,
                  border: filter === s ? "2px solid #059669" : "1px solid #d1d5db",
                  background: filter === s ? "#ecfdf5" : "#fff",
                  color: filter === s ? "#059669" : "#374151",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  textTransform: "capitalize",
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {!filtered ? (
          <p style={{ color: "#6b7280" }}>Loading appointments...</p>
        ) : filtered.length === 0 ? (
          <p style={{ color: "#9ca3af" }}>No appointments found.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={thStyle}>Patient</th>
                  <th style={thStyle}>Email</th>
                  <th style={thStyle}>Department</th>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Notes</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a: Doc<"appointments">) => {
                  const sc = statusColors[a.status] || statusColors.pending;
                  return (
                    <tr key={a._id}>
                      <td style={tdStyle}>{a.guestName || "Anonymous"}</td>
                      <td style={tdStyle}>{a.guestEmail || "—"}</td>
                      <td style={tdStyle}>{a.department || "—"}</td>
                      <td style={tdStyle}>{a.preferredDate || "—"}</td>
                      <td style={tdStyle}>
                        <span style={{
                          display: "inline-block",
                          padding: "2px 10px",
                          borderRadius: 12,
                          fontSize: 12,
                          fontWeight: 600,
                          color: sc.color,
                          background: sc.bg,
                          textTransform: "capitalize",
                        }}>
                          {a.status}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <input
                          type="text"
                          placeholder="Add notes..."
                          value={noteInput[a._id] ?? a.notes ?? ""}
                          onChange={(e) => setNoteInput({ ...noteInput, [a._id]: e.target.value })}
                          style={{ padding: "3px 8px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 12, width: 120 }}
                        />
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          {a.status === "pending" && (
                            <button onClick={() => handleStatusChange(a._id, "confirmed")} style={btnStyle("#2563eb")}>
                              Confirm
                            </button>
                          )}
                          {(a.status === "pending" || a.status === "confirmed") && (
                            <button onClick={() => handleStatusChange(a._id, "completed")} style={btnStyle("#16a34a")}>
                              Complete
                            </button>
                          )}
                          {a.status !== "cancelled" && a.status !== "completed" && (
                            <button onClick={() => handleStatusChange(a._id, "cancelled")} style={btnStyle("#dc2626")}>
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
