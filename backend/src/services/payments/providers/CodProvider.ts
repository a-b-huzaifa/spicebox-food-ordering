import type { OrderDocument } from '../../../models/Order';
import type { PaymentDocument } from '../../../models/Payment';
import type { PaymentProvider } from '../types';

export interface CodInitiateResult {
  requiresAction: false;
  message: string;
}

/**
 * Cash on Delivery (COD) Payment Provider.
 * Payment stays 'unpaid' until the order is marked as delivered,
 * at which point it transitions to 'paid'.
 */
export class CodProvider implements PaymentProvider<CodInitiateResult> {
  public readonly method = 'cod' as const;

  public isAvailable(): boolean {
    return true; // COD is always available
  }

  public async initiate(_order: OrderDocument): Promise<CodInitiateResult> {
    return {
      requiresAction: false,
      message: 'Cash will be collected upon delivery.',
    };
  }

  public async confirm(payment: PaymentDocument, _input?: unknown): Promise<PaymentDocument> {
    payment.status = 'paid';
    payment.paidAt = new Date();
    await payment.save();
    return payment;
  }

  public async refund(payment: PaymentDocument): Promise<PaymentDocument> {
    payment.status = 'refunded';
    await payment.save();
    return payment;
  }
}

