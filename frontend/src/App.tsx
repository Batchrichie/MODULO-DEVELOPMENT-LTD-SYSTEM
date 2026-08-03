import { Navigate, Route, Routes } from 'react-router-dom'
import { RouteGuard } from './components/RouteGuard'
import { useAuth } from './context/AuthContext'
import { PORTAL_NAV } from './config/navigation'
import { getPortalPathForRole } from './config/roles'
import { PortalLayout } from './layouts/PortalLayout'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { LoginPage } from './pages/LoginPage'
import { ExecutiveDashboardPage } from './pages/executive/ExecutiveDashboardPage'
import { AccountantCoaPage } from './pages/accountant/AccountantCoaPage'
import { AccountantDashboardPage } from './pages/accountant/AccountantDashboardPage'
import { AccountantGeneralLedgerPage } from './pages/accountant/AccountantGeneralLedgerPage'
import { AccountantJournalEntriesPage } from './pages/accountant/AccountantJournalEntriesPage'
import { AccountantTrialBalancePage } from './pages/accountant/AccountantTrialBalancePage'
import { AccountantBudgetVsActualPage } from './pages/accountant/AccountantBudgetVsActualPage'
import { InvoicingPage } from './pages/accountant/InvoicingPage'
import { CustomerPaymentsPage } from './pages/accountant/CustomerPaymentsPage'
import { ExpensesPage } from './pages/accountant/ExpensesPage'
import { SupplierPaymentsPage } from './pages/accountant/SupplierPaymentsPage'
import { PettyCashPage } from './pages/accountant/PettyCashPage'
import { CustomerRecordsPage } from './pages/accountant/CustomerRecordsPage'
import { SupplierRecordsPage } from './pages/accountant/SupplierRecordsPage'
import { EmployeeRecordsPage } from './pages/accountant/EmployeeRecordsPage'
import { PayrollPage } from './pages/accountant/PayrollPage'
import { AssetRegisterPage } from './pages/accountant/AssetRegisterPage'
import { PpeSchedulePage } from './pages/accountant/PpeSchedulePage'
import { DepreciationJournalPage } from './pages/accountant/DepreciationJournalPage'
import { RentalsPage } from './pages/accountant/RentalsPage'
import { TaxPage } from './pages/accountant/TaxPage'
import { AccountantProjectsPage } from './pages/accountant/AccountantProjectsPage'
import { MyProjectsPage } from './pages/projectManager/MyProjectsPage'
import { DocumentsPage } from './pages/projectManager/DocumentsPage'
import { PayslipsPage } from './pages/employee/PayslipsPage'
import { MyProfilePage } from './pages/employee/MyProfilePage'
import { LeavePage } from './pages/employee/LeavePage'
import { AssignedProjectsPage } from './pages/employee/AssignedProjectsPage'
import { AnnouncementsPage } from './pages/employee/AnnouncementsPage'
import { CompletionAssessmentsPage } from './pages/projectManager/CompletionAssessmentsPage'
import { BudgetTrackingPage } from './pages/projectManager/BudgetTrackingPage'
import { ProjectCostingPage } from './pages/projectManager/ProjectCostingPage'
import { SiteReportsPage } from './pages/projectManager/SiteReportsPage'
import { SiteReportsReviewPage as AccountantSiteReportsReviewPage } from './pages/accountant/SiteReportsReviewPage'
import { AuditLogPage } from './pages/admin/AuditLogPage'
import { RolesPermissionsPage } from './pages/admin/RolesPermissionsPage'
import { SecurityMonitoringPage } from './pages/admin/SecurityMonitoringPage'
import { SystemSettingsPage } from './pages/admin/SystemSettingsPage'
import { UserManagementPage } from './pages/admin/UserManagementPage'
import { FinancialOverviewPage } from './pages/executive/FinancialOverviewPage'
import { ProjectPortfolioPage } from './pages/executive/ProjectPortfolioPage'
import { EquipmentRentalsPage } from './pages/executive/EquipmentRentalsPage'
import { TaxCompliancePage } from './pages/executive/TaxCompliancePage'
import { ReportsPage } from './pages/executive/ReportsPage'
import { StatementOfChangesInEquityPage } from './pages/executive/StatementOfChangesInEquityPage'
import { StatementOfFinancialPositionPage } from './pages/executive/StatementOfFinancialPositionPage'
import { CashFlowStatementPage } from './pages/executive/CashFlowStatementPage'
import { IncomeStatementPage } from './pages/executive/IncomeStatementPage'
import { AlertsPage } from './pages/executive/AlertsPage'
import { createPortalChildRoutes } from './routes/portalRoutes'

function RootRedirect() {
  const { session, appUser, loading } = useAuth()

  if (loading) {
    return (
      <div className="route-guard-loading" role="status">
        <p className="skeleton">Loading...</p>
      </div>
    )
  }

  if (session && appUser) {
    return <Navigate to={getPortalPathForRole(appUser.role)} replace />
  }

  return <Navigate to="/login" replace />
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      <Route
        path="/executive/*"
        element={
          <RouteGuard allowedRoles={['CEO']}>
            <PortalLayout role="CEO" />
          </RouteGuard>
        }
      >
        {createPortalChildRoutes(PORTAL_NAV.CEO, {
          '/executive/dashboard': <ExecutiveDashboardPage />,
          '/executive/financial-overview': <FinancialOverviewPage />,
          '/executive/project-portfolio': <ProjectPortfolioPage />,
          '/executive/equipment-rentals': <EquipmentRentalsPage />,
          '/executive/tax-compliance': <TaxCompliancePage />,
          '/executive/reports': <ReportsPage />,
          '/executive/reports/income-statement': <IncomeStatementPage />,
          '/executive/reports/statement-of-financial-position': <StatementOfFinancialPositionPage />,
          '/executive/reports/cash-flow-statement': <CashFlowStatementPage />,
          '/executive/reports/statement-of-changes-in-equity': <StatementOfChangesInEquityPage />,
          '/executive/alerts': <AlertsPage />,
        })}
      </Route>

      <Route
        path="/accountant/*"
        element={
          <RouteGuard allowedRoles={['Accountant']}>
            <PortalLayout role="Accountant" />
          </RouteGuard>
        }
      >
        {createPortalChildRoutes(PORTAL_NAV.Accountant, {
          '/accountant/dashboard': <AccountantDashboardPage />,
          '/accountant/chart-of-accounts': <AccountantCoaPage />,
          '/accountant/journal-entries': <AccountantJournalEntriesPage />,
          '/accountant/general-ledger': <AccountantGeneralLedgerPage />,
          '/accountant/trial-balance': <AccountantTrialBalancePage />,
          '/accountant/invoicing-expenses/invoicing': <InvoicingPage />,
          '/accountant/invoicing-expenses/customer-payments': <CustomerPaymentsPage />,
          '/accountant/invoicing-expenses/expenses': <ExpensesPage />,
          '/accountant/invoicing-expenses/supplier-payments': <SupplierPaymentsPage />,
          '/accountant/banking-cash/petty-cash': <PettyCashPage />,
          '/accountant/contacts/customers': <CustomerRecordsPage />,
          '/accountant/contacts/suppliers': <SupplierRecordsPage />,
          '/accountant/payroll-hr/employee-records': <EmployeeRecordsPage />,
          '/accountant/payroll-hr/payroll': <PayrollPage />,
          '/accountant/asset-management/asset-register': <AssetRegisterPage />,
          '/accountant/asset-management/ppe-schedule': <PpeSchedulePage />,
          '/accountant/asset-management/depreciation-journal': <DepreciationJournalPage />,
          '/accountant/asset-management/rentals': <RentalsPage />,
          '/accountant/site-reports-review': <AccountantSiteReportsReviewPage />,
          '/accountant/projects': <AccountantProjectsPage />,
          '/accountant/compliance-tax/tax': <TaxPage />,
          '/accountant/budgeting/budget-vs-actual': <AccountantBudgetVsActualPage />,
        })}
      </Route>

      <Route
        path="/project-manager/*"
        element={
          <RouteGuard allowedRoles={['ProjectManager']}>
            <PortalLayout role="ProjectManager" />
          </RouteGuard>
        }
      >
        {createPortalChildRoutes(PORTAL_NAV.ProjectManager, {
          '/project-manager/my-projects': <MyProjectsPage />,
          '/project-manager/project-costing': <ProjectCostingPage />,
          '/project-manager/completion-assessments': <CompletionAssessmentsPage />,
          '/project-manager/budget-tracking': <BudgetTrackingPage />,
          '/project-manager/site-reports': <SiteReportsPage />,
          '/project-manager/documents': <DocumentsPage />,
        })}
      </Route>

      <Route
        path="/employee/*"
        element={
          <RouteGuard allowedRoles={['Employee']}>
            <PortalLayout role="Employee" />
          </RouteGuard>
        }
      >
        {createPortalChildRoutes(PORTAL_NAV.Employee, {
          '/employee/my-profile': <MyProfilePage />,
          '/employee/payslips': <PayslipsPage />,
          '/employee/leave': <LeavePage />,
          '/employee/assigned-projects': <AssignedProjectsPage />,
          '/employee/announcements': <AnnouncementsPage />,
        })}
      </Route>

      <Route
        path="/admin/*"
        element={
          <RouteGuard allowedRoles={['Admin']}>
            <PortalLayout role="Admin" />
          </RouteGuard>
        }
      >
        {createPortalChildRoutes(PORTAL_NAV.Admin, {
          '/admin/user-management': <UserManagementPage />,
          '/admin/roles-permissions': <RolesPermissionsPage />,
          '/admin/audit-log': <AuditLogPage />,
          '/admin/security-monitoring': <SecurityMonitoringPage />,
          '/admin/system-settings': <SystemSettingsPage />,
        })}
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
