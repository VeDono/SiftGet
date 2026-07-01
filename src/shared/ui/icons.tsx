// Small shared icon components + the popup's settings (gear) button.

export function RerollIcon() {
  // play glyph inside double circular arrows = "pick another"
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46A7.93 7.93 0 0 0 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74A7.93 7.93 0 0 0 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"
        fill="currentColor"
      />
      <path d="M10.6 9.8v4.4l3.4-2.2z" fill="currentColor" />
    </svg>
  )
}

export function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7h12zM10 11v6M14 11v6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function UaFlag() {
  return (
    <svg
      width="21"
      height="19"
      viewBox="0 0 48 44"
      style={{ flex: 'none', display: 'block', filter: 'drop-shadow(0 1px 1.5px rgba(0,0,0,.45))' }}
      aria-hidden="true"
    >
      <rect x="3.4" y="3" width="2.6" height="38" rx="1.3" fill="#B9AE9C" />
      <circle cx="4.7" cy="3.4" r="3" fill="#E8A63C" />
      <path d="M6,7 C11,3 15,3 20,6 C25,9 31,9 36,5 C39,3 42,4 44,5 L44,15 C42,14 39,13 36,15 C31,19 25,19 20,16 C15,13 11,13 6,17 Z" fill="#2E77D0" />
      <path d="M6,17 C11,13 15,13 20,16 C25,19 31,19 36,15 C39,13 42,14 44,15 L44,25 C42,24 39,23 36,25 C31,29 25,29 20,26 C15,23 11,23 6,27 Z" fill="#F5C63B" />
      <path d="M6,7 C11,3 15,3 20,6 C25,9 31,9 36,5 C39,3 42,4 44,5 L44,9 C42,8 39,7 36,9 C31,13 25,13 20,10 C15,7 11,7 6,11 Z" fill="rgba(255,255,255,0.2)" />
    </svg>
  )
}

export function GearButton({ title, onClick }: { title: string; onClick: () => void }) {
  const dots = [{ left: 2 }, { right: 2 }, { left: 6 }]
  return (
    <button
      title={title}
      aria-label={title}
      onClick={onClick}
      className="flex h-[30px] w-[30px] flex-none cursor-pointer flex-col justify-center gap-1 rounded-lg border-0 bg-cream/12 px-1.5 transition-colors hover:bg-cream/20"
    >
      {dots.map((pos, i) => (
        <span key={i} className="relative h-0.5 rounded-sm bg-cream">
          <i
            className="absolute -top-0.5 block h-1.5 w-1.5 rounded-full border border-ink bg-amber"
            style={pos}
          />
        </span>
      ))}
    </button>
  )
}
