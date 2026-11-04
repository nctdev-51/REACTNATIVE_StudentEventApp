export interface Feedback {
  _id: string;
  eventId: string;
  userId: string;
  rating: number; // 1 – 5
  comment: string;
  createdAt: string;
}

export type CreateFeedbackPayload = Omit<Feedback, '_id' | 'createdAt'>;
