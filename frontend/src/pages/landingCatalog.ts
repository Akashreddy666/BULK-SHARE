export const pantry = [
  { id: 'rice', name: 'Sona Masoori rice', pack: '5 kg', retail: 360, image: '/pantry/rice.webp' },
  { id: 'oil', name: 'Sunflower cooking oil', pack: '5 L', retail: 720, image: '/pantry/oil.webp' },
  { id: 'dal', name: 'Toor dal', pack: '2 kg', retail: 340, image: '/pantry/dal.webp' },
  { id: 'flour', name: 'Chakki atta', pack: '10 kg', retail: 480, image: '/pantry/flour.webp' },
  { id: 'sugar', name: 'Crystal sugar', pack: '5 kg', retail: 240, image: null },
] as const

// The public example mirrors the sample catalog seed in backend/app/db/seed.py.
export const sampleTiers = [
  { packs: 5, rate: 85 },
  { packs: 15, rate: 78 },
  { packs: 30, rate: 70 },
] as const

export function samplePackPrice(retail: number, rate: number) {
  return retail * rate / 100
}
