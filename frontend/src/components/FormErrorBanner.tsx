interface FormErrorBannerProps {
  message: string | null | undefined
  label?: string
}

export function FormErrorBanner({ message, label = 'Error' }: FormErrorBannerProps) {
  if (!message) return null
  return (
    <div
      className="exec-dash__state-card exec-dash__state-card--error exec-dash__state-card--inline"
      role="alert"
    >
      <h2 className="exec-dash__state-title">{label}</h2>
      <p className="exec-dash__state-message">{message}</p>
    </div>
  )
}
