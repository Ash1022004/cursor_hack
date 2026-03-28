"use client";

import React, { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useQuery, useMutation } from "convex/react";
import { api } from "@cvx/_generated/api";
import type { Doc } from "@cvx/_generated/dataModel";

type AdminAppointmentRow = Doc<"appointments"> & {
  counsellorName?: string | null;
};

type CounsellorOption = {
  _id: string;
  firstName: string;
  lastName: string;
};

const ACCENT = "#1d4ed8";
const ACCENT_LIGHT = "#eff6ff";
const ACCENT_BORDER = "#bfdbfe";

const th: React.CSSProperties = {
  textAlign: "left",
  padding: "9px 12px",
  background: ACCENT_LIGHT,
  color: "#1e40af",
  fontWeight: 700,
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};
const td: React.CSSProperties = { padding: "9px 12px", borderBottom: "1px solid #e0eaff", fontSize: 13 };

const STATUS_META: Record<string, { color: string; bg: string; border: string }> = {
  pending:   { color: "#92400e", bg: "#fef3c7", border: "#fcd34d" },
  confirmed: { color: "#1e40af", bg: "#dbeafe", border: "#93c5fd" },
  completed: { color: "#065f46", bg: "#d1fae5", border: "#6ee7b7" },
  cancelled: { color: "#991b1b", bg: "#fee2e2", border: "#fca5a5" },
};

export default function AdminAppointmentsPage() {
  const appointments = useQuery(api.adminAnalytics.listAllAppointments);
  const counsellors = useQuery(api.adminAnalytics.listCounsellorsPublic);
  const assignCounsellor = useMutation(api.guestAppointments.assignCounsellor);
  const [filter, setFilter] = useState<string>("all");

  const filtered = appointments?.filter(
    (a: AdminAppointmentRow) => filter === "all" || a.status === filter
  );

  const counts = appointments
    ? {
        all: appointments.length,
        pending: appointments.filter((a: AdminAppointmentRow) => a.status === "pending").length,
        confirmed: appointments.filter((a: AdminAppointmentRow) => a.status === "confirmed").length,
        completed: appointments.filter((a: AdminAppointmentRow) => a.status === "completed").length,
        cancelled: appointments.filter((a: AdminAppointmentRow) => a.status === "cancelled").length,
      }
    : null;

  const handleAssign = async (appointmentId: string, counsellorId: string) => {
    if (!counsellorId) return;
    await assignCounsellor({ appointmentId: appointmentId as any, counsellorId }).catch(console.error);
  };

  return (
    <AdminLayout title="Appointments - Admin" description="Manage all appointments">
      <div style={{ display: "grid", gap: 20 }}>

        {/* Header */}
        <div>
          <h1 style={{ margin: "0 0 4px", fontSize: "1.3rem", color: "#1e3a5f" }}>Appointment Management</h1>
          <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>Assign counsellors and track appointment statuses</p>
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
            <p style={{ color: "#9ca3af", margin: 0 }}>No appointments in this category.</p>
          </div>
        ) : (
          <div style={{ background: "#fff", borderRadius: 12, border: `1px solid ${ACCENT_BORDER}`, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={th}>Patient</th>
                  <th style={th}>Email</th>
                  <th style={th}>Department</th>
                  <th style={th}>Preferred Date</th>
                  <th style={th}>Status</th>
                  <th style={th}>Counsellor</th>
                  <th style={th}>Notes</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a: AdminAppointmentRow) => {
                  const sm = STATUS_META[a.status] ?? STATUS_META.pending;
                  return (
                    <tr key={a._id}>
                      <td style={{ ...td, fontWeight: 600 }}>{a.guestName || "—"}</td>
                      <td style={{ ...td, color: "#6b7280" }}>{a.guestEmail || "—"}</td>
                      <td style={td}>{a.department || "—"}</td>
                      <td style={td}>{a.preferredDate || "—"}</td>
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
                        {a.counsellorName ? (
                          <span style={{ color: ACCENT, fontWeight: 600 }}>{a.counsellorName}</span>
                        ) : (
                          <select
                            defaultValue=""
                            onChange={(e) => handleAssign(a._id, e.target.value)}
                            style={{
                              padding: "4px 8px",
                              borderRadius: 6,
                              border: `1px solid ${ACCENT_BORDER}`,
                              fontSize: 12,
                              color: ACCENT,
                              background: ACCENT_LIGHT,
                              cursor: "pointer",
                            }}
                          >
                            <option value="">Assign counsellor…</option>
                            {counsellors?.map((c: CounsellorOption) => (
                              <option key={c._id} value={c._id}>
                                {c.firstName} {c.lastName}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td style={{ ...td, color: "#6b7280", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {a.notes || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
