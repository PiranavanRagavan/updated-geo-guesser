function GameOverScreen({ scores, gameMode, onResetGame }) {
  const winner = gameMode === 'two-player' 
    ? scores.player1 > scores.player2 ? 'Player 1' : scores.player1 < scores.player2 ? 'Player 2' : 'Tie'
    : null;

  return (
    <div className="game-over-overlay">
      <div className="game-over-screen">
        <h1>Game Over!</h1>
        
        {gameMode === 'single' ? (
          <div className="final-score">
            <h2>Final Score</h2>
            <p className="score-value">{scores.player1}</p>
          </div>
        ) : (
          <>
            <div className="final-scores">
              <div className="score-card player-1">
                <h3>Player 1</h3>
                <p className="score-value">{scores.player1}</p>
              </div>
              <div className="score-card player-2">
                <h3>Player 2</h3>
                <p className="score-value">{scores.player2}</p>
              </div>
            </div>
            <div className="winner-info">
              <p className="winner">Winner: <strong>{winner}</strong></p>
            </div>
          </>
        )}

        <button className="btn btn-primary btn-large" onClick={onResetGame}>
          Play Again
        </button>
      </div>
    </div>
  );
}

export default GameOverScreen;
