'use client'
import { useState } from 'react'
import type { AulaConfig, Oferta, NotificacoesCompra, Branding } from '@/app/aula/config-types'
import { Tabs } from '@/components/admin/Tabs'
import { InfoTip } from '@/components/admin/Tooltip'
import { AulaPreview } from '@/components/admin/AulaPreview'

// ---------------------------------------------------------------------------
// Helpers para converter inicioAt entre ISO UTC e datetime-local (YYYY-MM-DDTHH:MM)
// Cientes do fuso do evento (cfg.timezone), não do navegador.
// ---------------------------------------------------------------------------

// ISO UTC → 'YYYY-MM-DDTHH:mm' wall-clock in tz (for the datetime-local input value)
function isoToLocal(iso: string | null, tz: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false,
    }).formatToParts(d).map(x => [x.type, x.value]),
  )
  // en-CA gives YYYY-MM-DD; hour may be '24' at midnight → normalize
  const hh = p.hour === '24' ? '00' : p.hour
  return `${p.year}-${p.month}-${p.day}T${hh}:${p.minute}`
}

// 'YYYY-MM-DDTHH:mm' wall-clock in tz → ISO UTC string
function localToIso(local: string, tz: string): string | null {
  if (!local) return null
  const [datePart, timePart] = local.split('T')
  const [y, mo, d] = datePart.split('-').map(Number)
  const [h, mi] = (timePart ?? '00:00').split(':').map(Number)
  // Guess the instant as if the wall time were UTC, then correct by tz offset at that instant.
  const guess = Date.UTC(y, mo - 1, d, h, mi)
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    }).formatToParts(new Date(guess)).map(x => [x.type, x.value]),
  )
  const asTz = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day),
    Number(parts.hour === '24' ? '0' : parts.hour), Number(parts.minute), Number(parts.second))
  const offset = asTz - guess // how far tz is ahead of UTC at this instant
  return new Date(guess - offset).toISOString()
}

// ---------------------------------------------------------------------------
// Defaults para sub-objetos que podem ser undefined
// ---------------------------------------------------------------------------
const defaultOferta: Oferta = {
  ativo: false,
  pitchSegundos: 1800,
  patrocinado: '',
  bannerImagem: '',
  marcaLogo: '',
  marcaTitulo: '',
  marca: '',
  descricao: '',
  cta: '',
  link: '',
  cardChamada: '',
  cardPreco: '',
}

const defaultNotificacoes: NotificacoesCompra = {
  ativo: false,
  inicioAposPitchSegundos: 60,
  intervaloMinSegundos: 30,
  intervaloMaxSegundos: 120,
  total: 10,
  produtoLabel: '',
}

const defaultBranding: Branding = {
  marca: 'Webinar',
  areaLabel: 'Área do Aluno',
  teamName: 'Equipe',
  ogImage: '/og-aula.jpg',
}

// ---------------------------------------------------------------------------
// Styled primitives (token-based)
// ---------------------------------------------------------------------------
const inputCls = 'admin-input rounded-lg px-3 py-2 w-full'
const labelCls = 'flex flex-col gap-1'
const spanCls = 'admin-muted text-sm'

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function ConfigForm({ inicial }: { inicial: AulaConfig }) {
  const [cfg, setCfg] = useState<AulaConfig>({
    ...inicial,
    oferta: inicial.oferta ?? defaultOferta,
    notificacoes: inicial.notificacoes ?? defaultNotificacoes,
    branding: inicial.branding ?? defaultBranding,
  })
  const [salvando, setSalvando] = useState(false)
  const [msg, setMsg] = useState('')

  const salvar = async () => {
    setSalvando(true)
    setMsg('')
    const r = await fetch('/api/admin/aula/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cfg),
    })
    setSalvando(false)
    setMsg(r.ok ? 'Salvo!' : 'Erro ao salvar')
  }

  const set = <K extends keyof AulaConfig>(k: K, v: AulaConfig[K]) =>
    setCfg(c => ({ ...c, [k]: v }))

  const setOferta = (k: keyof Oferta, v: Oferta[keyof Oferta]) =>
    setCfg(c => ({ ...c, oferta: { ...(c.oferta ?? defaultOferta), [k]: v } }))

  const setNotif = (k: keyof NotificacoesCompra, v: NotificacoesCompra[keyof NotificacoesCompra]) =>
    setCfg(c => ({ ...c, notificacoes: { ...(c.notificacoes ?? defaultNotificacoes), [k]: v } }))

  const setBranding = (k: keyof Branding, v: Branding[keyof Branding]) =>
    setCfg(c => ({ ...c, branding: { ...(c.branding ?? defaultBranding), [k]: v } }))

  const oferta = cfg.oferta ?? defaultOferta
  const notif = cfg.notificacoes ?? defaultNotificacoes
  const branding = cfg.branding ?? defaultBranding

  return (
    <div className="flex flex-col gap-6 admin-text lg:grid lg:grid-cols-[1fr_340px] lg:items-start lg:gap-8">
      <div className="flex flex-col gap-6">

      {/* ------------------------------------------------------------------ */}
      {/* Tabs */}
      {/* ------------------------------------------------------------------ */}
      <div data-tour="config-tabs">
        <Tabs tabs={[
          { id: 'aula', label: 'Aula' },
          { id: 'oferta', label: 'Oferta' },
          { id: 'notif', label: 'Notificações' },
          { id: 'branding', label: 'Branding' },
        ]}>
          {(active) => (
            <>
              {/* ---------------------------------------------------------- */}
              {/* Tab: Aula */}
              {/* ---------------------------------------------------------- */}
              {active === 'aula' && (
                <div className="flex flex-col gap-4">

                  <label className={labelCls}>
                    <span className={spanCls}>Título da aula</span>
                    <input className={inputCls} value={cfg.titulo}
                      onChange={e => set('titulo', e.target.value)} />
                  </label>

                  <label className={labelCls}>
                    <span className={spanCls}>Descrição SEO</span>
                    <input className={inputCls} value={cfg.seoDescricao}
                      onChange={e => set('seoDescricao', e.target.value)} />
                  </label>

                  <label className={labelCls}>
                    <span className="admin-muted text-sm flex items-center gap-1">
                      YouTube Video ID
                      <InfoTip text="ID do vídeo do YouTube (a parte depois de v= na URL)." />
                    </span>
                    <input className={inputCls} value={cfg.youtubeVideoId}
                      onChange={e => set('youtubeVideoId', e.target.value)} />
                  </label>

                  <label className={labelCls}>
                    <span className={spanCls}>Início da aula (horário no fuso configurado)</span>
                    <input className={inputCls} type="datetime-local"
                      value={isoToLocal(cfg.inicioAt, cfg.timezone)}
                      onChange={e => set('inicioAt', localToIso(e.target.value, cfg.timezone))} />
                    <span className={spanCls}>Horário no fuso configurado ({cfg.timezone}).</span>
                  </label>

                  <label className={labelCls}>
                    <span className={spanCls}>Duração (minutos)</span>
                    <input className={inputCls} type="number" min={1}
                      value={cfg.duracaoMin}
                      onChange={e => set('duracaoMin', Number(e.target.value))} />
                  </label>

                  <label className={labelCls}>
                    <span className={spanCls}>Timezone</span>
                    <input className={inputCls} value={cfg.timezone}
                      onChange={e => set('timezone', e.target.value)} />
                  </label>

                  <label className={labelCls}>
                    <span className="admin-muted text-sm flex items-center gap-1">
                      Pitch (segundos)
                      <InfoTip text="Segundo do vídeo em que o card de oferta sobe no chat." />
                    </span>
                    <input className={inputCls} type="number" min={0}
                      value={cfg.pitchSegundos}
                      onChange={e => set('pitchSegundos', Number(e.target.value))} />
                  </label>

                  <label className={labelCls}>
                    <span className="admin-muted text-sm flex items-center gap-1">
                      Chat offset (segundos)
                      <InfoTip text="Ajuste fino: adianta (+) ou atrasa (−) o chat scriptado para sincronizar com o vídeo." />
                    </span>
                    <input className={inputCls} type="number" min={0}
                      value={cfg.chatOffsetSegundos}
                      onChange={e => set('chatOffsetSegundos', Number(e.target.value))} />
                  </label>

                  <label className={labelCls}>
                    <span className="admin-muted text-sm flex items-center gap-1">
                      Fim ao vivo (segundos)
                      <InfoTip text="Segundo em que o selo muda de 'Ao vivo' para 'Encerrado'." />
                    </span>
                    <input className={inputCls} type="number" min={0}
                      value={cfg.aoVivoFimSegundos}
                      onChange={e => set('aoVivoFimSegundos', Number(e.target.value))} />
                  </label>

                  <label className={labelCls}>
                    <span className="admin-muted text-sm flex items-center gap-1">
                      Contador piso
                      <InfoTip text="Nunca mostrar menos que este número de espectadores ao vivo." />
                    </span>
                    <input className={inputCls} type="number" min={0}
                      value={cfg.contadorPiso}
                      onChange={e => set('contadorPiso', Number(e.target.value))} />
                  </label>

                  <label className={labelCls}>
                    <span className="admin-muted text-sm flex items-center gap-1">
                      Contador multiplicador
                      <InfoTip text="Multiplica os espectadores reais (ex.: 1.5 = +50%). Use 1 para o valor real." />
                    </span>
                    <input className={inputCls} type="number" min={0} step={0.01}
                      value={cfg.contadorMultiplicador}
                      onChange={e => set('contadorMultiplicador', Number(e.target.value))} />
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox"
                      className="w-4 h-4 accent-amber-500"
                      checked={cfg.replayHabilitado}
                      onChange={e => set('replayHabilitado', e.target.checked)} />
                    <span className="text-sm flex items-center gap-1">
                      Replay habilitado
                      <InfoTip text="Se ligado, após a janela ao vivo a página mostra o replay em vez de 'encerrada'." />
                    </span>
                  </label>

                  {/* Recorrência semanal */}
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox"
                      className="w-4 h-4 accent-amber-500"
                      checked={cfg.recorrencia != null}
                      onChange={e => set('recorrencia', e.target.checked
                        ? { weekday: cfg.recorrencia?.weekday ?? 1, fromDate: cfg.recorrencia?.fromDate ?? '' }
                        : null
                      )} />
                    <span className="text-sm flex items-center gap-1">
                      Habilitar recorrência semanal
                      <InfoTip text="Se ligado, a aula se repete toda semana no dia/horário definidos." />
                    </span>
                  </label>

                  {cfg.recorrencia != null && (
                    <>
                      <label className={labelCls}>
                        <span className={spanCls}>Dia da semana (0 = dom, 1 = seg, … 6 = sáb)</span>
                        <input className={inputCls} type="number" min={0} max={6}
                          value={cfg.recorrencia?.weekday ?? 1}
                          onChange={e => set('recorrencia', {
                            weekday: Number(e.target.value),
                            fromDate: cfg.recorrencia?.fromDate ?? '',
                          })} />
                      </label>

                      <label className={labelCls}>
                        <span className={spanCls}>A partir de (data, YYYY-MM-DD)</span>
                        <input className={inputCls} type="date"
                          value={cfg.recorrencia?.fromDate ?? ''}
                          onChange={e => set('recorrencia', {
                            weekday: cfg.recorrencia?.weekday ?? 1,
                            fromDate: e.target.value,
                          })} />
                      </label>
                    </>
                  )}
                </div>
              )}

              {/* ---------------------------------------------------------- */}
              {/* Tab: Oferta */}
              {/* ---------------------------------------------------------- */}
              {active === 'oferta' && (
                <div className="flex flex-col gap-4">

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox"
                      className="w-4 h-4 accent-amber-500"
                      checked={oferta.ativo}
                      onChange={e => setOferta('ativo', e.target.checked)} />
                    <span className="text-sm flex items-center gap-1">
                      Oferta ativa
                      <InfoTip text="Liga/desliga a exibição da oferta (drawer + card) na aula." />
                    </span>
                  </label>

                  <label className={labelCls}>
                    <span className={spanCls}>Pitch da oferta (segundos)</span>
                    <input className={inputCls} type="number" min={0}
                      value={oferta.pitchSegundos}
                      onChange={e => setOferta('pitchSegundos', Number(e.target.value))} />
                  </label>

                  <label className={labelCls}>
                    <span className={spanCls}>Patrocinado (texto)</span>
                    <input className={inputCls} value={oferta.patrocinado}
                      onChange={e => setOferta('patrocinado', e.target.value)} />
                  </label>

                  <label className={labelCls}>
                    <span className={spanCls}>Banner imagem (URL)</span>
                    <input className={inputCls} value={oferta.bannerImagem}
                      onChange={e => setOferta('bannerImagem', e.target.value)} />
                  </label>

                  <label className={labelCls}>
                    <span className={spanCls}>Marca logo (URL)</span>
                    <input className={inputCls} value={oferta.marcaLogo}
                      onChange={e => setOferta('marcaLogo', e.target.value)} />
                  </label>

                  <label className={labelCls}>
                    <span className={spanCls}>Marca título</span>
                    <input className={inputCls} value={oferta.marcaTitulo}
                      onChange={e => setOferta('marcaTitulo', e.target.value)} />
                  </label>

                  <label className={labelCls}>
                    <span className={spanCls}>Marca</span>
                    <input className={inputCls} value={oferta.marca}
                      onChange={e => setOferta('marca', e.target.value)} />
                  </label>

                  <label className={labelCls}>
                    <span className={spanCls}>Descrição</span>
                    <textarea className={inputCls + ' resize-none'} rows={3} value={oferta.descricao}
                      onChange={e => setOferta('descricao', e.target.value)} />
                  </label>

                  <label className={labelCls}>
                    <span className={spanCls}>CTA (texto do botão)</span>
                    <input className={inputCls} value={oferta.cta}
                      onChange={e => setOferta('cta', e.target.value)} />
                  </label>

                  <label className={labelCls}>
                    <span className={spanCls}>Link da oferta</span>
                    <input className={inputCls} value={oferta.link}
                      onChange={e => setOferta('link', e.target.value)} />
                  </label>

                  <label className={labelCls}>
                    <span className={spanCls}>Card chamada</span>
                    <input className={inputCls} value={oferta.cardChamada}
                      onChange={e => setOferta('cardChamada', e.target.value)} />
                  </label>

                  <label className={labelCls}>
                    <span className={spanCls}>Card preço</span>
                    <input className={inputCls} value={oferta.cardPreco}
                      onChange={e => setOferta('cardPreco', e.target.value)} />
                  </label>
                </div>
              )}

              {/* ---------------------------------------------------------- */}
              {/* Tab: Notificações */}
              {/* ---------------------------------------------------------- */}
              {active === 'notif' && (
                <div className="flex flex-col gap-4">

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox"
                      className="w-4 h-4 accent-amber-500"
                      checked={notif.ativo}
                      onChange={e => setNotif('ativo', e.target.checked)} />
                    <span className="text-sm">Notificações ativas</span>
                  </label>

                  <label className={labelCls}>
                    <span className={spanCls}>Início após pitch (segundos)</span>
                    <input className={inputCls} type="number" min={0}
                      value={notif.inicioAposPitchSegundos}
                      onChange={e => setNotif('inicioAposPitchSegundos', Number(e.target.value))} />
                  </label>

                  <label className={labelCls}>
                    <span className={spanCls}>Intervalo mínimo (segundos)</span>
                    <input className={inputCls} type="number" min={0}
                      value={notif.intervaloMinSegundos}
                      onChange={e => setNotif('intervaloMinSegundos', Number(e.target.value))} />
                  </label>

                  <label className={labelCls}>
                    <span className={spanCls}>Intervalo máximo (segundos)</span>
                    <input className={inputCls} type="number" min={0}
                      value={notif.intervaloMaxSegundos}
                      onChange={e => setNotif('intervaloMaxSegundos', Number(e.target.value))} />
                  </label>

                  <label className={labelCls}>
                    <span className={spanCls}>Total de notificações</span>
                    <input className={inputCls} type="number" min={0}
                      value={notif.total}
                      onChange={e => setNotif('total', Number(e.target.value))} />
                  </label>

                  <label className={labelCls}>
                    <span className={spanCls}>Label do produto</span>
                    <input className={inputCls} value={notif.produtoLabel}
                      onChange={e => setNotif('produtoLabel', e.target.value)} />
                  </label>
                </div>
              )}

              {/* ---------------------------------------------------------- */}
              {/* Tab: Branding */}
              {/* ---------------------------------------------------------- */}
              {active === 'branding' && (
                <div className="flex flex-col gap-4">

                  <label className={labelCls}>
                    <span className={spanCls}>Marca (nome exibido)</span>
                    <input className={inputCls} value={branding.marca}
                      onChange={e => setBranding('marca', e.target.value)} />
                  </label>

                  <label className={labelCls}>
                    <span className={spanCls}>Label da área do aluno</span>
                    <input className={inputCls} value={branding.areaLabel}
                      onChange={e => setBranding('areaLabel', e.target.value)} />
                  </label>

                  <label className={labelCls}>
                    <span className={spanCls}>Nome da equipe</span>
                    <input className={inputCls} value={branding.teamName}
                      onChange={e => setBranding('teamName', e.target.value)} />
                  </label>

                  <label className={labelCls}>
                    <span className={spanCls}>Imagem OG (caminho)</span>
                    <input className={inputCls} value={branding.ogImage}
                      onChange={e => setBranding('ogImage', e.target.value)} />
                  </label>
                </div>
              )}
            </>
          )}
        </Tabs>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Save — always visible, outside the tabs */}
      {/* ------------------------------------------------------------------ */}
      <button
        onClick={salvar}
        disabled={salvando}
        className="admin-accent font-bold rounded-full py-3 mt-2 disabled:opacity-50 transition-colors"
      >
        {salvando ? 'Salvando...' : 'Salvar configuração'}
      </button>

      {msg && (
        <p className={`text-sm ${msg === 'Salvo!' ? 'text-green-400' : 'text-red-400'}`}>
          {msg}
        </p>
      )}
      </div>

      {/* right: sticky preview */}
      <div data-tour="config-preview" className="lg:sticky lg:top-6">
        <AulaPreview cfg={cfg} />
      </div>
    </div>
  )
}
