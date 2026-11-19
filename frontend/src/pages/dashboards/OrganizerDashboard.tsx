import React from 'react'
import {
  Users,
  Layers,
  FileCheck,
  Lock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

interface OrganizerDashboardProps {
  onOpenDemoSwitcher: () => void
}

export const OrganizerDashboard: React.FC<OrganizerDashboardProps> = ({ onOpenDemoSwitcher }) => {
  const { user } = useAuth()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Profile */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">Group Organizer Console</h1>
            <Badge variant="brand">Organizer Scope</Badge>
          </div>
          <p className="text-sm text-slate-500">
            Managing <span className="font-semibold text-slate-800">Indiranagar Essentials Group #1</span> on behalf of your neighborhood.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={onOpenDemoSwitcher}>
            <Sparkles className="w-4 h-4 mr-1.5 text-amber-500" />
            Switch Role Persona
          </Button>
          <Button size="sm">Group Settings (Milestone 2)</Button>
        </div>
      </div>

      {/* Organizer Privacy Notice */}
      <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-xs flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-sm">Privacy-Preserving Aggregated Demand Only</p>
          <p className="mt-0.5 text-teal-800 leading-relaxed">
            As group organizer, you have permission to view aggregated grocery demand and compare supplier quotes. In compliance with SRS Section 2.3, individual household grocery lists and delivery addresses are kept strictly private.
          </p>
        </div>
      </div>

      {/* Aggregate Demand Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Rice Aggregated Demand</CardTitle>
            <CardDescription className="text-xs">Sealed 5kg & 10kg Packs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex justify-between items-baseline">
              <span className="text-2xl font-bold text-slate-900">320 kg</span>
              <Badge variant="success">Tier 2 Qualified</Badge>
            </div>
            <p className="text-slate-500 text-[11px]">Next wholesale tier threshold: 400 kg</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Cooking Oil Pool</CardTitle>
            <CardDescription className="text-xs">Sealed 1L Pouches & 5L Cans</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex justify-between items-baseline">
              <span className="text-2xl font-bold text-slate-900">85 Liters</span>
              <Badge variant="success">Tier 3 Qualified</Badge>
            </div>
            <p className="text-slate-500 text-[11px]">Maximum wholesale discount unlocked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Toor Dal & Sugar</CardTitle>
            <CardDescription className="text-xs">Sealed 1kg & 2kg Packs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex justify-between items-baseline">
              <span className="text-2xl font-bold text-slate-900">140 kg</span>
              <Badge variant="warning">Tier 1 Qualified</Badge>
            </div>
            <p className="text-slate-500 text-[11px]">10 kg needed for Tier 2</p>
          </CardContent>
        </Card>
      </div>

      {/* Supplier Quotation Comparison Teaser (Milestone 3 & 4) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base">Supplier Quotation Comparison (Milestone 3 & 4)</CardTitle>
            <CardDescription className="text-xs">
              Review and select one supplier quotation for the entire group order.
            </CardDescription>
          </div>
          <Badge variant="brand">2 Quotations Available</Badge>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px]">
                  <th className="pb-3">Wholesaler</th>
                  <th className="pb-3">Total Quoted Value</th>
                  <th className="pb-3">Avg. Discount</th>
                  <th className="pb-3">Shared Charges</th>
                  <th className="pb-3">Valid Until</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="bg-brand-50/40">
                  <td className="py-3 font-semibold text-slate-900">Kisan Wholesale Supplies</td>
                  <td className="py-3 font-bold text-slate-900">₹24,850</td>
                  <td className="py-3 text-brand-700 font-bold">28% Saved</td>
                  <td className="py-3 text-slate-600">₹250 (Delivery to hub)</td>
                  <td className="py-3 text-slate-600">Nov 22, 18:00</td>
                  <td className="py-3 text-right">
                    <Button size="sm" variant="primary">Select Quotation</Button>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 font-semibold text-slate-900">Bengaluru APMC Traders</td>
                  <td className="py-3 font-bold text-slate-900">₹25,600</td>
                  <td className="py-3 text-brand-700 font-bold">24% Saved</td>
                  <td className="py-3 text-slate-600">₹300</td>
                  <td className="py-3 text-slate-600">Nov 23, 12:00</td>
                  <td className="py-3 text-right">
                    <Button size="sm" variant="outline">Compare</Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
