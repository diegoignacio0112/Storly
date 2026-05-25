import Link from 'next/link'

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
            El Airbnb de las bodegas en Chile
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
      </footer>
    </main>
  )
}