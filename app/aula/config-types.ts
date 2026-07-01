export type Branding = {
  marca: string       // ex.: "Webinar" — usado nos headers/footers
  areaLabel: string   // ex.: "Área do Aluno"
  teamName: string    // nome exibido nas mensagens oficiais
  ogImage: string     // caminho da imagem OG
}

export type Oferta = {
  ativo: boolean
  pitchSegundos: number
  patrocinado: string
  bannerImagem: string
  marcaLogo: string
  marcaTitulo: string
  marca: string
  descricao: string
  cta: string
  link: string
  cardChamada: string
  cardPreco: string
}

export type NotificacoesCompra = {
  ativo: boolean
  inicioAposPitchSegundos: number
  intervaloMinSegundos: number
  intervaloMaxSegundos: number
  total: number
  produtoLabel: string
}

export type MateriaisGrupo = { categoria: string; itens: readonly string[]; nota?: string }
export type Materiais = { titulo: string; subtitulo: string; grupos: readonly MateriaisGrupo[] }

export type AulaConfig = {
  id: string
  slug: string
  nome: string
  titulo: string
  seoDescricao: string
  youtubeVideoId: string
  inicioAt: string | null         // ISO; null = sem aula agendada
  duracaoMin: number
  recorrencia: { weekday: number; fromDate: string } | null
  timezone: string
  replayHabilitado: boolean
  pitchSegundos: number
  chatOffsetSegundos: number
  aoVivoFimSegundos: number
  contadorPiso: number
  contadorMultiplicador: number
  oferta?: Oferta
  notificacoes?: NotificacoesCompra
  materiais?: Materiais
  branding: Branding
}

export type EstadoAula =
  | { fase: 'aguardando'; proximoInicio: string; isToday: boolean }
  | { fase: 'ao_vivo';    inicio: string; fim: string }
  | { fase: 'replay';     proximoInicio: string }

export function isPlaceholder(value: string): boolean {
  return /X{4,}/.test(value) || value === ''
}
