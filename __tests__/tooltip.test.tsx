/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import { render, screen, fireEvent } from '@testing-library/react'
import { InfoTip } from '@/components/admin/Tooltip'

it('revela o texto no foco', () => {
  render(<InfoTip text="explica o campo" />)
  const btn = screen.getByRole('button', { name: /ajuda/i })
  fireEvent.focus(btn)
  expect(screen.getByRole('tooltip')).toHaveTextContent('explica o campo')
})
