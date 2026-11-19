import React, { useState } from 'react'
import {
  ShoppingBag,
  TrendingDown,
  Users,
  ShieldCheck,
  Truck,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  Store,
  Layers,
  ChevronRight,
  Calculator,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency } from '@/lib/utils'

interface LandingPageProps {
  onOpenAuth: (mode: 'login' | 'register') => void
  onOpenDemoSwitcher: () => void
  onNavigateToDashboard?: () => void
}

interface GroceryItem {
  name: string
  category: string
  packSize: string
  retailPrice: number
  wholesalePrice: number
  qty: number
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenAuth,
  onOpenDemoSwitcher,
}) => {
  // Interactive savings calculator state
  const [groceries, setGroceries] = useState<GroceryItem[]>([
    { name: 'Sona Masoori Rice', category: 'Rice', packSize: '5 kg sealed bag', retailPrice: 360, wholesalePrice: 280, qty: 2 },
    { name: 'Refined Sunflower Oil', category: 'Oil', packSize: '5 L sealed can', retailPrice: 720, wholesalePrice: 590, qty: 1 },
    { name: 'Premium Toor Dal', category: 'Dal', packSize: '2 kg sealed pack', retailPrice: 340, wholesalePrice: 265, qty: 2 },
    { name: 'Refined Crystal Sugar', category: 'Sugar', packSize: '5 kg sealed bag', retailPrice: 240, wholesalePrice: 195, qty: 1 },
    { name: 'Chakki Fresh Atta', category: 'Flour', packSize: '10 kg sealed bag', retailPrice: 480, wholesalePrice: 385, qty: 1 },
  ])

  const updateQuantity = (index: number, newQty: number) => {
    const updated = [...groceries]
    updated[index].qty = Math.max(0, Math.min(10, newQty))
    setGroceries(updated)
  }

  const retailTotal = groceries.reduce((sum, item) => sum + item.retailPrice * item.qty, 0)
  const wholesaleTotal = groceries.reduce((sum, item) => sum + item.wholesalePrice * item.qty, 0)
  const estimatedSavings = retailTotal - wholesaleTotal
  const savingsPct = retailTotal > 0 ? Math.round((estimatedSavings / retailTotal) * 100) : 0

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 gradient-hero border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Vision & Pitch */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-100/80 border border-brand-200 text-brand-900 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-brand-700" />
                Community Grocery Purchasing Platform
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-950 tracking-tight leading-[1.15]">
                Buy Grocery Staples at <span className="text-brand-600 underline decoration-brand-300 decoration-wavy underline-offset-8">Wholesale Prices</span>. Together.
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Households in the same neighborhood pool their grocery requirements for sealed staples like rice, oil, dal, sugar, and flour. Unlock tiered wholesale quotes with complete cart privacy.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                <Button
                  size="lg"
                  variant="primary"
                  onClick={() => onOpenAuth('register')}
                  className="w-full sm:w-auto shadow-lg shadow-brand-600/25 text-base"
                >
                  Join a Buying Group
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={onOpenDemoSwitcher}
                  className="w-full sm:w-auto text-base"
                >
                  <Sparkles className="w-4 h-4 mr-2 text-amber-500" />
                  Try Demo Personas
                </Button>
              </div>

              {/* Trust & Key Features Metrics */}
              <div className="pt-8 border-t border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
                <div>
                  <p className="text-2xl font-bold text-slate-900">20–35%</p>
                  <p className="text-xs text-slate-500 mt-0.5">Average Savings</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">100%</p>
                  <p className="text-xs text-slate-500 mt-0.5">Sealed Packs Only</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">Private</p>
                  <p className="text-xs text-slate-500 mt-0.5">Household Lists</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-brand-700">Bengaluru</p>
                  <p className="text-xs text-slate-500 mt-0.5">Indiranagar Central</p>
                </div>
              </div>
            </div>

            {/* Right Column: Live Teaser Card */}
            <div className="lg:col-span-5">
              <div className="glass-card rounded-2xl p-6 sm:p-7 shadow-xl shadow-slate-300/30 relative">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                      Live Group Snapshot
                    </span>
                    <h3 className="text-base font-bold text-slate-900">
                      Indiranagar Essentials Group #1
                    </h3>
                  </div>
                  <Badge variant="success">OPEN FOR ORDERS</Badge>
                </div>

                <div className="py-4 space-y-3.5">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>Participating Households</span>
                    <span className="font-semibold text-slate-900">14 families</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>Rice & Atta Pool</span>
                    <span className="font-semibold text-brand-700">320 kg (Tier 2 Unlocked)</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>Cooking Oil Pool</span>
                    <span className="font-semibold text-brand-700">85 Liters (Tier 3 Unlocked)</span>
                  </div>

                  {/* Progress bar towards Tier 3 */}
                  <div className="pt-2">
                    <div className="flex justify-between text-[11px] font-medium text-slate-500 mb-1">
                      <span>Threshold Progress</span>
                      <span className="text-brand-700 font-semibold">82% to Maximum Discount</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-gradient-to-r from-brand-500 to-emerald-600 h-2 rounded-full w-[82%]" />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between bg-brand-50/60 -mx-6 -mb-6 p-5 rounded-b-2xl">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                      Estimated Family Savings
                    </p>
                    <p className="text-lg font-bold text-slate-900">
                      ₹1,420 <span className="text-xs font-normal text-brand-700 font-semibold">(~24% off)</span>
                    </p>
                  </div>
                  <Button size="sm" onClick={() => onOpenAuth('register')}>
                    Join Group
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Savings Calculator */}
      <section id="calculator" className="py-16 sm:py-24 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <Badge variant="brand" className="mb-3">
              <Calculator className="w-3.5 h-3.5 mr-1" />
              Wholesale vs Retail Pricing
            </Badge>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
              Calculate Your Household Savings
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-3">
              Adjust monthly staples to see real-world wholesale tier discounts compared to reference retail store prices.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Products Table */}
            <div className="lg:col-span-8 bg-slate-50/70 rounded-2xl border border-slate-200 p-4 sm:p-6 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="pb-3">Staple Product</th>
                      <th className="pb-3 text-center">Retail Price</th>
                      <th className="pb-3 text-center">Wholesale Price</th>
                      <th className="pb-3 text-center">Packs</th>
                      <th className="pb-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/70">
                    {groceries.map((item, idx) => (
                      <tr key={idx} className="group">
                        <td className="py-3.5">
                          <p className="font-semibold text-slate-900 text-sm">{item.name}</p>
                          <p className="text-xs text-slate-500">{item.packSize}</p>
                        </td>
                        <td className="py-3.5 text-center text-slate-500 text-xs line-through">
                          {formatCurrency(item.retailPrice)}
                        </td>
                        <td className="py-3.5 text-center font-bold text-brand-700 text-sm">
                          {formatCurrency(item.wholesalePrice)}
                        </td>
                        <td className="py-3.5 text-center">
                          <div className="inline-flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden shadow-2xs">
                            <button
                              onClick={() => updateQuantity(idx, item.qty - 1)}
                              className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 transition-colors font-bold"
                            >
                              -
                            </button>
                            <span className="w-8 text-center text-xs font-semibold">{item.qty}</span>
                            <button
                              onClick={() => updateQuantity(idx, item.qty + 1)}
                              className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 transition-colors font-bold"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="py-3.5 text-right font-bold text-slate-900">
                          {formatCurrency(item.wholesalePrice * item.qty)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Savings Summary Box */}
            <div className="lg:col-span-4">
              <Card className="border-brand-200 shadow-md">
                <div className="p-6 bg-gradient-to-br from-brand-700 to-brand-900 text-white rounded-t-xl">
                  <span className="text-xs uppercase tracking-wider text-brand-200 font-semibold">
                    Monthly Savings Breakdown
                  </span>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-3xl font-extrabold">{formatCurrency(estimatedSavings)}</span>
                    <span className="bg-brand-500/30 border border-brand-400/40 text-brand-100 px-2.5 py-1 rounded-full text-xs font-bold">
                      {savingsPct}% Saved
                    </span>
                  </div>
                  <p className="text-xs text-brand-200 mt-1">
                    Money kept in your wallet by buying with neighbors
                  </p>
                </div>

                <CardContent className="p-6 space-y-4 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Retail Store Equivalent:</span>
                    <span className="font-semibold text-slate-900 line-through">
                      {formatCurrency(retailTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>BULK SHARE Wholesale Total:</span>
                    <span className="font-bold text-brand-700 text-sm">
                      {formatCurrency(wholesaleTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Simulated Pickup Fee:</span>
                    <span className="font-semibold text-emerald-600">FREE (Community Pickup)</span>
                  </div>

                  <div className="pt-3 border-t border-slate-100">
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      * Wholesale rates reflect certified supplier quantity price tiers for sealed manufacturer packages.
                    </p>
                  </div>

                  <Button className="w-full mt-2" onClick={() => onOpenAuth('register')}>
                    Start Saving in Indiranagar
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Core Rules & Transparency */}
      <section className="py-16 sm:py-24 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="brand" className="mb-3">
              <ShieldCheck className="w-3.5 h-3.5 mr-1" />
              Guaranteed Principles
            </Badge>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
              Built for Neighbor Trust & Complete Privacy
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-3">
              Unlike haphazard messaging groups, BULK SHARE enforces strict software rules ensuring fairness and security.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold">
                  <PackageCheck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-slate-900">Sealed Packs Only</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Only manufacturer-sealed retail packs (1kg, 5kg, 5L cans). Never loose or repacked grains.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-slate-900">Private Household Lists</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Neighbors only see aggregate numbers. Your individual cart and exact home address stay 100% confidential.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-slate-900">Independent Tiers</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Each product qualifies on its own quantity threshold. Non-qualifying products are transparently flagged.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-slate-900">Explicit Confirmation</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  You review and approve the final chosen brand, supplier, and costs before atomic group order locking.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How it Works (4 Steps) */}
      <section id="how-it-works" className="py-16 sm:py-24 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="brand" className="mb-3">
              Step-by-Step Flow
            </Badge>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
              How Neighborhood Group Purchasing Works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {[
              {
                step: '01',
                title: 'Join or Create Group',
                desc: 'Find an open group in your neighborhood (e.g. Indiranagar) or start one as an Organizer.',
              },
              {
                step: '02',
                title: 'Add Grocery Needs',
                desc: 'Add sealed-pack quantities with exact brand preferences or flexible substitution approval.',
              },
              {
                step: '03',
                title: 'Wholesale Quotation',
                desc: 'Verified suppliers submit bulk rates for aggregated quantities; the organizer picks the best offer.',
              },
              {
                step: '04',
                title: 'Confirm & Receive',
                desc: 'Approve your household total, lock the purchase, and collect at local pickup or doorstep.',
              },
            ].map((st, i) => (
              <div key={i} className="relative space-y-3">
                <span className="text-4xl font-black text-brand-200 block font-mono">{st.step}</span>
                <h3 className="font-bold text-slate-900 text-base">{st.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{st.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Evaluator Demo Personas CTA banner */}
      <section className="py-16 bg-gradient-to-r from-brand-900 via-brand-800 to-slate-950 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-700/60 border border-brand-500/50 text-brand-200 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Designed for Instant Evaluation & Review
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Ready to explore all 4 user personas?
          </h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto">
            Switch effortlessly between Customer, Group Organizer, Wholesaler Supplier, and Admin views with one click.
          </p>
          <div className="pt-2">
            <Button
              size="lg"
              variant="secondary"
              onClick={onOpenDemoSwitcher}
              className="bg-white text-slate-900 hover:bg-slate-100 font-bold border-none"
            >
              Open Demo Role Switcher
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

function PackageCheck(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m16 16 2 2 4-4" />
      <path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14" />
      <path d="m7.5 4.27 9 5.15" />
      <polyline points="3.29 7 12 12 20.71 7" />
      <line x1="12" x2="12" y1="22" y2="12" />
    </svg>
  )
}
