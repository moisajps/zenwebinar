export function Funnel({ steps }: { steps: { label: string; value: number }[] }) {
  const max = Math.max(1, ...steps.map(s => s.value))
  return (
    <div className="admin-card rounded-xl p-4 flex flex-col gap-3">
      <p className="text-[11px] uppercase tracking-wider admin-muted">Funil da aula</p>
      {steps.map((s) => {
        const pct = Math.round((s.value / max) * 100)
        return (
          <div key={s.label} className="flex items-center gap-3">
            <span className="text-[12px] admin-muted w-28 shrink-0">{s.label}</span>
            <div className="flex-1 h-6 rounded-md overflow-hidden" style={{ background: 'var(--admin-border)' }}>
              <div
                className="h-full rounded-md flex items-center justify-end pr-2 text-[11px] font-bold"
                style={{
                  width: `${Math.max(pct, 8)}%`,
                  background: 'var(--admin-accent)',
                  color: 'var(--admin-accent-contrast)',
                }}
              >
                {s.value.toLocaleString('pt-BR')}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
