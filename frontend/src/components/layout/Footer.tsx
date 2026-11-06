import { Link } from 'react-router-dom';
import { Logo } from '../ui/Logo';

export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          <div>
            <Logo />
            <p className="footer__blurb">Cravings, delivered hot. A full-stack food ordering demo built with React, Express, MongoDB and TypeScript.</p>
          </div>
          <div>
            <h4>Explore</h4>
            <ul>
              <li><Link to="/restaurants">Restaurants</Link></li>
              <li><Link to="/about">About</Link></li>
              <li><Link to="/styleguide">Design system</Link></li>
            </ul>
          </div>
          <div>
            <h4>Account</h4>
            <ul>
              <li><Link to="/login">Log in</Link></li>
              <li><Link to="/register">Sign up</Link></li>
              <li><Link to="/orders">My orders</Link></li>
            </ul>
          </div>
          <div>
            <h4>Pay with</h4>
            <ul>
              <li>Cash on delivery</li>
              <li>Card</li>
              <li>JazzCash</li>
              <li>Easypaisa</li>
            </ul>
          </div>
        </div>
        <div className="footer__bottom">
          <span>© {new Date().getFullYear()} Spicebox. Demo project; restaurants and orders are sample data.</span>
          <span>Made with React + TypeScript</span>
        </div>
      </div>
    </footer>
  );
}
