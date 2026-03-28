"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/components/layout/Layout";

export default function CounsellorLoginRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/sign-in");
  }, [router]);

  return (
    <Layout
      title="Counsellor sign-in — Sehat Sathi"
      description="Redirecting to Clerk"
    >
      <div style={{ padding: 24, textAlign: "center" }}>
        <p>Counsellor sign-in uses Clerk. Redirecting…</p>
      </div>
    </Layout>
  );
}
