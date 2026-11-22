import React from 'react'
import { UserCheck, Shield, Store, Users, Check } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/context/AuthContext'
import { UserRole } from '@/types'

interface DemoRoleSwitcherProps {
  isOpen: boolean
  onClose: () => void
  onNavigateToDashboard?: () => void
}

export const DemoRoleSwitcher: React.FC<DemoRoleSwitcherProps> = ({
  isOpen,
  onClose,
  onNavigateToDashboard,
}) => {
  const { user, demoLogin, isLoading, error } = useAuth()

  const roles = [
    {
      role: 'CUSTOMER' as UserRole,
      title: 'Customer (Household)',
      name: 'Priya Sharma',
      email: 'priya.customer@bulkshare.com',
      desc: 'Join neighborhood groups, build private grocery lists, approve quotations, and track personal savings.',
      icon: Users,
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      role: 'CUSTOMER' as UserRole,
      title: 'Group Organizer',
      name: 'Rahul Verma',
      email: 'rahul.organizer@bulkshare.com',
      desc: 'Create/manage a neighborhood group, monitor aggregated demand, compare and select wholesale quotations.',
      icon: UserCheck,
      badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
    },
    {
      role: 'SUPPLIER' as UserRole,
      title: 'Wholesaler / Supplier',
      name: 'Kisan Wholesale Supplies',
      email: 'kisan.wholesaler@bulkshare.com',
      desc: 'Submit bulk quotations, configure quantity pricing tiers for sealed packs, and review quotation status.',
      icon: Store,
      badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
    },
    {
      role: 'ADMIN' as UserRole,
      title: 'Platform Administrator',
      name: 'Platform Administrator',
      email: 'admin@bulkshare.com',
      desc: 'Manage catalog & reference prices, verify wholesalers, simulate wholesale procurement and fulfillment.',
      icon: Shield,
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    },
  ]

  const handleSelectRole = async (role: UserRole, email: string) => {
    try {
      await demoLogin(role, email)
      onClose()
      if (onNavigateToDashboard) {
        onNavigateToDashboard()
      }
    } catch {
      // AuthContext shows the request error in the dialog.
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Demo Persona Switcher"
      description="Choose a sample account to explore its workspace."
    >
      <div className="space-y-3">
        {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}

        <div className="grid grid-cols-1 gap-2.5">
          {roles.map((item) => {
            const Icon = item.icon
            const isCurrent = user?.email === item.email

            return (
              <button
                key={item.email}
                onClick={() => handleSelectRole(item.role, item.email)}
                disabled={isLoading}
                className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 relative ${
                  isCurrent
                    ? 'border-brand-500 bg-brand-50/60 ring-2 ring-brand-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70'
                }`}
              >
                <div className={`p-2 rounded-lg shrink-0 ${item.badgeColor}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0 pr-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-sm text-slate-900">{item.title}</span>
                    {isCurrent && (
                      <span className="text-[10px] bg-brand-600 text-white px-1.5 py-0.5 rounded font-medium">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-slate-700 mt-0.5">
                    {item.name}
                  </p>
                  <p className="text-sm text-slate-600 mt-1 leading-snug">
                    {item.desc}
                  </p>
                </div>
                {isCurrent && (
                  <div className="absolute right-3.5 top-3.5 text-brand-600">
                    <Check className="w-5 h-5" />
                  </div>
                )}
              </button>
            )
          })}
        </div>

        <div className="pt-2 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}
