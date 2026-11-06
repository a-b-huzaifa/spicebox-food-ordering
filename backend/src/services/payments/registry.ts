import type { OrderDocument } from '../../models/Order';
import type { PaymentDocument } from '../../models/Payment';
import type { PaymentMethod, PaymentMethodOption } from '../../types';
import { AppError } from '../../utils/AppError';
import { CodProvider } from './providers/CodProvider';
import type { PaymentProvider, PaymentRegistry } from './types';

/**
 * Placeholder provider for payment methods not yet configured or implemented.
 * Reports isAvailable() = false until Stage 9 (Stripe) and Stage 10 (Simulated Wallets).
 */
class UnavailableProvider implements PaymentProvider<unknown> {
  constructor(
    public readonly method: PaymentMethod,
    private readonly reason: string,
  ) {}

  public isAvailable(): boolean {
    return false;
  }

  public async initiate(_order: OrderDocument): Promise<unknown> {
    throw new AppError(503, this.reason, 'PAYMENT_METHOD_UNAVAILABLE');
  }

  public async confirm(_payment: PaymentDocument, _input?: unknown): Promise<PaymentDocument> {
    throw new AppError(503, this.reason, 'PAYMENT_METHOD_UNAVAILABLE');
  }

  public async refund(_payment: PaymentDocument): Promise<PaymentDocument> {
    throw new AppError(503, this.reason, 'PAYMENT_METHOD_UNAVAILABLE');
  }
}

/**
 * Strictly typed payment provider registry.
 * Maps every domain PaymentMethod to its provider implementation.
 */
export const paymentRegistry: PaymentRegistry = {
  cod: new CodProvider(),
  card: new UnavailableProvider('card', 'Card payments via Stripe are not yet enabled'),
  jazzcash: new UnavailableProvider('jazzcash', 'JazzCash simulation is not yet enabled'),
  easypaisa: new UnavailableProvider('easypaisa', 'Easypaisa simulation is not yet enabled'),
};

/**
 * Helper to fetch a provider by method
 */
export function getPaymentProvider(method: PaymentMethod): PaymentProvider<unknown> {
  const provider = paymentRegistry[method];
  if (!provider) {
    throw AppError.badRequest(`Unsupported payment method: ${method}`);
  }
  return provider;
}

/**
 * Metadata descriptor for all supported payment methods
 */
export function getAvailablePaymentMethods(): PaymentMethodOption[] {
  return [
    {
      id: 'cod',
      title: 'Cash on Delivery',
      description: 'Pay with cash at your doorstep when your food arrives.',
      available: paymentRegistry.cod.isAvailable(),
      isSimulated: false,
    },
    {
      id: 'card',
      title: 'Credit / Debit Card',
      description: 'Instant card payment powered by Stripe (Test mode).',
      available: paymentRegistry.card.isAvailable(),
      isSimulated: false,
      badge: 'Test Mode',
    },
    {
      id: 'jazzcash',
      title: 'JazzCash',
      description: 'Mobile wallet payment via simulated sandbox flow.',
      available: paymentRegistry.jazzcash.isAvailable(),
      isSimulated: true,
      badge: 'Demo',
    },
    {
      id: 'easypaisa',
      title: 'Easypaisa',
      description: 'Mobile wallet payment via simulated sandbox flow.',
      available: paymentRegistry.easypaisa.isAvailable(),
      isSimulated: true,
      badge: 'Demo',
    },
  ];
}

