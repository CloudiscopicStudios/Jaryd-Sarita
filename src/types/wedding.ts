export interface TimelineEvent {
  time: string;
  title: string;
  description: string;
  icon?: string;
}

export interface GuestMessage {
  id: string;
  name: string;
  message: string;
  audioUrl?: string;
  timestamp: Date;
  photos?: string[];
}

export interface GuestPhoto {
  id: string;
  url: string;
  guestName: string;
  timestamp: Date;
}

export interface WeddingInfo {
  coupleNames: {
    partner1: string;
    partner2: string;
  };
  weddingDate: string;
  location: string;
  contactEmail: string;
  hashtag: string;
}
