import type { OrderStatus, Role } from '../types';

/**
 * Pure, unit-testable state machine transition validator for order statuses.
 *
 * Rules:
 * - Forward progression (owner/admin): pending -> confirmed -> preparing -> out_for_delivery -> delivered
 * - Owner/Admin cancellation: may cancel before out_for_delivery (i.e. from pending, confirmed, preparing)
 * - Customer cancellation: may cancel ONLY while pending
 * - Terminal states (delivered, cancelled) cannot be transitioned from.
 * - Self-transitions (from === to) are disallowed.
 */
export function canTransition(from: OrderStatus, to: OrderStatus, role: Role): boolean {
  if (from === to) {
    return false;
  }

  // Terminal states cannot transition
  if (from === 'delivered' || from === 'cancelled') {
    return false;
  }

  // Customer cancellation rule
  if (role === 'customer') {
    return from === 'pending' && to === 'cancelled';
  }

  // Owner and Admin progression and cancellation rules
  if (role === 'owner' || role === 'admin') {
    if (to === 'cancelled') {
      return from === 'pending' || from === 'confirmed' || from === 'preparing';
    }

    switch (from) {
      case 'pending':
        return to === 'confirmed';
      case 'confirmed':
        return to === 'preparing';
      case 'preparing':
        return to === 'out_for_delivery';
      case 'out_for_delivery':
        return to === 'delivered';
      default:
        return false;
    }
  }

  return false;
}

