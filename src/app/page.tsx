import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b px-6 py-4 flex justify-between items-center">
        <span className="text-xl font-bold text-blue-600">Storly</span>
        <div className="flex gap-3">
          <Link href="/buscar" className="text-sm text-gray-600 hover:text-gray-900">Buscar espacios</Link>
          <Link href="/auth/login" className="text-sm border rounded-lg px-3 py-1.5 text-gray-600 hover:bg-gray-50">Iniciar sesión</Link>
          <Link href="/auth/registro" className="text-sm bg-blue-600 text-white rounded-lg px-3 py-1.5 hover:bg-blue-700">Registrarse</Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-24 text-center">
        <span className="text-xs bg-blue-50 text-blue-600 rounded-full px-3 py-1 font-medium">Tu espacio, tu crecimiento</span>
        <h1 className="text-5xl font-bold text-gray-900 mt-6 mb-4 leading-tight">
          El Airbnb de las<br />
          <span className="text-blue-600">bodegas en Chile</span>
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
          Conectamos emprendedores que necesitan espacio con personas que tienen espacio de sobra. Flexible, seguro y cercano.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/buscar" className="bg-blue-600 text-white rounded-xl px-6 py-3 font-medium hover:bg-blue-700 text-lg">
            Buscar espacio
          </Link>
          <Link href="/auth/registro" className="border-2 border-gray-200 text-gray-700 rounded-xl px-6 py-3 font-medium hover:bg-gray-50 text-lg">
            Publicar mi espacio
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 pb-24 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-50 rounded-2xl p-6">
          <div className="text-2xl mb-3">📦</div>
          <h3 className="font-semibold text-gray-900 mb-2">Flexible</h3>
          <p className="text-sm text-gray-500">Arrienda por días, semanas o meses. Sin contratos largos ni compromisos rígidos.</p>
        </div>
        <div className="bg-gray-50 rounded-2xl p-6">
          <div className="text-2xl mb-3">🔒</div>
          <h3 className="font-semibold text-gray-900 mb-2">Seguro</h3>
          <p className="text-sm text-gray-500">Usuarios verificados, sistema de reputación y pagos gestionados por la plataforma.</p>
        </div>
        <div className="bg-gray-50 rounded-2xl p-6">
          <div className="text-2xl mb-3">📍</div>
          <h3 className="font-semibold text-gray-900 mb-2">Cercano</h3>
          <p className="text-sm text-gray-500">Encuentra espacios en tu comuna. Sin desplazamientos innecesarios.</p>
        </div>
      </div>
    </div>
  )
}
 