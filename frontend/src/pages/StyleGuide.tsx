import { useState } from 'react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ChipGroup } from '../components/ui/ChipGroup';
import { Field } from '../components/ui/Field';
import { PaymentMethodPicker } from '../components/ui/PaymentMethodPicker';
import { paymentMethods } from '../data/sample';
import type { PaymentMethod } from '../types';

const swatches = [
  { name: 'Orange', token: '--orange', hex: '#FF5A1F' },
  { name: 'Orange deep', token: '--orange-deep', hex: '#E8480C' },
  { name: 'Warm red', token: '--red', hex: '#E63B2E' },
  { name: 'Charcoal', token: '--charcoal', hex: '#1E1E22' },
  { name: 'White', token: '--white', hex: '#FFFFFF' },
  { name: 'Canvas', token: '--bg', hex: '#ECEBE9' },
] as const;

const sizes = [
  { value: 'sm', label: 'Small' },
  { value: 'md', label: 'Medium' },
  { value: 'lg', label: 'Large' },
] as const;

export default function StyleGuide() {
  const [size, setSize] = useState<(typeof sizes)[number]['value']>('md');
  const [payment, setPayment] = useState<PaymentMethod>('card');

  return (
    <section className="section">
      <div className="container">
        <p className="section__eyebrow">Design system</p>
        <h1 style={{ fontSize: 'clamp(2.2rem,5vw,3.4rem)', marginBottom: '0.6rem' }}>Neo-brutal meets neumorphic</h1>
        <p className="section__lead" style={{ marginBottom: '3rem' }}>
          Structure and actions are brutalist (thick borders, hard shadows). Surfaces you type into or press are neumorphic
          (soft, extruded or inset). Toggle the theme in the navbar to check both modes.
        </p>

        <div className="sg-block">
          <h2>Colour</h2>
          <div className="swatches">
            {swatches.map((s) => (
              <div className="card swatch" key={s.token}>
                <div className="swatch__color" style={{ background: `var(${s.token})` }} />
                <div className="swatch__info"><b>{s.name}</b>{s.hex}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="sg-block">
          <h2>Elevation</h2>
          <div className="sg-elevations">
            <div className="card"><b>Brutalist</b><span>Border + hard shadow. Used for cards and CTAs.</span></div>
            <div className="card card--neo"><b>Neumorphic</b><span>Soft dual shadow. Used for panels and chips.</span></div>
            <div className="card" style={{ boxShadow: 'var(--shadow-inset)', background: 'var(--bg)', borderColor: 'transparent' }}><b>Inset</b><span>Pressed and input state.</span></div>
          </div>
        </div>

        <div className="sg-block">
          <h2>Buttons</h2>
          <div className="sg-row">
            <Button size={size}>Default</Button>
            <Button size={size} variant="primary">Primary</Button>
            <Button size={size} variant="danger">Danger</Button>
            <Button size={size} variant="dark">Dark</Button>
            <Button size={size} variant="soft">Soft</Button>
            <Button size={size} disabled>Disabled</Button>
          </div>
          <ChipGroup label="Button size" options={sizes} value={size} onChange={setSize} />
        </div>

        <div className="sg-block">
          <h2>Fields</h2>
          <div className="grid-2">
            <Field label="Email" type="email" placeholder="you@example.com" />
            <Field label="Password" type="password" defaultValue="short" error="Password must be at least 8 characters" />
          </div>
        </div>

        <div className="sg-block">
          <h2>Badges</h2>
          <div className="sg-row">
            <Badge>Default</Badge>
            <Badge tone="orange">Popular</Badge>
            <Badge tone="charcoal">Test mode</Badge>
          </div>
        </div>

        <div className="sg-block">
          <h2>Payment methods</h2>
          <PaymentMethodPicker methods={paymentMethods} value={payment} onChange={setPayment} />
        </div>
      </div>
    </section>
  );
}
