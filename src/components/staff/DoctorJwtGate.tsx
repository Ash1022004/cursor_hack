"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export function DoctorJwtGate({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== "counsellor")) {
      router.replace("/login-doctor");
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading) {
    return <div style={{ padding: 24, textAlign: "center" }}>Loading...</div>;
  }

  if (!isAuthenticated || user?.role !== "counsellor") {
    return <div style={{ padding: 24, textAlign: "center" }}>Redirecting...</div>;
  }

  return <>{children}</>;
}
