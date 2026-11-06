import { Badge } from '../components/ui/Badge';
import { LinkButton } from '../components/ui/Button';

interface ComingSoonProps {
  title: string;
  stage: number;
  description: string;
}

// Honest placeholder: tells you exactly which build stage delivers this page.
export default function ComingSoon({ title, stage, description }: ComingSoonProps) {
  return (
    <div className="center-page">
      <div className="container" style={{ display: 'grid', placeItems: 'center' }}>
        <div className="card center-card">
          <Badge tone="orange">Stage {stage}</Badge>
          <h1>{title}</h1>
          <p>{description}</p>
          <LinkButton to="/" variant="primary">Back home</LinkButton>
        </div>
      </div>
    </div>
  );
}
