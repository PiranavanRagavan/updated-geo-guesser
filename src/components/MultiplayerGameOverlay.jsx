/**
 * MultiplayerGameOverlay Component
 * Displays multiplayer-specific UI states (room code, opponent status, waiting)
 * Does NOT interfere with existing GuessMap/GuessControls components
 */
function MultiplayerGameOverlay({
  roomCode,
  playerId,
  opponentGuessed,
  gamePhase,
  roundData,
}) {
  return (
    <div className="multiplayer-overlay">
      {/* Room Info Bar */}
      {roomCode && (
        <div className="multiplayer-info-bar">
          <div className="room-info">
            <span className="label">Room:</span>
            <span className="code">{roomCode}</span>
            <span className="divider">•</span>
            <span className="label">You are:</span>
            <span className="player-id">{playerId.toUpperCase()}</span>
          </div>
        </div>
      )}

      {/* Waiting for Opponent */}
      {gamePhase === 'waiting' && opponentGuessed && (
        <div className="multiplayer-status-overlay waiting">
          <div className="status-content">
            <p className="status-text">⏳ Waiting for opponent...</p>
            <div className="spinner"></div>
          </div>
        </div>
      )}

      {/* Round Info */}
      {roundData && (
        <div className="round-info-banner">
          <span>
            Round {roundData.round}/{roundData.totalRounds}
          </span>
          {roundData.label && <span> • {roundData.label}</span>}
        </div>
      )}

      {/* Game Finished */}
      {gamePhase === 'finished' && roundData?.finalResult && (
        <div className="multiplayer-final-result">
          <div className="final-result-content">
            <h3>Game Finished!</h3>
            <p className="result-scores">
              <span className="your-score">
                {playerId === 'p1' ? roundData.finalResult.p1Score : roundData.finalResult.p2Score} pts
              </span>
              {' vs '}
              <span className="opponent-score">
                {playerId === 'p1' ? roundData.finalResult.p2Score : roundData.finalResult.p1Score} pts
              </span>
            </p>
            <p className="result-winner">
              {roundData.finalResult.winner === playerId
                ? '🎉 You Won!'
                : roundData.finalResult.winner === 'tie'
                ? "It's a Tie!"
                : '❌ You Lost'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default MultiplayerGameOverlay;
