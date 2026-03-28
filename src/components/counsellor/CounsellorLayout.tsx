"use client";

import React from 'react';
import Layout from '../layout/Layout';
import CounsellorSidebar from './CounsellorSidebar';
import CounsellorHeader from './CounsellorHeader';
import { CounsellorClerkGate } from '../staff/CounsellorClerkGate';

interface Props {
  title?: string;
  description?: string;
  children: React.ReactNode;
}

const containerStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16, padding: '1rem 0', minHeight: '100%' };
const mainCard: React.CSSProperties = { background: '#fff', border: '1px solid #eaeef2', borderRadius: 12, padding: 16, minHeight: '100%' };

const CounsellorLayout: React.FC<Props> = ({ title, description, children }) => {
  return (
    <CounsellorClerkGate>
      <Layout title={title} description={description} header={<CounsellorHeader />}>
        <div style={containerStyle}>
          <CounsellorSidebar />
          <div style={mainCard}>{children}</div>
        </div>
      </Layout>
    </CounsellorClerkGate>
  );
};

export default CounsellorLayout;
