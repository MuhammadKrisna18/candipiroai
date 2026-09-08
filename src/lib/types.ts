export type MessageRole = 'user' | 'ai';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  detectedLanguage?: 'Indonesian' | 'English';
  detectedTopic?: 'Physics' | 'General Knowledge';
}

export interface ChatSession {
  id: string;
  title: string;
  lastUpdated: number;
  messages: ChatMessage[];
  isPinned?: boolean;
}

export interface UserSession {
  isLoggedIn: boolean;
  user?: {
    uid: string;
    name: string;
    email: string;
    avatar?: string;
  };
}
