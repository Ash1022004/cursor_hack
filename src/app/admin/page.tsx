"use client";

import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

const AdminDashboardPage: React.FC = () => {
  return (
    <AdminLayout title="Admin Dashboard - Sehat-Saathi" description="Admin control panel">
      <div style={{ display: 'grid', gap: 16 }}>
        <h1 style={{ margin: 0 }}>Admin Dashboard</h1>
        <p>This is a dummy admin dashboard page. Restrict access to users with role = admin.</p>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboardPage;
