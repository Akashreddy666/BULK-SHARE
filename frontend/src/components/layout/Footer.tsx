import React from 'react'
import { ShoppingBag, ShieldCheck, Users, PackageCheck } from 'lucide-react'

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-800 text-sm">
          {/* Brand Column */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">
                BULK<span className="text-brand-400">SHARE</span>
              </span>
            </div>
            <p className="text-slate-400 text-xs sm:text-sm max-w-md leading-relaxed">
              BULK SHARE enables households in the same neighborhood to pool their grocery demand and purchase sealed retail-sized staples directly from wholesalers at quantity discounts.
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-500 pt-2">
              <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-brand-400" /> Sealed retail packs only</span>
              <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-brand-400" /> 100% Private household carts</span>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-xs uppercase tracking-wider">Platform Features</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#how-it-works" className="hover:text-white transition-colors">How Community Buying Works</a></li>
              <li><a href="#calculator" className="hover:text-white transition-colors">Wholesale Savings Calculator</a></li>
              <li><a href="#groups" className="hover:text-white transition-colors">Public Neighborhood Groups</a></li>
              <li><a href="#rules" className="hover:text-white transition-colors">Transparent Pricing & Rules</a></li>
            </ul>
          </div>

          {/* Demonstration Notice */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-xs uppercase tracking-wider">College Demonstration</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              This application is configured for functional evaluation with simulated transactions, fictional suppliers, and sample catalog items.
            </p>
            <div className="mt-3 inline-block px-2.5 py-1 rounded bg-slate-800 text-amber-300 text-[11px] font-mono border border-slate-700">
              Milestone 1 — MVP Foundation
            </div>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 BULK SHARE Platform. Built with React, TypeScript, FastAPI & Supabase.</p>
          <div className="flex items-center gap-6">
            <span>Demo Mode Active</span>
            <span>Bengaluru (Indiranagar / Koramangala)</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
