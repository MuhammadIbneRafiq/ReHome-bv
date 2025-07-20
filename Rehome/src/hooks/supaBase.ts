/* The code snippet is attempting to import the `createClient` function from the
`@supabase/supabase-js` library. It then tries to load API keys from environment variables
(`SUPABASE_KEY` and `SUPABASE_URL`) and uses them to create a Supabase client instance by calling
`createClient(SUPABASE_URL, SUPABASE_KEY)`. Finally, it exports the created `supabase` client for
further use in the application. */
import { createClient } from "@supabase/supabase-js";

// Use the same Supabase instance as the backend (temporary fix)
// Load API keys from environment variables using Vite, fallback to backend values
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://yhlenudckwewmejigxvl.supabase.co";
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlobGVudWRja3dld21lamlneHZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzcyMTk0MDgsImV4cCI6MjA1Mjc5NTQwOH0.CaNKgZXfhkT9-FaGF5hhqQ3aavfUi32R-1ueew8B-S0";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);