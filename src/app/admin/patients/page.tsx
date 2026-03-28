"use client";

import React, { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useQuery } from "convex/react";
import { api } from "@cvx/_generated/api";
import type { Id } from "@cvx/_generated/dataModel";

/** Row shape from `adminAnalytics.listAllPatients` (not a full `Doc` — omits e.g. `language`). */
type PatientAdminRow = {
  _id: Id<"patients">;
  anonymousId: string;
  conditions: string[];
  medications: string[];
  triggers: string[];
  copingPatterns: string[];
  crisisFlag: boolean;
  totalSessions: number;
  lastSeen: number;
  lastMoodScore: number | null;
  lastEmotion: string | null;
  sessionCount: number;
};
import { Search, AlertTriangle } from "lucide-react";
const thStyle: React.CSSProperties = { textAlign: "left", padding: "10px 12px", color: "#6b7280", fontWeight: 600, fontSize: 13, borderBottom: "2px solid #e5e7eb" };
const tdStyle: React.CSSProperties = { padding: "10px 12px", borderBottom: "1px solid #f3f4f6", fontSize: 14 };
const badge = (color: string, bg: string): React.CSSProperties => ({
  display: "inline-block",
  padding: "2px 8px",
  borderRadius: 12,
  fontSize: 12,
  fontWeight: 600,
  color,
  background: bg,
});

export default function AdminPatientsPage() {
  const patients = useQuery(api.adminAnalytics.listAllPatients);
  const [search, setSearch] = useState("");

  const filtered = patients?.filter(
    (p: PatientAdminRow) =>
      p.anonymousId.toLowerCase().includes(search.toLowerCase()) ||
      p.conditions.some((c: string) => c.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <AdminLayout title="Patients - Admin" description="All patients overview">
      <div style={{ display: "grid", gap: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 style={{ margin: 0, fontSize: "1.5rem" }}>All Patients</h1>
          <div style={{ position: "relative" }}>
            <Search size={18} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
            <input
              type="text"
              placeholder="Search patients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ padding: "8px 12px 8px 36px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, width: 250 }}
            />
          </div>
        </div>

        {!filtered ? (
          <p style={{ color: "#6b7280" }}>Loading patients...</p>
        ) : filtered.length === 0 ? (
          <p style={{ color: "#9ca3af" }}>No patients found.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={thStyle}>Patient ID</th>
                  <th style={thStyle}>Conditions</th>
                  <th style={thStyle}>Last Mood</th>
                  <th style={thStyle}>Sessions</th>
                  <th style={thStyle}>Crisis</th>
                  <th style={thStyle}>Last Seen</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p: PatientAdminRow) => (
                  <tr key={p._id} style={{ cursor: "default" }}>
                    <td style={tdStyle}>
                      <span style={{ fontFamily: "monospace", fontWeight: 600 }}>{p.anonymousId.slice(0, 12)}...</span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {p.conditions.slice(0, 3).map((c: string, i: number) => (
                          <span key={i} style={badge("#4338ca", "#eef2ff")}>{c}</span>
                        ))}
                        {p.conditions.length > 3 && <span style={{ fontSize: 12, color: "#9ca3af" }}>+{p.conditions.length - 3}</span>}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      {p.lastMoodScore !== null ? (
                        <span style={{ fontWeight: 600 }}>{p.lastMoodScore}/10 {p.lastEmotion && <span style={{ fontWeight: 400, color: "#6b7280" }}>({p.lastEmotion})</span>}</span>
                      ) : (
                        <span style={{ color: "#9ca3af" }}>—</span>
                      )}
                    </td>
                    <td style={tdStyle}>{p.sessionCount}</td>
                    <td style={tdStyle}>
                      {p.crisisFlag ? (
                        <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#dc2626" }}>
                          <AlertTriangle size={14} /> Yes
                        </span>
                      ) : (
                        <span style={{ color: "#16a34a" }}>No</span>
                      )}
                    </td>
                    <td style={tdStyle}>{new Date(p.lastSeen).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
