import type { ComponentPropsWithoutRef } from 'react';
import { Link } from 'react-router-dom';

type Variant = 'default' | 'primary' | 'danger' | 'dark' | 'soft';
type Size = 'sm' | 'md' | 'lg';

interface StyleProps {
  variant?: Variant;
  size?: Size;
}

function buildClass({ variant = 'default', size = 'md' }: StyleProps, extra?: string): string {
  return ['btn', variant !== 'default' && `btn--${variant}`, size !== 'md' && `btn--${size}`, extra]
    .filter(Boolean)
    .join(' ');
}

export function Button({ variant, size, className, type, ...rest }: ComponentPropsWithoutRef<'button'> & StyleProps) {
  return <button type={type ?? 'button'} className={buildClass({ variant, size }, className)} {...rest} />;
}

export function LinkButton({ variant, size, className, ...rest }: ComponentPropsWithoutRef<typeof Link> & StyleProps) {
  return <Link className={buildClass({ variant, size }, className)} {...rest} />;
}
