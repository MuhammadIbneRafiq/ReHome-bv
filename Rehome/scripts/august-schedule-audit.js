/**
 * August Schedule/Price Auditor
 *
 * What it does:
 * - Fetches dynamic constants (cityBaseCharges, pricingConfig) from your backend
 * - Iterates all days of a target month (default: August of the current year)
 * - For each city and day, hits your Supabase Edge Functions to get schedule state
 * - Computes the expected within-city base price (cheap vs normal) for that date
 * - Prints a concise report you can diff against expectations
 *
 * Usage (PowerShell):
 *   $env:SUPABASE_PROJECT_REF="yhlenudckwewmejigxvl"
 *   $env:SUPABASE_ANON_KEY="<your anon key>"
 *   $env:BACKEND_BASE_URL="https://rehome-backend.vercel.app"  # or your origin
 *   # optional:
 *   $env:YEAR="2025"; $env:MONTH="8"  # 1-12
 *   node scripts/august-schedule-audit.js
 */

const PROJECT_REF = process.env.SUPABASE_PROJECT_REF;
const ANON_KEY = process.env.SUPABASE_ANON_KEY;
const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL; // for /api/constants
const YEAR = Number(process.env.YEAR || new Date().getFullYear());
const MONTH = Number(process.env.MONTH || 8); // August by default (1-12)

if (!PROJECT_REF || !ANON_KEY || !BACKEND_BASE_URL) {
  console.error("Missing envs. Required: SUPABASE_PROJECT_REF, SUPABASE_ANON_KEY, BACKEND_BASE_URL");
  process.exit(1);
}

const FUNCS_BASE = `https://${PROJECT_REF}.functions.supabase.co`;

async function getConstants() {
  const url = `${BACKEND_BASE_URL}/api/constants`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`constants ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error(`constants backend error: ${json.error}`);
  return json.data; // { cityBaseCharges, pricingConfig, ... }
}

async function getEmpty(dateStr) {
  const url = `${FUNCS_BASE}/check-all-cities-empty?date=${encodeURIComponent(dateStr)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${ANON_KEY}`, Accept: "application/json" } });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

async function getCityStatus(city, dateStr) {
  const url = `${FUNCS_BASE}/city-schedule-status?city=${encodeURIComponent(city)}&date=${encodeURIComponent(dateStr)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${ANON_KEY}`, Accept: "application/json" } });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

function daysInMonth(year, month1to12) {
  const first = new Date(Date.UTC(year, month1to12 - 1, 1));
  const days = [];
  let d = first;
  while (d.getUTCMonth() === first.getUTCMonth()) {
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(d.getUTCDate()).padStart(2, "0");
    days.push(`${yyyy}-${mm}-${dd}`);
    d = new Date(Date.UTC(yyyy, d.getUTCMonth(), d.getUTCDate() + 1));
  }
  return days;
}

function withinCityBase(cityBaseCharges, city, { isScheduled, isEmpty }) {
  const cfg = cityBaseCharges[city];
  if (!cfg) return null;
  const cheap = isScheduled || isEmpty;
  return cheap ? cfg.cityDay : cfg.normal;
}

(async () => {
  try {
    const { cityBaseCharges, pricingConfig } = await getConstants();
    const cities = Object.keys(cityBaseCharges).sort();
    console.log("Loaded cities:", cities.join(", "));
    console.log("PricingConfig earlyBooking:", pricingConfig?.earlyBookingDiscount);

    const dates = daysInMonth(YEAR, MONTH);
    console.log(`\nAuditing ${YEAR}-${String(MONTH).padStart(2, "0")} across ${cities.length} cities...`);

    for (const dateStr of dates) {
      const emptyRes = await getEmpty(dateStr);
      const allEmpty = emptyRes.json?.data?.isEmpty;
      console.log(`\nDate ${dateStr} | allCitiesEmpty=${allEmpty} (HTTP ${emptyRes.status})`);

      for (const city of cities) {
        const { status, json } = await getCityStatus(city, dateStr);
        const isScheduled = json?.data?.isScheduled;
        const isEmpty = json?.data?.isEmpty;
        const base = withinCityBase(cityBaseCharges, city, { isScheduled, isEmpty });
        console.log(`  ${city.padEnd(12)}  scheduled=${String(isScheduled).padEnd(5)} empty=${String(isEmpty).padEnd(5)}  base=`, base, `(HTTP ${status})`);
      }
    }

    console.log("\nDone.");
  } catch (e) {
    console.error("Audit failed:", e);
    process.exit(1);
  }
})();


