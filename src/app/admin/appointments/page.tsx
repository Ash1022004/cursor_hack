"use client";

import React, { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useQuery, useMutation } from "convex/react";
import { api } from "@cvx/_generated/api";
import type { Doc, Id } from "@cvx/_generated/dataModel";

type AppointmentAdminRow = Doc<"appointments"> & { counsellorName: string | null };
type CounsellorOption = { _id: Id<"users">; firstName: string; lastName: string };

const thStyle: React.CSSProperties = { textAlign: "left", padding: "10px 12px", color: "#6b7280", fontWeight: 600, fontSize: 13, borderBottom: "2px solid #e5e7eb" };
const tdStyle: React.CSSProperties = { padding: "10px 12px", borderBottom: "1px solid #f3f4f6", fontSize: 14 };
const statusColors: Record<string, { color: string; bg: string }> = {
  pending: { color: "#ca8a04", bg: "#fefce8" },
  confirmed: { color: "#2563eb", bg: "#eff6ff" },
  completed: { color: "#16a34a", bg: "#f0fdf4" },
  cancelled: { color: "#dc2626", bg: "#fef2f2" },
};

export default function AdminAppointmentsPage() {
  const appointments = useQuery(api.adminAnalytics.listAllAppointments);
  const counsellors = useQuery(api.adminAnalytics.listCounsellorsPublic);
  const assignCounsellor = useMutation(api.guestAppointments.assignCounsellor);
  const [filter, setFilter] = useState<string>("all");

  const filtered = appointments?.filter(
    (a: AppointmentAdminRow) => filter === "all" || a.status === filter
  );

  const handleAssign = async (appointmentId: Id<"appointments">, counsellorId: string) => {
    try {
      await assignCounsellor({ appointmentId, counsellorId });
    } catch (err) {
      console.error("Failed to assign counsellor:", err);
    }
  };

  return (
    <AdminLayout title="Appointments - Admin" description="Manage all appointments">
      <div style={{ display: "grid", gap: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 style={{ margin: 0, fontSize: "1.5rem" }}>All Appointments</h1>
          <div style={{ display: "flex", gap: 8 }}>
            {["all", "pending", "confirmed", "completed", "cancelled"].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 8,
                  border: filter === s ? "2px solid #2563eb" : "1px solid #d1d5db",
                  background: filter === s ? "#eff6ff" : "#fff",
                  color: filter === s ? "#2563eb" : "#374151",
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
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>Email</th>
                  <th style={thStyle}>Department</th>
                  <th style={thStyle}>Preferred Date</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Assigned Counsellor</th>
                  <th style={thStyle}>Notes</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a: AppointmentAdminRow) => {
                  const sc = statusColors[a.status] || statusColors.pending;
                  return (
                    <tr key={a._id}>
                      <td style={tdStyle}>{a.guestName || "—"}</td>
                      <td style={tdStyle}>{a.guestEmail || "—"}</td>
                      <td style={tdStyle}>{a.department || "—"}</td>
                      <td style={tdStyle}>{a.preferredDate || "—"}</td>
                      <td style={tdStyle}>
                        <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 12, fontSize: 12, fontWeight: 600, color: sc.color, background: sc.bg, textTransform: "capitalize" }}>
                          {a.status}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        {a.counsellorName ? (
                          <span>{a.counsellorName}</span>
                        ) : (
                          <select
                            defaultValue=""
                            onChange={(e) => {
                              if (e.target.value) handleAssign(a._id, e.target.value as string);
                            }}
                            style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 13 }}
                          >
                            <option value="">Assign...</option>
                            {counsellors?.map((c: CounsellorOption) => (
                              <option key={c._id} value={c._id}>
                                {c.firstName} {c.lastName}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td style={tdStyle}>{a.notes || "—"}</td>
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
