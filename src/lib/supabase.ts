import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/**
 * Consultants type a username; Supabase Auth signs in an address, so a bare
 * username is completed with this domain. Not a secret.
 */
export const TEAM_EMAIL_DOMAIN =
  (import.meta.env.VITE_TEAM_EMAIL_DOMAIN as string | undefined) ?? 'twentysixconsulting.co.uk'

export const SUPABASE_CONFIGURED = Boolean(URL && KEY)

/**
 * Null when the environment variables are absent, which is how the app decides
 * to fall back to browser-only storage instead of failing to start.
 */
export const supabase: SupabaseClient | null = SUPABASE_CONFIGURED
  ? createClient(URL!, KEY!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        // One shared account, so there is no per-user URL callback to handle.
        detectSessionInUrl: false,
      },
    })
  : null

export const ROLES_TABLE = 'je_roles'
export const SETTINGS_TABLE = 'je_settings'
export const FILES_BUCKET = 'je-job-descriptions'
