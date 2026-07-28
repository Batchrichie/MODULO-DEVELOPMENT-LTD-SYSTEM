import { Link } from 'react-router-dom'
import '../../styles/executive-dashboard.css'

const REPORTS = [
  {
    title: 'Profit & Loss Statement',
    description: 'Revenue, cost of sales, and operating profit for the reporting period.',
    path: '/executive/reports/income-statement',
  },
  {
    title: 'Statement of Financial Position',
    description: 'Assets, liabilities, and equity snapshot for a single date.',
    path: '/executive/reports/statement-of-financial-position',
  },
  {
    title: 'Cash Flow Statement',
    description: 'Operating, investing, and financing cash flows over time.',
    path: '/executive/reports/cash-flow-statement',
  },
  {
    title: 'Statement of Changes in Equity',
    description: 'Movements in share capital, retained earnings, and reserves.',
    path: '/executive/reports/statement-of-changes-in-equity',
  },
]

export function ReportsPage() {
  return (
    <article className="exec-dash exec-screen">
      <header className="exec-screen__header">
        <p className="exec-dash__breadcrumb">Executive Dashboard</p>
        <h1>Executive Reports</h1>
        <p>Navigate executive financial statements with confidence.</p>
      </header>

      <section className="exec-screen__grid">
        {REPORTS.map((report) => (
          <article key={report.title} className="exec-screen__card">
            <h2>{report.title}</h2>
            <p>{report.description}</p>
            <Link to={report.path} className="button button--secondary">
              View report
            </Link>
          </article>
        ))}
      </section>
    </article>
  )
}
