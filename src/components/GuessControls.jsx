function GuessControls({
  markerPosition,
  hasGuess,
  isConfirmed,
  onConfirmGuess,
  onResetGuess,
}) {
  return (
    <aside className="controls-card" aria-label="Guess controls">
      <p className="label">Selected Location</p>

      {hasGuess ? (
        <p className="coords">
          Lat: <strong>{markerPosition.lat}</strong> | Lng:{' '}
          <strong>{markerPosition.lng}</strong>
        </p>
      ) : (
        <p className="coords muted">Click anywhere on the map to place a guess.</p>
      )}

      <div className="button-row">
        <button
          type="button"
          className="btn btn-primary"
          onClick={onConfirmGuess}
          disabled={!hasGuess}
        >
          Confirm Guess
        </button>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={onResetGuess}
          disabled={!hasGuess}
        >
          Reset Marker
        </button>
      </div>

      <p className="status" aria-live="polite">
        {isConfirmed && hasGuess
          ? 'Guess locked for this prototype session.'
          : 'Map is active: pan, zoom, and click to move your marker.'}
      </p>
    </aside>
  )
}

export default GuessControls
