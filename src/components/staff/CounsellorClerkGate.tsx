"use client";

import { api } from "@cvx/_generated/api";
import { RedirectToSignIn, useAuth, useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { useEffect } from "react";

export function CounsellorClerkGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const ensure = useMutation(api.counsellors.ensureByClerkId);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user?.id) return;
    const name =
      user.fullName ||
      user.primaryEmailAddress?.emailAddress ||
      "Counsellor";
    const email = user.primaryEmailAddress?.emailAddress ?? undefined;
    void ensure({ clerkUserId: user.id, name, email });
  }, [isLoaded, isSignedIn, user, ensure]);

  if (!isLoaded) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>Loading…</div>
    );
  }

  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }

  return <>{children}</>;
}
