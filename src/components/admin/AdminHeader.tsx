import React from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { Shield, LogOut, Users, LayoutDashboard, UserCheck, Calendar } from 'lucide-react';

const bar: React.CSSProperties = { background: '#ffffffcc', backdropFilter: 'saturate(180%) blur(8px)', borderBottom: '1px solid #eaeef2', position: 'sticky', top: 0, zIndex: 40 };
const inner: React.CSSProperties = { maxWidth: 1200, margin: '0 auto', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'space-between' };
const left: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 10 };
const right: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 10 };
const link: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 8, color: '#0f172a', textDecoration: 'none' };
const primary: React.CSSProperties = { background: '#1d4ed8', color: '#fff' };

const AdminHeader: React.FC = () => {
  const { logout, user } = useAuth();
  return (
    <header style={bar}>
      <div style={inner}>
        <div style={left}>
          <Link href="/admin" style={{ ...link, fontWeight: 700 }}>
            <Shield size={18} /> Admin
          </Link>
          <nav style={{ display: 'flex', gap: 8 }}>
            <Link href="/admin" style={link}><LayoutDashboard size={16} /> Dashboard</Link>
            <Link href="/admin/patients" style={link}><UserCheck size={16} /> Patients</Link>
            <Link href="/admin/counsellors" style={link}><Users size={16} /> Counsellors</Link>
            <Link href="/admin/appointments" style={link}><Calendar size={16} /> Appointments</Link>
          </nav>
        </div>
        <div style={right}>
          <span style={{ opacity: 0.7, marginRight: 6 }}>{user?.firstName || 'admin'}</span>
          <button onClick={logout} style={{ ...link, ...primary, border: 'none', cursor: 'pointer' }}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
