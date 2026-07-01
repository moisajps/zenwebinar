/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { PageHeader } from '@/components/admin/PageHeader'

it('mostra título, subtítulo e ações', () => {
  render(<PageHeader title="Dashboard" subtitle="hoje" actions={<button>Salvar</button>} />)
  expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
  expect(screen.getByText('hoje')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Salvar' })).toBeInTheDocument()
})
