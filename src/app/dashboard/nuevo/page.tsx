'use client'
import { useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const COMUNAS = [
  'Cerrillos','Cerro Navia','Conchalí','El Bosque','Estación Central',
  'Huechuraba','Independencia','La Cisterna','La Florida','La Granja',
  'La Pintana','La Reina','Las Condes','Lo Barnechea','Lo Espejo',
  'Lo Prado','Macul','Maipú','Ñuñoa','Pedro Aguirre Cerda','Peñalolén',
  'Providencia','Pudahuel','Puente Alto','Quilicura','Quinta Normal',
  'Recoleta','Renca','San Joaquín','San Miguel','San Ramón',
  'Santiago','Vitacura',
]

const CARACTERISTICAS_OPTS = [
  { key: 'iluminacion', label: 'Iluminación', icon: '💡' },
  { key: 'ventilacion', label: 'Ventilación', icon: '🌬️' },
  { key: 'acceso_vehicular', label: 'Acceso vehicular', icon: '🚗' },
  { key: 'seguridad_24hrs', label: 'Seguridad 24hrs', icon: '🛡️' },
  { key: 'camaras', label: 'Cámaras', icon: '📷' },
  { key: 'candado_propio', label: 'Candado propio', icon: '🔒' },
]

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
const selectCls = 'w-full bg-[#0d0d14] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-400/50 transition-all appearance-none cursor-pointer'

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

  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }))

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
      })
    })

    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Error al publicar'); setLoading(false); return }
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* nav */}
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
          {/* basic info */}
          <Section title="Información básica">
            <Field label="Título del espacio">
              <input type="text" required className={inputCls} placeholder="Ej: Bodega climatizada Las Condes"
                value={form.titulo} onChange={e => set('titulo', e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Tipo de espacio">
                <select required className={selectCls} value={form.tipo} onChange={e => set('tipo', e.target.value)}>
                  <option value="bodega">Bodega</option>
                  <option value="garage">Garage</option>
                  <option value="patio">Patio</option>
                  <option value="pieza">Pieza</option>
                  <option value="estacionamiento">Estacionamiento</option>
                  <option value="otro">Otro</option>
                </select>
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

          {/* details */}
          <Section title="Detalles del espacio">
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

          {/* location */}
          <Section title="Ubicación">
            <Field label="Dirección completa" optional>
              <input type="text" className={inputCls} placeholder="Ej: Av. Apoquindo 3000, Piso 2"
                value={form.direccion} onChange={e => set('direccion', e.target.value)} />
            </Field>
            <Field label="Comuna">
              <select required className={selectCls} value={form.comuna} onChange={e => set('comuna', e.target.value)}>
                <option value="">Selecciona una comuna</option>
                {COMUNAS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
          </Section>

          {/* contact */}
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

          {/* features */}
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

          {/* photos */}
          <Section title="Fotos del espacio">
            <input
              ref={fileRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleImages}
            />
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

          {/* conditions */}
          <Section title="Condiciones especiales">
            <Field label="Condiciones adicionales" optional>
              <textarea rows={3} className={inputCls}
                placeholder="Ej: No se permite almacenar materiales inflamables. Acceso con reserva previa."
                value={form.condiciones} onChange={e => set('condiciones', e.target.value)} />
            </Field>
          </Section>

          {/* submit */}
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
