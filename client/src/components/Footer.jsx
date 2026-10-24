import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone } from 'lucide-react';
import Logo from './Logo';
import { DEVELOPER, SUPPORT_EMAIL } from '../utils/constants';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__grid">
        <div className="footer__brand">
          <Logo light />
          <p>Fuel Your Fitness Journey. Quality gym equipment, supplements, sportswear and recovery gear in one place.</p>
          <p className="footer__note">FitStore is a college demonstration project. Payments use Razorpay test mode.</p>
        </div>

        <div>
          <h3>Shop</h3>
          <ul>
            <li><Link to="/shop">All Products</Link></li>
            <li><Link to="/categories">Categories</Link></li>
            <li><Link to="/shop?sort=popular">Bestsellers</Link></li>
            <li><Link to="/cart">Cart</Link></li>
          </ul>
        </div>

        <div>
          <h3>Company</h3>
          <ul>
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/contact">Contact</Link></li>
            <li><Link to="/faq">FAQ</Link></li>
          </ul>
        </div>

        <div>
          <h3>Policies</h3>
          <ul>
            <li><Link to="/shipping-returns">Shipping Policy</Link></li>
            <li><Link to="/shipping-returns#returns">Return Policy</Link></li>
            <li><Link to="/privacy">Privacy Policy</Link></li>
            <li><Link to="/terms">Terms &amp; Conditions</Link></li>
          </ul>
        </div>

        <div>
          <h3>Contact</h3>
          <ul className="footer__contact">
            <li><Mail size={16} /> <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></li>
            <li><Phone size={16} /> +91 00000 00000 (demo)</li>
            <li><MapPin size={16} /> India</li>
          </ul>
        </div>
      </div>
      <div className="footer__bottom">
        <div className="container">
          <span>&copy; {new Date().getFullYear()} FitStore. Built for educational purposes.</span>
          <span className="footer__credit">
            Developed by <strong>{DEVELOPER.name}</strong> &middot; <a href={`mailto:${DEVELOPER.email}`}>{DEVELOPER.email}</a>
          </span>
          <span>Product photos from Unsplash.</span>
        </div>
      </div>
    </footer>
  );
}
