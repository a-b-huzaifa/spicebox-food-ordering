import { Link } from 'react-router-dom';
import type { Restaurant } from '../types';
import { formatPrice } from '../utils/format';
import { Badge } from './ui/Badge';
import { SafeImage } from './ui/SafeImage';

export function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  const [minEta, maxEta] = restaurant.etaMinutes;
  return (
    <Link to={`/restaurants/${restaurant.id}`} className="card card--interactive rest-card">
      <div className="rest-card__img">
        <SafeImage src={restaurant.image} alt={restaurant.name} />
        {restaurant.tag && (
          <span className="rest-card__tag">
            <Badge tone="orange">{restaurant.tag}</Badge>
          </span>
        )}
      </div>
      <div className="rest-card__body">
        <div className="rest-card__top">
          <h3>{restaurant.name}</h3>
          <span className="rest-card__rating">★ {restaurant.rating.toFixed(1)}</span>
        </div>
        <p className="rest-card__cuisine">{restaurant.cuisine}</p>
        <div className="rest-card__meta">
          <span>{minEta}-{maxEta} min</span>
          <span>{formatPrice(restaurant.deliveryFee)} delivery</span>
        </div>
      </div>
    </Link>
  );
}
