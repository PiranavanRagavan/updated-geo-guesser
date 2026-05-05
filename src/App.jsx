import { useState, useEffect } from 'react'
import GameModeSelector from './components/GameModeSelector'
import GameMap from './components/GameMap'
import ImageClue from './components/ImageClue'
import Scoreboard from './components/Scoreboard'
import GameControls from './components/GameControls'
import GameOverScreen from './components/GameOverScreen'
import MultiplayerGameOverlay from './components/MultiplayerGameOverlay'
import RoomModal from './components/RoomModal'
import { useGameController } from './hooks/useGameController'
import { useMultiplayer } from './hooks/useMultiplayer'
import { locationCoordinates } from './data/locationData'
import './App.css'

function App() {
  const game = useGameController()
  const multiplayer = useMultiplayer(false) // Enabled when two-player mode selected
  const [cardData, setCardData] = useState(null)
  const [showRoomModal, setShowRoomModal] = useState(false)
  const [multiplayerScores, setMultiplayerScores] = useState({ p1: 0, p2: 0 })
  const [multiplayerRoundResults, setMultiplayerRoundResults] = useState(null)

  // Load card data from imported JSON
  useEffect(() => {
    const loadCardData = async () => {
      const cardsMap = {}
      Object.entries(locationCoordinates).forEach(([id, location]) => {
        cardsMap[id] = {
          id,
          label: location.label,
          image: `https://via.placeholder.com/400x300?text=${encodeURIComponent(location.label)}`,
        }
      })
      setCardData(cardsMap)
    }
    
    loadCardData()
  }, [])

  // Get image for current location
  const getCurrentImage = () => {
    if (!game.currentLocation || !cardData) return ''
    
    const imageMap = {
      v1: 'https://upload.wikimedia.org/wikipedia/commons/b/b0/Ganga_Dwar%2C_Gateway_of_Corridor_of_Kashi_Vishwanath_Temple%2C_Varanasi_2.webp',
      v2: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Somanath_mandir_%28cropped%29.jpg/1280px-Somanath_mandir_%28cropped%29.jpg',
      v3: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Tirumala_090615.jpg/1920px-Tirumala_090615.jpg',
      v4: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/India_Meenakshi_Temple.jpg/1280px-India_Meenakshi_Temple.jpg',
      v5: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Shri_Jagannath_temple.jpg/1920px-Shri_Jagannath_temple.jpg',
      v6: 'https://upload.wikimedia.org/wikipedia/commons/0/0c/Dwarakadheesh_Temple%2C_2014.jpg',
      v7: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Badrinath_Temple-_Uttarakhand.jpg/1920px-Badrinath_Temple-_Uttarakhand.jpg',
      v8: 'https://upload.wikimedia.org/wikipedia/commons/1/19/Ukhimath_Temple%2C_near_Kedarnath%2C_Uttarakhand.jpg',
      c1: 'https://upload.wikimedia.org/wikipedia/commons/d/dd/Brihadisvara_Temple_during_Maha_Shivaratri-WUS03611_%28edit%29.jpg',
      c2: 'https://upload.wikimedia.org/wikipedia/commons/8/84/Ramanathaswamy_temple7.JPG',
      c3: 'https://upload.wikimedia.org/wikipedia/commons/4/4e/Mahabodhitemple.jpg',
      c4: 'https://upload.wikimedia.org/wikipedia/commons/1/12/East_Gateway_-_Stupa_1_-_Sanchi_Hill_2013-02-21_4398.JPG',
      c5: 'https://upload.wikimedia.org/wikipedia/commons/a/ac/Flat_elevation_of_Lotus_Mahal%2C_Hampi_%28Closeup%29.jpg',
      c6: 'https://upload.wikimedia.org/wikipedia/commons/7/75/Mahakaleshwar_Temple%2C_Ujjain.jpg',
      c7: 'https://upload.wikimedia.org/wikipedia/commons/3/34/Vaishno_Devi_Bhavan.jpg',
      c8: 'https://upload.wikimedia.org/wikipedia/commons/e/e4/Sai_baba_samadhi_mandir_.jpg',
      j1: 'https://upload.wikimedia.org/wikipedia/commons/b/b9/Complex_of_Virupaksha_Temple%2C_Hampi_%2804%29.jpg',
      j2: 'https://upload.wikimedia.org/wikipedia/commons/0/06/Ekambareswarar5.jpg',
      j3: 'https://upload.wikimedia.org/wikipedia/commons/4/44/Le_temple_de_Shiva_Nataraja_%28Chidambaram%2C_Inde%29_%2814037020332%29.jpg',
      j4: 'https://upload.wikimedia.org/wikipedia/commons/9/99/Ranganathaswamy_temple_tiruchirappalli.jpg',
      j5: 'https://upload.wikimedia.org/wikipedia/commons/5/5d/Lingaraj_Temple_%2C_Bhubaneswar.jpg',
      j6: 'https://upload.wikimedia.org/wikipedia/commons/3/3b/Murudeshwara_raja_gopura_HDR%2C_Jul_2012.jpg',
      j7: 'https://upload.wikimedia.org/wikipedia/commons/0/04/009392022_Guruvayur_temple%2C_Kerala_004.jpg',
      j8: 'https://upload.wikimedia.org/wikipedia/commons/0/01/Omkareswar_Jyotirlinga.jpg',
    }
    
    return imageMap[game.currentLocation?.id] || cardData[game.currentLocation?.id]?.image || ''
  }

  // ============ Multiplayer Event Handlers ============

  // Listen to multiplayer events
  useEffect(() => {
    if (game.gameMode !== 'two-player' || !multiplayer.roomCode) return

    // Handle location loaded (new round)
    if (multiplayer.roundData?.locationId) {
      // Set the current location based on multiplayer data
      const locationData = locationCoordinates[multiplayer.roundData.locationId]
      if (locationData) {
        game.setCurrentLocation({
          id: multiplayer.roundData.locationId,
          ...locationData
        })
      }
    }

    // Handle results revealed
    if (multiplayer.gamePhase === 'result' && multiplayer.roundData?.results) {
      const results = multiplayer.roundData.results
      setMultiplayerRoundResults({
        correct: results.correct,
        p1: results.p1,
        p2: results.p2,
        round: results.round,
        totalRounds: results.totalRounds,
      })
      setMultiplayerScores({
        p1: results.p1.totalScore,
        p2: results.p2.totalScore,
      })
    }

    // Handle game finished
    if (multiplayer.gamePhase === 'finished' && multiplayer.roundData?.finalResult) {
      const finalResult = multiplayer.roundData.finalResult
      game.setGameOver(true)
      setMultiplayerScores({
        p1: finalResult.p1Score,
        p2: finalResult.p2Score,
      })
    }
  }, [multiplayer.gamePhase, multiplayer.roundData, multiplayer.roomCode])

  // ============ Single Player Handlers ============

  const handleMapClick = ({ lat, lng }) => {
    if (game.gameMode === 'single') {
      if (!game.roundResults) {
        game.recordGuess(lat, lng)
      }
    } else if (game.gameMode === 'two-player') {
      // For multiplayer, don't record guess locally - use multiplayer system
      // Just track local marker for UI preview
    }
  }

  const handleConfirmGuess = () => {
    if (game.gameMode === 'two-player') {
      game.confirmGuess()
    }
  }

  const handleSubmitGuess = () => {
    if (game.gameMode === 'single') {
      game.submitSinglePlayerGuess()
    } else if (game.gameMode === 'two-player' && game.guesses.player1) {
      // Submit to server
      multiplayer.submitGuess(game.guesses.player1.lat, game.guesses.player1.lng)
    }
  }

  const handleNextRound = () => {
    if (game.gameMode === 'single') {
      game.nextRound()
    } else if (game.gameMode === 'two-player') {
      multiplayer.goToNextRound()
      setMultiplayerRoundResults(null)
      game.setGuesses({ player1: null, player2: null })
    }
  }

  const handleModeSelect = (mode) => {
    if (mode === 'two-player') {
      // Enable multiplayer socket connection
      multiplayer.enabled = true
      // Don't start game yet - show room modal first
      setShowRoomModal(true)
    } else {
      game.startGame(mode)
    }
  }

  const handleCreateRoom = async () => {
    try {
      await multiplayer.createRoom()
    } catch (err) {
      console.error('Failed to create room:', err)
    }
  }

  const handleJoinRoom = async (roomCode) => {
    try {
      await multiplayer.joinRoom(roomCode)
    } catch (err) {
      console.error('Failed to join room:', err)
    }
  }

  const handleCloseRoomModal = () => {
    setShowRoomModal(false)
    // Reset if room wasn't successfully created/joined
    if (!multiplayer.roomCode) {
      game.setGameMode(null)
    }
  }

  // Once multiplayer is connected, start the game
  useEffect(() => {
    if (multiplayer.roomCode && !game.gameMode) {
      game.startGame('two-player')
      setShowRoomModal(false)
    }
  }, [multiplayer.roomCode])

  // ============ Render Logic ============

  // No game mode selected - show selector
  if (!game.gameMode) {
    return (
      <GameModeSelector 
        onSelectMode={handleModeSelect}
      />
    )
  }

  // Multiplayer: Show room modal if room not yet created/joined
  if (game.gameMode === 'two-player' && !multiplayer.roomCode) {
    return (
      <>
        <GameModeSelector onSelectMode={() => {}} />
        <RoomModal
          isOpen={showRoomModal}
          onClose={handleCloseRoomModal}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          loading={!multiplayer.connected}
          error={multiplayer.error}
        />
      </>
    )
  }

  // Game over - show results
  if (game.gameOver) {
    return (
      <GameOverScreen 
        scores={game.gameMode === 'two-player' ? multiplayerScores : game.scores}
        gameMode={game.gameMode}
        onResetGame={() => {
          game.resetGame()
          setMultiplayerScores({ p1: 0, p2: 0 })
          setMultiplayerRoundResults(null)
        }}
      />
    )
  }

  // ============ Main Game Screen ============

  return (
    <main className="app-shell game-shell">
      <header className="app-header">
        <h1>GeoGuessr</h1>
        <p className="game-mode">
          {game.gameMode === 'single' ? 'Single Player' : 'Two Players'}
        </p>
      </header>

      {/* Multiplayer: Show overlay with room info and player status */}
      {game.gameMode === 'two-player' && (
        <MultiplayerGameOverlay
          roomCode={multiplayer.roomCode}
          playerId={multiplayer.playerId}
          opponentGuessed={multiplayer.opponentGuessed}
          gamePhase={multiplayer.gamePhase}
          roundData={multiplayer.roundData}
        />
      )}

      <div className="game-layout">
        {/* Left column - Image clue */}
        <div className="game-column left-column">
          <div className="image-section">
            <ImageClue 
              location={game.currentLocation}
              image={getCurrentImage()}
            />
          </div>
        </div>

        {/* Right column - Map and controls */}
        <div className="game-column right-column">
          <Scoreboard 
            scores={game.gameMode === 'two-player' ? multiplayerScores : game.scores}
            currentRound={game.currentRound}
            totalRounds={game.totalRounds}
            gameMode={game.gameMode}
            currentPlayer={game.currentPlayer}
            playerGuessed={game.playerGuessed}
          />
          
          <div className="map-section">
            <GameMap
              guesses={game.guesses}
              correctLocation={multiplayerRoundResults?.correct || game.currentLocation}
              onMapClick={handleMapClick}
              roundResults={multiplayerRoundResults || game.roundResults}
              gameMode={game.gameMode}
              disabled={
                game.gameMode === 'two-player' 
                  ? multiplayer.gamePhase !== 'guessing'
                  : game.roundResults !== null
              }
            />
          </div>

          <GameControls 
            gameMode={game.gameMode}
            guesses={game.guesses}
            roundResults={multiplayerRoundResults || game.roundResults}
            currentPlayer={game.currentPlayer}
            playerGuessed={game.playerGuessed}
            onConfirmGuess={handleConfirmGuess}
            onSubmitGuess={handleSubmitGuess}
            onNextRound={handleNextRound}
            onResetGame={() => {
              game.resetGame()
              setMultiplayerScores({ p1: 0, p2: 0 })
              setMultiplayerRoundResults(null)
            }}
          />
        </div>
      </div>
    </main>
  )
}

export default App
