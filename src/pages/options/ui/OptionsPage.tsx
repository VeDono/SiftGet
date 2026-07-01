import type { ReactNode } from 'react'
import { useI18n } from '@/app/providers/i18n'
import { Logo } from '@/shared/ui/Logo'
import { useSettings } from '@/features/settings/model/use-settings'
import { useChannels } from '@/features/channels/model/use-channels'
import { LanguageDropdown } from '@/features/settings/ui/LanguageDropdown'
import { BehaviorToggles } from '@/features/settings/ui/BehaviorToggles'
import { ApiKeyField } from '@/features/api-key/ui/ApiKeyField'
import { TrackedChannels } from '@/widgets/tracked-channels/ui/TrackedChannels'
import { Backup } from '@/widgets/backup/ui/Backup'
import { About } from '@/widgets/about/ui/About'

function SectionLabel({ n, right, children }: { n: string; right?: ReactNode; children: ReactNode }) {
  return (
    <div className="mb-3.5 flex items-center justify-between font-mono text-[11px] font-bold tracking-[2px] text-muted">
      <span>
        {n} · {children}
      </span>
      {right != null && <span>{right}</span>}
    </div>
  )
}

const Divider = () => <div className="my-8 h-px bg-track" />

export function OptionsPage() {
  const { t } = useI18n()
  const { data: settings } = useSettings()
  const { data: channels } = useChannels()

  if (!settings) return <div className="p-10 font-mono text-muted">…</div>

  return (
    <div className="flex min-h-screen justify-center bg-canvas px-6 pb-24 pt-14">
      <div className="w-full max-w-[820px] overflow-hidden rounded-[24px] border border-line bg-cream shadow-[0_24px_48px_-20px_rgba(36,27,46,0.4)]">
        <div className="flex items-center gap-4 bg-ink px-10 py-7">
          <Logo size={52} />
          <div>
            <div className="text-2xl font-black leading-none tracking-[-0.5px] text-cream">SiftGet</div>
            <div className="mt-1.5 font-mono text-xs leading-none tracking-[0.5px] text-muted-dark">
              {t('opt_subtitle')}
            </div>
          </div>
        </div>

        <div className="px-10 pb-10 pt-9">
          <SectionLabel n="00">{t('sec_language')}</SectionLabel>
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="text-[15px] font-bold text-ink">{t('language_title')}</div>
              <div className="mt-[3px] text-[13px] text-muted">{t('language_desc')}</div>
            </div>
            <div className="w-[236px] flex-none">
              <LanguageDropdown />
            </div>
          </div>

          <Divider />
          <SectionLabel n="01">{t('sec_apikey')}</SectionLabel>
          <ApiKeyField />

          <Divider />
          <SectionLabel n="02">{t('sec_behavior')}</SectionLabel>
          <BehaviorToggles />

          <Divider />
          <SectionLabel n="03" right={t('channels_count', { n: channels?.length ?? 0 })}>
            {t('sec_channels')}
          </SectionLabel>
          <TrackedChannels />

          <Divider />
          <SectionLabel n="04">{t('sec_backup')}</SectionLabel>
          <Backup />

          <Divider />
          <SectionLabel n="05">{t('sec_about')}</SectionLabel>
          <About />
        </div>
      </div>
    </div>
  )
}
