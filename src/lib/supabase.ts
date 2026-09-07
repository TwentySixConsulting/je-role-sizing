import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/**
 * The single shared team account. Consultants only ever type the password; this
 * is the account it signs in. Not a secret - the password is what matters.
 */
export const TEAM_EMAIL =
  (import.meta.env.VITE_TEAM_EMAIL as string | undefined) ?? 'rolesizing@twentysixconsulting.co.uk'

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
