export interface Registration {
  _id: string;
  eventId: string;
  userId: string;
  participantRole: 'attendee' | 'volunteer';
  status: 'registered' | 'checked_in' | 'cancelled';
  checkInTime: string | null;
  createdAt?: string;
}

export type CreateRegistrationPayload = Omit<
  Registration,
  '_id' | 'checkInTime' | 'createdAt'
> & {
  checkInTime?: string | null;
};
