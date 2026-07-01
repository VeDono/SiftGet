import type { ReactNode } from 'react'
import { useI18n } from '@/app/providers/i18n'
import { UaFlag } from '@/shared/ui/icons'

const AUTHOR = {
  name: 'Sergey Emelyanov',
  repo: 'https://github.com/VeDono/SiftGet',
  linkedin: 'https://www.linkedin.com/in/sergey-emelyanov-18082b27a/',
  github: 'https://github.com/VeDono',
  twitter: 'https://x.com/SergeyEDev',
}

function Social({
  href,
  dot,
  square,
  children,
}: {
  href: string
  dot: string
  square?: boolean
  children: ReactNode
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-[7px] rounded-[10px] bg-cream px-[15px] py-2.5 text-[13px] font-bold text-ink no-underline transition-transform hover:-translate-y-px"
    >
      <span
        className={`h-[7px] w-[7px] flex-none ${square ? 'rounded-sm' : 'rounded-full'}`}
        style={{ background: dot }}
      />
      {children} <span className="font-mono font-bold text-muted">↗</span>
    </a>
  )
}

export function About() {
  const { t } = useI18n()
  return (
    <div className="flex flex-wrap items-start justify-between gap-[18px] rounded-2xl bg-ink px-6 py-[22px]">
      <div className="flex flex-col">
        <span className="text-[19px] font-extrabold leading-none text-cream">{AUTHOR.name}</span>
        <div className="mt-1.5 font-mono text-[11px] leading-none tracking-[0.5px] text-muted-dark">
          {t('about_role')}
        </div>
        <span className="mt-[18px] inline-flex items-center gap-[7px] self-start rounded-full bg-cream/10 px-2.5 py-[5px]">
          <UaFlag />
          <span className="font-mono text-[10px] font-bold leading-none tracking-[0.5px] text-[#eae1d0]">
            {t('about_madein')}
          </span>
        </span>
      </div>
      <div className="flex flex-col items-end gap-2.5">
        <a
          href={AUTHOR.repo}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-[10px] border border-cream/20 bg-cream/10 px-[15px] py-2.5 text-xs font-bold text-cream no-underline transition-colors hover:bg-cream/20"
        >
          <span className="font-mono text-[11px] font-bold text-amber">&lt;/&gt;</span>
          {t('about_repo')} <span className="font-mono font-bold text-muted-dark">↗</span>
        </a>
        <div className="flex flex-wrap justify-end gap-[9px]">
          <Social href={AUTHOR.linkedin} dot="#2A6FDB" square>
            {t('about_linkedin')}
          </Social>
          <Social href={AUTHOR.github} dot="#241B2E">
            {t('about_github')}
          </Social>
          <Social href={AUTHOR.twitter} dot="#2C7A6B" square>
            {t('about_twitter')}
          </Social>
        </div>
      </div>
    </div>
  )
}
