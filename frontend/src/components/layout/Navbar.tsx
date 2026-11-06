import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import type { NavItem } from '../../types';
import { LinkButton } from '../ui/Button';
import { Logo } from '../ui/Logo';

const NAV_ITEMS: readonly NavItem[] = [
  { to: '/', label: 'Home' },
  { to: '/restaurants', label: 'Restaurants' },
  { to: '/orders', label: 'My orders' },
  { to: '/about', label: 'About' },
];

export function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const cartCount = 0; // Stage 18 wires this to the cart context.

  return (
    <header className="navbar">
      <div className="container navbar__inner">
        <Logo />

        <nav className={`navbar__links${open ? ' is-open' : ''}`} aria-label="Primary">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => (isActive ? 'navlink active' : 'navlink')}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="navbar__actions">
          <button
            type="button"
            className="icon-btn"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
          >
            {theme === 'light' ? '☾' : '☀'}
          </button>
          <NavLink to="/cart" className="icon-btn" aria-label={`Cart, ${cartCount} items`}>
            🛒
            {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
          </NavLink>
          <LinkButton to="/login" variant="primary" size="sm" className="navbar__login">
            Log in
          </LinkButton>
          <button
            type="button"
            className="icon-btn navbar__toggle"
            aria-expanded={open}
            aria-label="Toggle menu"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? '✕' : '☰'}
          </button>
        </div>
      </div>
    </header>
  );
}
