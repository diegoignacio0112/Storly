const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'
const USER_AGENT = 'Storly/1.0 (https://storly.cl)'

// Approximate centroids for the comunas offered in the publish form (Región Metropolitana).
// Used as a fallback when Nominatim can't resolve an exact address.
export const COMUNA_CENTERS: Record<string, [number, number]> = {
  'Cerrillos': [-33.5000, -70.7050],
  'Cerro Navia': [-33.4250, -70.7350],
  'Conchalí': [-33.3833, -70.6667],
  'El Bosque': [-33.5667, -70.6833],
  'Estación Central': [-33.4597, -70.6967],
  'Huechuraba': [-33.3667, -70.6333],
  'Independencia': [-33.4167, -70.6667],
  'La Cisterna': [-33.5333, -70.6667],
  'La Florida': [-33.5167, -70.6000],
  'La Granja': [-33.5417, -70.6333],
  'La Pintana': [-33.5833, -70.6333],
  'La Reina': [-33.4500, -70.5333],
  'Las Condes': [-33.4083, -70.5167],
  'Lo Barnechea': [-33.3500, -70.5167],
  'Lo Espejo': [-33.5167, -70.6833],
  'Lo Prado': [-33.4417, -70.7167],
  'Macul': [-33.4833, -70.6000],
  'Maipú': [-33.5167, -70.7667],
  'Ñuñoa': [-33.4550, -70.6000],
  'Pedro Aguirre Cerda': [-33.4833, -70.6833],
  'Peñalolén': [-33.4833, -70.5333],
  'Providencia': [-33.4333, -70.6167],
  'Pudahuel': [-33.4500, -70.7667],
  'Puente Alto': [-33.6117, -70.5750],
  'Quilicura': [-33.3667, -70.7333],
  'Quinta Normal': [-33.4167, -70.7000],
  'Recoleta': [-33.4000, -70.6417],
  'Renca': [-33.4167, -70.7167],
  'San Joaquín': [-33.4917, -70.6167],
  'San Miguel': [-33.4958, -70.6500],
  'San Ramón': [-33.5417, -70.6417],
  'Santiago': [-33.4489, -70.6693],
  'Vitacura': [-33.3833, -70.5667],
}

export type GeocodeSource = 'nominatim' | 'comuna_fallback'
export interface GeocodeResult { lat: number; lng: number; source: GeocodeSource }

export async function geocodeAddress(direccion: string | null | undefined, comuna: string): Promise<GeocodeResult | null> {
  if (direccion?.trim()) {
    try {
      const query = `${direccion}, ${comuna}, Chile`
      const url = `${NOMINATIM_URL}?format=json&limit=1&countrycodes=cl&q=${encodeURIComponent(query)}`
      const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'es' } })
      if (res.ok) {
        const results = await res.json()
        const lat = parseFloat(results?.[0]?.lat)
        const lng = parseFloat(results?.[0]?.lon)
        if (!isNaN(lat) && !isNaN(lng)) return { lat, lng, source: 'nominatim' }
      }
    } catch (err) {
      console.error('Nominatim geocoding failed:', err)
    }
  }

  const center = COMUNA_CENTERS[comuna]
  if (center) return { lat: center[0], lng: center[1], source: 'comuna_fallback' }

  return null
}
