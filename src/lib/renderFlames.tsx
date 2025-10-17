export const renderFlames = (rating: number) => {
  const flames = [];
  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(rating)) {
      flames.push(<span key={i} className="text-orange-500">🔥</span>);
    } else if (i === Math.ceil(rating) && rating % 1 !== 0) {
      flames.push(<span key={i} className="text-orange-300">🔥</span>);
    } else {
      flames.push(<span key={i} className="text-gray-600">🔥</span>);
    }
  }
  return flames;
};
