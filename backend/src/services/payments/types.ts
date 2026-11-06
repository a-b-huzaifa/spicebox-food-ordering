import type { OrderDocument } from '../../models/Order';
import type { PaymentDocument } from '../../models/Payment';
import type { PaymentMethod } from '../../types';

/**
 * Generic payment provider interface.
 * TInit represents the provider-specific payload returned on initiation
 * (e.g. client secret for Stripe, redirect URL for wallets, info message for COD).
 */
export interface PaymentProvider<TInit = unknown> {
  readonly method: PaymentMethod;

  /**
   * Whether this payment provider is currently active and configured with required credentials
   */
  isAvailable(): boolean;

  /**
   * Initiate a payment for the given order
   */
  initiate(order: OrderDocument): Promise<TInit>;

  /**
   * Confirm/finalize the payment (e.g. after webhook, OTP verification, or cash delivery)
   */
  confirm(payment: PaymentDocument, input?: unknown): Promise<PaymentDocument>;

  /**
   * Refund an existing paid payment
   */
  refund(payment: PaymentDocument): Promise<PaymentDocument>;
}

export type PaymentRegistry = Record<PaymentMethod, PaymentProvider<unknown>>;

