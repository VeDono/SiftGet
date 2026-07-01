import { useState } from 'react'
import { motion } from 'motion/react'
import type { Video } from '@/shared/types'

export type ReelMode = 'static' | 'spinning' | 'result' | 'jackpot'

const asTitle = (x: Video | string | undefined) => (typeof x === 'string' ? x : x?.title) || '—'
const asId = (x: Video | string | undefined) => (typeof x === 'object' ? x?.id : null)

function Thumb({ id }: { id: string | null }) {
  const [err, setErr] = useState(false)
  if (err || !id) return <div className="reel__thumb" />
  return (
    <img
      className="reel__thumb reel__thumb--img"
      src={`https://i.ytimg.com/vi/${id}/mqdefault.jpg`}
      onError={() => setErr(true)}
      referrerPolicy="no-referrer"
      alt=""
    />
  )
}

function Row({
  item,
  variant,
  thumb,
}: {
  item: Video | string | undefined
  variant?: 'dim' | 'win'
  thumb?: boolean
}) {
  return (
    <div className={`reel__row${variant ? ' reel__row--' + variant : ''}`}>
      {thumb ? <Thumb id={asId(item)} /> : <div className="reel__thumb" />}
      <div className="reel__title">{asTitle(item)}</div>
    </div>
  )
}

export function Reel({
  mode = 'static',
  items = [],
  picked = null,
}: {
  mode?: ReelMode
  items?: Video[]
  picked?: Video | null
}) {
  const list: (Video | string)[] = items.length ? items : ['—', '—', '—']

  if (mode === 'jackpot') {
    return (
      <div className="reel reel--jackpot">
        <div className="reel__seven">7</div>
        <div className="reel__seven">7</div>
        <div className="reel__seven">7</div>
        <span className="reel__payline-l" />
        <span className="reel__payline-r" />
      </div>
    )
  }

  if (mode === 'spinning') {
    const rows: (Video | string)[] = []
    for (let i = 0; i < 8; i++) rows.push(list[i % list.length])
    return (
      <div className="reel reel--spin">
        <div className="reel__strip">
          {rows.map((it, i) => (
            <Row key={i} item={it} />
          ))}
        </div>
        <div className="reel__band" />
        <span className="reel__payline-l" />
        <span className="reel__payline-r" />
      </div>
    )
  }

  if (mode === 'result' && picked) {
    const others = items.filter((v) => v.id !== picked.id)
    return (
      <div className="reel reel--static">
        <div className="reel__viewport">
          <Row item={others[0]} variant="dim" thumb />
          <motion.div
            className="reel__row reel__row--win"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 420, damping: 26 }}
          >
            <Thumb id={picked.id} />
            <div className="reel__title">{picked.title}</div>
          </motion.div>
          <Row item={others[1]} variant="dim" thumb />
        </div>
        <span className="reel__payline-l" />
        <span className="reel__payline-r" />
      </div>
    )
  }

  return (
    <div className="reel reel--static">
      <div className="reel__viewport">
        <Row item={list[0]} variant="dim" />
        <Row item={list[1] ?? list[0]} variant="win" />
        <Row item={list[2]} variant="dim" />
      </div>
      <span className="reel__payline-l" />
      <span className="reel__payline-r" />
    </div>
  )
}
