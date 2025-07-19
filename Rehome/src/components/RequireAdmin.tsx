import React from "react";
import useUserSessionStore from "../services/state/useUserSessionStore";

// Keep in sync with AdminRoute.tsx and Navbar.tsx
const ADMIN_EMAILS = [
  'muhammadibnerafiq123@gmail.com',
  'testnewuser12345@gmail.com', // Test account with admin access
  'egzmanagement@gmail.com',
  'samuel.stroehle8@gmail.com',
  'info@rehomebv.com'
];

export default function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user } = useUserSessionStore();

  if (!ADMIN_EMAILS.includes(user?.email || "")) {
    return <div style={{ padding: 32, color: "red" }}>Access denied: Admins only.</div>;
  }
  return <>{children}</>;
} 