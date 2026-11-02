import axe from 'axe-core'
import { expect } from 'vitest'

/**
 * Runs axe-core against `element`. Contrast needs real layout (happy-dom has
 * none) and "region" is about whole pages, so both are left to manual checks.
 */
export async function expectNoA11yViolations(element: Element): Promise<void> {
  const results = await axe.run(element, {
    rules: { 'color-contrast': { enabled: false }, region: { enabled: false } },
  })
  const summary = results.violations.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).join(', ')}`)
  expect(summary).toEqual([])
}
