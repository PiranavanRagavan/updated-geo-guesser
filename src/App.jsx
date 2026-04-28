import { useState, useEffect } from 'react'
import GameModeSelector from './components/GameModeSelector'
import GameMap from './components/GameMap'
import ImageClue from './components/ImageClue'
import Scoreboard from './components/Scoreboard'
import GameControls from './components/GameControls'
import GameOverScreen from './components/GameOverScreen'
import { useGameController } from './hooks/useGameController'
import { locationCoordinates } from './data/locationData'
import './App.css'

function App() {
  const game = useGameController()
  const [cardData, setCardData] = useState(null)

  // Load card data from imported JSON
  useEffect(() => {
    const loadCardData = async () => {
      // Since we can't import JSON directly in this setup, we'll create a mapping
      // from the locationData we already have
      const cardsMap = {}
      Object.entries(locationCoordinates).forEach(([id, location]) => {
        cardsMap[id] = {
          id,
          label: location.label,
          // Default image - in production, you'd load from the actual cards.json
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
    
    // Map of known temple images (can be extended)
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
    
    return imageMap[game.currentLocation.id] || cardData[game.currentLocation.id]?.image || ''
  }

  const handleMapClick = ({ lat, lng }) => {
    if (!game.roundResults) {
      game.recordGuess(lat, lng)
    }
  }

  const handleConfirmGuess = () => {
    game.confirmGuess()
  }

  const handleSubmitGuess = () => {
    game.submitSinglePlayerGuess()
  }

  const handleNextRound = () => {
    game.nextRound()
  }

  // No game mode selected - show selector
  if (!game.gameMode) {
    return (
      <GameModeSelector 
        onSelectMode={(mode) => game.startGame(mode)} 
      />
    )
  }

  // Game over - show results
  if (game.gameOver) {
    return (
      <GameOverScreen 
        scores={game.scores}
        gameMode={game.gameMode}
        onResetGame={game.resetGame}
      />
    )
  }

  return (
    <main className="app-shell game-shell">
      <header className="app-header">
        <h1>GeoGuessr</h1>
        <p className="game-mode">
          {game.gameMode === 'single' ? 'Single Player' : 'Two Players'}
        </p>
      </header>

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
            scores={game.scores}
            currentRound={game.currentRound}
            totalRounds={game.totalRounds}
            gameMode={game.gameMode}
            currentPlayer={game.currentPlayer}
            playerGuessed={game.playerGuessed}
          />
          
          <div className="map-section">
            <GameMap
              guesses={game.guesses}
              correctLocation={game.currentLocation}
              onMapClick={handleMapClick}
              roundResults={game.roundResults}
              gameMode={game.gameMode}
              disabled={game.roundResults !== null}
            />
          </div>

          <GameControls 
            gameMode={game.gameMode}
            guesses={game.guesses}
            roundResults={game.roundResults}
            currentPlayer={game.currentPlayer}
            playerGuessed={game.playerGuessed}
            onConfirmGuess={handleConfirmGuess}
            onSubmitGuess={handleSubmitGuess}
            onNextRound={handleNextRound}
            onResetGame={game.resetGame}
          />
        </div>
      </div>
    </main>
  )
}

export default App
