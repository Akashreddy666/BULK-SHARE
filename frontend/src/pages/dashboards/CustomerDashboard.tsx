import React, { useState } from 'react'
import {
  Users,
  TrendingDown,
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowRight,
  MapPin,
  Sparkles,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency } from '@/lib/utils'

interface CustomerDashboardProps {
  onOpenDemoSwitcher: () => void
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ onOpenDemoSwitcher }) => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'groups' | 'orders'>('groups')

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Profile & Neighborhood */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">Welcome, {user?.full_name}!</h1>
            <Badge variant="brand">Customer</Badge>
          </div>
          <p className="text-sm text-slate-500 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-brand-600" />
            Active Community: <span className="font-medium text-slate-700">{user?.neighborhood?.name || 'Indiranagar Central'}</span> (Pincode: {user?.neighborhood?.postal_code || '560038'})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={onOpenDemoSwitcher}>
            <Sparkles className="w-4 h-4 mr-1.5 text-amber-500" />
            Switch Role Persona
          </Button>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-1.5" />
            Join New Group
          </Button>
        </div>
      </div>

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Active Groups</p>
              <h3 className="text-xl font-bold text-slate-900 mt-0.5">2 Groups</h3>
              <p className="text-[11px] text-brand-600 font-medium mt-0.5">Indiranagar & Koramangala</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <TrendingDown className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Total Saved to Date</p>
              <h3 className="text-xl font-bold text-emerald-700 mt-0.5">{formatCurrency(2840)}</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">~26% vs retail shops</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Action Required</p>
              <h3 className="text-xl font-bold text-amber-700 mt-0.5">1 Approval</h3>
              <p className="text-[11px] text-amber-600 font-medium mt-0.5">Confirm quotation proposal</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Past Orders</p>
              <h3 className="text-xl font-bold text-slate-900 mt-0.5">3 Orders</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">100% sealed packs verified</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className="space-y-6">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('groups')}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'groups'
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            My Active Buying Groups
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'orders'
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Order History & Tracking
          </button>
        </div>

        {activeTab === 'groups' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Group Card 1 */}
            <Card className="hover:border-slate-300 transition-all">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <Badge variant="success" className="mb-1.5">OPEN FOR GROCERY ITEMS</Badge>
                  <CardTitle className="text-base">Indiranagar Essentials Group #1</CardTitle>
                  <CardDescription className="text-xs">Closes on Sunday, 8:00 PM</CardDescription>
                </div>
                <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                  14 Members
                </span>
              </CardHeader>
              <CardContent className="space-y-4 pt-4 text-xs">
                <div className="space-y-2">
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-600">My Committed Items:</span>
                    <span className="text-slate-900 font-semibold">2 × 5kg Rice, 1 × 5L Oil</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-600">Group Wholesale Tier Status:</span>
                    <span className="text-brand-700 font-bold">Tier 2 Unlocked (22% off)</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1.5">
                  <div className="flex justify-between text-[11px] font-semibold text-slate-700">
                    <span>Group Rice Pool Progress</span>
                    <span>320 / 400 kg</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5">
                    <div className="bg-brand-600 h-1.5 rounded-full w-[80%]" />
                  </div>
                  <p className="text-[10px] text-slate-500">
                    80 kg more required to trigger Tier 3 max discount (30% off).
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                  <div className="text-xs">
                    <span className="text-slate-500 block">Est. Household Cost</span>
                    <span className="font-bold text-slate-900 text-sm">₹1,150</span>
                  </div>
                  <Button size="sm" variant="outline">
                    Edit My List (Milestone 2)
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Group Card 2 */}
            <Card className="hover:border-slate-300 transition-all border-amber-200">
              <CardHeader className="flex flex-row items-center justify-between pb-3 bg-amber-50/50">
                <div>
                  <Badge variant="warning" className="mb-1.5">CONFIRMATION ROUND 1</Badge>
                  <CardTitle className="text-base">Koramangala Staples Club</CardTitle>
                  <CardDescription className="text-xs">Quotation selected by Organizer</CardDescription>
                </div>
                <span className="text-xs font-semibold text-slate-500 bg-white border px-2.5 py-1 rounded-md">
                  18 Members
                </span>
              </CardHeader>
              <CardContent className="space-y-4 pt-4 text-xs">
                <div className="p-3 rounded-lg bg-amber-50/80 border border-amber-200 text-amber-900">
                  <p className="font-semibold text-xs flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    Supplier: Kisan Wholesale Supplies
                  </p>
                  <p className="text-[11px] mt-1 text-amber-800">
                    Please approve your final item breakdown and ₹40 community pickup allocation before the 24h deadline.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                  <div className="text-xs">
                    <span className="text-slate-500 block">Total After Wholesale Discount</span>
                    <span className="font-bold text-slate-900 text-sm">₹1,480</span>
                  </div>
                  <Button size="sm" variant="primary">
                    Review & Confirm (Milestone 4)
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center space-y-3">
              <ShoppingBag className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-base font-semibold text-slate-900">Simulated Order History</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Orders undergo atomic locking, simulated payment status updates, and fulfillment verification (Milestone 4 & 5).
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
