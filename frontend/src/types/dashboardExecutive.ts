/**
 * Expected fields per API_Contract.md §3 (Executive Dashboard bundle).
 * Actual RPC return shape is UNCONFIRMED — `dashboard_executive()` was not found
 * on the live Supabase project at build time (PGRST202). Parser is defensive only.
 */
export interface ExecutiveAlert {
  message: string
  severity?: string
}

export interface ExecutiveTaxStatusItem {
  type: string
  status: string
  dueDate?: string | null
}

export interface ExecutiveDashboardData {
  cashPosition: number | null
  revenue: number | null
  netProfit: number | null
  activeProjects: number | null
  taxStatus: ExecutiveTaxStatusItem[] | null
  alerts: ExecutiveAlert[]
}

export function emptyExecutiveDashboard(): ExecutiveDashboardData {
  return {
    cashPosition: null,
    revenue: null,
    netProfit: null,
    activeProjects: null,
    taxStatus: null,
    alerts: [],
  }
}

function pickNumber(obj: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const value = obj[key]
    if (typeof value === 'number' && !Number.isNaN(value)) return value
    if (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) {
      return Number(value)
    }
  }
  return null
}

function pickAlerts(obj: Record<string, unknown>): ExecutiveAlert[] {
  const raw = obj.alerts ?? obj.notifications
  if (!Array.isArray(raw)) return []

  return raw
    .map((item) => {
      if (typeof item === 'string') return { message: item }
      if (item && typeof item === 'object') {
        const record = item as Record<string, unknown>
        const message =
          typeof record.message === 'string'
            ? record.message
            : typeof record.text === 'string'
              ? record.text
              : typeof record.title === 'string'
                ? record.title
                : null
        if (!message) return null
        return {
          message,
          severity: typeof record.severity === 'string' ? record.severity : undefined,
        }
      }
      return null
    })
    .filter((item): item is ExecutiveAlert => item !== null)
}

function pickTaxStatus(obj: Record<string, unknown>): ExecutiveTaxStatusItem[] | null {
  const raw = obj.tax_status ?? obj.taxStatus ?? obj.taxes
  if (raw === undefined || raw === null) return null
  if (!Array.isArray(raw)) {
    if (typeof raw === 'object') {
      return Object.entries(raw as Record<string, unknown>).map(([type, status]) => ({
        type,
        status: String(status),
      }))
    }
    return null
  }

  return raw
    .map((item) => {
      if (typeof item === 'string') return { type: item, status: 'unknown' }
      if (item && typeof item === 'object') {
        const record = item as Record<string, unknown>
        const type =
          typeof record.type === 'string'
            ? record.type
            : typeof record.tax_type === 'string'
              ? record.tax_type
              : null
        const status =
          typeof record.status === 'string'
            ? record.status
            : typeof record.state === 'string'
              ? record.state
              : 'unknown'
        if (!type) return null
        return {
          type,
          status,
          dueDate:
            typeof record.due_date === 'string'
              ? record.due_date
              : typeof record.dueDate === 'string'
                ? record.dueDate
                : null,
        }
      }
      return null
    })
    .filter((item): item is ExecutiveTaxStatusItem => item !== null)
}

/** Defensively map RPC payload — never invent values for missing fields. */
export function parseExecutiveDashboard(raw: unknown): ExecutiveDashboardData {
  if (!raw || typeof raw !== 'object') {
    return emptyExecutiveDashboard()
  }

  const root = raw as Record<string, unknown>
  const payload =
    root.data && typeof root.data === 'object'
      ? (root.data as Record<string, unknown>)
      : root

  const kpis =
    payload.kpis && typeof payload.kpis === 'object'
      ? (payload.kpis as Record<string, unknown>)
      : payload

  return {
    cashPosition: pickNumber(kpis, ['cash_position', 'cashPosition', 'cash']),
    revenue: pickNumber(kpis, ['revenue', 'revenue_period', 'period_revenue']),
    netProfit: pickNumber(kpis, ['net_profit', 'netProfit', 'profit']),
    activeProjects: pickNumber(kpis, [
      'active_projects',
      'activeProjects',
      'active_project_count',
    ]),
    taxStatus: pickTaxStatus(payload),
    alerts: pickAlerts(payload),
  }
}

export function isExecutiveDashboardEmpty(data: ExecutiveDashboardData): boolean {
  const kpisAllZeroOrNull =
    (data.cashPosition === null || data.cashPosition === 0) &&
    (data.revenue === null || data.revenue === 0) &&
    (data.netProfit === null || data.netProfit === 0) &&
    (data.activeProjects === null || data.activeProjects === 0)

  return kpisAllZeroOrNull && data.alerts.length === 0
}
