import { useState } from 'react';
import '../styles/RoomModal.css';

/**
 * RoomModal Component
 * Provides UI for creating/joining multiplayer rooms without breaking existing layout
 * Renders as a modal overlay that can be dismissed
 */
function RoomModal({
  isOpen,
  onClose,
  onCreateRoom,
  onJoinRoom,
  loading,
  error,
}) {
  const [joinCode, setJoinCode] = useState('');
  const [mode, setMode] = useState(null); // 'create' | 'join'

  const handleCreate = async () => {
    try {
      await onCreateRoom();
      setMode(null);
    } catch (err) {
      console.error('Failed to create room:', err);
    }
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) {
      alert('Please enter a room code');
      return;
    }
    try {
      await onJoinRoom(joinCode.toUpperCase());
      setMode(null);
      setJoinCode('');
    } catch (err) {
      console.error('Failed to join room:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="room-modal-overlay" onClick={onClose}>
      <div className="room-modal" onClick={(e) => e.stopPropagation()}>
        <button className="room-modal-close" onClick={onClose}>
          ✕
        </button>

        {!mode ? (
          // Select mode
          <div className="room-modal-content">
            <h2>Multiplayer Game</h2>
            <p>Choose an option:</p>
            <div className="room-button-group">
              <button
                className="btn btn-primary"
                onClick={() => setMode('create')}
              >
                Create Room
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setMode('join')}
              >
                Join Room
              </button>
            </div>
          </div>
        ) : mode === 'create' ? (
          // Create room
          <div className="room-modal-content">
            <h2>Create Room</h2>
            <p>Generating a unique room code...</p>
            <button
              className="btn btn-primary"
              onClick={handleCreate}
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Room'}
            </button>
            {error && <p className="room-error">{error}</p>}
            <button
              className="btn btn-secondary"
              onClick={() => setMode(null)}
              disabled={loading}
            >
              Back
            </button>
          </div>
        ) : (
          // Join room
          <div className="room-modal-content">
            <h2>Join Room</h2>
            <input
              type="text"
              placeholder="Enter room code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength="4"
              disabled={loading}
              className="room-input"
            />
            <button
              className="btn btn-primary"
              onClick={handleJoin}
              disabled={loading || !joinCode.trim()}
            >
              {loading ? 'Joining...' : 'Join Room'}
            </button>
            {error && <p className="room-error">{error}</p>}
            <button
              className="btn btn-secondary"
              onClick={() => {
                setMode(null);
                setJoinCode('');
              }}
              disabled={loading}
            >
              Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default RoomModal;
