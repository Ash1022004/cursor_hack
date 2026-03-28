import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, Users, Home, UserCheck, Calendar } from 'lucide-react';

const itemStyle: React.CSSProperties = { display: 'flex', gap: 10, alignItems: 'center', padding: '10px 12px', borderRadius: 8, color: '#0f172a', textDecoration: 'none' };
const activeStyle: React.CSSProperties = { background: '#eef2ff', color: '#1d4ed8' };

const AdminSidebar: React.FC = () => {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href;

  return (
    <aside style={{ width: 260, padding: 16, borderRight: '1px solid #eaeef2', background: '#ffffff', borderRadius: 12, height: 'fit-content', position: 'sticky', top: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Shield size={18} />
        <strong>Admin Panel</strong>
      </div>
      <nav style={{ display: 'grid', gap: 6 }}>
        <Link href="/admin" style={{ ...itemStyle, ...(isActive('/admin') ? activeStyle : {}) }}>
          <Home size={16} /> Dashboard
        </Link>
        <Link href="/admin/patients" style={{ ...itemStyle, ...(isActive('/admin/patients') ? activeStyle : {}) }}>
          <UserCheck size={16} /> Patients
        </Link>
        <Link href="/admin/counsellors" style={{ ...itemStyle, ...(isActive('/admin/counsellors') ? activeStyle : {}) }}>
          <Users size={16} /> Counsellors
        </Link>
        <Link href="/admin/appointments" style={{ ...itemStyle, ...(isActive('/admin/appointments') ? activeStyle : {}) }}>
          <Calendar size={16} /> Appointments
        </Link>
      </nav>
    </aside>
  );
};

export default AdminSidebar;
