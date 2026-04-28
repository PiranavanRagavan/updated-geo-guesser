function GameModeSelector({ onSelectMode }) {
  return (
    <div className="mode-selector-overlay">
      <div className="mode-selector">
        <h1>GeoGuessr Game</h1>
        <p className="subtitle">Choose your game mode</p>
        
        <div className="mode-buttons">
          <button 
            className="mode-button single-player"
            onClick={() => onSelectMode('single')}
          >
            <span className="mode-icon">👤</span>
            <span className="mode-name">Single Player</span>
            <span className="mode-desc">Guess locations solo</span>
          </button>
          
          <button 
            className="mode-button two-player"
            onClick={() => onSelectMode('two-player')}
          >
            <span className="mode-icon">👥</span>
            <span className="mode-name">Two Players</span>
            <span className="mode-desc">Compete with a friend</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default GameModeSelector;
