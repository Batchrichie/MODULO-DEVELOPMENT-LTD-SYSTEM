import { supabase } from '../supabase'

/**
 * Shared RPC call handler that correctly interprets the api.ok()/api.err() envelope.
 * 
 * Backend returns: { success: true/false, data: T, error: { code, message } }
 * This extracts the business-logic error from inside the envelope,
 * not just transport/permission errors from the JS client.
 */
async function callRpc<T>(
  fn: string,
  args: Record<string, unknown>,
): Promise<AccountantRpcResult<T>> {
  const { data, error } = await supabase.schema('api').rpc(fn, args)

  // Transport/permission error from Supabase client
  if (error) {
    return { ok: false, error: error.message, code: error.code }
  }

  // Parse the envelope returned by api.ok()/api.err()
  const envelope = data as { success: boolean; data: T; error: { code: string; message: string } | null } | null
  if (!envelope) {
    return { ok: false, error: 'No response from server', code: 'NO_RESPONSE' }
  }

  // Business-logic error encoded in the envelope
  if (envelope.success === false) {
    return { ok: false, error: envelope.error?.message ?? 'Unknown error', code: envelope.error?.code }
  }

  return { ok: true, data: envelope.data, raw: data }
}

export type AccountantAccount = {
  account_id?: string
  id?: string
  code?: string | null
  name?: string | null
  type?: string | null
  reporting_group?: string | null
  is_postable?: boolean | null
  payment_method_type?: string | null
  account_number?: string | null
  provider_name?: string | null
  created_at?: string | null
}

export type AccountantJournal = {
  journal_id?: string
  id?: string
  txn_date?: string | null
  source_type?: string | null
  source_id?: string | null
  accounting_period?: string | null
  status?: string | null
  reversal_of_journal_id?: string | null
  created_at?: string | null
  reference?: string | null
  description?: string | null
  amount?: number | null
  total_amount?: number | null
  debit?: number | null
  credit?: number | null
  lines?: Array<Record<string, unknown>>
}

export type TrialBalanceRow = {
  account_id?: string | null
  account_code?: string | null
  code?: string | null
  account_name?: string | null
  name?: string | null
  debit?: number | null
  credit?: number | null
  balance?: number | null
  [key: string]: unknown
}

export type Invoice = {
  invoice_id?: string
  id?: string
  invoice_number?: string | null
  journal_id?: string | null
  amount_due?: number | null
  customer_id?: string | null
  project_id?: string | null
  created_at?: string | null
  line_items?: Array<{ description?: string; amount?: number }>
  apply_vat?: boolean
  apply_nhil?: boolean
  apply_getfund?: boolean
  vat?: number | null
  nhil?: number | null
  getfund?: number | null
  functional_amount?: number | null
  [key: string]: unknown
}

export type CustomerPayment = {
  payment_id?: string
  id?: string
  invoice_id?: string | null
  amount?: number | null
  created_at?: string | null
  payment_date?: string | null
  [key: string]: unknown
}

export type TaxRateSetting = {
  tax_type?: string | null
  rate?: number | null
  [key: string]: unknown
}

export type TaxRates = {
  VAT?: number
  NHIL?: number
  GETFund?: number
  SSNIT_employee?: number
  SSNIT_employer?: number
  [key: string]: number | undefined
}

export type Expense = {
  expense_id?: string
  id?: string
  project_id?: string | null
  amount?: number | null
  budget_flag?: boolean
  created_at?: string | null
  description?: string | null
  [key: string]: unknown
}

export type SupplierPayment = {
  payment_id?: string
  id?: string
  amount?: number | null
  created_at?: string | null
  [key: string]: unknown
}

export type AccountantRpcResult<T> =
  | { ok: true; data: T; raw: unknown }
  | { ok: false; error: string; code?: string }

export async function getRecords<T>(resource: string, page: number, limit: number): Promise<AccountantRpcResult<T>> {
  const result = await callRpc<T>('get_records', {
    p_resource: resource,
    p_page: page,
    p_limit: limit,
  })

  if (!result.ok) return result

  // Extract rows from the response
  const rows = Array.isArray(result.data) ? result.data : (result.data as any)?.rows || []
  return { ok: true, data: rows as T, raw: result.raw }
}

export async function createRecord<T>(resource: string, payload: Record<string, unknown>): Promise<AccountantRpcResult<T>> {
  return callRpc<T>('create_record', {
    p_resource: resource,
    p_payload: payload,
  })
}

export async function updateRecord<T>(resource: string, id: string, payload: Record<string, unknown>): Promise<AccountantRpcResult<T>> {
  return callRpc<T>('update_record', {
    p_resource: resource,
    p_id: id,
    p_payload: payload,
  })
}

export async function fetchAccounts(): Promise<AccountantRpcResult<AccountantAccount[]>> {
  const result = await callRpc<any>('get_records', {
    p_resource: 'accounts',
    p_page: 1,
    p_limit: 100,
  })

  if (!result.ok) return result

  const rows = Array.isArray(result.data) ? result.data : (result.data as any)?.rows || []
  return { ok: true, data: rows as AccountantAccount[], raw: result.raw }
}

export async function createAccount(payload: Record<string, unknown>): Promise<AccountantRpcResult<AccountantAccount>> {
  return callRpc<AccountantAccount>('create_record', {
    p_resource: 'accounts',
    p_payload: payload,
  })
}

export async function updateAccount(
  id: string,
  payload: Record<string, unknown>,
): Promise<AccountantRpcResult<AccountantAccount>> {
  return callRpc<AccountantAccount>('update_record', {
    p_resource: 'accounts',
    p_id: id,
    p_payload: payload,
  })
}

export async function deactivateAccount(id: string): Promise<AccountantRpcResult<{ success: boolean }>> {
  return callRpc<{ success: boolean }>('accounts_deactivate', {
    p_id: id,
  })
}

export async function fetchJournalEntries(): Promise<AccountantRpcResult<AccountantJournal[]>> {
  const result = await callRpc<any>('get_records', {
    p_resource: 'journals',
    p_page: 1,
    p_limit: 100,
  })

  if (!result.ok) return result

  const rows = Array.isArray(result.data) ? result.data : (result.data as any)?.rows || []
  return { ok: true, data: rows as AccountantJournal[], raw: result.raw }
}

export async function fetchTrialBalance(asOf: string): Promise<AccountantRpcResult<TrialBalanceRow[]>> {
  const result = await callRpc<any>('report_trial_balance', {
    p_as_of: asOf,
  })

  if (!result.ok) return result

  const rows = Array.isArray(result.data) ? result.data : (result.data as any)?.rows || []
  return { ok: true, data: rows as TrialBalanceRow[], raw: result.raw }
}

export async function invoiceCreate(payload: Record<string, unknown>): Promise<AccountantRpcResult<Invoice>> {
  return callRpc<Invoice>('invoice_create', {
    p_payload: payload,
  })
}

export async function paymentReceivedCreate(payload: Record<string, unknown>): Promise<AccountantRpcResult<CustomerPayment>> {
  return callRpc<CustomerPayment>('payment_received_create', {
    p_payload: payload,
  })
}

export async function expenseCreate(payload: Record<string, unknown>): Promise<AccountantRpcResult<Expense>> {
  return callRpc<Expense>('expense_create', {
    p_payload: payload,
  })
}

export async function paymentMadeCreate(payload: Record<string, unknown>): Promise<AccountantRpcResult<SupplierPayment>> {
  return callRpc<SupplierPayment>('payment_made_create', {
    p_payload: payload,
  })
}

export async function fetchTaxRates(): Promise<AccountantRpcResult<TaxRateSetting[]>> {
  const result = await callRpc<any>('tax_rates_get', {})

  if (!result.ok) return result

  const rows = Array.isArray(result.data) ? result.data : (result.data as any)?.rows || []
  return { ok: true, data: rows as TaxRateSetting[], raw: result.raw }
}


export async function taxRatesUpdate(taxType: string, rate: number): Promise<AccountantRpcResult<{ success: boolean }>> {
  return callRpc<{ success: boolean }>('tax_rates_update', {
    p_tax_type: taxType,
    p_rate: rate,
  })
}

export async function reportTax(
  reportType: string,
  period: string,
): Promise<
  AccountantRpcResult<{
    type?: string
    period?: string
    closing_balance?: number
    note?: string
    accounts: Array<{
      code: string
      name: string
      opening_balance: number
      accrued_this_period: number
      paid_this_period: number
      input_tax_accrued: number | null
    }>
  }>
> {
  return callRpc('report_tax', {
    p_type: reportType,
    p_period: period,
  })
}

export async function completionAssessmentSubmit(
  projectId: string,
  period: string,
  percentComplete: number,
): Promise<AccountantRpcResult<{ success: boolean }>> {
  return callRpc<{ success: boolean }>('completion_assessment_submit', {
    p_project_id: projectId,
    p_period: period,
    p_percent_complete: percentComplete,
  })
}

export async function reportBudgetVsActual(
  projectId: string,
): Promise<
  AccountantRpcResult<{
    project_id?: string
    project_name?: string
    total_budget?: number
    total_actual?: number
    variance?: number
    variance_pct?: number | null
    limitation?: string | null
  }>
> {
  return callRpc('report_budget_vs_actual', { p_project_id: projectId })
}

export function normalizeTaxRates(rows: TaxRateSetting[]): TaxRates {
  return rows.reduce((acc, row) => {
    if (!row.tax_type || typeof row.rate !== 'number') return acc

    const normalizedRate = row.rate / 100
    const typeKey = String(row.tax_type).toUpperCase()

    switch (typeKey) {
      case 'VAT':
        acc.VAT = normalizedRate
        break
      case 'NHIL':
        acc.NHIL = normalizedRate
        break
      case 'GETFUND':
        acc.GETFund = normalizedRate
        break
      case 'SSNIT_EMPLOYEE':
        acc.SSNIT_employee = normalizedRate
        break
      case 'SSNIT_EMPLOYER':
        acc.SSNIT_employer = normalizedRate
        break
      default:
        acc[typeKey] = normalizedRate
    }

    return acc
  }, {} as TaxRates)
}
