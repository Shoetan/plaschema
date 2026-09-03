import { RefreshCw, X } from 'lucide-react'
import { useRegisterSW } from 'virtual:pwa-register/react'

export function UpdatePrompt() {
  const { needRefresh: [needRefresh, setNeedRefresh], updateServiceWorker } = useRegisterSW()
  if (!needRefresh) return null

  return (
    <div className="relative mx-4 my-2 shrink-0 rounded-xl bg-neutral-950 p-4 text-white shadow-xl" role="status">
      <button className="absolute right-2 top-2 p-2" aria-label="Dismiss update" onClick={() => setNeedRefresh(false)}><X size={16} /></button>
      <p className="pr-6 text-sm font-bold">A new version is ready</p>
      <button className="mt-3 flex items-center gap-2 text-sm font-semibold text-brand" onClick={() => void updateServiceWorker(true)}>
        <RefreshCw size={15} /> Update now
      </button>
    </div>
  )
}
