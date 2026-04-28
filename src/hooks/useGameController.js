import { useState, useEffect } from 'react';
import { getRandomLocations, locationCoordinates } from '../data/locationData';
import { calculateDistance, calculateScore, getCloserBonus } from '../utils/gameUtils';

export const useGameController = () => {
  const [gameMode, setGameMode] = useState(null); // 'single' or 'two-player'
  const [currentRound, setCurrentRound] = useState(1);
  const [totalRounds, setTotalRounds] = useState(10);
  const [scores, setScores] = useState({ player1: 0, player2: 0 });
  const [currentLocation, setCurrentLocation] = useState(null);
  const [guesses, setGuesses] = useState({ player1: null, player2: null });
  const [roundResults, setRoundResults] = useState(null);
  const [usedLocations, setUsedLocations] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState(1); // For 2-player mode
  const [playerGuessed, setPlayerGuessed] = useState(false); // Track if current player in 2-player guessed

  // Initialize game
  const startGame = (mode, rounds = 10) => {
    setGameMode(mode);
    setTotalRounds(rounds);
    setCurrentRound(1);
    setScores({ player1: 0, player2: 0 });
    setUsedLocations([]);
    setGameOver(false);
    setCurrentPlayer(1);
    setPlayerGuessed(false);
    loadNextLocation([]);
  };

  // Load a random location
  const loadNextLocation = (currentUsed) => {
    const availableIds = Object.keys(locationCoordinates).filter(
      id => !currentUsed.includes(id)
    );

    if (availableIds.length === 0) {
      // Reset used locations if we've gone through all
      const randomLocation = getRandomLocations(1)[0];
      setCurrentLocation(randomLocation);
      setUsedLocations([randomLocation.id]);
    } else {
      const allLocations = availableIds.map(id => ({
        id,
        ...locationCoordinates[id],
      }));
      const randomIndex = Math.floor(Math.random() * allLocations.length);
      const selectedLocation = allLocations[randomIndex];
      setCurrentLocation(selectedLocation);
      setUsedLocations([...currentUsed, selectedLocation.id]);
    }

    setGuesses({ player1: null, player2: null });
    setRoundResults(null);
    setPlayerGuessed(false);
  };

  // Record a guess
  const recordGuess = (lat, lng) => {
    if (gameMode === 'single') {
      setGuesses({ ...guesses, player1: { lat, lng } });
    } else if (gameMode === 'two-player') {
      if (currentPlayer === 1) {
        setGuesses({ ...guesses, player1: { lat, lng } });
      } else {
        setGuesses({ ...guesses, player2: { lat, lng } });
      }
    }
  };

  // Confirm guess and move to next player (for 2-player)
  const confirmGuess = () => {
    if (gameMode === 'two-player' && !playerGuessed) {
      setPlayerGuessed(true);
      if (currentPlayer === 1) {
        setCurrentPlayer(2);
      } else if (currentPlayer === 2) {
        // Delay calculation to allow state to update
        setTimeout(() => {
          calculateRoundResultsWithState(guesses.player1, guesses.player2);
        }, 0);
      }
    }
  };

  // Helper function to calculate results with passed guesses
  const calculateRoundResultsWithState = (player1Guess, player2Guess) => {
    const correct = currentLocation;

    if (!player1Guess || !player2Guess) return;

    const distance1 = calculateDistance(
      player1Guess.lat,
      player1Guess.lng,
      correct.lat,
      correct.lng
    );
    const distance2 = calculateDistance(
      player2Guess.lat,
      player2Guess.lng,
      correct.lat,
      correct.lng
    );

    const baseScore1 = calculateScore(distance1);
    const baseScore2 = calculateScore(distance2);
    const bonus1 = getCloserBonus(distance1, distance2);
    const bonus2 = -bonus1;

    const player1Score = baseScore1 + bonus1;
    const player2Score = baseScore2 + bonus2;

    const newScores = {
      player1: scores.player1 + player1Score,
      player2: scores.player2 + player2Score,
    };

    setRoundResults({
      player1: { guess: player1Guess, distance: distance1.toFixed(2), score: player1Score },
      player2: { guess: player2Guess, distance: distance2.toFixed(2), score: player2Score },
      correct,
    });

    setScores(newScores);

    if (currentRound >= totalRounds) {
      setGameOver(true);
    }
  };

  // Calculate round results
  const calculateRoundResults = () => {
    const player1Guess = guesses.player1;
    const player2Guess = guesses.player2;
    const correct = currentLocation;

    if (!player1Guess || !player2Guess) return;

    const distance1 = calculateDistance(
      player1Guess.lat,
      player1Guess.lng,
      correct.lat,
      correct.lng
    );
    const distance2 = calculateDistance(
      player2Guess.lat,
      player2Guess.lng,
      correct.lat,
      correct.lng
    );

    const baseScore1 = calculateScore(distance1);
    const baseScore2 = calculateScore(distance2);
    const bonus1 = getCloserBonus(distance1, distance2);
    const bonus2 = -bonus1;

    const player1Score = baseScore1 + bonus1;
    const player2Score = baseScore2 + bonus2;

    const newScores = {
      player1: scores.player1 + player1Score,
      player2: scores.player2 + player2Score,
    };

    setRoundResults({
      player1: { guess: player1Guess, distance: distance1.toFixed(2), score: player1Score },
      player2: { guess: player2Guess, distance: distance2.toFixed(2), score: player2Score },
      correct,
    });

    setScores(newScores);

    // Check if game is over
    if (currentRound >= totalRounds) {
      setGameOver(true);
    }
  };

  // Submit guess for single player
  const submitSinglePlayerGuess = () => {
    if (!guesses.player1) return;

    const distance = calculateDistance(
      guesses.player1.lat,
      guesses.player1.lng,
      currentLocation.lat,
      currentLocation.lng
    );

    const score = calculateScore(distance);
    const newScores = { player1: scores.player1 + score, player2: 0 };

    setRoundResults({
      player1: { guess: guesses.player1, distance: distance.toFixed(2), score },
      correct: currentLocation,
    });

    setScores(newScores);

    if (currentRound >= totalRounds) {
      setGameOver(true);
    }
  };

  // Move to next round
  const nextRound = () => {
    if (gameMode === 'single') {
      if (currentRound < totalRounds) {
        setCurrentRound(currentRound + 1);
        loadNextLocation(usedLocations);
      }
    } else if (gameMode === 'two-player') {
      if (currentRound < totalRounds) {
        setCurrentRound(currentRound + 1);
        setCurrentPlayer(1);
        setPlayerGuessed(false);
        loadNextLocation(usedLocations);
      }
    }
  };

  // Reset game
  const resetGame = () => {
    setGameMode(null);
    setCurrentRound(1);
    setScores({ player1: 0, player2: 0 });
    setGuesses({ player1: null, player2: null });
    setRoundResults(null);
    setUsedLocations([]);
    setGameOver(false);
    setCurrentPlayer(1);
    setPlayerGuessed(false);
  };

  return {
    gameMode,
    currentRound,
    totalRounds,
    scores,
    currentLocation,
    guesses,
    roundResults,
    gameOver,
    currentPlayer,
    playerGuessed,
    startGame,
    recordGuess,
    confirmGuess,
    submitSinglePlayerGuess,
    nextRound,
    resetGame,
  };
};
