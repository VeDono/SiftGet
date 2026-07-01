import type { ReactNode } from 'react'
import { useI18n } from '@/app/providers/i18n'
import { STATUS, ERR, type ErrCode } from '@/shared/config/constants'
import { openOptions } from '@/shared/api/messaging'
import { resetWatched } from '@/entities/channel/api/channel-storage'
import { Button, PlayGlyph, Dots } from '@/shared/ui/Button'
import { RerollIcon } from '@/shared/ui/icons'
import { ChannelHeader } from '@/widgets/channel-header/ui/ChannelHeader'
import { Reel } from '@/widgets/reel/ui/Reel'
import { usePopupState } from '@/features/channel-state/model/use-popup-state'
import { useReel } from '@/features/pick-video/model/use-reel'
import { useSyncWatched } from '@/features/sync-watched/model/use-sync-watched'
import { useTrackChannel } from '@/features/track-channel/model/use-track-channel'

const LABEL = 'font-mono text-[10px] font-bold tracking-[2px] text-muted'
const CAPTION = 'mt-[11px] text-center font-mono text-[11px] leading-[1.3] text-muted'

function Frame({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-[500px] w-[360px] flex-col overflow-hidden rounded-[18px] bg-cream">
      {children}
    </div>
  )
}

function Counter({ watched, total, done }: { watched: number; total: number; done: boolean }) {
  return (
    <div className="font-mono text-ink">
      <span className={`text-[26px] font-bold ${done ? 'text-teal' : ''}`}>{watched}</span>
      <span className={`text-[15px] ${done ? 'text-teal' : 'text-muted'}`}> / {total}</span>
    </div>
  )
}

const ERROR_MAP: Record<ErrCode, { body: string; action: 'settings' | 'retry' }> = {
  [ERR.API_KEY_MISSING]: { body: 'error_nokey_body', action: 'settings' },
  [ERR.KEY_INVALID]: { body: 'error_keyinvalid_body', action: 'settings' },
  [ERR.QUOTA_EXCEEDED]: { body: 'error_quota_body', action: 'retry' },
  [ERR.CHANNEL_NOT_FOUND]: { body: 'error_channel_body', action: 'retry' },
  [ERR.NETWORK]: { body: 'error_network_body', action: 'retry' },
  [ERR.UNKNOWN]: { body: 'error_generic_body', action: 'retry' },
}

export function PopupPage() {
  const { t } = useI18n()
  const { data, isLoading, refetch } = usePopupState()
  const state = data?.state
  const reel = useReel(state?.channel?.channelId, data?.tabId)
  const sync = useSyncWatched(data?.tabId)
  const track = useTrackChannel()

  // The "add to list" star only makes sense once a channel is cached (ready/empty/jackpot).
  const canTrack =
    !!state?.channel?.channelId &&
    (state?.status === STATUS.READY ||
      state?.status === STATUS.EMPTY ||
      state?.status === STATUS.ALL_WATCHED)
  const trackToggle = canTrack
    ? () => {
        const id = state?.channel?.channelId
        if (id) track.mutate({ channelId: id, tracked: !state?.tracked })
      }
    : undefined

  // ---- loading ----
  if (isLoading || !data || !state) {
    return (
      <Frame>
        <ChannelHeader channel={null} onSettings={openOptions} />
        <div className="flex min-h-0 flex-1 flex-col p-[18px] pb-5">
          <div className={`${LABEL} mb-2`}>{t('watched_label')}</div>
          <div className="progress mb-5">
            <div className="progress__fill" style={{ width: '0%' }} />
          </div>
          <div className={`${LABEL} mb-2`}>{t('reel_label')}</div>
          <div className="flex min-h-0 flex-1 [&>.reel]:min-h-0 [&>.reel]:w-full [&>.reel]:flex-1">
            <Reel mode="spinning" items={[]} />
          </div>
          <Button disabled className="mt-[18px]">
            <Dots />
            {t('loading_title')}
          </Button>
          <div className={CAPTION}>{t('loading_caption')}</div>
        </div>
      </Frame>
    )
  }

  // ---- no channel ----
  if (state.status === STATUS.NO_CHANNEL) {
    return (
      <Frame>
        <div className="flex h-14 flex-none items-center gap-[11px] bg-ink px-3.5">
          <div className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-[9px] bg-cream/10 font-mono text-[15px] font-bold text-muted-dark">
            ?
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold leading-[1.1] text-cream">{t('nochannel_head_title')}</div>
            <div className="mt-0.5 font-mono text-[10px] leading-[1.2] tracking-[0.5px] text-muted-dark">
              {t('nochannel_head_sub')}
            </div>
          </div>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center p-7 text-center">
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-[20px] bg-ink shadow-[inset_0_6px_16px_rgba(0,0,0,0.4)]">
            <div
              className="h-[34px] w-[52px] rounded-md border border-dashed border-[#6b6076]"
              style={{ background: 'repeating-linear-gradient(45deg,#3a3047,#3a3047 6px,#332a40 6px,#332a40 12px)' }}
            />
          </div>
          <div className="mb-2.5 text-xl font-extrabold leading-tight text-ink">{t('nochannel_title')}</div>
          <p className="m-0 mb-6 max-w-[250px] text-sm leading-[1.5] text-text-2">{t('nochannel_body')}</p>
          <div className="inline-flex items-center gap-2 rounded-full bg-cream-2 px-4 py-[9px] font-mono text-xs font-bold tracking-[0.5px] text-muted">
            youtube.com/@<span className="text-ink">…</span>
          </div>
        </div>
      </Frame>
    )
  }

  // ---- error ----
  if (state.status === STATUS.ERROR) {
    const map = ERROR_MAP[state.code ?? ERR.UNKNOWN] ?? ERROR_MAP[ERR.UNKNOWN]
    const onAction = map.action === 'settings' ? openOptions : () => refetch()
    return (
      <Frame>
        <ChannelHeader
          channel={state.channel}
          onSettings={openOptions}
          tracked={state.tracked}
          onToggleTrack={trackToggle}
        />
        <div className="flex flex-1 flex-col p-6">
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="mb-[22px] flex h-[88px] w-[88px] items-center justify-center rounded-full border-2 border-red bg-red/10 font-sans text-[44px] font-bold leading-none text-red">
              !
            </div>
            <div className="mb-2.5 text-xl font-extrabold leading-tight text-ink">{t('error_title')}</div>
            <p className="m-0 mb-2 max-w-[260px] text-sm leading-[1.5] text-text-2">{t(map.body)}</p>
          </div>
          <Button variant="dark" onClick={onAction} className="mt-2">
            {map.action === 'settings' ? t('error_open_settings') : t('error_retry')}{' '}
            <span className="font-mono font-bold">→</span>
          </Button>
          <div className={CAPTION}>
            {t('error_code')} <span className="text-red">{state.code}</span>
          </div>
        </div>
      </Frame>
    )
  }

  // ---- empty ----
  if (state.status === STATUS.EMPTY) {
    return (
      <Frame>
        <ChannelHeader
          channel={state.channel}
          onSettings={openOptions}
          tracked={state.tracked}
          onToggleTrack={trackToggle}
        />
        <div className="flex flex-1 flex-col p-6">
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="mb-[18px] flex h-[72px] w-[72px] items-center justify-center rounded-2xl bg-ink shadow-[inset_0_6px_16px_rgba(0,0,0,0.4)]">
              <div
                className="h-[26px] w-10 rounded-md border border-dashed border-[#6b6076]"
                style={{ background: 'repeating-linear-gradient(45deg,#3a3047,#3a3047 6px,#332a40 6px,#332a40 12px)' }}
              />
            </div>
            <div className="mb-2.5 text-xl font-extrabold leading-tight text-ink">{t('empty_title')}</div>
            <p className="m-0 max-w-[260px] text-sm leading-[1.5] text-text-2">
              {state.onlyShorts ? t('empty_body_shorts') : t('empty_body')}
            </p>
          </div>
          <Button variant="outline" onClick={() => refetch()} className="mt-2">
            ↻ {t('refresh')}
          </Button>
        </div>
      </Frame>
    )
  }

  // ---- jackpot ----
  if (state.status === STATUS.ALL_WATCHED) {
    const onReset = async () => {
      if (state.channel?.channelId) await resetWatched(state.channel.channelId)
      refetch()
    }
    return (
      <Frame>
        <ChannelHeader
          channel={state.channel}
          onSettings={openOptions}
          tracked={state.tracked}
          onToggleTrack={trackToggle}
        />
        <div className="flex min-h-0 flex-1 flex-col p-5 pb-[22px]">
          <div className="mb-2 flex items-end justify-between">
            <div className={`${LABEL} text-teal`}>{t('watched_label')}</div>
            <Counter watched={state.total ?? 0} total={state.total ?? 0} done />
          </div>
          <div className="progress mb-[22px]">
            <div className="progress__fill" data-done="true" style={{ width: '100%' }} />
          </div>
          <div className="flex min-h-0 flex-1 [&>.reel]:min-h-0 [&>.reel]:w-full [&>.reel]:flex-1">
            <Reel mode="jackpot" />
          </div>
          <div className="my-4 mb-3.5 text-center">
            <div className="text-[19px] font-extrabold leading-tight text-ink">{t('jackpot_title')}</div>
            <div className="mt-[5px] text-[13px] text-text-2">{t('jackpot_sub', { n: state.total ?? 0 })}</div>
          </div>
          <Button variant="outline" onClick={onReset}>
            ↺ {t('reset_progress')}
          </Button>
        </div>
      </Frame>
    )
  }

  // ---- ready (idle / spinning / picked) ----
  const spinning = reel.phase === 'spinning'
  const hasPick = !!reel.picked
  const total = state.total ?? 0
  const watched = state.watchedCount ?? 0
  const done = total > 0 && watched >= total
  const reelMode = spinning ? 'spinning' : hasPick ? 'result' : 'static'
  const caption = spinning
    ? state.settings?.ignoreWatched
      ? t('spinning_caption_any')
      : t('spinning_caption')
    : hasPick
      ? t('pick_caption')
      : state.settings?.ignoreWatched
        ? t('spin_caption_any')
        : t('spin_caption', { n: state.candidateCount ?? 0 })

  return (
    <Frame>
      <ChannelHeader
        channel={state.channel}
        onSettings={openOptions}
        tracked={state.tracked}
        onToggleTrack={trackToggle}
      />
      <div className="flex min-h-0 flex-1 flex-col p-[18px] pb-5">
        <div className="mb-2 flex items-end justify-between">
          <div className="flex items-center gap-2">
            <span className={LABEL}>{t('watched_label')}</span>
            {!spinning && !hasPick && (
              <button
                onClick={sync.sync}
                disabled={sync.running}
                title={t('sync_title')}
                className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.5px] text-cream shadow-sm transition-colors hover:bg-ink-hover disabled:opacity-70"
              >
                <span className={sync.running ? 'animate-bounce' : ''}>⇊</span>
                {sync.running ? t('syncing', { n: sync.found }) : t('sync_watched')}
              </button>
            )}
          </div>
          <Counter watched={watched} total={total} done={done} />
        </div>
        <div className="progress mb-5">
          <div
            className="progress__fill"
            data-done={done ? 'true' : 'false'}
            style={{ width: `${total ? (watched / total) * 100 : 0}%` }}
          />
        </div>

        <div className="mb-2 flex items-center justify-between">
          <span className={LABEL}>{spinning ? t('spinning_label') : t('reel_label')}</span>
        </div>
        <div className="flex min-h-0 flex-1 [&>.reel]:min-h-0 [&>.reel]:w-full [&>.reel]:flex-1">
          <Reel mode={reelMode} items={state.reel ?? []} picked={reel.picked} />
        </div>

        {state.refreshError && !spinning && (
          <div className="mt-2.5 text-center font-mono text-[11px] leading-[1.3] text-red">
            {t('refresh_failed')}
          </div>
        )}

        {spinning ? (
          <Button disabled className="mt-[18px]">
            <Dots />
            {t('spinning_button')}
          </Button>
        ) : hasPick ? (
          <div className="mt-[18px] flex gap-2.5">
            <button
              title={t('reroll_title')}
              aria-label={t('reroll_title')}
              onClick={reel.reroll}
              className="flex h-16 w-16 flex-none cursor-pointer items-center justify-center rounded-[16px] border-0 bg-ink text-amber transition-colors hover:bg-ink-hover active:translate-y-0.5"
            >
              <RerollIcon />
            </button>
            <Button className="flex-1" onClick={reel.open}>
              <PlayGlyph />
              {t('open_button')}
            </Button>
          </div>
        ) : (
          <Button className="mt-[18px]" onClick={reel.spin}>
            <PlayGlyph />
            {t('spin_button')}
          </Button>
        )}
        <div className={CAPTION}>{caption}</div>
      </div>
    </Frame>
  )
}
