/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import { render, screen, fireEvent } from '@testing-library/react'
import { Tabs } from '@/components/admin/Tabs'

it('mostra a aba ativa e troca ao clicar', () => {
  render(
    <Tabs tabs={[{ id: 'a', label: 'Aba A' }, { id: 'b', label: 'Aba B' }]}>
      {(active) => <div>conteudo:{active}</div>}
    </Tabs>,
  )
  expect(screen.getByText('conteudo:a')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('tab', { name: 'Aba B' }))
  expect(screen.getByText('conteudo:b')).toBeInTheDocument()
})
