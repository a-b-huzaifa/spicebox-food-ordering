import { LinkButton } from '../components/ui/Button';
import { howItWorks } from '../data/sample';

const values = [
  { title: 'Fast and honest', text: 'Clear delivery estimates and transparent fees. No surprises at checkout.' },
  { title: 'Built for kitchens too', text: 'Owners get their own dashboard to manage menus and move orders along.' },
  { title: 'Flexible payments', text: 'Cash on delivery, cards, and mobile wallets, so everyone can order.' },
] as const;

export default function About() {
  return (
    <>
      <section className="about-hero">
        <div className="container">
          <p className="section__eyebrow">About Spicebox</p>
          <h1>Good food shouldn't be hard to get.</h1>
          <p>
            Spicebox is a food ordering platform that connects hungry people with local kitchens. Customers browse, order and
            track; restaurant owners manage menus and fulfil orders; admins keep everything running smoothly.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container grid-3">
          {values.map((v) => (
            <div className="card value" key={v.title}>
              <h3>{v.title}</h3>
              <p>{v.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section__head">
            <div>
              <p className="section__eyebrow">How it works</p>
              <h2>Four steps, zero fuss</h2>
            </div>
          </div>
          <div className="grid-4">
            {howItWorks.map((step, i) => (
              <div className="card card--neo step" key={step.title}>
                <span className="step__num">{i + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <p className="notice">
            <strong>A note on this project:</strong> Spicebox is a learning and portfolio project. The restaurants, menus and orders
            you see are sample data, and the wallet and card payments run in demo or test mode.
          </p>
          <div style={{ marginTop: '2rem' }}>
            <LinkButton to="/restaurants" variant="primary" size="lg">Browse restaurants</LinkButton>
          </div>
        </div>
      </section>
    </>
  );
}
