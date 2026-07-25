import { AdminPageFrame } from './AdminPageFrame'

const matrix = [
  {
    role: 'CEO / MD',
    access:
      'No access to get_records/create_record/update_record for any resource. Confirmed access is limited to dashboard_executive and six report_* RPCs (trial balance, income statement, SOFP, cash flow, ageing, tax — all require CEO or Accountant), plus report_budget_vs_actual and report_project_profitability (require Accountant, CEO, or ProjectManager). No transactional writes anywhere.',
  },
  {
    role: 'Accountant',
    access:
      'Full read/write via get_records/create_record/update_record on accounts, customers, suppliers, employees, projects, equipment, plus assets via assets_create/assets_dispose. Sole role permitted to call every transactional RPC (invoicing, payments, payroll run create/approve/reject/pay, asset depreciation/disposal, completion assessment approve/reject, tax rate updates) and all reports. Cannot call completion_assessment_submit — that is Project Manager only.',
  },
  {
    role: 'Project Manager',
    access:
      "get_records and update_record on projects only, scoped to projects where project_manager_id matches the caller. No create_record access at all. Exclusively holds completion_assessment_submit for owned projects (rejects percent_complete below the last approved value). Scoped access to report_budget_vs_actual and report_project_profitability.",
  },
  {
    role: 'Employee',
    access:
      "get_records on employees only, restricted to the signed-in employee's own record. No write access anywhere. Known gap: no payslip-retrieval RPC exists anywhere in the api schema today, so payslip viewing cannot be implemented until one is built — this is a new, previously unrecorded gap, not one of the four already listed in the Reconciliation Memo.",
  },
  {
    role: 'Admin',
    access:
      'No role gate anywhere in the api schema references Admin. Confirmed zero backend RPC surface for this role today — every Admin screen in this portal is correctly a placeholder, not an undersell of real capability.',
  },
]

export function RolesPermissionsPage() {
  return (
    <AdminPageFrame
      eyebrow="Access governance"
      title="Roles & Permissions"
      description="This screen is read-only and reflects the role-scoping information from the reconciliation memo in RPC/resource terms."
      summary="Role scope is described from the memo, not from a superseded REST contract."
      badge="Read-only matrix"
      status="ready"
      note="Source: Reconciliation Memo item #1. The REST contract is superseded for this frontend build."
    >
      <div className="users-card__header">
        <div>
          <h2>Role → endpoint access</h2>
          <p>Access is summarized here as a static governance reference using the RPC/resource model that the reconciliation memo establishes.</p>
        </div>
      </div>
      <div style={{ padding: '0 21px 21px' }}>
        <table className="admin-screen-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '12px 10px', borderBottom: '1px solid var(--color-border)' }}>Role</th>
              <th style={{ textAlign: 'left', padding: '12px 10px', borderBottom: '1px solid var(--color-border)' }}>Endpoint access</th>
            </tr>
          </thead>
          <tbody>
            {matrix.map((row) => (
              <tr key={row.role}>
                <td style={{ padding: '12px 10px', borderBottom: '1px solid var(--color-border)' }}>{row.role}</td>
                <td style={{ padding: '12px 10px', borderBottom: '1px solid var(--color-border)' }}>{row.access}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminPageFrame>
  )
}
