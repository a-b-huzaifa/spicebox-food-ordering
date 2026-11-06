import { LinkButton } from '../components/ui/Button';

export default function NotFound() {
  return (
    <div className="center-page">
      <div className="container" style={{ display: 'grid', placeItems: 'center' }}>
        <div className="card center-card">
          <h1>404</h1>
          <p>That page isn't on the menu.</p>
          <LinkButton to="/" variant="primary">Back home</LinkButton>
        </div>
      </div>
    </div>
  );
}
