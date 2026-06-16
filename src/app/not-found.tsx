import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-amber-500/8 rounded-full blur-[120px] pointer-events-none" />

      {/* logo */}
      <Link href="/" className="flex items-center gap-2 mb-12">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
          <span className="text-black font-black text-lg">S</span>
        </div>
        <span className="font-bold text-xl tracking-tight">Storly</span>
      </Link>

      <div className="relative text-center">
        <p className="text-[120px] md:text-[200px] font-black leading-none text-white/5 select-none">404</p>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-amber-400 text-xs font-semibold uppercase tracking-widest mb-3">Error 404</p>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-3">Página no encontrada</h1>
          <p className="text-white/40 text-sm max-w-xs">Esta página no existe o fue movida a otra dirección.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mt-8 relative">
        <Link
          href="/"
          className="bg-amber-400 text-black font-bold px-6 py-3 rounded-xl hover:bg-amber-300 transition-all text-sm"
        >
          Volver al inicio
        </Link>
        <Link
          href="/explorar"
          className="bg-white/5 border border-white/10 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/8 transition-all text-sm"
        >
          Explorar espacios
        </Link>
      </div>
    </div>
  )
}
