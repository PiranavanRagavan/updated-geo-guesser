# Complete 2-Player Multiplayer Implementation Guide

## Quick Start

### 1. Set Up Environment

**Frontend (.env in root):**
```
VITE_SOCKET_URL=http://localhost:3001
```

**Backend (server/.env):**
```
PORT=3001
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

### 2. Install & Run

**Terminal 1 (Frontend):**
```bash
npm install
npm run dev
```

**Terminal 2 (Backend):**
```bash
cd server
npm install
npm run dev
```

### 3. Test Multiplayer

1. Open `http://localhost:5173` in two different browsers (or incognito windows)
2. Select "Two Players" on both
3. Player 1 clicks "Create Room" → gets code (e.g., "A7K2")
4. Player 2 enters code → both join same room
5. Game starts automatically when both join
6. Both see same location image (coordinates hidden)
7. Both click map to place guesses
8. Submit when ready
9. Server reveals actual location + results

---

## System Architecture

### Component Hierarchy

```
App.jsx
├── State: useGameController + useMultiplayer
├── GameModeSelector (single/two-player choice)
└── [If Two-Player]
    ├── RoomModal (create/join room UI)
    ├── MultiplayerGameOverlay (room info, status)
    ├── GameMap (Leaflet map with guess markers)
    ├── ImageClue (location image)
    ├── Scoreboard (scores for both players)
    ├── GuessControls (submit button)
    └── GameOverScreen (final results)
```

### Data Flow

```
User Action (click map)
  ↓
App.jsx (handleMapClick)
  ↓
useGameController (recordGuess)
  ↓
Local state updated (guesses.player1)
  ↓
Component re-renders with marker
  ↓
User clicks Submit
  ↓
useMultiplayer (submitGuess)
  ↓
Socket.IO emit (submit_guess)
  ↓
Server (receives guess, checks if both ready)
  ↓
Server (if both ready, emit results_revealed)
  ↓
useMultiplayer (receives results_revealed)
  ↓
App updates roundResults state
  ↓
GameMap shows both guesses + correct location
  ↓
Scoreboard updates with new scores
```

---

## Key Concepts

### Game States

```
Phase 1: LOBBY
├─ Player 1 creates room
├─ Gets code (e.g., "A7K2")
├─ Waits for Player 2
└─ UI: Shows room code, waiting message

Phase 2: GUESSING (both players in room)
├─ Server picks location (hidden)
├─ Image sent to both players
├─ Map enabled for clicking
├─ Each player places marker
└─ UI: Map active, submit button visible

Phase 3: WAITING
├─ Player 1 submits guess
├─ Player 2 still guessing
└─ UI: "Waiting for opponent..." message

Phase 4: REVEAL
├─ Both guesses received by server
├─ Server calculates scores
├─ Actual location revealed
├─ Both markers shown on map
└─ UI: Results displayed, next round button enabled

Phase 5: NEXT ROUND or GAME OVER
├─ If round < 10: reset to Phase 2
├─ If round == 10: show final scores
└─ UI: Game over screen with winner
```

### Room Object (Server-Side)

```javascript
{
  roomCode: "A7K2",                    // Unique identifier
  players: {
    p1: {
      socketId: "abc123",              // Socket connection ID
      score: 12500,                    // Cumulative points
      guess: { lat: 25.3, lng: 82.9 }, // Last guess
      hasGuessed: true                 // This round submitted?
    },
    p2: { ... }                        // Same for player 2
  },
  currentLocation: {                   // NEVER sent to clients
    id: 'v1',
    label: 'Varanasi',
    lat: 25.3164,                      // SECRET - only after results
    lng: 82.9789                       // SECRET - only after results
  },
  round: 1,                            // Current round (1-10)
  totalRounds: 10,
  gameStatus: 'guessing',              // State machine
  usedLocations: ['v1', 'v2']          // Track for variety
}
```

### Socket Events

**Client → Server:**
- `create_room` - Player 1 initiates
- `join_room` - Player 2 enters code
- `submit_guess { lat, lng }` - After clicking map
- `next_round` - Move to next round
- `disconnect` - Browser closed

**Server → Client:**
- `room_created { roomCode, playerId }` - Created room
- `player_joined` - Second player joined
- `game_started` - Auto-trigger when 2nd joins
- `location_loaded { locationId, label }` - New round starts
- `guess_received` - Submission confirmed
- `opponent_guessed` - Other player submitted
- `results_revealed { ... }` - Show results
- `game_finished { p1Score, p2Score, winner }` - Game over

---

## Code Examples

### Hook: useGameController

```javascript
// Single-player guess
game.recordGuess(25.3, 82.9)    // Record marker
game.submitSinglePlayerGuess()  // Calculate score

// Multiplayer guess (server handles)
game.recordGuess(25.3, 82.9)    // Local marker preview
multiplayer.submitGuess(25.3, 82.9)  // Send to server
```

### Hook: useMultiplayer

```javascript
// Create room
await multiplayer.createRoom()
// → Returns { roomCode: "A7K2" }

// Join room
await multiplayer.joinRoom("A7K2")
// → Joins server-side room

// Submit guess
multiplayer.submitGuess(25.3, 82.9)
// → Server receives, checks if both ready

// Next round
multiplayer.goToNextRound()
// → Server either starts new round or ends game
```

### Event Listener in App.jsx

```javascript
// Listen for results from server
useEffect(() => {
  if (multiplayer.gamePhase === 'result' && 
      multiplayer.roundData?.results) {
    
    const results = multiplayer.roundData.results
    
    // Update local UI with server results
    setMultiplayerRoundResults({
      correct: results.correct,      // Now revealed!
      p1: results.p1,                // P1 distance & score
      p2: results.p2,                // P2 distance & score
    })
    
    // Show results on map
    setMultiplayerScores({
      p1: results.p1.totalScore,
      p2: results.p2.totalScore,
    })
  }
}, [multiplayer.gamePhase])
```

### Server: Calculate & Reveal Results

```javascript
// server.js
function calculateAndRevealResults(roomCode, room) {
  const correct = room.currentLocation
  const p1Guess = room.players.p1.guess
  const p2Guess = room.players.p2.guess

  // Calculate distances (Haversine formula)
  const distance1 = calculateDistance(
    p1Guess.lat, p1Guess.lng,
    correct.lat, correct.lng
  )

  // Score formula: 5000 * e^(-distance/2000)
  const baseScore1 = calculateScore(distance1)  // 5000 * Math.exp(-distance/2000)
  
  // Bonus for closer guess: ±500 points
  const bonus1 = getCloserBonus(distance1, distance2)
  
  // Send to BOTH clients (NOW with coordinates!)
  io.to(roomCode).emit('results_revealed', {
    correct: room.currentLocation,    // ← Coordinates revealed!
    p1: { guess, distance, score },
    p2: { guess, distance, score },
  })
}
```

---

## Common Issues & Solutions

### Issue: Players see different locations
**Cause:** Room not synced properly
**Solution:** Check that `locationId` matches in `results_revealed` event

### Issue: Coordinates visible in source code
**Cause:** Sending coordinates before results
**Solution:** Ensure only image ID sent during guessing phase

### Issue: Guess submitted but nothing happens
**Cause:** Server waiting for other player
**Solution:** Other player hasn't submitted yet - see "Waiting for opponent..."

### Issue: "Room not found" error
**Cause:** Room code typo or server crashed
**Solution:** Both players create new room, enter code carefully

### Issue: Scores not updating correctly
**Cause:** Bonus calculation wrong or state not updating
**Solution:** Check `getCloserBonus()` returns ±500, not distance

---

## Testing Checklist

- [ ] Two browsers can join same room
- [ ] Location image shown without coordinates visible
- [ ] Both players can click map and see markers
- [ ] Submit button disabled after guess
- [ ] "Waiting for opponent..." shows when one player submits
- [ ] Results show actual location with both guesses
- [ ] Distances calculated correctly (check against online Haversine calculator)
- [ ] Scores updated properly
- [ ] Game ends after 10 rounds
- [ ] Final scores match cumulative calculations
- [ ] Disconnecting one player shows error on other
- [ ] Reconnection attempts work
- [ ] Works on mobile devices

---

## Performance Optimization

### Socket.IO Optimization
```javascript
// Use namespaces for multiplayer
io.of('/multiplayer')
  .on('connection', (socket) => { ... })
```

### Room Cleanup
```javascript
// Delete room 5 minutes after game ends
setTimeout(() => {
  rooms.delete(roomCode)
}, 5 * 60 * 1000)
```

### Compression
```javascript
// server.js - Enable compression
io.engine.wsEngine = '@socket.io/ws-engine'
```

---

## Future Enhancements

### Level 1: Basic
- [x] Room codes
- [x] Simultaneous guessing
- [x] Score calculation
- [x] Multiple rounds

### Level 2: Features
- [ ] Leaderboard (persist scores)
- [ ] Custom game modes (3-4 players)
- [ ] Timed rounds (60 seconds to guess)
- [ ] Power-ups (double points, peek at location)
- [ ] Game chat during rounds

### Level 3: Advanced
- [ ] Elo rating system
- [ ] Replay system (see opponent's guess after round)
- [ ] Social features (friend invites)
- [ ] Seasonal rankings
- [ ] Custom location packs

### Level 4: Infrastructure
- [ ] Database for game history
- [ ] Authentication system
- [ ] Cloud deployment (AWS/Vercel)
- [ ] Analytics dashboard
- [ ] Admin panel for moderation

---

## Deployment Guide

### Vercel (Frontend)
1. Connect GitHub repo
2. Add environment variables: `VITE_SOCKET_URL=your-backend-url`
3. Deploy automatically on push

### Heroku/Railway (Backend)
1. Create .env file with `PORT` and `CLIENT_URL`
2. Deploy with `git push`
3. Set environment variables in platform dashboard

### Self-Hosted
1. Use PM2 to manage processes
2. Set up Nginx reverse proxy
3. Get SSL certificate from Let's Encrypt
4. Configure firewall to allow ports 80/443

---

## API Reference

### Room Creation
```
Event: create_room
Payload: (empty)
Response: { success, roomCode, playerId: 'p1' }
```

### Room Joining
```
Event: join_room
Payload: { roomCode: string }
Response: { success, roomCode, playerId: 'p2' }
```

### Guess Submission
```
Event: submit_guess
Payload: { roomCode, playerId, guess: { lat, lng } }
Broadcast: results_revealed (when both ready)
```

### Round Progression
```
Event: next_round
Payload: { roomCode }
Broadcast: round_started or game_finished
```

---

## File Structure

```
geo-guesser/
├── src/
│   ├── components/
│   │   ├── GameMap.jsx
│   │   ├── ImageClue.jsx
│   │   ├── Scoreboard.jsx
│   │   ├── RoomModal.jsx              ← NEW
│   │   ├── MultiplayerGameOverlay.jsx ← NEW
│   │   └── ...
│   ├── hooks/
│   │   ├── useGameController.js       ← UPDATED
│   │   └── useMultiplayer.js          ← NEW
│   ├── styles/
│   │   ├── MultiplayerGameOverlay.css ← NEW
│   │   ├── RoomModal.css              ← NEW
│   │   └── ...
│   └── App.jsx                        ← UPDATED
├── server/
│   ├── server.js                      ← UPDATED
│   ├── package.json
│   └── .env.example
├── MULTIPLAYER_ARCHITECTURE.md        ← NEW (this file)
└── .env.example
```

