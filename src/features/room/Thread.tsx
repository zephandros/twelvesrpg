import { Fragment } from 'react'
import { useLocale } from '@/contexts/LocaleContext'
import { dayKey, isToday } from './format'
import {
  DayDivider,
  DiceCard,
  ImageEvent,
  LootCard,
  Msg,
  Narration,
  RequestCard,
  StateDivider,
} from './parts/threadParts'
import type { ImageItem, RequestItem, Role, ThreadItem } from './types'

interface ThreadProps {
  items: ThreadItem[]
  uid: string | undefined
  role: Role
  onOpenImage: (item: ImageItem) => void
  onTakeLoot: (id: string) => void
  onResolveRequest: (item: RequestItem) => void
}

function ThreadItemView({ item, uid, role, onOpenImage, onTakeLoot, onResolveRequest }: ThreadProps & { item: ThreadItem }) {
  switch (item.type) {
    case 'narration':
      return <Narration item={item} />
    case 'state':
      return <StateDivider item={item} />
    case 'msg':
      return <Msg item={item} mine={item.authorId === uid} />
    case 'dice':
      return <DiceCard item={item} mine={item.authorId === uid} />
    case 'image':
      return <ImageEvent item={item} onOpen={() => onOpenImage(item)} />
    case 'loot':
      return <LootCard item={item} onTake={() => onTakeLoot(item.id)} />
    case 'request':
      return <RequestCard item={item} canResolve={role === 'player' && !item.done} onResolve={() => onResolveRequest(item)} />
    default:
      return null
  }
}

export default function Thread(props: ThreadProps) {
  const { t } = useLocale()
  const { items } = props

  if (items.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-8 gap-1">
        <p className="text-sm text-ink-light">{t('emptyThread')}</p>
        <p className="text-xs text-ink-faint">{t('emptyThreadSub')}</p>
      </div>
    )
  }

  let lastDay = ''
  return (
    <>
      {items.map((item) => {
        const dk = dayKey(item.ts)
        const showDay = dk !== lastDay
        lastDay = dk
        const dayLabel = isToday(item.ts) ? t('today') : new Date(item.ts).toLocaleDateString()
        return (
          <Fragment key={item.id}>
            {showDay && <DayDivider label={dayLabel} />}
            <ThreadItemView {...props} item={item} />
          </Fragment>
        )
      })}
    </>
  )
}
