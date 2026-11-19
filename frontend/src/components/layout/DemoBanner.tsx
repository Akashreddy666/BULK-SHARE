import React from 'react'
import { Info, Sparkles } from 'lucide-react'

export const DemoBanner: React.FC = () => {
  return (
    <div className="bg-amber-500 text-slate-950 font-medium text-xs sm:text-sm px-4 py-2 flex items-center justify-center gap-2 border-b border-amber-600/30 shadow-sm relative z-40">
      <Sparkles className="w-4 h-4 shrink-0 text-slate-950" />
      <span className="font-semibold tracking-wide uppercase text-[11px] bg-slate-950 text-amber-400 px-2 py-0.5 rounded">
        Public Demo Mode
      </span>
      <span className="truncate">
        Sample grocery data & simulated transactions only. No real money, live procurement, or deliveries.
      </span>
    </div>
  )
}
