import React from 'react';
import { Button as TamaguiButton, Spinner, type ButtonProps as TamaguiButtonProps } from 'tamagui';

export type ButtonProps = Omit<TamaguiButtonProps, 'variant'> & {
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
};

export function Button({ variant = 'primary', loading, disabled, children, ...props }: ButtonProps) {
  return (
    <TamaguiButton minHeight={48} borderRadius={14}
      backgroundColor={variant === 'primary' ? '#2563EB' : variant === 'danger' ? '#FEF2F2' : '#F1F5F9'}
      color={variant === 'primary' ? '#FFFFFF' : variant === 'danger' ? '#DC2626' : '#2563EB'}
      disabled={disabled || loading} opacity={disabled || loading ? 0.6 : 1}
      accessibilityState={{ disabled: !!(disabled || loading), busy: !!loading }} {...props}>
      {loading && <Spinner color={variant === 'primary' ? '#FFFFFF' : '#2563EB'} />}
      {children}
    </TamaguiButton>
  );
}
