// Defaults de seed do produto. O instalador pode ajustar o branding aqui uma vez;
// o conteúdo do webinar é editado depois pelo admin (vai pro banco aula_config).
import type { AulaConfig } from '@/app/aula/config-types'

export const SEED_CONFIG: AulaConfig = {
  id: '00000000-0000-0000-0000-000000000000',
  slug: 'webinar',
  nome: 'Webinar ao vivo',
  titulo: 'Aula ao vivo',
  seoDescricao: 'Participe da nossa aula ao vivo.',
  youtubeVideoId: '',                 // admin define
  inicioAt: null,                     // admin agenda
  duracaoMin: 100,
  recorrencia: null,
  timezone: 'America/Sao_Paulo',
  replayHabilitado: false,
  pitchSegundos: 1800,
  chatOffsetSegundos: 0,
  aoVivoFimSegundos: 6000,
  contadorPiso: 0,
  contadorMultiplicador: 1.0,
  oferta: {
    ativo: false,
    pitchSegundos: 1800,
    patrocinado: 'Oferta exclusiva da aula',
    bannerImagem: '/oferta-banner.png',
    marcaLogo: '/marca-logo.png',
    marcaTitulo: 'Sua oferta especial',
    marca: 'Sua Marca',
    descricao: 'Descreva aqui o benefício principal da sua oferta.',
    cta: 'Quero garantir',
    link: 'https://exemplo.com/checkout',
    cardChamada: 'Garanta agora por',
    cardPreco: '12x de R$ 00,00 ou R$ 000,00 à vista',
  },
  notificacoes: {
    ativo: false,
    inicioAposPitchSegundos: 300,
    intervaloMinSegundos: 25,
    intervaloMaxSegundos: 70,
    total: 20,
    produtoLabel: 'a sua oferta',
  },
  branding: {
    marca: 'Webinar',
    areaLabel: 'Área do Aluno',
    teamName: 'Equipe',
    ogImage: '/og-aula.jpg',
  },
}

// Roteiro neutro de exemplo (~15 linhas). delay = segundos desde o início do vídeo.
export const SEED_ROTEIRO: { delay: number; name: string; msg: string }[] = [
  { delay: 3,   name: 'Ana',      msg: 'Boa noite!' },
  { delay: 6,   name: 'Marcos',   msg: 'Cheguei 🙌' },
  { delay: 9,   name: 'Bia',      msg: 'Ansiosa pela aula' },
  { delay: 14,  name: 'Carla',    msg: 'Está ótimo o som por aqui' },
  { delay: 22,  name: 'Diego',    msg: 'De onde todo mundo é?' },
  { delay: 30,  name: 'Ana',      msg: 'Falo de São Paulo' },
  { delay: 38,  name: 'Bia',      msg: 'Aqui do Rio!' },
  { delay: 52,  name: 'Eduardo',  msg: 'Primeira vez assistindo, animado' },
  { delay: 70,  name: 'Fernanda', msg: 'Anotando tudo 📝' },
  { delay: 95,  name: 'Marcos',   msg: 'Muito bom esse conteúdo' },
  { delay: 130, name: 'Carla',    msg: 'Dá pra rever depois?' },
  { delay: 180, name: 'Diego',    msg: 'Faz sentido, obrigado!' },
  { delay: 240, name: 'Ana',      msg: 'Top demais 👏' },
  { delay: 300, name: 'Fernanda', msg: 'Curtindo bastante' },
  { delay: 360, name: 'Bia',      msg: 'Melhor aula até agora' },
]
