'use client'
import { useState } from 'react'
import Link from 'next/link'
'use client'
function CalculadoraOferentes() {
  const [metros, setMetros] = useState(6)
  const [dias, setDias] = useState(20)
  const [comuna, setComuna] = useState(1.0)
  const [tipo, setTipo] = useState(8000)

  const bruto = Math.round(tipo * comuna * (1 + (metros - 1) * 0.08) * dias)
  const comision = Math.round(bruto * 0.12)
  const neto = bruto - comision

  const fmt = (n: number) => '$' + n.toLocaleString('es-CL')

  return (
    <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
      <div className="bg-white/5 px-6 py-4 border-b border-white/8 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-lg">🏠</div>
        <div>
          <div className="font-bold">Simulador de ingresos</div>
          <div className="text-xs text-white/40 mt-0.5">Basado en precios reales validados en Santiago</div>
        </div>
      </div>
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-xs text-white/50 uppercase tracking-widest">Tamaño del espacio (m²)</label>
          <input type="range" min="1" max="50" step="1" value={metros} onChange={e => setMetros(Number(e.target.value))} className="w-full accent-amber-400" />
          <div className="text-xl font-black text-amber-400">{metros} m²</div>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs text-white/50 uppercase tracking-widest">Días disponibles al mes</label>
          <input type="range" min="5" max="30" step="1" value={dias} onChange={e => setDias(Number(e.target.value))} className="w-full accent-amber-400" />
          <div className="text-xl font-black text-amber-400">{dias} días</div>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs text-white/50 uppercase tracking-widest">Comuna</label>
          <select value={comuna} onChange={e => setComuna(Number(e.target.value))} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-400/50">
            <option value={1.2}>Providencia</option>
            <option value={1.1}>Las Condes</option>
            <option value={1.0}>Ñuñoa</option>
            <option value={0.95}>La Florida</option>
            <option value={0.9}>Maipú</option>
            <option value={0.85}>Pudahuel</option>
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs text-white/50 uppercase tracking-widest">Tipo de espacio</label>
          <select value={tipo} onChange={e => setTipo(Number(e.target.value))} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-400/50">
            <option value={8000}>Bodega / pieza</option>
            <option value={6000}>Garage cubierto</option>
            <option value={4500}>Patio / exterior</option>
            <option value={5000}>Estacionamiento</option>
          </select>
        </div>
        <div className="md:col-span-2 bg-[#2D4A3E] rounded-xl p-5 grid grid-cols-3 gap-4">
          {[
            { val: fmt(bruto), lbl: 'Ingreso bruto' },
            { val: fmt(comision), lbl: 'Comisión Storly 12%' },
            { val: fmt(neto), lbl: 'Tu ingreso neto' },
          ].map((item, i) => (
            <div key={i} className={`text-center ${i < 2 ? 'border-r border-white/10' : ''}`}>
              <div className="text-xl font-black text-[#C8D9B0]">{item.val}</div>
              <div className="text-xs text-[#9BB896] mt-1 uppercase tracking-wider">{item.lbl}</div>
            </div>
          ))}
        </div>
        <div className="md:col-span-2 bg-amber-400/10 border border-amber-400/20 rounded-xl p-4 text-sm text-amber-200/80">
          💡 Con <strong>{metros} m²</strong> disponibles <strong>{dias} días</strong> al mes podrías ganar hasta <strong>{fmt(neto)}</strong> netos — sin inversión inicial.
        </div>
        <div className="md:col-span-2 flex gap-3">
          <Link href="/auth/registro" className="flex-1 bg-amber-400 text-black font-bold px-6 py-3 rounded-xl hover:bg-amber-300 transition-all text-center text-sm">Publicar mi espacio →</Link>
          <Link href="/buscar" className="flex-1 bg-white/5 border border-white/10 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/10 transition-all text-center text-sm">Ver espacios similares</Link>
        </div>
      </div>
    </div>
  )
}
export default function Home() {
  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <span className="text-black font-black text-sm">S</span>
            </div>
            <span className="font-bold text-lg tracking-tight">Storly</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-white/60">
            <a href="#como-funciona" className="hover:text-white transition-colors">Cómo funciona</a>
            <a href="#seguridad" className="hover:text-white transition-colors">Seguridad</a>
            <a href="#para-quien" className="hover:text-white transition-colors">Para quién</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="text-sm text-white/70 hover:text-white transition-colors px-4 py-2">Iniciar sesión</Link>
            <Link href="/auth/registro" className="text-sm bg-amber-400 text-black font-semibold px-4 py-2 rounded-lg hover:bg-amber-300 transition-colors">Comenzar gratis</Link>
          </div>
        </div>
      </nav>

      <section className="relative pt-32 pb-24 px-6">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-amber-500/10 rounded-full blur-[100px]" />
          <div className="absolute top-40 left-1/4 w-[300px] h-[300px] bg-orange-600/8 rounded-full blur-[80px]" />
        </div>
        <div className="max-w-5xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-white/70 mb-8">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            Tu bodega inteligente en Chile
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-none mb-6">
            Tu bodega ideal,{' '}
            <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">a pasos de ti</span>
          </h1>
          <p className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed">
            Conectamos emprendedores que necesitan espacio con personas que tienen espacio de sobra. Flexible, asegurado y 100% digital.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/buscar" className="w-full sm:w-auto bg-amber-400 text-black font-bold px-8 py-4 rounded-xl hover:bg-amber-300 transition-all hover:scale-105 text-base">Buscar bodega →</Link>
            <Link href="/auth/registro" className="w-full sm:w-auto bg-white/5 border border-white/10 text-white font-semibold px-8 py-4 rounded-xl hover:bg-white/10 transition-all text-base">Publicar mi espacio</Link>
          </div>
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
            {[{ value: '100%', label: 'Digital' }, { value: '24/7', label: 'Disponible' }, { value: '0$', label: 'Para publicar' }].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl font-black text-amber-400">{s.value}</div>
                <div className="text-sm text-white/40 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="como-funciona" className="py-24 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-amber-400 text-sm font-semibold uppercase tracking-widest mb-3">Proceso simple</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">¿Cómo funciona?</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { num: '01', icon: '🔍', title: 'Encuentra tu espacio', desc: 'Busca bodegas disponibles cerca de ti. Filtra por tamaño, precio y comuna.' },
              { num: '02', icon: '📋', title: 'Reserva en minutos', desc: 'Selecciona las fechas, revisa el contrato digital y confirma tu reserva al instante.' },
              { num: '03', icon: '📦', title: 'Guarda con tranquilidad', desc: 'Tu mercadería protegida con seguro incluido. Acceso flexible según tu plan.' },
            ].map((step) => (
              <div key={step.num} className="relative bg-white/3 border border-white/8 rounded-2xl p-8 hover:border-amber-400/30 transition-all group">
                <div className="text-6xl font-black text-white/5 absolute top-6 right-6 select-none group-hover:text-amber-400/10 transition-colors">{step.num}</div>
                <div className="text-3xl mb-4">{step.icon}</div>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-white/50 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="seguridad" className="py-24 px-6 bg-gradient-to-b from-transparent via-amber-950/10 to-transparent">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-amber-400 text-sm font-semibold uppercase tracking-widest mb-3">Tu tranquilidad primero</p>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">
                Protegido por{' '}
                <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">seguro incluido</span>
              </h2>
              <p className="text-white/50 text-lg leading-relaxed mb-8">
                Trabajamos con aseguradoras líderes como <strong className="text-white">HDI Seguros</strong> y <strong className="text-white">BCI Seguros</strong> para ofrecerte una póliza automática en cada contrato.
              </p>
              <div className="space-y-4">
                {[
                  { icon: '🛡️', text: 'Póliza automática al confirmar cada arriendo' },
                  { icon: '💰', text: 'Cobertura por pérdida, robo o daño de mercadería' },
                  { icon: '📄', text: 'Contratos digitales con respaldo legal' },
                  { icon: '✅', text: 'Usuarios verificados con validación de identidad' },
                ].map((item) => (
                  <div key={item.text} className="flex items-start gap-3">
                    <span className="text-xl mt-0.5">{item.icon}</span>
                    <span className="text-white/70">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gradient-to-br from-amber-950/40 to-orange-950/20 border border-amber-400/20 rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-2xl">🔐</div>
                <div>
                  <div className="font-bold text-lg">Seguro Storly</div>
                  <div className="text-sm text-white/40">Activado automáticamente</div>
                </div>
              </div>
              <div className="space-y-4 mb-6">
                {[
                  { label: 'Cobertura', value: 'Hasta $5.000.000 CLP', color: 'text-amber-400' },
                  { label: 'Tipo', value: 'Todo riesgo', color: 'text-white' },
                  { label: 'Costo extra', value: '$0 — incluido', color: 'text-green-400' },
                  { label: 'Aseguradora', value: 'HDI / BCI Seguros', color: 'text-white' },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between items-center py-3 border-b border-white/5">
                    <span className="text-white/60 text-sm">{row.label}</span>
                    <span className={`font-semibold ${row.color}`}>{row.value}</span>
                  </div>
                ))}
              </div>
              <div className="bg-amber-400/10 border border-amber-400/20 rounded-xl p-4 text-sm text-amber-200/80">
                💡 <strong>Ventaja única:</strong> Los arriendos informales no tienen esto. Con Storly, tu mercadería siempre está protegida.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="para-quien" className="py-24 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-amber-400 text-sm font-semibold uppercase tracking-widest mb-3">Dos lados del mercado</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">¿Para quién es Storly?</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white/3 border border-white/8 rounded-3xl p-10 hover:border-amber-400/20 transition-all">
              <div className="text-4xl mb-6">🏢</div>
              <h3 className="text-2xl font-black mb-3">Emprendedores y PYMEs</h3>
              <p className="text-white/50 mb-8 leading-relaxed">Necesitas almacenar stock, materiales o equipos pero no quieres pagar una bodega industrial completa.</p>
              <ul className="space-y-3 mb-8">
                {['Arrienda solo el espacio que necesitas', 'Paga por días, semanas o meses', 'Sin fianzas ni contratos largos', 'Seguro incluido en cada arriendo'].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-white/70">
                    <span className="w-5 h-5 rounded-full bg-amber-400/20 flex items-center justify-center text-amber-400 text-xs flex-shrink-0">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/buscar" className="inline-flex items-center gap-2 bg-amber-400 text-black font-bold px-6 py-3 rounded-xl hover:bg-amber-300 transition-all">Buscar espacio →</Link>
            </div>
            <div className="bg-white/3 border border-white/8 rounded-3xl p-10 hover:border-amber-400/20 transition-all">
              <div className="text-4xl mb-6">🏠</div>
              <h3 className="text-2xl font-black mb-3">Dueños de espacios</h3>
              <p className="text-white/50 mb-8 leading-relaxed">Tienes una bodega, garage o patio que no estás usando. Conviértelo en ingresos mensuales.</p>
              <ul className="space-y-3 mb-8">
                {['Publica gratis en minutos', 'Tú defines precio y disponibilidad', 'Pagos seguros gestionados por Storly', 'Arrendatarios verificados y asegurados'].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-white/70">
                    <span className="w-5 h-5 rounded-full bg-amber-400/20 flex items-center justify-center text-amber-400 text-xs flex-shrink-0">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/auth/registro" className="inline-flex items-center gap-2 bg-white/10 border border-white/10 text-white font-bold px-6 py-3 rounded-xl hover:bg-white/15 transition-all">Publicar mi espacio →</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-gradient-to-br from-amber-950/40 to-orange-950/20 border border-amber-400/20 rounded-3xl p-12">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Empieza hoy, gratis</h2>
            <p className="text-white/50 text-lg mb-8">Únete a Storly y descubre una forma más inteligente de gestionar el espacio en Chile.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth/registro" className="w-full sm:w-auto bg-amber-400 text-black font-bold px-8 py-4 rounded-xl hover:bg-amber-300 transition-all hover:scale-105 text-base">Crear cuenta gratis →</Link>
              <Link href="/buscar" className="w-full sm:w-auto text-white/60 hover:text-white transition-colors text-base">Ver espacios disponibles</Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <span className="text-black font-black text-xs">S</span>
            </div>
            <span className="font-bold text-sm">Storly</span>
          </div>
          <p className="text-white/30 text-sm">© 2024 Storly. Todos los derechos reservados.</p>
          <div className="flex items-center gap-2 text-white/30 text-sm">
            <span>🛡️</span>
            <span>Asegurado por HDI & BCI Seguros</span>
          </div>
        </div>
      </footer>{/* COMPARADOR */}
<section className="py-24 px-6 border-t border-white/5">
  <div className="max-w-6xl mx-auto">
    <div className="text-center mb-12">
      <p className="text-amber-400 text-sm font-semibold uppercase tracking-widest mb-3">Benchmark real</p>
      <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-3">¿Por qué Storly?</h2>
      <p className="text-white/50 text-lg">Validado con usuarias reales — no son promesas</p>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="text-left p-4 text-xs uppercase tracking-widest text-white/40 border-b border-white/5">Característica</th>
            <th className="text-center p-4 text-xs uppercase tracking-widest text-white/40 border-b border-white/5">Self Storage</th>
            <th className="text-center p-4 text-xs uppercase tracking-widest text-white/40 border-b border-white/5">Yapo / Facebook</th>
            <th className="text-center p-4 text-xs uppercase tracking-widest text-white/40 border-b border-white/5">Informal</th>
            <th className="text-center p-4 text-xs uppercase tracking-widest text-amber-400 border-b border-amber-400/30 bg-amber-400/5 rounded-t-xl">✦ Storly</th>
          </tr>
        </thead>
        <tbody>
          {[
            { feat: 'Flexibilidad', sub: 'Días, semanas o meses', vals: ['Solo mensual', 'Alta', 'Alta', 'Alta'], types: ['no', 'yes', 'yes', 'yes'] },
            { feat: 'Costo accesible', sub: 'Sin costos fijos altos', vals: ['Caro', 'Gratis', 'Muy bajo', 'Medio'], types: ['no', 'yes', 'yes', 'partial'] },
            { feat: 'Seguro de inventario', sub: 'Póliza ante daño o pérdida', vals: ['Sí', 'No', 'No', 'Básico + Plus'], types: ['yes', 'no', 'no', 'yes'] },
            { feat: 'Verificación de identidad', sub: 'KYC + biometría', vals: ['No', 'No', 'No', 'KYC + biometría'], types: ['no', 'no', 'no', 'yes'] },
            { feat: 'Pago con escrow', sub: 'Retención hasta entrega', vals: ['Sí', 'No', 'No', 'Mercado Pago'], types: ['yes', 'no', 'no', 'yes'] },
            { feat: 'Sistema de reputación', sub: 'Evaluaciones bidireccionales', vals: ['No', 'Limitado', 'No', 'Bidireccional'], types: ['no', 'partial', 'no', 'yes'] },
            { feat: 'Tasa de cierre', sub: 'Validado A/B test real', vals: ['Media', '27%', '~30%', '80%'], types: ['partial', 'no', 'no', 'yes'] },
          ].map((row, i) => (
            <tr key={i} className="border-b border-white/5 hover:bg-white/2 transition-colors">
              <td className="p-4">
                <div className="font-semibold text-sm text-white">{row.feat}</div>
                <div className="text-xs text-white/40 mt-0.5">{row.sub}</div>
              </td>
              {row.vals.map((val, j) => (
                <td key={j} className={`p-4 text-center ${j === 3 ? 'bg-amber-400/5' : ''}`}>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    row.types[j] === 'yes' ? 'bg-green-400/10 text-green-400' :
                    row.types[j] === 'no' ? 'bg-red-400/10 text-red-400' :
                    'bg-amber-400/10 text-amber-400'
                  }`}>{val}</span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <div className="mt-8 bg-gradient-to-r from-amber-950/40 to-orange-950/20 border border-amber-400/20 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
      <div>
        <p className="font-bold text-white">Único en Chile con KYC + escrow + póliza en un solo flujo</p>
        <p className="text-white/50 text-sm mt-1">NPS 62 · 80% tasa de cierre · decisión en 2.8 min · validado con 20 usuarias reales</p>
      </div>
      <Link href="/auth/registro" className="bg-amber-400 text-black font-bold px-6 py-3 rounded-xl hover:bg-amber-300 transition-all whitespace-nowrap">
        Comenzar gratis →
      </Link>
    </div>
  </div>
</section>{/* CALCULADORA OFERENTES */}
<section className="py-24 px-6 border-t border-white/5">
  <div className="max-w-4xl mx-auto">
    <div className="text-center mb-12">
      <p className="text-amber-400 text-sm font-semibold uppercase tracking-widest mb-3">Para oferentes</p>
      <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-3">¿Cuánto puede ganar tu espacio?</h2>
      <p className="text-white/50 text-lg">Calcula tus ingresos estimados según tu espacio y disponibilidad</p>
    </div>
    <CalculadoraOferentes />
  </div>
</section>
    </main>
  )
}