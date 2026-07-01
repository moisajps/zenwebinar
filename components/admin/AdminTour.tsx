'use client'
import { useEffect } from 'react'
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'

const STEPS = [
  { el: '[data-tour="sidebar"]', title: 'Navegação', desc: 'Acesse Configuração, Roteiro e Dashboard por aqui.' },
  { el: '[data-tour="nav-config"]', title: 'Configuração da aula', desc: 'Título, vídeo, horário, oferta e notificações — tudo em abas.' },
  { el: '[data-tour="nav-roteiro"]', title: 'Roteiro do chat', desc: 'Cadastre as mensagens simuladas por tempo, nome e texto.' },
  { el: '[data-tour="nav-dash"]', title: 'Dashboard', desc: 'Acompanhe acessos, pico ao vivo e conversão da oferta.' },
  { el: '[data-tour="theme-toggle"]', title: 'Tema claro/escuro', desc: 'Alterne entre tema claro e escuro do painel aqui.' },
]

function run() {
  const d = driver({
    showProgress: true,
    nextBtnText: 'Próximo', prevBtnText: 'Voltar', doneBtnText: 'Concluir',
    steps: STEPS.filter(s => document.querySelector(s.el)).map(s => ({
      element: s.el, popover: { title: s.title, description: s.desc },
    })),
  })
  d.drive()
}

export function AdminTour() {
  useEffect(() => {
    const onManual = () => run()
    window.addEventListener('admin:tour', onManual)
    try {
      if (!localStorage.getItem('admin_tour_done')) {
        localStorage.setItem('admin_tour_done', '1')
        setTimeout(run, 600)
      }
    } catch { /* ignore */ }
    return () => window.removeEventListener('admin:tour', onManual)
  }, [])
  return null
}
