/* The code snippet is attempting to import the `createClient` function from the
`@supabase/supabase-js` library. It then tries to load API keys from environment variables
(`SUPABASE_KEY` and `SUPABASE_URL`) and uses them to create a Supabase client instance by calling
`createClient(SUPABASE_URL, SUPABASE_KEY)`. Finally, it exports the created `supabase` client for
further use in the application. */
import { createClient } from "@supabase/supabase-js";

// Load API keys from environment variables using Vite
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);