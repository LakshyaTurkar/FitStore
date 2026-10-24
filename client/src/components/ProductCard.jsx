import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import PriceTag from './PriceTag';
import RatingStars from './RatingStars';
import { useCart } from '../context/CartContext';
import { discountPercent } from '../utils/format';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const [adding, setAdding] = useState(false);
  const outOfStock = product.stock === 0;
  const off = discountPercent(product);

  const onAdd = async () => {
    setAdding(true);
    await addToCart(product._id, 1);
    setAdding(false);
  };

  return (
    <article className="product-card">
      <Link to={`/product/${product.slug}`} className="product-card__media">
        <img src={product.image} alt={product.name} loading="lazy" />
        <div className="product-card__badges">
          {off > 0 && <span className="badge badge--orange">-{off}%</span>}
          {outOfStock && <span className="badge badge--dark">Sold out</span>}
          {!outOfStock && product.stock <= 5 && <span className="badge badge--warn">Only {product.stock} left</span>}
        </div>
      </Link>
      <div className="product-card__body">
        {product.category?.name && <span className="product-card__category">{product.category.name}</span>}
        <h3 className="product-card__title">
          <Link to={`/product/${product.slug}`}>{product.name}</Link>
        </h3>
        <RatingStars rating={product.rating} count={product.numReviews} />
        <div className="product-card__footer">
          <PriceTag product={product} />
          <button
            type="button"
            className="btn btn--primary btn--icon"
            onClick={onAdd}
            disabled={outOfStock || adding}
            aria-label={outOfStock ? `${product.name} is sold out` : `Add ${product.name} to cart`}
            title={outOfStock ? 'Sold out' : 'Add to cart'}
          >
            <ShoppingCart size={18} />
          </button>
        </div>
      </div>
    </article>
  );
}
