import { MapContainer, Marker, TileLayer, useMapEvents, Polyline, Popup } from 'react-leaflet'
import L from 'leaflet'

const DEFAULT_CENTER = [20, 78]
const DEFAULT_ZOOM = 4

const guessIcon = (playerNum) => L.divIcon({
  className: 'guess-marker-wrapper',
  html: `<span class="guess-marker-pin player-${playerNum}">P${playerNum}</span>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
})

const correctIcon = L.divIcon({
  className: 'correct-marker-wrapper',
  html: '<span class="correct-marker-pin">✓</span>',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
})

function MapClickHandler({ onMapClick, disabled = false }) {
  useMapEvents({
    click(event) {
      if (disabled) return;
      const { lat, lng } = event.latlng
      onMapClick({
        lat: Number(lat.toFixed(5)),
        lng: Number(lng.toFixed(5)),
      })
    },
  })

  return null
}

function GameMap({ 
  guesses, 
  correctLocation, 
  onMapClick, 
  roundResults, 
  gameMode,
  disabled = false 
}) {
  const hasResults = !!roundResults;

  return (
    <div className="map-card" aria-label="Game map area">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        minZoom={2}
        maxZoom={13}
        zoomControl={true}
        worldCopyJump={true}
        className="game-map"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapClickHandler onMapClick={onMapClick} disabled={disabled || hasResults} />

        {/* Player 1 guess */}
        {guesses.player1 && (
          <>
            <Marker
              position={[guesses.player1.lat, guesses.player1.lng]}
              icon={guessIcon(1)}
              keyboard={false}
            >
              {hasResults && (
                <Popup>
                  <div className="popup-content">
                    <p><strong>Player 1 Guess</strong></p>
                    {roundResults && (
                      <p>Distance: {roundResults.player1.distance} km</p>
                    )}
                  </div>
                </Popup>
              )}
            </Marker>
            {hasResults && (
              <Polyline
                positions={[
                  [guesses.player1.lat, guesses.player1.lng],
                  [correctLocation.lat, correctLocation.lng],
                ]}
                color="rgba(255, 0, 0, 0.5)"
                weight={2}
                dashArray="5, 5"
              />
            )}
          </>
        )}

        {/* Player 2 guess (for 2-player mode) */}
        {gameMode === 'two-player' && guesses.player2 && (
          <>
            <Marker
              position={[guesses.player2.lat, guesses.player2.lng]}
              icon={guessIcon(2)}
              keyboard={false}
            >
              {hasResults && (
                <Popup>
                  <div className="popup-content">
                    <p><strong>Player 2 Guess</strong></p>
                    {roundResults && (
                      <p>Distance: {roundResults.player2.distance} km</p>
                    )}
                  </div>
                </Popup>
              )}
            </Marker>
            {hasResults && (
              <Polyline
                positions={[
                  [guesses.player2.lat, guesses.player2.lng],
                  [correctLocation.lat, correctLocation.lng],
                ]}
                color="rgba(0, 0, 255, 0.5)"
                weight={2}
                dashArray="5, 5"
              />
            )}
          </>
        )}

        {/* Correct location */}
        {hasResults && (
          <Marker
            position={[correctLocation.lat, correctLocation.lng]}
            icon={correctIcon}
            keyboard={false}
          >
            <Popup>
              <div className="popup-content">
                <p><strong>{correctLocation.label}</strong></p>
                <p>{correctLocation.city}</p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  )
}

export default GameMap;
