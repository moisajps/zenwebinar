import { ThemeToggle } from './ThemeToggle'
import { UserMenu } from './UserMenu'

export function AdminHeader({ email }: { email: string }) {
  return (
    <header className="h-14 flex-shrink-0 flex items-center justify-between px-4 sm:px-6 admin-panel border-b" style={{ borderColor: 'var(--admin-border)' }}>
      <p className="font-semibold admin-text text-sm">zenwebinar</p>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <UserMenu email={email} />
      </div>
    </header>
  )
}
