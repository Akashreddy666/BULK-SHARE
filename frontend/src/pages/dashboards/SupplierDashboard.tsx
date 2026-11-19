import React from 'react'
import {
  Store,
  Layers,
  FileText,
  CheckCircle,
  Clock,
  Plus,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Sparkles,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency } from '@/lib/utils'

interface SupplierDashboardProps {
  onOpenDemoSwitcher: () => void
}

export const SupplierDashboard: React.FC<SupplierDashboardProps> = ({ onOpenDemoSwitcher }) => {
  const { user } = useAuth()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Profile */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">{user?.full_name}</h1>
            <Badge variant="success">
              <CheckCircle className="w-3 h-3 mr-1" />
              Verified Wholesaler
            </Badge>
          </div>
          <p className="text-sm text-slate-500">
            Registered wholesale vendor supplying sealed staple packages to Bengaluru neighborhood buying groups.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={onOpenDemoSwitcher}>
            <Sparkles className="w-4 h-4 mr-1.5 text-amber-500" />
            Switch Role Persona
          </Button>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-1.5" />
            Add Product Offer (M3)
          </Button>
        </div>
      </div>

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Active Catalog Offers</p>
              <h3 className="text-xl font-bold text-slate-900 mt-0.5">8 Products</h3>
              <p className="text-[11px] text-sky-600 font-medium mt-0.5">Multi-tier quantity pricing</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Pending Quote RFQs</p>
              <h3 className="text-xl font-bold text-amber-700 mt-0.5">2 Requests</h3>
              <p className="text-[11px] text-amber-600 font-medium mt-0.5">Indiranagar & Koramangala</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Selected Quotations</p>
              <h3 className="text-xl font-bold text-emerald-700 mt-0.5">4 Groups</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Simulated order fulfillment</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Simulated Volume</p>
              <h3 className="text-xl font-bold text-purple-700 mt-0.5">1,250 kg</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">This calendar month</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Wholesale Product Offerings & Price Tiers */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base">Sample Wholesale Catalog & Quantity Price Tiers</CardTitle>
            <CardDescription className="text-xs">
              Configured per sealed pack with independent quantity minimum thresholds (Milestone 3).
            </CardDescription>
          </div>
          <Badge variant="brand">Sealed Packs Only</Badge>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px]">
                  <th className="pb-3">Product Name</th>
                  <th className="pb-3">Pack Specification</th>
                  <th className="pb-3">Base Price (&lt;20 packs)</th>
                  <th className="pb-3">Tier 1 (&ge;20 packs)</th>
                  <th className="pb-3">Tier 2 (&ge;50 packs)</th>
                  <th className="pb-3">Tier 3 (&ge;100 packs)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3 font-semibold text-slate-900">Sona Masoori Rice</td>
                  <td className="py-3 text-slate-600">5 kg sealed bag</td>
                  <td className="py-3 text-slate-500">₹320 / pack</td>
                  <td className="py-3 text-brand-700 font-semibold">₹300 / pack</td>
                  <td className="py-3 text-brand-700 font-bold">₹280 / pack</td>
                  <td className="py-3 text-emerald-700 font-extrabold">₹260 / pack</td>
                </tr>
                <tr>
                  <td className="py-3 font-semibold text-slate-900">Refined Sunflower Oil</td>
                  <td className="py-3 text-slate-600">5 L sealed can</td>
                  <td className="py-3 text-slate-500">₹680 / can</td>
                  <td className="py-3 text-brand-700 font-semibold">₹630 / can</td>
                  <td className="py-3 text-brand-700 font-bold">₹590 / can</td>
                  <td className="py-3 text-emerald-700 font-extrabold">₹550 / can</td>
                </tr>
                <tr>
                  <td className="py-3 font-semibold text-slate-900">Premium Toor Dal</td>
                  <td className="py-3 text-slate-600">2 kg sealed pack</td>
                  <td className="py-3 text-slate-500">₹310 / pack</td>
                  <td className="py-3 text-brand-700 font-semibold">₹285 / pack</td>
                  <td className="py-3 text-brand-700 font-bold">₹265 / pack</td>
                  <td className="py-3 text-emerald-700 font-extrabold">₹245 / pack</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
