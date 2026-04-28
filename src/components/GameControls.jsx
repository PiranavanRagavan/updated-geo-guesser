import { useEffect } from 'react';

function GameControls({ 
  gameMode,
  guesses, 
  roundResults,
  currentPlayer,
  playerGuessed,
  onConfirmGuess,
  onSubmitGuess,
  onNextRound,
  onResetGame 
}) {
  useEffect(() => {
    // For 2-player, if player 1 guessed, show message for player 2
    if (gameMode === 'two-player' && playerGuessed && !roundResults) {
      // UI will show player 2 should guess
    }
  }, [gameMode, playerGuessed, roundResults]);

  if (!guesses) {
    return (
      <div className="game-controls">
        <p className="info">Click on the map to place your guess</p>
      </div>
    );
  }

  if (roundResults) {
    return (
      <div className="game-controls">
        <div className="results-section">
          <h3>Round Results</h3>
          {gameMode === 'single' ? (
            <div className="result-card">
              <p><strong>Distance:</strong> {roundResults.player1.distance} km</p>
              <p className="score-result">Score: {roundResults.player1.score}</p>
            </div>
          ) : (
            <>
              <div className="result-card player-1">
                <h4>Player 1</h4>
                <p><strong>Distance:</strong> {roundResults.player1.distance} km</p>
                <p className="score-result">Score: {roundResults.player1.score}</p>
              </div>
              <div className="result-card player-2">
                <h4>Player 2</h4>
                <p><strong>Distance:</strong> {roundResults.player2.distance} km</p>
                <p className="score-result">Score: {roundResults.player2.score}</p>
              </div>
            </>
          )}
          <div className="correct-location">
            <p><strong>Correct Location:</strong> {roundResults.correct.label}</p>
            <p className="coordinates">
              {roundResults.correct.lat.toFixed(4)}, {roundResults.correct.lng.toFixed(4)}
            </p>
          </div>
        </div>
        
        <button className="btn btn-primary" onClick={onNextRound}>
          Next Round
        </button>
      </div>
    );
  }

  // Single player - waiting for guess confirmation
  if (gameMode === 'single') {
    return (
      <div className="game-controls">
        <p className="info">Guess placed! Check the map.</p>
        <button className="btn btn-primary" onClick={onSubmitGuess}>
          Confirm Guess
        </button>
      </div>
    );
  }

  // Two player - show current player status
  if (gameMode === 'two-player') {
    // Current player hasn't guessed yet OR just switched to player 2
    if (!guesses[`player${currentPlayer}`]) {
      return (
        <div className="game-controls">
          <div className="player-turn-info">
            <h3>Player {currentPlayer}'s Turn</h3>
            <p>Click on the map to place your guess</p>
          </div>
          <button 
            className="btn btn-primary" 
            onClick={onConfirmGuess}
            disabled={!guesses[`player${currentPlayer}`]}
          >
            {currentPlayer === 1 ? 'Done - Pass to Player 2' : 'Confirm Guess'}
          </button>
        </div>
      );
    }
    // Both players have guessed - show Reveal Results button
    else if (guesses.player1 && guesses.player2) {
      return (
        <div className="game-controls">
          <div className="player-turn-info">
            <h3>Both Players Ready!</h3>
            <p>Click to reveal the results</p>
          </div>
          <button 
            className="btn btn-primary" 
            onClick={onConfirmGuess}
          >
            Reveal Results
          </button>
        </div>
      );
    }
  }

  return null;
}

export default GameControls;
