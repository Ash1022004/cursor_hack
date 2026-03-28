"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export function AdminJwtGate({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== "admin")) {
      router.replace("/login-admin");
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading) {
    return <div style={{ padding: 24, textAlign: "center" }}>Loading...</div>;
  }

  if (!isAuthenticated || user?.role !== "admin") {
    return <div style={{ padding: 24, textAlign: "center" }}>Redirecting...</div>;
  }

  return <>{children}</>;
}
