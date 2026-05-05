# GeoGuessr Multiplayer Implementation Guide

## 📋 System Architecture Overview

### High-Level Flow Diagram
```
Player 1                    Server                     Player 2
   |                          |                          |
   |---- Create Room -------->|                          |
   |<---- Room Code (e.g. "A7K2") ---|                  |
   |                          |                          |
   |                          |<---- Join Room ("A7K2")|
   |                          |                          |
   |<--------- Both Connected, Start Game ---------->|
   |                          |                          |
   |<--- Load Random Location (Hidden) --->|
   |                          |                          |
   | Click to Place Guess     |     Click to Place Guess |
   |-------- Submit Guess --->|<------ Submit Guess ---|
   |                          |                          |
   |<-- Both Submitted? YES -->|                          |
   |                          |                          |
   |<-- Calculate Scores, Reveal Location & Results --->|
   |    Distance: 245km       |       Distance: 128km    |
   |    Score: 3200 pts       |       Score: 4100 pts    |
   |    Winner: P2 (+500 bonus)|      Winner: P2         |
   |                          |                          |
   |<---- Next Round? ------->|                          |
   |      (Repeat)            |      (Repeat)            |
   |                          |                          |
   |<--- Game Over After 10 Rounds: Final Scores --->|
```

## 🏗️ Component Architecture

```
App.jsx (Main Controller)
├── GameModeSelector (Choose single or multiplayer)
├── [When Multiplayer Selected]
│   ├── RoomModal (Create or Join Room)
│   ├── MultiplayerGameOverlay (Room info, player status)
│   ├── GameMap / GuessMap (Map interaction)
│   ├── GuessControls (Submit button)
│   ├── ImageClue (Location image)
│   ├── Scoreboard (Current scores)
│   └── GameOverScreen (Final results)
└── [When Single Player]
    ├── GameMap
    ├── GuessControls
    ├── ImageClue
    └── Scoreboard
```

## 🔄 Game State Flow

### Phase 1: Lobby (Waiting for Players)
- Player 1 creates room → receives 4-char code (e.g., "A7K2")
- Player 1 shares code with Player 2
- Player 2 enters code and joins room
- **Server State**: `gameStatus = 'waiting'`
- **UI**: Shows room code, waiting indicator

### Phase 2: Game Start
- When both players join, server starts automatically
- Server randomly selects location (hidden from players)
- Location sent as image only (coordinates kept secret)
- **Server State**: `gameStatus = 'guessing'`
- **UI**: Map enabled, guess controls visible

### Phase 3: Guessing
- Player 1 clicks map → places marker (can click multiple times to adjust)
- Player 1 clicks "Submit Guess" → coordinates sent to server
  - Server updates: `room.players.p1.hasGuessed = true`
  - UI: Shows "Waiting for opponent..."
- Player 2 does same
  - Server checks: `if (p1.hasGuessed && p2.hasGuessed) → calculateResults()`
- **Server State**: `gameStatus = 'guessing'` (still guessing until both submit)

### Phase 4: Results Reveal
- Server calculates:
  - Distance from each guess to actual location (Haversine formula)
  - Base score: `5000 * e^(-distance/2000)` (exponential decay)
  - Closer player bonus: +500 pts
  - Other player penalty: -500 pts
- Sends results to both players with:
  - Actual location revealed
  - Both markers on map (player1 in blue, player2 in red)
  - Distances and scores for both
  - Current cumulative scores
- **Server State**: `gameStatus = 'result'`
- **UI**: Results screen, "Next Round" button enabled

### Phase 5: Next Round or Game Over
- Player clicks "Next Round"
- Server increments round, checks if `round > totalRounds`
  - **If YES**: Send final scores, game over
  - **If NO**: Reset to Phase 2 (load new location)

## 📊 Data Structures

### Room Object (Server)
```javascript
{
  roomCode: "A7K2",
  players: {
    p1: {
      socketId: "socket-id-123",
      score: 5200,        // Cumulative across rounds
      guess: { lat: 25.3, lng: 82.9 },
      hasGuessed: true
    },
    p2: {
      socketId: "socket-id-456",
      score: 4800,
      guess: { lat: 25.5, lng: 83.1 },
      hasGuessed: true
    }
  },
  currentLocation: { 
    id: 'v1',
    label: 'Varanasi',
    lat: 25.3164,   // Hidden until results
    lng: 82.9789    // Hidden until results
  },
  round: 1,
  totalRounds: 10,
  gameStatus: 'guessing',  // 'waiting' | 'guessing' | 'result' | 'finished'
  usedLocations: ['v1']    // Track used locations
}
```

### Round Result Object (Sent to Clients)
```javascript
{
  correct: { lat: 25.3164, lng: 82.9789, label: 'Varanasi' },
  p1: {
    guess: { lat: 25.3, lng: 82.9 },
    distance: "12.45",           // km
    roundScore: 3700,            // Base score + bonus/penalty
    totalScore: 12300            // Cumulative
  },
  p2: {
    guess: { lat: 25.5, lng: 83.1 },
    distance: "28.56",
    roundScore: 3200,
    totalScore: 12000
  },
  round: 1,
  totalRounds: 10
}
```

## 🔌 Socket.IO Events

### Client → Server

**`create_room`**
- Emitted when: Player 1 clicks "Create Room"
- Callback: `{ success, roomCode, playerId: 'p1' }`

**`join_room`**
- Data: `{ roomCode: "A7K2" }`
- Callback: `{ success, roomCode, playerId: 'p2' }`

**`load_location`**
- Data: `{ roomCode: "A7K2" }`
- Emitted when: Game starts (server auto-sends after both join)

**`submit_guess`**
- Data: `{ roomCode, playerId, guess: { lat, lng } }`
- Server responds via: `guess_received` event

**`next_round`**
- Data: `{ roomCode }`
- Server responds via: `round_started` or `game_finished`

### Server → Client

**`room_created`**
- Data: `{ success, roomCode, playerId, message }`

**`player_joined`**
- Data: `{ roomCode, p1Ready, p2Ready, message }`
- Sent to: Both players

**`game_started`**
- Sent to: Both players (auto-trigger when 2nd player joins)

**`location_loaded`**
- Data: `{ round, totalRounds, locationId, label }`
- Note: **Coordinates NOT sent** (players see image, must guess)

**`guess_received`**
- Data: `{ playerId, message }`
- Sent to: The player who submitted

**`opponent_guessed`**
- Data: `{ message }`
- Sent to: The other player when opponent submits

**`results_revealed`**
- Data: Full round result object (see above)
- Sent to: Both players

**`round_started`**
- Data: `{ round }`
- Sent to: Both players

**`game_finished`**
- Data: `{ p1Score, p2Score, winner: 'p1'|'p2'|'tie' }`
- Sent to: Both players

**`opponent_disconnected`**
- Data: `{ message }`
- Sent to: Remaining player

## ⚙️ Critical Rules

### 🚫 NEVER Reveal Coordinates Until Results
- Location image and label only
- Coordinates kept secret on server until both guesses received
- Prevents cheating (e.g., devtools inspection)

### 🔒 Guess Lock
- Once submitted, player cannot change guess
- Submit button disabled until next round

### ⏳ Waiting State
- Show "Waiting for opponent..." UI until both have guessed
- Show opponent has guessed to current player

### 🌍 Distance Calculation (Haversine)
```
Used to calculate great-circle distance between two points on Earth
Accounts for Earth's curvature (radius = 6371 km)
Formula: R × 2×arcsin(√(sin²(Δφ/2) + cos(φ₁)×cos(φ₂)×sin²(Δλ/2)))
```

### 📈 Scoring Formula
```
Base Score = 5000 × e^(-distance/2000)
- At 0 km: 5000 points (max)
- At 2 km: 1839 points
- At 10 km: 82 points
- Closer player: +500 bonus
- Farther player: -500 penalty
```

## 🚀 Implementation Checklist

- [x] Backend Socket.io server (server/server.js)
- [x] useMultiplayer hook (src/hooks/useMultiplayer.js)
- [x] useGameController hook (src/hooks/useGameController.js)
- [x] RoomModal component
- [x] MultiplayerGameOverlay component
- [ ] App.jsx multiplayer integration
- [ ] CSS for multiplayer components
- [ ] Environment variables (.env)
- [ ] Test full flow end-to-end

## 🧪 Testing Scenarios

### Scenario 1: Happy Path
1. Player 1 creates room (gets "A7K2")
2. Player 2 joins with code
3. Both see Varanasi image
4. Player 1 clicks at coordinates X, submits
5. Player 2 clicks at coordinates Y, submits
6. Server calculates, reveals actual Varanasi location
7. Both see results and scores
8. Both click "Next Round"
9. Repeat until round 10
10. See final scores

### Scenario 2: Opponent Disconnects
1. Player 1 creates room, Player 2 joins
2. They start guessing
3. Player 2 closes browser
4. Player 1 sees "Opponent disconnected" message
5. Game ends

### Scenario 3: Slow Network
1. Player 1 submits guess (sees waiting message)
2. Network delay causes 5-second lag
3. Player 2 submits guess
4. After lag clears, results show on both
