import type { ReactNode } from 'react';

interface BadgeProps {
  tone?: 'default' | 'orange' | 'charcoal';
  children: ReactNode;
}

export function Badge({ tone = 'default', children }: BadgeProps) {
  return <span className={`badge${tone === 'default' ? '' : ` badge--${tone}`}`}>{children}</span>;
}
