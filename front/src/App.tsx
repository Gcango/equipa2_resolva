import { useState, useRef, useEffect } from 'react'
import heroVideo from './assets/hero-video.mp4'

// ─── Types ───────────────────────────────────────────────────────────────────

type Screen = 'landing' | 'login' | 'register' | 'forgot' | 'app'
type Page = 'dashboard' | 'pedidos' | 'orcamentos' | 'agendamentos' | 'tecnicos' | 'clientes' | 'pagamentos' | 'categorias'
type Role = 'admin' | 'tecnico' | 'cliente'
type Status = 'pendente' | 'em_analise' | 'orcamento_enviado' | 'aceite' | 'agendado' | 'em_curso' | 'concluido' | 'cancelado'

interface AuthUser {
  nome: string
  email: string
  role: Role
}

interface UserAccount {
  nome: string
  email: string
  password: string
  role: Role
}

interface PedidoHistoricoItem {
  id: string
  tipo: 'cliente' | 'admin' | 'tecnico'
  texto: string
  data: string
}

interface Pedido {
  id: string
  cliente: string
  categoria: string
  descricao: string
  morada: string
  cidade: string
  data: string
  status: Status
  prioridade: 'baixa' | 'media' | 'alta'
  tecnico?: string
  tecnico_id?: number
  fotos?: string[]
  historico?: PedidoHistoricoItem[]
}

interface Orcamento {
  id: string
  pedido_id: string
  pedidoId?: string
  cliente: string
  servico: string
  valor: number
  validade: string
  status: 'pendente' | 'aceite' | 'rejeitado'
  itens: {
    id?: number
    descricao: string
    valor: number
  }[]
}

interface Agendamento {
  id: string
  pedidoId: string
  pedido_id?: string
  tecnico_id?: number
  cliente: string
  tecnico: string
  servico: string
  data: string
  hora: string
  duracao: string
  status: 'confirmado' | 'em_curso' | 'concluido' | 'cancelado'
}

interface Tecnico {
  id: number
  nome: string
  especialidades: string[]
  disponivel: boolean
  avaliacao: number
  servicosConcluidos: number
  telefone: string
  email: string
}

interface Pagamento {
  id: string
  cliente: string
  servico: string
  valor: number
  data: string
  metodo: string
  status: 'pendente' | 'pago' | 'falhado'
}

interface Categoria {
  id: number
  nome: string
  descricao: string
  icon: string
  total: number
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const pedidosData: Pedido[] = [
  {
    id: 'P-2401',
    cliente: 'Ana Ferreira',
    categoria: 'Canalização',
    descricao: 'Fuga de água na cozinha perto do lavatório',
    morada: 'Rua das Flores 12',
    cidade: 'Lisboa',
    data: '2026-09-15',
    status: 'agendado',
    prioridade: 'alta',
    tecnico: 'Carlos Mendes',
    fotos: [],
    historico: [
      {
        id: 'h1',
        tipo: 'cliente',
        texto: 'Pedido enviado com foto do problema.',
        data: '2026-09-15T09:00:00'
      },
      {
        id: 'h2',
        tipo: 'admin',
        texto: 'Pedido validado e agendado com Carlos Mendes.',
        data: '2026-09-15T11:30:00'
      }
    ]
  },
  {
    id: 'P-2402',
    cliente: 'João Rodrigues',
    categoria: 'Eletricidade',
    descricao: 'Tomadas sem corrente no quarto principal',
    morada: 'Av. da Liberdade 45',
    cidade: 'Lisboa',
    data: '2026-09-16',
    status: 'orcamento_enviado',
    prioridade: 'media',
    tecnico: 'Rui Santos',
    fotos: [],
    historico: [
      {
        id: 'h3',
        tipo: 'cliente',
        texto: 'Solicitação registada com descrição detalhada.',
        data: '2026-09-16T08:00:00'
      }
    ]
  },
  {
    id: 'P-2403',
    cliente: 'Marta Costa',
    categoria: 'Climatização',
    descricao: 'Instalação e ajuste de sistema de climatização',
    morada: 'Rua do Ouro 78',
    cidade: 'Porto',
    data: '2026-09-17',
    status: 'em_analise',
    prioridade: 'baixa',
    fotos: [],
    historico: [
      {
        id: 'h4',
        tipo: 'admin',
        texto: 'Pedido em análise para confirmação de orçamento.',
        data: '2026-09-17T10:00:00'
      }
    ]
  },
  {
    id: 'P-2404',
    cliente: 'Pedro Alves',
    categoria: 'Refrigeração',
    descricao: 'Frigorífico não arrefece corretamente',
    morada: 'Rua Augusta 23',
    cidade: 'Lisboa',
    data: '2026-09-17',
    status: 'pendente',
    prioridade: 'alta',
    fotos: [],
    historico: [
      {
        id: 'h5',
        tipo: 'cliente',
        texto: 'Pedido novo recebido pelo cliente.',
        data: '2026-09-17T09:15:00'
      }
    ]
  },
  {
    id: 'P-2405',
    cliente: 'Sofia Lima',
    categoria: 'Eletricidade',
    descricao: 'Instalação de quadro elétrico novo',
    morada: 'Rua de Santa Catarina 56',
    cidade: 'Porto',
    data: '2026-09-18',
    status: 'concluido',
    prioridade: 'media',
    tecnico: 'Carlos Mendes',
    fotos: [],
    historico: [
      {
        id: 'h6',
        tipo: 'tecnico',
        texto: 'Serviço concluído com inspeção final.',
        data: '2026-09-18T16:00:00'
      }
    ]
  },
  {
    id: 'P-2406',
    cliente: 'Rui Monteiro',
    categoria: 'Canalização',
    descricao: 'Entupimento no wc',
    morada: 'Travessa da Paz 9',
    cidade: 'Braga',
    data: '2026-09-18',
    status: 'em_curso',
    prioridade: 'alta',
    tecnico: 'Tiago Pires',
    fotos: [],
    historico: [
      {
        id: 'h7',
        tipo: 'tecnico',
        texto: 'Técnico apontado e trabalho em curso.',
        data: '2026-09-18T13:45:00'
      }
    ]
  },
]

const orcamentosData: Orcamento[] = [
  {
    id: 'ORC-001',
    pedido_id: 'P-2402',
    pedidoId: 'P-2402',
    cliente: 'João Rodrigues',
    servico: 'Reparação Elétrica',
    valor: 185,
    validade: '2026-09-25',
    status: 'pendente',
    itens: [
      { descricao: 'Mão de obra (2h)', valor: 120 },
      { descricao: 'Material (tomadas + cabo)', valor: 65 }
    ]
  },
  {
    id: 'ORC-002',
    pedido_id: 'P-2403',
    pedidoId: 'P-2403',
    cliente: 'Marta Costa',
    servico: 'Pintura Interior',
    valor: 1240,
    validade: '2026-09-28',
    status: 'aceite',
    itens: [
      { descricao: 'Mão de obra (4 dias)', valor: 800 },
      { descricao: 'Tinta e materiais', valor: 440 }
    ]
  },
  {
    id: 'ORC-003',
    pedido_id: 'P-2401',
    pedidoId: 'P-2401',
    cliente: 'Ana Ferreira',
    servico: 'Canalização',
    valor: 320,
    validade: '2026-09-22',
    status: 'aceite',
    itens: [
      { descricao: 'Mão de obra (3h)', valor: 180 },
      { descricao: 'Peças e material', valor: 140 }
    ]
  },
]

const agendamentosData: Agendamento[] = [
  {
    id: 'AG-001',
    pedidoId: 'P-2401',
    cliente: 'Ana Ferreira',
    tecnico: 'Carlos Mendes',
    servico: 'Reparação de canalização',
    data: '2026-09-20',
    hora: '09:00',
    duracao: '3h',
    status: 'confirmado'
  },
  {
    id: 'AG-002',
    pedidoId: 'P-2406',
    cliente: 'Rui Monteiro',
    tecnico: 'Tiago Pires',
    servico: 'Desentupimento WC',
    data: '2026-09-18',
    hora: '14:30',
    duracao: '2h',
    status: 'em_curso'
  },
  {
    id: 'AG-003',
    pedidoId: 'P-2405',
    cliente: 'Sofia Lima',
    tecnico: 'Carlos Mendes',
    servico: 'Instalação quadro elétrico',
    data: '2026-09-16',
    hora: '08:00',
    duracao: '4h',
    status: 'concluido'
  },
  {
    id: 'AG-004',
    pedidoId: 'P-2402',
    cliente: 'João Rodrigues',
    tecnico: 'Rui Santos',
    servico: 'Reparação elétrica',
    data: '2026-09-22',
    hora: '10:00',
    duracao: '2h',
    status: 'confirmado'
  },
]

const tecnicosData: Tecnico[] = [
  {
    id: 1,
    nome: 'Carlos Mendes',
    especialidades: ['Eletricidade', 'AVAC'],
    disponivel: true,
    avaliacao: 4.9,
    servicosConcluidos: 142,
    telefone: '+351 912 345 678',
    email: 'carlos@resolva.pt'
  },
  {
    id: 2,
    nome: 'Rui Santos',
    especialidades: ['Eletricidade'],
    disponivel: true,
    avaliacao: 4.7,
    servicosConcluidos: 98,
    telefone: '+351 913 456 789',
    email: 'rui@resolva.pt'
  },
  {
    id: 3,
    nome: 'Tiago Pires',
    especialidades: ['Canalização'],
    disponivel: false,
    avaliacao: 4.8,
    servicosConcluidos: 215,
    telefone: '+351 914 567 890',
    email: 'tiago@resolva.pt'
  },
  {
    id: 4,
    nome: 'Luís Oliveira',
    especialidades: ['Carpintaria', 'Montagem'],
    disponivel: true,
    avaliacao: 4.6,
    servicosConcluidos: 67,
    telefone: '+351 915 678 901',
    email: 'luis@resolva.pt'
  },
  {
    id: 5,
    nome: 'Filipe Sousa',
    especialidades: ['Climatização', 'Canalização'],
    disponivel: true,
    avaliacao: 4.5,
    servicosConcluidos: 83,
    telefone: '+351 916 789 012',
    email: 'filipe@resolva.pt'
  },
]

const pagamentosData: Pagamento[] = [
  {
    id: 'PAG-001',
    cliente: 'Marta Costa',
    servico: 'Pintura Interior',
    valor: 1240,
    data: '2026-09-17',
    metodo: 'Transferência',
    status: 'pago'
  },
  {
    id: 'PAG-002',
    cliente: 'Ana Ferreira',
    servico: 'Canalização',
    valor: 320,
    data: '2026-09-20',
    metodo: 'Multibanco',
    status: 'pendente'
  },
  {
    id: 'PAG-003',
    cliente: 'Sofia Lima',
    servico: 'Quadro elétrico',
    valor: 580,
    data: '2026-09-16',
    metodo: 'MB Way',
    status: 'pago'
  },
  {
    id: 'PAG-004',
    cliente: 'João Rodrigues',
    servico: 'Reparação elétrica',
    valor: 185,
    data: '2026-09-22',
    metodo: 'Multibanco',
    status: 'pendente'
  },
  {
    id: 'PAG-005',
    cliente: 'Rui Monteiro',
    servico: 'Desentupimento WC',
    valor: 95,
    data: '2026-09-18',
    metodo: 'MB Way',
    status: 'pago'
  },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

const statusLabels: Record<Status, string> = {
  pendente: 'Pendente',
  em_analise: 'Em Análise',
  orcamento_enviado: 'Orçamento Enviado',
  aceite: 'Aceite',
  agendado: 'Agendado',
  em_curso: 'Em Curso',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
}

const statusColors: Record<string, string> = {
  pendente: 'bg-amber-50 text-amber-700 border-amber-200',
  em_analise: 'bg-blue-50 text-blue-700 border-blue-200',
  orcamento_enviado: 'bg-purple-50 text-purple-700 border-purple-200',
  aceite: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  agendado: 'bg-sky-50 text-sky-700 border-sky-200',
  em_curso: 'bg-orange-50 text-orange-700 border-orange-200',
  concluido: 'bg-green-50 text-green-700 border-green-200',
  cancelado: 'bg-red-50 text-red-700 border-red-200',
  pago: 'bg-green-50 text-green-700 border-green-200',
  falhado: 'bg-red-50 text-red-700 border-red-200',
  confirmado: 'bg-sky-50 text-sky-700 border-sky-200',
  rejeitado: 'bg-red-50 text-red-700 border-red-200',
}

const prioridadeColors: Record<string, string> = {
  alta: 'bg-red-100 text-red-700',
  media: 'bg-amber-100 text-amber-700',
  baixa: 'bg-slate-100 text-slate-600',
}

const catIcons: Record<string, string> = {
  Eletricidade: '⚡',
  Canalização: '🔧',
  Carpintaria: '🪚',
  Montagem: '🛠️',
  Climatização: '❄️',
  Refrigeração: '🧊',
  Manutenção: '🔩',
  'Pequenas Reparações': '🧰',
}

function Badge({ label, cls }: { label: string; cls: string }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}
    >
      {label}
    </span>
  )
}

// ─── ══════════════════════════════════════════════════════════════════════ ───
// ─── LANDING PAGE ────────────────────────────────────────────────────────────
// ─── ══════════════════════════════════════════════════════════════════════ ───

function LandingPage({
  onLogin,
  onRegister
}: {
  onLogin: () => void
  onRegister: () => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)

  const features = [
    {
      icon: '📋',
      title: 'Gestão de Pedidos',
      desc: 'Crie e acompanhe pedidos de serviço em tempo real com histórico completo.'
    },
    {
      icon: '💰',
      title: 'Orçamentos Digitais',
      desc: 'Envie, aceite e rejeite orçamentos de forma rápida e segura.'
    },
    {
      icon: '📅',
      title: 'Agendamento Inteligente',
      desc: 'Marque serviços sem conflitos e gira a disponibilidade dos técnicos.'
    },
    {
      icon: '👷',
      title: 'Equipa de Técnicos',
      desc: 'Atribua técnicos por especialidade e monitorize o desempenho.'
    },
    {
      icon: '📸',
      title: 'Registo Fotográfico',
      desc: 'Os clientes enviam fotos do problema para diagnóstico mais preciso.'
    },
    {
      icon: '💳',
      title: 'Controlo de Pagamentos',
      desc: 'Registe e acompanhe pagamentos pendentes e confirmados.'
    },
  ]

  const stats = [
    { value: '2 400+', label: 'Serviços concluídos' },
    { value: '98%', label: 'Satisfação do cliente' },
    { value: '150+', label: 'Técnicos certificados' },
    { value: '48h', label: 'Tempo médio de resposta' },
  ]

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0D1B2A',
        fontFamily: 'Inter, sans-serif'
      }}
    >
      {/* Navbar */}
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          background: 'rgba(13,27,42,0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          padding: '0 48px',
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <BrandLogo size={30} compact />
          <span
            style={{
              fontFamily: 'DM Sans, sans-serif',
              fontWeight: 800,
              fontSize: 18,
              color: '#fff',
              letterSpacing: '0.12em'
            }}
          >
            RESOLVA
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={onLogin}
            style={{
              padding: '8px 20px',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'transparent',
              color: 'rgba(255,255,255,0.85)',
              cursor: 'pointer',
              fontSize: 14,
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500
            }}
          >
            Entrar
          </button>

          <button
            onClick={onRegister}
            style={{
              padding: '8px 20px',
              borderRadius: 8,
              border: 'none',
              background: '#1565D8',
              color: '#fff',
              cursor: 'pointer',
              fontSize: 14,
              fontFamily: 'Inter, sans-serif',
              fontWeight: 600
            }}
          >
            Criar Conta
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section
        style={{
          position: 'relative',
          height: '100vh',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <video
          ref={videoRef}
          src={heroVideo}
          autoPlay
          muted
          loop
          playsInline
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0.45
          }}
        />

        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(to bottom, rgba(13,27,42,0.3) 0%, rgba(13,27,42,0.2) 50%, rgba(13,27,42,0.95) 100%)'
          }}
        />

        <div
          style={{
            position: 'relative',
            zIndex: 10,
            textAlign: 'center',
            maxWidth: 760,
            padding: '0 24px'
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px',
              borderRadius: 20,
              background: 'rgba(21,101,216,0.25)',
              border: '1px solid rgba(21,101,216,0.4)',
              marginBottom: 28
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#1565D8',
                display: 'inline-block'
              }}
            />

            <span
              style={{
                fontSize: 12,
                color: '#93B4E0',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase'
              }}
            >
              Plataforma de Gestão Técnica
            </span>
          </div>

          <h1
            style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 'clamp(36px, 6vw, 68px)',
              fontWeight: 700,
              color: '#fff',
              lineHeight: 1.1,
              letterSpacing: '-1.5px',
              margin: '0 0 24px'
            }}
          >
            Serviços técnicos,
            <br />
            <span style={{ color: '#1565D8' }}>
              geridos com precisão.
            </span>
          </h1>

          <p
            style={{
              fontSize: 'clamp(15px, 2vw, 18px)',
              color: 'rgba(255,255,255,0.6)',
              lineHeight: 1.7,
              maxWidth: 560,
              margin: '0 auto 36px'
            }}
          >
            Da solicitação ao pagamento — uma plataforma completa para clientes,
            técnicos e administradores.
          </p>

          <div
            style={{
              display: 'flex',
              gap: 12,
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}
          >
            <button
              onClick={onRegister}
              style={{
                padding: '14px 32px',
                borderRadius: 10,
                border: 'none',
                background: '#1565D8',
                color: '#fff',
                cursor: 'pointer',
                fontSize: 15,
                fontFamily: 'Inter, sans-serif',
                fontWeight: 600,
                boxShadow: '0 8px 32px rgba(21,101,216,0.4)'
              }}
            >
              Começar Gratuitamente →
            </button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section
        style={{
          background: '#0A1520',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          padding: '32px 48px'
        }}
      >
        <div
          style={{
            maxWidth: 900,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 24
          }}
        >
          {stats.map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: 32,
                  fontWeight: 700,
                  color: '#fff'
                }}
              >
                {s.value}
              </div>

              <div
                style={{
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.4)',
                  marginTop: 4
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section
        style={{
          padding: '96px 48px',
          maxWidth: 1100,
          margin: '0 auto'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div
            style={{
              fontSize: 12,
              color: '#1565D8',
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: 12
            }}
          >
            Funcionalidades
          </div>

          <h2
            style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 'clamp(28px, 4vw, 42px)',
              fontWeight: 700,
              color: '#fff'
            }}
          >
            Tudo o que precisa, num só lugar
          </h2>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 20
          }}
        >
          {features.map(f => (
            <div
              key={f.title}
              style={{
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 14,
                border: '1px solid rgba(255,255,255,0.07)',
                padding: '28px 24px'
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 14 }}>
                {f.icon}
              </div>

              <div
                style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontWeight: 600,
                  fontSize: 16,
                  color: '#fff',
                  marginBottom: 8
                }}
              >
                {f.title}
              </div>

              <div
                style={{
                  fontSize: 14,
                  color: 'rgba(255,255,255,0.45)',
                  lineHeight: 1.65
                }}
              >
                {f.desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section
        style={{
          background: 'rgba(21,101,216,0.12)',
          borderTop: '1px solid rgba(21,101,216,0.2)',
          borderBottom: '1px solid rgba(21,101,216,0.2)',
          padding: '80px 48px',
          textAlign: 'center'
        }}
      >
        <h2
          style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 'clamp(24px, 4vw, 38px)',
            fontWeight: 700,
            color: '#fff'
          }}
        >
          Pronto para começar?
        </h2>

        <p
          style={{
            fontSize: 16,
            color: 'rgba(255,255,255,0.5)',
            marginBottom: 32
          }}
        >
          Registe-se gratuitamente e comece a gerir os seus serviços hoje.
        </p>

        <button
          onClick={onRegister}
          style={{
            padding: '14px 36px',
            borderRadius: 10,
            border: 'none',
            background: '#1565D8',
            color: '#fff',
            cursor: 'pointer',
            fontSize: 15,
            fontWeight: 600
          }}
        >
          Criar Conta Gratuita
        </button>
      </section>

      {/* Footer */}
      <footer
        style={{
          padding: '32px 48px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid rgba(255,255,255,0.05)'
        }}
      >
        <span
          style={{
            fontWeight: 700,
            color: 'rgba(255,255,255,0.4)'
          }}
        >
          RESOLVA
        </span>

        <span
          style={{
            fontSize: 12,
            color: 'rgba(255,255,255,0.2)'
          }}
        >
          © 2026 RESOLVA · Gestão de Serviços Técnicos
        </span>
      </footer>
    </div>
  )
}

// ─── AUTH PAGES ──────────────────────────────────────────────────────────────

function BrandLogo({
  size = 38,
  compact = false
}: {
  size?: number
  compact?: boolean
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        filter: 'drop-shadow(0 12px 18px rgba(30, 64, 175, 0.26))'
      }}
    >
      <svg
        width={compact ? size * 0.88 : size}
        height={compact ? size * 0.88 : size}
        viewBox="0 0 128 128"
        aria-hidden="true"
        style={{ display: 'block' }}
      >
        <defs>
          <linearGradient
            id="resolvaLogoBlue"
            x1="0%"
            x2="100%"
            y1="0%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="50%" stopColor="#1d4ed8" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
        </defs>

        <g
          fill="none"
          stroke="url(#resolvaLogoBlue)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="48" cy="48" r="24" strokeWidth="9" />
          <path d="M82 84L112 114" strokeWidth="10" />
          <path d="M34 25L16 16L16 34" />
          <path d="M62 25L80 16L80 34" />
          <path d="M25 62L16 80L34 80" />
          <path d="M62 62L80 80L80 62" />
          <path d="M61 19v14M19 61h14M95 61h14M61 95v14" />
        </g>
      </svg>
    </div>
  )
}

function AuthLayout({
  children,
  title,
  subtitle
}: {
  children: React.ReactNode
  title: string
  subtitle: string
}) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #F7F9FC 0%, #EEF4FF 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '36px 20px'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 430,
          background: '#fff',
          borderRadius: 24,
          boxShadow: '0 18px 60px rgba(15, 23, 42, 0.08)',
          border: '1px solid rgba(148, 163, 184, 0.18)',
          padding: '28px 28px 22px'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            marginBottom: 18
          }}
        >
          <BrandLogo size={34} />

          <div
            style={{
              fontFamily: 'DM Sans, sans-serif',
              fontWeight: 800,
              fontSize: 18,
              color: '#0F172A',
              letterSpacing: '0.12em'
            }}
          >
            RESOLVA
          </div>
        </div>

        <div style={{ marginBottom: 24, textAlign: 'center' }}>
          <h1
            style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 30,
              fontWeight: 700,
              color: '#0D1B2A',
              margin: '0 0 8px'
            }}
          >
            {title}
          </h1>

          <p
            style={{
              fontSize: 14,
              color: '#6B7A90',
              margin: 0
            }}
          >
            {subtitle}
          </p>
        </div>

        {children}
      </div>
    </div>
  )
}

function InputField({
  label,
  type = 'text',
  placeholder,
  value,
  onChange
}: {
  label: string
  type?: string
  placeholder: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label
        style={{
          display: 'block',
          fontSize: 13,
          fontWeight: 600,
          color: '#0D1B2A',
          marginBottom: 6
        }}
      >
        {label}
      </label>

      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '11px 14px',
          borderRadius: 8,
          border: '1px solid #E4E9F0',
          fontSize: 14,
          color: '#0D1B2A',
          outline: 'none',
          boxSizing: 'border-box',
          background: '#FAFBFC'
        }}
      />
    </div>
  )
}

// ======================================================
// LOGIN
// ======================================================

function LoginPage({
  users,
  onSuccess,
  onRegister,
  onForgot,
  onBack
}: {
  users: UserAccount[]
  onSuccess: (u: AuthUser) => void
  onRegister: () => void
  onForgot: () => void
  onBack: () => void
}) {
  const [email, setEmail] = useState(
    () => localStorage.getItem('resolva_remember_email') ?? ''
  )

  const [pass, setPass] = useState('')

  const [rememberMe, setRememberMe] = useState(
    () => localStorage.getItem('resolva_remember_me') === 'true'
  )

  const [showPassword, setShowPassword] = useState(false)
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [error, setError] = useState('')
  const [aEntrar, setAEntrar] = useState(false)

  // ==================================================
  // LOGIN REAL ATRAVÉS DO BACKEND
  // ==================================================

  async function handleLogin() {
    setError('')

    if (!email.trim() || !pass) {
      setError('Preencha todos os campos.')
      return
    }

    try {
      setAEntrar(true)

      const resposta = await fetch(
        'http://localhost:3000/api/login',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email.trim(),
            password: pass,
          }),
        }
      )

      const dados = await resposta.json()

      if (!resposta.ok) {
        setError(
          dados.erro ||
          'Email ou palavra-passe incorretos.'
        )
        return
      }

      // ==================================================
      // GUARDAR EMAIL CASO "LEMBRAR EMAIL" ESTEJA ATIVO
      // ==================================================

      if (rememberMe) {
        localStorage.setItem(
          'resolva_remember_email',
          email.trim()
        )

        localStorage.setItem(
          'resolva_remember_me',
          'true'
        )
      } else {
        localStorage.removeItem(
          'resolva_remember_email'
        )

        localStorage.setItem(
          'resolva_remember_me',
          'false'
        )
      }

      // ==================================================
      // ENTRAR NA APLICAÇÃO COM OS DADOS DO BACKEND
      // ==================================================

      onSuccess({
        nome: dados.utilizador.nome,
        email: dados.utilizador.email,
        role: dados.utilizador.role,
      })

    } catch (erro) {
      console.error(
        'Erro ao efetuar login:',
        erro
      )

      setError(
        'Não foi possível ligar ao servidor. Verifique se o backend está ligado.'
      )

    } finally {
      setAEntrar(false)
    }
  }

  // ==================================================
  // PRIMEIRO ECRÃ DO LOGIN
  // ==================================================

  if (!showEmailForm) {
    return (
      <AuthLayout
        title="Entrar na conta"
        subtitle="Continua com o teu email e palavra-passe"
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16
          }}
        >
          <button
            onClick={() => setShowEmailForm(true)}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 12,
              border: '1px solid #DCE7FF',
              background: '#EFF6FF',
              color: '#1D4ED8',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 700
            }}
          >
            Usar email e palavra-passe
          </button>

          <div
            style={{
              textAlign: 'center',
              fontSize: 14,
              color: '#6B7A90'
            }}
          >
            Ainda não tens conta?{' '}

            <button
              onClick={onRegister}
              style={{
                color: '#1565D8',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700
              }}
            >
              Criar conta
            </button>
          </div>

          <div
            style={{
              textAlign: 'center',
              marginTop: 6
            }}
          >
            <button
              onClick={onBack}
              style={{
                fontSize: 13,
                color: '#9AA5B4',
                background: 'none',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              ← Voltar ao início
            </button>
          </div>
        </div>
      </AuthLayout>
    )
  }

  // ==================================================
  // FORMULÁRIO DE EMAIL E PASSWORD
  // ==================================================

  return (
    <AuthLayout
      title="Bem-vindo de volta"
      subtitle="Inicia sessão na tua conta RESOLVA"
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16
        }}
      >
        {error && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 8,
              background: '#FEF2F2',
              border: '1px solid #FCA5A5',
              color: '#DC2626',
              fontSize: 13
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 14
          }}
        >
          {/* EMAIL */}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: 12,
              padding: '10px 12px'
            }}
          >
            <span style={{ fontSize: 15 }}>
              ✉️
            </span>

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => {
                setEmail(e.target.value)
                setError('')
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  handleLogin()
                }
              }}
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: 14,
                color: '#0D1B2A'
              }}
            />
          </div>

          {/* PASSWORD */}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: 12,
              padding: '10px 12px'
            }}
          >
            <span style={{ fontSize: 15 }}>
              🔒
            </span>

            <input
              type={
                showPassword
                  ? 'text'
                  : 'password'
              }
              placeholder="Palavra-passe"
              value={pass}
              onChange={e => {
                setPass(e.target.value)
                setError('')
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  handleLogin()
                }
              }}
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: 14,
                color: '#0D1B2A'
              }}
            />

            <button
              type="button"
              onClick={() =>
                setShowPassword(v => !v)
              }
              style={{
                border: 'none',
                background: 'transparent',
                color: '#64748B',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {showPassword
                ? 'OCULTAR'
                : 'VER'}
            </button>
          </div>
        </div>

        {/* LEMBRAR EMAIL / RECUPERAR PASSWORD */}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            fontSize: 12,
            color: '#6B7A90'
          }}
        >
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer'
            }}
          >
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={e =>
                setRememberMe(
                  e.target.checked
                )
              }
              style={{
                accentColor: '#1565D8'
              }}
            />

            Lembrar email
          </label>

          <button
            onClick={onForgot}
            style={{
              fontSize: 12,
              color: '#1565D8',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Esqueci-me
          </button>
        </div>

        {/* BOTÃO LOGIN */}

        <button
          onClick={handleLogin}
          disabled={aEntrar}
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: 12,
            border: 'none',
            background:
              'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
            color: '#fff',
            cursor: aEntrar
              ? 'not-allowed'
              : 'pointer',
            fontSize: 15,
            fontWeight: 700,
            boxShadow:
              '0 8px 20px rgba(37,99,235,0.25)',
            opacity: aEntrar ? 0.7 : 1
          }}
        >
          {aEntrar
            ? 'A entrar...'
            : 'Entrar'}
        </button>

        <button
          onClick={() =>
            setShowEmailForm(false)
          }
          style={{
            fontSize: 13,
            color: '#64748B',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          ← Voltar às contas
        </button>

        <div
          style={{
            textAlign: 'center',
            fontSize: 14,
            color: '#6B7A90'
          }}
        >
          Ainda não tens conta?{' '}

          <button
            onClick={onRegister}
            style={{
              color: '#1565D8',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700
            }}
          >
            Criar conta
          </button>
        </div>

        <div style={{ textAlign: 'center' }}>
          <button
            onClick={onBack}
            style={{
              fontSize: 13,
              color: '#9AA5B4',
              background: 'none',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            ← Voltar ao início
          </button>
        </div>
      </div>
    </AuthLayout>
  )
}


function RegisterPage({
  users,
  onSuccess,
  onLogin,
  onBack
}: {
  users: UserAccount[]
  onSuccess: (u: AuthUser, password?: string) => void
  onLogin: () => void
  onBack: () => void
}) {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [confirm, setConfirm] = useState('')
  const [role, setRole] = useState<Role>('cliente')
  const [error, setError] = useState('')
  const [aCriar, setACriar] = useState(false)

  const [categoriasRegisto, setCategoriasRegisto] = useState<Categoria[]>([])
  const [especialidadesSelecionadas, setEspecialidadesSelecionadas] = useState<number[]>([])


  // ======================================================
  // CARREGAR CATEGORIAS PARA AS ESPECIALIDADES DO TÉCNICO
  // ======================================================

  useEffect(() => {
    async function carregarCategoriasRegisto() {
      try {
        const resposta = await fetch(
          'http://localhost:3000/api/categorias'
        )

        if (!resposta.ok) {
          throw new Error('Erro ao carregar categorias.')
        }

        const dados = await resposta.json()

        setCategoriasRegisto(dados)

      } catch (erro) {
        console.error(
          'Erro ao carregar categorias no registo:',
          erro
        )
      }
    }

    carregarCategoriasRegisto()
  }, [])


  // ======================================================
  // REGISTO REAL ATRAVÉS DO BACKEND
  // ======================================================

  async function handleRegister() {
    setError('')

    // ==================================================
    // 1. VALIDAR CAMPOS
    // ==================================================

    if (
      !nome.trim() ||
      !email.trim() ||
      !pass ||
      !confirm
    ) {
      setError('Preencha todos os campos.')
      return
    }

    // ==================================================
    // 2. CONFIRMAR PASSWORD
    // ==================================================

    if (pass !== confirm) {
      setError(
        'As palavras-passe não coincidem.'
      )
      return
    }

    // ==================================================
    // 3. TAMANHO MÍNIMO DA PASSWORD
    // ==================================================

    if (pass.length < 6) {
      setError(
        'A palavra-passe deve ter pelo menos 6 caracteres.'
      )
      return
    }

    try {
      setACriar(true)

      // ==================================================
      // 4. ENVIAR REGISTO PARA O BACKEND
      // ==================================================

      const resposta = await fetch(
        'http://localhost:3000/api/register',
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
          },

          body: JSON.stringify({
            nome: nome.trim(),
            email: email.trim(),
            password: pass,
            role: role,
            especialidades:
              role === 'tecnico'
                ? especialidadesSelecionadas
                : [],
          }),
        }
      )

      const dados = await resposta.json()

      // ==================================================
      // 5. ERRO DEVOLVIDO PELO BACKEND
      // ==================================================

      if (!resposta.ok) {
        setError(
          dados.erro ||
          'Não foi possível criar a conta.'
        )

        return
      }

      // ==================================================
      // 6. REGISTO CRIADO COM SUCESSO
      // ==================================================

      const utilizador =
        dados.utilizador || {
          nome: nome.trim(),
          email: email.trim(),
          role: role,
        }

      // ==================================================
      // 7. ENTRAR NA APLICAÇÃO
      // ==================================================

      onSuccess(
        {
          nome: utilizador.nome,
          email: utilizador.email,
          role: utilizador.role,
        },
        pass
      )

    } catch (erro) {
      console.error(
        'Erro ao criar conta:',
        erro
      )

      setError(
        'Não foi possível ligar ao servidor. Verifique se o backend está ligado.'
      )

    } finally {
      setACriar(false)
    }
  }

  return (
    <AuthLayout
      title="Criar conta"
      subtitle="Junta-te à plataforma RESOLVA"
    >
      {/* ==================================================
          MENSAGEM DE ERRO
      ================================================== */}

      {error && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 8,
            background: '#FEF2F2',
            border: '1px solid #FCA5A5',
            color: '#DC2626',
            fontSize: 13,
            marginBottom: 16
          }}
        >
          {error}
        </div>
      )}

      {/* ==================================================
          TIPO DE CONTA
      ================================================== */}

      <div
        style={{
          marginBottom: 16
        }}
      >
        <label
          style={{
            display: 'block',
            fontSize: 13,
            fontWeight: 600,
            color: '#0D1B2A',
            marginBottom: 6,
            fontFamily: 'Inter, sans-serif'
          }}
        >
          Tipo de conta
        </label>

        <div
          style={{
            display: 'flex',
            gap: 8
          }}
        >
          {(
            [
              ['cliente', '👤 Cliente'],
              ['tecnico', '👷 Técnico']
            ] as [Role, string][]
          ).map(([r, label]) => (
            <button
              key={r}
              type="button"
              disabled={aCriar}
              onClick={() => {
                setRole(r)
                setError('')
              }}
              style={{
                flex: 1,
                padding: '9px',
                borderRadius: 8,

                border: `1px solid ${role === r
                  ? '#1565D8'
                  : '#E4E9F0'
                  }`,

                background:
                  role === r
                    ? '#EFF6FF'
                    : '#fff',

                color:
                  role === r
                    ? '#1565D8'
                    : '#6B7A90',

                cursor: aCriar
                  ? 'not-allowed'
                  : 'pointer',

                fontSize: 13,
                fontWeight: 600,
                fontFamily:
                  'Inter, sans-serif',

                opacity:
                  aCriar
                    ? 0.7
                    : 1
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>


      {/* =================================================
               ESPECIALIDADES DO TÉCNICO
          ================================================= */}

      {role === 'tecnico' && (
        <div
          style={{
            marginBottom: 16
          }}
        >
          <label
            style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 600,
              color: '#0D1B2A',
              marginBottom: 8,
              fontFamily: 'Inter, sans-serif'
            }}
          >
            Especialidades
          </label>

          {categoriasRegisto.length === 0 ? (
            <div
              style={{
                fontSize: 13,
                color: '#6B7A90',
                padding: '10px 0'
              }}
            >
              A carregar especialidades...
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 8
              }}
            >
              {categoriasRegisto.map((categoria) => {
                const selecionada =
                  especialidadesSelecionadas.includes(
                    categoria.id
                  )

                return (
                  <button
                    key={categoria.id}
                    type="button"
                    disabled={aCriar}
                    onClick={() => {
                      setEspecialidadesSelecionadas(
                        (anteriores) =>
                          selecionada
                            ? anteriores.filter(
                              (id) => id !== categoria.id
                            )
                            : [
                              ...anteriores,
                              categoria.id
                            ]
                      )

                      setError('')
                    }}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 8,

                      border: selecionada
                        ? '1px solid #1565D8'
                        : '1px solid #E4E9F0',

                      background: selecionada
                        ? '#EFF6FF'
                        : '#FFFFFF',

                      color: selecionada
                        ? '#1565D8'
                        : '#6B7A90',

                      cursor: aCriar
                        ? 'not-allowed'
                        : 'pointer',

                      fontSize: 13,
                      fontWeight: 600,
                      fontFamily: 'Inter, sans-serif',

                      opacity: aCriar
                        ? 0.7
                        : 1,

                      textAlign: 'left'
                    }}
                  >
                    {selecionada ? '✓ ' : ''}
                    {categoria.nome}
                  </button>
                )
              })}
            </div>
          )}

          {especialidadesSelecionadas.length === 0 && (
            <div
              style={{
                marginTop: 8,
                fontSize: 12,
                color: '#6B7A90'
              }}
            >
              Seleciona pelo menos uma especialidade.
            </div>
          )}
        </div>
      )}


      {/* ==================================================
          NOME
      ================================================== */}

      <InputField
        label="Nome completo"
        placeholder="O teu nome"
        value={nome}
        onChange={valor => {
          setNome(valor)
          setError('')
        }}
      />

      {/* ==================================================
          EMAIL
      ================================================== */}

      <InputField
        label="Email"
        type="email"
        placeholder="o.teu@email.com"
        value={email}
        onChange={valor => {
          setEmail(valor)
          setError('')
        }}
      />

      {/* ==================================================
          PASSWORD
      ================================================== */}

      <InputField
        label="Palavra-passe"
        type="password"
        placeholder="Mín. 6 caracteres"
        value={pass}
        onChange={valor => {
          setPass(valor)
          setError('')
        }}
      />

      {/* ==================================================
          CONFIRMAR PASSWORD
      ================================================== */}

      <InputField
        label="Confirmar palavra-passe"
        type="password"
        placeholder="Repete a palavra-passe"
        value={confirm}
        onChange={valor => {
          setConfirm(valor)
          setError('')
        }}
      />

      {/* ==================================================
          BOTÃO CRIAR CONTA
      ================================================== */}

      <button
        onClick={handleRegister}
        disabled={aCriar}
        style={{
          width: '100%',
          padding: '12px',
          borderRadius: 8,
          border: 'none',
          background: '#1565D8',
          color: '#fff',

          cursor: aCriar
            ? 'not-allowed'
            : 'pointer',

          fontSize: 15,
          fontWeight: 600,
          fontFamily:
            'Inter, sans-serif',

          marginTop: 4,
          marginBottom: 16,

          opacity:
            aCriar
              ? 0.7
              : 1
        }}
      >
        {aCriar
          ? 'A criar conta...'
          : 'Criar Conta'}
      </button>

      {/* ==================================================
          TERMOS
      ================================================== */}

      <div
        style={{
          fontSize: 11,
          color: '#9AA5B4',
          textAlign: 'center',
          fontFamily: 'Inter, sans-serif',
          lineHeight: 1.6,
          marginBottom: 16
        }}
      >
        Ao criar conta aceitas os{' '}

        <span
          style={{
            color: '#1565D8'
          }}
        >
          Termos de Serviço
        </span>

        {' '}e a{' '}

        <span
          style={{
            color: '#1565D8'
          }}
        >
          Política de Privacidade
        </span>
        .
      </div>

      {/* ==================================================
          IR PARA LOGIN
      ================================================== */}

      <div
        style={{
          textAlign: 'center',
          fontSize: 14,
          color: '#6B7A90',
          fontFamily: 'Inter, sans-serif'
        }}
      >
        Já tens conta?{' '}

        <button
          onClick={onLogin}
          disabled={aCriar}
          style={{
            color: '#1565D8',
            background: 'none',
            border: 'none',

            cursor: aCriar
              ? 'not-allowed'
              : 'pointer',

            fontWeight: 600,
            fontFamily:
              'Inter, sans-serif'
          }}
        >
          Entrar
        </button>
      </div>

      {/* ==================================================
          VOLTAR AO INÍCIO
      ================================================== */}

      <div
        style={{
          marginTop: 12,
          textAlign: 'center'
        }}
      >
        <button
          onClick={onBack}
          disabled={aCriar}
          style={{
            fontSize: 13,
            color: '#9AA5B4',
            background: 'none',
            border: 'none',

            cursor: aCriar
              ? 'not-allowed'
              : 'pointer',

            fontFamily:
              'Inter, sans-serif'
          }}
        >
          ← Voltar ao início
        </button>
      </div>
    </AuthLayout>
  )
}

function ForgotPage({ onBack, onLogin }: { onBack: () => void; onLogin: () => void }) {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  return (
    <AuthLayout title={sent ? 'Email enviado!' : 'Recuperar palavra-passe'} subtitle={sent ? `Enviámos instruções para ${email}` : 'Introduz o teu email para receber o link de recuperação'}>
      {!sent ? (
        <>
          <InputField label="Email da conta" type="email" placeholder="o.teu@email.com" value={email} onChange={setEmail} />

          <button onClick={() => email && setSent(true)} style={{ width: '100%', padding: '12px', borderRadius: 8, border: 'none', background: '#1565D8', color: '#fff', cursor: 'pointer', fontSize: 15, fontWeight: 600, fontFamily: 'Inter, sans-serif', marginTop: 4, marginBottom: 20 }}>
            Enviar Link de Recuperação
          </button>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📬</div>

          <p style={{ fontSize: 14, color: '#6B7A90', lineHeight: 1.7, fontFamily: 'Inter, sans-serif', marginBottom: 24 }}>
            Verifica a tua caixa de entrada e segue as instruções para redefinir a palavra-passe.
          </p>

          <button onClick={() => { setEmail(''); setSent(false) }} style={{ fontSize: 13, color: '#1565D8', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif', marginBottom: 8, display: 'block', width: '100%' }}>
            Reenviar email
          </button>
        </div>
      )}

      <div style={{ textAlign: 'center' }}>
        <button onClick={onLogin} style={{ fontSize: 14, color: '#6B7A90', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
          ← Voltar ao login
        </button>
      </div>
    </AuthLayout>
  )
}

// ─── ══════════════════════════════════════════════════════════════════════ ───
// ─── DASHBOARD APP ───────────────────────────────────────────────────────────
// ─── ══════════════════════════════════════════════════════════════════════ ───

const storageKeys = {
  users: 'resolva_users',
  pedidos: 'resolva_pedidos',
  agendamentos: 'resolva_agendamentos',
  clientes: 'resolva_clientes',
  orcamentos: 'resolva_orcamentos',
  categorias: 'resolva_categorias',
  tecnicos: 'resolva_tecnicos',
  tecnicoDisponibilidade: 'resolva_tecnico_disponibilidade',
  pagamentos: 'resolva_pagamentos',
}

function readStored<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key)
    return value ? (JSON.parse(value) as T) : fallback
  } catch {
    return fallback
  }
}

function writeStored<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value))
}

const navItems: { id: Page; label: string; icon: string; roles: Role[] }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '▦', roles: ['admin', 'tecnico', 'cliente'] },
  { id: 'pedidos', label: 'Pedidos', icon: '📋', roles: ['admin', 'tecnico', 'cliente'] },
  { id: 'orcamentos', label: 'Orçamentos', icon: '💰', roles: ['admin', 'cliente'] },
  { id: 'agendamentos', label: 'Agendamentos', icon: '📅', roles: ['admin', 'tecnico', 'cliente'] },
  { id: 'tecnicos', label: 'Técnicos', icon: '👷', roles: ['admin'] },
  { id: 'clientes', label: 'Clientes', icon: '👥', roles: ['admin'] },
  { id: 'pagamentos', label: 'Pagamentos', icon: '💳', roles: ['admin', 'cliente'] },
  { id: 'categorias', label: 'Categorias', icon: '🏷️', roles: ['admin'] },
]

function Sidebar({ page, setPage, role, user, onLogout }: { page: Page; setPage: (p: Page) => void; role: Role; user: AuthUser; onLogout: () => void }) {
  const visible = navItems.filter(i => i.roles.includes(role))

  return (
    <aside style={{ width: 232, minWidth: 232, background: '#0D1B2A', display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0 }}>
      <div style={{ padding: '24px 20px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: '#1565D8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#fff', fontFamily: 'DM Sans, sans-serif', flexShrink: 0 }}>
            R
          </div>

          <div>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 16, color: '#fff', letterSpacing: '-0.3px' }}>
              RESOLVA
            </div>
            <div style={{ fontSize: 10, color: '#4A6080', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Gestão Técnica
            </div>
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: '10px 10px', overflowY: 'auto' }}>
        {visible.map(item => {
          const active = page === item.id

          return (
            <button key={item.id} onClick={() => setPage(item.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', marginBottom: 2, textAlign: 'left', transition: 'all 0.15s', background: active ? '#1565D8' : 'transparent', color: active ? '#fff' : '#7A90A8', fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: active ? 600 : 400 }}>
              <span style={{ fontSize: 14, width: 18, textAlign: 'center' }}>
                {item.icon}
              </span>
              {item.label}
            </button>
          )
        })}
      </nav>

      <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#1A3A5C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
            {role === 'admin' ? '👩‍💼' : role === 'tecnico' ? '👷' : '👤'}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 600, color: '#E8EFF7', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.nome}
            </div>
            <div style={{ fontSize: 10, color: '#4A6080', textTransform: 'capitalize' }}>
              {user.role}
            </div>
          </div>
        </div>

        <button onClick={onLogout} style={{ width: '100%', padding: '7px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#7A90A8', cursor: 'pointer', fontSize: 12, fontFamily: 'Inter, sans-serif' }}>
          Terminar sessão
        </button>
      </div>
    </aside>
  )
}

function Topbar({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header style={{ background: '#fff', borderBottom: '1px solid #E4E9F0', padding: '0 28px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
      <div>
        <h1 style={{ margin: 0, fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 18, color: '#0D1B2A', letterSpacing: '-0.3px' }}>
          {title}
        </h1>

        <p style={{ margin: 0, fontSize: 11, color: '#6B7A90', fontFamily: 'Inter, sans-serif' }}>
          {subtitle}
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid #E4E9F0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>
          🔔
        </button>
      </div>
    </header>
  )
}

function StatCard({ label, value, delta, icon, color }: { label: string; value: string | number; delta?: string; icon: string; color: string }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: '18px 20px', border: '1px solid #E4E9F0', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 11, color: '#6B7A90', fontFamily: 'Inter, sans-serif', fontWeight: 500, marginBottom: 4 }}>
            {label}
          </div>

          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 26, fontWeight: 700, color: '#0D1B2A', letterSpacing: '-0.5px' }}>
            {value}
          </div>
        </div>

        <div style={{ width: 40, height: 40, borderRadius: 10, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
          {icon}
        </div>
      </div>

      {delta && (
        <div style={{ fontSize: 11, color: '#00B893', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
          {delta}
        </div>
      )}
    </div>
  )
}

// ── Dashboard ──

function DashboardPage({
  role,
  pedidos,
  userName,
  agendamentos,
  tecnicos,
  pagamentos
}: {
  role: Role
  pedidos: Pedido[]
  userName: string
  agendamentos: Agendamento[]
  tecnicos: Tecnico[]
  pagamentos: Pagamento[]
}) {
  const hoje = new Date()
  const hojeISO = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`
  const mesAtual = hojeISO.slice(0, 7)

  const pedidosVisiveis = role === 'cliente'
    ? pedidos.filter(p => p.cliente === userName)
    : role === 'tecnico'
      ? pedidos.filter(p => p.tecnico === userName)
      : pedidos

  const pagamentosVisiveis = role === 'cliente'
    ? pagamentos.filter(p => p.cliente === userName)
    : pagamentos

  const agendamentosVisiveis = role === 'cliente'
    ? agendamentos.filter(a => a.cliente === userName)
    : role === 'tecnico'
      ? agendamentos.filter(a => a.tecnico === userName)
      : agendamentos

  const pendentes = pedidosVisiveis.filter(p => p.status === 'pendente').length
  const emCurso = pedidosVisiveis.filter(p => p.status === 'em_curso').length

  const concluidosMes = pedidosVisiveis.filter(
    p => p.status === 'concluido' && p.data?.slice(0, 7) === mesAtual
  ).length

  const receita = pagamentosVisiveis
    .filter(p => p.status === 'pago')
    .reduce((soma, p) => soma + Number(p.valor || 0), 0)

  const novosHoje = pedidosVisiveis.filter(p => p.data === hojeISO).length

  const receitaHoje = pagamentosVisiveis
    .filter(p => p.status === 'pago' && p.data === hojeISO)
    .reduce((soma, p) => soma + Number(p.valor || 0), 0)

  const pedidosRecentes = [...pedidosVisiveis]
    .sort((a, b) => {
      const dataB = new Date(b.data || '1970-01-01').getTime()
      const dataA = new Date(a.data || '1970-01-01').getTime()

      if (dataB !== dataA) return dataB - dataA

      return b.id.localeCompare(a.id)
    })
    .slice(0, 5)

  const agendamentosHoje = agendamentosVisiveis
    .filter(a => a.data === hojeISO && a.status !== 'cancelado')
    .sort((a, b) => a.hora.localeCompare(b.hora))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <StatCard
          label="Pedidos Pendentes"
          value={pendentes}
          icon="📋"
          color="#EFF6FF"
          delta={novosHoje > 0 ? `↑ ${novosHoje} ${novosHoje === 1 ? 'novo hoje' : 'novos hoje'}` : undefined}
        />

        <StatCard
          label="Serviços em Curso"
          value={emCurso}
          icon="⚙️"
          color="#F0FDF4"
        />

        <StatCard
          label="Concluídos este mês"
          value={concluidosMes}
          icon="✅"
          color="#F0FDF4"
        />

        <StatCard
          label="Receita Confirmada"
          value={`€${receita.toLocaleString('pt-PT', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`}
          icon="💰"
          color="#FFF7ED"
          delta={receitaHoje > 0 ? `↑ €${receitaHoje.toLocaleString('pt-PT')} hoje` : undefined}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 14 }}>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E4E9F0', overflow: 'hidden' }}>
          <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid #E4E9F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: 14, color: '#0D1B2A' }}>
              Pedidos Recentes
            </div>
          </div>

          {pedidosRecentes.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F8FAFB' }}>
                  {['ID', 'Cliente', 'Categoria', 'Prioridade', 'Estado'].map(h => (
                    <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: '#9AA5B4', fontFamily: 'Inter, sans-serif', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {pedidosRecentes.map((p, i) => (
                  <tr key={p.id} style={{ borderTop: i > 0 ? '1px solid #F1F5F9' : undefined }}>
                    <td style={{ padding: '11px 14px', fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: '#1565D8', fontWeight: 500 }}>
                      {p.id}
                    </td>

                    <td style={{ padding: '11px 14px', fontSize: 13, fontFamily: 'Inter, sans-serif', color: '#0D1B2A', fontWeight: 500 }}>
                      {p.cliente}
                    </td>

                    <td style={{ padding: '11px 14px', fontSize: 12, color: '#6B7A90' }}>
                      {catIcons[p.categoria] || '🧰'} {p.categoria}
                    </td>

                    <td style={{ padding: '11px 14px' }}>
                      <Badge
                        label={p.prioridade.charAt(0).toUpperCase() + p.prioridade.slice(1)}
                        cls={prioridadeColors[p.prioridade]}
                      />
                    </td>

                    <td style={{ padding: '11px 14px' }}>
                      <Badge
                        label={statusLabels[p.status]}
                        cls={statusColors[p.status]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: 28, textAlign: 'center', fontSize: 12, color: '#9AA5B4' }}>
              Não existem pedidos para apresentar.
            </div>
          )}
        </div>

        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E4E9F0', overflow: 'hidden' }}>
          <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid #E4E9F0' }}>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: 14, color: '#0D1B2A' }}>
              Agendamentos Hoje
            </div>
          </div>

          <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {agendamentosHoje.length > 0 ? (
              agendamentosHoje.slice(0, 5).map(a => (
                <div key={a.id} style={{ display: 'flex', gap: 10, padding: '10px', borderRadius: 8, background: '#F8FAFB', alignItems: 'flex-start' }}>
                  <div style={{ textAlign: 'center', minWidth: 40, background: '#EFF6FF', borderRadius: 7, padding: '5px 4px' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1565D8', fontFamily: 'DM Sans, sans-serif' }}>
                      {a.hora}
                    </div>

                    <div style={{ fontSize: 9, color: '#6B7A90' }}>
                      {a.duracao}
                    </div>
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#0D1B2A' }}>
                      {a.cliente}
                    </div>

                    <div style={{ fontSize: 11, color: '#6B7A90' }}>
                      {a.servico}
                    </div>

                    <div style={{ fontSize: 10, color: '#9AA5B4', marginTop: 2 }}>
                      👷 {a.tecnico}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '22px 8px', textAlign: 'center', fontSize: 12, color: '#9AA5B4' }}>
                Nenhum agendamento para hoje.
              </div>
            )}
          </div>
        </div>
      </div>

      {role === 'admin' && (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E4E9F0', overflow: 'hidden' }}>
          <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid #E4E9F0' }}>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: 14, color: '#0D1B2A' }}>
              Técnicos — Disponibilidade
            </div>
          </div>

          <div
            style={{
              padding: '14px 20px',
              display: 'grid',
              gridTemplateColumns: `repeat(${Math.min(Math.max(tecnicos.length, 1), 5)}, 1fr)`,
              gap: 10
            }}
          >
            {tecnicos.length > 0 ? (
              tecnicos.map(t => (
                <div
                  key={t.id}
                  style={{
                    padding: '12px',
                    borderRadius: 10,
                    border: '1px solid #E4E9F0',
                    textAlign: 'center'
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: t.disponivel ? '#E6F9F5' : '#F1F5F9',
                      margin: '0 auto 8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 18
                    }}
                  >
                    👷
                  </div>

                  <div style={{ fontSize: 12, fontWeight: 600, color: '#0D1B2A' }}>
                    {t.nome.split(' ')[0]}
                  </div>

                  <div style={{ fontSize: 10, color: '#6B7A90', marginTop: 2 }}>
                    {t.especialidades[0] || 'Sem especialidade'}
                  </div>

                  <div style={{ marginTop: 6 }}>
                    <span
                      style={{
                        fontSize: 10,
                        padding: '2px 7px',
                        borderRadius: 20,
                        background: t.disponivel ? '#E6F9F5' : '#F1F5F9',
                        color: t.disponivel ? '#00B893' : '#9AA5B4',
                        fontWeight: 600
                      }}
                    >
                      {t.disponivel ? '● Disponível' : '○ Ocupado'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: 20, textAlign: 'center', fontSize: 12, color: '#9AA5B4' }}>
                Não existem técnicos para apresentar.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Pedidos with photo upload ──

function PedidosPage({
  role,
  pedidos,
  onPedidosChange,
  userName,
  agendamentos,
  onAgendamentosChange
}: {
  role: Role
  pedidos: Pedido[]
  onPedidosChange: (next: Pedido[]) => void
  userName: string
  agendamentos: Agendamento[]
  onAgendamentosChange: (next: Agendamento[]) => void
}) {
  type ClientePedido = {
    id: number
    nome: string
  }

  type CategoriaPedido = {
    id: number
    nome: string
  }

  type TecnicoPedido = {
    id: number
    nome: string
  }

  const [filtro, setFiltro] = useState('todos')
  const [busca, setBusca] = useState('')
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingPedido, setEditingPedido] = useState<Pedido | null>(null)

  const [clientes, setClientes] = useState<ClientePedido[]>([])
  const [categoriasPedido, setCategoriasPedido] = useState<CategoriaPedido[]>([])
  const [tecnicosPedido, setTecnicosPedido] = useState<TecnicoPedido[]>([])

  const [erroPedido, setErroPedido] = useState('')
  const [aGuardar, setAGuardar] = useState(false)

  function dataLocalHoje() {
    const d = new Date()

    return `${d.getFullYear()}-${String(
      d.getMonth() + 1
    ).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')}`
  }

  const [form, setForm] = useState({
    cliente_id: '',
    categoria_id: '',
    descricao: '',
    morada: '',
    cidade: '',
    data: dataLocalHoje(),
    status: 'pendente' as Status,
    prioridade: 'media' as 'baixa' | 'media' | 'alta',
    tecnico_id: ''
  })

  // ======================================================
  // CARREGAR PEDIDOS
  // ======================================================

  async function carregarPedidos() {
    try {
      const resposta = await fetch(
        'http://localhost:3000/api/pedidos'
      )

      if (!resposta.ok) {
        throw new Error('Erro ao obter pedidos')
      }

      const dados = await resposta.json()

      const pedidosFormatados: Pedido[] = dados.map(
        (pedido: any) => ({
          id: String(pedido.id),
          cliente: pedido.cliente,
          categoria: pedido.categoria,
          descricao: pedido.descricao,
          morada: pedido.morada,
          cidade: pedido.cidade,

          data: pedido.data
            ? String(pedido.data).split('T')[0]
            : '',

          status: pedido.status as Status,
          prioridade: pedido.prioridade,

          tecnico:
            pedido.tecnico ?? undefined,

          tecnico_id:
            pedido.tecnico_id != null
              ? Number(pedido.tecnico_id)
              : undefined,

          fotos: [],
          historico: []
        })
      )

      onPedidosChange(pedidosFormatados)

    } catch (erro) {
      console.error(
        'Erro ao carregar pedidos:',
        erro
      )
    }
  }

  // ======================================================
  // CARREGAR CLIENTES, CATEGORIAS E TÉCNICOS
  // ======================================================

  async function carregarDadosFormulario() {
    try {
      const [
        rClientes,
        rCategorias,
        rTecnicos
      ] = await Promise.all([
        fetch('http://localhost:3000/api/clientes'),
        fetch('http://localhost:3000/api/categorias'),
        fetch('http://localhost:3000/api/tecnicos')
      ])

      if (
        !rClientes.ok ||
        !rCategorias.ok ||
        !rTecnicos.ok
      ) {
        throw new Error(
          'Erro ao carregar dados do formulário'
        )
      }

      const [
        dClientes,
        dCategorias,
        dTecnicos
      ] = await Promise.all([
        rClientes.json(),
        rCategorias.json(),
        rTecnicos.json()
      ])

      setClientes(
        dClientes.map((c: any) => ({
          id: Number(c.id),
          nome: c.nome
        }))
      )

      setCategoriasPedido(
        dCategorias.map((c: any) => ({
          id: Number(c.id),
          nome: c.nome
        }))
      )

      setTecnicosPedido(
        dTecnicos.map((t: any) => ({
          id: Number(t.id),
          nome: t.nome
        }))
      )

    } catch (erro) {
      console.error(
        'Erro ao carregar dados do formulário:',
        erro
      )
    }
  }

  useEffect(() => {
    carregarPedidos()
    carregarDadosFormulario()
  }, [])

  // ======================================================
  // NOVO PEDIDO
  // ======================================================

  function abrirNovoPedido() {
    const clienteAtual = clientes.find(
      c => c.nome === userName
    )

    setEditingPedido(null)
    setErroPedido('')

    setForm({
      cliente_id:
        role === 'cliente' && clienteAtual
          ? String(clienteAtual.id)
          : '',

      categoria_id: '',
      descricao: '',
      morada: '',
      cidade: '',
      data: dataLocalHoje(),
      status: 'pendente',
      prioridade: 'media',
      tecnico_id: ''
    })

    setShowForm(true)
  }

  // ======================================================
  // EDITAR PEDIDO
  // ======================================================

  function abrirEditarPedido(pedido: Pedido) {
    const cliente = clientes.find(
      c => c.nome === pedido.cliente
    )

    const categoria = categoriasPedido.find(
      c => c.nome === pedido.categoria
    )

    setEditingPedido(pedido)
    setErroPedido('')

    setForm({
      cliente_id:
        cliente
          ? String(cliente.id)
          : '',

      categoria_id:
        categoria
          ? String(categoria.id)
          : '',

      descricao: pedido.descricao,
      morada: pedido.morada,
      cidade: pedido.cidade,
      data: pedido.data,
      status: pedido.status,
      prioridade: pedido.prioridade,

      tecnico_id:
        pedido.tecnico_id != null
          ? String(pedido.tecnico_id)
          : ''
    })

    setShowForm(true)
  }

  function fecharFormulario() {
    setShowForm(false)
    setEditingPedido(null)
    setErroPedido('')
  }

  // ======================================================
  // GUARDAR PEDIDO
  // ======================================================

  async function guardarPedido() {
    setErroPedido('')

    if (!form.cliente_id) {
      setErroPedido('Seleciona um cliente.')
      return
    }

    if (!form.categoria_id) {
      setErroPedido('Seleciona uma categoria.')
      return
    }

    if (!form.descricao.trim()) {
      setErroPedido('A descrição é obrigatória.')
      return
    }

    if (!form.morada.trim()) {
      setErroPedido('A morada é obrigatória.')
      return
    }

    if (!form.cidade.trim()) {
      setErroPedido('A cidade é obrigatória.')
      return
    }

    if (!form.data) {
      setErroPedido('A data é obrigatória.')
      return
    }

    setAGuardar(true)

    try {
      const url = editingPedido
        ? `http://localhost:3000/api/pedidos/${editingPedido.id}`
        : 'http://localhost:3000/api/pedidos'

      const resposta = await fetch(
        url,
        {
          method:
            editingPedido
              ? 'PUT'
              : 'POST',

          headers: {
            'Content-Type': 'application/json'
          },

          body: JSON.stringify({
            cliente_id: Number(form.cliente_id),
            categoria_id: Number(form.categoria_id),
            descricao: form.descricao.trim(),
            morada: form.morada.trim(),
            cidade: form.cidade.trim(),
            data: form.data,
            status: form.status,
            prioridade: form.prioridade,

            tecnico_id:
              form.tecnico_id
                ? Number(form.tecnico_id)
                : null
          })
        }
      )

      const dados = await resposta.json()

      if (!resposta.ok) {
        setErroPedido(
          dados.erro ||
          'Não foi possível guardar o pedido.'
        )
        return
      }

      await carregarPedidos()
      fecharFormulario()

    } catch (erro) {
      console.error(
        'Erro ao guardar pedido:',
        erro
      )

      setErroPedido(
        'Não foi possível comunicar com o servidor.'
      )

    } finally {
      setAGuardar(false)
    }
  }

  // ======================================================
  // REMOVER PEDIDO
  // ======================================================

  async function removerPedido(
    pedido: Pedido
  ) {
    if (
      !window.confirm(
        `Remover o pedido ${pedido.id}?`
      )
    ) {
      return
    }

    try {
      const resposta = await fetch(
        `http://localhost:3000/api/pedidos/${pedido.id}`,
        {
          method: 'DELETE'
        }
      )

      const dados = await resposta.json()

      if (!resposta.ok) {
        alert(
          dados.erro ||
          'Não foi possível remover o pedido.'
        )
        return
      }

      setSelectedPedido(null)

      await carregarPedidos()

    } catch (erro) {
      console.error(
        'Erro ao remover pedido:',
        erro
      )

      alert(
        'Não foi possível comunicar com o servidor.'
      )
    }
  }

  // ======================================================
  // ATUALIZAR ESTADO
  // ======================================================

  async function atualizarEstado(
    pedido: Pedido,
    status: Status
  ) {
    const cliente = clientes.find(
      c => c.nome === pedido.cliente
    )

    const categoria = categoriasPedido.find(
      c => c.nome === pedido.categoria
    )

    if (!cliente || !categoria) {
      return
    }

    try {
      const resposta = await fetch(
        `http://localhost:3000/api/pedidos/${pedido.id}`,
        {
          method: 'PUT',

          headers: {
            'Content-Type': 'application/json'
          },

          body: JSON.stringify({
            cliente_id: cliente.id,
            categoria_id: categoria.id,
            descricao: pedido.descricao,
            morada: pedido.morada,
            cidade: pedido.cidade,
            data: pedido.data,
            status,
            prioridade: pedido.prioridade,
            tecnico_id:
              pedido.tecnico_id ?? null
          })
        }
      )

      if (!resposta.ok) {
        throw new Error(
          'Erro ao atualizar estado'
        )
      }

      if (status === 'concluido') {
        onAgendamentosChange(
          agendamentos.map(a =>
            a.pedidoId === pedido.id
              ? {
                ...a,
                status: 'concluido'
              }
              : a
          )
        )
      }

      setSelectedPedido(null)

      await carregarPedidos()

    } catch (erro) {
      console.error(
        'Erro ao atualizar estado:',
        erro
      )

      alert(
        'Não foi possível atualizar o estado do pedido.'
      )
    }
  }

  // ======================================================
  // FILTROS
  // ======================================================

  const filtrados = pedidos.filter(p => {
    if (
      filtro !== 'todos' &&
      p.status !== filtro
    ) {
      return false
    }

    if (busca) {
      const b = busca.toLowerCase()

      if (
        !p.cliente.toLowerCase().includes(b) &&
        !p.id.toLowerCase().includes(b) &&
        !p.categoria.toLowerCase().includes(b) &&
        !p.cidade.toLowerCase().includes(b)
      ) {
        return false
      }
    }

    if (role === 'tecnico') {
      return p.tecnico === userName
    }

    if (role === 'cliente') {
      return p.cliente === userName
    }

    return true
  })

  const filtros = [
    {
      key: 'todos',
      label: 'Todos'
    },
    {
      key: 'pendente',
      label: 'Pendente'
    },
    {
      key: 'em_analise',
      label: 'Em Análise'
    },
    {
      key: 'agendado',
      label: 'Agendado'
    },
    {
      key: 'em_curso',
      label: 'Em Curso'
    },
    {
      key: 'concluido',
      label: 'Concluído'
    },
  ]

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid #E4E9F0',
    background: '#FAFBFC',
    fontSize: 13,
    color: '#0D1B2A',
    outline: 'none',
    boxSizing: 'border-box' as const
  }

  const labelStyle = {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    color: '#0D1B2A',
    marginBottom: 5
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16
      }}
    >
      {/* FILTROS E PESQUISA */}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 10
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 6,
            flexWrap: 'wrap'
          }}
        >
          {filtros.map(f => (
            <button
              key={f.key}
              onClick={() =>
                setFiltro(f.key)
              }
              style={{
                padding: '5px 12px',
                borderRadius: 20,
                border: '1px solid',
                cursor: 'pointer',
                fontSize: 12,
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,

                background:
                  filtro === f.key
                    ? '#0D1B2A'
                    : '#fff',

                color:
                  filtro === f.key
                    ? '#fff'
                    : '#6B7A90',

                borderColor:
                  filtro === f.key
                    ? '#0D1B2A'
                    : '#E4E9F0'
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div
          style={{
            display: 'flex',
            gap: 8
          }}
        >
          <input
            value={busca}
            onChange={e =>
              setBusca(e.target.value)
            }
            placeholder="Pesquisar..."
            style={{
              padding: '7px 12px',
              borderRadius: 8,
              border: '1px solid #E4E9F0',
              fontSize: 13,
              outline: 'none',
              width: 200
            }}
          />

          {(role === 'cliente' ||
            role === 'admin') && (
              <button
                onClick={abrirNovoPedido}
                style={{
                  padding: '7px 16px',
                  borderRadius: 8,
                  background: '#1565D8',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600
                }}
              >
                + Novo Pedido
              </button>
            )}
        </div>
      </div>

      {/* TABELA */}

      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          border: '1px solid #E4E9F0',
          overflow: 'hidden'
        }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse'
          }}
        >
          <thead>
            <tr
              style={{
                background: '#F8FAFB',
                borderBottom:
                  '1px solid #E4E9F0'
              }}
            >
              {[
                'ID',
                'Cliente',
                'Categoria',
                'Descrição',
                'Data',
                'Prioridade',
                'Estado',
                'Técnico',
                'Ações'
              ].map(h => (
                <th
                  key={h}
                  style={{
                    padding: '10px 14px',
                    textAlign: 'left',
                    fontSize: 10,
                    fontWeight: 600,
                    color: '#9AA5B4',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {filtrados.map((p, i) => (
              <tr
                key={p.id}
                style={{
                  borderTop:
                    i > 0
                      ? '1px solid #F1F5F9'
                      : undefined
                }}
              >
                <td
                  onClick={() =>
                    setSelectedPedido(p)
                  }
                  style={{
                    padding: '11px 14px',
                    fontSize: 12,
                    fontFamily:
                      'JetBrains Mono, monospace',
                    color: '#1565D8',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  {p.id}
                </td>

                <td
                  style={{
                    padding: '11px 14px',
                    fontSize: 13,
                    color: '#0D1B2A',
                    fontWeight: 600,
                    whiteSpace: 'nowrap'
                  }}
                >
                  {p.cliente}
                </td>

                <td
                  style={{
                    padding: '11px 14px',
                    fontSize: 12,
                    color: '#6B7A90',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {catIcons[p.categoria]}{' '}
                  {p.categoria}
                </td>

                <td
                  style={{
                    padding: '11px 14px',
                    fontSize: 12,
                    color: '#6B7A90',
                    maxWidth: 180,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {p.descricao}
                </td>

                <td
                  style={{
                    padding: '11px 14px',
                    fontSize: 11,
                    color: '#9AA5B4',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {p.data}
                </td>

                <td
                  style={{
                    padding: '11px 14px'
                  }}
                >
                  <Badge
                    label={
                      p.prioridade
                        .charAt(0)
                        .toUpperCase() +
                      p.prioridade.slice(1)
                    }
                    cls={
                      prioridadeColors[
                      p.prioridade
                      ]
                    }
                  />
                </td>

                <td
                  style={{
                    padding: '11px 14px'
                  }}
                >
                  <Badge
                    label={
                      statusLabels[p.status]
                    }
                    cls={
                      statusColors[p.status]
                    }
                  />
                </td>

                <td
                  style={{
                    padding: '11px 14px',
                    fontSize: 12,
                    color: '#6B7A90',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {p.tecnico || '—'}
                </td>

                <td
                  style={{
                    padding: '11px 14px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <button
                    onClick={() =>
                      setSelectedPedido(p)
                    }
                    style={{
                      padding: '5px 8px',
                      borderRadius: 6,
                      border:
                        '1px solid #E4E9F0',
                      background: '#fff',
                      cursor: 'pointer',
                      fontSize: 11,
                      marginRight: 5
                    }}
                  >
                    Ver
                  </button>

                  {role === 'admin' && (
                    <button
                      onClick={() =>
                        abrirEditarPedido(p)
                      }
                      style={{
                        padding: '5px 8px',
                        borderRadius: 6,
                        border:
                          '1px solid #DCE7FF',
                        background: '#EFF6FF',
                        color: '#1565D8',
                        cursor: 'pointer',
                        fontSize: 11
                      }}
                    >
                      Editar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtrados.length === 0 && (
          <div
            style={{
              padding: 40,
              textAlign: 'center',
              color: '#9AA5B4'
            }}
          >
            Nenhum pedido encontrado.
          </div>
        )}
      </div>

      {/* FORMULÁRIO NOVO / EDITAR PEDIDO */}

      {showForm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background:
              'rgba(13,27,42,0.6)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(4px)',
            padding: 20
          }}
          onClick={fecharFormulario}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              padding: 28,
              width: 560,
              maxWidth: '100%',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={e =>
              e.stopPropagation()
            }
          >
            <div
              style={{
                fontFamily:
                  'DM Sans, sans-serif',
                fontWeight: 700,
                fontSize: 18,
                color: '#0D1B2A',
                marginBottom: 18
              }}
            >
              {editingPedido
                ? 'Editar pedido'
                : 'Novo pedido'}
            </div>

            {erroPedido && (
              <div
                style={{
                  background: '#FEF2F2',
                  border:
                    '1px solid #FCA5A5',
                  color: '#DC2626',
                  padding: '10px 12px',
                  borderRadius: 8,
                  fontSize: 12,
                  marginBottom: 14
                }}
              >
                {erroPedido}
              </div>
            )}

            <div
              style={{
                display: 'grid',
                gap: 13
              }}
            >
              <div>
                <label style={labelStyle}>
                  Cliente
                </label>

                <select
                  value={form.cliente_id}
                  disabled={
                    role === 'cliente'
                  }
                  onChange={e =>
                    setForm({
                      ...form,
                      cliente_id:
                        e.target.value
                    })
                  }
                  style={inputStyle}
                >
                  <option value="">
                    Selecionar cliente
                  </option>

                  {clientes.map(c => (
                    <option
                      key={c.id}
                      value={c.id}
                    >
                      {c.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>
                  Categoria
                </label>

                <select
                  value={
                    form.categoria_id
                  }
                  onChange={e =>
                    setForm({
                      ...form,
                      categoria_id:
                        e.target.value
                    })
                  }
                  style={inputStyle}
                >
                  <option value="">
                    Selecionar categoria
                  </option>

                  {categoriasPedido.map(
                    c => (
                      <option
                        key={c.id}
                        value={c.id}
                      >
                        {c.nome}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label style={labelStyle}>
                  Descrição
                </label>

                <textarea
                  value={form.descricao}
                  onChange={e =>
                    setForm({
                      ...form,
                      descricao:
                        e.target.value
                    })
                  }
                  rows={3}
                  placeholder="Descreve o problema..."
                  style={{
                    ...inputStyle,
                    resize: 'vertical'
                  }}
                />
              </div>

              <div>
                <label style={labelStyle}>
                  Morada
                </label>

                <input
                  value={form.morada}
                  onChange={e =>
                    setForm({
                      ...form,
                      morada:
                        e.target.value
                    })
                  }
                  placeholder="Rua, número..."
                  style={inputStyle}
                />
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    '1fr 1fr',
                  gap: 12
                }}
              >
                <div>
                  <label style={labelStyle}>
                    Cidade
                  </label>

                  <input
                    value={form.cidade}
                    onChange={e =>
                      setForm({
                        ...form,
                        cidade:
                          e.target.value
                      })
                    }
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>
                    Data
                  </label>

                  <input
                    type="date"
                    value={form.data}
                    onChange={e =>
                      setForm({
                        ...form,
                        data:
                          e.target.value
                      })
                    }
                    style={inputStyle}
                  />
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    '1fr 1fr',
                  gap: 12
                }}
              >
                <div>
                  <label style={labelStyle}>
                    Prioridade
                  </label>

                  <select
                    value={
                      form.prioridade
                    }
                    onChange={e =>
                      setForm({
                        ...form,
                        prioridade:
                          e.target
                            .value as
                          | 'baixa'
                          | 'media'
                          | 'alta'
                      })
                    }
                    style={inputStyle}
                  >
                    <option value="baixa">
                      Baixa
                    </option>

                    <option value="media">
                      Média
                    </option>

                    <option value="alta">
                      Alta
                    </option>
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>
                    Técnico
                  </label>

                  <select
                    value={
                      form.tecnico_id
                    }
                    onChange={e =>
                      setForm({
                        ...form,
                        tecnico_id:
                          e.target.value
                      })
                    }
                    disabled={
                      role !== 'admin'
                    }
                    style={inputStyle}
                  >
                    <option value="">
                      Sem técnico
                    </option>

                    {tecnicosPedido.map(
                      t => (
                        <option
                          key={t.id}
                          value={t.id}
                        >
                          {t.nome}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              {editingPedido && (
                <div>
                  <label style={labelStyle}>
                    Estado
                  </label>

                  <select
                    value={form.status}
                    onChange={e =>
                      setForm({
                        ...form,
                        status:
                          e.target
                            .value as Status
                      })
                    }
                    style={inputStyle}
                  >
                    <option value="pendente">
                      Pendente
                    </option>

                    <option value="em_analise">
                      Em análise
                    </option>

                    <option value="orcamento_enviado">
                      Orçamento enviado
                    </option>

                    <option value="aceite">
                      Aceite
                    </option>

                    <option value="agendado">
                      Agendado
                    </option>

                    <option value="em_curso">
                      Em curso
                    </option>

                    <option value="concluido">
                      Concluído
                    </option>

                    <option value="cancelado">
                      Cancelado
                    </option>
                  </select>
                </div>
              )}
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent:
                  'flex-end',
                gap: 10,
                marginTop: 22
              }}
            >
              <button
                onClick={
                  fecharFormulario
                }
                disabled={aGuardar}
                style={{
                  padding:
                    '10px 16px',
                  borderRadius: 8,
                  border:
                    '1px solid #E4E9F0',
                  background: '#fff',
                  color: '#6B7A90',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>

              <button
                onClick={guardarPedido}
                disabled={aGuardar}
                style={{
                  padding:
                    '10px 16px',
                  borderRadius: 8,
                  border: 'none',
                  background:
                    aGuardar
                      ? '#9AA5B4'
                      : '#1565D8',
                  color: '#fff',
                  cursor:
                    aGuardar
                      ? 'not-allowed'
                      : 'pointer',
                  fontWeight: 600
                }}
              >
                {aGuardar
                  ? 'A guardar...'
                  : editingPedido
                    ? 'Guardar alterações'
                    : 'Criar pedido'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETALHES DO PEDIDO */}

      {selectedPedido && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background:
              'rgba(13,27,42,0.6)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(4px)'
          }}
          onClick={() =>
            setSelectedPedido(null)
          }
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              padding: 28,
              width: 560,
              maxHeight: '88vh',
              overflowY: 'auto'
            }}
            onClick={e =>
              e.stopPropagation()
            }
          >
            <div
              style={{
                display: 'flex',
                justifyContent:
                  'space-between',
                marginBottom: 18
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 4
                  }}
                >
                  <span
                    style={{
                      fontFamily:
                        'JetBrains Mono, monospace',
                      color: '#1565D8',
                      fontWeight: 600
                    }}
                  >
                    {selectedPedido.id}
                  </span>

                  <Badge
                    label={
                      statusLabels[
                      selectedPedido.status
                      ]
                    }
                    cls={
                      statusColors[
                      selectedPedido.status
                      ]
                    }
                  />
                </div>

                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: '#0D1B2A'
                  }}
                >
                  {selectedPedido.categoria}
                </div>

                <div
                  style={{
                    fontSize: 13,
                    color: '#6B7A90'
                  }}
                >
                  Cliente:{' '}
                  {selectedPedido.cliente}
                </div>
              </div>

              <button
                onClick={() =>
                  setSelectedPedido(null)
                }
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  border:
                    '1px solid #E4E9F0',
                  background: '#fff',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>

            <div
              style={{
                background: '#F8FAFB',
                borderRadius: 10,
                padding: '14px 16px',
                marginBottom: 16,
                fontSize: 14,
                lineHeight: 1.6
              }}
            >
              {selectedPedido.descricao}
            </div>

            <div
              style={{
                fontSize: 13,
                color: '#6B7A90',
                lineHeight: 1.8
              }}
            >
              📍 {selectedPedido.morada},{' '}
              {selectedPedido.cidade}
              <br />

              📅 {selectedPedido.data}
              <br />

              👷{' '}
              {selectedPedido.tecnico ||
                'Sem técnico atribuído'}
            </div>

            {role === 'tecnico' && (
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  marginTop: 20
                }}
              >
                <button
                  onClick={() =>
                    atualizarEstado(
                      selectedPedido,
                      'agendado'
                    )
                  }
                  style={{
                    flex: 1,
                    padding: 10,
                    borderRadius: 8,
                    border: 'none',
                    background: '#0EA5E9',
                    color: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  Confirmar
                </button>

                <button
                  onClick={() =>
                    atualizarEstado(
                      selectedPedido,
                      'em_curso'
                    )
                  }
                  style={{
                    flex: 1,
                    padding: 10,
                    borderRadius: 8,
                    border: 'none',
                    background: '#16A34A',
                    color: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  Iniciar
                </button>

                <button
                  onClick={() =>
                    atualizarEstado(
                      selectedPedido,
                      'concluido'
                    )
                  }
                  style={{
                    flex: 1,
                    padding: 10,
                    borderRadius: 8,
                    border: 'none',
                    background: '#0F766E',
                    color: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  Concluir
                </button>
              </div>
            )}

            {role === 'admin' && (
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  marginTop: 20
                }}
              >
                <button
                  onClick={() => {
                    setSelectedPedido(null)
                    abrirEditarPedido(
                      selectedPedido
                    )
                  }}
                  style={{
                    flex: 1,
                    padding: 10,
                    borderRadius: 8,
                    border: 'none',
                    background: '#1565D8',
                    color: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  Editar pedido
                </button>

                <button
                  onClick={() =>
                    removerPedido(
                      selectedPedido
                    )
                  }
                  style={{
                    flex: 1,
                    padding: 10,
                    borderRadius: 8,
                    border:
                      '1px solid #FECACA',
                    background: '#fff',
                    color: '#B91C1C',
                    cursor: 'pointer'
                  }}
                >
                  Remover
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Orçamentos ──

function OrcamentosPage({
  role,
  userName,
  orcamentos,
  onOrcamentosChange,
  pedidos
}: {
  role: Role
  userName: string
  orcamentos: Orcamento[]
  onOrcamentosChange: (next: Orcamento[]) => void
  pedidos: Pedido[]
  onPedidosChange: (next: Pedido[]) => void
  pagamentos: Pagamento[]
  onPagamentosChange: (next: Pagamento[]) => void
}) {
  const [selected, setSelected] =
    useState<Orcamento | null>(null)

  const [showForm, setShowForm] =
    useState(false)

  const [editing, setEditing] =
    useState<Orcamento | null>(null)

  const [erro, setErro] =
    useState('')

  const [aGuardar, setAGuardar] =
    useState(false)

  const orcamentosVisiveis =
    role === 'cliente'
      ? orcamentos.filter(
        o => o.cliente === userName
      )
      : orcamentos
  // =========================================================
  // DATA ATUAL NO FORMATO YYYY-MM-DD
  // Evita problemas de UTC ao usar toISOString()
  // =========================================================

  function dataLocalHoje() {
    const d = new Date()

    return `${d.getFullYear()}-${String(
      d.getMonth() + 1
    ).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')}`
  }

  const [form, setForm] = useState({
    pedido_id: '',
    validade: dataLocalHoje(),

    status:
      'pendente' as
      | 'pendente'
      | 'aceite'
      | 'rejeitado',

    itens: [
      {
        descricao: 'Mão de obra',
        valor: 0
      }
    ]
  })

  // =========================================================
  // NORMALIZAR DATA RECEBIDA DA API
  //
  // Exemplo:
  // API -> 2026-10-04T23:00:00.000Z
  // Portugal -> 2026-10-05
  // =========================================================

  function normalizarData(
    data: string
  ) {
    if (!data) return ''

    if (
      /^\d{4}-\d{2}-\d{2}$/.test(
        data
      )
    ) {
      return data
    }

    const d = new Date(data)

    if (
      Number.isNaN(
        d.getTime()
      )
    ) {
      return String(data).split('T')[0]
    }

    return `${d.getFullYear()}-${String(
      d.getMonth() + 1
    ).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')}`
  }

  // =========================================================
  // NORMALIZAR ORÇAMENTO RECEBIDO DA API
  // =========================================================

  function normalizarOrcamento(
    o: any
  ): Orcamento {
    const pedidoId = String(
      o.pedido_id ??
      o.pedidoId ??
      ''
    )

    const pedido = pedidos.find(
      p => p.id === pedidoId
    )

    return {
      id: String(o.id),

      pedido_id: pedidoId,

      pedidoId,

      cliente:
        o.cliente ??
        pedido?.cliente ??
        '—',

      servico:
        o.servico ??
        pedido?.categoria ??
        'Serviço',

      valor:
        Number(o.valor) || 0,

      validade:
        o.validade
          ? normalizarData(
            String(o.validade)
          )
          : '',

      status: o.status,

      itens: Array.isArray(o.itens)
        ? o.itens.map(
          (i: any) => ({
            id: i.id,
            descricao:
              i.descricao,
            valor:
              Number(i.valor) ||
              0
          })
        )
        : []
    }
  }

  // =========================================================
  // CARREGAR ORÇAMENTOS DA BASE DE DADOS
  // =========================================================

  async function carregarOrcamentos() {
    try {
      const resposta = await fetch(
        'http://localhost:3000/api/orcamentos'
      )

      if (!resposta.ok) {
        throw new Error(
          'Erro ao obter orçamentos'
        )
      }

      const dados =
        await resposta.json()

      onOrcamentosChange(
        dados.map(
          normalizarOrcamento
        )
      )

    } catch (e) {
      console.error(
        'Erro ao carregar orçamentos:',
        e
      )
    }
  }

  // =========================================================
  // CARREGAR QUANDO A PÁGINA É INICIADA
  // =========================================================

  useEffect(() => {
    carregarOrcamentos()
  }, [pedidos.length])

  // =========================================================
  // ABRIR FORMULÁRIO PARA CRIAR
  // =========================================================

  function abrirCriar() {
    setEditing(null)
    setErro('')

    setForm({
      pedido_id:
        pedidos[0]?.id ?? '',

      validade:
        dataLocalHoje(),

      status:
        'pendente',

      itens: [
        {
          descricao:
            'Mão de obra',
          valor: 0
        }
      ]
    })

    setShowForm(true)
  }

  // =========================================================
  // ABRIR FORMULÁRIO PARA EDITAR
  // =========================================================

  function abrirEditar(
    o: Orcamento
  ) {
    setEditing(o)
    setErro('')

    setForm({
      pedido_id:
        o.pedido_id,

      validade:
        o.validade,

      status:
        o.status,

      itens:
        o.itens.length
          ? o.itens.map(
            i => ({
              descricao:
                i.descricao,
              valor:
                Number(i.valor)
            })
          )
          : [
            {
              descricao:
                'Mão de obra',
              valor:
                Number(o.valor)
            }
          ]
    })

    setSelected(null)
    setShowForm(true)
  }

  // =========================================================
  // ATUALIZAR ITEM
  // =========================================================

  function atualizarItem(
    index: number,
    campo: 'descricao' | 'valor',
    valor: string
  ) {
    setForm(atual => ({
      ...atual,

      itens: atual.itens.map(
        (item, i) =>
          i === index
            ? {
              ...item,

              [campo]:
                campo === 'valor'
                  ? Number(valor)
                  : valor
            }
            : item
      )
    }))
  }

  // =========================================================
  // ADICIONAR ITEM
  // =========================================================

  function adicionarItem() {
    setForm(atual => ({
      ...atual,

      itens: [
        ...atual.itens,

        {
          descricao: '',
          valor: 0
        }
      ]
    }))
  }

  // =========================================================
  // REMOVER ITEM
  // =========================================================

  function removerItem(index: number) {
    if (form.itens.length === 1) {
      return
    }

    setForm(atual => ({
      ...atual,

      itens: atual.itens.filter(
        (_, i) => i !== index
      )
    }))
  }

  // =========================================================
  // GUARDAR / EDITAR ORÇAMENTO
  // =========================================================

  async function guardarOrcamento() {
    setErro('')

    const itensValidos =
      form.itens.filter(
        i =>
          i.descricao.trim() &&
          Number(i.valor) >= 0
      )

    if (
      !form.pedido_id ||
      !form.validade ||
      itensValidos.length === 0
    ) {
      setErro(
        'Preenche o pedido, a validade e pelo menos um item.'
      )

      return
    }

    try {
      setAGuardar(true)

      const resposta = await fetch(
        `http://localhost:3000/api/orcamentos${editing
          ? `/${editing.id}`
          : ''
        }`,
        {
          method:
            editing
              ? 'PUT'
              : 'POST',

          headers: {
            'Content-Type':
              'application/json'
          },

          body: JSON.stringify({
            pedido_id:
              form.pedido_id,

            validade:
              form.validade,

            status:
              form.status,

            itens:
              itensValidos
          })
        }
      )

      const dados =
        await resposta
          .json()
          .catch(() => ({}))

      if (!resposta.ok) {
        throw new Error(
          dados.erro ||
          'Erro ao guardar orçamento.'
        )
      }

      await carregarOrcamentos()

      setShowForm(false)
      setEditing(null)

    } catch (e: any) {
      setErro(
        e.message ||
        'Erro ao guardar orçamento.'
      )

    } finally {
      setAGuardar(false)
    }
  }

  // =========================================================
  // ACEITAR / REJEITAR
  // =========================================================

  async function alterarEstado(
    o: Orcamento,
    status: 'aceite' | 'rejeitado'
  ) {
    try {
      const resposta = await fetch(
        `http://localhost:3000/api/orcamentos/${o.id}`,
        {
          method: 'PUT',

          headers: {
            'Content-Type':
              'application/json'
          },

          body: JSON.stringify({
            pedido_id:
              o.pedido_id,

            validade:
              o.validade,

            status,

            itens:
              o.itens.map(i => ({
                descricao:
                  i.descricao,

                valor:
                  Number(i.valor)
              }))
          })
        }
      )

      const dados =
        await resposta
          .json()
          .catch(() => ({}))

      if (!resposta.ok) {
        throw new Error(
          dados.erro ||
          'Erro ao atualizar orçamento.'
        )
      }

      await carregarOrcamentos()

      setSelected(null)

    } catch (e: any) {
      alert(
        e.message ||
        'Erro ao atualizar orçamento.'
      )
    }
  }

  // =========================================================
  // ELIMINAR
  // =========================================================

  async function eliminarOrcamento(
    o: Orcamento
  ) {
    if (
      !confirm(
        `Eliminar o orçamento ${o.id}?`
      )
    ) {
      return
    }

    try {
      const resposta = await fetch(
        `http://localhost:3000/api/orcamentos/${o.id}`,
        {
          method: 'DELETE'
        }
      )

      const dados =
        await resposta
          .json()
          .catch(() => ({}))

      if (!resposta.ok) {
        throw new Error(
          dados.erro ||
          'Erro ao eliminar orçamento.'
        )
      }

      await carregarOrcamentos()

      setSelected(null)

    } catch (e: any) {
      alert(
        e.message ||
        'Erro ao eliminar orçamento.'
      )
    }
  }

  // =========================================================
  // TOTAL DO FORMULÁRIO
  // =========================================================

  const totalForm =
    form.itens.reduce(
      (s, i) =>
        s + (Number(i.valor) || 0),
      0
    )

  return (
    <>
      <div
        style={{
          display: 'flex',
          gap: 16
        }}
      >
        {/* LISTA DE ORÇAMENTOS */}

        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 14
          }}
        >
          {orcamentos.length === 0 && (
            <div
              style={{
                background: '#fff',
                borderRadius: 12,
                border:
                  '1px solid #E4E9F0',
                padding: 24,
                color: '#6B7A90'
              }}
            >
              Ainda não existem orçamentos.
            </div>
          )}

          {orcamentosVisiveis.map(o => (
            <div
              key={o.id}

              onClick={() =>
                setSelected(
                  selected?.id === o.id
                    ? null
                    : o
                )
              }

              style={{
                background: '#fff',

                borderRadius: 12,

                border: `1px solid ${selected?.id === o.id
                  ? '#1565D8'
                  : '#E4E9F0'
                  }`,

                padding: '18px 20px',

                cursor: 'pointer'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent:
                    'space-between',
                  alignItems:
                    'flex-start',
                  marginBottom: 10
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems:
                        'center',
                      gap: 8,
                      marginBottom: 4
                    }}
                  >
                    <span
                      style={{
                        fontFamily:
                          'JetBrains Mono, monospace',
                        fontSize: 12,
                        color:
                          '#1565D8',
                        fontWeight: 600
                      }}
                    >
                      {o.id}
                    </span>

                    <Badge
                      label={
                        o.status ===
                          'aceite'
                          ? 'Aceite'
                          : o.status ===
                            'pendente'
                            ? 'Pendente'
                            : 'Rejeitado'
                      }

                      cls={
                        statusColors[
                        o.status
                        ]
                      }
                    />
                  </div>

                  <div
                    style={{
                      fontFamily:
                        'DM Sans, sans-serif',
                      fontWeight: 700,
                      fontSize: 15,
                      color: '#0D1B2A'
                    }}
                  >
                    {o.servico}
                  </div>

                  <div
                    style={{
                      fontSize: 12,
                      color: '#6B7A90'
                    }}
                  >
                    Cliente: {o.cliente}
                    {' · '}
                    Ref. {o.pedido_id}
                  </div>
                </div>

                <div
                  style={{
                    textAlign: 'right'
                  }}
                >
                  <div
                    style={{
                      fontFamily:
                        'DM Sans, sans-serif',
                      fontSize: 22,
                      fontWeight: 700,
                      color: '#0D1B2A'
                    }}
                  >
                    €
                    {Number(
                      o.valor
                    ).toFixed(2)}
                  </div>

                  <div
                    style={{
                      fontSize: 11,
                      color: '#9AA5B4'
                    }}
                  >
                    Válido até{' '}
                    {o.validade}
                  </div>
                </div>
              </div>

              {/* DETALHES */}

              {selected?.id ===
                o.id && (
                  <div
                    style={{
                      borderTop:
                        '1px solid #F1F5F9',
                      paddingTop: 14,
                      marginTop: 4
                    }}

                    onClick={e =>
                      e.stopPropagation()
                    }
                  >
                    {o.itens.map(
                      (item, i) => (
                        <div
                          key={
                            item.id ??
                            i
                          }

                          style={{
                            display:
                              'flex',

                            justifyContent:
                              'space-between',

                            padding:
                              '7px 0',

                            borderBottom:
                              i <
                                o.itens
                                  .length -
                                1
                                ? '1px dashed #E4E9F0'
                                : undefined
                          }}
                        >
                          <span
                            style={{
                              fontSize: 13,
                              color:
                                '#0D1B2A'
                            }}
                          >
                            {
                              item.descricao
                            }
                          </span>

                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              fontFamily:
                                'JetBrains Mono, monospace'
                            }}
                          >
                            €
                            {Number(
                              item.valor
                            ).toFixed(2)}
                          </span>
                        </div>
                      )
                    )}

                    <div
                      style={{
                        display: 'flex',
                        justifyContent:
                          'space-between',
                        padding:
                          '10px 0 0'
                      }}
                    >
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 700
                        }}
                      >
                        Total
                      </span>

                      <span
                        style={{
                          fontSize: 15,
                          fontWeight: 700,
                          color:
                            '#1565D8',
                          fontFamily:
                            'JetBrains Mono, monospace'
                        }}
                      >
                        €
                        {Number(
                          o.valor
                        ).toFixed(2)}
                      </span>
                    </div>

                    {/* ACEITAR / REJEITAR */}

                    {o.status ===
                      'pendente' &&
                      (role ===
                        'cliente' ||
                        role ===
                        'admin') && (
                        <div
                          style={{
                            display:
                              'flex',
                            gap: 8,
                            marginTop: 14
                          }}
                        >
                          <button
                            onClick={() =>
                              alterarEstado(
                                o,
                                'aceite'
                              )
                            }

                            style={{
                              flex: 1,
                              padding: 9,
                              borderRadius: 8,
                              background:
                                '#00B893',
                              color: '#fff',
                              border: 'none',
                              cursor:
                                'pointer',
                              fontWeight: 600
                            }}
                          >
                            ✓ Aceitar
                          </button>

                          <button
                            onClick={() =>
                              alterarEstado(
                                o,
                                'rejeitado'
                              )
                            }

                            style={{
                              flex: 1,
                              padding: 9,
                              borderRadius: 8,
                              background:
                                '#fff',
                              color:
                                '#EF4444',
                              border:
                                '1px solid #EF4444',
                              cursor:
                                'pointer',
                              fontWeight: 600
                            }}
                          >
                            ✗ Rejeitar
                          </button>
                        </div>
                      )}

                    {/* EDITAR / ELIMINAR */}

                    {role ===
                      'admin' && (
                        <div
                          style={{
                            display:
                              'flex',
                            gap: 8,
                            marginTop: 10
                          }}
                        >
                          <button
                            onClick={() =>
                              abrirEditar(o)
                            }

                            style={{
                              flex: 1,
                              padding: 9,
                              borderRadius: 8,
                              background:
                                '#1565D8',
                              color: '#fff',
                              border: 'none',
                              cursor:
                                'pointer',
                              fontWeight: 600
                            }}
                          >
                            Editar
                          </button>

                          <button
                            onClick={() =>
                              eliminarOrcamento(
                                o
                              )
                            }

                            style={{
                              flex: 1,
                              padding: 9,
                              borderRadius: 8,
                              background:
                                '#fff',
                              color:
                                '#B91C1C',
                              border:
                                '1px solid #FECACA',
                              cursor:
                                'pointer',
                              fontWeight: 600
                            }}
                          >
                            Eliminar
                          </button>
                        </div>
                      )}
                  </div>
                )}
            </div>
          ))}
        </div>

        {/* RESUMO */}

        <div
          style={{
            width: 260,
            flexShrink: 0
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 12,
              border:
                '1px solid #E4E9F0',
              padding: 18,
              position: 'sticky',
              top: 24
            }}
          >
            <div
              style={{
                fontFamily:
                  'DM Sans, sans-serif',
                fontWeight: 700,
                fontSize: 14,
                color: '#0D1B2A',
                marginBottom: 14
              }}
            >
              Resumo
            </div>

            {[
              {
                label: 'Total',
                value:
                  orcamentosVisiveis.length
              },

              {
                label: 'Aceites',
                value:
                  orcamentosVisiveis.filter(
                    o =>
                      o.status ===
                      'aceite'
                  ).length
              },

              {
                label: 'Pendentes',
                value:
                  orcamentosVisiveis.filter(
                    o =>
                      o.status ===
                      'pendente'
                  ).length
              },

              {
                label:
                  'Valor aceite',

                value: `€${orcamentosVisiveis
                  .filter(
                    o =>
                      o.status ===
                      'aceite'
                  )
                  .reduce(
                    (s, o) =>
                      s +
                      Number(
                        o.valor
                      ),
                    0
                  )
                  .toLocaleString(
                    'pt-PT',
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    }
                  )}`
              }
            ].map(item => (
              <div
                key={item.label}

                style={{
                  display: 'flex',
                  justifyContent:
                    'space-between',
                  padding: '9px 0',
                  borderBottom:
                    '1px solid #F1F5F9'
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    color: '#6B7A90'
                  }}
                >
                  {item.label}
                </span>

                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#0D1B2A'
                  }}
                >
                  {item.value}
                </span>
              </div>
            ))}

            {role === 'admin' && (
              <button
                onClick={
                  abrirCriar
                }

                style={{
                  width: '100%',
                  marginTop: 14,
                  padding: 9,
                  borderRadius: 8,
                  background:
                    '#1565D8',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                + Criar Orçamento
              </button>
            )}
          </div>
        </div>
      </div>

      {/* =====================================================
          FORMULÁRIO CRIAR / EDITAR
      ===================================================== */}

      {showForm &&
        role === 'admin' && (
          <div
            style={{
              position: 'fixed',
              inset: 0,

              background:
                'rgba(13,27,42,0.55)',

              display: 'flex',

              alignItems:
                'center',

              justifyContent:
                'center',

              zIndex: 100
            }}

            onClick={() =>
              setShowForm(false)
            }
          >
            <div
              style={{
                width: 520,

                maxHeight:
                  '90vh',

                overflowY:
                  'auto',

                background:
                  '#fff',

                borderRadius:
                  16,

                padding: 24
              }}

              onClick={e =>
                e.stopPropagation()
              }
            >
              <div
                style={{
                  fontFamily:
                    'DM Sans, sans-serif',

                  fontWeight: 700,

                  fontSize: 20,

                  color:
                    '#0D1B2A',

                  marginBottom:
                    16
                }}
              >
                {editing
                  ? `Editar ${editing.id}`
                  : 'Criar orçamento'}
              </div>

              <div
                style={{
                  display: 'grid',
                  gap: 14
                }}
              >
                {/* PEDIDO */}

                <div>
                  <label
                    style={{
                      display:
                        'block',
                      fontSize: 12,
                      fontWeight: 600,
                      marginBottom: 6
                    }}
                  >
                    Pedido
                  </label>

                  <select
                    value={
                      form.pedido_id
                    }

                    onChange={e =>
                      setForm({
                        ...form,
                        pedido_id:
                          e.target
                            .value
                      })
                    }

                    style={{
                      width: '100%',
                      padding:
                        '10px 12px',
                      borderRadius: 8,
                      border:
                        '1px solid #E4E9F0',
                      background:
                        '#FAFBFC'
                    }}
                  >
                    {pedidos.map(
                      p => (
                        <option
                          key={p.id}
                          value={p.id}
                        >
                          {p.id} —{' '}
                          {p.cliente}{' '}
                          —{' '}
                          {p.categoria}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* VALIDADE */}

                <div>
                  <label
                    style={{
                      display:
                        'block',
                      fontSize: 12,
                      fontWeight: 600,
                      marginBottom: 6
                    }}
                  >
                    Validade
                  </label>

                  <input
                    type="date"

                    value={
                      form.validade
                    }

                    onChange={e =>
                      setForm({
                        ...form,
                        validade:
                          e.target
                            .value
                      })
                    }

                    style={{
                      width: '100%',
                      padding:
                        '10px 12px',
                      borderRadius: 8,
                      border:
                        '1px solid #E4E9F0',
                      background:
                        '#FAFBFC'
                    }}
                  />
                </div>

                {/* ESTADO */}

                {editing && (
                  <div>
                    <label
                      style={{
                        display:
                          'block',
                        fontSize: 12,
                        fontWeight: 600,
                        marginBottom: 6
                      }}
                    >
                      Estado
                    </label>

                    <select
                      value={
                        form.status
                      }

                      onChange={e =>
                        setForm({
                          ...form,

                          status:
                            e.target
                              .value as any
                        })
                      }

                      style={{
                        width: '100%',
                        padding:
                          '10px 12px',
                        borderRadius: 8,
                        border:
                          '1px solid #E4E9F0',
                        background:
                          '#FAFBFC'
                      }}
                    >
                      <option value="pendente">
                        Pendente
                      </option>

                      <option value="aceite">
                        Aceite
                      </option>

                      <option value="rejeitado">
                        Rejeitado
                      </option>
                    </select>
                  </div>
                )}

                {/* ITENS */}

                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent:
                        'space-between',
                      alignItems:
                        'center',
                      marginBottom: 8
                    }}
                  >
                    <label
                      style={{
                        fontSize: 12,
                        fontWeight: 600
                      }}
                    >
                      Itens do orçamento
                    </label>

                    <button
                      onClick={
                        adicionarItem
                      }

                      type="button"

                      style={{
                        border: 'none',
                        background:
                          '#EEF5FF',
                        color:
                          '#1565D8',
                        borderRadius: 7,
                        padding:
                          '6px 9px',
                        cursor:
                          'pointer'
                      }}
                    >
                      + Item
                    </button>
                  </div>

                  {form.itens.map(
                    (item, i) => (
                      <div
                        key={i}

                        style={{
                          display:
                            'grid',

                          gridTemplateColumns:
                            '1fr 110px 34px',

                          gap: 8,

                          marginBottom: 8
                        }}
                      >
                        <input
                          placeholder="Descrição"

                          value={
                            item.descricao
                          }

                          onChange={e =>
                            atualizarItem(
                              i,
                              'descricao',
                              e.target
                                .value
                            )
                          }

                          style={{
                            padding:
                              '9px 10px',

                            borderRadius:
                              8,

                            border:
                              '1px solid #E4E9F0'
                          }}
                        />

                        <input
                          type="number"

                          min="0"

                          step="0.01"

                          value={
                            item.valor
                          }

                          onChange={e =>
                            atualizarItem(
                              i,
                              'valor',
                              e.target
                                .value
                            )
                          }

                          style={{
                            padding:
                              '9px 10px',

                            borderRadius:
                              8,

                            border:
                              '1px solid #E4E9F0'
                          }}
                        />

                        <button
                          type="button"

                          onClick={() =>
                            removerItem(
                              i
                            )
                          }

                          disabled={
                            form.itens
                              .length ===
                            1
                          }

                          style={{
                            borderRadius:
                              8,

                            border:
                              '1px solid #FECACA',

                            background:
                              '#fff',

                            color:
                              '#B91C1C',

                            cursor:
                              form.itens
                                .length ===
                                1
                                ? 'not-allowed'
                                : 'pointer'
                          }}
                        >
                          ×
                        </button>
                      </div>
                    )
                  )}
                </div>

                {/* TOTAL */}

                <div
                  style={{
                    display: 'flex',
                    justifyContent:
                      'space-between',
                    padding: 12,
                    background:
                      '#F8FAFB',
                    borderRadius: 8
                  }}
                >
                  <strong>
                    Total
                  </strong>

                  <strong>
                    €
                    {totalForm.toFixed(
                      2
                    )}
                  </strong>
                </div>

                {/* ERRO */}

                {erro && (
                  <div
                    style={{
                      color:
                        '#B91C1C',
                      fontSize: 13,
                      background:
                        '#FEF2F2',
                      padding: 10,
                      borderRadius: 8
                    }}
                  >
                    {erro}
                  </div>
                )}
              </div>

              {/* BOTÕES */}

              <div
                style={{
                  display: 'flex',
                  justifyContent:
                    'flex-end',
                  gap: 10,
                  marginTop: 22
                }}
              >
                <button
                  onClick={() =>
                    setShowForm(
                      false
                    )
                  }

                  disabled={
                    aGuardar
                  }

                  style={{
                    padding:
                      '10px 16px',
                    borderRadius: 8,
                    border:
                      '1px solid #E4E9F0',
                    background:
                      '#fff',
                    color:
                      '#6B7A90',
                    cursor:
                      'pointer'
                  }}
                >
                  Cancelar
                </button>

                <button
                  onClick={
                    guardarOrcamento
                  }

                  disabled={
                    aGuardar
                  }

                  style={{
                    padding:
                      '10px 16px',
                    borderRadius: 8,
                    border: 'none',
                    background:
                      '#1565D8',
                    color: '#fff',
                    cursor:
                      'pointer',
                    fontWeight: 600
                  }}
                >
                  {aGuardar
                    ? 'A guardar...'
                    : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        )}
    </>
  )
}

// ── Agendamentos ──

function AgendamentosPage({
  role,
  agendamentos,
  onAgendamentosChange,
  disponibilidade,
  onDisponibilidadeChange,
  userName
}: {
  role: Role
  agendamentos: Agendamento[]
  onAgendamentosChange: (next: Agendamento[]) => void
  disponibilidade: string[]
  onDisponibilidadeChange: (next: string[]) => void
  userName: string
}) {
  type ClienteAPI = {
    id?: number | string
    nome: string
    email?: string
  }

  type TecnicoAPI = {
    id?: number | string
    nome: string
    email?: string
  }

  const [monthOffset, setMonthOffset] = useState(0)

  const [selectedDate, setSelectedDate] = useState(
    new Date(2026, 8, 18)
  )

  const [showForm, setShowForm] = useState(false)

  const [newAvailableDate, setNewAvailableDate] =
    useState('2026-09-20')

  const [formError, setFormError] = useState('')

  const [aGuardar, setAGuardar] = useState(false)

  const [clientesAPI, setClientesAPI] =
    useState<ClienteAPI[]>([])

  const [tecnicosAPI, setTecnicosAPI] =
    useState<TecnicoAPI[]>([])

  const [clientPreference, setClientPreference] =
    useState({
      data: '2026-09-24',
      hora: '10:00'
    })

  const [form, setForm] = useState({
    cliente: '',
    tecnico: '',
    servico: '',
    data: '2026-09-20',
    hora: '09:00',
    duracao: '2h',
    status: 'confirmado' as Agendamento['status']
  })

  // =========================================================
  // CARREGAR CLIENTES E TÉCNICOS DA BASE DE DADOS
  // =========================================================

  useEffect(() => {
    async function carregarDadosFormulario() {
      try {
        const [resClientes, resTecnicos] =
          await Promise.all([
            fetch(
              'http://localhost:3000/api/clientes'
            ),

            fetch(
              'http://localhost:3000/api/tecnicos'
            )
          ])

        if (!resClientes.ok) {
          throw new Error(
            'Erro ao carregar clientes.'
          )
        }

        if (!resTecnicos.ok) {
          throw new Error(
            'Erro ao carregar técnicos.'
          )
        }

        const dadosClientes =
          await resClientes.json()

        const dadosTecnicos =
          await resTecnicos.json()

        setClientesAPI(
          Array.isArray(dadosClientes)
            ? dadosClientes
            : []
        )

        setTecnicosAPI(
          Array.isArray(dadosTecnicos)
            ? dadosTecnicos
            : []
        )
      } catch (erro) {
        console.error(
          'Erro ao carregar dados dos agendamentos:',
          erro
        )
      }
    }

    carregarDadosFormulario()
  }, [])

  // =========================================================
  // NORMALIZAR DATAS
  // =========================================================

  const normalizarData = (data: string) => {
    if (!data) return ''

    // Se já vier YYYY-MM-DD,
    // não passamos pelo Date.

    if (/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      return data
    }

    const d = new Date(data)

    if (Number.isNaN(d.getTime())) {
      return data
    }

    return `${d.getFullYear()}-${String(
      d.getMonth() + 1
    ).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')}`
  }

  // =========================================================
  // CALENDÁRIO
  // =========================================================

  const currentMonth = new Date(
    2026,
    8 + monthOffset,
    1
  )

  const monthLabel =
    currentMonth.toLocaleString('pt-PT', {
      month: 'long',
      year: 'numeric'
    })

  const visibleAgendamentos =
    agendamentos.filter(a => {
      if (role === 'cliente') {
        return a.cliente === userName
      }

      if (role === 'tecnico') {
        return a.tecnico === userName
      }

      return true
    })

  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate()

  const leadingEmptyDays =
    currentMonth.getDay()

  const monthCells = Array.from(
    {
      length:
        leadingEmptyDays +
        daysInMonth
    },

    (_, index) => {
      if (index < leadingEmptyDays) {
        return null
      }

      return (
        index -
        leadingEmptyDays +
        1
      )
    }
  )

  const selectedKey =
    `${selectedDate.getFullYear()}-${String(
      selectedDate.getMonth() + 1
    ).padStart(2, '0')}-${String(
      selectedDate.getDate()
    ).padStart(2, '0')}`

  const dayAppointments =
    visibleAgendamentos.filter(
      a =>
        normalizarData(a.data) ===
        selectedKey
    )

  // =========================================================
  // DISPONIBILIDADE DO TÉCNICO
  // =========================================================

  function addDisponibilidade() {
    if (!newAvailableDate) return

    const next = [
      ...new Set([
        ...disponibilidade,
        newAvailableDate
      ])
    ].sort()

    onDisponibilidadeChange(next)
  }

  function removeDisponibilidade(
    date: string
  ) {
    onDisponibilidadeChange(
      disponibilidade.filter(
        d => d !== date
      )
    )
  }

  // =========================================================
  // ABRIR FORMULÁRIO
  // =========================================================

  function abrirNovoAgendamento() {
    setFormError('')

    setForm({
      cliente: '',
      tecnico: '',
      servico: '',
      data: selectedKey,
      hora: '09:00',
      duracao: '2h',
      status: 'confirmado'
    })

    setShowForm(true)
  }

  // =========================================================
  // CRIAR AGENDAMENTO
  // =========================================================

  async function handleCreateAgendamento() {
    setFormError('')

    if (!form.cliente) {
      setFormError(
        'Selecione um cliente.'
      )
      return
    }

    if (!form.tecnico) {
      setFormError(
        'Selecione um técnico.'
      )
      return
    }

    if (!form.servico.trim()) {
      setFormError(
        'Indique o serviço.'
      )
      return
    }

    if (!form.data) {
      setFormError(
        'Selecione uma data.'
      )
      return
    }

    if (!form.hora) {
      setFormError(
        'Selecione uma hora.'
      )
      return
    }

    if (!form.duracao.trim()) {
      setFormError(
        'Indique a duração.'
      )
      return
    }

    const conflito =
      agendamentos.some(
        a =>
          a.tecnico ===
          form.tecnico &&
          normalizarData(a.data) ===
          form.data &&
          a.hora?.slice(0, 5) ===
          form.hora
      )

    if (conflito) {
      setFormError(
        'Já existe um agendamento para esse técnico, data e hora.'
      )
      return
    }

    try {
      setAGuardar(true)

      const resposta = await fetch(
        'http://localhost:3000/api/agendamentos',
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json'
          },

          body: JSON.stringify({
            cliente:
              form.cliente,

            tecnico:
              form.tecnico,

            servico:
              form.servico.trim(),

            data:
              form.data,

            hora:
              form.hora,

            duracao:
              form.duracao.trim(),

            status:
              form.status
          })
        }
      )

      const dados =
        await resposta.json()

      if (!resposta.ok) {
        throw new Error(
          dados?.erro ||
          dados?.error ||
          'Não foi possível criar o agendamento.'
        )
      }

      // Depois de gravar, voltamos
      // a carregar os agendamentos
      // diretamente da base de dados.

      const respostaLista =
        await fetch(
          'http://localhost:3000/api/agendamentos'
        )

      if (!respostaLista.ok) {
        throw new Error(
          'O agendamento foi criado, mas não foi possível atualizar a lista.'
        )
      }

      const lista =
        await respostaLista.json()

      const listaNormalizada:
        Agendamento[] = (
          Array.isArray(lista)
            ? lista
            : []
        ).map((a: any) => ({
          id: a.id,

          pedidoId:
            a.pedidoId ??
            a.pedido_id ??
            '',

          cliente:
            a.cliente ?? '',

          tecnico:
            a.tecnico ?? '',

          servico:
            a.servico ?? '',

          data:
            normalizarData(
              a.data
            ),

          hora:
            a.hora?.slice(
              0,
              5
            ) ?? '',

          duracao:
            a.duracao ?? '',

          status:
            a.status
        }))

      onAgendamentosChange(
        listaNormalizada
      )

      setSelectedDate(
        new Date(
          `${form.data}T12:00:00`
        )
      )

      setShowForm(false)

      setFormError('')

      setForm({
        cliente: '',
        tecnico: '',
        servico: '',
        data: form.data,
        hora: '09:00',
        duracao: '2h',
        status: 'confirmado'
      })
    } catch (erro) {
      console.error(
        'Erro ao criar agendamento:',
        erro
      )

      setFormError(
        erro instanceof Error
          ? erro.message
          : 'Erro ao criar o agendamento.'
      )
    } finally {
      setAGuardar(false)
    }
  }

  // =========================================================
  // PREFERÊNCIA DO CLIENTE
  // =========================================================

  function handleClientPreference() {
    if (
      !clientPreference.data ||
      !clientPreference.hora
    ) {
      return
    }

    const novo: Agendamento = {
      id: `AG-${String(
        agendamentos.length + 1
      ).padStart(3, '0')}`,

      pedidoId: '',

      cliente:
        userName,

      tecnico:
        'A definir',

      servico:
        'Pedido de serviço em análise',

      data:
        clientPreference.data,

      hora:
        clientPreference.hora,

      duracao:
        '2h',

      status:
        'confirmado'
    }

    onAgendamentosChange([
      novo,
      ...agendamentos
    ])

    setSelectedDate(
      new Date(
        `${clientPreference.data}T12:00:00`
      )
    )
  }

  const inputStyle = {
    width: '100%',

    padding:
      '10px 12px',

    borderRadius: 8,

    border:
      '1px solid #E4E9F0',

    background:
      '#FAFBFC',

    boxSizing:
      'border-box' as const
  }

  const labelStyle = {
    display: 'block',

    marginBottom: 6,

    fontSize: 12,

    fontWeight: 600
  }

  // =========================================================
  // INTERFACE
  // =========================================================

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16
      }}
    >
      {/* =====================================================
          ÁREA DO CLIENTE
      ===================================================== */}

      {role === 'cliente' && (
        <div
          style={{
            background: '#fff',

            borderRadius: 12,

            border:
              '1px solid #E4E9F0',

            padding:
              '18px 20px'
          }}
        >
          <div
            style={{
              fontFamily:
                'DM Sans, sans-serif',

              fontWeight: 700,

              fontSize: 14,

              color:
                '#0D1B2A',

              marginBottom: 12
            }}
          >
            Pedido de agendamento
          </div>

          <div
            style={{
              display: 'grid',

              gridTemplateColumns:
                '1fr 1fr',

              gap: 12,

              marginBottom: 12
            }}
          >
            <div>
              <label
                style={labelStyle}
              >
                Data preferida
              </label>

              <input
                type="date"

                value={
                  clientPreference.data
                }

                onChange={e =>
                  setClientPreference(
                    prev => ({
                      ...prev,

                      data:
                        e.target
                          .value
                    })
                  )
                }

                style={inputStyle}
              />
            </div>

            <div>
              <label
                style={labelStyle}
              >
                Hora preferida
              </label>

              <input
                type="time"

                value={
                  clientPreference.hora
                }

                onChange={e =>
                  setClientPreference(
                    prev => ({
                      ...prev,

                      hora:
                        e.target
                          .value
                    })
                  )
                }

                style={inputStyle}
              />
            </div>
          </div>

          <button
            onClick={
              handleClientPreference
            }

            style={{
              padding:
                '10px 16px',

              borderRadius: 8,

              background:
                '#1565D8',

              color: '#fff',

              border: 'none',

              cursor:
                'pointer',

              fontWeight: 600
            }}
          >
            Enviar preferência
          </button>
        </div>
      )}

      {/* =====================================================
          DISPONIBILIDADE DO TÉCNICO
      ===================================================== */}

      {role === 'tecnico' && (
        <div
          style={{
            background: '#fff',
            borderRadius: 12,
            border: '1px solid #E4E9F0',
            padding: '18px 20px'
          }}
        >
          <div
            style={{
              fontFamily: 'DM Sans, sans-serif',
              fontWeight: 700,
              fontSize: 14,
              color: '#0D1B2A',
              marginBottom: 12
            }}
          >
            Disponibilidade do técnico
          </div>

          <div
            style={{
              display: 'flex',
              gap: 10,
              alignItems: 'center',
              marginBottom: 12
            }}
          >
            <input
              type="date"
              value={newAvailableDate}
              onChange={e =>
                setNewAvailableDate(e.target.value)
              }
              style={{
                ...inputStyle,
                flex: 1
              }}
            />

            <button
              onClick={addDisponibilidade}
              style={{
                padding: '10px 16px',
                borderRadius: 8,
                background: '#1565D8',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Adicionar dia
            </button>
          </div>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8
            }}
          >
            {disponibilidade.length === 0 ? (
              <span
                style={{
                  fontSize: 12,
                  color: '#9AA5B4'
                }}
              >
                Ainda não marcou nenhum dia disponível.
              </span>
            ) : (
              disponibilidade.map(date => (
                <div
                  key={date}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 10px',
                    borderRadius: 999,
                    background: '#EFF6FF',
                    color: '#1565D8',
                    fontSize: 12,
                    fontWeight: 600
                  }}
                >
                  {new Date(
                    `${date}T12:00:00`
                  ).toLocaleDateString('pt-PT')}

                  <button
                    onClick={() =>
                      removeDisponibilidade(date)
                    }
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: '#1565D8',
                      cursor: 'pointer',
                      fontWeight: 700
                    }}
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* =====================================================
          CALENDÁRIO
      ===================================================== */}

      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          border: '1px solid #E4E9F0',
          padding: '18px 20px'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 14
          }}
        >
          <div
            style={{
              fontFamily: 'DM Sans, sans-serif',
              fontWeight: 700,
              fontSize: 14,
              color: '#0D1B2A'
            }}
          >
            {monthLabel}
          </div>

          <div
            style={{
              display: 'flex',
              gap: 6
            }}
          >
            <button
              onClick={() =>
                setMonthOffset(prev => prev - 1)
              }
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                border: '1px solid #E4E9F0',
                background: '#fff',
                cursor: 'pointer'
              }}
            >
              ←
            </button>

            <button
              onClick={() =>
                setMonthOffset(prev => prev + 1)
              }
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                border: '1px solid #E4E9F0',
                background: '#fff',
                cursor: 'pointer'
              }}
            >
              →
            </button>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 4
          }}
        >
          {[
            'Dom',
            'Seg',
            'Ter',
            'Qua',
            'Qui',
            'Sex',
            'Sáb'
          ].map(d => (
            <div
              key={d}
              style={{
                textAlign: 'center',
                fontSize: 10,
                fontWeight: 600,
                color: '#9AA5B4',
                padding: '4px 0'
              }}
            >
              {d}
            </div>
          ))}

          {monthCells.map((day, index) => {
            if (!day) {
              return (
                <div
                  key={`empty-${index}`}
                  style={{
                    padding: '7px 4px'
                  }}
                />
              )
            }

            const cellDate = new Date(
              currentMonth.getFullYear(),
              currentMonth.getMonth(),
              day
            )

            const cellKey =
              `${cellDate.getFullYear()}-${String(
                cellDate.getMonth() + 1
              ).padStart(2, '0')}-${String(
                cellDate.getDate()
              ).padStart(2, '0')}`

            const hasEvent =
              visibleAgendamentos.some(
                a =>
                  normalizarData(a.data) ===
                  cellKey
              )

            const isSelected =
              cellKey === selectedKey

            return (
              <button
                key={day}
                onClick={() =>
                  setSelectedDate(cellDate)
                }
                style={{
                  textAlign: 'center',
                  padding: '8px 4px',
                  borderRadius: 7,
                  cursor: 'pointer',
                  position: 'relative',

                  background: isSelected
                    ? '#1565D8'
                    : '#fff',

                  color: isSelected
                    ? '#fff'
                    : '#0D1B2A',

                  border: isSelected
                    ? '1px solid #1565D8'
                    : '1px solid transparent',

                  fontSize: 12,
                  fontWeight: 600
                }}
              >
                {day}

                {hasEvent && (
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',

                      background: isSelected
                        ? '#fff'
                        : '#1565D8',

                      position: 'absolute',
                      bottom: 3,
                      left: '50%',
                      transform: 'translateX(-50%)'
                    }}
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* =====================================================
          AGENDAMENTOS DO DIA
      ===================================================== */}

      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          border: '1px solid #E4E9F0',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #E4E9F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div
            style={{
              fontFamily: 'DM Sans, sans-serif',
              fontWeight: 600,
              fontSize: 14,
              color: '#0D1B2A'
            }}
          >
            {selectedDate.toLocaleDateString(
              'pt-PT',
              {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
              }
            )}
          </div>

          {role === 'admin' && (
            <button
              onClick={abrirNovoAgendamento}
              style={{
                padding: '7px 14px',
                borderRadius: 8,
                background: '#1565D8',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600
              }}
            >
              + Novo Agendamento
            </button>
          )}
        </div>

        {dayAppointments.length === 0 ? (
          <div
            style={{
              padding: '28px 20px',
              textAlign: 'center',
              color: '#9AA5B4',
              fontSize: 13
            }}
          >
            Nenhum agendamento para este dia.
          </div>
        ) : (
          dayAppointments.map((a, i) => (
            <div
              key={a.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '14px 20px',

                borderTop:
                  i > 0
                    ? '1px solid #F1F5F9'
                    : undefined
              }}
            >
              <div
                style={{
                  textAlign: 'center',
                  minWidth: 50,
                  background: '#EFF6FF',
                  borderRadius: 9,
                  padding: '8px 6px'
                }}
              >
                <div
                  style={{
                    fontFamily:
                      'JetBrains Mono, monospace',

                    fontWeight: 700,
                    fontSize: 14,
                    color: '#1565D8'
                  }}
                >
                  {a.hora?.slice(0, 5)}
                </div>

                <div
                  style={{
                    fontSize: 9,
                    color: '#6B7A90'
                  }}
                >
                  {a.duracao}
                </div>
              </div>

              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#0D1B2A'
                  }}
                >
                  {a.servico}
                </div>

                <div
                  style={{
                    fontSize: 12,
                    color: '#6B7A90'
                  }}
                >
                  👤 {a.cliente} · 👷 {a.tecnico}
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  alignItems: 'center'
                }}
              >
                <div
                  style={{
                    fontFamily:
                      'JetBrains Mono, monospace',

                    fontSize: 11,
                    color: '#9AA5B4'
                  }}
                >
                  {normalizarData(a.data)}
                </div>

                <Badge
                  label={
                    a.status === 'em_curso'
                      ? 'Em Curso'
                      : a.status === 'confirmado'
                        ? 'Confirmado'
                        : a.status === 'concluido'
                          ? 'Concluído'
                          : 'Cancelado'
                  }
                  cls={statusColors[a.status]}
                />
              </div>
            </div>
          ))
        )}
      </div>

      {/* =====================================================
          NOVO AGENDAMENTO
      ===================================================== */}

      {showForm && role === 'admin' && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(13,27,42,0.6)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={() => {
            if (!aGuardar) {
              setShowForm(false)
            }
          }}
        >
          <div
            style={{
              width: 520,
              background: '#fff',
              borderRadius: 16,
              padding: 24
            }}
            onClick={e => e.stopPropagation()}
          >
            <div
              style={{
                fontFamily: 'DM Sans, sans-serif',
                fontWeight: 700,
                fontSize: 18,
                color: '#0D1B2A',
                marginBottom: 18
              }}
            >
              Novo Agendamento
            </div>

            {formError && (
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  color: '#B91C1C',
                  fontSize: 12,
                  marginBottom: 12
                }}
              >
                {formError}
              </div>
            )}

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 14
              }}
            >
              {/* CLIENTE */}

              <div>
                <label style={labelStyle}>
                  Cliente
                </label>

                <select
                  value={form.cliente}
                  onChange={e =>
                    setForm({
                      ...form,
                      cliente: e.target.value
                    })
                  }
                  style={inputStyle}
                >
                  <option value="">
                    Selecione o cliente
                  </option>

                  {clientesAPI.map((cliente, index) => (
                    <option
                      key={
                        cliente.id ??
                        `${cliente.nome}-${index}`
                      }
                      value={cliente.nome}
                    >
                      {cliente.nome}
                    </option>
                  ))}
                </select>
              </div>

              {/* TÉCNICO */}

              <div>
                <label style={labelStyle}>
                  Técnico
                </label>

                <select
                  value={form.tecnico}
                  onChange={e =>
                    setForm({
                      ...form,
                      tecnico: e.target.value
                    })
                  }
                  style={inputStyle}
                >
                  <option value="">
                    Selecione o técnico
                  </option>

                  {tecnicosAPI.map((tecnico, index) => (
                    <option
                      key={
                        tecnico.id ??
                        `${tecnico.nome}-${index}`
                      }
                      value={tecnico.nome}
                    >
                      {tecnico.nome}
                    </option>
                  ))}
                </select>
              </div>

              {/* SERVIÇO */}

              <div
                style={{
                  gridColumn: '1 / -1'
                }}
              >
                <label style={labelStyle}>
                  Serviço
                </label>

                <input
                  value={form.servico}
                  placeholder="Ex.: Reparação de canalização"
                  onChange={e =>
                    setForm({
                      ...form,
                      servico: e.target.value
                    })
                  }
                  style={inputStyle}
                />
              </div>

              {/* DATA */}

              <div>
                <label style={labelStyle}>
                  Data
                </label>

                <input
                  type="date"
                  value={form.data}
                  onChange={e =>
                    setForm({
                      ...form,
                      data: e.target.value
                    })
                  }
                  style={inputStyle}
                />
              </div>

              {/* HORA */}

              <div>
                <label style={labelStyle}>
                  Hora
                </label>

                <input
                  type="time"
                  value={form.hora}
                  onChange={e =>
                    setForm({
                      ...form,
                      hora: e.target.value
                    })
                  }
                  style={inputStyle}
                />
              </div>

              {/* DURAÇÃO */}

              <div>
                <label style={labelStyle}>
                  Duração
                </label>

                <input
                  value={form.duracao}
                  placeholder="Ex.: 2h"
                  onChange={e =>
                    setForm({
                      ...form,
                      duracao: e.target.value
                    })
                  }
                  style={inputStyle}
                />
              </div>

              {/* ESTADO */}

              <div>
                <label style={labelStyle}>
                  Estado
                </label>

                <select
                  value={form.status}
                  onChange={e =>
                    setForm({
                      ...form,
                      status:
                        e.target.value as Agendamento['status']
                    })
                  }
                  style={inputStyle}
                >
                  <option value="confirmado">
                    Confirmado
                  </option>

                  <option value="em_curso">
                    Em Curso
                  </option>

                  <option value="concluido">
                    Concluído
                  </option>

                  <option value="cancelado">
                    Cancelado
                  </option>
                </select>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 10,
                marginTop: 20
              }}
            >
              <button
                disabled={aGuardar}
                onClick={() =>
                  setShowForm(false)
                }
                style={{
                  padding: '10px 16px',
                  borderRadius: 8,
                  border: '1px solid #E4E9F0',
                  background: '#fff',
                  color: '#6B7A90',

                  cursor: aGuardar
                    ? 'not-allowed'
                    : 'pointer'
                }}
              >
                Cancelar
              </button>

              <button
                disabled={aGuardar}
                onClick={handleCreateAgendamento}
                style={{
                  padding: '10px 16px',
                  borderRadius: 8,
                  border: 'none',

                  background: aGuardar
                    ? '#93B8EA'
                    : '#1565D8',

                  color: '#fff',

                  cursor: aGuardar
                    ? 'not-allowed'
                    : 'pointer',

                  fontWeight: 600
                }}
              >
                {aGuardar
                  ? 'A guardar...'
                  : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Técnicos ──

function TecnicosPage({ role, tecnicos, onTecnicosChange }: { role: Role; tecnicos: Tecnico[]; onTecnicosChange: (next: Tecnico[]) => void }) {
  type CategoriaTecnico = { id: number; nome: string }
  const [showForm, setShowForm] = useState(false)
  const [editingTecnico, setEditingTecnico] = useState<Tecnico | null>(null)
  const [categoriasTecnico, setCategoriasTecnico] = useState<CategoriaTecnico[]>([])
  const [erroTecnico, setErroTecnico] = useState('')
  const [aGuardar, setAGuardar] = useState(false)
  const [form, setForm] = useState({
    nome: '',
    especialidades: [] as number[],
    telefone: '',
    email: '',
    disponivel: true,
    avaliacao: '0',
    servicosConcluidos: '0'
  })

  async function carregarTecnicos() {
    try {
      const resposta = await fetch('http://localhost:3000/api/tecnicos')

      if (!resposta.ok) {
        throw new Error('Erro ao obter técnicos')
      }

      const dados = await resposta.json()

      const tecnicosFormatados: Tecnico[] = dados.map((t: any) => ({
        id: Number(t.id),
        nome: t.nome ?? '',
        especialidades: Array.isArray(t.especialidades)
          ? t.especialidades
          : [],
        disponivel: Boolean(t.disponivel),
        avaliacao: Number(t.avaliacao) || 0,
        servicosConcluidos: Number(t.servicos_concluidos) || 0,
        telefone: t.telefone ?? '',
        email: t.email ?? ''
      }))

      onTecnicosChange(tecnicosFormatados)

    } catch (erro) {
      console.error('Erro ao carregar técnicos:', erro)
    }
  }

  async function carregarCategoriasTecnico() {
    try {
      const resposta = await fetch('http://localhost:3000/api/categorias')

      if (!resposta.ok) {
        throw new Error('Erro ao obter categorias')
      }

      const dados = await resposta.json()

      setCategoriasTecnico(
        dados.map((c: any) => ({
          id: Number(c.id),
          nome: c.nome
        }))
      )

    } catch (erro) {
      console.error('Erro ao carregar categorias:', erro)
    }
  }

  useEffect(() => {
    carregarTecnicos()
    carregarCategoriasTecnico()
  }, [])

  function abrirNovoTecnico() {
    setEditingTecnico(null)
    setErroTecnico('')

    setForm({
      nome: '',
      especialidades: [],
      telefone: '',
      email: '',
      disponivel: true,
      avaliacao: '0',
      servicosConcluidos: '0'
    })

    setShowForm(true)
  }

  function abrirEditarTecnico(tecnico: Tecnico) {
    const idsEspecialidades = categoriasTecnico
      .filter(c => tecnico.especialidades.includes(c.nome))
      .map(c => c.id)

    setEditingTecnico(tecnico)
    setErroTecnico('')

    setForm({
      nome: tecnico.nome,
      especialidades: idsEspecialidades,
      telefone: tecnico.telefone || '',
      email: tecnico.email,
      disponivel: tecnico.disponivel,
      avaliacao: String(tecnico.avaliacao),
      servicosConcluidos: String(tecnico.servicosConcluidos)
    })

    setShowForm(true)
  }

  function fecharFormularioTecnico() {
    setShowForm(false)
    setEditingTecnico(null)
    setErroTecnico('')
  }

  function alternarEspecialidade(id: number) {
    setForm(atual => ({
      ...atual,

      especialidades: atual.especialidades.includes(id)
        ? atual.especialidades.filter(item => item !== id)
        : [...atual.especialidades, id]
    }))
  }

  async function guardarTecnico() {
    setErroTecnico('')

    if (!form.nome.trim()) {
      setErroTecnico('O nome é obrigatório.')
      return
    }

    if (!form.email.trim()) {
      setErroTecnico('O email é obrigatório.')
      return
    }

    if (form.especialidades.length === 0) {
      setErroTecnico('Seleciona pelo menos uma especialidade.')
      return
    }

    const avaliacao = Number(form.avaliacao)
    const servicosConcluidos = Number(form.servicosConcluidos)

    if (
      Number.isNaN(avaliacao) ||
      avaliacao < 0 ||
      avaliacao > 5
    ) {
      setErroTecnico('A avaliação deve estar entre 0 e 5.')
      return
    }

    if (
      Number.isNaN(servicosConcluidos) ||
      servicosConcluidos < 0
    ) {
      setErroTecnico('O número de serviços concluídos não é válido.')
      return
    }

    setAGuardar(true)

    try {
      const url = editingTecnico
        ? `http://localhost:3000/api/tecnicos/${editingTecnico.id}`
        : 'http://localhost:3000/api/tecnicos'

      const resposta = await fetch(url, {
        method: editingTecnico ? 'PUT' : 'POST',

        headers: {
          'Content-Type': 'application/json'
        },

        body: JSON.stringify({
          nome: form.nome.trim(),
          email: form.email.trim(),
          telefone: form.telefone.trim() || null,
          disponivel: form.disponivel,
          avaliacao,
          servicos_concluidos: servicosConcluidos,
          especialidades: form.especialidades
        })
      })

      const dados = await resposta.json()

      if (!resposta.ok) {
        setErroTecnico(
          dados.erro ||
          'Não foi possível guardar o técnico.'
        )
        return
      }

      await carregarTecnicos()

      fecharFormularioTecnico()

    } catch (erro) {
      console.error('Erro ao guardar técnico:', erro)

      setErroTecnico(
        'Não foi possível comunicar com o servidor.'
      )

    } finally {
      setAGuardar(false)
    }
  }

  async function eliminarTecnico(tecnico: Tecnico) {
    if (
      !window.confirm(
        `Eliminar o técnico ${tecnico.nome}?`
      )
    ) {
      return
    }

    try {
      const resposta = await fetch(
        `http://localhost:3000/api/tecnicos/${tecnico.id}`,
        {
          method: 'DELETE'
        }
      )

      const dados = await resposta.json()

      if (!resposta.ok) {
        alert(
          dados.erro ||
          'Não foi possível eliminar o técnico.'
        )
        return
      }

      await carregarTecnicos()

    } catch (erro) {
      console.error('Erro ao eliminar técnico:', erro)

      alert(
        'Não foi possível comunicar com o servidor.'
      )
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid #E4E9F0',
    background: '#FAFBFC',
    fontSize: 13,
    color: '#0D1B2A',
    outline: 'none',
    boxSizing: 'border-box' as const
  }

  const labelStyle = {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    color: '#0D1B2A',
    marginBottom: 6
  }

  return (
    <>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 14
        }}
      >
        {role === 'admin' && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end'
            }}
          >
            <button
              onClick={abrirNovoTecnico}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                background: '#1565D8',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600
              }}
            >
              + Adicionar Técnico
            </button>
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 14
          }}
        >
          {tecnicos.map(t => (
            <div
              key={t.id}
              style={{
                background: '#fff',
                borderRadius: 12,
                border: '1px solid #E4E9F0',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: t.disponivel
                      ? '#E6F9F5'
                      : '#F1F5F9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 22,
                    flexShrink: 0
                  }}
                >
                  👷
                </div>

                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontWeight: 700,
                      fontSize: 14,
                      color: '#0D1B2A'
                    }}
                  >
                    {t.nome}
                  </div>

                  <span
                    style={{
                      fontSize: 10,
                      padding: '2px 7px',
                      borderRadius: 20,
                      background: t.disponivel
                        ? '#E6F9F5'
                        : '#F1F5F9',
                      color: t.disponivel
                        ? '#00B893'
                        : '#9AA5B4',
                      fontWeight: 600
                    }}
                  >
                    {t.disponivel
                      ? '● Disponível'
                      : '○ Ocupado'}
                  </span>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 5
                }}
              >
                {t.especialidades.length > 0 ? (
                  t.especialidades.map(esp => (
                    <span
                      key={esp}
                      style={{
                        fontSize: 11,
                        padding: '3px 8px',
                        borderRadius: 6,
                        background: '#EFF6FF',
                        color: '#1565D8',
                        fontWeight: 600
                      }}
                    >
                      {catIcons[esp]} {esp}
                    </span>
                  ))
                ) : (
                  <span
                    style={{
                      fontSize: 11,
                      color: '#9AA5B4'
                    }}
                  >
                    Sem especialidades
                  </span>
                )}
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: 14,
                  borderTop: '1px solid #F1F5F9',
                  paddingTop: 12
                }}
              >
                <div
                  style={{
                    textAlign: 'center',
                    flex: 1
                  }}
                >
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: '#0D1B2A',
                      fontFamily: 'DM Sans, sans-serif'
                    }}
                  >
                    {t.servicosConcluidos}
                  </div>

                  <div
                    style={{
                      fontSize: 10,
                      color: '#9AA5B4'
                    }}
                  >
                    Serviços
                  </div>
                </div>

                <div
                  style={{
                    width: 1,
                    background: '#F1F5F9'
                  }}
                />

                <div
                  style={{
                    textAlign: 'center',
                    flex: 1
                  }}
                >
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: '#0D1B2A'
                    }}
                  >
                    ⭐ {t.avaliacao}
                  </div>

                  <div
                    style={{
                      fontSize: 10,
                      color: '#9AA5B4'
                    }}
                  >
                    Avaliação
                  </div>
                </div>
              </div>

              <div
                style={{
                  fontSize: 11,
                  color: '#6B7A90',
                  lineHeight: 1.7
                }}
              >
                📞 {t.telefone || 'Sem telefone'}
                <br />
                ✉️ {t.email}
              </div>

              {role === 'admin' && (
                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    borderTop: '1px solid #F1F5F9',
                    paddingTop: 12
                  }}
                >
                  <button
                    onClick={() => abrirEditarTecnico(t)}
                    style={{
                      flex: 1,
                      padding: '7px 10px',
                      borderRadius: 7,
                      border: '1px solid #DCE7FF',
                      background: '#EFF6FF',
                      color: '#1565D8',
                      cursor: 'pointer',
                      fontSize: 11,
                      fontWeight: 600
                    }}
                  >
                    Editar
                  </button>

                  <button
                    onClick={() => eliminarTecnico(t)}
                    style={{
                      flex: 1,
                      padding: '7px 10px',
                      borderRadius: 7,
                      border: '1px solid #FECACA',
                      background: '#FEF2F2',
                      color: '#DC2626',
                      cursor: 'pointer',
                      fontSize: 11,
                      fontWeight: 600
                    }}
                  >
                    Eliminar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {showForm && role === 'admin' && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(13,27,42,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: 20
          }}
          onClick={fecharFormularioTecnico}
        >
          <div
            style={{
              width: 480,
              maxHeight: '90vh',
              overflowY: 'auto',
              background: '#fff',
              borderRadius: 16,
              padding: 24
            }}
            onClick={e => e.stopPropagation()}
          >
            <div
              style={{
                fontFamily: 'DM Sans, sans-serif',
                fontWeight: 700,
                fontSize: 20,
                color: '#0D1B2A',
                marginBottom: 16
              }}
            >
              {editingTecnico
                ? 'Editar técnico'
                : 'Adicionar técnico'}
            </div>

            {erroTecnico && (
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: '#FEF2F2',
                  border: '1px solid #FCA5A5',
                  color: '#DC2626',
                  fontSize: 12,
                  marginBottom: 14
                }}
              >
                {erroTecnico}
              </div>
            )}

            <div
              style={{
                display: 'grid',
                gap: 14
              }}
            >
              <div>
                <label style={labelStyle}>
                  Nome
                </label>

                <input
                  value={form.nome}
                  onChange={e =>
                    setForm({
                      ...form,
                      nome: e.target.value
                    })
                  }
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>
                  Email
                </label>

                <input
                  type="email"
                  value={form.email}
                  onChange={e =>
                    setForm({
                      ...form,
                      email: e.target.value
                    })
                  }
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>
                  Telefone
                </label>

                <input
                  value={form.telefone}
                  onChange={e =>
                    setForm({
                      ...form,
                      telefone: e.target.value
                    })
                  }
                  placeholder="Ex.: +351 912 345 678"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>
                  Especialidades
                </label>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: 8
                  }}
                >
                  {categoriasTecnico.map(c => (
                    <label
                      key={c.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '8px 10px',
                        borderRadius: 8,

                        border: `1px solid ${form.especialidades.includes(c.id)
                          ? '#1565D8'
                          : '#E4E9F0'
                          }`,

                        background:
                          form.especialidades.includes(c.id)
                            ? '#EFF6FF'
                            : '#fff',

                        cursor: 'pointer',
                        fontSize: 12,
                        color: '#0D1B2A'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={form.especialidades.includes(c.id)}
                        onChange={() =>
                          alternarEspecialidade(c.id)
                        }
                        style={{
                          accentColor: '#1565D8'
                        }}
                      />

                      {catIcons[c.nome]} {c.nome}
                    </label>
                  ))}
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12
                }}
              >
                <div>
                  <label style={labelStyle}>
                    Avaliação
                  </label>

                  <input
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={form.avaliacao}
                    onChange={e =>
                      setForm({
                        ...form,
                        avaliacao: e.target.value
                      })
                    }
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>
                    Serviços concluídos
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.servicosConcluidos}
                    onChange={e =>
                      setForm({
                        ...form,
                        servicosConcluidos: e.target.value
                      })
                    }
                    style={inputStyle}
                  />
                </div>
              </div>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 9,
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#0D1B2A',
                  cursor: 'pointer'
                }}
              >
                <input
                  type="checkbox"
                  checked={form.disponivel}
                  onChange={e =>
                    setForm({
                      ...form,
                      disponivel: e.target.checked
                    })
                  }
                  style={{
                    accentColor: '#1565D8'
                  }}
                />

                Técnico disponível
              </label>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 10,
                marginTop: 22
              }}
            >
              <button
                onClick={fecharFormularioTecnico}
                disabled={aGuardar}
                style={{
                  padding: '10px 16px',
                  borderRadius: 8,
                  border: '1px solid #E4E9F0',
                  background: '#fff',
                  color: '#6B7A90',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>

              <button
                onClick={guardarTecnico}
                disabled={aGuardar}
                style={{
                  padding: '10px 16px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#1565D8',
                  color: '#fff',
                  cursor: aGuardar
                    ? 'wait'
                    : 'pointer',
                  fontWeight: 600
                }}
              >
                {aGuardar
                  ? 'A guardar...'
                  : editingTecnico
                    ? 'Guardar alterações'
                    : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ── Pagamentos ──

function PagamentosPage({
  role,
  userName,
  pagamentos,
  onPagamentosChange
}: {
  role: Role
  userName: string
  pagamentos: Pagamento[]
  onPagamentosChange: (next: Pagamento[]) => void
}) {
  const pagamentosVisiveis =
    role === 'cliente'
      ? pagamentos.filter(
        p => p.cliente === userName
      )
      : pagamentos

  const total =
    pagamentosVisiveis.reduce(
      (s, p) => s + p.valor,
      0
    )

  const pago =
    pagamentosVisiveis
      .filter(p => p.status === 'pago')
      .reduce(
        (s, p) => s + p.valor,
        0
      )

  const pendente =
    pagamentosVisiveis
      .filter(p => p.status === 'pendente')
      .reduce(
        (s, p) => s + p.valor,
        0
      )

  function handleSetPago(id: string) {
    onPagamentosChange(
      pagamentos.map(p =>
        p.id === id
          ? {
            ...p,
            status: 'pago'
          }
          : p
      )
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 14
        }}
      >
        <StatCard
          label="Total Faturado"
          value={`€${total.toLocaleString('pt-PT')}`}
          icon="💶"
          color="#EFF6FF"
        />

        <StatCard
          label="Recebido"
          value={`€${pago.toLocaleString('pt-PT')}`}
          icon="✅"
          color="#F0FDF4"
          delta={`${pagamentosVisiveis.filter(
            p => p.status === 'pago'
          ).length
            } pagamentos`}
        />

        <StatCard
          label="Pendente"
          value={`€${pendente.toLocaleString('pt-PT')}`}
          icon="⏳"
          color="#FFFBEB"
          delta={`${pagamentosVisiveis.filter(
            p => p.status === 'pendente'
          ).length
            } por receber`}
        />
      </div>

      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          border: '1px solid #E4E9F0',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #E4E9F0',
            fontFamily: 'DM Sans, sans-serif',
            fontWeight: 600,
            fontSize: 14,
            color: '#0D1B2A'
          }}
        >
          Registo de Pagamentos
        </div>

        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse'
          }}
        >
          <thead>
            <tr
              style={{
                background: '#F8FAFB'
              }}
            >
              {[
                'ID',
                'Cliente',
                'Serviço',
                'Valor',
                'Data',
                'Método',
                'Estado',
                role === 'admin'
                  ? 'Ação'
                  : ''
              ]
                .filter(Boolean)
                .map(h => (
                  <th
                    key={String(h)}
                    style={{
                      padding: '10px 16px',
                      textAlign: 'left',
                      fontSize: 10,
                      fontWeight: 600,
                      color: '#9AA5B4',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase'
                    }}
                  >
                    {h}
                  </th>
                ))}
            </tr>
          </thead>

          <tbody>
            {pagamentosVisiveis.map(
              (p, i) => (
                <tr
                  key={p.id}
                  style={{
                    borderTop:
                      i > 0
                        ? '1px solid #F1F5F9'
                        : undefined
                  }}
                >
                  <td
                    style={{
                      padding: '12px 16px',
                      fontSize: 11,
                      fontFamily:
                        'JetBrains Mono, monospace',
                      color: '#6B7A90'
                    }}
                  >
                    {p.id}
                  </td>

                  <td
                    style={{
                      padding: '12px 16px',
                      fontSize: 13,
                      color: '#0D1B2A',
                      fontWeight: 500
                    }}
                  >
                    {p.cliente}
                  </td>

                  <td
                    style={{
                      padding: '12px 16px',
                      fontSize: 12,
                      color: '#6B7A90'
                    }}
                  >
                    {p.servico}
                  </td>

                  <td
                    style={{
                      padding: '12px 16px',
                      fontSize: 14,
                      fontFamily:
                        'JetBrains Mono, monospace',
                      color: '#0D1B2A',
                      fontWeight: 700
                    }}
                  >
                    €{p.valor.toFixed(2)}
                  </td>

                  <td
                    style={{
                      padding: '12px 16px',
                      fontSize: 11,
                      fontFamily:
                        'JetBrains Mono, monospace',
                      color: '#9AA5B4'
                    }}
                  >
                    {p.data}
                  </td>

                  <td
                    style={{
                      padding: '12px 16px',
                      fontSize: 12,
                      color: '#6B7A90'
                    }}
                  >
                    {p.metodo}
                  </td>

                  <td
                    style={{
                      padding: '12px 16px'
                    }}
                  >
                    <Badge
                      label={
                        p.status === 'pago'
                          ? 'Pago'
                          : p.status === 'pendente'
                            ? 'Pendente'
                            : 'Falhado'
                      }
                      cls={
                        statusColors[p.status]
                      }
                    />
                  </td>

                  {role === 'admin' && (
                    <td
                      style={{
                        padding: '12px 16px'
                      }}
                    >
                      {p.status !== 'pago' && (
                        <button
                          onClick={() =>
                            handleSetPago(p.id)
                          }
                          style={{
                            padding: '7px 10px',
                            borderRadius: 8,
                            background: '#1565D8',
                            color: '#fff',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: 11,
                            fontWeight: 600
                          }}
                        >
                          Marcar pago
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Categorias ──

const categoriasSeed = [
  {
    nome: 'Canalização',
    icon: '🔧',
    total: 2,
    desc: 'Tubagens, fugas e instalações hidráulicas'
  },
  {
    nome: 'Eletricidade',
    icon: '⚡',
    total: 2,
    desc: 'Instalações elétricas e quadros'
  },
  {
    nome: 'Carpintaria',
    icon: '🪚',
    total: 1,
    desc: 'Móveis, estruturas e acabamentos em madeira'
  },
  {
    nome: 'Montagem',
    icon: '🛠️',
    total: 1,
    desc: 'Montagem de móveis e equipamentos'
  },
  {
    nome: 'Climatização',
    icon: '❄️',
    total: 1,
    desc: 'Ar condicionado e ventilação'
  },
  {
    nome: 'Refrigeração',
    icon: '🧊',
    total: 1,
    desc: 'Frigoríficos e equipamentos de refrigeração'
  },
  {
    nome: 'Manutenção',
    icon: '🔩',
    total: 0,
    desc: 'Manutenções preventivas e corretivas'
  },
  {
    nome: 'Pequenas Reparações',
    icon: '🧰',
    total: 0,
    desc: 'Ajustes e reparações rápidas'
  }
]

function CategoriasPage({
  role,
  categorias,
  onCategoriasChange
}: {
  role: Role
  categorias: typeof categoriasSeed
  onCategoriasChange: (
    next: typeof categoriasSeed
  ) => void
}) {
  const [showForm, setShowForm] =
    useState(false)

  const [form, setForm] = useState({
    nome: '',
    icon: '🧰',
    desc: ''
  })

  function handleCreate() {
    if (!form.nome.trim()) {
      return
    }

    onCategoriasChange([
      {
        nome: form.nome.trim(),
        icon: form.icon || '🧰',
        total: 0,
        desc:
          form.desc.trim() ||
          'Nova categoria criada.'
      },
      ...categorias
    ])

    setForm({
      nome: '',
      icon: '🧰',
      desc: ''
    })

    setShowForm(false)
  }

  return (
    <>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 14
        }}
      >
        {role === 'admin' && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end'
            }}
          >
            <button
              onClick={() =>
                setShowForm(true)
              }
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                background: '#1565D8',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600
              }}
            >
              + Nova Categoria
            </button>
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 14
          }}
        >
          {categorias.map(c => (
            <div
              key={c.nome}
              style={{
                background: '#fff',
                borderRadius: 12,
                border: '1px solid #E4E9F0',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: '#EFF6FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24
                }}
              >
                {c.icon}
              </div>

              <div>
                <div
                  style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontWeight: 700,
                    fontSize: 15,
                    color: '#0D1B2A'
                  }}
                >
                  {c.nome}
                </div>

                <div
                  style={{
                    fontSize: 12,
                    color: '#6B7A90',
                    marginTop: 4
                  }}
                >
                  {c.desc}
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: 10,
                  borderTop: '1px solid #F1F5F9'
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    color: '#9AA5B4'
                  }}
                >
                  {c.total} pedidos ativos
                </span>

                <button
                  style={{
                    fontSize: 12,
                    padding: '4px 10px',
                    borderRadius: 6,
                    border: '1px solid #E4E9F0',
                    background: '#fff',
                    cursor: 'pointer',
                    color: '#6B7A90'
                  }}
                >
                  Editar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showForm && role === 'admin' && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(13,27,42,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100
          }}
          onClick={() =>
            setShowForm(false)
          }
        >
          <div
            style={{
              width: 420,
              background: '#fff',
              borderRadius: 16,
              padding: 24
            }}
            onClick={e =>
              e.stopPropagation()
            }
          >
            <div
              style={{
                fontFamily: 'DM Sans, sans-serif',
                fontWeight: 700,
                fontSize: 20,
                color: '#0D1B2A',
                marginBottom: 16
              }}
            >
              Nova categoria
            </div>

            <div
              style={{
                display: 'grid',
                gap: 14
              }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#0D1B2A',
                    marginBottom: 6
                  }}
                >
                  Nome
                </label>

                <input
                  value={form.nome}
                  onChange={e =>
                    setForm({
                      ...form,
                      nome: e.target.value
                    })
                  }
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid #E4E9F0',
                    background: '#FAFBFC'
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#0D1B2A',
                    marginBottom: 6
                  }}
                >
                  Ícone
                </label>

                <input
                  value={form.icon}
                  onChange={e =>
                    setForm({
                      ...form,
                      icon: e.target.value
                    })
                  }
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid #E4E9F0',
                    background: '#FAFBFC'
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#0D1B2A',
                    marginBottom: 6
                  }}
                >
                  Descrição
                </label>

                <textarea
                  value={form.desc}
                  onChange={e =>
                    setForm({
                      ...form,
                      desc: e.target.value
                    })
                  }
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid #E4E9F0',
                    background: '#FAFBFC',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 10,
                marginTop: 22
              }}
            >
              <button
                onClick={() =>
                  setShowForm(false)
                }
                style={{
                  padding: '10px 16px',
                  borderRadius: 8,
                  border: '1px solid #E4E9F0',
                  background: '#fff',
                  color: '#6B7A90',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>

              <button
                onClick={handleCreate}
                style={{
                  padding: '10px 16px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#1565D8',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ── Clientes ──

type Cliente = {
  id: number
  nome: string
  email: string
  telefone: string
  pedidos: number
  gasto: number
}

function ClientesPage({
  role
}: {
  role: Role
}) {
  const [clientes, setClientes] =
    useState<Cliente[]>([])

  const [showForm, setShowForm] =
    useState(false)

  const [showDetails, setShowDetails] =
    useState(false)

  const [editingClient, setEditingClient] =
    useState<Cliente | null>(null)

  const [selectedClient, setSelectedClient] =
    useState<Cliente | null>(null)

  const [erroCliente, setErroCliente] =
    useState('')

  const [aGuardar, setAGuardar] =
    useState(false)

  const [aEliminar, setAEliminar] =
    useState<number | null>(null)

  const [form, setForm] = useState({
    nome: '',
    email: '',
    telefone: ''
  })

  // ==========================================
  // CARREGAR CLIENTES DA BASE DE DADOS
  // ==========================================

  async function carregarClientes() {
    try {
      const resposta = await fetch(
        'http://localhost:3000/api/clientes'
      )

      if (!resposta.ok) {
        throw new Error(
          'Erro ao obter clientes'
        )
      }

      const dados =
        await resposta.json()

      const clientesFormatados:
        Cliente[] = dados.map(
          (cliente: any) => ({
            id: Number(cliente.id),
            nome: cliente.nome,
            email: cliente.email,
            telefone:
              cliente.telefone ?? '',
            pedidos: Number(
              cliente.pedidos ?? 0
            ),
            gasto: Number(
              cliente.total_gasto ?? 0
            )
          })
        )

      setClientes(
        clientesFormatados
      )

    } catch (erro) {
      console.error(
        'Erro ao carregar clientes:',
        erro
      )
    }
  }

  useEffect(() => {
    carregarClientes()
  }, [])

  // ==========================================
  // ABRIR FORMULÁRIO PARA ADICIONAR
  // ==========================================

  function openCreateModal() {
    setEditingClient(null)
    setErroCliente('')

    setForm({
      nome: '',
      email: '',
      telefone: ''
    })

    setShowForm(true)
  }

  // ==========================================
  // ABRIR FORMULÁRIO PARA EDITAR
  // ==========================================

  function openEditModal(
    cliente: Cliente
  ) {
    setEditingClient(cliente)
    setErroCliente('')

    setForm({
      nome: cliente.nome,
      email: cliente.email,
      telefone: cliente.telefone
    })

    setShowForm(true)
  }

  // ==========================================
  // FECHAR FORMULÁRIO
  // ==========================================

  function fecharFormulario() {
    setShowForm(false)
    setEditingClient(null)
    setErroCliente('')

    setForm({
      nome: '',
      email: '',
      telefone: ''
    })
  }

  // ==========================================
  // ADICIONAR / EDITAR CLIENTE
  // ==========================================

  async function handleSubmit() {
    setErroCliente('')

    const nome =
      form.nome.trim()

    const email =
      form.email.trim()

    const telefone =
      form.telefone.trim()

    if (!nome) {
      setErroCliente(
        'O nome do cliente é obrigatório.'
      )
      return
    }

    if (!email) {
      setErroCliente(
        'O email do cliente é obrigatório.'
      )
      return
    }

    if (!telefone) {
      setErroCliente(
        'O telefone do cliente é obrigatório.'
      )
      return
    }

    if (!email.includes('@')) {
      setErroCliente(
        'Introduz um email válido.'
      )
      return
    }

    setAGuardar(true)

    try {
      const url =
        editingClient
          ? `http://localhost:3000/api/clientes/${editingClient.id}`
          : 'http://localhost:3000/api/clientes'

      const resposta =
        await fetch(url, {
          method:
            editingClient
              ? 'PUT'
              : 'POST',

          headers: {
            'Content-Type':
              'application/json'
          },

          body: JSON.stringify({
            nome,
            email,
            telefone
          })
        })

      const dados =
        await resposta.json()

      if (!resposta.ok) {
        setErroCliente(
          dados.erro ||
          (
            editingClient
              ? 'Não foi possível editar o cliente.'
              : 'Não foi possível adicionar o cliente.'
          )
        )

        return
      }

      await carregarClientes()

      fecharFormulario()

    } catch (erro) {
      console.error(
        'Erro ao guardar cliente:',
        erro
      )

      setErroCliente(
        'Não foi possível comunicar com o servidor.'
      )

    } finally {
      setAGuardar(false)
    }
  }

  // ==========================================
  // ELIMINAR CLIENTE
  // ==========================================

  async function eliminarCliente(
    cliente: Cliente
  ) {
    const confirmar =
      window.confirm(
        `Tens a certeza de que queres eliminar o cliente "${cliente.nome}"?`
      )

    if (!confirmar) {
      return
    }

    setAEliminar(
      cliente.id
    )

    try {
      const resposta =
        await fetch(
          `http://localhost:3000/api/clientes/${cliente.id}`,
          {
            method: 'DELETE'
          }
        )

      let dados: any = {}

      try {
        dados =
          await resposta.json()
      } catch {
        dados = {}
      }

      if (!resposta.ok) {
        window.alert(
          dados.erro ||
          'Não foi possível eliminar o cliente.'
        )

        return
      }

      if (
        selectedClient?.id ===
        cliente.id
      ) {
        setSelectedClient(null)
        setShowDetails(false)
      }

      await carregarClientes()

    } catch (erro) {
      console.error(
        'Erro ao eliminar cliente:',
        erro
      )

      window.alert(
        'Não foi possível comunicar com o servidor.'
      )

    } finally {
      setAEliminar(null)
    }
  }

  return (
    <>
      {/* ==========================================
          TABELA DE CLIENTES
      ========================================== */}

      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          border: '1px solid #E4E9F0',
          overflow: 'hidden'
        }}
      >
        {/* CABEÇALHO */}

        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #E4E9F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div
            style={{
              fontFamily: 'DM Sans, sans-serif',
              fontWeight: 600,
              fontSize: 14,
              color: '#0D1B2A'
            }}
          >
            Clientes Registados
          </div>

          {role === 'admin' && (
            <button
              onClick={openCreateModal}
              style={{
                padding: '7px 14px',
                borderRadius: 8,
                background: '#1565D8',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600
              }}
            >
              + Adicionar
            </button>
          )}
        </div>

        {/* TABELA */}

        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse'
          }}
        >
          <thead>
            <tr
              style={{
                background: '#F8FAFB'
              }}
            >
              {[
                'Nome',
                'Email',
                'Telefone',
                'Pedidos',
                'Total Gasto',
                'Ações'
              ].map(h => (
                <th
                  key={h}
                  style={{
                    padding: '10px 16px',
                    textAlign: 'left',
                    fontSize: 10,
                    fontWeight: 600,
                    color: '#9AA5B4',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase'
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {clientes.map((cliente, i) => (
              <tr
                key={cliente.id}
                style={{
                  borderTop:
                    i > 0
                      ? '1px solid #F1F5F9'
                      : undefined
                }}
              >
                {/* NOME */}

                <td
                  style={{
                    padding: '12px 16px',
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#0D1B2A'
                  }}
                >
                  {cliente.nome}
                </td>

                {/* EMAIL */}

                <td
                  style={{
                    padding: '12px 16px',
                    fontSize: 12,
                    color: '#6B7A90'
                  }}
                >
                  {cliente.email}
                </td>

                {/* TELEFONE */}

                <td
                  style={{
                    padding: '12px 16px',
                    fontSize: 12,
                    color: '#6B7A90'
                  }}
                >
                  {cliente.telefone || '—'}
                </td>

                {/* PEDIDOS */}

                <td
                  style={{
                    padding: '12px 16px',
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#0D1B2A',
                    textAlign: 'center'
                  }}
                >
                  {cliente.pedidos}
                </td>

                {/* TOTAL GASTO */}

                <td
                  style={{
                    padding: '12px 16px',
                    fontSize: 13,
                    fontWeight: 700,
                    fontFamily: 'JetBrains Mono, monospace',
                    color:
                      cliente.gasto > 0
                        ? '#0D1B2A'
                        : '#9AA5B4'
                  }}
                >
                  €{cliente.gasto.toFixed(2)}
                </td>

                {/* AÇÕES */}

                <td style={{ padding: '12px 16px' }}>
                  <div
                    style={{
                      display: 'flex',
                      gap: 5
                    }}
                  >
                    <button
                      onClick={() => {
                        setSelectedClient(cliente)
                        setShowDetails(true)
                      }}
                      style={{
                        fontSize: 11,
                        padding: '4px 9px',
                        borderRadius: 6,
                        border: '1px solid #E4E9F0',
                        background: '#fff',
                        cursor: 'pointer',
                        color: '#6B7A90'
                      }}
                    >
                      Ver
                    </button>

                    {role === 'admin' && (
                      <>
                        <button
                          onClick={() => openEditModal(cliente)}
                          disabled={aEliminar === cliente.id}
                          style={{
                            fontSize: 11,
                            padding: '4px 9px',
                            borderRadius: 6,
                            border: '1px solid #E4E9F0',
                            background: '#fff',
                            cursor:
                              aEliminar === cliente.id
                                ? 'not-allowed'
                                : 'pointer',
                            color: '#6B7A90',
                            opacity:
                              aEliminar === cliente.id
                                ? 0.6
                                : 1
                          }}
                        >
                          Editar
                        </button>

                        <button
                          onClick={() => eliminarCliente(cliente)}
                          disabled={aEliminar !== null}
                          style={{
                            fontSize: 11,
                            padding: '4px 9px',
                            borderRadius: 6,
                            border: '1px solid #FECACA',
                            background: '#FEF2F2',
                            cursor:
                              aEliminar !== null
                                ? 'not-allowed'
                                : 'pointer',
                            color: '#DC2626',
                            fontWeight: 600,
                            opacity:
                              aEliminar !== null &&
                                aEliminar !== cliente.id
                                ? 0.6
                                : 1
                          }}
                        >
                          {aEliminar === cliente.id
                            ? 'A eliminar...'
                            : 'Eliminar'}
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}

            {clientes.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    padding: 30,
                    textAlign: 'center',
                    color: '#9AA5B4',
                    fontSize: 13
                  }}
                >
                  Nenhum cliente encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ==========================================
          MODAL ADICIONAR / EDITAR
      ========================================== */}

      {showForm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(13,27,42,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100
          }}
          onClick={fecharFormulario}
        >
          <div
            style={{
              width: 460,
              background: '#fff',
              borderRadius: 16,
              padding: 24,
              boxShadow: '0 16px 50px rgba(13,27,42,0.24)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div
              style={{
                fontFamily: 'DM Sans, sans-serif',
                fontWeight: 700,
                fontSize: 20,
                color: '#0D1B2A',
                marginBottom: 18
              }}
            >
              {editingClient
                ? 'Editar cliente'
                : 'Adicionar cliente'}
            </div>

            {/* ERRO */}

            {erroCliente && (
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: '#FEF2F2',
                  border: '1px solid #FCA5A5',
                  color: '#DC2626',
                  fontSize: 12,
                  marginBottom: 14
                }}
              >
                {erroCliente}
              </div>
            )}

            <div
              style={{
                display: 'grid',
                gap: 14
              }}
            >
              {/* NOME */}

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#0D1B2A',
                    marginBottom: 6
                  }}
                >
                  Nome
                </label>

                <input
                  value={form.nome}
                  onChange={e =>
                    setForm({
                      ...form,
                      nome: e.target.value
                    })
                  }
                  placeholder="Nome do cliente"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid #E4E9F0',
                    background: '#FAFBFC',
                    fontSize: 13,
                    color: '#0D1B2A',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* EMAIL */}

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#0D1B2A',
                    marginBottom: 6
                  }}
                >
                  Email
                </label>

                <input
                  type="email"
                  value={form.email}
                  onChange={e =>
                    setForm({
                      ...form,
                      email: e.target.value
                    })
                  }
                  placeholder="cliente@email.com"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid #E4E9F0',
                    background: '#FAFBFC',
                    fontSize: 13,
                    color: '#0D1B2A',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* TELEFONE */}

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#0D1B2A',
                    marginBottom: 6
                  }}
                >
                  Telefone
                </label>

                <input
                  type="tel"
                  value={form.telefone}
                  onChange={e =>
                    setForm({
                      ...form,
                      telefone: e.target.value
                    })
                  }
                  placeholder="+351 912 345 678"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid #E4E9F0',
                    background: '#FAFBFC',
                    fontSize: 13,
                    color: '#0D1B2A',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: '#F8FAFC',
                  color: '#64748B',
                  fontSize: 11,
                  lineHeight: 1.5
                }}
              >
                Pedidos e total gasto são calculados automaticamente
                através dos dados registados na base de dados.
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 10,
                marginTop: 22
              }}
            >
              <button
                onClick={fecharFormulario}
                disabled={aGuardar}
                style={{
                  padding: '10px 16px',
                  borderRadius: 8,
                  border: '1px solid #E4E9F0',
                  background: '#fff',
                  color: '#6B7A90',
                  cursor: aGuardar
                    ? 'not-allowed'
                    : 'pointer',
                  fontSize: 13
                }}
              >
                Cancelar
              </button>

              <button
                onClick={handleSubmit}
                disabled={aGuardar}
                style={{
                  padding: '10px 16px',
                  borderRadius: 8,
                  border: 'none',
                  background: aGuardar
                    ? '#9AA5B4'
                    : '#1565D8',
                  color: '#fff',
                  cursor: aGuardar
                    ? 'not-allowed'
                    : 'pointer',
                  fontSize: 13,
                  fontWeight: 600
                }}
              >
                {aGuardar
                  ? 'A guardar...'
                  : editingClient
                    ? 'Guardar alterações'
                    : 'Adicionar cliente'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL VER CLIENTE
      ========================================== */}

      {showDetails && selectedClient && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(13,27,42,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100
          }}
          onClick={() => setShowDetails(false)}
        >
          <div
            style={{
              width: 420,
              background: '#fff',
              borderRadius: 16,
              padding: 24,
              boxShadow: '0 16px 50px rgba(13,27,42,0.24)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 20
              }}
            >
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: '50%',
                  background: '#EFF6FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22
                }}
              >
                👤
              </div>

              <div>
                <div
                  style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontWeight: 700,
                    fontSize: 18,
                    color: '#0D1B2A'
                  }}
                >
                  {selectedClient.nome}
                </div>

                <div
                  style={{
                    fontSize: 12,
                    color: '#6B7A90'
                  }}
                >
                  Cliente #{selectedClient.id}
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gap: 12,
                fontSize: 13,
                color: '#0D1B2A'
              }}
            >
              <div>
                <strong>Email:</strong>{' '}
                {selectedClient.email}
              </div>

              <div>
                <strong>Telefone:</strong>{' '}
                {selectedClient.telefone || '—'}
              </div>

              <div>
                <strong>Pedidos:</strong>{' '}
                {selectedClient.pedidos}
              </div>

              <div>
                <strong>Total gasto:</strong>{' '}
                €{selectedClient.gasto.toFixed(2)}
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginTop: 22
              }}
            >
              <button
                onClick={() => setShowDetails(false)}
                style={{
                  padding: '10px 16px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#1565D8',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600
                }}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}


// ─── Page config ──────────────────────────────────────────────────────────────

const pageTitles: Record<Page, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Visão geral da plataforma' },
  pedidos: { title: 'Pedidos de Serviço', subtitle: 'Gestão de todos os pedidos' },
  orcamentos: { title: 'Orçamentos', subtitle: 'Criação e gestão de orçamentos' },
  agendamentos: { title: 'Agendamentos', subtitle: 'Calendário e marcações' },
  tecnicos: { title: 'Técnicos', subtitle: 'Equipa e disponibilidade' },
  clientes: { title: 'Clientes', subtitle: 'Base de clientes registados' },
  pagamentos: { title: 'Pagamentos', subtitle: 'Registo financeiro' },
  categorias: { title: 'Categorias', subtitle: 'Especialidades e tipos de serviço' },
}

// ─── Root App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState<Screen>('landing')
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [page, setPage] = useState<Page>('dashboard')

  const [users, setUsers] = useState<UserAccount[]>(() =>
    readStored(storageKeys.users, [
      {
        nome: 'Diana Sousa',
        email: 'admin@resolva.pt',
        password: 'admin123',
        role: 'admin'
      },
      {
        nome: 'Carlos Mendes',
        email: 'tecnico@resolva.pt',
        password: 'tecnico123',
        role: 'tecnico'
      },
      {
        nome: 'Ana Ferreira',
        email: 'ana@resolva.pt',
        password: 'cliente123',
        role: 'cliente'
      },
    ])
  )

  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([])

  const [categorias, setCategorias] =
    useState<typeof categoriasSeed>(() =>
      readStored(
        storageKeys.categorias,
        categoriasSeed
      )
    )

  const [tecnicos, setTecnicos] =
    useState<Tecnico[]>([])

  const [agendamentos, setAgendamentos] =
    useState<Agendamento[]>([])

  const [pagamentos, setPagamentos] =
    useState<Pagamento[]>(() =>
      readStored(
        storageKeys.pagamentos,
        pagamentosData
      )
    )

  const [
    tecnicoDisponibilidade,
    setTecnicoDisponibilidade
  ] = useState<string[]>(() =>
    readStored(
      storageKeys.tecnicoDisponibilidade,
      []
    )
  )

  useEffect(() => {
    fetch('http://localhost:3000/api/pedidos')
      .then(resposta => resposta.json())
      .then(dados => {
        setPedidos(dados)
      })
      .catch(erro => {
        console.error(
          'Erro ao carregar pedidos:',
          erro
        )
      })
  }, [])

  useEffect(() => {
    fetch('http://localhost:3000/api/orcamentos')
      .then(resposta => resposta.json())
      .then(dados => {
        setOrcamentos(
          dados.map((o: any) => ({
            ...o,

            pedido_id: String(
              o.pedido_id ??
              o.pedidoId ??
              ''
            ),

            pedidoId: String(
              o.pedido_id ??
              o.pedidoId ??
              ''
            ),

            valor:
              Number(o.valor) || 0,

            validade:
              o.validade
                ? String(o.validade).split('T')[0]
                : '',

            servico:
              o.servico ?? 'Serviço',

            itens: Array.isArray(o.itens)
              ? o.itens.map(
                (i: any) => ({
                  ...i,
                  valor:
                    Number(i.valor) || 0
                })
              )
              : []
          }))
        )
      })
      .catch(erro => {
        console.error(
          'Erro ao carregar orçamentos:',
          erro
        )
      })
  }, [])

  useEffect(() => {
    fetch('http://localhost:3000/api/agendamentos')
      .then(resposta => resposta.json())
      .then(dados => {
        setAgendamentos(dados)
      })
      .catch(erro => {
        console.error(
          'Erro ao carregar agendamentos:',
          erro
        )
      })
  }, [])

  useEffect(() => {
    fetch('http://localhost:3000/api/tecnicos')
      .then(resposta => {
        if (!resposta.ok) {
          throw new Error(
            'Erro ao carregar técnicos'
          )
        }

        return resposta.json()
      })
      .then(dados => {
        const tecnicosFormatados:
          Tecnico[] = dados.map(
            (t: any) => ({
              id: Number(t.id),
              nome: t.nome ?? '',
              email: t.email ?? '',
              telefone: t.telefone ?? '',
              disponivel:
                Boolean(t.disponivel),
              avaliacao:
                Number(t.avaliacao) || 0,
              servicosConcluidos:
                Number(
                  t.servicos_concluidos
                ) || 0,
              especialidades:
                Array.isArray(
                  t.especialidades
                )
                  ? t.especialidades
                  : []
            })
          )

        setTecnicos(
          tecnicosFormatados
        )
      })
      .catch(erro => {
        console.error(
          'Erro ao carregar técnicos:',
          erro
        )
      })
  }, [])

  useEffect(() => {
    writeStored(
      storageKeys.users,
      users
    )
  }, [users])

  useEffect(() => {
    writeStored(
      storageKeys.pedidos,
      pedidos
    )
  }, [pedidos])

  useEffect(() => {
    writeStored(
      storageKeys.orcamentos,
      orcamentos
    )
  }, [orcamentos])

  useEffect(() => {
    writeStored(
      storageKeys.categorias,
      categorias
    )
  }, [categorias])

  useEffect(() => {
    writeStored(
      storageKeys.tecnicos,
      tecnicos
    )
  }, [tecnicos])

  useEffect(() => {
    writeStored(
      storageKeys.agendamentos,
      agendamentos
    )
  }, [agendamentos])

  useEffect(() => {
    writeStored(
      storageKeys.pagamentos,
      pagamentos
    )
  }, [pagamentos])

  useEffect(() => {
    writeStored(
      storageKeys.tecnicoDisponibilidade,
      tecnicoDisponibilidade
    )
  }, [tecnicoDisponibilidade])

  function handleAuthSuccess(
    user: AuthUser
  ) {
    setAuthUser(user)
    setScreen('app')
    setPage('dashboard')
  }

  function handleLogout() {
    setAuthUser(null)
    setScreen('landing')
  }

  if (screen === 'landing') {
    return (
      <LandingPage
        onLogin={() =>
          setScreen('login')
        }
        onRegister={() =>
          setScreen('register')
        }
      />
    )
  }

  if (screen === 'login') {
    return (
      <LoginPage
        users={users}
        onSuccess={handleAuthSuccess}
        onRegister={() =>
          setScreen('register')
        }
        onForgot={() =>
          setScreen('forgot')
        }
        onBack={() =>
          setScreen('landing')
        }
      />
    )
  }

  if (screen === 'register') {
    return (
      <RegisterPage
        users={users}
        onSuccess={(
          user,
          password = '123456'
        ) => {
          setUsers(prev => [
            {
              nome: user.nome,
              email: user.email,
              password,
              role: user.role
            },
            ...prev
          ])

          handleAuthSuccess(user)
        }}
        onLogin={() =>
          setScreen('login')
        }
        onBack={() =>
          setScreen('landing')
        }
      />
    )
  }

  if (screen === 'forgot') {
    return (
      <ForgotPage
        onBack={() =>
          setScreen('landing')
        }
        onLogin={() =>
          setScreen('login')
        }
      />
    )
  }

  const user = authUser!
  const { title, subtitle } =
    pageTitles[page]

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        background: '#F4F6FA'
      }}
    >
      <Sidebar
        page={page}
        setPage={setPage}
        role={user.role}
        user={user}
        onLogout={handleLogout}
      />

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        <Topbar
          title={title}
          subtitle={subtitle}
        />

        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px 28px'
          }}
        >
          {page === 'dashboard' && (
            <DashboardPage
              role={user.role}
              pedidos={pedidos}
              userName={user.nome}
              tecnicos={tecnicos}
              agendamentos={agendamentos}
              pagamentos={pagamentos}
            />
          )}

          {page === 'pedidos' && (
            <PedidosPage
              role={user.role}
              pedidos={pedidos}
              onPedidosChange={setPedidos}
              userName={user.nome}
              agendamentos={agendamentos}
              onAgendamentosChange={
                setAgendamentos
              }
            />
          )}

          {page === 'orcamentos' && (
            <OrcamentosPage
              role={user.role}
              userName={user.nome}
              orcamentos={orcamentos}
              onOrcamentosChange={
                setOrcamentos
              }
              pedidos={pedidos}
              onPedidosChange={
                setPedidos
              }
              pagamentos={pagamentos}
              onPagamentosChange={
                setPagamentos
              }
            />
          )}

          {page === 'agendamentos' && (
            <AgendamentosPage
              role={user.role}
              agendamentos={agendamentos}
              onAgendamentosChange={
                setAgendamentos
              }
              disponibilidade={
                tecnicoDisponibilidade
              }
              onDisponibilidadeChange={
                setTecnicoDisponibilidade
              }
              userName={user.nome}
            />
          )}

          {page === 'tecnicos' && (
            <TecnicosPage
              role={user.role}
              tecnicos={tecnicos}
              onTecnicosChange={
                setTecnicos
              }
            />
          )}

          {page === 'clientes' && (
            <ClientesPage
              role={user.role}
            />
          )}

          {page === 'pagamentos' && (
            <PagamentosPage
              role={user.role}
              userName={user.nome}
              pagamentos={pagamentos}
              onPagamentosChange={
                setPagamentos
              }
            />
          )}

          {page === 'categorias' && (
            <CategoriasPage
              role={user.role}
              categorias={categorias}
              onCategoriasChange={
                setCategorias
              }
            />
          )}
        </main>
      </div>
    </div>
  )
}

