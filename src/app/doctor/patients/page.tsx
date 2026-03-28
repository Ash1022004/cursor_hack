"use client";

import React, { useState } from "react";
import Link from "next/link";
import DoctorLayout from "@/components/doctor/DoctorLayout";
import { useQuery } from "convex/react";
import { api } from "@cvx/_generated/api";
import type { Id } from "@cvx/_generated/dataModel";

/** Row shape from `doctorDashboard.getMyPatients`. */
type DoctorPatientRow = {
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
import { useAuth } from "@/context/AuthContext";
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

export default function DoctorPatientsPage() {
  const { user } = useAuth();
  const patients = useQuery(
    api.doctorDashboard.getMyPatients,
    user?._id ? { counsellorId: user._id } : "skip"
  );
  const [search, setSearch] = useState("");

  const filtered = patients?.filter(
    (p: DoctorPatientRow) =>
      p.anonymousId.toLowerCase().includes(search.toLowerCase()) ||
      p.conditions.some((c: string) => c.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <DoctorLayout title="My Patients - Doctor" description="Your assigned patients">
      <div style={{ display: "grid", gap: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 style={{ margin: 0, fontSize: "1.5rem" }}>My Patients</h1>
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
          <p style={{ color: "#9ca3af" }}>No patients assigned yet. Patients will appear here once appointments are assigned to you.</p>
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
                  <th style={thStyle}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p: DoctorPatientRow) => (
                  <tr key={p._id}>
                    <td style={tdStyle}>
                      <span style={{ fontFamily: "monospace", fontWeight: 600 }}>{p.anonymousId.slice(0, 12)}...</span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {p.conditions.slice(0, 3).map((c: string, i: number) => (
                          <span key={i} style={badge("#4338ca", "#eef2ff")}>{c}</span>
                        ))}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      {p.lastMoodScore !== null ? (
                        <span style={{ fontWeight: 600 }}>{p.lastMoodScore}/10</span>
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
                    <td style={tdStyle}>
                      <Link
                        href={`/doctor/patients/${p._id}`}
                        style={{ padding: "4px 12px", background: "#2563eb", color: "#fff", borderRadius: 6, textDecoration: "none", fontSize: 12, fontWeight: 600 }}
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DoctorLayout>
  );
}
