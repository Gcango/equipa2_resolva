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
  fotos?: string[]
  historico?: PedidoHistoricoItem[]
}

interface Orcamento {
  id: string; pedidoId: string; cliente: string; servico: string
  valor: number; validade: string; status: 'pendente' | 'aceite' | 'rejeitado'
  itens: { descricao: string; valor: number }[]
}

interface Agendamento {
  id: string; pedidoId: string; cliente: string; tecnico: string
  servico: string; data: string; hora: string; duracao: string
  status: 'confirmado' | 'em_curso' | 'concluido' | 'cancelado'
}

interface Tecnico {
  id: number; nome: string; especialidades: string[]; disponivel: boolean
  avaliacao: number; servicosConcluidos: number; telefone: string; email: string
}

interface Pagamento {
  id: string; cliente: string; servico: string; valor: number
  data: string; metodo: string; status: 'pendente' | 'pago' | 'falhado'
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const pedidosData: Pedido[] = [
  { id: 'P-2401', cliente: 'Ana Ferreira', categoria: 'Canalização', descricao: 'Fuga de água na cozinha perto do lavatório', morada: 'Rua das Flores 12', cidade: 'Lisboa', data: '2026-09-15', status: 'agendado', prioridade: 'alta', tecnico: 'Carlos Mendes', fotos: [], historico: [{ id: 'h1', tipo: 'cliente', texto: 'Pedido enviado com foto do problema.', data: '2026-09-15T09:00:00' }, { id: 'h2', tipo: 'admin', texto: 'Pedido validado e agendado com Carlos Mendes.', data: '2026-09-15T11:30:00' }] },
  { id: 'P-2402', cliente: 'João Rodrigues', categoria: 'Eletricidade', descricao: 'Tomadas sem corrente no quarto principal', morada: 'Av. da Liberdade 45', cidade: 'Lisboa', data: '2026-09-16', status: 'orcamento_enviado', prioridade: 'media', tecnico: 'Rui Santos', fotos: [], historico: [{ id: 'h3', tipo: 'cliente', texto: 'Solicitação registada com descrição detalhada.', data: '2026-09-16T08:00:00' }] },
  { id: 'P-2403', cliente: 'Marta Costa', categoria: 'Climatização', descricao: 'Instalação e ajuste de sistema de climatização', morada: 'Rua do Ouro 78', cidade: 'Porto', data: '2026-09-17', status: 'em_analise', prioridade: 'baixa', fotos: [], historico: [{ id: 'h4', tipo: 'admin', texto: 'Pedido em análise para confirmação de orçamento.', data: '2026-09-17T10:00:00' }] },
  { id: 'P-2404', cliente: 'Pedro Alves', categoria: 'Refrigeração', descricao: 'Frigorífico não arrefece corretamente', morada: 'Rua Augusta 23', cidade: 'Lisboa', data: '2026-09-17', status: 'pendente', prioridade: 'alta', fotos: [], historico: [{ id: 'h5', tipo: 'cliente', texto: 'Pedido novo recebido pelo cliente.', data: '2026-09-17T09:15:00' }] },
  { id: 'P-2405', cliente: 'Sofia Lima', categoria: 'Eletricidade', descricao: 'Instalação de quadro elétrico novo', morada: 'Rua de Santa Catarina 56', cidade: 'Porto', data: '2026-09-18', status: 'concluido', prioridade: 'media', tecnico: 'Carlos Mendes', fotos: [], historico: [{ id: 'h6', tipo: 'tecnico', texto: 'Serviço concluído com inspeção final.', data: '2026-09-18T16:00:00' }] },
  { id: 'P-2406', cliente: 'Rui Monteiro', categoria: 'Canalização', descricao: 'Entupimento no wc', morada: 'Travessa da Paz 9', cidade: 'Braga', data: '2026-09-18', status: 'em_curso', prioridade: 'alta', tecnico: 'Tiago Pires', fotos: [], historico: [{ id: 'h7', tipo: 'tecnico', texto: 'Técnico apontado e trabalho em curso.', data: '2026-09-18T13:45:00' }] },
]

const orcamentosData: Orcamento[] = [
  { id: 'ORC-001', pedidoId: 'P-2402', cliente: 'João Rodrigues', servico: 'Reparação Elétrica', valor: 185, validade: '2026-09-25', status: 'pendente', itens: [{ descricao: 'Mão de obra (2h)', valor: 120 }, { descricao: 'Material (tomadas + cabo)', valor: 65 }] },
  { id: 'ORC-002', pedidoId: 'P-2403', cliente: 'Marta Costa', servico: 'Pintura Interior', valor: 1240, validade: '2026-09-28', status: 'aceite', itens: [{ descricao: 'Mão de obra (4 dias)', valor: 800 }, { descricao: 'Tinta e materiais', valor: 440 }] },
  { id: 'ORC-003', pedidoId: 'P-2401', cliente: 'Ana Ferreira', servico: 'Canalização', valor: 320, validade: '2026-09-22', status: 'aceite', itens: [{ descricao: 'Mão de obra (3h)', valor: 180 }, { descricao: 'Peças e material', valor: 140 }] },
]

const agendamentosData: Agendamento[] = [
  { id: 'AG-001', pedidoId: 'P-2401', cliente: 'Ana Ferreira', tecnico: 'Carlos Mendes', servico: 'Reparação de canalização', data: '2026-09-20', hora: '09:00', duracao: '3h', status: 'confirmado' },
  { id: 'AG-002', pedidoId: 'P-2406', cliente: 'Rui Monteiro', tecnico: 'Tiago Pires', servico: 'Desentupimento WC', data: '2026-09-18', hora: '14:30', duracao: '2h', status: 'em_curso' },
  { id: 'AG-003', pedidoId: 'P-2405', cliente: 'Sofia Lima', tecnico: 'Carlos Mendes', servico: 'Instalação quadro elétrico', data: '2026-09-16', hora: '08:00', duracao: '4h', status: 'concluido' },
  { id: 'AG-004', pedidoId: 'P-2402', cliente: 'João Rodrigues', tecnico: 'Rui Santos', servico: 'Reparação elétrica', data: '2026-09-22', hora: '10:00', duracao: '2h', status: 'confirmado' },
]

const tecnicosData: Tecnico[] = [
  { id: 1, nome: 'Carlos Mendes', especialidades: ['Eletricidade', 'AVAC'], disponivel: true, avaliacao: 4.9, servicosConcluidos: 142, telefone: '+351 912 345 678', email: 'carlos@resolva.pt' },
  { id: 2, nome: 'Rui Santos', especialidades: ['Eletricidade'], disponivel: true, avaliacao: 4.7, servicosConcluidos: 98, telefone: '+351 913 456 789', email: 'rui@resolva.pt' },
  { id: 3, nome: 'Tiago Pires', especialidades: ['Canalização'], disponivel: false, avaliacao: 4.8, servicosConcluidos: 215, telefone: '+351 914 567 890', email: 'tiago@resolva.pt' },
  { id: 4, nome: 'Luís Oliveira', especialidades: ['Carpintaria', 'Montagem'], disponivel: true, avaliacao: 4.6, servicosConcluidos: 67, telefone: '+351 915 678 901', email: 'luis@resolva.pt' },
  { id: 5, nome: 'Filipe Sousa', especialidades: ['Climatização', 'Canalização'], disponivel: true, avaliacao: 4.5, servicosConcluidos: 83, telefone: '+351 916 789 012', email: 'filipe@resolva.pt' },
]

const pagamentosData: Pagamento[] = [
  { id: 'PAG-001', cliente: 'Marta Costa', servico: 'Pintura Interior', valor: 1240, data: '2026-09-17', metodo: 'Transferência', status: 'pago' },
  { id: 'PAG-002', cliente: 'Ana Ferreira', servico: 'Canalização', valor: 320, data: '2026-09-20', metodo: 'Multibanco', status: 'pendente' },
  { id: 'PAG-003', cliente: 'Sofia Lima', servico: 'Quadro elétrico', valor: 580, data: '2026-09-16', metodo: 'MB Way', status: 'pago' },
  { id: 'PAG-004', cliente: 'João Rodrigues', servico: 'Reparação elétrica', valor: 185, data: '2026-09-22', metodo: 'Multibanco', status: 'pendente' },
  { id: 'PAG-005', cliente: 'Rui Monteiro', servico: 'Desentupimento WC', valor: 95, data: '2026-09-18', metodo: 'MB Way', status: 'pago' },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

const statusLabels: Record<Status, string> = {
  pendente: 'Pendente', em_analise: 'Em Análise', orcamento_enviado: 'Orçamento Enviado',
  aceite: 'Aceite', agendado: 'Agendado', em_curso: 'Em Curso', concluido: 'Concluído', cancelado: 'Cancelado',
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
  Eletricidade: '⚡', Canalização: '🔧', Carpintaria: '🪚', Montagem: '🛠️', Climatização: '❄️', Refrigeração: '🧊', Manutenção: '🔩', 'Pequenas Reparações': '🧰',
}

function Badge({ label, cls }: { label: string; cls: string }) {
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>{label}</span>
}

// ─── ══════════════════════════════════════════════════════════════════════ ───
// ─── LANDING PAGE ────────────────────────────────────────────────────────────
// ─── ══════════════════════════════════════════════════════════════════════ ───

function LandingPage({ onLogin, onRegister }: { onLogin: () => void; onRegister: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)

  const features = [
    { icon: '📋', title: 'Gestão de Pedidos', desc: 'Crie e acompanhe pedidos de serviço em tempo real com histórico completo.' },
    { icon: '💰', title: 'Orçamentos Digitais', desc: 'Envie, aceite e rejeite orçamentos de forma rápida e segura.' },
    { icon: '📅', title: 'Agendamento Inteligente', desc: 'Marque serviços sem conflitos e gira a disponibilidade dos técnicos.' },
    { icon: '👷', title: 'Equipa de Técnicos', desc: 'Atribua técnicos por especialidade e monitorize o desempenho.' },
    { icon: '📸', title: 'Registo Fotográfico', desc: 'Os clientes enviam fotos do problema para diagnóstico mais preciso.' },
    { icon: '💳', title: 'Controlo de Pagamentos', desc: 'Registe e acompanhe pagamentos pendentes e confirmados.' },
  ]

  const stats = [
    { value: '2 400+', label: 'Serviços concluídos' },
    { value: '98%', label: 'Satisfação do cliente' },
    { value: '150+', label: 'Técnicos certificados' },
    { value: '48h', label: 'Tempo médio de resposta' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#0D1B2A', fontFamily: 'Inter, sans-serif' }}>
      {/* Navbar */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: 'rgba(13,27,42,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 48px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <BrandLogo size={30} compact />
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: 18, color: '#fff', letterSpacing: '0.12em' }}>RESOLVA</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={onLogin} style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'rgba(255,255,255,0.85)', cursor: 'pointer', fontSize: 14, fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>Entrar</button>
          <button onClick={onRegister} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#1565D8', color: '#fff', cursor: 'pointer', fontSize: 14, fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>Criar Conta</button>
        </div>
      </nav>

      {/* Hero — Video */}
      <section style={{ position: 'relative', height: '100vh', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <video
          ref={videoRef}
          src={heroVideo}
          autoPlay
          muted
          loop
          playsInline
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.45 }}
        />
        {/* Gradient overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(13,27,42,0.3) 0%, rgba(13,27,42,0.2) 50%, rgba(13,27,42,0.95) 100%)' }} />

        {/* Hero content */}
        <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', maxWidth: 760, padding: '0 24px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 20, background: 'rgba(21,101,216,0.25)', border: '1px solid rgba(21,101,216,0.4)', marginBottom: 28 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#1565D8', display: 'inline-block' }} />
            <span style={{ fontSize: 12, color: '#93B4E0', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Plataforma de Gestão Técnica</span>
          </div>
          <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 'clamp(36px, 6vw, 68px)', fontWeight: 700, color: '#fff', lineHeight: 1.1, letterSpacing: '-1.5px', margin: '0 0 24px' }}>
            Serviços técnicos,<br /><span style={{ color: '#1565D8' }}>geridos com precisão.</span>
          </h1>
          <p style={{ fontSize: 'clamp(15px, 2vw, 18px)', color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, marginBottom: 36, maxWidth: 560, margin: '0 auto 36px' }}>
            Da solicitação ao pagamento — uma plataforma completa para clientes, técnicos e administradores.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={onRegister} style={{ padding: '14px 32px', borderRadius: 10, border: 'none', background: '#1565D8', color: '#fff', cursor: 'pointer', fontSize: 15, fontFamily: 'Inter, sans-serif', fontWeight: 600, boxShadow: '0 8px 32px rgba(21,101,216,0.4)' }}>
              Começar Gratuitamente →
            </button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, zIndex: 10 }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Explorar</span>
          <div style={{ width: 1, height: 32, background: 'linear-gradient(to bottom, rgba(255,255,255,0.3), transparent)' }} />
        </div>
      </section>

      {/* Stats bar */}
      <section style={{ background: '#0A1520', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '32px 48px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
          {stats.map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 32, fontWeight: 700, color: '#fff', letterSpacing: '-1px' }}>{s.value}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4, fontFamily: 'Inter, sans-serif' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '96px 48px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{ fontSize: 12, color: '#1565D8', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Funcionalidades</div>
          <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 700, color: '#fff', letterSpacing: '-0.8px', margin: '0 0 16px' }}>Tudo o que precisa, num só lugar</h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.45)', maxWidth: 480, margin: '0 auto', lineHeight: 1.7 }}>Gestão completa do ciclo de vida de serviços técnicos, do pedido ao pagamento.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {features.map(f => (
            <div key={f.title} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.07)', padding: '28px 24px', transition: 'all 0.2s', cursor: 'default' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(21,101,216,0.08)'; e.currentTarget.style.borderColor = 'rgba(21,101,216,0.3)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)' }}>
              <div style={{ fontSize: 28, marginBottom: 14 }}>{f.icon}</div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: 16, color: '#fff', marginBottom: 8 }}>{f.title}</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.65 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: 'rgba(21,101,216,0.12)', borderTop: '1px solid rgba(21,101,216,0.2)', borderBottom: '1px solid rgba(21,101,216,0.2)', padding: '80px 48px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: 700, color: '#fff', letterSpacing: '-0.5px', margin: '0 0 16px' }}>Pronto para começar?</h2>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', marginBottom: 32, fontFamily: 'Inter, sans-serif' }}>Registe-se gratuitamente e comece a gerir os seus serviços hoje.</p>
        <button onClick={onRegister} style={{ padding: '14px 36px', borderRadius: 10, border: 'none', background: '#1565D8', color: '#fff', cursor: 'pointer', fontSize: 15, fontFamily: 'Inter, sans-serif', fontWeight: 600, boxShadow: '0 8px 32px rgba(21,101,216,0.35)' }}>
          Criar Conta Gratuita
        </button>
      </section>

      {/* Footer */}
      <footer style={{ padding: '32px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: '#1565D8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff' }}>R</div>
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 15, color: 'rgba(255,255,255,0.4)' }}>RESOLVA</span>
        </div>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', fontFamily: 'Inter, sans-serif' }}>© 2026 RESOLVA · Gestão de Serviços Técnicos</span>
      </footer>
    </div>
  )
}

// ─── ══════════════════════════════════════════════════════════════════════ ───
// ─── AUTH PAGES ──────────────────────────────────────────────────────────────
// ─── ══════════════════════════════════════════════════════════════════════ ───

function BrandLogo({ size = 38, compact = false }: { size?: number; compact?: boolean }) {
  return (
    <div style={{
      width: size,
      height: size,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      filter: 'drop-shadow(0 12px 18px rgba(30, 64, 175, 0.26))'
    }}>
      <svg width={compact ? size * 0.88 : size} height={compact ? size * 0.88 : size} viewBox="0 0 128 128" aria-hidden="true" style={{ display: 'block' }}>
        <defs>
          <linearGradient id="resolvaLogoBlue" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="50%" stopColor="#1d4ed8" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
        </defs>
        <g fill="none" stroke="url(#resolvaLogoBlue)" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round">
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

function AuthLayout({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #F7F9FC 0%, #EEF4FF 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '36px 20px' }}>
      <div style={{ width: '100%', maxWidth: 430, background: '#fff', borderRadius: 24, boxShadow: '0 18px 60px rgba(15, 23, 42, 0.08)', border: '1px solid rgba(148, 163, 184, 0.18)', padding: '28px 28px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 18 }}>
          <BrandLogo size={34} />
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: 18, color: '#0F172A', letterSpacing: '0.12em' }}>RESOLVA</div>
        </div>

        <div style={{ marginBottom: 24, textAlign: 'center' }}>
          <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 30, fontWeight: 700, color: '#0D1B2A', margin: '0 0 8px', letterSpacing: '-0.4px' }}>{title}</h1>
          <p style={{ fontSize: 14, color: '#6B7A90', margin: 0, fontFamily: 'Inter, sans-serif' }}>{subtitle}</p>
        </div>

        {children}
      </div>
    </div>
  )
}

function InputField({ label, type = 'text', placeholder, value, onChange }: { label: string; type?: string; placeholder: string; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0D1B2A', marginBottom: 6, fontFamily: 'Inter, sans-serif' }}>{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ width: '100%', padding: '11px 14px', borderRadius: 8, border: '1px solid #E4E9F0', fontSize: 14, fontFamily: 'Inter, sans-serif', color: '#0D1B2A', outline: 'none', boxSizing: 'border-box', background: '#FAFBFC', transition: 'border-color 0.15s' }}
        onFocus={e => e.target.style.borderColor = '#1565D8'}
        onBlur={e => e.target.style.borderColor = '#E4E9F0'}
      />
    </div>
  )
}

function LoginPage({ users, onSuccess, onRegister, onForgot, onBack }: { users: UserAccount[]; onSuccess: (u: AuthUser) => void; onRegister: () => void; onForgot: () => void; onBack: () => void }) {
  const [email, setEmail] = useState(() => localStorage.getItem('resolva_remember_email') ?? '')
  const [pass, setPass] = useState('')
  const [rememberMe, setRememberMe] = useState(() => localStorage.getItem('resolva_remember_me') === 'true')
  const [showPassword, setShowPassword] = useState(false)
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [error, setError] = useState('')

  function handleLogin() {
    if (!email || !pass) { setError('Preencha todos os campos.'); return }
    const account = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === pass)
    if (!account) { setError('Credenciais inválidas.'); return }

    if (rememberMe) {
      localStorage.setItem('resolva_remember_email', email)
      localStorage.setItem('resolva_remember_me', 'true')
    } else {
      localStorage.removeItem('resolva_remember_email')
      localStorage.setItem('resolva_remember_me', 'false')
    }

    onSuccess({ nome: account.nome, email: account.email, role: account.role })
  }

  if (!showEmailForm) {
    return (
      <AuthLayout title="Entrar na conta" subtitle="Continua com o teu email e palavra-passe">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <button onClick={() => setShowEmailForm(true)} style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid #DCE7FF', background: '#EFF6FF', color: '#1D4ED8', cursor: 'pointer', fontSize: 14, fontWeight: 700, fontFamily: 'Inter, sans-serif' }}>
            Usar email e palavra-passe
          </button>

          <div style={{ textAlign: 'center', fontSize: 14, color: '#6B7A90', fontFamily: 'Inter, sans-serif' }}>
            Ainda não tens conta?{' '}
            <button onClick={onRegister} style={{ color: '#1565D8', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontFamily: 'Inter, sans-serif' }}>Criar conta</button>
          </div>

          <div style={{ textAlign: 'center', marginTop: 6 }}>
            <button onClick={onBack} style={{ fontSize: 13, color: '#9AA5B4', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>← Voltar ao início</button>
          </div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Bem-vindo de volta" subtitle="Inicia sessão na tua conta RESOLVA">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {error && <div style={{ padding: '10px 14px', borderRadius: 8, background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', fontSize: 13, fontFamily: 'Inter, sans-serif' }}>{error}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '10px 12px' }}>
            <span style={{ fontSize: 15 }}>✉️</span>
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 14, color: '#0D1B2A', fontFamily: 'Inter, sans-serif' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '10px 12px' }}>
            <span style={{ fontSize: 15 }}>🔒</span>
            <input type={showPassword ? 'text' : 'password'} placeholder="Palavra-passe" value={pass} onChange={e => setPass(e.target.value)} style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 14, color: '#0D1B2A', fontFamily: 'Inter, sans-serif' }} />
            <button type="button" onClick={() => setShowPassword(v => !v)} style={{ border: 'none', background: 'transparent', color: '#64748B', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
              {showPassword ? 'OCULTAR' : 'VER'}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, fontSize: 12, color: '#6B7A90', fontFamily: 'Inter, sans-serif' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} style={{ accentColor: '#1565D8' }} />
            Lembrar email
          </label>
          <button onClick={onForgot} style={{ fontSize: 12, color: '#1565D8', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>Esqueci-me</button>
        </div>

        <button onClick={handleLogin} style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)', color: '#fff', cursor: 'pointer', fontSize: 15, fontWeight: 700, fontFamily: 'Inter, sans-serif', boxShadow: '0 8px 20px rgba(37,99,235,0.25)' }}>
          Entrar
        </button>

        <button onClick={() => setShowEmailForm(false)} style={{ fontSize: 13, color: '#64748B', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>
          ← Voltar às contas
        </button>

        <div style={{ textAlign: 'center', fontSize: 14, color: '#6B7A90', fontFamily: 'Inter, sans-serif' }}>
          Ainda não tens conta?{' '}
          <button onClick={onRegister} style={{ color: '#1565D8', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontFamily: 'Inter, sans-serif' }}>Criar conta</button>
        </div>

        <div style={{ textAlign: 'center' }}>
          <button onClick={onBack} style={{ fontSize: 13, color: '#9AA5B4', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>← Voltar ao início</button>
        </div>
      </div>
    </AuthLayout>
  )
}

function RegisterPage({ users, onSuccess, onLogin, onBack }: { users: UserAccount[]; onSuccess: (u: AuthUser, password?: string) => void; onLogin: () => void; onBack: () => void }) {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [confirm, setConfirm] = useState('')
  const [role, setRole] = useState<Role>('cliente')
  const [error, setError] = useState('')

  function handleRegister() {
    if (!nome || !email || !pass || !confirm) { setError('Preencha todos os campos.'); return }
    if (pass !== confirm) { setError('As palavras-passe não coincidem.'); return }
    if (pass.length < 6) { setError('A palavra-passe deve ter pelo menos 6 caracteres.'); return }
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) { setError('Este email já está registado.'); return }
    onSuccess({ nome, email, role }, pass)
  }

  return (
    <AuthLayout title="Criar conta" subtitle="Junta-te à plataforma RESOLVA">
      {error && <div style={{ padding: '10px 14px', borderRadius: 8, background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', fontSize: 13, marginBottom: 16 }}>{error}</div>}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0D1B2A', marginBottom: 6, fontFamily: 'Inter, sans-serif' }}>Tipo de conta</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {([['cliente', '👤 Cliente'], ['tecnico', '👷 Técnico']] as [Role, string][]).map(([r, label]) => (
            <button key={r} onClick={() => setRole(r)} style={{ flex: 1, padding: '9px', borderRadius: 8, border: `1px solid ${role === r ? '#1565D8' : '#E4E9F0'}`, background: role === r ? '#EFF6FF' : '#fff', color: role === r ? '#1565D8' : '#6B7A90', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>{label}</button>
          ))}
        </div>
      </div>
      <InputField label="Nome completo" placeholder="O teu nome" value={nome} onChange={setNome} />
      <InputField label="Email" type="email" placeholder="o.teu@email.com" value={email} onChange={setEmail} />
      <InputField label="Palavra-passe" type="password" placeholder="Mín. 6 caracteres" value={pass} onChange={setPass} />
      <InputField label="Confirmar palavra-passe" type="password" placeholder="Repete a palavra-passe" value={confirm} onChange={setConfirm} />
      <button onClick={handleRegister} style={{ width: '100%', padding: '12px', borderRadius: 8, border: 'none', background: '#1565D8', color: '#fff', cursor: 'pointer', fontSize: 15, fontWeight: 600, fontFamily: 'Inter, sans-serif', marginTop: 4, marginBottom: 16 }}>
        Criar Conta
      </button>
      <div style={{ fontSize: 11, color: '#9AA5B4', textAlign: 'center', fontFamily: 'Inter, sans-serif', lineHeight: 1.6, marginBottom: 16 }}>
        Ao criar conta aceitas os <span style={{ color: '#1565D8' }}>Termos de Serviço</span> e a <span style={{ color: '#1565D8' }}>Política de Privacidade</span>.
      </div>
      <div style={{ textAlign: 'center', fontSize: 14, color: '#6B7A90', fontFamily: 'Inter, sans-serif' }}>
        Já tens conta?{' '}
        <button onClick={onLogin} style={{ color: '#1565D8', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>Entrar</button>
      </div>
      <div style={{ marginTop: 12, textAlign: 'center' }}>
        <button onClick={onBack} style={{ fontSize: 13, color: '#9AA5B4', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>← Voltar ao início</button>
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
          <button onClick={() => { setEmail(''); setSent(false) }} style={{ fontSize: 13, color: '#1565D8', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif', marginBottom: 8, display: 'block', width: '100%' }}>Reenviar email</button>
        </div>
      )}
      <div style={{ textAlign: 'center' }}>
        <button onClick={onLogin} style={{ fontSize: 14, color: '#6B7A90', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>← Voltar ao login</button>
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
          <div style={{ width: 34, height: 34, borderRadius: 9, background: '#1565D8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#fff', fontFamily: 'DM Sans, sans-serif', flexShrink: 0 }}>R</div>
          <div>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 16, color: '#fff', letterSpacing: '-0.3px' }}>RESOLVA</div>
            <div style={{ fontSize: 10, color: '#4A6080', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Gestão Técnica</div>
          </div>
        </div>
      </div>
      <nav style={{ flex: 1, padding: '10px 10px', overflowY: 'auto' }}>
        {visible.map(item => {
          const active = page === item.id
          return (
            <button key={item.id} onClick={() => setPage(item.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', marginBottom: 2, textAlign: 'left', transition: 'all 0.15s', background: active ? '#1565D8' : 'transparent', color: active ? '#fff' : '#7A90A8', fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: active ? 600 : 400 }}>
              <span style={{ fontSize: 14, width: 18, textAlign: 'center' }}>{item.icon}</span>
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
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 600, color: '#E8EFF7', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.nome}</div>
            <div style={{ fontSize: 10, color: '#4A6080', textTransform: 'capitalize' }}>{user.role}</div>
          </div>
        </div>
        <button onClick={onLogout} style={{ width: '100%', padding: '7px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#7A90A8', cursor: 'pointer', fontSize: 12, fontFamily: 'Inter, sans-serif' }}>Terminar sessão</button>
      </div>
    </aside>
  )
}

function Topbar({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header style={{ background: '#fff', borderBottom: '1px solid #E4E9F0', padding: '0 28px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
      <div>
        <h1 style={{ margin: 0, fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 18, color: '#0D1B2A', letterSpacing: '-0.3px' }}>{title}</h1>
        <p style={{ margin: 0, fontSize: 11, color: '#6B7A90', fontFamily: 'Inter, sans-serif' }}>{subtitle}</p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid #E4E9F0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>🔔</button>
      </div>
    </header>
  )
}

function StatCard({ label, value, delta, icon, color }: { label: string; value: string | number; delta?: string; icon: string; color: string }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: '18px 20px', border: '1px solid #E4E9F0', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 11, color: '#6B7A90', fontFamily: 'Inter, sans-serif', fontWeight: 500, marginBottom: 4 }}>{label}</div>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 26, fontWeight: 700, color: '#0D1B2A', letterSpacing: '-0.5px' }}>{value}</div>
        </div>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{icon}</div>
      </div>
      {delta && <div style={{ fontSize: 11, color: '#00B893', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>{delta}</div>}
    </div>
  )
}

// ── Dashboard ──

function DashboardPage({ role, pedidos, userName }: { role: Role; pedidos: Pedido[]; userName: string }) {
  const pendentes = pedidos.filter(p => p.status === 'pendente').length
  const emCurso = pedidos.filter(p => p.status === 'em_curso').length
  const concluidos = pedidos.filter(p => p.status === 'concluido').length
  const receita = pagamentosData.filter(p => p.status === 'pago').reduce((s, p) => s + p.valor, 0)

  const pedidosVisiveis = role === 'cliente'
    ? pedidos.filter(p => p.cliente === userName)
    : role === 'tecnico'
      ? pedidos.filter(p => p.tecnico === userName || p.tecnico === 'Carlos Mendes')
      : pedidos

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <StatCard label="Pedidos Pendentes" value={pendentes} icon="📋" color="#EFF6FF" delta="↑ 2 novos hoje" />
        <StatCard label="Serviços em Curso" value={emCurso} icon="⚙️" color="#F0FDF4" />
        <StatCard label="Concluídos este mês" value={concluidos} icon="✅" color="#F0FDF4" delta="↑ 12% vs anterior" />
        <StatCard label="Receita Confirmada" value={`€${receita.toLocaleString('pt-PT')}`} icon="💰" color="#FFF7ED" delta="↑ €380 esta semana" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 14 }}>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E4E9F0', overflow: 'hidden' }}>
          <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid #E4E9F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: 14, color: '#0D1B2A' }}>Pedidos Recentes</div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFB' }}>
                {['ID', 'Cliente', 'Categoria', 'Prioridade', 'Estado'].map(h => (
                  <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: '#9AA5B4', fontFamily: 'Inter, sans-serif', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pedidosVisiveis.slice(0, 5).map((p, i) => (
                <tr key={p.id} style={{ borderTop: i > 0 ? '1px solid #F1F5F9' : undefined }}>
                  <td style={{ padding: '11px 14px', fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: '#1565D8', fontWeight: 500 }}>{p.id}</td>
                  <td style={{ padding: '11px 14px', fontSize: 13, fontFamily: 'Inter, sans-serif', color: '#0D1B2A', fontWeight: 500 }}>{p.cliente}</td>
                  <td style={{ padding: '11px 14px', fontSize: 12, color: '#6B7A90' }}>{catIcons[p.categoria]} {p.categoria}</td>
                  <td style={{ padding: '11px 14px' }}><Badge label={p.prioridade.charAt(0).toUpperCase() + p.prioridade.slice(1)} cls={prioridadeColors[p.prioridade]} /></td>
                  <td style={{ padding: '11px 14px' }}><Badge label={statusLabels[p.status]} cls={statusColors[p.status]} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E4E9F0', overflow: 'hidden' }}>
          <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid #E4E9F0' }}>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: 14, color: '#0D1B2A' }}>Agendamentos Hoje</div>
          </div>
          <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {agendamentosData.slice(0, 3).map(a => (
              <div key={a.id} style={{ display: 'flex', gap: 10, padding: '10px', borderRadius: 8, background: '#F8FAFB', alignItems: 'flex-start' }}>
                <div style={{ textAlign: 'center', minWidth: 40, background: '#EFF6FF', borderRadius: 7, padding: '5px 4px' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1565D8', fontFamily: 'DM Sans, sans-serif' }}>{a.hora}</div>
                  <div style={{ fontSize: 9, color: '#6B7A90' }}>{a.duracao}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#0D1B2A' }}>{a.cliente}</div>
                  <div style={{ fontSize: 11, color: '#6B7A90' }}>{a.servico}</div>
                  <div style={{ fontSize: 10, color: '#9AA5B4', marginTop: 2 }}>👷 {a.tecnico}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E4E9F0', overflow: 'hidden' }}>
        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid #E4E9F0' }}>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: 14, color: '#0D1B2A' }}>Técnicos — Disponibilidade</div>
        </div>
        <div style={{ padding: '14px 20px', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
          {tecnicosData.map(t => (
            <div key={t.id} style={{ padding: '12px', borderRadius: 10, border: '1px solid #E4E9F0', textAlign: 'center' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: t.disponivel ? '#E6F9F5' : '#F1F5F9', margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>👷</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#0D1B2A' }}>{t.nome.split(' ')[0]}</div>
              <div style={{ fontSize: 10, color: '#6B7A90', marginTop: 2 }}>{t.especialidades[0]}</div>
              <div style={{ marginTop: 6 }}>
                <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: t.disponivel ? '#E6F9F5' : '#F1F5F9', color: t.disponivel ? '#00B893' : '#9AA5B4', fontWeight: 600 }}>
                  {t.disponivel ? '● Disponível' : '○ Ocupado'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Pedidos with photo upload ──

function PedidosPage({ role, pedidos, onPedidosChange, userName, agendamentos, onAgendamentosChange }: { role: Role; pedidos: Pedido[]; onPedidosChange: (next: Pedido[]) => void; userName: string; agendamentos: Agendamento[]; onAgendamentosChange: (next: Agendamento[]) => void }) {
  const [filtro, setFiltro] = useState('todos')
  const [busca, setBusca] = useState('')
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null)
  const [showNewPedido, setShowNewPedido] = useState(false)
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([])
  const [newNome, setNewNome] = useState(userName)
  const [newDesc, setNewDesc] = useState('')
  const [newCat, setNewCat] = useState('Eletricidade')
  const [newMorada, setNewMorada] = useState('')
  const [newCidade, setNewCidade] = useState('Lisboa')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const filtrados = pedidos.filter(p => {
    if (filtro !== 'todos' && p.status !== filtro) return false
    if (busca && !p.cliente.toLowerCase().includes(busca.toLowerCase()) && !p.id.toLowerCase().includes(busca.toLowerCase())) return false
    if (role === 'tecnico') return p.tecnico === userName || p.tecnico === 'Carlos Mendes'
    if (role === 'cliente') return p.cliente === userName
    return true
  })

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files) return
    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = ev => {
        setUploadedPhotos(prev => [...prev, ev.target?.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  function handleAddPhotos(pedidoId: string, e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files) return
    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = ev => {
        const url = ev.target?.result as string
        onPedidosChange(pedidos.map(p => p.id === pedidoId ? { ...p, fotos: [...(p.fotos || []), url] } : p))
        if (selectedPedido?.id === pedidoId) setSelectedPedido(prev => prev ? { ...prev, fotos: [...(prev.fotos || []), url] } : prev)
      }
      reader.readAsDataURL(file)
    })
  }

  function appendPedidoHistory(pedido: Pedido, tipo: PedidoHistoricoItem['tipo'], texto: string) {
    return {
      ...pedido,
      historico: [
        ...(pedido.historico ?? []),
        {
          id: `${pedido.id}-${Date.now()}`,
          tipo,
          texto,
          data: new Date().toISOString(),
        },
      ],
    }
  }

  function removePedido(pedidoId: string) {
    onPedidosChange(pedidos.filter(p => p.id !== pedidoId))
    if (selectedPedido?.id === pedidoId) {
      setSelectedPedido(null)
    }
  }

  function updatePedidoStatus(pedidoId: string, nextStatus: Status, texto: string) {
    onPedidosChange(pedidos.map(p => p.id === pedidoId ? appendPedidoHistory({ ...p, status: nextStatus }, 'tecnico', texto) : p))

    if (nextStatus === 'concluido') {
      onAgendamentosChange(agendamentos.map(a => a.pedidoId === pedidoId ? { ...a, status: 'concluido' } : a))
    }

    if (selectedPedido?.id === pedidoId) {
      setSelectedPedido(prev => prev ? appendPedidoHistory({ ...prev, status: nextStatus }, 'tecnico', texto) : prev)
    }
  }

  function submitNewPedido() {
    if (!newDesc.trim() || !newMorada.trim()) return

    const clienteFinal = role === 'cliente' ? userName : (newNome.trim() || userName)

    const novo: Pedido = {
      id: `P-${2407 + pedidos.length}`,
      cliente: clienteFinal,
      categoria: newCat,
      descricao: newDesc,
      morada: newMorada,
      cidade: newCidade || 'Lisboa',
      data: new Date().toISOString().split('T')[0],
      status: 'pendente',
      prioridade: 'media',
      fotos: uploadedPhotos,
      historico: [{ id: `h-${Date.now()}`, tipo: 'cliente', texto: 'Pedido submetido com foto e endereço do cliente.', data: new Date().toISOString() }],
    }
    onPedidosChange([novo, ...pedidos])
    setShowNewPedido(false)
    setUploadedPhotos([])
    setNewNome(userName)
    setNewDesc('')
    setNewMorada('')
    setNewCidade('Lisboa')
  }

  const filtros = [
    { key: 'todos', label: 'Todos' }, { key: 'pendente', label: 'Pendente' },
    { key: 'em_analise', label: 'Em Análise' }, { key: 'agendado', label: 'Agendado' },
    { key: 'em_curso', label: 'Em Curso' }, { key: 'concluido', label: 'Concluído' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {filtros.map(f => (
            <button key={f.key} onClick={() => setFiltro(f.key)} style={{ padding: '5px 12px', borderRadius: 20, border: '1px solid', cursor: 'pointer', fontSize: 12, fontFamily: 'Inter, sans-serif', fontWeight: 500, transition: 'all 0.15s', background: filtro === f.key ? '#0D1B2A' : '#fff', color: filtro === f.key ? '#fff' : '#6B7A90', borderColor: filtro === f.key ? '#0D1B2A' : '#E4E9F0' }}>{f.label}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Pesquisar..." style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #E4E9F0', fontSize: 13, fontFamily: 'Inter, sans-serif', outline: 'none', width: 200, color: '#0D1B2A' }} />
          {(role === 'cliente' || role === 'admin') && (
            <button onClick={() => setShowNewPedido(true)} style={{ padding: '7px 16px', borderRadius: 8, background: '#1565D8', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>+ Novo Pedido</button>
          )}
        </div>
      </div>

      {/* New pedido modal */}
      {showNewPedido && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(13,27,42,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }} onClick={() => setShowNewPedido(false)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '32px', width: 540, maxHeight: '90vh', overflowY: 'auto', position: 'relative' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 18, color: '#0D1B2A', marginBottom: 4 }}>Novo Pedido de Serviço</div>
            <div style={{ fontSize: 13, color: '#6B7A90', marginBottom: 24, fontFamily: 'Inter, sans-serif' }}>Descreva o problema e adicione fotos para facilitar o diagnóstico.</div>

            {role !== 'cliente' && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0D1B2A', marginBottom: 6, fontFamily: 'Inter, sans-serif' }}>Nome do cliente</label>
                <input value={newNome} onChange={e => setNewNome(e.target.value)} placeholder="Ex.: Ana Ferreira" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E4E9F0', fontSize: 13, fontFamily: 'Inter, sans-serif', color: '#0D1B2A', background: '#FAFBFC', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0D1B2A', marginBottom: 6, fontFamily: 'Inter, sans-serif' }}>Categoria</label>
              <select value={newCat} onChange={e => setNewCat(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E4E9F0', fontSize: 13, fontFamily: 'Inter, sans-serif', color: '#0D1B2A', background: '#FAFBFC', outline: 'none' }}>
                {['Canalização', 'Eletricidade', 'Carpintaria', 'Montagem', 'Climatização', 'Refrigeração', 'Manutenção', 'Pequenas Reparações'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0D1B2A', marginBottom: 6, fontFamily: 'Inter, sans-serif' }}>Morada</label>
                <input value={newMorada} onChange={e => setNewMorada(e.target.value)} placeholder="Rua, número" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E4E9F0', fontSize: 13, fontFamily: 'Inter, sans-serif', color: '#0D1B2A', background: '#FAFBFC', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0D1B2A', marginBottom: 6, fontFamily: 'Inter, sans-serif' }}>Cidade</label>
                <input value={newCidade} onChange={e => setNewCidade(e.target.value)} placeholder="Lisboa" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E4E9F0', fontSize: 13, fontFamily: 'Inter, sans-serif', color: '#0D1B2A', background: '#FAFBFC', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0D1B2A', marginBottom: 6, fontFamily: 'Inter, sans-serif' }}>Descrição do problema</label>
              <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Descreva o problema com o máximo de detalhe possível..." rows={3} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E4E9F0', fontSize: 13, fontFamily: 'Inter, sans-serif', color: '#0D1B2A', background: '#FAFBFC', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>

            {/* Photo upload zone */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0D1B2A', marginBottom: 6, fontFamily: 'Inter, sans-serif' }}>
                📸 Fotos do problema <span style={{ color: '#9AA5B4', fontWeight: 400 }}>(opcional — ajuda o técnico no diagnóstico)</span>
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{ border: '2px dashed #CBD5E1', borderRadius: 10, padding: '24px', textAlign: 'center', cursor: 'pointer', background: '#F8FAFB', marginBottom: 12, transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#1565D8'; e.currentTarget.style.background = '#EFF6FF' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.background = '#F8FAFB' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>📷</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#0D1B2A', marginBottom: 4 }}>Clique para adicionar fotos</div>
                <div style={{ fontSize: 12, color: '#9AA5B4' }}>JPG, PNG — máx. 10 MB por foto</div>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handlePhotoUpload} style={{ display: 'none' }} />
              {uploadedPhotos.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {uploadedPhotos.map((url, i) => (
                    <div key={i} style={{ position: 'relative', aspectRatio: '1', borderRadius: 8, overflow: 'hidden', border: '1px solid #E4E9F0' }}>
                      <img src={url} alt={`Foto ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button onClick={() => setUploadedPhotos(prev => prev.filter((_, j) => j !== i))} style={{ position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowNewPedido(false)} style={{ flex: 1, padding: '11px', borderRadius: 8, border: '1px solid #E4E9F0', background: '#fff', cursor: 'pointer', fontSize: 14, fontFamily: 'Inter, sans-serif', color: '#6B7A90' }}>Cancelar</button>
              <button onClick={submitNewPedido} disabled={!newDesc} style={{ flex: 2, padding: '11px', borderRadius: 8, border: 'none', background: newDesc ? '#1565D8' : '#CBD5E1', color: '#fff', cursor: newDesc ? 'pointer' : 'not-allowed', fontSize: 14, fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>Submeter Pedido</button>
            </div>
          </div>
        </div>
      )}

      {/* Pedido detail modal */}
      {selectedPedido && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(13,27,42,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }} onClick={() => setSelectedPedido(null)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '28px', width: 560, maxHeight: '88vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: '#1565D8', fontWeight: 600 }}>{selectedPedido.id}</span>
                  <Badge label={statusLabels[selectedPedido.status]} cls={statusColors[selectedPedido.status]} />
                </div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 17, color: '#0D1B2A' }}>{selectedPedido.categoria}</div>
                <div style={{ fontSize: 13, color: '#6B7A90', fontFamily: 'Inter, sans-serif' }}>Cliente: {selectedPedido.cliente}</div>
              </div>
              <button onClick={() => setSelectedPedido(null)} style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid #E4E9F0', background: '#fff', cursor: 'pointer', fontSize: 14 }}>×</button>
            </div>

            <div style={{ background: '#F8FAFB', borderRadius: 10, padding: '14px 16px', marginBottom: 20, fontSize: 14, color: '#0D1B2A', lineHeight: 1.6, fontFamily: 'Inter, sans-serif' }}>{selectedPedido.descricao}</div>
            <div style={{ fontSize: 13, color: '#6B7A90', fontFamily: 'Inter, sans-serif', marginBottom: 20 }}>📍 {selectedPedido.morada}, {selectedPedido.cidade} · 📅 {selectedPedido.data}{selectedPedido.tecnico ? ` · 👷 ${selectedPedido.tecnico}` : ''}</div>

            {role !== 'tecnico' && (selectedPedido.historico?.length ?? 0) > 0 && (
              <div style={{ marginBottom: 20, background: '#F8FAFB', borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#0D1B2A', marginBottom: 8, fontFamily: 'Inter, sans-serif' }}>Histórico de atividades</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {selectedPedido.historico!.map(item => (
                    <div key={item.id} style={{ borderLeft: '2px solid #DDE7F3', paddingLeft: 10 }}>
                      <div style={{ fontSize: 11, color: '#6B7A90', textTransform: 'capitalize', marginBottom: 2 }}>{item.tipo} · {new Date(item.data).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                      <div style={{ fontSize: 12, color: '#0D1B2A' }}>{item.texto}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {role === 'tecnico' && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                <button onClick={() => updatePedidoStatus(selectedPedido.id, 'agendado', 'Técnico confirmou o pedido e marcou a visita para calendarização.')} style={{ flex: 1, padding: '10px', borderRadius: 8, background: '#0EA5E9', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Confirmar pedido</button>
                <button onClick={() => updatePedidoStatus(selectedPedido.id, 'em_curso', 'Técnico iniciou o serviço e registou o início da intervenção.')} style={{ flex: 1, padding: '10px', borderRadius: 8, background: '#16A34A', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Iniciar</button>
                <button onClick={() => updatePedidoStatus(selectedPedido.id, 'concluido', 'Serviço concluído e validado pelo técnico.')} style={{ flex: 1, padding: '10px', borderRadius: 8, background: '#0F766E', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Concluir serviço</button>
              </div>
            )}

            {/* Photos section */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0D1B2A', fontFamily: 'Inter, sans-serif' }}>📸 Fotos do problema</div>
                <label style={{ fontSize: 12, color: '#1565D8', fontWeight: 500, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                  + Adicionar fotos
                  <input type="file" accept="image/*" multiple onChange={e => handleAddPhotos(selectedPedido.id, e)} style={{ display: 'none' }} />
                </label>
              </div>
              {(selectedPedido.fotos?.length ?? 0) > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {selectedPedido.fotos!.map((url, i) => (
                    <div key={i} style={{ aspectRatio: '4/3', borderRadius: 8, overflow: 'hidden', border: '1px solid #E4E9F0', cursor: 'pointer' }}>
                      <img src={url} alt={`Foto ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
              ) : (
                <label style={{ display: 'block', border: '2px dashed #E4E9F0', borderRadius: 10, padding: '20px', textAlign: 'center', cursor: 'pointer', color: '#9AA5B4', fontSize: 13, fontFamily: 'Inter, sans-serif' }}>
                  <div style={{ fontSize: 24, marginBottom: 6 }}>📷</div>
                  Nenhuma foto adicionada — clique para adicionar
                  <input type="file" accept="image/*" multiple onChange={e => handleAddPhotos(selectedPedido.id, e)} style={{ display: 'none' }} />
                </label>
              )}
            </div>

            {(role === 'cliente' || role === 'admin') && (
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button
                  onClick={() => removePedido(selectedPedido.id)}
                  style={{ flex: 1, padding: '10px', borderRadius: 8, background: '#fff', color: '#B91C1C', border: '1px solid #FECACA', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif' }}
                >
                  Remover pedido
                </button>
              </div>
            )}

            {role === 'admin' && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={{ flex: 1, padding: '10px', borderRadius: 8, background: '#1565D8', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>Criar Orçamento</button>
                <button style={{ flex: 1, padding: '10px', borderRadius: 8, background: '#fff', color: '#0D1B2A', border: '1px solid #E4E9F0', cursor: 'pointer', fontSize: 13, fontFamily: 'Inter, sans-serif' }}>Atribuir Técnico</button>
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E4E9F0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F8FAFB', borderBottom: '1px solid #E4E9F0' }}>
              {['ID', 'Cliente', 'Categoria', 'Descrição', 'Data', 'Fotos', 'Prioridade', 'Estado', 'Técnico'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: '#9AA5B4', fontFamily: 'Inter, sans-serif', letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtrados.map((p, i) => (
              <tr key={p.id} style={{ borderTop: i > 0 ? '1px solid #F1F5F9' : undefined, cursor: 'pointer' }}
                onClick={() => setSelectedPedido(p)}
                onMouseEnter={e => (e.currentTarget.style.background = '#FAFBFC')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <td style={{ padding: '11px 14px', fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: '#1565D8', fontWeight: 500 }}>{p.id}</td>
                <td style={{ padding: '11px 14px', fontSize: 13, color: '#0D1B2A', fontWeight: 600, whiteSpace: 'nowrap' }}>{p.cliente}</td>
                <td style={{ padding: '11px 14px', fontSize: 12, color: '#6B7A90', whiteSpace: 'nowrap' }}>{catIcons[p.categoria]} {p.categoria}</td>
                <td style={{ padding: '11px 14px', fontSize: 12, color: '#6B7A90', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.descricao}</td>
                <td style={{ padding: '11px 14px', fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#9AA5B4', whiteSpace: 'nowrap' }}>{p.data}</td>
                <td style={{ padding: '11px 14px', textAlign: 'center' }}>
                  {(p.fotos?.length ?? 0) > 0 ? (
                    <span style={{ fontSize: 11, background: '#EFF6FF', color: '#1565D8', padding: '2px 7px', borderRadius: 10, fontWeight: 600 }}>📷 {p.fotos!.length}</span>
                  ) : <span style={{ color: '#E4E9F0', fontSize: 12 }}>—</span>}
                </td>
                <td style={{ padding: '11px 14px' }}><Badge label={p.prioridade.charAt(0).toUpperCase() + p.prioridade.slice(1)} cls={prioridadeColors[p.prioridade]} /></td>
                <td style={{ padding: '11px 14px' }}><Badge label={statusLabels[p.status]} cls={statusColors[p.status]} /></td>
                <td style={{ padding: '11px 14px', fontSize: 12, color: '#6B7A90', whiteSpace: 'nowrap' }}>{p.tecnico || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtrados.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: '#9AA5B4', fontFamily: 'Inter, sans-serif' }}>Nenhum pedido encontrado.</div>
        )}
      </div>
    </div>
  )
}

// ── Orçamentos ──

function OrcamentosPage({ role, orcamentos, onOrcamentosChange, pedidos, onPedidosChange, pagamentos, onPagamentosChange }: { role: Role; orcamentos: Orcamento[]; onOrcamentosChange: (next: Orcamento[]) => void; pedidos: Pedido[]; onPedidosChange: (next: Pedido[]) => void; pagamentos: Pagamento[]; onPagamentosChange: (next: Pagamento[]) => void }) {
  const [selected, setSelected] = useState<Orcamento | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ pedidoId: pedidos[0]?.id ?? '', cliente: 'Ana Ferreira', servico: 'Reparação', valor: 180, validade: '2026-10-05' })

  function handleAccept(id: string) {
    const target = orcamentos.find(o => o.id === id)
    if (!target) return

    onOrcamentosChange(orcamentos.map(o => o.id === id ? { ...o, status: 'aceite' } : o))

    const pedido = pedidos.find(p => p.id === target.pedidoId)
    if (pedido) {
      const nextPedidos = pedidos.map(p => p.id === pedido.id ? { ...p, status: 'aceite' as Status } : p)
      onPedidosChange(nextPedidos)
    }

    const exists = pagamentos.some(p => p.servico === target.servico && p.cliente === target.cliente && p.valor === target.valor)
    if (!exists) {
      const novoPagamento: Pagamento = {
        id: `PAG-${String(pagamentos.length + 1).padStart(3, '0')}`,
        cliente: target.cliente,
        servico: target.servico,
        valor: target.valor,
        data: new Date().toISOString().split('T')[0],
        metodo: 'Transferência',
        status: 'pendente',
      }
      onPagamentosChange([novoPagamento, ...pagamentos])
    }
  }

  function handleReject(id: string) {
    onOrcamentosChange(orcamentos.map(o => o.id === id ? { ...o, status: 'rejeitado' } : o))
  }

  function handleCreate() {
    if (!form.pedidoId || !form.servico.trim()) return
    const next: Orcamento = {
      id: `ORC-${String(orcamentos.length + 1).padStart(3, '0')}`,
      pedidoId: form.pedidoId,
      cliente: form.cliente,
      servico: form.servico,
      valor: Number(form.valor) || 0,
      validade: form.validade,
      status: 'pendente',
      itens: [{ descricao: 'Mão de obra', valor: Number(form.valor) || 0 }],
    }
    onOrcamentosChange([next, ...orcamentos])
    setShowForm(false)
    setForm({ pedidoId: pedidos[0]?.id ?? '', cliente: 'Ana Ferreira', servico: 'Reparação', valor: 180, validade: '2026-10-05' })
  }

  return (
    <>
      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {orcamentos.map(o => (
            <div key={o.id} onClick={() => setSelected(o === selected ? null : o)} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${selected?.id === o.id ? '#1565D8' : '#E4E9F0'}`, padding: '18px 20px', cursor: 'pointer', transition: 'all 0.15s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#1565D8', fontWeight: 600 }}>{o.id}</span>
                    <Badge label={o.status === 'aceite' ? 'Aceite' : o.status === 'pendente' ? 'Pendente' : 'Rejeitado'} cls={statusColors[o.status]} />
                  </div>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 15, color: '#0D1B2A' }}>{o.servico}</div>
                  <div style={{ fontSize: 12, color: '#6B7A90' }}>Cliente: {o.cliente} · Ref. {o.pedidoId}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 22, fontWeight: 700, color: '#0D1B2A' }}>€{o.valor.toFixed(2)}</div>
                  <div style={{ fontSize: 11, color: '#9AA5B4' }}>Válido até {o.validade}</div>
                </div>
              </div>
              {selected?.id === o.id && (
                <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 14, marginTop: 4 }}>
                  {o.itens.map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: i < o.itens.length - 1 ? '1px dashed #E4E9F0' : undefined }}>
                      <span style={{ fontSize: 13, color: '#0D1B2A' }}>{item.descricao}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>€{item.valor.toFixed(2)}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0' }}>
                    <span style={{ fontSize: 14, fontWeight: 700 }}>Total</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#1565D8', fontFamily: 'JetBrains Mono, monospace' }}>€{o.valor.toFixed(2)}</span>
                  </div>
                  {o.status === 'pendente' && (role === 'cliente' || role === 'admin') && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                      <button onClick={() => handleAccept(o.id)} style={{ flex: 1, padding: '9px', borderRadius: 8, background: '#00B893', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>✓ Aceitar</button>
                      <button onClick={() => handleReject(o.id)} style={{ flex: 1, padding: '9px', borderRadius: 8, background: '#fff', color: '#EF4444', border: '1px solid #EF4444', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>✗ Rejeitar</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        <div style={{ width: 260, flexShrink: 0 }}>
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E4E9F0', padding: '18px 18px', position: 'sticky', top: 24 }}>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 14, color: '#0D1B2A', marginBottom: 14 }}>Resumo</div>
            {[
              { label: 'Total', value: orcamentos.length },
              { label: 'Aceites', value: orcamentos.filter(o => o.status === 'aceite').length },
              { label: 'Pendentes', value: orcamentos.filter(o => o.status === 'pendente').length },
              { label: 'Valor aceite', value: `€${orcamentos.filter(o => o.status === 'aceite').reduce((s, o) => s + o.valor, 0).toLocaleString('pt-PT')}` },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ fontSize: 13, color: '#6B7A90' }}>{item.label}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#0D1B2A' }}>{item.value}</span>
              </div>
            ))}
            {role === 'admin' && (
              <button onClick={() => setShowForm(true)} style={{ width: '100%', marginTop: 14, padding: '9px', borderRadius: 8, background: '#1565D8', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>+ Criar Orçamento</button>
            )}
          </div>
        </div>
      </div>

      {showForm && role === 'admin' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(13,27,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setShowForm(false)}>
          <div style={{ width: 460, background: '#fff', borderRadius: 16, padding: 24 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 20, color: '#0D1B2A', marginBottom: 16 }}>Criar orçamento</div>
            <div style={{ display: 'grid', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#0D1B2A', marginBottom: 6 }}>Pedido</label>
                <select value={form.pedidoId} onChange={e => setForm({ ...form, pedidoId: e.target.value })} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E4E9F0', background: '#FAFBFC' }}>
                  {pedidos.map(p => <option key={p.id} value={p.id}>{p.id} — {p.cliente}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#0D1B2A', marginBottom: 6 }}>Cliente</label>
                <input value={form.cliente} onChange={e => setForm({ ...form, cliente: e.target.value })} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E4E9F0', background: '#FAFBFC' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#0D1B2A', marginBottom: 6 }}>Serviço</label>
                <input value={form.servico} onChange={e => setForm({ ...form, servico: e.target.value })} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E4E9F0', background: '#FAFBFC' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#0D1B2A', marginBottom: 6 }}>Valor</label>
                  <input type="number" value={form.valor} onChange={e => setForm({ ...form, valor: Number(e.target.value) })} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E4E9F0', background: '#FAFBFC' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#0D1B2A', marginBottom: 6 }}>Validade</label>
                  <input type="date" value={form.validade} onChange={e => setForm({ ...form, validade: e.target.value })} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E4E9F0', background: '#FAFBFC' }} />
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 22 }}>
              <button onClick={() => setShowForm(false)} style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #E4E9F0', background: '#fff', color: '#6B7A90', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={handleCreate} style={{ padding: '10px 16px', borderRadius: 8, border: 'none', background: '#1565D8', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ── Agendamentos ──

function AgendamentosPage({ role, agendamentos, onAgendamentosChange, disponibilidade, onDisponibilidadeChange, userName }: { role: Role; agendamentos: Agendamento[]; onAgendamentosChange: (next: Agendamento[]) => void; disponibilidade: string[]; onDisponibilidadeChange: (next: string[]) => void; userName: string }) {
  const [monthOffset, setMonthOffset] = useState(0)
  const [selectedDate, setSelectedDate] = useState(new Date(2026, 8, 18))
  const [showForm, setShowForm] = useState(false)
  const [newAvailableDate, setNewAvailableDate] = useState('2026-09-20')
  const [formError, setFormError] = useState('')
  const [clientPreference, setClientPreference] = useState({ data: '2026-09-24', hora: '10:00' })
  const [form, setForm] = useState({
    cliente: userName || 'Ana Ferreira',
    tecnico: userName || 'Carlos Mendes',
    servico: 'Reparação de canalização',
    data: '2026-09-20',
    hora: '09:00',
    duracao: '2h',
    status: 'confirmado' as Agendamento['status'],
  })

  const currentMonth = new Date(2026, 8 + monthOffset, 1)
  const monthLabel = currentMonth.toLocaleString('pt-PT', { month: 'long', year: 'numeric' })
  const visibleAgendamentos = agendamentos.filter(a => {
    if (role === 'cliente') return a.cliente === userName
    if (role === 'tecnico') return a.tecnico === userName || a.tecnico === 'Carlos Mendes'
    return true
  })

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate()
  const leadingEmptyDays = currentMonth.getDay()
  const monthCells = Array.from({ length: leadingEmptyDays + daysInMonth }, (_, index) => {
    if (index < leadingEmptyDays) return null
    return index - leadingEmptyDays + 1
  })

  const selectedKey = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`
  const dayAppointments = visibleAgendamentos.filter(a => a.data === selectedKey)

  function addDisponibilidade() {
    if (!newAvailableDate) return
    const next = [...new Set([...disponibilidade, newAvailableDate])].sort()
    onDisponibilidadeChange(next)
    setNewAvailableDate(newAvailableDate)
  }

  function removeDisponibilidade(date: string) {
    onDisponibilidadeChange(disponibilidade.filter(d => d !== date))
  }

  function handleCreateAgendamento() {
    const conflito = agendamentos.some(a => a.tecnico === form.tecnico && a.data === form.data && a.hora === form.hora)
    if (conflito) {
      setFormError('Já existe um agendamento para esse técnico, data e hora.')
      return
    }
    if (role === 'admin' && disponibilidade.length > 0 && !disponibilidade.includes(form.data)) {
      setFormError('Selecione uma data disponível para o técnico.')
      return
    }
    const novo: Agendamento = {
      id: `AG-${String(agendamentos.length + 1).padStart(3, '0')}`,
      pedidoId: `P-${2400 + agendamentos.length + 1}`,
      cliente: form.cliente,
      tecnico: form.tecnico,
      servico: form.servico,
      data: form.data,
      hora: form.hora,
      duracao: form.duracao,
      status: form.status,
    }
    onAgendamentosChange([novo, ...agendamentos])
    setSelectedDate(new Date(`${form.data}T12:00:00`))
    setShowForm(false)
    setFormError('')
    setForm({
      cliente: userName || 'Ana Ferreira',
      tecnico: userName || 'Carlos Mendes',
      servico: 'Reparação de canalização',
      data: form.data,
      hora: '09:00',
      duracao: '2h',
      status: 'confirmado',
    })
  }

  function handleClientPreference() {
    if (!clientPreference.data || !clientPreference.hora) return

    const novo: Agendamento = {
      id: `AG-${String(agendamentos.length + 1).padStart(3, '0')}`,
      pedidoId: `P-${2400 + agendamentos.length + 1}`,
      cliente: userName,
      tecnico: 'A definir',
      servico: 'Pedido de serviço em análise',
      data: clientPreference.data,
      hora: clientPreference.hora,
      duracao: '2h',
      status: 'confirmado',
    }

    onAgendamentosChange([novo, ...agendamentos])
    setSelectedDate(new Date(`${clientPreference.data}T12:00:00`))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {role === 'cliente' && (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E4E9F0', padding: '18px 20px' }}>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 14, color: '#0D1B2A', marginBottom: 12 }}>Pedido de agendamento</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, color: '#0D1B2A' }}>Data preferida</label>
              <input type="date" value={clientPreference.data} onChange={e => setClientPreference(prev => ({ ...prev, data: e.target.value }))} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E4E9F0', background: '#FAFBFC' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, color: '#0D1B2A' }}>Hora preferida</label>
              <input type="time" value={clientPreference.hora} onChange={e => setClientPreference(prev => ({ ...prev, hora: e.target.value }))} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E4E9F0', background: '#FAFBFC' }} />
            </div>
          </div>
          <button onClick={handleClientPreference} style={{ padding: '10px 16px', borderRadius: 8, background: '#1565D8', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Solicitar agendamento</button>
        </div>
      )}

      {role === 'tecnico' && (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E4E9F0', padding: '18px 20px' }}>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 14, color: '#0D1B2A', marginBottom: 12 }}>Disponibilidade do técnico</div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
            <input type="date" value={newAvailableDate} onChange={e => setNewAvailableDate(e.target.value)} style={{ flex: 1, padding: '10px 12px', borderRadius: 8, border: '1px solid #E4E9F0', background: '#FAFBFC' }} />
            <button onClick={addDisponibilidade} style={{ padding: '10px 16px', borderRadius: 8, background: '#1565D8', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Adicionar dia</button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {disponibilidade.length === 0 ? (
              <span style={{ fontSize: 12, color: '#9AA5B4' }}>Ainda não marcou nenhum dia disponível.</span>
            ) : (
              disponibilidade.map(date => (
                <div key={date} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 999, background: '#EFF6FF', color: '#1565D8', fontSize: 12, fontWeight: 600 }}>
                  {new Date(`${date}T12:00:00`).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  <button onClick={() => removeDisponibilidade(date)} style={{ border: 'none', background: 'transparent', color: '#1565D8', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>×</button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E4E9F0', padding: '18px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 14, color: '#0D1B2A' }}>{monthLabel}</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setMonthOffset(prev => prev - 1)} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #E4E9F0', background: '#fff', cursor: 'pointer', fontSize: 12 }}>←</button>
            <button onClick={() => setMonthOffset(prev => prev + 1)} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #E4E9F0', background: '#fff', cursor: 'pointer', fontSize: 12 }}>→</button>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 600, color: '#9AA5B4', padding: '4px 0' }}>{d}</div>
          ))}
          {monthCells.map((day, index) => {
            if (!day) {
              return <div key={`empty-${index}`} style={{ padding: '7px 4px' }} />
            }

            const cellDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
            const cellKey = `${cellDate.getFullYear()}-${String(cellDate.getMonth() + 1).padStart(2, '0')}-${String(cellDate.getDate()).padStart(2, '0')}`
            const hasEvent = visibleAgendamentos.some(a => a.data === cellKey)
            const isSelected = cellKey === selectedKey

            return (
              <button
                key={day}
                onClick={() => setSelectedDate(cellDate)}
                style={{
                  textAlign: 'center',
                  padding: '8px 4px',
                  borderRadius: 7,
                  cursor: 'pointer',
                  position: 'relative',
                  background: isSelected ? '#1565D8' : '#fff',
                  color: isSelected ? '#fff' : '#0D1B2A',
                  border: isSelected ? '1px solid #1565D8' : '1px solid transparent',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {day}
                {hasEvent && (
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: isSelected ? '#fff' : '#1565D8', position: 'absolute', bottom: 3, left: '50%', transform: 'translateX(-50%)' }} />
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E4E9F0', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #E4E9F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: 14, color: '#0D1B2A' }}>
            {selectedDate.toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })}
          </div>
          {role === 'admin' && (
            <button onClick={() => setShowForm(true)} style={{ padding: '7px 14px', borderRadius: 8, background: '#1565D8', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>+ Novo Agendamento</button>
          )}
        </div>

        {dayAppointments.length === 0 ? (
          <div style={{ padding: '28px 20px', textAlign: 'center', color: '#9AA5B4', fontSize: 13, fontFamily: 'Inter, sans-serif' }}>
            {role === 'cliente' ? 'Ainda não há um agendamento confirmado para si. Pode indicar uma data preferida acima e o administrador vai confirmar.' : 'Nenhum agendamento para este dia.'}
          </div>
        ) : (
          dayAppointments.map((a, i) => (
            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderTop: i > 0 ? '1px solid #F1F5F9' : undefined }}>
              <div style={{ textAlign: 'center', minWidth: 50, background: '#EFF6FF', borderRadius: 9, padding: '8px 6px' }}>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 14, color: '#1565D8' }}>{a.hora}</div>
                <div style={{ fontSize: 9, color: '#6B7A90' }}>{a.duracao}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0D1B2A' }}>{a.servico}</div>
                <div style={{ fontSize: 12, color: '#6B7A90' }}>👤 {a.cliente} · 👷 {a.tecnico}</div>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#9AA5B4' }}>{a.data}</div>
                <Badge label={a.status === 'em_curso' ? 'Em Curso' : a.status === 'confirmado' ? 'Confirmado' : a.status === 'concluido' ? 'Concluído' : 'Cancelado'} cls={statusColors[a.status]} />
              </div>
            </div>
          ))
        )}
      </div>

      {showForm && role === 'admin' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(13,27,42,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowForm(false)}>
          <div style={{ width: 520, background: '#fff', borderRadius: 16, padding: 24 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 18, color: '#0D1B2A', marginBottom: 18 }}>Novo Agendamento</div>
            {formError && <div style={{ padding: '10px 12px', borderRadius: 8, background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', fontSize: 12, marginBottom: 12 }}>{formError}</div>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600 }}>Cliente</label>
                <input value={form.cliente} onChange={e => setForm({ ...form, cliente: e.target.value })} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E4E9F0', background: '#FAFBFC' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600 }}>Técnico</label>
                <input value={form.tecnico} onChange={e => setForm({ ...form, tecnico: e.target.value })} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E4E9F0', background: '#FAFBFC' }} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600 }}>Serviço</label>
                <input value={form.servico} onChange={e => setForm({ ...form, servico: e.target.value })} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E4E9F0', background: '#FAFBFC' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600 }}>Data</label>
                <input type="date" value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E4E9F0', background: '#FAFBFC' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600 }}>Hora</label>
                <input type="time" value={form.hora} onChange={e => setForm({ ...form, hora: e.target.value })} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E4E9F0', background: '#FAFBFC' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600 }}>Duração</label>
                <input value={form.duracao} onChange={e => setForm({ ...form, duracao: e.target.value })} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E4E9F0', background: '#FAFBFC' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600 }}>Estado</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Agendamento['status'] })} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E4E9F0', background: '#FAFBFC' }}>
                  {['confirmado', 'em_curso', 'concluido', 'cancelado'].map(item => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button onClick={() => setShowForm(false)} style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #E4E9F0', background: '#fff', color: '#6B7A90', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={handleCreateAgendamento} style={{ padding: '10px 16px', borderRadius: 8, border: 'none', background: '#1565D8', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Técnicos ──

function TecnicosPage({ role, tecnicos, onTecnicosChange }: { role: Role; tecnicos: Tecnico[]; onTecnicosChange: (next: Tecnico[]) => void }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ nome: '', especialidades: 'Eletricidade', telefone: '', email: '' })

  function handleCreate() {
    if (!form.nome.trim() || !form.email.trim()) return
    const novo: Tecnico = {
      id: Date.now(),
      nome: form.nome.trim(),
      especialidades: [form.especialidades],
      disponivel: true,
      avaliacao: 5,
      servicosConcluidos: 0,
      telefone: form.telefone || '+351 900 000 000',
      email: form.email.trim(),
    }
    onTecnicosChange([novo, ...tecnicos])
    setForm({ nome: '', especialidades: 'Eletricidade', telefone: '', email: '' })
    setShowForm(false)
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {role === 'admin' && (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => setShowForm(true)} style={{ padding: '8px 16px', borderRadius: 8, background: '#1565D8', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>+ Adicionar Técnico</button>
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {tecnicos.map(t => (
            <div key={t.id} style={{ background: '#fff', borderRadius: 12, border: '1px solid #E4E9F0', padding: '20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: t.disponivel ? '#E6F9F5' : '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>👷</div>
                <div>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 14, color: '#0D1B2A' }}>{t.nome}</div>
                  <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: t.disponivel ? '#E6F9F5' : '#F1F5F9', color: t.disponivel ? '#00B893' : '#9AA5B4', fontWeight: 600 }}>
                    {t.disponivel ? '● Disponível' : '○ Ocupado'}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {t.especialidades.map(esp => (
                  <span key={esp} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: '#EFF6FF', color: '#1565D8', fontWeight: 600 }}>{catIcons[esp]} {esp}</span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 14, borderTop: '1px solid #F1F5F9', paddingTop: 12 }}>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#0D1B2A', fontFamily: 'DM Sans, sans-serif' }}>{t.servicosConcluidos}</div>
                  <div style={{ fontSize: 10, color: '#9AA5B4' }}>Serviços</div>
                </div>
                <div style={{ width: 1, background: '#F1F5F9' }} />
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0D1B2A' }}>⭐ {t.avaliacao}</div>
                  <div style={{ fontSize: 10, color: '#9AA5B4' }}>Avaliação</div>
                </div>
              </div>
              <div style={{ fontSize: 11, color: '#6B7A90' }}>📞 {t.telefone}<br />✉️ {t.email}</div>
            </div>
          ))}
        </div>
      </div>

      {showForm && role === 'admin' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(13,27,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setShowForm(false)}>
          <div style={{ width: 420, background: '#fff', borderRadius: 16, padding: 24 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 20, color: '#0D1B2A', marginBottom: 16 }}>Adicionar técnico</div>
            <div style={{ display: 'grid', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#0D1B2A', marginBottom: 6 }}>Nome</label>
                <input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E4E9F0', background: '#FAFBFC' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#0D1B2A', marginBottom: 6 }}>Especialidade</label>
                <select value={form.especialidades} onChange={e => setForm({ ...form, especialidades: e.target.value })} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E4E9F0', background: '#FAFBFC' }}>
                  {['Eletricidade', 'Canalização', 'Climatização', 'Carpintaria', 'Refrigeração', 'Montagem'].map(item => <option key={item}>{item}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#0D1B2A', marginBottom: 6 }}>Telefone</label>
                <input value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E4E9F0', background: '#FAFBFC' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#0D1B2A', marginBottom: 6 }}>Email</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E4E9F0', background: '#FAFBFC' }} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 22 }}>
              <button onClick={() => setShowForm(false)} style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #E4E9F0', background: '#fff', color: '#6B7A90', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={handleCreate} style={{ padding: '10px 16px', borderRadius: 8, border: 'none', background: '#1565D8', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ── Pagamentos ──

function PagamentosPage({ role, userName, pagamentos, onPagamentosChange }: { role: Role; userName: string; pagamentos: Pagamento[]; onPagamentosChange: (next: Pagamento[]) => void }) {
  const pagamentosVisiveis = role === 'cliente'
    ? pagamentos.filter(p => p.cliente === userName)
    : pagamentos

  const total = pagamentosVisiveis.reduce((s, p) => s + p.valor, 0)
  const pago = pagamentosVisiveis.filter(p => p.status === 'pago').reduce((s, p) => s + p.valor, 0)
  const pendente = pagamentosVisiveis.filter(p => p.status === 'pendente').reduce((s, p) => s + p.valor, 0)

  function handleSetPago(id: string) {
    onPagamentosChange(pagamentos.map(p => p.id === id ? { ...p, status: 'pago' } : p))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        <StatCard label="Total Faturado" value={`€${total.toLocaleString('pt-PT')}`} icon="💶" color="#EFF6FF" />
        <StatCard label="Recebido" value={`€${pago.toLocaleString('pt-PT')}`} icon="✅" color="#F0FDF4" delta={`${pagamentosVisiveis.filter(p => p.status === 'pago').length} pagamentos`} />
        <StatCard label="Pendente" value={`€${pendente.toLocaleString('pt-PT')}`} icon="⏳" color="#FFFBEB" delta={`${pagamentosVisiveis.filter(p => p.status === 'pendente').length} por receber`} />
      </div>
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E4E9F0', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #E4E9F0', fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: 14, color: '#0D1B2A' }}>Registo de Pagamentos</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F8FAFB' }}>
              {['ID', 'Cliente', 'Serviço', 'Valor', 'Data', 'Método', 'Estado', role === 'admin' ? 'Ação' : ''].filter(Boolean).map(h => (
                <th key={String(h)} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: '#9AA5B4', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pagamentosVisiveis.map((p, i) => (
              <tr key={p.id} style={{ borderTop: i > 0 ? '1px solid #F1F5F9' : undefined }}>
                <td style={{ padding: '12px 16px', fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#6B7A90' }}>{p.id}</td>
                <td style={{ padding: '12px 16px', fontSize: 13, color: '#0D1B2A', fontWeight: 500 }}>{p.cliente}</td>
                <td style={{ padding: '12px 16px', fontSize: 12, color: '#6B7A90' }}>{p.servico}</td>
                <td style={{ padding: '12px 16px', fontSize: 14, fontFamily: 'JetBrains Mono, monospace', color: '#0D1B2A', fontWeight: 700 }}>€{p.valor.toFixed(2)}</td>
                <td style={{ padding: '12px 16px', fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#9AA5B4' }}>{p.data}</td>
                <td style={{ padding: '12px 16px', fontSize: 12, color: '#6B7A90' }}>{p.metodo}</td>
                <td style={{ padding: '12px 16px' }}><Badge label={p.status === 'pago' ? 'Pago' : p.status === 'pendente' ? 'Pendente' : 'Falhado'} cls={statusColors[p.status]} /></td>
                {role === 'admin' && (
                  <td style={{ padding: '12px 16px' }}>
                    {p.status !== 'pago' && (
                      <button onClick={() => handleSetPago(p.id)} style={{ padding: '7px 10px', borderRadius: 8, background: '#1565D8', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>Marcar pago</button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Categorias ──

const categoriasSeed = [
  { nome: 'Canalização', icon: '🔧', total: 2, desc: 'Tubagens, fugas e instalações hidráulicas' },
  { nome: 'Eletricidade', icon: '⚡', total: 2, desc: 'Instalações elétricas e quadros' },
  { nome: 'Carpintaria', icon: '🪚', total: 1, desc: 'Móveis, estruturas e acabamentos em madeira' },
  { nome: 'Montagem', icon: '🛠️', total: 1, desc: 'Montagem de móveis e equipamentos' },
  { nome: 'Climatização', icon: '❄️', total: 1, desc: 'Ar condicionado e ventilação' },
  { nome: 'Refrigeração', icon: '🧊', total: 1, desc: 'Frigoríficos e equipamentos de refrigeração' },
  { nome: 'Manutenção', icon: '🔩', total: 0, desc: 'Manutenções preventivas e corretivas' },
  { nome: 'Pequenas Reparações', icon: '🧰', total: 0, desc: 'Ajustes e reparações rápidas' },
]

function CategoriasPage({ role, categorias, onCategoriasChange }: { role: Role; categorias: typeof categoriasSeed; onCategoriasChange: (next: typeof categoriasSeed) => void }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ nome: '', icon: '🧰', desc: '' })

  function handleCreate() {
    if (!form.nome.trim()) return
    onCategoriasChange([
      { nome: form.nome.trim(), icon: form.icon || '🧰', total: 0, desc: form.desc.trim() || 'Nova categoria criada.' },
      ...categorias,
    ])
    setForm({ nome: '', icon: '🧰', desc: '' })
    setShowForm(false)
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {role === 'admin' && (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => setShowForm(true)} style={{ padding: '8px 16px', borderRadius: 8, background: '#1565D8', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>+ Nova Categoria</button>
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {categorias.map(c => (
            <div key={c.nome} style={{ background: '#fff', borderRadius: 12, border: '1px solid #E4E9F0', padding: '20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>{c.icon}</div>
              <div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 15, color: '#0D1B2A' }}>{c.nome}</div>
                <div style={{ fontSize: 12, color: '#6B7A90', marginTop: 4 }}>{c.desc}</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid #F1F5F9' }}>
                <span style={{ fontSize: 12, color: '#9AA5B4' }}>{c.total} pedidos ativos</span>
                <button style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, border: '1px solid #E4E9F0', background: '#fff', cursor: 'pointer', color: '#6B7A90' }}>Editar</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showForm && role === 'admin' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(13,27,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setShowForm(false)}>
          <div style={{ width: 420, background: '#fff', borderRadius: 16, padding: 24 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 20, color: '#0D1B2A', marginBottom: 16 }}>Nova categoria</div>
            <div style={{ display: 'grid', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#0D1B2A', marginBottom: 6 }}>Nome</label>
                <input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E4E9F0', background: '#FAFBFC' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#0D1B2A', marginBottom: 6 }}>Ícone</label>
                <input value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E4E9F0', background: '#FAFBFC' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#0D1B2A', marginBottom: 6 }}>Descrição</label>
                <textarea value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })} rows={3} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E4E9F0', background: '#FAFBFC', resize: 'vertical' }} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 22 }}>
              <button onClick={() => setShowForm(false)} style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #E4E9F0', background: '#fff', color: '#6B7A90', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={handleCreate} style={{ padding: '10px 16px', borderRadius: 8, border: 'none', background: '#1565D8', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ── Clientes ──

const clientesDataInicial = [
  { id: 1, nome: 'Ana Ferreira', email: 'ana@email.com', telefone: '+351 910 111 222', pedidos: 1, gasto: 320 },
  { id: 2, nome: 'João Rodrigues', email: 'joao@email.com', telefone: '+351 911 222 333', pedidos: 1, gasto: 185 },
  { id: 3, nome: 'Marta Costa', email: 'marta@email.com', telefone: '+351 912 333 444', pedidos: 1, gasto: 1240 },
  { id: 4, nome: 'Pedro Alves', email: 'pedro@email.com', telefone: '+351 913 444 555', pedidos: 1, gasto: 0 },
  { id: 5, nome: 'Sofia Lima', email: 'sofia@email.com', telefone: '+351 914 555 666', pedidos: 1, gasto: 580 },
  { id: 6, nome: 'Rui Monteiro', email: 'rui@email.com', telefone: '+351 915 666 777', pedidos: 1, gasto: 95 },
]

function ClientesPage({ role }: { role: Role }) {
  const [clientes, setClientes] = useState(clientesDataInicial)
  const [showForm, setShowForm] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [editingClient, setEditingClient] = useState<{ id: number; nome: string; email: string; telefone: string; pedidos: number; gasto: number } | null>(null)
  const [selectedClient, setSelectedClient] = useState<{ id: number; nome: string; email: string; telefone: string; pedidos: number; gasto: number } | null>(null)
  const [form, setForm] = useState({ nome: '', email: '', telefone: '', pedidos: 1, gasto: 0 })

  function openCreateModal() {
    setEditingClient(null)
    setForm({ nome: '', email: '', telefone: '', pedidos: 1, gasto: 0 })
    setShowForm(true)
  }

  function openEditModal(cliente: typeof clientes[number]) {
    setEditingClient(cliente)
    setForm({
      nome: cliente.nome,
      email: cliente.email,
      telefone: cliente.telefone,
      pedidos: cliente.pedidos,
      gasto: cliente.gasto,
    })
    setShowForm(true)
  }

  function handleSubmit() {
    if (!form.nome.trim() || !form.email.trim() || !form.telefone.trim()) return

    if (editingClient) {
      setClientes(prev => prev.map(c => c.id === editingClient.id ? { ...c, ...form, nome: form.nome.trim(), email: form.email.trim(), telefone: form.telefone.trim() } : c))
    } else {
      const novoCliente = {
        id: Date.now(),
        nome: form.nome.trim(),
        email: form.email.trim(),
        telefone: form.telefone.trim(),
        pedidos: Number(form.pedidos) || 0,
        gasto: Number(form.gasto) || 0,
      }
      setClientes(prev => [novoCliente, ...prev])
    }

    setShowForm(false)
    setEditingClient(null)
    setForm({ nome: '', email: '', telefone: '', pedidos: 1, gasto: 0 })
  }

  return (
    <>
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E4E9F0', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #E4E9F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: 14, color: '#0D1B2A' }}>Clientes Registados</div>
          {role === 'admin' && (
            <button
              onClick={openCreateModal}
              style={{ padding: '7px 14px', borderRadius: 8, background: '#1565D8', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
            >
              + Adicionar
            </button>
          )}
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F8FAFB' }}>
              {['Nome', 'Email', 'Telefone', 'Pedidos', 'Total Gasto', 'Ações'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: '#9AA5B4', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {clientes.map((c, i) => (
              <tr key={c.id} style={{ borderTop: i > 0 ? '1px solid #F1F5F9' : undefined }}>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#1565D8', fontWeight: 700, flexShrink: 0 }}>
                      {c.nome.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#0D1B2A' }}>{c.nome}</span>
                  </div>
                </td>
                <td style={{ padding: '12px 16px', fontSize: 12, color: '#6B7A90' }}>{c.email}</td>
                <td style={{ padding: '12px 16px', fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#6B7A90' }}>{c.telefone}</td>
                <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 700, color: '#0D1B2A', textAlign: 'center' }}>{c.pedidos}</td>
                <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: c.gasto > 0 ? '#0D1B2A' : '#9AA5B4' }}>€{c.gasto.toFixed(2)}</td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: 5 }}>
                    <button
                      onClick={() => { setSelectedClient(c); setShowDetails(true) }}
                      style={{ fontSize: 11, padding: '4px 9px', borderRadius: 6, border: '1px solid #E4E9F0', background: '#fff', cursor: 'pointer', color: '#6B7A90' }}
                    >
                      Ver
                    </button>
                    {role === 'admin' && (
                      <button
                        onClick={() => openEditModal(c)}
                        style={{ fontSize: 11, padding: '4px 9px', borderRadius: 6, border: '1px solid #E4E9F0', background: '#fff', cursor: 'pointer', color: '#6B7A90' }}
                      >
                        Editar
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(13,27,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setShowForm(false)}>
          <div style={{ width: 460, background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 16px 50px rgba(13,27,42,0.24)' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 20, color: '#0D1B2A', marginBottom: 18 }}>
              {editingClient ? 'Editar cliente' : 'Adicionar cliente'}
            </div>

            <div style={{ display: 'grid', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#0D1B2A', marginBottom: 6 }}>Nome</label>
                <input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E4E9F0', background: '#FAFBFC', fontSize: 13, color: '#0D1B2A', outline: 'none' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#0D1B2A', marginBottom: 6 }}>Email</label>
                <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E4E9F0', background: '#FAFBFC', fontSize: 13, color: '#0D1B2A', outline: 'none' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#0D1B2A', marginBottom: 6 }}>Telefone</label>
                <input value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E4E9F0', background: '#FAFBFC', fontSize: 13, color: '#0D1B2A', outline: 'none' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#0D1B2A', marginBottom: 6 }}>Pedidos</label>
                  <input type="number" min={0} value={form.pedidos} onChange={e => setForm({ ...form, pedidos: Number(e.target.value) })} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E4E9F0', background: '#FAFBFC', fontSize: 13, color: '#0D1B2A', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#0D1B2A', marginBottom: 6 }}>Total gasto</label>
                  <input type="number" min={0} step="0.01" value={form.gasto} onChange={e => setForm({ ...form, gasto: Number(e.target.value) })} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E4E9F0', background: '#FAFBFC', fontSize: 13, color: '#0D1B2A', outline: 'none' }} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 22 }}>
              <button onClick={() => setShowForm(false)} style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #E4E9F0', background: '#fff', color: '#6B7A90', cursor: 'pointer', fontSize: 13 }}>Cancelar</button>
              <button onClick={handleSubmit} style={{ padding: '10px 16px', borderRadius: 8, border: 'none', background: '#1565D8', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                {editingClient ? 'Guardar alterações' : 'Adicionar cliente'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDetails && selectedClient && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(13,27,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setShowDetails(false)}>
          <div style={{ width: 420, background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 16px 50px rgba(13,27,42,0.24)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#1565D8', fontWeight: 700 }}>
                  {selectedClient.nome.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 18, color: '#0D1B2A' }}>{selectedClient.nome}</div>
                  <div style={{ fontSize: 12, color: '#6B7A90' }}>Cliente registado</div>
                </div>
              </div>
              <button onClick={() => setShowDetails(false)} style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid #E4E9F0', background: '#fff', cursor: 'pointer', color: '#6B7A90' }}>×</button>
            </div>

            <div style={{ display: 'grid', gap: 12, color: '#0D1B2A', fontSize: 14 }}>
              <div><strong>Email:</strong> {selectedClient.email}</div>
              <div><strong>Telefone:</strong> {selectedClient.telefone}</div>
              <div><strong>Pedidos:</strong> {selectedClient.pedidos}</div>
              <div><strong>Total gasto:</strong> €{selectedClient.gasto.toFixed(2)}</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 22 }}>
              <button onClick={() => setShowDetails(false)} style={{ padding: '10px 16px', borderRadius: 8, border: 'none', background: '#1565D8', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
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
  const [users, setUsers] = useState<UserAccount[]>(() => readStored(storageKeys.users, [
    { nome: 'Diana Sousa', email: 'admin@resolva.pt', password: 'admin123', role: 'admin' },
    { nome: 'Carlos Mendes', email: 'tecnico@resolva.pt', password: 'tecnico123', role: 'tecnico' },
    { nome: 'Ana Ferreira', email: 'ana@resolva.pt', password: 'cliente123', role: 'cliente' },
  ]))
  const [pedidos, setPedidos] = useState<Pedido[]>(() => readStored(storageKeys.pedidos, pedidosData))
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>(() => readStored(storageKeys.orcamentos, orcamentosData))
  const [categorias, setCategorias] = useState<typeof categoriasSeed>(() => readStored(storageKeys.categorias, categoriasSeed))
  const [tecnicos, setTecnicos] = useState<Tecnico[]>(() => readStored(storageKeys.tecnicos, tecnicosData))
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>(() => readStored(storageKeys.agendamentos, agendamentosData))
  const [pagamentos, setPagamentos] = useState<Pagamento[]>(() => readStored(storageKeys.pagamentos, pagamentosData))
  const [tecnicoDisponibilidade, setTecnicoDisponibilidade] = useState<string[]>(() => readStored(storageKeys.tecnicoDisponibilidade, []))

  useEffect(() => {
    writeStored(storageKeys.users, users)
  }, [users])

  useEffect(() => {
    writeStored(storageKeys.pedidos, pedidos)
  }, [pedidos])

  useEffect(() => {
    writeStored(storageKeys.orcamentos, orcamentos)
  }, [orcamentos])

  useEffect(() => {
    writeStored(storageKeys.categorias, categorias)
  }, [categorias])

  useEffect(() => {
    writeStored(storageKeys.tecnicos, tecnicos)
  }, [tecnicos])

  useEffect(() => {
    writeStored(storageKeys.agendamentos, agendamentos)
  }, [agendamentos])

  useEffect(() => {
    writeStored(storageKeys.pagamentos, pagamentos)
  }, [pagamentos])

  useEffect(() => {
    writeStored(storageKeys.tecnicoDisponibilidade, tecnicoDisponibilidade)
  }, [tecnicoDisponibilidade])

  function handleAuthSuccess(user: AuthUser) {
    setAuthUser(user)
    setScreen('app')
    setPage('dashboard')
  }

  function handleLogout() {
    setAuthUser(null)
    setScreen('landing')
  }

  if (screen === 'landing') {
    return <LandingPage onLogin={() => setScreen('login')} onRegister={() => setScreen('register')} />
  }

  if (screen === 'login') {
    return <LoginPage users={users} onSuccess={handleAuthSuccess} onRegister={() => setScreen('register')} onForgot={() => setScreen('forgot')} onBack={() => setScreen('landing')} />
  }

  if (screen === 'register') {
    return <RegisterPage users={users} onSuccess={(user, password = '123456') => { setUsers(prev => [{ nome: user.nome, email: user.email, password, role: user.role }, ...prev]); handleAuthSuccess(user) }} onLogin={() => setScreen('login')} onBack={() => setScreen('landing')} />
  }

  if (screen === 'forgot') {
    return <ForgotPage onBack={() => setScreen('landing')} onLogin={() => setScreen('login')} />
  }

  const user = authUser!
  const { title, subtitle } = pageTitles[page]

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#F4F6FA' }}>
      <Sidebar page={page} setPage={setPage} role={user.role} user={user} onLogout={handleLogout} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar title={title} subtitle={subtitle} />
        <main style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
          {page === 'dashboard' && <DashboardPage role={user.role} pedidos={pedidos} userName={user.nome} />}
          {page === 'pedidos' && <PedidosPage role={user.role} pedidos={pedidos} onPedidosChange={setPedidos} userName={user.nome} agendamentos={agendamentos} onAgendamentosChange={setAgendamentos} />}
          {page === 'orcamentos' && <OrcamentosPage role={user.role} orcamentos={orcamentos} onOrcamentosChange={setOrcamentos} pedidos={pedidos} onPedidosChange={setPedidos} pagamentos={pagamentos} onPagamentosChange={setPagamentos} />}
          {page === 'agendamentos' && <AgendamentosPage role={user.role} agendamentos={agendamentos} onAgendamentosChange={setAgendamentos} disponibilidade={tecnicoDisponibilidade} onDisponibilidadeChange={setTecnicoDisponibilidade} userName={user.nome} />}
          {page === 'tecnicos' && <TecnicosPage role={user.role} tecnicos={tecnicos} onTecnicosChange={setTecnicos} />}
          {page === 'clientes' && <ClientesPage role={user.role} />}
          {page === 'pagamentos' && <PagamentosPage role={user.role} userName={user.nome} pagamentos={pagamentos} onPagamentosChange={setPagamentos} />}
          {page === 'categorias' && <CategoriasPage role={user.role} categorias={categorias} onCategoriasChange={setCategorias} />}
        </main>
      </div>
    </div>
  )
}
