import { test, expect, type Page } from '@playwright/test'

async function switchPersona(page: Page, name: string) {
  const desktopButton = page.getByRole('button', { name: 'Demo roles', exact: true })
  if (await desktopButton.isVisible()) {
    await desktopButton.click()
  } else {
    await page.getByRole('button', { name: 'Open navigation' }).click()
    await page.getByRole('button', { name: 'Try demo roles', exact: true }).click()
  }
  const dialog = page.getByRole('dialog', { name: 'Demo Persona Switcher' })
  await dialog.getByRole('button', { name: new RegExp(name) }).click()
  await expect(dialog).not.toBeVisible()
}

async function fitsViewport(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width)
}

test('public navigation, FAQ and wholesale calculator', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Better grocery prices, together.')
  await expect(page.getByRole('img', { name: /olive canvas market bag/i })).toBeVisible()

  const navigation = page.getByRole('navigation', { name: 'Main navigation' })
  await navigation.getByRole('button', { name: 'Neighborhood groups' }).click()
  await expect(page.locator('#groups')).toBeFocused()
  await navigation.getByRole('button', { name: 'Wholesale pricing' }).click()

  const calculator = page.getByRole('region', { name: 'Calculate your household savings' })
  await expect(calculator).toBeFocused()
  await expect(calculator.getByText('₹158.4')).toBeVisible()
  await calculator.getByRole('button', { name: 'Add one household pack' }).click()
  await expect(calculator.getByText('₹237.6')).toBeVisible()
  await calculator.getByRole('slider').focus()
  await page.keyboard.press('Home')
  await expect(calculator.getByText('Below minimum')).toBeVisible()

  await page.getByRole('button', { name: 'Estimate savings for Toor dal' }).click()
  await expect(calculator.getByRole('combobox')).toHaveValue('2')
  await page.getByText('Will I be charged for using the demo?').click()
  await expect(page.getByText(/example prices use sample catalog data/i)).toBeVisible()
  await fitsViewport(page)
})

test('auth dialog restores keyboard focus', async ({ page }) => {
  await page.goto('/')
  const signIn = page.getByRole('button', { name: 'Sign in', exact: true })
  await signIn.click()
  const dialog = page.getByRole('dialog', { name: 'Sign in to BULK SHARE' })
  await expect(dialog.getByRole('button', { name: 'Continue with demo roles' })).toBeVisible()
  await expect(dialog.getByLabel('Email address')).toHaveCount(0)
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  await expect(signIn).toBeFocused()
})

test('demo sign-in explains an unavailable backend and can be retried', async ({ page }) => {
  await page.route('**/api/v1/users/demo-login', (route) => route.fulfill({ status: 502 }))
  await page.goto('/')
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await page.getByRole('button', { name: 'Continue with demo roles' }).click()

  const demo = page.getByRole('dialog', { name: 'Demo Persona Switcher' })
  const customer = demo.getByRole('button', { name: /Priya Sharma/ })
  await customer.click()
  await expect(demo.getByRole('alert')).toContainText('Start Uvicorn in the backend terminal on port 8000')

  await page.unroute('**/api/v1/users/demo-login')
  await customer.click()
  await expect(page.getByRole('heading', { name: 'Welcome, Priya!' })).toBeVisible()
})

test('household creates a buying group and adds a private grocery pack', async ({ page }) => {
  await page.goto('/')
  await switchPersona(page, 'Priya Sharma')
  await expect(page.getByRole('heading', { name: /Welcome, Priya/i })).toBeVisible()
  await page.getByRole('button', { name: 'Nearby groups' }).click()
  await page.getByRole('searchbox', { name: 'Search buying groups' }).fill('no group has this name')
  await expect(page.getByText('No groups match your filters')).toBeVisible()
  await page.getByRole('searchbox', { name: 'Search buying groups' }).clear()

  await page.getByRole('button', { name: 'Create buying group', exact: true }).first().click()
  const create = page.getByRole('dialog', { name: /Create/i })
  const groupName = `Browser test group ${Date.now()}`
  await create.getByLabel('Group Name').fill(groupName)
  await create.getByRole('button', { name: /Create/i }).click()

  const catalog = page.getByRole('dialog', { name: 'Browse Grocery Catalog' })
  await catalog.getByRole('searchbox', { name: 'Search grocery catalog' }).fill('India Gate')
  await catalog.getByRole('button', { name: /Add 1 Pack/i }).first().click()
  await expect(catalog.getByText('Added!', { exact: true })).toBeVisible()
  await catalog.getByRole('button', { name: 'Done Browsing' }).click()
  const card = page.getByRole('heading', { name: groupName }).locator('../..')
  await card.getByRole('button', { name: 'My grocery list' }).click()
  await expect(page.getByRole('dialog').getByText(/India Gate/i).first()).toBeVisible()
  await fitsViewport(page)
})

test('organizer, supplier and admin see role-specific tools', async ({ page }) => {
  await page.goto('/')
  await switchPersona(page, 'Rahul Verma')
  await expect(page.getByRole('heading', { name: 'Organize your buying groups' })).toBeVisible()
  await expect(page.getByRole('list', { name: 'Group timeline' })).toBeVisible()
  await page.getByLabel('Selected group').selectOption({ label: 'Indiranagar Essentials Group #1' })
  await page.getByRole('button', { name: 'Demand & tiers', exact: true }).click()
  await expect(page.getByText(/Pooled Demand|Aggregated Demand/i).first()).toBeVisible()
  await expect(page.getByText(/Household grocery lists and delivery addresses stay private/i)).toBeVisible()

  await switchPersona(page, 'Kisan Wholesale Supplies')
  await expect(page.getByRole('heading', { name: /Kisan Wholesale/i })).toBeVisible()
  await page.getByRole('button', { name: 'Product offers' }).click()
  await expect(page.getByRole('table')).toBeVisible()
  await page.getByRole('button', { name: 'Add offer' }).click()
  await expect(page.getByRole('dialog').getByLabel('Price per pack (₹)')).toBeVisible()
  await page.keyboard.press('Escape')

  await switchPersona(page, 'Platform Administrator')
  await expect(page.getByRole('heading', { name: 'Operations console' })).toBeVisible()
  await page.getByRole('button', { name: 'Accounts' }).click()
  await page.getByRole('searchbox', { name: 'Search accounts' }).fill('Priya')
  await expect(page.getByText('priya.customer@bulkshare.com')).toBeVisible()
  await page.getByRole('button', { name: 'Suppliers', exact: true }).click()
  await expect(page.getByText('Verified in the demo', { exact: true }).first()).toBeVisible()
})

test('mobile navigation, calculator and authenticated panels fit the screen', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await fitsViewport(page)

  await page.getByRole('button', { name: 'Open navigation' }).click()
  await page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('button', { name: 'Wholesale pricing' }).click()
  await expect(page.locator('#calculator')).toBeFocused()
  await expect(page.getByRole('navigation', { name: 'Mobile navigation' })).not.toBeVisible()

  await switchPersona(page, 'Priya Sharma')
  await page.getByRole('button', { name: 'View notifications' }).click()
  const notificationPanel = page.getByRole('region', { name: 'Notifications' })
  await expect(notificationPanel).toBeVisible()
  const bounds = await notificationPanel.boundingBox()
  expect(bounds!.x).toBeGreaterThanOrEqual(0)
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(360)
  await page.keyboard.press('Escape')
  await expect(notificationPanel).not.toBeVisible()
  await fitsViewport(page)
})

test('supplier quote flows through household confirmation, payment and simulated procurement', async ({ page, request }) => {
  test.setTimeout(75_000)
  const groupName = `Browser order ${Date.now()}`
  const api = 'http://localhost:8000/api/v1'

  async function demoHeaders(email: string) {
    const response = await request.post(`${api}/users/demo-login`, { data: { role: 'CUSTOMER', email } })
    await expect(response).toBeOK()
    return { Authorization: `Bearer ${(await response.json()).access_token}` }
  }

  const organizer = await demoHeaders('rahul.organizer@bulkshare.com')
  const customer = await demoHeaders('priya.customer@bulkshare.com')
  const group = await request.post(`${api}/groups`, {
    headers: organizer,
    data: {
      name: groupName,
      visibility: 'PUBLIC',
      neighborhood_id: '11111111-1111-1111-1111-111111111111',
      deadline: new Date(Date.now() + 604_800_000).toISOString(),
      min_members: 2,
    },
  })
  await expect(group).toBeOK()
  const groupId = (await group.json()).id
  await expect(await request.post(`${api}/groups/${groupId}/join`, { headers: customer })).toBeOK()

  for (const headers of [organizer, customer]) {
    await expect(await request.post(`${api}/groups/${groupId}/my-items`, {
      headers, data: { variant_id: 'var-rice-01', pack_quantity: 3, brand_preference: 'EXACT' },
    })).toBeOK()
  }
  await expect(await request.post(`${api}/groups/${groupId}/demand-snapshot`, { headers: organizer })).toBeOK()

  await page.goto('/')
  await switchPersona(page, 'Kisan Wholesale Supplies')
  const requestCard = page.getByRole('heading', { name: groupName, exact: true }).locator('../../..')
  await requestCard.getByRole('button', { name: 'Submit quotation' }).click()
  const bid = page.getByRole('dialog', { name: /Submit Wholesale Quotation/i })
  await bid.getByRole('spinbutton', { name: /Price per pack/i }).fill('300')
  await bid.getByRole('button', { name: 'Submit wholesale quotation' }).click()
  await expect(page.getByText(groupName, { exact: true })).toBeVisible()

  await switchPersona(page, 'Rahul Verma')
  await page.getByLabel('Selected group').selectOption({ label: groupName })
  await page.getByRole('button', { name: 'Quotations', exact: true }).click()
  await page.getByRole('button', { name: 'Select Quotation', exact: true }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Select quotation' }).click()

  async function acceptHouseholdOrder(method?: 'delivery') {
    const card = page.getByRole('heading', { name: groupName, exact: true }).locator('../..')
    await card.getByRole('button', { name: 'Group details' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Confirm order' }).click()
    const confirmation = page.getByRole('dialog', { name: /Review & Confirm Final Order/i })
    await expect(confirmation.getByRole('region', { name: 'Your proposed sealed packs' })).toBeVisible()
    if (method === 'delivery') {
      await confirmation.getByRole('radio', { name: /Direct Home Delivery/i }).check()
      await confirmation.getByLabel('Sample delivery address').fill('Demo Apartment, Sample Road')
      await expect(confirmation.getByText('₹930', { exact: true })).toBeVisible()
    }
    await confirmation.getByRole('button', { name: 'Accept & Confirm Order' }).click()
    await expect(confirmation.getByText(/confirmed successfully/i)).toBeVisible()
    await expect(confirmation).not.toBeVisible()
  }

  await page.getByRole('button', { name: 'Household dashboard' }).click()
  await acceptHouseholdOrder()
  await switchPersona(page, 'Priya Sharma')
  await acceptHouseholdOrder('delivery')

  await switchPersona(page, 'Rahul Verma')
  await page.getByRole('button', { name: 'Manage my groups' }).click()
  await page.getByLabel('Selected group').selectOption({ label: groupName })
  await page.getByRole('button', { name: 'Confirmations', exact: true }).click()
  await expect(page.getByText(/2 of 2 members approved/i)).toBeVisible()
  await page.getByRole('button', { name: /Lock Group Order/i }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Lock group order', exact: true }).click()
  await expect(page.getByText('LOCKED & FROZEN')).toBeVisible()

  await switchPersona(page, 'Priya Sharma')
  await page.getByRole('button', { name: 'Orders & tracking' }).click()
  const order = page.getByRole('article', { name: `Order for ${groupName}` })
  await order.getByRole('button', { name: /Pay My Share/ }).click()
  await page.getByRole('dialog').getByRole('button', { name: /^Pay ₹930/i }).click()
  const receipt = page.getByRole('dialog', { name: 'Settlement Receipt' })
  await expect(receipt.getByRole('button', { name: 'Print Receipt' })).toBeVisible()
  await receipt.getByRole('button', { name: 'Close dialog' }).click()

  await switchPersona(page, 'Platform Administrator')
  const procurement = page.getByRole('article').filter({ has: page.getByRole('heading', { name: groupName, exact: true }) })
  await expect(procurement.getByText(/1\/2 households/i)).toBeVisible()
  await procurement.getByRole('button', { name: 'Place wholesale PO' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Issue purchase order' }).click()
  const issuedPurchase = procurement.getByText(/Purchase order PO-BS-/i)
  await expect(issuedPurchase).toBeVisible()
  const poNumber = (await issuedPurchase.textContent())!.replace('Purchase order ', '')

  await procurement.getByRole('button', { name: 'Track fulfillment' }).click()
  const tracking = page.getByRole('dialog', { name: 'Fulfillment tracking' })
  await expect(tracking.getByText('Rahul Verma', { exact: true })).toBeVisible()
  await expect(tracking.getByText('Priya Sharma', { exact: true })).toBeVisible()
  await tracking.getByRole('button', { name: 'Close dialog' }).click()

  await switchPersona(page, 'Kisan Wholesale Supplies')
  await page.getByRole('button', { name: 'Purchase orders', exact: true }).click()
  const shipment = page.getByText(poNumber, { exact: true }).locator('../../..')
  await shipment.getByRole('button', { name: 'Acknowledge PO' }).click()
  await shipment.getByRole('button', { name: 'Dispatch to Hub' }).click()
  await shipment.getByRole('button', { name: 'Mark Delivered to Hub' }).click()
  await expect(shipment.getByText('DELIVERED TO HUB')).toBeVisible()

  await switchPersona(page, 'Platform Administrator')
  await procurement.getByRole('button', { name: 'Track fulfillment' }).click()
  await tracking.getByRole('button', { name: 'Mark delivered', exact: true }).click()
  await expect(tracking.getByText('delivered', { exact: true })).toBeVisible()
})
