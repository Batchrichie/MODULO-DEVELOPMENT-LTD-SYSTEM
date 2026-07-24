import { supabase } from '../supabase'
import {
  emptyExecutiveDashboard,
  parseExecutiveDashboard,
  type ExecutiveDashboardData,
} from '../../types/dashboardExecutive'

export type DashboardExecutiveResult =
  | { ok: true; data: ExecutiveDashboardData; raw: unknown }
  | { ok: false; error: string; code?: string }

/**
 * Single RPC call per Frontend Standard: `dashboard_executive()` (no arguments).
 * Calls the exposed `api` schema via PostgREST — backend must expose this schema.
 */
export async function fetchDashboardExecutive(): Promise<DashboardExecutiveResult> {
  const { data, error } = await supabase.schema('api').rpc('dashboard_executive')

  if (error) {
    return {
      ok: false,
      error: error.message,
      code: error.code,
    }
  }

  // Parse the envelope returned by api.ok()/api.err()
  const envelope = data as { success: boolean; data: unknown; error: { code: string; message: string } | null } | null
  if (!envelope || envelope.success === false) {
    return {
      ok: false,
      error: envelope?.error?.message ?? 'Unknown error',
      code: envelope?.error?.code,
    }
  }

  const parsed = parseExecutiveDashboard(envelope.data)
  return { ok: true, data: parsed, raw: data }
}

export { emptyExecutiveDashboard }
