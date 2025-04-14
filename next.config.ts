import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    PIPEDRIVE_API_TOKEN: process.env.PIPEDRIVE_API_TOKEN,
    PIPEDRIVE_BASE_URL: process.env.PIPEDRIVE_BASE_URL,
  },
};

export default nextConfig;
