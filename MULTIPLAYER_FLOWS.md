# Multiplayer Flow Diagrams

## 🎮 Complete Game Round Flow

```
╔════════════════════════════════════════════════════════════════════════╗
║                   COMPLETE SINGLE ROUND FLOW                           ║
╚════════════════════════════════════════════════════════════════════════╝

START ROUND
    ↓
[1] SERVER LOADS LOCATION
    ├─ Picks random temple (v1, v2, v3, etc.)
    ├─ Stores coordinates on server (SECRET)
    ├─ Sends locationId + image to both players
    └─ Both players see: "Varanasi" + temple photo
    
    ↓
[2] GUESSING PHASE (60 sec per player, no time limit currently)
    │
    ├─ PLAYER 1
    │  ├─ Clicks map → Blue marker appears
    │  ├─ Can click multiple times to adjust
    │  └─ Clicks "Submit" → Guess locked
    │
    ├─ PLAYER 2
    │  ├─ Clicks map → Red marker appears
    │  ├─ Can click multiple times to adjust
    │  └─ Clicks "Submit" → Guess locked
    │
    ├─ When P1 submitted, P1 sees: "⏳ Waiting for opponent..."
    └─ When P2 submitted → Both notified
    
    ↓
[3] SERVER CALCULATES RESULTS
    ├─ Distance P1 = Haversine(P1 guess, actual)
    ├─ Distance P2 = Haversine(P2 guess, actual)
    ├─ Score P1 = 5000 × e^(-dist1/2000)
    ├─ Score P2 = 5000 × e^(-dist2/2000)
    ├─ Bonus winner: +500 pts
    └─ Penalty loser: -500 pts
    
    ↓
[4] RESULTS REVEALED
    ├─ Both see actual location (green marker)
    ├─ P1 sees own guess (blue marker)
    ├─ P1 sees opponent guess (red marker)
    ├─ Shows distances: "245 km" vs "128 km"
    ├─ Shows round scores: 3200 vs 4100
    └─ Shows cumulative: 12300 vs 12100
    
    ↓
[5] ROUND WINNER ANNOUNCED
    └─ "🏆 Player 2 wins this round! +500 bonus"
    
    ↓
[6] NEXT ROUND DECISION
    ├─ Round < 10? → "Next Round" button
    └─ Round == 10? → "View Final Scores"
    
    ↓
[7A] IF NEXT ROUND → Go to [1]
[7B] IF GAME END → Show final scores, replay option
```

## 🔐 Data Flow - What's Visible When

```
┌─────────────────────────────────────────────────────────────────────┐
│                    INFORMATION VISIBILITY                            │
└─────────────────────────────────────────────────────────────────────┘

DURING GUESSING PHASE:
┌─────────────────────────────────────┐
│ PLAYER 1 SEES          PLAYER 2 SEES
├─────────────────────────────────────┤
│ ✓ Location image       ✓ Location image
│ ✓ Location name        ✓ Location name
│ ✓ My marker            ✓ My marker
│ ✓ Opponent status*     ✓ Opponent status*
│ ✗ Coordinates          ✗ Coordinates
│ ✗ Actual location      ✗ Actual location
│ ✗ Opponent's guess     ✗ Opponent's guess
└─────────────────────────────────────┘
*Status: "Guessing...", "Submitted!", "Waiting..."

AFTER BOTH SUBMIT:
┌──────────────────────────────────────────────────────┐
│ BOTH PLAYERS SEE                                     │
├──────────────────────────────────────────────────────┤
│ ✓ Actual location (green marker)                     │
│ ✓ Player 1 guess (blue marker)                       │
│ ✓ Player 2 guess (red marker)                        │
│ ✓ Distance measurements: "245 km" vs "128 km"        │
│ ✓ Round scores: P1: 3200, P2: 4100                   │
│ ✓ Cumulative scores: P1: 12300, P2: 12100            │
│ ✓ Round winner indicator: "Player 2 wins!"           │
└──────────────────────────────────────────────────────┘

GAME OVER SCREEN:
┌──────────────────────────────────────────────────────┐
│ BOTH PLAYERS SEE                                     │
├──────────────────────────────────────────────────────┤
│ ✓ Final scores: P1: 42300 pts, P2: 41800 pts         │
│ ✓ Game winner: "🏆 Player 1 wins!"                   │
│ ✓ Score breakdown by round                           │
│ ✓ Replay button                                      │
└──────────────────────────────────────────────────────┘
```

## 🌐 Network Communication Sequence

```
┌─────────────────────────────────────────────────────────────────────┐
│                     SOCKET.IO EVENTS TIMELINE                       │
└─────────────────────────────────────────────────────────────────────┘

TIME   PLAYER 1                 SERVER                    PLAYER 2
────────────────────────────────────────────────────────────────────

0:00   Selects "Create Room"
       emit: create_room ───────────→
                          Room created
                          roomCode: "A7K2"
       recv: room_created ←──────────
       Shows: "Room: A7K2"
       Shares code with Player 2

1:00                                         Selects "Join Room"
                                             Enters: "A7K2"
                                             emit: join_room ──→
                                                              Room full check
                                                              P2 added
       recv: player_joined ←──────────────────────────────→ recv: player_joined
       Sees: "P2 joined!"                                   Sees: "P1 ready!"
       
       recv: game_started ←──────────────────────────────→ recv: game_started
       
       recv: location_loaded ←──────────────────────────→ recv: location_loaded
       Data: {                                            Data: {
         round: 1,                                          round: 1,
         totalRounds: 10,                                   totalRounds: 10,
         locationId: 'v1',                                  locationId: 'v1',
         label: 'Varanasi'                                  label: 'Varanasi'
       }                                                  }

1:30   Clicks map at coords
       (local state update - no server send yet)
       Shows blue marker

2:00                                         Clicks map at coords
                                             (local state update)
                                             Shows red marker

2:30   Clicks "Submit"
       emit: submit_guess ──→ Guess recorded
       (lat: 25.3, lng: 82.9) P1.hasGuessed = true
       
       recv: guess_received ←─
       Shows: "Waiting..."

3:00                                         Clicks "Submit"
                                             emit: submit_guess ──→
                                                              Guess recorded
                                                              P2.hasGuessed = true
                                                              BOTH guessed!
                                                              Calculate results
       recv: results_revealed ←────────────────────────────→ recv: results_revealed
       Shows actual location,                               Shows actual location,
       both guesses,                                        both guesses,
       distances & scores                                   distances & scores

3:30   Clicks "Next Round"
       emit: next_round ──→ Round++
                          Load next location
       recv: round_started ←────────────────────────────→ recv: round_started
       
       [REPEAT from location_loaded for rounds 2-10]

30:00                                                      [After 10 rounds]
       recv: game_finished ←────────────────────────────→ recv: game_finished
       Data: {                                            Data: {
         p1Score: 42300,                                   p1Score: 42300,
         p2Score: 41800,                                   p2Score: 41800,
         winner: 'p1'                                      winner: 'p1'
       }                                                  }
       Shows final scores                                 Shows final scores
```

## 📊 Room State Machine

```
┌────────────────────────────────────────────────────────────────────┐
│              ROOM STATUS STATE MACHINE                              │
└────────────────────────────────────────────────────────────────────┘

START
  ↓
┌─────────────┐
│  WAITING    │ ← Room created, P1 waiting for P2
│             │
│ room.        Players.p1 ready
│ gameStatus  Players.p2 = null
└─────────────┘
  ↓ (P2 joins)
┌─────────────┐
│ GUESSING    │ ← Both players joined, location loaded
│             │
│ room.       Location image sent (no coords)
│ gameStatus  Both players can place guesses
└─────────────┘
  ↓ (P1 guesses)
  │ P1.hasGuessed = true
  │ Waiting for P2...
  │
  ↓ (P2 guesses)
  │ P2.hasGuessed = true
  │ BOTH guessed!
  │
┌─────────────┐
│  RESULT     │ ← Calculate and reveal results
│             │
│ room.       Coordinates now visible
│ gameStatus  Scores calculated & sent
└─────────────┘
  ↓ (Check: round < 10?)
  ├─ YES → room.round++
  │        Reset players.p1/p2.hasGuessed = false
  │        Clear players.p1/p2.guess = null
  │        Status: GUESSING (loop back to GUESSING)
  │
  └─ NO  → room.round == 10
           final scores sent
           room deleted after timeout
           FINISHED

END
```

## 🧮 Score Calculation Visualization

```
┌──────────────────────────────────────────────────────────────────────┐
│                   SCORING FORMULA BREAKDOWN                           │
└──────────────────────────────────────────────────────────────────────┘

GUESS COMPARISON:
┌────────────────────────────────────────────────────────┐
│                                                        │
│  Actual Location: Varanasi (25.3164, 82.9863)         │
│                          ★                             │
│                                                        │
│  Player 1 Guess: (25.3, 82.9)                          │
│                 ◆ (245 km away)                        │
│                                                        │
│  Player 2 Guess: (25.5, 83.1)                          │
│                 ◆ (128 km away) ← CLOSER!              │
│                                                        │
└────────────────────────────────────────────────────────┘

BASE SCORE CALCULATION:
Score = 5000 × e^(-distance/2000)

Player 1:
  distance = 245 km
  score = 5000 × e^(-245/2000)
  score = 5000 × e^(-0.1225)
  score = 5000 × 0.8848
  score ≈ 4424 points

Player 2:
  distance = 128 km
  score = 5000 × e^(-128/2000)
  score = 5000 × e^(-0.064)
  score = 5000 × 0.9379
  score ≈ 4690 points

BONUS DETERMINATION:
if (distance1 < distance2):
  P1 wins round, gets +500 bonus
  P2 gets -500 penalty
else if (distance2 < distance1):  ← OUR CASE
  P2 wins round, gets +500 bonus ← PLAYER 2
  P1 gets -500 penalty ← PLAYER 1
else:
  Tie, both get 0 bonus

FINAL SCORES (This Round):
Player 1: 4424 - 500 = 3924 points
Player 2: 4690 + 500 = 5190 points
Winner: Player 2 (+500 bonus)

CUMULATIVE (After Round 1):
Player 1: 3924 total
Player 2: 5190 total
```

## 🔄 Reconnection Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│              DISCONNECTION & RECONNECTION HANDLING                    │
└──────────────────────────────────────────────────────────────────────┘

NORMAL PLAY
  ├─ Player 1 socket connected
  └─ Player 2 socket connected

Player 2 closes browser / loses network
  ↓
socket.on('disconnect')
  ├─ Server detects P2 offline
  ├─ Server sends 'opponent_disconnected' to P1
  └─ P1 sees: "Opponent disconnected. Game ended."

ATTEMPTED RECONNECTION (Socket.IO auto-retry):
  ├─ Tries to reconnect every 1-5 seconds
  ├─ Up to 5 reconnection attempts
  └─ If success → Resume game
     If fail → Show error, offer new room

ROOM CLEANUP:
  ├─ If both players disconnect → Delete room after timeout
  └─ If one player online → Keep room, wait for reconnect
```

## 📱 Component Communication Map

```
┌──────────────────────────────────────────────────────────────────────┐
│                 COMPONENT COMMUNICATION FLOW                          │
└──────────────────────────────────────────────────────────────────────┘

App.jsx (Main Coordinator)
  │
  ├─→ GameModeSelector
  │     └─→ onSelectMode(mode)
  │
  ├─→ RoomModal
  │     ├─→ onCreateRoom()
  │     └─→ onJoinRoom(code)
  │
  ├─→ MultiplayerGameOverlay
  │     ├─ roomCode
  │     ├─ playerId
  │     ├─ gamePhase
  │     └─ roundData
  │
  ├─→ GameMap (Leaflet)
  │     ├─ onMapClick(lat, lng)
  │     ├─ guesses (P1 & P2 markers)
  │     └─ roundResults (correct location)
  │
  ├─→ ImageClue
  │     ├─ location
  │     └─ image
  │
  ├─→ Scoreboard
  │     ├─ scores
  │     ├─ currentRound
  │     └─ totalRounds
  │
  ├─→ GuessControls
  │     ├─ onSubmitGuess()
  │     └─ onNextRound()
  │
  └─→ GameOverScreen
        ├─ scores
        └─ onResetGame()

useGameController (Local State)
  ├─ gameMode
  ├─ currentRound
  ├─ scores
  ├─ currentLocation
  ├─ guesses
  ├─ roundResults
  ├─ gameOver
  └─ [Plus all setter functions]

useMultiplayer (Socket.IO)
  ├─ connected
  ├─ roomCode
  ├─ playerId
  ├─ gamePhase
  ├─ roundData
  ├─ opponentGuessed
  └─ [Plus submission functions]
```

---

These diagrams provide visual understanding of:
- ✅ Complete round flow from start to finish
- ✅ Data visibility at each phase (prevents coordinate leaks)
- ✅ Network communication timing
- ✅ State machine transitions
- ✅ Scoring calculations
- ✅ Reconnection logic
- ✅ Component hierarchy and communication

