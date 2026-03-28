"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/components/layout/Layout";

export default function CounsellorLoginRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/login-doctor");
  }, [router]);

  return (
    <Layout title="Counsellor sign-in — Sehat Sathi" description="Redirecting to doctor login">
      <div style={{ padding: 24, textAlign: "center" }}>
        <p>Redirecting to doctor login...</p>
      </div>
    </Layout>
  );
}
