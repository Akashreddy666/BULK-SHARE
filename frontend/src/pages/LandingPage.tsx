import { useState } from 'react'
import {
  BadgeCheck, ChevronDown, ClipboardList, FlaskConical, HandCoins, LockKeyhole, MapPin,
  Minus, PackageCheck, Plus, Scale, ShoppingBag, Truck, UsersRound,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/lib/utils'
import { pantry, samplePackPrice, sampleTiers } from './landingCatalog'

interface LandingPageProps {
  onOpenAuth: (mode: 'login' | 'register') => void
  onOpenDemoSwitcher: () => void
  onNavigateToDashboard?: () => void
}

const steps = [
  { icon: MapPin, title: 'Find your group', copy: 'Join an open neighborhood pool, use a private invite, or start a group of your own.' },
  { icon: ClipboardList, title: 'Build your list', copy: 'Add the sealed packs your household needs and choose how flexible you are about brands.' },
  { icon: UsersRound, title: 'Pool your demand', copy: 'The group combines compatible packs. Each product qualifies for volume pricing independently.' },
  { icon: Scale, title: 'Compare and confirm', copy: 'Your organizer compares supplier quotes. You approve your items, fees and household total.' },
  { icon: Truck, title: 'Choose how to receive it', copy: 'Select neighborhood pickup or home delivery and review the fee before you confirm.' },
]

const trust = [
  { icon: PackageCheck, title: 'Sealed packs only', copy: 'Orders use entire manufacturer-sealed packs in the sizes shown in the catalog.' },
  { icon: LockKeyhole, title: 'Private household lists', copy: 'Organizers see combined pack quantities. Household lists and addresses stay private.' },
  { icon: BadgeCheck, title: 'Supplier verification', copy: 'The workflow requires supplier approval before a supplier can submit eligible quotations.' },
  { icon: HandCoins, title: 'Costs shown upfront', copy: 'Review item prices, shared charges and pickup or delivery fees before you accept.' },
]

const questions = [
  { question: 'Do I have to buy a wholesale-sized pack?', answer: 'You choose ordinary sealed retail packs from the catalog. The group combines pack counts to qualify for a volume price.' },
  { question: 'What happens when a product misses the minimum?', answer: 'Qualification is checked separately for each product. If a product misses its minimum, it is excluded from the proposed order and shown in your breakdown.' },
  { question: 'Can I choose my brand and fulfillment method?', answer: 'Yes. Set an exact or flexible brand preference and review the final pack before approving. You can select neighborhood pickup or home delivery and see the associated fee.' },
  { question: 'Will I be charged for using the demo?', answer: 'Payments, procurement and fulfillment are simulated. The example prices use sample catalog data and do not represent live offers.' },
]

function scrollToCalculator() {
  const section = document.getElementById('calculator')
  section?.focus({ preventScroll: true })
  section?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
}

export function LandingPage({ onOpenAuth, onOpenDemoSwitcher, onNavigateToDashboard }: LandingPageProps) {
  const [productIndex, setProductIndex] = useState(0)
  const [householdPacks, setHouseholdPacks] = useState(2)
  const [groupPacks, setGroupPacks] = useState(15)
  const product = pantry[productIndex]
  const totalPacks = Math.max(groupPacks, householdPacks)
  const tier = [...sampleTiers].reverse().find((candidate) => totalPacks >= candidate.packs)
  const retailTotal = product.retail * householdPacks
  const groupTotal = tier ? samplePackPrice(product.retail, tier.rate) * householdPacks : null
  const savings = groupTotal === null ? null : retailTotal - groupTotal

  const start = onNavigateToDashboard ?? (() => onOpenAuth('register'))

  return (
    <div>
      <section id="landing" tabIndex={-1} aria-labelledby="hero-title" className="bg-canvas outline-none">
        <div className="site-container grid gap-8 py-10 sm:py-14 lg:grid-cols-[.94fr_1.06fr] lg:items-center lg:gap-12 lg:py-[4.25rem]">
          <div className="page-enter min-w-0">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-800">
              <MapPin aria-hidden="true" className="size-4" /> Neighborhood grocery buying
            </p>
            <h1 id="hero-title" className="text-balance font-display text-[clamp(2.65rem,5.8vw,5rem)] leading-[.99] tracking-[-.045em] text-brand-950">
              Better grocery prices, <span className="text-brand-600">together.</span>
            </h1>
            <p className="mt-5 max-w-[29rem] text-base leading-relaxed text-slate-700 sm:text-lg">
              Buy sealed pantry staples with your neighbors. Pool quantities, compare wholesale quotes and approve your own grocery total.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button size="lg" onClick={start}><ShoppingBag aria-hidden="true" className="size-[18px]" /> {onNavigateToDashboard ? 'Open dashboard' : 'Join a buying group'}</Button>
              <a href="#how-it-works" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-brand-200 bg-white px-5 font-semibold text-brand-900 transition-colors hover:bg-brand-50">See how it works</a>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 border-t border-line pt-5 text-sm font-semibold text-brand-800">
              <span className="inline-flex items-center gap-2"><PackageCheck aria-hidden="true" className="size-4" /> Sealed grocery packs</span>
              <span className="inline-flex items-center gap-2"><LockKeyhole aria-hidden="true" className="size-4" /> Private lists</span>
            </div>
          </div>

          <figure className="relative isolate min-w-0 overflow-hidden rounded-[1.75rem] bg-brand-100 shadow-panel">
            <picture>
              <source media="(max-width: 640px)" srcSet="/pantry/hero-small.webp" />
              <img src="/pantry/hero.webp" alt="Rice, lentils, flour and sunflower oil beside an olive canvas market bag" width="1440" height="960" fetchPriority="high" className="aspect-[4/3] w-full object-cover sm:aspect-[6/5]" />
            </picture>

          </figure>
        </div>
      </section>

      <section id="how-it-works" tabIndex={-1} aria-labelledby="steps-title" className="border-y border-line bg-white py-12 outline-none sm:py-16">
        <div className="site-container">
          <h2 id="steps-title" className="section-title">How BULK SHARE works</h2>
          <ol className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {steps.map(({ icon: Icon, title, copy }) => (
              <li key={title} className="rounded-panel border border-line bg-canvas p-5">
                <span className="icon-tile bg-white"><Icon aria-hidden="true" className="size-5" /></span>
                <h3 className="mt-4 text-base font-bold tracking-tight">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-700">{copy}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="calculator" tabIndex={-1} aria-labelledby="calculator-title" className="py-12 outline-none sm:py-16">
        <div className="site-container">
          <div className="mb-7">
            <h2 id="calculator-title" className="section-title">Calculate your household savings</h2>
            <p className="mt-2 max-w-2xl text-slate-700">See how the total packs in your group can change the price of a pantry staple.</p>
          </div>
          <div className="grid overflow-hidden rounded-[1.75rem] border border-line bg-white shadow-panel md:grid-cols-[1.2fr_1fr]">
            <div className="space-y-6 p-5 sm:p-8">
              <div>
                <label htmlFor="savings-product" className="mb-2 block text-sm font-bold">Pantry staple</label>
                <div className="relative">
                  <select id="savings-product" value={productIndex} onChange={(event) => setProductIndex(Number(event.target.value))} className="control w-full appearance-none pr-10">
                    {pantry.map((item, index) => <option key={item.id} value={index}>{item.name} · {item.pack}</option>)}
                  </select>
                  <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-3.5 size-4 text-brand-700" />
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold">Your household packs</p>
                  <p className="mt-1 text-sm text-slate-600">{product.pack} per sealed pack</p>
                </div>
                <div role="group" aria-label="Household pack quantity" className="flex items-center gap-1 rounded-xl border border-line p-1">
                  <button type="button" aria-label="Remove one household pack" disabled={householdPacks <= 1} onClick={() => setHouseholdPacks((value) => value - 1)} className="quantity-button"><Minus aria-hidden="true" className="size-4" /></button>
                  <output aria-label="Household packs" className="w-8 text-center font-bold tabular-nums">{householdPacks}</output>
                  <button type="button" aria-label="Add one household pack" disabled={householdPacks >= 10} onClick={() => setHouseholdPacks((value) => value + 1)} className="quantity-button"><Plus aria-hidden="true" className="size-4" /></button>
                </div>
              </div>
              <div>
                <label htmlFor="savings-group" className="flex flex-wrap justify-between gap-2 text-sm font-bold">
                  Packs across the group <span className="tabular-nums text-brand-700">{totalPacks} packs</span>
                </label>
                <input id="savings-group" type="range" min={householdPacks} max={40} value={totalPacks} onChange={(event) => setGroupPacks(Number(event.target.value))} className="h-11 w-full accent-brand-700" />
                <p className="text-sm text-slate-600">Includes your packs. Sample tiers start at 5, 15 and 30 packs per product.</p>
              </div>
            </div>
            <div className="flex flex-col justify-between gap-5 bg-brand-900 p-5 text-white sm:p-8">
              <div aria-live="polite">
                <p className="text-sm font-semibold text-brand-200">Estimated savings on this item</p>
                <p key={savings} className="page-enter mt-1 font-display text-5xl tabular-nums text-limewash sm:text-6xl">
                  {savings === null ? '—' : formatCurrency(savings)}
                </p>
                <p className="mt-2 text-sm text-brand-100">{tier ? `${100 - tier.rate}% below sample retail at the ${tier.packs}+ pack tier` : 'This item needs at least 5 group packs to qualify.'}</p>
              </div>
              <dl className="space-y-3 border-t border-brand-600 pt-4 text-sm">
                <div className="flex justify-between gap-3"><dt className="text-brand-100">Retail reference</dt><dd className="font-semibold tabular-nums">{formatCurrency(retailTotal)}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-brand-100">Estimated group price</dt><dd className="font-semibold tabular-nums">{groupTotal === null ? 'Below minimum' : formatCurrency(groupTotal)}</dd></div>
              </dl>
              <p className="text-sm leading-relaxed text-brand-200">Illustrative catalog prices. Your final quote includes any shared charges and pickup or delivery fees.</p>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="pantry-title" className="border-y border-line bg-white py-12 sm:py-16">
        <div className="site-container">
          <h2 id="pantry-title" className="section-title">Everyday pantry staples</h2>
          <p className="mt-2 text-slate-700">Sample sealed packs and wholesale volume pricing tiers.</p>
          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {pantry.map((item, index) => item.image && (
              <article key={item.id} className="flex min-w-0 flex-col overflow-hidden rounded-panel border border-line bg-white shadow-panel transition-shadow hover:shadow-md">
                <img src={item.image} alt="" width="480" height="480" loading="lazy" decoding="async" className="aspect-[8/5] w-full bg-brand-50 object-cover" />
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="text-lg font-bold tracking-tight text-brand-950">{item.name}</h3>
                  <p className="mt-1 text-sm text-slate-600">{item.pack} sealed pack · {formatCurrency(item.retail)} retail</p>
                  <dl className="my-4 space-y-2 border-y border-line py-3 text-sm">
                    {sampleTiers.map(({ packs, rate }) => (
                      <div key={packs} className="flex justify-between gap-2"><dt className="text-slate-700">{packs}+ packs · {100 - rate}% less</dt><dd className="font-bold tabular-nums text-brand-800">{formatCurrency(samplePackPrice(item.retail, rate))}</dd></div>
                    ))}
                  </dl>
                  <Button variant="secondary" size="sm" className="mt-auto w-full" onClick={() => { setProductIndex(index); scrollToCalculator() }} aria-label={`Estimate savings for ${item.name}`}>Estimate savings</Button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="groups" tabIndex={-1} aria-labelledby="groups-title" className="py-12 outline-none sm:py-16">
        <div className="site-container grid items-start gap-8 lg:grid-cols-[.85fr_1.15fr]">
          <div>
            <h2 id="groups-title" className="section-title">Buy as a neighborhood.</h2>
            <p className="mt-3 max-w-md leading-relaxed text-slate-700">A few packs from each household can unlock a price tier for the group. Join a public pool nearby, use an invite, or create one for your community.</p>
            <Button className="mt-5" onClick={start}>{onNavigateToDashboard ? 'Find buying groups' : 'Get started with groups'}</Button>
          </div>
          <div id="rules" className="grid gap-3 sm:grid-cols-2">
            {trust.map(({ icon: Icon, title, copy }) => (
              <article key={title} className="rounded-panel border border-line bg-white p-5 shadow-panel">
                <span className="icon-tile"><Icon aria-hidden="true" className="size-5" /></span>
                <h3 className="mt-3 font-bold text-brand-950">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-700">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" tabIndex={-1} aria-labelledby="faq-title" className="border-y border-line bg-white py-12 outline-none sm:py-16">
        <div className="site-container grid gap-6 lg:grid-cols-[.85fr_1.15fr]">
          <h2 id="faq-title" className="section-title">Common questions</h2>
          <div className="divide-y divide-line border-y border-line">
            {questions.map(({ question, answer }) => (
              <details key={question} className="group">
                <summary className="flex min-h-14 cursor-pointer items-center justify-between gap-4 rounded-sm py-3 font-bold text-brand-950">
                  {question}
                  <ChevronDown aria-hidden="true" className="size-5 shrink-0 text-brand-700 transition-transform group-open:rotate-180" />
                </summary>
                <p className="page-enter pb-4 pr-7 leading-relaxed text-slate-700">{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="start-title" className="site-container py-10 sm:py-14">
        <div className="flex flex-wrap items-center justify-between gap-6 rounded-[1.75rem] bg-limewash p-6 sm:p-9">
          <div>
            <h2 id="start-title" className="section-title">Ready to shop together?</h2>
            <p className="mt-2 text-brand-900">Start with a neighborhood buying group or explore the simulated shopping flow.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={start}>{onNavigateToDashboard ? 'Open dashboard' : 'Get started'}</Button>
            <Button variant="outline" onClick={onOpenDemoSwitcher}><FlaskConical aria-hidden="true" className="size-4" /> Try demo personas</Button>
          </div>
        </div>
      </section>
    </div>
  )
}
