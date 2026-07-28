import { supabase } from '../supabase'

export type PmProject = {
  project_id?: string
  id?: string
  name?: string
  customer_id?: string | null
  contract_value?: number | null
  project_manager_id?: string | null
  expected_completion?: string | null
  status?: string | null
  revenue_account_id?: string | null
  created_at?: string | null
  [key: string]: unknown
}

export type BudgetVsActual = {
  project_id?: string
  project_name?: string
  total_budget?: number
  total_actual?: number
  variance?: number
  variance_pct?: number | null
  limitation?: string
  [key: string]: unknown
}

export type ProjectProfitability = {
  project_id?: string
  project_name?: string
  contract_value?: number
  revenue_recognized_to_date?: number
  expenses_to_date?: number
  gross_profit?: number
  gross_margin_pct?: number | null
  wip_drawn_down_via_invoicing?: number
  wip_balance_undrawn?: number
  [key: string]: unknown
}

export type CompletionAssessment = {
  assessment_id?: string
  project_id?: string
  period?: string
  percent_complete?: number
  status?: string
  assessed_by?: string | null
  approved_by?: string | null
  journal_id?: string | null
  created_at?: string | null
  [key: string]: unknown
}

export type PmRpcResult<T> =
  | { ok: true; data: T; raw: unknown }
  | { ok: false; error: string; code?: string }

function unwrapData(payload: unknown): unknown {
  if (!payload || typeof payload !== 'object') return payload
  const record = payload as Record<string, unknown>
  if (record.data !== undefined) return record.data
  if (record.result !== undefined) return record.result
  return payload
}

function extractRows(payload: unknown): unknown[] {
  const unwrapped = unwrapData(payload)
  if (Array.isArray(unwrapped)) return unwrapped

  if (unwrapped && typeof unwrapped === 'object') {
    const record = unwrapped as Record<string, unknown>
    const candidates = [record.rows, record.items, record.records, record.data, record.result]
    for (const candidate of candidates) {
      if (Array.isArray(candidate)) return candidate
    }
  }

  return []
}

export async function fetchMyProjects(): Promise<PmRpcResult<PmProject[]>> {
  const { data, error } = await supabase.schema('api').rpc('get_records', {
    p_resource: 'projects',
    p_page: 1,
    p_limit: 100,
  })

  if (error) {
    return { ok: false, error: error.message, code: error.code }
  }

  return { ok: true, data: extractRows(data) as PmProject[], raw: data }
}

export async function completionAssessmentSubmit(payload: {
  project_id: string
  period: string
  percent_complete: number
}): Promise<PmRpcResult<CompletionAssessment>> {
  const { data, error } = await supabase.schema('api').rpc('completion_assessment_submit', {
    p_project_id: payload.project_id,
    p_period: payload.period,
    p_percent_complete: payload.percent_complete,
  })

  if (error) {
    return { ok: false, error: error.message, code: error.code }
  }

  const unwrapped = unwrapData(data)
  const record = (unwrapped && typeof unwrapped === 'object' ? unwrapped : {}) as CompletionAssessment
  return { ok: true, data: record, raw: data }
}

export async function fetchBudgetVsActual(projectId: string): Promise<PmRpcResult<BudgetVsActual>> {
  const { data, error } = await supabase.schema('api').rpc('report_budget_vs_actual', {
    p_project_id: projectId,
  })

  if (error) {
    return { ok: false, error: error.message, code: error.code }
  }

  const unwrapped = unwrapData(data)
  const record = (unwrapped && typeof unwrapped === 'object' ? unwrapped : {}) as BudgetVsActual
  return { ok: true, data: record, raw: data }
}

export async function fetchProjectProfitability(projectId: string): Promise<PmRpcResult<ProjectProfitability>> {
  const { data, error } = await supabase.schema('api').rpc('report_project_profitability', {
    p_project_id: projectId,
  })

  if (error) {
    return { ok: false, error: error.message, code: error.code }
  }

  const unwrapped = unwrapData(data)
  const record = (unwrapped && typeof unwrapped === 'object' ? unwrapped : {}) as ProjectProfitability
  return { ok: true, data: record, raw: data }
}

export interface SiteReportRecord {
  project_id?: number
  project_name?: string | null
  report_date?: string | null
  submitted_by?: number | null
  status?: string | null
  // TODO: expand after confirming return columns
}

export async function fetchPendingSiteReports(): Promise<{ ok: true; data: { success: boolean; data: SiteReportRecord[]; error: string | null }; raw: unknown } | { ok: false; error: string; code?: string }> {
  const { data, error } = await supabase.rpc('list_pending_site_reports')

  if (error) {
    return { ok: false, error: error.message, code: error.code }
  }

  return { ok: true, data: data as { success: boolean; data: SiteReportRecord[]; error: string | null }, raw: data }
}
