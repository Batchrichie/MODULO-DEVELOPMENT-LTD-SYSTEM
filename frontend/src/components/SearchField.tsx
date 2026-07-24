import '../styles/executive-dashboard.css'

interface SearchFieldProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function SearchField({
  value,
  onChange,
  placeholder = 'Search…',
  className = '',
}: SearchFieldProps) {
  return (
    <label className={`search-field${className ? ` ${className}` : ''}`}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m20 20-4.2-4.2m1.2-5.3a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z"
        />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
    </label>
  )
}
