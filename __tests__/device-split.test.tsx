/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { DeviceSplit } from '@/components/admin/DeviceSplit'

it('mostra contagem de mobile e desktop', () => {
  render(<DeviceSplit split={{ mobile: 6, desktop: 4, total: 10, mobilePct: 60 }} />)
  expect(screen.getByText('6')).toBeInTheDocument()
  expect(screen.getByText('4')).toBeInTheDocument()
})
