// Calculate distance between two coordinates using Haversine formula
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Calculate points based on distance
export const calculateScore = (distance) => {
  if (distance <= 10) return 5000;
  if (distance <= 50) return 4000;
  if (distance <= 200) return 3000;
  if (distance <= 500) return 2000;
  if (distance <= 1000) return 1000;
  // For distances > 1000km, scale down
  return Math.max(0, Math.round(500 - (distance - 1000) * 0.5));
};

// Get bonus for being closer in 2-player mode
export const getCloserBonus = (distance1, distance2) => {
  if (distance1 < distance2) return 500; // Player 1 is closer
  if (distance2 < distance1) return -500; // Player 2 is closer (return negative for player 1)
  return 0; // Tie
};

// Shuffle array using Fisher-Yates algorithm
export const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};
