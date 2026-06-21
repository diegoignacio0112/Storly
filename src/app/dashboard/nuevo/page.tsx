'use client'
import { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const LocationPreviewMap = dynamic(() => import('./LocationPreviewMap'), { ssr: false })

const COMUNAS = [
  'Cerrillos','Cerro Navia','Conchalí','El Bosque','Estación Central',
  'Huechuraba','Independencia','La Cisterna','La Florida','La Granja',
  'La Pintana','La Reina','Las Condes','Lo Barnechea','Lo Espejo',
  'Lo Prado','Macul','Maipú','Ñuñoa','Pedro Aguirre Cerda','Peñalolén',
  'Providencia','Pudahuel','Puente Alto','Quilicura','Quinta Normal',
  'Recoleta','Renca','San Joaquín','San Miguel','San Ramón',
  'Santiago','Vitacura',
]

const TIPO_OPTS = [
  { value: 'bodega', label: 'Bodega' },
  { value: 'garage', label: 'Garage' },
  { value: 'patio', label: 'Patio' },
  { value: 'pieza', label: 'Pieza' },
  { value: 'estacionamiento', label: 'Estacionamiento' },
  { value: 'otro', label: 'Otro' },
]

const CARACTERISTICAS_OPTS = [
  { key: 'iluminacion', label: 'Iluminación', icon: '💡' },
  { key: 'ventilacion', label: 'Ventilación', icon: '🌬️' },
  { key: 'acceso_vehicular', label: 'Acceso vehicular', icon: '🚗' },
  { key: 'seguridad_24hrs', label: 'Seguridad 24hrs', icon: '🛡️' },
  { key: 'camaras', label: 'Cámaras', icon: '📷' },
  { key: 'candado_propio', label: 'Candado propio', icon: '🔒' },
]

function Select({
  value, onChange, options, placeholder = 'Selecciona...',
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selected = options.find(o => o.value === value)

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-sm text-left flex items-center justify-between transition-all focus:outline-none ${
          open ? 'border-amber-400/50 bg-white/8' : 'border-white/10 hover:border-white/20'
        }`}
      >
        <span className={selected ? 'text-white' : 'text-white/25'}>{selected?.label ?? placeholder}</span>
        <svg
          className={`w-4 h-4 text-white/30 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#0a0a0f] border border-white/10 rounded-xl overflow-hidden z-50 shadow-2xl shadow-black/60 max-h-56 overflow-y-auto">
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false) }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                value === opt.value
                  ? 'bg-amber-400/10 text-amber-300 font-medium'
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function compressImage(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const MAX = 900
        let { width, height } = img
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round(height * MAX / width); width = MAX }
          else { width = Math.round(width * MAX / height); height = MAX }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width; canvas.height = height
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.72))
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  })
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white/3 border border-white/8 rounded-2xl p-6 space-y-5">
      <h2 className="text-xs font-semibold text-white/40 uppercase tracking-widest pb-2 border-b border-white/5">{title}</h2>
      {children}
    </div>
  )
}

function Field({ label, optional, children }: { label: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-white/50 uppercase tracking-widest mb-2">
        {label}{optional && <span className="normal-case tracking-normal text-white/25 ml-1">(opcional)</span>}
      </label>
      {children}
    </div>
  )
}

const inputCls = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber-400/50 focus:bg-white/8 transition-all'

export default function NuevoEspacio() {
  const { data: session } = useSession()
  const router = useRouter()

  const [form, setForm] = useState({
    titulo: '', tipo: 'bodega', descripcion: '',
    metros_cuadrados: '', precio_mensual: '',
    direccion: '', comuna: '',
    disponible: true,
    nombre_contacto: '', telefono_contacto: '', email_contacto: '',
    horario_acceso: '', condiciones: '',
  })
  const [caracteristicas, setCaracteristicas] = useState<string[]>([])
  const [imagenes, setImagenes] = useState<string[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [geoStatus, setGeoStatus] = useState<'idle' | 'loading' | 'ok' | 'fallback' | 'error'>('idle')

  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }))

  // Geocode comuna + direccion as the user fills them in, so they can confirm
  // the pin on the preview map before publishing.
  useEffect(() => {
    const handle = setTimeout(() => {
      if (!form.comuna) { setCoords(null); setGeoStatus('idle'); return }

      setGeoStatus('loading')
      fetch('/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comuna: form.comuna, direccion: form.direccion }),
      })
        .then(async r => ({ ok: r.ok, data: await r.json() }))
        .then(({ ok, data }) => {
          if (ok) {
            setCoords({ lat: data.lat, lng: data.lng })
            setGeoStatus(data.source === 'nominatim' ? 'ok' : 'fallback')
          } else {
            setCoords(null); setGeoStatus('error')
          }
        })
        .catch(() => { setCoords(null); setGeoStatus('error') })
    }, 800)

    return () => clearTimeout(handle)
  }, [form.comuna, form.direccion])

  const toggleCaracteristica = (key: string) =>
    setCaracteristicas(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])

  const handleImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, 8)
    const compressed = await Promise.all(files.map(compressImage))
    setImagenes(prev => [...prev, ...compressed].slice(0, 8))
  }

  const removeImage = (i: number) => setImagenes(prev => prev.filter((_, idx) => idx !== i))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session?.user?.id) return
    if (!form.comuna) { setError('Por favor selecciona una comuna'); return }
    setLoading(true); setError('')

    const res = await fetch('/api/espacios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        metros_cuadrados: form.metros_cuadrados ? parseFloat(form.metros_cuadrados) : null,
        precio_mensual: parseInt(form.precio_mensual),
        caracteristicas: caracteristicas.length ? caracteristicas : null,
        imagenes: imagenes.length ? imagenes : null,
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
      })
    })

    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Error al publicar'); setLoading(false); return }
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <nav className="border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <span className="text-black font-black text-sm">S</span>
            </div>
            <span className="font-bold text-lg tracking-tight">Storly</span>
          </Link>
          <Link href="/dashboard" className="text-sm text-white/40 hover:text-white/70 transition-colors">
            ← Volver al dashboard
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-8">
          <p className="text-amber-400 text-xs font-semibold uppercase tracking-widest mb-1">Nuevo espacio</p>
          <h1 className="text-3xl font-black tracking-tight">Publica tu espacio</h1>
          <p className="text-white/40 text-sm mt-2">Completa los datos para empezar a recibir arrendatarios.</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-4 mb-6 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Section title="Información básica">
            <Field label="Título del espacio">
              <input type="text" required className={inputCls} placeholder="Ej: Bodega climatizada Las Condes"
                value={form.titulo} onChange={e => set('titulo', e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Tipo de espacio">
                <Select
                  value={form.tipo}
                  onChange={v => set('tipo', v)}
                  options={TIPO_OPTS}
                />
              </Field>
              <Field label="Disponibilidad">
                <button
                  type="button"
                  onClick={() => set('disponible', !form.disponible)}
                  className={`w-full py-3 px-4 rounded-xl border text-sm font-medium transition-all flex items-center gap-2 ${
                    form.disponible
                      ? 'bg-green-400/10 border-green-400/30 text-green-400'
                      : 'bg-white/5 border-white/10 text-white/40'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${form.disponible ? 'bg-green-400 border-green-400' : 'border-white/20'}`} />
                  {form.disponible ? 'Disponible ahora' : 'No disponible'}
                </button>
              </Field>
            </div>
            <Field label="Descripción detallada" optional>
              <textarea rows={4} className={inputCls} placeholder="Describe tu espacio: acceso, estado, características destacadas..."
                value={form.descripcion} onChange={e => set('descripcion', e.target.value)} />
            </Field>
          </Section>

          <Section title="Detalles del espacio">
            <div className="bg-white/3 border border-white/8 rounded-xl p-4">
              <p className="text-xs text-white/40 uppercase tracking-widest mb-3">Precios de referencia Storly (comisión 12%)</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { tier: 'Pequeño', size: '1–2 m³', price: '$35.000', net: '$30.800' },
                  { tier: 'Mediano', size: '2–4 m³', price: '$48.500', net: '$42.680' },
                  { tier: 'Grande', size: '4–6 m³', price: '$65.000', net: '$57.200' },
                ].map((t) => (
                  <div key={t.tier} className="text-center bg-[#2D4A3E]/20 border border-[#2D4A3E]/40 rounded-lg p-3">
                    <div className="text-xs text-[#C9A84C] font-bold uppercase mb-1">{t.tier}</div>
                    <div className="text-xs text-white/40 mb-2">{t.size}</div>
                    <div className="text-sm font-bold text-white">{t.price}<span className="text-white/30 text-xs">/mes</span></div>
                    <div className="text-xs text-[#9BB896] mt-1">neto {t.net}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Metros cuadrados" optional>
                <input type="number" min="1" className={inputCls} placeholder="Ej: 25"
                  value={form.metros_cuadrados} onChange={e => set('metros_cuadrados', e.target.value)} />
              </Field>
              <Field label="Precio mensual (CLP)">
                <input type="number" required min="1" className={inputCls} placeholder="Ej: 150000"
                  value={form.precio_mensual} onChange={e => set('precio_mensual', e.target.value)} />
              </Field>
            </div>
            {form.precio_mensual && !isNaN(parseInt(form.precio_mensual)) && (
              <div className="bg-[#2D4A3E]/40 border border-[#2D4A3E]/60 rounded-xl px-4 py-3 flex items-center justify-between">
                <span className="text-xs text-[#9BB896] uppercase tracking-wider">Tu ingreso neto estimado (88%)</span>
                <span className="text-[#C8D9B0] font-bold">${Math.round(parseInt(form.precio_mensual) * 0.88).toLocaleString('es-CL')}/mes</span>
              </div>
            )}
          </Section>

          <Section title="Ubicación">
            <Field label="Dirección completa" optional>
              <input type="text" className={inputCls} placeholder="Ej: Av. Apoquindo 3000, Piso 2"
                value={form.direccion} onChange={e => set('direccion', e.target.value)} />
            </Field>
            <Field label="Comuna">
              <Select
                value={form.comuna}
                onChange={v => set('comuna', v)}
                options={COMUNAS.map(c => ({ value: c, label: c }))}
                placeholder="Selecciona una comuna"
              />
            </Field>

            {geoStatus === 'loading' && (
              <p className="text-xs text-white/30 flex items-center gap-2">
                <span className="w-3 h-3 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
                Ubicando dirección en el mapa...
              </p>
            )}

            {coords && (geoStatus === 'ok' || geoStatus === 'fallback') && (
              <div className="space-y-2">
                <LocationPreviewMap lat={coords.lat} lng={coords.lng} />
                <p className="text-xs text-white/30">
                  {geoStatus === 'ok'
                    ? 'Ubicación encontrada a partir de la dirección. Verifica que el pin esté en el lugar correcto.'
                    : 'No se encontró la dirección exacta — se muestra el centro aproximado de la comuna.'}
                </p>
              </div>
            )}

            {geoStatus === 'error' && (
              <p className="text-xs text-red-400">No se pudo ubicar la dirección ni la comuna en el mapa.</p>
            )}
          </Section>

          <Section title="Información de contacto">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Nombre de contacto" optional>
                <input type="text" className={inputCls} placeholder="Tu nombre"
                  value={form.nombre_contacto} onChange={e => set('nombre_contacto', e.target.value)} />
              </Field>
              <Field label="Teléfono de contacto" optional>
                <input type="tel" className={inputCls} placeholder="+56 9 1234 5678"
                  value={form.telefono_contacto} onChange={e => set('telefono_contacto', e.target.value)} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Email de contacto" optional>
                <input type="email" className={inputCls} placeholder="contacto@email.com"
                  value={form.email_contacto} onChange={e => set('email_contacto', e.target.value)} />
              </Field>
              <Field label="Horario de acceso" optional>
                <input type="text" className={inputCls} placeholder="Ej: Lun–Vie 9–18hrs"
                  value={form.horario_acceso} onChange={e => set('horario_acceso', e.target.value)} />
              </Field>
            </div>
          </Section>

          <Section title="Características adicionales">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {CARACTERISTICAS_OPTS.map(opt => {
                const active = caracteristicas.includes(opt.key)
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => toggleCaracteristica(opt.key)}
                    className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium transition-all text-left ${
                      active
                        ? 'bg-amber-400/10 border-amber-400/40 text-amber-300'
                        : 'bg-white/3 border-white/8 text-white/50 hover:border-white/15 hover:text-white/70'
                    }`}
                  >
                    <span>{opt.icon}</span>
                    <span>{opt.label}</span>
                    {active && <span className="ml-auto text-amber-400 text-xs">✓</span>}
                  </button>
                )
              })}
            </div>
          </Section>

          <Section title="Fotos del espacio">
            <input ref={fileRef} type="file" multiple accept="image/*" className="hidden" onChange={handleImages} />
            {imagenes.length < 8 && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full border-2 border-dashed border-white/15 rounded-xl py-8 flex flex-col items-center gap-2 text-white/40 hover:border-amber-400/30 hover:text-white/60 transition-all"
              >
                <span className="text-3xl">📷</span>
                <span className="text-sm font-medium">Subir fotos</span>
                <span className="text-xs">Hasta 8 imágenes · JPG, PNG, WEBP</span>
              </button>
            )}
            {imagenes.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-3">
                {imagenes.map((src, i) => (
                  <div key={i} className="relative group aspect-square">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`Foto ${i + 1}`} className="w-full h-full object-cover rounded-xl border border-white/10" />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/70 rounded-full text-white/80 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
                    >
                      ✕
                    </button>
                    {i === 0 && (
                      <span className="absolute bottom-1.5 left-1.5 text-xs bg-amber-400 text-black font-bold px-1.5 py-0.5 rounded-md">Principal</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section title="Condiciones especiales">
            <Field label="Condiciones adicionales" optional>
              <textarea rows={3} className={inputCls}
                placeholder="Ej: No se permite almacenar materiales inflamables. Acceso con reserva previa."
                value={form.condiciones} onChange={e => set('condiciones', e.target.value)} />
            </Field>
          </Section>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-400 text-black font-bold py-4 rounded-xl hover:bg-amber-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-base"
          >
            {loading ? 'Publicando...' : 'Publicar espacio →'}
          </button>
        </form>
      </div>
    </div>
  )
}
