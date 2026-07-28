import { supabase } from '../supabase'

interface RpcEnvelope<T> {
  success?: boolean
  data: T
  error?: { code: string; message: string } | null
}

interface RpcResult<T> {
  ok: boolean
  data?: T
  error?: string
  code?: string
  raw?: unknown
}

async function callRpc<T>(fn: string, args: Record<string, unknown>): Promise<RpcResult<T>> {
  const { data, error } = await supabase.schema('api').rpc(fn, args)

  if (error) {
    return { ok: false, error: error.message, code: error.code }
  }

  const envelope =
    data &&
    typeof data === 'object' &&
    !Array.isArray(data) &&
    'success' in data &&
    'data' in data
      ? (data as RpcEnvelope<T>)
      : null

  if (envelope) {
    if (envelope.success === false) {
      return { ok: false, error: envelope.error?.message ?? 'Unknown error', code: envelope.error?.code }
    }
    return { ok: true, data: envelope.data, raw: data }
  }

  if (data === null || data === undefined) {
    return { ok: false, error: 'No response from server', code: 'NO_RESPONSE' }
  }

  return { ok: true, data: data as T, raw: data }
}

export type IncomeStatementReport = {
  gross_profit?: number | null
  operating_profit?: number | null
  profit_before_tax?: number | null
  profit_for_year?: number | null
  cost_of_sales?: number | null
  admin_expenses?: number | null
  finance_costs?: number | null
  tax_expense?: number | null
  revenue_detail?: Array<Record<string, unknown>>
  expense_detail?: Array<Record<string, unknown>>
  [key: string]: unknown
}

export type CashFlowReport = {
  operating_activities?: Record<string, unknown> | null
  investing_activities?: Record<string, unknown> | null
  financing_activities?: Record<string, unknown> | null
  net_change_in_cash?: number | null
  cash_opening_balance?: number | null
  cash_closing_balance?: number | null
  warnings?: Array<string> | null
  [key: string]: unknown
}

export type ReportSoFP = {
  [key: string]: unknown
}

export type ChangesInEquityReport = {
  columns?: Array<string> | null
  profit_for_year?: number | null
  total_opening_equity?: number | null
  total_closing_equity?: number | null
  warnings?: Array<string> | null
  [key: string]: unknown
}

export async function fetchIncomeStatement(
  from: string,
  to: string,
): Promise<RpcResult<IncomeStatementReport>> {
  return callRpc<IncomeStatementReport>('report_income_statement', {
    p_from: from,
    p_to: to,
  })
}

export async function fetchCashFlow(
  from: string,
  to: string,
): Promise<RpcResult<CashFlowReport>> {
  return callRpc<CashFlowReport>('report_cash_flow', {
    p_from: from,
    p_to: to,
  })
}

export async function fetchSoFP(
  asOf: string,
): Promise<RpcResult<ReportSoFP>> {
  return callRpc<ReportSoFP>('report_sofp', {
    p_as_of: asOf,
  })
}

export async function fetchChangesInEquity(
  year: number,
): Promise<RpcResult<ChangesInEquityReport>> {
  return callRpc<ChangesInEquityReport>('report_changes_in_equity', {
    p_year: year,
  })
}
