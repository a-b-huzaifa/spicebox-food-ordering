import type { PaymentMethod, PaymentMethodInfo } from '../../types';
import { Badge } from './Badge';

interface PaymentMethodPickerProps {
  methods: readonly PaymentMethodInfo[];
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
}

// Accessible radio group. Selected tile "sinks" (neumorphic inset) with an
// orange border; unselected tiles stay raised (brutalist hard shadow).
export function PaymentMethodPicker({ methods, value, onChange }: PaymentMethodPickerProps) {
  return (
    <div className="pay-grid" role="radiogroup" aria-label="Payment method">
      {methods.map((method) => (
        <button
          key={method.id}
          type="button"
          role="radio"
          aria-checked={method.id === value}
          className="pay-tile"
          onClick={() => onChange(method.id)}
        >
          <span className="pay-tile__icon" aria-hidden="true">{method.icon}</span>
          <span>
            <span className="pay-tile__title">
              {method.title}
              {method.note && <Badge tone="charcoal">{method.note}</Badge>}
            </span>
            <span className="pay-tile__desc">{method.description}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
