import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { RestaurantCard } from '../components/RestaurantCard';
import { Badge } from '../components/ui/Badge';
import { Button, LinkButton } from '../components/ui/Button';
import { ChipGroup } from '../components/ui/ChipGroup';
import type { ChipOption } from '../components/ui/ChipGroup';
import { PaymentMethodPicker } from '../components/ui/PaymentMethodPicker';
import { SafeImage } from '../components/ui/SafeImage';
import { categories, howItWorks, paymentMethods, restaurants } from '../data/sample';
import type { PaymentMethod } from '../types';

const categoryOptions: ChipOption<string>[] = categories.map((c) => ({ value: c.id, label: c.label }));

export default function Home() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [payment, setPayment] = useState<PaymentMethod>('cod');

  const featured = useMemo(
    () => restaurants.filter((r) => category === 'all' || r.categories.includes(category)),
    [category],
  );

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    navigate(trimmed ? `/restaurants?search=${encodeURIComponent(trimmed)}` : '/restaurants');
  }

  return (
    <>
      <section className="hero">
        <div className="container hero__grid">
          <div>
            <Badge tone="charcoal">Now delivering</Badge>
            <h1>
              Cravings, <mark>delivered</mark> hot.
            </h1>
            <p className="hero__lead">
              Order from local kitchens, pay the way you like, and follow your food right to your door.
            </p>
            <form className="search-bar" onSubmit={handleSearch} role="search">
              <label htmlFor="hero-search" className="sr-only">Search dishes or restaurants</label>
              <input
                id="hero-search"
                className="input"
                placeholder="Search burgers, biryani, pizza..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <Button type="submit" variant="primary">Find food</Button>
            </form>
            <div className="hero__perks">
              <span>Cash, card &amp; wallets</span>
              <span>Live order tracking</span>
              <span>Owner dashboards</span>
            </div>
          </div>

          <div className="hero__visual" aria-hidden="true">
            <div className="hero__photo hero__photo--a">
              <SafeImage src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=900&q=80&auto=format&fit=crop" alt="Spread of dishes" />
            </div>
            <div className="hero__photo hero__photo--b">
              <SafeImage src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=900&q=80&auto=format&fit=crop" alt="Pizza" />
            </div>
            <div className="float-card float-card--eta">
              <small>Estimated arrival</small>
              <b>25-35 min</b>
            </div>
            <div className="float-card float-card--rating">
              <small>Rated by diners</small>
              <b>★ 4.8</b>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section__head">
            <div>
              <p className="section__eyebrow">Featured</p>
              <h2>Hot right now</h2>
            </div>
            <LinkButton to="/restaurants" variant="soft">See all restaurants</LinkButton>
          </div>
          <ChipGroup label="Filter by cuisine" options={categoryOptions} value={category} onChange={setCategory} />
          <div style={{ marginTop: '1.75rem' }}>
            {featured.length === 0 ? (
              <div className="card card--neo empty-note">Nothing in this category yet.</div>
            ) : (
              <div className="grid-3">
                {featured.map((r) => (
                  <RestaurantCard key={r.id} restaurant={r} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section__head">
            <div>
              <p className="section__eyebrow">How it works</p>
              <h2>From craving to doorstep</h2>
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
          <div className="section__head">
            <div>
              <p className="section__eyebrow">Payments</p>
              <h2>Pay your way</h2>
              <p className="section__lead">Four ways to pay at checkout. Pick one below to preview the selector.</p>
            </div>
          </div>
          <PaymentMethodPicker methods={paymentMethods} value={payment} onChange={setPayment} />
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="cta-band">
            <div>
              <h2>Run a kitchen? Put it on Spicebox.</h2>
              <p>Create an owner account, add your menu, and manage incoming orders from your own dashboard.</p>
            </div>
            <LinkButton to="/register" variant="dark" size="lg">Become a partner</LinkButton>
          </div>
        </div>
      </section>
    </>
  );
}
