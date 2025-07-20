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

  // Debug logging
  console.log('RequireAdmin - Current user:', user);
  console.log('RequireAdmin - User email:', user?.email);
  console.log('RequireAdmin - Is admin?', ADMIN_EMAILS.includes(user?.email || ""));

  if (!user) {
    return <div style={{ padding: 32, color: "red" }}>Please log in to access admin dashboard.</div>;
  }

  if (!ADMIN_EMAILS.includes(user?.email || "")) {
    return (
      <div style={{ padding: 32, color: "red" }}>
        Access denied: Admins only. 
        <br />
        Current user: {user?.email}
        <br />
        Admin emails: {ADMIN_EMAILS.join(', ')}
      </div>
    );
  }
  return <>{children}</>;
} 