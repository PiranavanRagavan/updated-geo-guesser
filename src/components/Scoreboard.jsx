function Scoreboard({ scores, currentRound, totalRounds, gameMode, currentPlayer, playerGuessed }) {
  return (
    <div className="scoreboard">
      <div className="round-info">
        <h3>Round {currentRound}/{totalRounds}</h3>
      </div>

      <div className="scores-container">
        {gameMode === 'single' ? (
          <div className="score-card">
            <h4>Your Score</h4>
            <p className="score-value">{scores.player1}</p>
          </div>
        ) : (
          <>
            <div className={`score-card ${currentPlayer === 1 && !playerGuessed ? 'active' : ''}`}>
              <h4>Player 1</h4>
              <p className="score-value">{scores.player1}</p>
              {currentPlayer === 1 && !playerGuessed && (
                <span className="player-turn">Turn</span>
              )}
            </div>
            <div className={`score-card ${currentPlayer === 2 && !playerGuessed ? 'active' : ''}`}>
              <h4>Player 2</h4>
              <p className="score-value">{scores.player2}</p>
              {currentPlayer === 2 && !playerGuessed && (
                <span className="player-turn">Turn</span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Scoreboard;
