import { supabase } from '../supabase'

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

export async function fetchAccounts(): Promise<AccountantRpcResult<AccountantAccount[]>> {
  const { data, error } = await supabase.schema('api').rpc('get_records', {
    p_resource: 'accounts',
    p_page: 1,
    p_limit: 100,
  })

  if (error) {
    return { ok: false, error: error.message, code: error.code }
  }

  return { ok: true, data: extractRows(data) as AccountantAccount[], raw: data }
}

export async function createAccount(payload: Record<string, unknown>): Promise<AccountantRpcResult<AccountantAccount>> {
  const { data, error } = await supabase.schema('api').rpc('create_record', {
    p_resource: 'accounts',
    p_payload: payload,
  })

  if (error) {
    return { ok: false, error: error.message, code: error.code }
  }

  const unwrapped = unwrapData(data)
  const record = (unwrapped && typeof unwrapped === 'object' ? unwrapped : {}) as AccountantAccount
  return { ok: true, data: record, raw: data }
}

export async function updateAccount(
  id: string,
  payload: Record<string, unknown>,
): Promise<AccountantRpcResult<AccountantAccount>> {
  const { data, error } = await supabase.schema('api').rpc('update_record', {
    p_resource: 'accounts',
    p_id: id,
    p_payload: payload,
  })

  if (error) {
    return { ok: false, error: error.message, code: error.code }
  }

  const unwrapped = unwrapData(data)
  const record = (unwrapped && typeof unwrapped === 'object' ? unwrapped : {}) as AccountantAccount
  return { ok: true, data: record, raw: data }
}

export async function deactivateAccount(id: string): Promise<AccountantRpcResult<{ success: boolean }>> {
  const { data, error } = await supabase.schema('api').rpc('accounts_deactivate', {
    p_id: id,
  })

  if (error) {
    return { ok: false, error: error.message, code: error.code }
  }

  const unwrapped = unwrapData(data)
  return {
    ok: true,
    data: (unwrapped && typeof unwrapped === 'object' ? unwrapped : { success: true }) as { success: boolean },
    raw: data,
  }
}

export async function fetchJournalEntries(): Promise<AccountantRpcResult<AccountantJournal[]>> {
  const { data, error } = await supabase.schema('api').rpc('get_records', {
    p_resource: 'journals',
    p_page: 1,
    p_limit: 100,
  })

  if (error) {
    return { ok: false, error: error.message, code: error.code }
  }

  return { ok: true, data: extractRows(data) as AccountantJournal[], raw: data }
}

export async function fetchTrialBalance(asOf: string): Promise<AccountantRpcResult<TrialBalanceRow[]>> {
  const { data, error } = await supabase.schema('api').rpc('report_trial_balance', {
    p_as_of: asOf,
  })

  if (error) {
    return { ok: false, error: error.message, code: error.code }
  }

  const unwrapped = unwrapData(data)
  const rows = extractRows(unwrapped)

  return { ok: true, data: rows as TrialBalanceRow[], raw: data }
}

export async function invoiceCreate(payload: Record<string, unknown>): Promise<AccountantRpcResult<Invoice>> {
  const { data, error } = await supabase.schema('api').rpc('invoice_create', {
    p_payload: payload,
  })

  if (error) {
    return { ok: false, error: error.message, code: error.code }
  }

  const unwrapped = unwrapData(data)
  const record = (unwrapped && typeof unwrapped === 'object' ? unwrapped : {}) as Invoice
  return { ok: true, data: record, raw: data }
}

export async function paymentReceivedCreate(payload: Record<string, unknown>): Promise<AccountantRpcResult<CustomerPayment>> {
  const { data, error } = await supabase.schema('api').rpc('payment_received_create', {
    p_payload: payload,
  })

  if (error) {
    return { ok: false, error: error.message, code: error.code }
  }

  const unwrapped = unwrapData(data)
  const record = (unwrapped && typeof unwrapped === 'object' ? unwrapped : {}) as CustomerPayment
  return { ok: true, data: record, raw: data }
}

export async function expenseCreate(payload: Record<string, unknown>): Promise<AccountantRpcResult<Expense>> {
  const { data, error } = await supabase.schema('api').rpc('expense_create', {
    p_payload: payload,
  })

  if (error) {
    return { ok: false, error: error.message, code: error.code }
  }

  const unwrapped = unwrapData(data)
  const record = (unwrapped && typeof unwrapped === 'object' ? unwrapped : {}) as Expense
  return { ok: true, data: record, raw: data }
}

export async function paymentMadeCreate(payload: Record<string, unknown>): Promise<AccountantRpcResult<SupplierPayment>> {
  const { data, error } = await supabase.schema('api').rpc('payment_made_create', {
    p_payload: payload,
  })

  if (error) {
    return { ok: false, error: error.message, code: error.code }
  }

  const unwrapped = unwrapData(data)
  const record = (unwrapped && typeof unwrapped === 'object' ? unwrapped : {}) as SupplierPayment
  return { ok: true, data: record, raw: data }
}

export async function fetchTaxRates(): Promise<AccountantRpcResult<TaxRateSetting[]>> {
  const { data, error } = await supabase.schema('api').rpc('tax_rates_get')
  if (error) {
    return { ok: false, error: error.message, code: error.code }
  }
  const rows = extractRows(data)
  return { ok: true, data: rows as TaxRateSetting[], raw: data }
}
