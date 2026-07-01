import { useRef, useState } from 'react'
import { useI18n } from '@/app/providers/i18n'
import { Toggle } from '@/shared/ui/Toggle'
import { useSettings, usePatchSettings } from '../model/use-settings'

function Row({
  title,
  desc,
  on,
  onChange,
  last,
}: {
  title: string
  desc: string
  on: boolean
  onChange: (v: boolean) => void
  last?: boolean
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 py-4 ${last ? '' : 'border-b border-track'}`}
    >
      <div>
        <div className="text-[15px] font-bold leading-tight text-ink">{title}</div>
        <div className="mt-[3px] text-[13px] text-muted">{desc}</div>
      </div>
      <Toggle on={on} onChange={onChange} label={title} />
    </div>
  )
}

export function BehaviorToggles() {
  const { t } = useI18n()
  const { data: settings } = useSettings()
  const patch = usePatchSettings()
  const [historyDenied, setHistoryDenied] = useState(false)
  const historyBusy = useRef(false)

  if (!settings) return null

  const onToggleHistory = async (next: boolean) => {
    if (historyBusy.current) return
    historyBusy.current = true
    try {
      setHistoryDenied(false)
      if (next) {
        // Called synchronously in the click handler → keeps the user gesture intact.
        const granted = await chrome.permissions.request({ permissions: ['history'] })
        if (!granted) {
          setHistoryDenied(true)
          return
        }
        await patch.mutateAsync({ useHistory: true })
      } else {
        await patch.mutateAsync({ useHistory: false })
        try {
          await chrome.permissions.remove({ permissions: ['history'] })
        } catch {
          /* ignore */
        }
      }
    } finally {
      historyBusy.current = false
    }
  }

  return (
    <div className="flex flex-col">
      <Row
        title={t('beh_newtab_title')}
        desc={t('beh_newtab_desc')}
        on={settings.openInNewTab}
        onChange={(v) => patch.mutate({ openInNewTab: v })}
      />
      <Row
        title={t('beh_shorts_title')}
        desc={t('beh_shorts_desc')}
        on={settings.includeShorts}
        onChange={(v) => patch.mutate({ includeShorts: v })}
      />
      <div>
        <Row
          title={t('beh_history_title')}
          desc={t('beh_history_desc')}
          on={settings.useHistory}
          onChange={onToggleHistory}
        />
        {historyDenied && <div className="pb-3.5 text-xs text-red">{t('history_denied')}</div>}
      </div>
      <div className="border-b border-track">
        <Row
          title={t('beh_ytwatched_title')}
          desc={t('beh_ytwatched_desc')}
          on={settings.useYouTubeWatched}
          onChange={(v) => patch.mutate({ useYouTubeWatched: v })}
          last
        />
        {settings.useYouTubeWatched && (
          <div className="flex items-center justify-between gap-4 pb-4">
            <div className="text-[13px] text-muted">{t('threshold_label')}</div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={50}
                max={100}
                step={5}
                value={settings.watchedThreshold}
                onChange={(e) => patch.mutate({ watchedThreshold: Number(e.target.value) })}
                className="w-[140px] accent-teal"
              />
              <span className="w-10 text-right font-mono text-sm font-bold text-ink">
                {settings.watchedThreshold}%
              </span>
            </div>
          </div>
        )}
      </div>
      <Row
        title={t('beh_ignore_title')}
        desc={t('beh_ignore_desc')}
        on={settings.ignoreWatched}
        onChange={(v) => patch.mutate({ ignoreWatched: v })}
        last
      />
    </div>
  )
}
