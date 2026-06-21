'use client'
import { useEffect, useRef } from 'react'

function injectLeafletCSS() {
  if (document.getElementById('leaflet-css')) return
  const link = document.createElement('link')
  link.id = 'leaflet-css'
  link.rel = 'stylesheet'
  link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
  link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY='
  link.crossOrigin = ''
  document.head.appendChild(link)
}

export default function LocationPreviewMap({ lat, lng }: { lat: number; lng: number }) {
  const mapRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leafletMapRef = useRef<any>(null)

  useEffect(() => {
    if (!mapRef.current) return
    injectLeafletCSS()
    let cancelled = false

    import('leaflet').then(module => {
      if (cancelled || !mapRef.current) return
      const L = module.default ?? module

      if (!leafletMapRef.current) {
        const map = L.map(mapRef.current, {
          center: [lat, lng],
          zoom: 15,
          zoomControl: false,
          attributionControl: false,
        })
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map)
        const marker = L.marker([lat, lng]).addTo(map)
        leafletMapRef.current = { map, marker }
      } else {
        leafletMapRef.current.map.setView([lat, lng], 15)
        leafletMapRef.current.marker.setLatLng([lat, lng])
      }
    })

    return () => { cancelled = true }
  }, [lat, lng])

  useEffect(() => {
    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.map.remove()
        leafletMapRef.current = null
      }
    }
  }, [])

  return <div ref={mapRef} className="rounded-xl overflow-hidden" style={{ height: '180px', width: '100%', background: '#0d0d14' }} />
}
