import { Link } from 'react-router-dom';
import { ArrowRight, Award, Mail, Quote, RotateCcw, ShieldCheck, Truck, Zap } from 'lucide-react';
import { productApi, storeApi } from '../api/endpoints';
import useApi from '../hooks/useApi';
import useDocumentTitle from '../hooks/useDocumentTitle';
import CategoryCard from '../components/CategoryCard';
import ProductGrid, { ProductGridSkeleton } from '../components/ProductGrid';
import { ErrorState } from '../components/Feedback';
import { formatINR } from '../utils/format';

const HERO_IMAGE = 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1800&q=80';
const PROMO_IMAGE = 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&w=1400&q=80';

// Clearly labelled sample content - not real customer reviews.
const TESTIMONIALS = [
  { name: 'Neha R.', city: 'Pune', text: 'The yoga mat and foam roller made my home routine so much better. Delivery was quick too!' },
  { name: 'Karan P.', city: 'Delhi', text: 'Great prices on dumbbells and the checkout was really smooth.' },
  { name: 'Ananya S.', city: 'Chennai', text: 'Love the running shoes - light, comfortable and exactly as shown.' },
];

function Section({ title, eyebrow, link, children }) {
  return (
    <section className="section">
      <div className="container">
        <div className="section__head">
          <div>
            {eyebrow && <span className="eyebrow">{eyebrow}</span>}
            <h2>{title}</h2>
          </div>
          {link && (
            <Link to={link.to} className="link-arrow">
              {link.label} <ArrowRight size={16} />
            </Link>
          )}
        </div>
        {children}
      </div>
    </section>
  );
}

export default function HomePage() {
  useDocumentTitle('');
  const config = useApi(() => storeApi.config().then((r) => r.data), []);
  const categories = useApi(() => storeApi.categories().then((r) => r.data), []);
  const featured = useApi(() => productApi.list({ featured: true, limit: 8, sort: 'popular' }).then((r) => r.data), []);
  const bestsellers = useApi(() => productApi.list({ sort: 'popular', limit: 4 }).then((r) => r.data), []);
  const freeAbove = config.data?.freeShippingThreshold ?? 999;

  return (
    <>
      <section className="hero" style={{ '--hero-image': `url(${HERO_IMAGE})` }}>
        <div className="container hero__content">
          <span className="hero__pill"><Zap size={14} /> New season gear is here</span>
          <h1>
            Fuel Your <span>Fitness</span> Journey.
          </h1>
          <p>Premium gym equipment, supplements, sportswear and recovery essentials - everything you need to train harder and recover smarter.</p>
          <div className="hero__actions">
            <Link to="/shop" className="btn btn--primary btn--lg">
              Shop Now <ArrowRight size={18} />
            </Link>
            <Link to="/categories" className="btn btn--outline-light btn--lg">
              Explore Categories
            </Link>
          </div>
          <ul className="hero__stats">
            <li><strong>6</strong> categories</li>
            <li><strong>{formatINR(freeAbove)}+</strong> free shipping</li>
            <li><strong>100%</strong> secure checkout</li>
          </ul>
        </div>
      </section>

      <Section title="Shop by Category" eyebrow="Categories" link={{ to: '/categories', label: 'All categories' }}>
        {categories.error && <ErrorState message={categories.error} onRetry={categories.reload} />}
        <div className="category-grid">
          {categories.loading && Array.from({ length: 6 }, (_, i) => <div key={i} className="skeleton category-card" />)}
          {categories.data?.map((c) => <CategoryCard key={c._id} category={c} />)}
        </div>
      </Section>

      <Section title="Featured Products" eyebrow="Hand-picked" link={{ to: '/shop', label: 'View all' }}>
        {featured.loading && <ProductGridSkeleton count={4} />}
        {featured.error && <ErrorState message={featured.error} onRetry={featured.reload} />}
        {featured.data && <ProductGrid products={featured.data} />}
      </Section>

      <section className="section">
        <div className="container">
          <div className="promo" style={{ '--promo-image': `url(${PROMO_IMAGE})` }}>
            <div className="promo__content">
              <span className="eyebrow eyebrow--light">Season Sale</span>
              <h2>Save up to 30% on selected gear</h2>
              <p>Discounts on dumbbells, bottles, shoes, supplements and more. Prices already reduced - no coupon needed.</p>
              <Link to="/shop?sort=price_asc" className="btn btn--primary">
                Grab the deals <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Section title="Bestsellers" eyebrow="Most popular" link={{ to: '/shop?sort=popular', label: 'See more' }}>
        {bestsellers.loading && <ProductGridSkeleton count={4} />}
        {bestsellers.error && <ErrorState message={bestsellers.error} onRetry={bestsellers.reload} />}
        {bestsellers.data && <ProductGrid products={bestsellers.data} />}
      </Section>

      <section className="section section--dark">
        <div className="container">
          <div className="section__head section__head--center">
            <span className="eyebrow">Why FitStore</span>
            <h2>Why Choose FitStore?</h2>
          </div>
          <div className="features">
            <div className="feature">
              <Truck size={30} />
              <h3>Free Shipping</h3>
              <p>Free delivery on orders above {formatINR(freeAbove)}. A flat {formatINR(config.data?.shippingCharge ?? 99)} below that.</p>
            </div>
            <div className="feature">
              <ShieldCheck size={30} />
              <h3>Secure Payments</h3>
              <p>Razorpay checkout with server-side payment verification (test mode in this demo).</p>
            </div>
            <div className="feature">
              <Award size={30} />
              <h3>Quality Gear</h3>
              <p>Carefully selected products across training, nutrition, apparel and recovery.</p>
            </div>
            <div className="feature">
              <RotateCcw size={30} />
              <h3>Easy Returns</h3>
              <p>Simple 7-day return policy on unused products. See our return policy for details.</p>
            </div>
          </div>
        </div>
      </section>

      <Section title="What Customers Say" eyebrow="Testimonials">
        <p className="demo-label">Demo content: these testimonials are sample text for this college project.</p>
        <div className="testimonials">
          {TESTIMONIALS.map((t) => (
            <figure key={t.name} className="testimonial card">
              <Quote size={26} aria-hidden="true" />
              <blockquote>{t.text}</blockquote>
              <figcaption>
                <strong>{t.name}</strong> - {t.city} <span className="badge badge--muted">Demo</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </Section>

      <section className="section">
        <div className="container">
          <div className="contact-cta card">
            <Mail size={34} aria-hidden="true" />
            <div>
              <h2>Questions about a product or order?</h2>
              <p>Our team is happy to help with sizing, nutrition and order queries.</p>
            </div>
            <div className="contact-cta__actions">
              <Link to="/contact" className="btn btn--primary">Contact us</Link>
              <Link to="/faq" className="btn btn--outline">Read FAQ</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
