import React from 'react';
import { Modal as NativeModal } from 'react-native';
import { Text, YStack } from 'tamagui';
import { Button } from './Button';
import { Card } from './Card';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  return <NativeModal visible={open} transparent animationType="fade" onRequestClose={onClose}>
    <YStack flex={1} justifyContent="center" padding={24} backgroundColor="rgba(0,0,0,0.4)">
      <Card accessibilityViewIsModal gap={16}>
        <Text fontSize={20} fontWeight="700" accessibilityRole="header">{title}</Text>
        {children}
        <Button variant="secondary" onPress={onClose}>Đóng</Button>
      </Card>
    </YStack>
  </NativeModal>;
}
