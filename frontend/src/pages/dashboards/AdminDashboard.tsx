import React from 'react'
import {
  Shield,
  Users,
  Store,
  Layers,
  CheckCircle,
  AlertOctagon,
  FileText,
  Activity,
  Sparkles,
  ArrowRight,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

interface AdminDashboardProps {
  onOpenDemoSwitcher: () => void
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onOpenDemoSwitcher }) => {
  const { user } = useAuth()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Profile */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">Platform Administrator Console</h1>
            <Badge variant="warning">
              <Shield className="w-3 h-3 mr-1" />
              Global Admin
            </Badge>
          </div>
          <p className="text-sm text-slate-500">
            System moderation, supplier verification, reference pricing, and simulated order execution.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={onOpenDemoSwitcher}>
            <Sparkles className="w-4 h-4 mr-1.5 text-amber-500" />
            Switch Role Persona
          </Button>
          <Button size="sm" variant="danger">
            Simulate Reset Demo (M5)
          </Button>
        </div>
      </div>

      {/* Admin Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Registered Households</p>
              <h3 className="text-xl font-bold text-slate-900 mt-0.5">38 Users</h3>
              <p className="text-[11px] text-purple-600 font-medium mt-0.5">Indiranagar & Koramangala</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Verified Wholesalers</p>
              <h3 className="text-xl font-bold text-slate-900 mt-0.5">3 Suppliers</h3>
              <p className="text-[11px] text-sky-600 font-medium mt-0.5">1 application pending review</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center shrink-0">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Buying Groups</p>
              <h3 className="text-xl font-bold text-slate-900 mt-0.5">4 Groups</h3>
              <p className="text-[11px] text-brand-600 font-medium mt-0.5">2 Open, 1 Quoting, 1 Locked</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Simulated Operations</p>
              <h3 className="text-xl font-bold text-amber-700 mt-0.5">Active</h3>
              <p className="text-[11px] text-amber-600 font-medium mt-0.5">Fictional data enabled</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Supplier Verification Queue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base">Supplier Review & Verification (FR-SUP-01)</CardTitle>
              <CardDescription className="text-xs">
                Inspect applicant business details and approve sample quotation permissions.
              </CardDescription>
            </div>
            <Badge variant="warning">1 Pending</Badge>
          </CardHeader>
          <CardContent className="space-y-3 pt-3 text-xs">
            <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900">APMC Grain Wholesalers Pvt Ltd</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Submitted Nov 18 · GSTIN & FSSAI attached</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="text-xs">Details</Button>
                <Button size="sm" variant="primary" className="text-xs">Approve (M3)</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Simulated Procurement Coordinator */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base">Simulated Operations Coordinator (FR-PROC-01)</CardTitle>
              <CardDescription className="text-xs">
                Platform admin triggers simulated procurement after group orders atomically lock.
              </CardDescription>
            </div>
            <Badge variant="brand">Simulated Mode</Badge>
          </CardHeader>
          <CardContent className="space-y-3 pt-3 text-xs">
            <div className="p-3.5 rounded-lg border border-brand-200 bg-brand-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900">Locked Order #BS-2026-004</span>
                <Badge variant="success">ATOMICALLY LOCKED</Badge>
              </div>
              <p className="text-[11px] text-slate-600">
                14 households confirmed · Total: ₹24,850 · Chosen: Kisan Wholesale Supplies
              </p>
              <div className="pt-2 flex justify-end">
                <Button size="sm" variant="primary" className="text-xs">
                  Simulate Procurement (M5)
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
