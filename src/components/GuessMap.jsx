import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet'
import L from 'leaflet'

const DEFAULT_CENTER = [20, 0]
const DEFAULT_ZOOM = 2

const guessIcon = L.divIcon({
  className: 'guess-marker-wrapper',
  html: '<span class="guess-marker-pin"></span>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
})

function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(event) {
      const { lat, lng } = event.latlng
      onMapClick({
        lat: Number(lat.toFixed(5)),
        lng: Number(lng.toFixed(5)),
      })
    },
  })

  return null
}

function GuessMap({ markerPosition, onMapClick }) {
  return (
    <div className="map-card" aria-label="Guess map area">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        minZoom={2}
        zoomControl={true}
        worldCopyJump={true}
        className="guess-map"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapClickHandler onMapClick={onMapClick} />

        {markerPosition && (
          <Marker
            position={[markerPosition.lat, markerPosition.lng]}
            icon={guessIcon}
            keyboard={false}
          />
        )}
      </MapContainer>
    </div>
  )
}

export default GuessMap
