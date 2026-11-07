export interface Registration {
  _id: string;
  eventId: string;
  userId: string;
  participantRole: 'attendee' | 'volunteer';
  status: 'registered' | 'checked_in' | 'completed' | 'cancelled';
  qrCode?: string;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  checkInLocation?: {
    latitude: number;
    longitude: number;
  };
  checkInMethod?: 'qr_scan' | 'admin_manual';
  note?: string;
  createdAt?: string;
}

export type CreateRegistrationPayload = Omit<
  Registration,
  '_id' | 'checkInTime' | 'createdAt'
> & {
  checkInTime?: string | null;
};
