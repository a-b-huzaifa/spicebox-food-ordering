import { Link } from 'react-router-dom';

export function Logo() {
  return (
    <Link to="/" className="logo" aria-label="Spicebox home">
      <span className="logo__mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="#fff">
          <path d="M12 2c.6 3.2-1.4 4.7-3 6.6C7.4 10.4 6 12.2 6 14.7 6 18.2 8.7 21 12 21s6-2.8 6-6.3c0-2.1-.9-3.7-2-5-.3 1.2-1 2-1.9 2.4.5-3-.4-6.7-2.1-9.1z" />
        </svg>
      </span>
      <span className="logo__word">
        spice<span>box</span>
      </span>
    </Link>
  );
}
