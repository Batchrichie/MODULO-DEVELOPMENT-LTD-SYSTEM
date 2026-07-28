import { PendingBackendNotice } from '../../components/PendingBackendNotice'
import '../../styles/executive-dashboard.css'

const REPORTS = [
  {
    title: 'Income Statement (P&L)',
    description: 'A view of revenue, expenses, and profit for the reporting period.',
  },
  {
    title: 'Statement of Financial Position',
    description: 'A view of assets, liabilities, and equity for a single date.',
  },
  {
    title: 'Cash Flow Statement',
    description: 'A view of operating, investing, and financing cash flows.',
  },
  {
    title: 'Statement of Changes in Equity',
    description: 'A view of equity movements over the reporting period.',
  },
]

export function ReportsPage() {
  return (
    <article className="exec-dash exec-screen">
      <header className="exec-screen__header">
        <p className="exec-dash__breadcrumb">Executive Dashboard</p>
        <h1>Reports</h1>
        <p>Landing page for the IFRS statement reports.</p>
      </header>

      <section className="exec-screen__grid">
        {REPORTS.map((report) => (
          <article key={report.title} className="exec-screen__card">
            <h2>{report.title}</h2>
            <p>{report.description}</p>
            <button type="button" className="button button--secondary" disabled>
              View report
            </button>
            <PendingBackendNotice
              inline
              title="Detailed reports pending backend"
              description="Detailed report views will be available in a future update."
            />
          </article>
        ))}
      </section>
    </article>
  )
}
