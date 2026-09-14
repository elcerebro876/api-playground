import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;
let checked = false;

export type ExplainRecord = {
  id?: string;
  endpoint_url: string;
  api_name: string;
  target_users: string;
  problem_solved: string;
  request_action: string;
  expected_outcome: string;
  build_idea: string;
  call_count?: number;
  last_requested_at?: string;
  created_at?: string;
};

function isConfigured(value?: string) {
  if (!value) return false;
  const v = value.trim().toLowerCase();
  if (v === "" || v === "your_gemini_api_key_here") return false;
  if (v.includes("your-project") || v.includes("your_service_role")) return false;
  return true;
}

export function getSupabase(): SupabaseClient | null {
  if (checked) return client;
  checked = true;
  let url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!isConfigured(url) || !isConfigured(key)) return null;
  url = url!.replace(/\/rest\/v1\/?$/, "");
  client = createClient(url!, key!);
  return client;
}