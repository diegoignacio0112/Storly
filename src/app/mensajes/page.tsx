'use client'
import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Conversacion {
  id: number
  de_usuario_id: number
  para_usuario_id: number
  de_nombre: string
  para_nombre: string
  espacio_id: number
  espacio_titulo: string
  espacio_imagenes: string[] | null
  mensaje: string
  created_at: string
  no_leidos: number
}

interface Mensaje {
  id: number
  de_usuario_id: number
  de_nombre: string
  mensaje: string
  created_at: string
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'ahora'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

export default function MensajesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [convs, setConvs] = useState<Conversacion[]>([])
  const [activeConv, setActiveConv] = useState<Conversacion | null>(null)
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login')
  }, [status, router])

  const meId = session?.user?.id ? Number(session.user.id) : null

  // Load conversations
  const loadConvs = () => {
    fetch('/api/mensajes?conversaciones=true')
      .then(r => r.json())
      .then(d => Array.isArray(d) && setConvs(d))
  }

  useEffect(() => {
    if (!session?.user) return
    loadConvs()
    const t = setInterval(loadConvs, 5000)
    return () => clearInterval(t)
  }, [session])

  // Load messages for active conversation
  const loadMensajes = () => {
    if (!activeConv || !meId) return
    const otherId = activeConv.de_usuario_id === meId
      ? activeConv.para_usuario_id
      : activeConv.de_usuario_id
    fetch(`/api/mensajes?espacio_id=${activeConv.espacio_id}&otro_usuario_id=${otherId}`)
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d)) {
          setMensajes(d)
          bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
        }
      })
  }

  useEffect(() => {
    if (!activeConv) return
    loadMensajes()
    const t = setInterval(loadMensajes, 3000)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConv])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

  const send = async () => {
    if (!text.trim() || !activeConv || !meId) return
    setSending(true)
    const otherId = activeConv.de_usuario_id === meId
      ? activeConv.para_usuario_id
      : activeConv.de_usuario_id
    await fetch('/api/mensajes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        para_usuario_id: otherId,
        espacio_id: activeConv.espacio_id,
        mensaje: text.trim(),
      }),
    })
    setText('')
    setSending(false)
    loadMensajes()
    loadConvs()
  }

  if (status === 'loading') return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0f] text-white overflow-hidden">

      {/* nav */}
      <nav className="flex-shrink-0 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl z-40">
        <div className="px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <span className="text-black font-black text-xs">S</span>
            </div>
            <span className="font-bold tracking-tight">Storly</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-sm text-white/50 hover:text-white transition-colors">Dashboard</Link>
            <Link href="/perfil" className="text-sm text-white/50 hover:text-white transition-colors">Perfil</Link>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex overflow-hidden">

        {/* Sidebar: conversations list */}
        <div className={`w-full md:w-[300px] flex-shrink-0 border-r border-white/5 flex flex-col ${activeConv ? 'hidden md:flex' : 'flex'}`}>
          <div className="px-4 py-3 border-b border-white/5">
            <h1 className="font-black text-lg">Mensajes</h1>
          </div>
          <div className="flex-1 overflow-y-auto">
            {convs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <span className="text-4xl mb-3">💬</span>
                <p className="text-white/30 text-sm">No tienes mensajes aún</p>
                <Link href="/explorar" className="mt-3 text-amber-400 hover:text-amber-300 text-xs transition-colors">
                  Explorar espacios →
                </Link>
              </div>
            ) : convs.map((c, i) => {
              const isActive = activeConv?.id === c.id
              const otherName = c.de_usuario_id === meId ? c.para_nombre : c.de_nombre
              return (
                <button
                  key={i}
                  onClick={() => setActiveConv(c)}
                  className={`w-full text-left px-4 py-3 border-b border-white/5 transition-all ${isActive ? 'bg-white/5' : 'hover:bg-white/3'}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#2D4A3E] flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {otherName?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-white truncate">{otherName}</span>
                        <span className="text-xs text-white/25 flex-shrink-0 ml-2">{timeAgo(c.created_at)}</span>
                      </div>
                      <p className="text-xs text-white/40 truncate mt-0.5">{c.espacio_titulo}</p>
                      <p className="text-xs text-white/30 truncate">{c.mensaje}</p>
                    </div>
                    {c.no_leidos > 0 && (
                      <div className="w-5 h-5 bg-amber-400 text-black rounded-full text-xs font-black flex items-center justify-center flex-shrink-0">
                        {c.no_leidos}
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Chat panel */}
        {activeConv ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Chat header */}
            <div className="flex-shrink-0 px-4 py-3 border-b border-white/5 flex items-center gap-3">
              <button
                onClick={() => setActiveConv(null)}
                className="md:hidden text-white/40 hover:text-white transition-colors mr-1"
              >
                ←
              </button>
              <div className="w-9 h-9 rounded-full bg-[#2D4A3E] flex items-center justify-center text-sm font-bold flex-shrink-0">
                {(activeConv.de_usuario_id === meId ? activeConv.para_nombre : activeConv.de_nombre)?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-bold text-white">
                  {activeConv.de_usuario_id === meId ? activeConv.para_nombre : activeConv.de_nombre}
                </p>
                <Link href={`/espacio/${activeConv.espacio_id}`} className="text-xs text-amber-400 hover:text-amber-300 transition-colors">
                  {activeConv.espacio_titulo} →
                </Link>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {mensajes.map(m => {
                const isMe = m.de_usuario_id === meId
                return (
                  <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} gap-2`}>
                    {!isMe && (
                      <div className="w-7 h-7 rounded-full bg-[#2D4A3E] flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1">
                        {m.de_nombre?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm ${
                        isMe
                          ? 'bg-amber-400 text-black rounded-br-sm'
                          : 'bg-white/8 text-white rounded-bl-sm'
                      }`}>
                        {m.mensaje}
                      </div>
                      <p className={`text-xs text-white/20 mt-1 ${isMe ? 'text-right' : ''}`}>
                        {timeAgo(m.created_at)}
                      </p>
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="flex-shrink-0 p-4 border-t border-white/5 flex gap-2">
              <input
                type="text"
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                placeholder="Escribe un mensaje..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-amber-400/50 transition-all"
              />
              <button
                onClick={send}
                disabled={sending || !text.trim()}
                className="bg-amber-400 text-black font-bold px-4 py-2.5 rounded-xl hover:bg-amber-300 transition-all disabled:opacity-40 text-sm"
              >
                {sending ? '...' : '→'}
              </button>
            </div>
          </div>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center flex-col gap-3">
            <span className="text-5xl">💬</span>
            <p className="text-white/30 text-sm">Selecciona una conversación</p>
          </div>
        )}
      </div>
    </div>
  )
}
