import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function CategoryCard({ category }) {
  return (
    <Link to={`/category/${category.slug}`} className="category-card">
      <img src={category.image} alt="" loading="lazy" />
      <div className="category-card__overlay">
        <h3>{category.name}</h3>
        {category.productCount !== undefined && <span>{category.productCount} products</span>}
        <span className="category-card__cta">
          Shop now <ArrowRight size={16} />
        </span>
      </div>
    </Link>
  );
}
