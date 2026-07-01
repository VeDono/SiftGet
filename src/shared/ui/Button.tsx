import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'outline' | 'dark'
const cls: Record<Variant, string> = {
  primary: 'btn-primary',
  outline: 'btn-outline',
  dark: 'btn-dark',
}

export function Button({
  variant = 'primary',
  className = '',
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button className={`${cls[variant]} ${className}`.trim()} {...rest}>
      {children}
    </button>
  )
}

export function PlayGlyph() {
  return <span className="btn-primary__play" />
}

export function Dots() {
  return (
    <span className="dots">
      <span />
      <span />
      <span />
    </span>
  )
}
