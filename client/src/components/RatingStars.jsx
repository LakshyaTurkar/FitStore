import { Star } from 'lucide-react';

export default function RatingStars({ rating = 0, count, size = 15 }) {
  const rounded = Math.round(rating * 2) / 2;
  return (
    <span className="rating" aria-label={`Rated ${rating.toFixed(1)} out of 5${count !== undefined ? `, ${count} reviews` : ''}`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          aria-hidden="true"
          className={i <= rounded ? 'star star--full' : i - 0.5 === rounded ? 'star star--half' : 'star'}
        />
      ))}
      {count !== undefined && <span className="rating__count">({count})</span>}
    </span>
  );
}
