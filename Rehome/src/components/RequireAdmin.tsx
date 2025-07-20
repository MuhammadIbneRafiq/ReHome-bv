import React from "react";
import useUserSessionStore from "../services/state/useUserSessionStore";
import { ADMIN_EMAILS } from "../constants/adminEmails";

// Keep in sync with AdminRoute.tsx and Navbar.tsx

export default function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user } = useUserSessionStore();
  if (!user) {
    return (
      <div style={{ 
        padding: 32, 
        color: "red", 
        marginTop: 100,
        textAlign: "center",
        fontSize: "16px"
      }}>
        <h2>Authentication Required</h2>
        <p>Please log in to access the admin dashboard.</p>
      </div>
    );
  }

  if (!ADMIN_EMAILS.includes(user?.email || "")) {
    return (
      <div style={{ 
        padding: 32, 
        color: "red", 
        marginTop: 100,
        textAlign: "center",
        fontSize: "16px"
      }}>
        <h2>Access Denied</h2>
        <p>This area is restricted to administrators only.</p>
        <div style={{ marginTop: 20, fontSize: "14px", textAlign: "left", maxWidth: 600, margin: "20px auto" }}>
          <p><strong>Current user:</strong> {user?.email}</p>
          <p><strong>Authorized admin emails:</strong></p>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {ADMIN_EMAILS.map((email, index) => (
              <li key={index} style={{ padding: "4px 0" }}>• {email}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  }
  return <>{children}</>;
} 