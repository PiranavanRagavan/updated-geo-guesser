import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

/**
 * Hook to manage multiplayer game via Socket.IO
 * Handles room creation/joining, guess submission, and real-time game state
 */
export const useMultiplayer = (enabled = false) => {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [roomCode, setRoomCode] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [opponentGuessed, setOpponentGuessed] = useState(false);
  const [gamePhase, setGamePhase] = useState('waiting'); // 'waiting' | 'guessing' | 'result' | 'finished'
  const [roundData, setRoundData] = useState(null);
  const [error, setError] = useState(null);

  // Initialize socket connection
  useEffect(() => {
    if (!enabled) return;

    const serverUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';
    const newSocket = io(serverUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      console.log('Connected to server:', newSocket.id);
      setConnected(true);
      setError(null);
    });

    // Room created event
    newSocket.on('room_created', (data) => {
      if (data.success) {
        setRoomCode(data.roomCode);
        setPlayerId(data.playerId);
        console.log('Room created:', data.roomCode);
      }
    });

    // Player joined event
    newSocket.on('player_joined', (data) => {
      console.log('Player joined room');
    });

    // Game started event
    newSocket.on('game_started', () => {
      setGamePhase('guessing');
      console.log('Game started');
    });

    // Location loaded event
    newSocket.on('location_loaded', (data) => {
      setRoundData({
        round: data.round,
        totalRounds: data.totalRounds,
        locationId: data.locationId,
        label: data.label,
      });
      setOpponentGuessed(false);
      setGamePhase('guessing');
    });

    // Guess received confirmation
    newSocket.on('guess_received', (data) => {
      setGamePhase('waiting');
      console.log('Guess received by server');
    });

    // Opponent guessed notification
    newSocket.on('opponent_guessed', (data) => {
      setOpponentGuessed(true);
    });

    // Results revealed event
    newSocket.on('results_revealed', (data) => {
      setRoundData((prev) => ({
        ...prev,
        results: data,
      }));
      setGamePhase('result');
    });

    // Round started event
    newSocket.on('round_started', (data) => {
      setGamePhase('guessing');
      setOpponentGuessed(false);
    });

    // Game finished event
    newSocket.on('game_finished', (data) => {
      setRoundData((prev) => ({
        ...prev,
        finalResult: data,
      }));
      setGamePhase('finished');
    });

    // Opponent disconnected
    newSocket.on('opponent_disconnected', (data) => {
      setError('Opponent disconnected');
      setGamePhase('waiting');
    });

    // Error handling
    newSocket.on('error', (data) => {
      setError(data.message);
      console.error('Socket error:', data.message);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      setConnected(false);
    });

    socketRef.current = newSocket;

    return () => {
      newSocket.disconnect();
    };
  }, [enabled]);

  // Create room
  const createRoom = () => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current) {
        reject(new Error('Socket not connected'));
        return;
      }

      socketRef.current.emit('create_room', (response) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.error));
        }
      });
    });
  };

  // Join room
  const joinRoom = (code) => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current) {
        reject(new Error('Socket not connected'));
        return;
      }

      socketRef.current.emit('join_room', { roomCode: code }, (response) => {
        if (response.success) {
          setRoomCode(code);
          setPlayerId(response.playerId);
          resolve(response);
        } else {
          reject(new Error(response.error));
        }
      });
    });
  };

  // Submit guess
  const submitGuess = (lat, lng) => {
    if (!socketRef.current || !roomCode || !playerId) {
      console.error('Cannot submit guess: socket not ready');
      return;
    }

    socketRef.current.emit('submit_guess', {
      roomCode,
      playerId,
      guess: { lat, lng },
    });
  };

  // Load next location
  const loadNextLocation = () => {
    if (!socketRef.current || !roomCode) {
      console.error('Cannot load location: socket not ready');
      return;
    }

    socketRef.current.emit('load_location', { roomCode });
  };

  // Next round
  const goToNextRound = () => {
    if (!socketRef.current || !roomCode) {
      console.error('Cannot go to next round: socket not ready');
      return;
    }

    socketRef.current.emit('next_round', { roomCode });
  };

  return {
    connected,
    roomCode,
    playerId,
    opponentGuessed,
    gamePhase,
    roundData,
    error,
    createRoom,
    joinRoom,
    submitGuess,
    loadNextLocation,
    goToNextRound,
  };
};
