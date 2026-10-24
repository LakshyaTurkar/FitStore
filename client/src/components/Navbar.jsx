import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogOut, Menu, Package, Search, ShoppingCart, User, X } from 'lucide-react';
import Logo from './Logo';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const { count } = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    setMenuOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  const onSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (q) navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  const onLogout = async () => {
    await logout();
    toast.info('You have been signed out.');
    navigate('/');
  };

  return (
    <header className="navbar">
      <div className="container navbar__inner">
        <button
          type="button"
          className="icon-btn navbar__toggle"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <Logo />

        <nav className={`navbar__links ${menuOpen ? 'is-open' : ''}`} aria-label="Main">
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/shop">Shop</NavLink>
          <NavLink to="/categories">Categories</NavLink>
          <NavLink to="/about">About</NavLink>
          {isAdmin && <NavLink to="/admin">Admin</NavLink>}
        </nav>

        <form className="navbar__search" onSubmit={onSearch} role="search">
          <label htmlFor="nav-search" className="sr-only">Search products</label>
          <input
            id="nav-search"
            type="search"
            placeholder="Search products..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" aria-label="Search"><Search size={18} /></button>
        </form>

        <div className="navbar__actions">
          <Link to="/search" className="icon-btn navbar__search-icon" aria-label="Search">
            <Search size={20} />
          </Link>
          <Link to="/cart" className="icon-btn cart-btn" aria-label={`Cart, ${count} item${count === 1 ? '' : 's'}`}>
            <ShoppingCart size={21} />
            {count > 0 && <span className="cart-btn__count">{count > 99 ? '99+' : count}</span>}
          </Link>

          {user ? (
            <div className="profile-menu">
              <button
                type="button"
                className="profile-menu__trigger"
                onClick={() => setProfileOpen((o) => !o)}
                aria-expanded={profileOpen}
                aria-haspopup="menu"
              >
                {user.picture ? (
                  <img src={user.picture} alt="" referrerPolicy="no-referrer" />
                ) : (
                  <span className="avatar-fallback">{user.name?.[0] || 'U'}</span>
                )}
                <span className="profile-menu__name">{user.name.split(' ')[0]}</span>
              </button>
              {profileOpen && (
                <div className="profile-menu__dropdown" role="menu">
                  <Link to="/profile" role="menuitem"><User size={16} /> My Profile</Link>
                  <Link to="/orders" role="menuitem"><Package size={16} /> My Orders</Link>
                  {isAdmin && <Link to="/admin" role="menuitem"><LayoutDashboard size={16} /> Admin Panel</Link>}
                  <button type="button" role="menuitem" onClick={onLogout}><LogOut size={16} /> Sign out</button>
                </div>
              )}
            </div>
          ) : (
            <Link to={`/login?redirect=${encodeURIComponent(location.pathname)}`} className="btn btn--primary btn--sm">
              <User size={16} /> Sign in with Google
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
