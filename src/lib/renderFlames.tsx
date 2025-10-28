export const renderFlames = (rating: number | null | undefined) => {
  // Handle null/undefined/invalid ratings
  const validRating = rating && !isNaN(rating) ? rating : 0;
  
  const flames = [];
  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(validRating)) {
      flames.push(<span key={i} className="text-orange-500">🔥</span>);
    } else if (i === Math.ceil(validRating) && validRating % 1 !== 0) {
      flames.push(<span key={i} className="text-orange-300">🔥</span>);
    } else {
      flames.push(<span key={i} className="text-gray-600">🔥</span>);
    }
  }
  return flames;
};
