import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

// Room Management
const rooms = new Map();

// Utility: Generate room code
function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Utility: Calculate distance (Haversine formula)
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Utility: Calculate score (exponential)
function calculateScore(distance) {
  return Math.round(5000 * Math.exp(-distance / 2000));
}

// Utility: Calculate bonus for closer player
function getCloserBonus(distance1, distance2) {
  if (distance1 < distance2) return 500;
  if (distance2 < distance1) return -500;
  return 0;
}

// Socket.IO Events
io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // Create Room
  socket.on('create_room', (callback) => {
    try {
      let roomCode = generateRoomCode();
      // Ensure unique room code
      while (rooms.has(roomCode)) {
        roomCode = generateRoomCode();
      }

      const room = {
        roomCode,
        players: {
          p1: {
            id: socket.id,
            socketId: socket.id,
            score: 0,
            guess: null,
            hasGuessed: false,
          },
          p2: {
            id: null,
            socketId: null,
            score: 0,
            guess: null,
            hasGuessed: false,
          },
        },
        currentLocation: null,
        round: 1,
        totalRounds: 10,
        gameStatus: 'waiting', // 'waiting' | 'guessing' | 'result' | 'finished'
        usedLocations: [],
      };

      rooms.set(roomCode, room);
      socket.join(roomCode);
      socket.emit('room_created', {
        success: true,
        roomCode,
        playerId: 'p1',
        message: `Room created! Share code: ${roomCode}`,
      });

      console.log(`Room created: ${roomCode}`);
      callback({ success: true, roomCode, playerId: 'p1' });
    } catch (error) {
      console.error('Error creating room:', error);
      callback({ success: false, error: error.message });
    }
  });

  // Join Room
  socket.on('join_room', (data, callback) => {
    try {
      const { roomCode } = data;
      const room = rooms.get(roomCode);

      if (!room) {
        return callback({ success: false, error: 'Room not found' });
      }

      if (room.players.p2.socketId !== null) {
        return callback({ success: false, error: 'Room is full' });
      }

      room.players.p2.socketId = socket.id;
      room.players.p2.id = socket.id;
      socket.join(roomCode);

      // Notify both players
      io.to(roomCode).emit('player_joined', {
        roomCode,
        p1Ready: true,
        p2Ready: true,
        message: 'Both players connected! Game starting...',
      });

      callback({ success: true, roomCode, playerId: 'p2' });
      console.log(`Player p2 joined room: ${roomCode}`);

      // Start game automatically when both players join
      setTimeout(() => {
        socket.to(roomCode).emit('start_game', { round: 1, totalRounds: room.totalRounds });
        io.to(roomCode).emit('game_started');
        
        // Auto-load first location after game starts
        setTimeout(() => {
          socket.emit('load_location', { roomCode });
        }, 1000);
      }, 500);
    } catch (error) {
      console.error('Error joining room:', error);
      callback({ success: false, error: error.message });
    }
  });

  // Location Data (Must match frontend's locationData.js)
  const LOCATION_DATA = {
    v1: { lat: 25.3245, lng: 82.9863, label: 'Kashi Vishwanath', city: 'Varanasi' },
    v2: { lat: 21.6455, lng: 70.3901, label: 'Somnath', city: 'Prabhas Patan' },
    v3: { lat: 13.1829, lng: 79.8343, label: 'Tirupati', city: 'Tirupati' },
    v4: { lat: 9.9252, lng: 78.1198, label: 'Meenakshi', city: 'Madurai' },
    v5: { lat: 19.8136, lng: 85.8312, label: 'Jagannath', city: 'Puri' },
    v6: { lat: 22.2411, lng: 68.9707, label: 'Dwarka', city: 'Dwarka' },
    v7: { lat: 30.7369, lng: 79.9181, label: 'Badrinath', city: 'Badrinath' },
    v8: { lat: 30.7355, lng: 79.5670, label: 'Kedarnath', city: 'Kedarnath' },
    c1: { lat: 11.0076, lng: 79.2987, label: 'Brihadeeswarar', city: 'Thanjavur' },
    c2: { lat: 9.2868, lng: 79.8379, label: 'Ramanathaswamy', city: 'Rameswaram' },
    c3: { lat: 24.6955, lng: 84.7849, label: 'Mahabodhi', city: 'Bodh Gaya' },
    c4: { lat: 23.1815, lng: 77.4143, label: 'Sanchi', city: 'Sanchi' },
    c5: { lat: 15.3350, lng: 76.4631, label: 'Hampi', city: 'Hampi' },
    c6: { lat: 23.1815, lng: 75.7747, label: 'Mahakaleshwar', city: 'Ujjain' },
    c7: { lat: 32.2596, lng: 75.3142, label: 'Vaishno Devi', city: 'Katra' },
    c8: { lat: 19.0760, lng: 74.4960, label: 'Shirdi', city: 'Shirdi' },
    j1: { lat: 15.3350, lng: 76.4631, label: 'Virupaksha', city: 'Hampi' },
    j2: { lat: 12.9352, lng: 79.6245, label: 'Ekambareswarar', city: 'Kanchipuram' },
    j3: { lat: 11.5642, lng: 79.8945, label: 'Nataraja Chidambaram', city: 'Chidambaram' },
    j4: { lat: 10.8945, lng: 78.6789, label: 'Ranganathaswamy', city: 'Srirangam' },
    j5: { lat: 20.2355, lng: 85.8245, label: 'Lingaraja', city: 'Bhubaneswar' },
    j6: { lat: 14.6420, lng: 74.4890, label: 'Murudeshwar', city: 'Murdeshwar' },
    j7: { lat: 10.9172, lng: 76.0315, label: 'Guruvayur', city: 'Guruvayur' },
    j8: { lat: 22.3667, lng: 75.9667, label: 'Omkareshwar', city: 'Omkareshwar' },
  };

  // Load Next Location (called after both players are ready)
  socket.on('load_location', (data) => {
    try {
      const { roomCode } = data;
      const room = rooms.get(roomCode);

      if (!room) {
        console.error(`Room ${roomCode} not found`);
        return;
      }

      const locations = Object.entries(LOCATION_DATA).map(([id, data]) => ({
        id,
        ...data,
      }));

      const availableLocations = locations.filter(
        (loc) => !room.usedLocations.includes(loc.id)
      );

      let selectedLocation;
      if (availableLocations.length === 0) {
        // Reset used locations
        room.usedLocations = [];
        selectedLocation = locations[Math.floor(Math.random() * locations.length)];
      } else {
        selectedLocation = availableLocations[Math.floor(Math.random() * availableLocations.length)];
      }

      room.usedLocations.push(selectedLocation.id);
      room.currentLocation = selectedLocation;

      // Reset guesses
      room.players.p1.guess = null;
      room.players.p1.hasGuessed = false;
      room.players.p2.guess = null;
      room.players.p2.hasGuessed = false;

      room.gameStatus = 'guessing';

      // Send location to both players
      io.to(roomCode).emit('location_loaded', {
        round: room.round,
        totalRounds: room.totalRounds,
        locationId: selectedLocation.id,
        label: selectedLocation.label,
      });

      console.log(`Location loaded in room ${roomCode}: ${selectedLocation.label}`);
    } catch (error) {
      console.error('Error loading location:', error);
    }
  });

  // Submit Guess
  socket.on('submit_guess', (data) => {
    try {
      const { roomCode, playerId, guess } = data;
      const room = rooms.get(roomCode);

      if (!room) {
        console.error(`Room ${roomCode} not found`);
        return;
      }

      // Store guess
      room.players[playerId].guess = guess;
      room.players[playerId].hasGuessed = true;

      // Notify the player that their guess was received
      socket.emit('guess_received', {
        playerId,
        message: 'Your guess has been submitted. Waiting for opponent...',
      });

      // Check if both players have guessed
      const p1Guessed = room.players.p1.hasGuessed;
      const p2Guessed = room.players.p2.hasGuessed;

      if (p1Guessed && p2Guessed) {
        // Both players have guessed, calculate results
        calculateAndRevealResults(roomCode, room);
      } else {
        // Notify the other player that opponent has guessed
        const otherPlayerId = playerId === 'p1' ? 'p2' : 'p1';
        const otherSocket = room.players[otherPlayerId].socketId;
        io.to(otherSocket).emit('opponent_guessed', {
          message: 'Opponent has submitted their guess. Still waiting...',
        });
      }

      console.log(`Guess submitted in room ${roomCode} by ${playerId}`);
    } catch (error) {
      console.error('Error submitting guess:', error);
      socket.emit('error', { message: error.message });
    }
  });

  // Next Round
  socket.on('next_round', (data) => {
    try {
      const { roomCode } = data;
      const room = rooms.get(roomCode);

      if (!room) return;

      room.round += 1;

      if (room.round > room.totalRounds) {
        room.gameStatus = 'finished';
        io.to(roomCode).emit('game_finished', {
          p1Score: room.players.p1.score,
          p2Score: room.players.p2.score,
          winner:
            room.players.p1.score > room.players.p2.score
              ? 'p1'
              : room.players.p1.score < room.players.p2.score
              ? 'p2'
              : 'tie',
        });
      } else {
        room.gameStatus = 'waiting';
        io.to(roomCode).emit('round_started', { round: room.round });
      }
    } catch (error) {
      console.error('Error in next_round:', error);
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);

    // Find and clean up the room
    for (const [roomCode, room] of rooms) {
      if (room.players.p1.socketId === socket.id || room.players.p2.socketId === socket.id) {
        const remainingPlayer = room.players.p1.socketId === socket.id ? 'p2' : 'p1';
        io.to(roomCode).emit('opponent_disconnected', {
          message: 'Opponent has disconnected. Game ended.',
        });

        // Clean up room if both players are gone
        if (
          (room.players.p1.socketId === socket.id && !room.players.p2.socketId) ||
          (room.players.p2.socketId === socket.id && !room.players.p1.socketId)
        ) {
          rooms.delete(roomCode);
          console.log(`Room deleted: ${roomCode}`);
        } else {
          // Reset the disconnected player
          if (room.players.p1.socketId === socket.id) {
            room.players.p1 = {
              id: null,
              socketId: null,
              score: 0,
              guess: null,
              hasGuessed: false,
            };
          } else {
            room.players.p2 = {
              id: null,
              socketId: null,
              score: 0,
              guess: null,
              hasGuessed: false,
            };
          }
        }
        break;
      }
    }
  });
});

// Helper: Calculate and reveal results
function calculateAndRevealResults(roomCode, room) {
  const correct = room.currentLocation;
  const p1Guess = room.players.p1.guess;
  const p2Guess = room.players.p2.guess;

  if (!p1Guess || !p2Guess) return;

  const distance1 = calculateDistance(p1Guess.lat, p1Guess.lng, correct.lat, correct.lng);
  const distance2 = calculateDistance(p2Guess.lat, p2Guess.lng, correct.lat, correct.lng);

  const baseScore1 = calculateScore(distance1);
  const baseScore2 = calculateScore(distance2);
  const bonus1 = getCloserBonus(distance1, distance2);
  const bonus2 = -bonus1;

  const p1RoundScore = baseScore1 + bonus1;
  const p2RoundScore = baseScore2 + bonus2;

  room.players.p1.score += p1RoundScore;
  room.players.p2.score += p2RoundScore;

  room.gameStatus = 'result';

  // Reveal results to both players
  io.to(roomCode).emit('results_revealed', {
    correct,
    p1: {
      guess: p1Guess,
      distance: distance1.toFixed(2),
      roundScore: p1RoundScore,
      totalScore: room.players.p1.score,
    },
    p2: {
      guess: p2Guess,
      distance: distance2.toFixed(2),
      roundScore: p2RoundScore,
      totalScore: room.players.p2.score,
    },
    round: room.round,
    totalRounds: room.totalRounds,
  });

  console.log(`Results revealed in room ${roomCode}`);
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Get room info (for debugging)
app.get('/rooms/:roomCode', (req, res) => {
  const { roomCode } = req.params;
  const room = rooms.get(roomCode);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  res.json({
    roomCode,
    p1Ready: !!room.players.p1.socketId,
    p2Ready: !!room.players.p2.socketId,
    gameStatus: room.gameStatus,
    round: room.round,
    p1Score: room.players.p1.score,
    p2Score: room.players.p2.score,
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
