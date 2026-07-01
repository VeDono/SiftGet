interface Props {
  on: boolean
  onChange: (next: boolean) => void
  disabled?: boolean
  label?: string
}

export function Toggle({ on, onChange, disabled = false, label }: Props) {
  return (
    <button
      type="button"
      className="toggle"
      data-on={on ? 'true' : 'false'}
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={() => !disabled && onChange(!on)}
    >
      <span className="toggle__knob" />
    </button>
  )
}
