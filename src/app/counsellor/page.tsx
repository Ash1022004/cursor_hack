"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CounsellorRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/doctor");
  }, [router]);
  return <div style={{ padding: 24, textAlign: "center" }}>Redirecting to doctor dashboard...</div>;
}
