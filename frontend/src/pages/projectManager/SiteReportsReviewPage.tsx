import { useEffect, useState } from 'react'
import { EmptyState } from '../../components/EmptyState'
import { FormErrorBanner } from '../../components/FormErrorBanner'
import { PendingBackendNotice } from '../../components/PendingBackendNotice'
import { fetchMySiteReports, type SiteReportRecord } from '../../lib/rpc/projectManager'
import styles from './SiteReportsReviewPage.module.css'

export function SiteReportsReviewPage() {
  const [reports, setReports] = useState<SiteReportRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void loadReports()
  }, [])

  async function loadReports() {
    setLoading(true)
    setError(null)

    const result = await fetchMySiteReports(1, 100)
    if (!result.ok) {
      setError(result.error ?? 'Unable to load submitted site reports')
      setReports([])
    } else if (!result.data?.success) {
      setError(result.data.error ?? 'Submitted site reports call returned unsuccessful status')
      setReports([])
    } else {
      setReports(result.data.data ?? [])
    }

    setLoading(false)
  }

  return (
    <article className={styles['sitereports']}>
      <header className={styles['sitereports__header']}>
        <div>
          <p className={styles['sitereports__eyebrow']}>Project Manager</p>
          <h2 className={styles['sitereports__title']}>Site Reports</h2>
          <p className={styles['sitereports__subtitle']}>View your submitted site inspection reports</p>
        </div>
      </header>

      <section className={styles['sitereports__content']}>
        {loading ? (
          <PendingBackendNotice />
        ) : error ? (
          error.includes('Could not find the function') ? (
            <PendingBackendNotice
              title="Pending backend"
              description="Site reports functionality is not yet available from the backend."
            />
          ) : (
            <FormErrorBanner message={error} />
          )
        ) : !reports.length ? (
          <EmptyState title="No pending site reports" description="There are no pending site reports at this time." />
        ) : (
          <div className={styles['sitereports__table-wrapper']}>
            <table className={styles['sitereports__table']}>
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Report Date</th>
                  <th>Status</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={`${report.report_id}-${report.project_id}-${report.report_date}`}>
                    <td>{report.project_name ?? String(report.project_id ?? '—')}</td>
                    <td>{report.report_date ?? '—'}</td>
                    <td>{report.status ?? '—'}</td>
                    <td>{report.notes ? `${report.notes.slice(0, 80)}${report.notes.length > 80 ? '…' : ''}` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </article>
  )
}
