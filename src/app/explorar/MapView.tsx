'use client'
import { useEffect, useRef } from 'react'

export interface MapEspacio {
  id: number
  titulo: string
  precio_mensual: number
  comuna: string
  lat: number
  lng: number
}

const SANTIAGO: [number, number] = [-33.4489, -70.6693]

function formatPrice(price: number) {
  return price >= 1_000_000
    ? '$' + (price / 1_000_000).toFixed(1).replace('.0', '') + 'M'
    : '$' + Math.round(price / 1_000) + 'k'
}

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

export default function MapView({
  spaces,
  userLocation,
  hoveredId,
  onMarkerClick,
}: {
  spaces: MapEspacio[]
  userLocation: [number, number] | null
  hoveredId: number | null
  onMarkerClick: (id: number) => void
}) {
  const mapRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leafletMapRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<Map<number, any>>(new Map())
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userMarkerRef = useRef<any>(null)

  // Initialize map once
  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return

    injectLeafletCSS()

    let L: typeof import('leaflet')
    // dynamically import Leaflet to avoid SSR issues
    import('leaflet').then(module => {
      L = module.default ?? module

      const map = L.map(mapRef.current!, {
        center: SANTIAGO,
        zoom: 13,
        zoomControl: false,
      })

      L.control.zoom({ position: 'bottomright' }).addTo(map)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map)

      leafletMapRef.current = { map, L }
    })

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.map.remove()
        leafletMapRef.current = null
        markersRef.current.clear()
        userMarkerRef.current = null
      }
    }
  }, [])

  // Update markers when spaces or hoveredId changes
  useEffect(() => {
    if (!leafletMapRef.current) return
    const { map, L } = leafletMapRef.current

    // Remove old markers
    markersRef.current.forEach(m => m.remove())
    markersRef.current.clear()

    spaces.forEach(s => {
      const hovered = hoveredId === s.id
      const label = formatPrice(s.precio_mensual)
      const bg = hovered ? '#2D4A3E' : '#C9A84C'
      const fg = hovered ? '#C8D9B0' : '#0a0a0f'

      const icon = L.divIcon({
        html: `<span style="display:inline-block;background:${bg};color:${fg};padding:4px 10px;border-radius:20px;font-size:11px;font-weight:800;white-space:nowrap;box-shadow:0 2px 12px rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.15);transform:translate(-50%,-50%)">${label}</span>`,
        className: '',
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      })

      const marker = L.marker([s.lat, s.lng], { icon })
        .addTo(map)
        .bindPopup(
          `<div style="min-width:160px;padding:4px 2px">
            <p style="font-weight:700;font-size:13px;margin:0 0 4px;color:#fff;line-height:1.3">${s.titulo}</p>
            <p style="font-size:11px;color:#9BB896;margin:0 0 8px">${s.comuna}</p>
            <p style="font-weight:800;font-size:15px;color:#C9A84C;margin:0 0 10px">
              $${s.precio_mensual.toLocaleString('es-CL')}
              <span style="font-size:11px;font-weight:400;color:#9BB896">/mes</span>
            </p>
            <a href="/espacio/${s.id}" style="display:inline-block;background:#C9A84C;color:#0a0a0f;padding:5px 12px;border-radius:8px;font-size:12px;font-weight:700;text-decoration:none">Ver detalle →</a>
          </div>`
        )

      marker.on('click', () => onMarkerClick(s.id))
      markersRef.current.set(s.id, marker)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spaces, hoveredId])

  // Update user location marker
  useEffect(() => {
    if (!leafletMapRef.current || !userLocation) return
    const { map, L } = leafletMapRef.current

    if (userMarkerRef.current) {
      userMarkerRef.current.pulse?.remove()
      userMarkerRef.current.dot?.remove()
    }

    const pulse = L.circleMarker(userLocation, {
      radius: 22,
      color: '#3B82F6',
      fillColor: '#3B82F6',
      fillOpacity: 0.13,
      weight: 1,
    }).addTo(map)

    const dot = L.circleMarker(userLocation, {
      radius: 7,
      color: 'white',
      fillColor: '#3B82F6',
      fillOpacity: 1,
      weight: 2,
    }).addTo(map)

    userMarkerRef.current = { pulse, dot }
    map.flyTo(userLocation, 13, { animate: true, duration: 1 })
  }, [userLocation])

  return (
    <div
      ref={mapRef}
      style={{ height: '100%', width: '100%', minHeight: '500px', background: '#0d0d14' }}
    />
  )
}
