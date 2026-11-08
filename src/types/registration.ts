export interface Registration {
  _id: string;
  eventId: string;
  userId: string;
  participantRole: 'attendee' | 'volunteer';
  status: 'registered' | 'checked_in' | 'completed' | 'cancelled' | 'waitlist' | 'absent';
  waitlistPosition?: number | null;
  qrCode?: string;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  checkInLocation?: {
    latitude: number;
    longitude: number;
  };
  checkInMethod?: 'qr_scan' | 'admin_manual' | 'passcode' | 'appeal';
  note?: string;
  certificateCode?: string;
  registeredAt?: string;
  createdAt?: string;
}

export interface CheckInAppeal {
  id: string;
  _id?: string;
  eventId: string;
  eventTitle?: string;
  userId: string;
  studentId: string;
  studentName: string;
  reason: string;
  proofImageUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewerNote?: string;
  reviewedAt?: string;
  createdAt: string;
}

export type CreateRegistrationPayload = Omit<
  Registration,
  '_id' | 'checkInTime' | 'createdAt'
> & {
  checkInTime?: string | null;
};
