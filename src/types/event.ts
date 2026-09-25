export interface EventTime {
  start: string;
  end: string;
}

export interface AISummary {
  what: string;
  when: string;
  where: string;
  benefits: string;
}

export interface Event {
  _id: string;

  title: string;

  faculty: string;

  category: string;

  time: EventTime;

  location: string;

  organizer: string;

  description: string;

  images: string[];

  trainingPoints: number;

  aiSummary: AISummary;

  status: "upcoming" | "ongoing" | "completed";
}