import { useId } from 'react'

// App mark: glossy cabinet tile + fanned amber deck + play button, crisp at any size.
export function Logo({ size = 52 }: { size?: number }) {
  const uid = useId().replace(/:/g, '')
  const id = (n: string) => `${n}-${uid}`
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', flex: 'none' }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={id('tile')} x1="120" y1="0" x2="392" y2="512" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#463857" />
          <stop offset="0.46" stopColor="#2C2239" />
          <stop offset="1" stopColor="#1D1526" />
        </linearGradient>
        <linearGradient id={id('front')} x1="150" y1="150" x2="372" y2="372" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#F9C468" />
          <stop offset="0.55" stopColor="#E7A23A" />
          <stop offset="1" stopColor="#D98F27" />
        </linearGradient>
        <linearGradient id={id('back')} x1="150" y1="150" x2="372" y2="372" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#C4842B" />
          <stop offset="1" stopColor="#9E6A1E" />
        </linearGradient>
        <linearGradient id={id('mid')} x1="150" y1="150" x2="372" y2="372" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#DD9E3E" />
          <stop offset="1" stopColor="#B87C24" />
        </linearGradient>
        <linearGradient id={id('gloss')} x1="256" y1="12" x2="256" y2="250" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.24" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        <clipPath id={id('clip')}>
          <rect x="0" y="0" width="512" height="512" rx="116" />
        </clipPath>
      </defs>
      <rect x="0" y="0" width="512" height="512" rx="116" fill={`url(#${id('tile')})`} />
      <g clipPath={`url(#${id('clip')})`}>
        <g transform="rotate(-13 256 256) translate(-40 24)">
          <rect x="140" y="140" width="232" height="232" rx="56" fill={`url(#${id('back')})`} />
        </g>
        <g transform="rotate(11 256 256) translate(40 -16)">
          <rect x="140" y="140" width="232" height="232" rx="56" fill={`url(#${id('mid')})`} />
        </g>
        <rect x="140" y="140" width="232" height="232" rx="56" fill={`url(#${id('front')})`} />
        <path d="M222 196 L222 316 L318 256 Z" fill="#2A1F36" />
      </g>
      <rect x="36" y="10" width="440" height="236" rx="104" fill={`url(#${id('gloss')})`} clipPath={`url(#${id('clip')})`} />
      <rect x="1.5" y="1.5" width="509" height="509" rx="114.5" fill="none" stroke="#FFFFFF" strokeOpacity="0.1" strokeWidth="3" />
    </svg>
  )
}
