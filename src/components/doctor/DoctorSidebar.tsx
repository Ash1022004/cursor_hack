import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Stethoscope, Home, Users, Calendar } from "lucide-react";

const itemStyle: React.CSSProperties = { display: "flex", gap: 10, alignItems: "center", padding: "10px 12px", borderRadius: 8, color: "#0f172a", textDecoration: "none" };
const activeStyle: React.CSSProperties = { background: "#ecfdf5", color: "#059669" };

const DoctorSidebar: React.FC = () => {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href;

  return (
    <aside style={{ width: 260, padding: 16, borderRight: "1px solid #eaeef2", background: "#ffffff", borderRadius: 12, height: "fit-content", position: "sticky", top: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <Stethoscope size={18} />
        <strong>Doctor Panel</strong>
      </div>
      <nav style={{ display: "grid", gap: 6 }}>
        <Link href="/doctor" style={{ ...itemStyle, ...(isActive("/doctor") ? activeStyle : {}) }}>
          <Home size={16} /> Dashboard
        </Link>
        <Link href="/doctor/patients" style={{ ...itemStyle, ...(isActive("/doctor/patients") ? activeStyle : {}) }}>
          <Users size={16} /> My Patients
        </Link>
        <Link href="/doctor/appointments" style={{ ...itemStyle, ...(isActive("/doctor/appointments") ? activeStyle : {}) }}>
          <Calendar size={16} /> Appointments
        </Link>
      </nav>
    </aside>
  );
};

export default DoctorSidebar;
