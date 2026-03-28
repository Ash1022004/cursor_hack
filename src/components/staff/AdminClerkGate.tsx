"use client";

import { RedirectToSignIn, useAuth, useUser } from "@clerk/nextjs";

export function AdminClerkGate({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();

  if (!isLoaded) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>Loading…</div>
    );
  }

  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }

  const role = user?.publicMetadata?.role;
  const isAdmin = role === "admin";

  if (!isAdmin) {
    return (
      <div style={{ padding: 24 }}>
        <h1>Access denied</h1>
        <p>
          Admin dashboard requires{" "}
          <code>publicMetadata.role = &quot;admin&quot;</code> in Clerk.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
