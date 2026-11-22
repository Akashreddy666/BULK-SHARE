import { test, expect } from '@playwright/test'

test.describe('BULK SHARE — End-to-End User Journeys', () => {
  test('Landing Page & Value Proposition', async ({ page }) => {
    await page.goto('/')

    // Brand headline
    await expect(page.getByText('BULK')).toBeVisible()
    await expect(page.getByText('SHARE')).toBeVisible()

    // Hero title
    await expect(
      page.getByText(/Buy Groceries Together\./i).or(page.getByText(/Wholesale Prices\./i))
    ).toBeVisible()

    // How it works steps
    await expect(page.getByText(/How Bulk Share Works/i)).toBeVisible()
    await expect(page.getByText(/Pool Local Demand/i)).toBeVisible()
    await expect(page.getByText(/Wholesale Quotations/i)).toBeVisible()
  })

  test('Demo Persona Switcher & Role Dashboards', async ({ page }) => {
    await page.goto('/')

    // Click Demo Roles button
    const demoBtn = page.getByRole('button', { name: /Demo Roles/i })
    await expect(demoBtn).toBeVisible()
    await demoBtn.click()

    // Role switcher modal appears
    await expect(page.getByText(/Demo Persona Switcher/i)).toBeVisible()
    await expect(page.getByText(/Priya Sharma/i)).toBeVisible()
    await expect(page.getByText(/Rahul Verma/i)).toBeVisible()
    await expect(page.getByText(/Kisan Wholesale Supplies/i)).toBeVisible()
    await expect(page.getByText(/Platform Administrator/i)).toBeVisible()

    // Switch to Organizer
    await page.getByText(/Rahul Verma/i).click()

    // Should navigate to dashboard
    await expect(page.getByText(/Neighborhood Group Organizer/i)).toBeVisible()
  })

  test('Explore Neighborhood Pools & Navigation', async ({ page }) => {
    await page.goto('/')

    // Click Neighborhood Groups nav
    const groupsNav = page.getByRole('button', { name: /Neighborhood Groups/i }).first()
    await groupsNav.click()

    // Verify preview heading
    await expect(page.getByText(/Active Neighborhood Pools/i)).toBeVisible()
  })

  test('Interactive Savings Calculator & Wholesale Pricing', async ({ page }) => {
    await page.goto('/')

    // Click Wholesale Pricing nav
    const pricingNav = page.getByRole('button', { name: /Wholesale Pricing/i }).first()
    await pricingNav.click()

    await expect(page.getByText(/Wholesale Volume Pricing Tiers/i)).toBeVisible()
    await expect(page.getByText(/Transparent Tier Thresholds/i)).toBeVisible()
  })
})
