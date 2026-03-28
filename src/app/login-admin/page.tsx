"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/components/layout/Layout";

export default function AdminLoginRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/sign-in");
  }, [router]);

  return (
    <Layout title="Admin sign-in — Sehat Sathi" description="Redirecting to Clerk">
      <div style={{ padding: 24, textAlign: "center" }}>
        <p>Staff sign-in uses Clerk. Redirecting…</p>
        <p style={{ fontSize: 14, color: "#6b7280", marginTop: 8 }}>
          Set <code>publicMetadata.role = &quot;admin&quot;</code> in Clerk for
          admin dashboard access.
        </p>
      </div>
    </Layout>
  );
}
