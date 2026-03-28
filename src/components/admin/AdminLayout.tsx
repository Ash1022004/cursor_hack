"use client";

import React from 'react';
import Layout from '../layout/Layout';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import { AdminJwtGate } from '../staff/AdminJwtGate';

interface Props {
  title?: string;
  description?: string;
  children: React.ReactNode;
}

const containerStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16, padding: '1rem 0', minHeight: '100%' };
const mainCard: React.CSSProperties = { background: '#fff', border: '1px solid #eaeef2', borderRadius: 12, padding: 16, minHeight: '100%' };

const AdminLayout: React.FC<Props> = ({ title, description, children }) => {
  return (
    <AdminJwtGate>
      <Layout title={title} description={description} header={<AdminHeader />}>
        <div style={containerStyle}>
          <AdminSidebar />
          <div style={mainCard}>{children}</div>
        </div>
      </Layout>
    </AdminJwtGate>
  );
};

export default AdminLayout;
