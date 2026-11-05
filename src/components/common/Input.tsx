import React, { forwardRef } from 'react';
import { Input as TamaguiInput, Text, YStack, type InputProps as TamaguiInputProps } from 'tamagui';

export type InputProps = TamaguiInputProps & { label?: string; error?: string };
export const Input = forwardRef<React.ComponentRef<typeof TamaguiInput>, InputProps>(
  function Input({ label, error, ...props }, ref) {
    return <YStack gap={6}>
      {label && <Text color="#111827">{label}</Text>}
      <TamaguiInput ref={ref} minHeight={48} borderRadius={12}
        borderColor={error ? '#DC2626' : '#CBD5E1'} accessibilityLabel={label} {...props} />
      {error && <Text color="#DC2626" accessibilityRole="alert">{error}</Text>}
    </YStack>;
  }
);
