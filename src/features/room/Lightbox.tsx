import { Image as ImageIcon, X } from 'lucide-react'
import { useLocale } from '@/contexts/LocaleContext'
import type { ImageItem } from './types'

export default function Lightbox({ item, onClose }: { item: ImageItem | null; onClose: () => void }) {
  const { t } = useLocale()
  if (!item) return null

  return (
    <div className="fixed inset-0 z-[200] bg-[rgba(12,12,12,0.92)] flex flex-col anim-fade-in" onClick={onClose}>
      <div className="flex items-center justify-between px-5 py-4 text-white">
        <div>
          <div className="text-[13px] font-semibold">{item.title}</div>
          <div className="text-[11px] text-white/55">{t('sharedByNarrator')}</div>
        </div>
        <button className="text-white/80 hover:text-white" aria-label={t('closeAction')}>
          <X size={20} />
        </button>
      </div>
      <div className="flex-1 mx-4 rounded-2xl overflow-hidden flex items-center justify-center anim-lb-img">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.title} className="w-full h-full object-contain" />
        ) : (
          <div className="w-full h-full striped-dark flex flex-col items-center justify-center gap-2.5 text-white/40">
            <ImageIcon size={28} />
            <span className="text-[11px] font-medium tracking-[0.12em] uppercase">{t('fullscreenImage')}</span>
          </div>
        )}
      </div>
      {item.body && (
        <div className="px-5 py-5 text-center text-[13px] leading-relaxed italic text-white/80 max-w-[680px] mx-auto">
          «{item.body}»
        </div>
      )}
    </div>
  )
}
