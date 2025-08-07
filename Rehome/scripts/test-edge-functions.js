/**
 * Simple JS tester for Supabase Edge Functions
 * Usage (PowerShell):
 *   setx SUPABASE_PROJECT_REF yhlenudckwewmejigxvl
 *   setx SUPABASE_ANON_KEY <your-anon-key>
 *   node scripts/test-edge-functions.js
 */

const PROJECT_REF = "yhlenudckwewmejigxvl";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlobGVudWRja3dld21lamlneHZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzcyMTk0MDgsImV4cCI6MjA1Mjc5NTQwOH0.CaNKgZXfhkT9-FaGF5hhqQ3aavfUi32R-1ueew8B-S0";

if (!PROJECT_REF || !ANON_KEY) {
  console.error("Missing SUPABASE_PROJECT_REF or SUPABASE_ANON_KEY envs");
  process.exit(1);
}

const base = `https://${PROJECT_REF}.functions.supabase.co`;

async function hit(path) {
  const url = `${base}${path}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${ANON_KEY}`,
      Accept: "application/json",
    },
  });
  const text = await res.text();
  console.log("GET", url, "=>", res.status);
  try {
    console.log(JSON.stringify(JSON.parse(text), null, 2));
  } catch {
    console.log(text);
  }
}

(async () => {
  const date = "2025-12-31";
  const city = "Amsterdam";

  await hit(`/check-all-cities-empty?date=${encodeURIComponent(date)}`);
  await hit(`/city-schedule-status?city=${encodeURIComponent(city)}&date=${encodeURIComponent(date)}`);
})();


