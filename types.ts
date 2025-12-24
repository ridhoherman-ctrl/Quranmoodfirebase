
export enum MoodType {
  HAPPY = 'Bahagia',
  GRATEFUL = 'Bersyukur',
  OPTIMISTIC = 'Optimis',
  CONFUSED = 'Bingung',
  ANXIOUS = 'Cemas',
  RESTLESS = 'Gelisah',
  GALAU = 'Galau',
  TIRED = 'Capek',
  ANGRY = 'Marah',
  DISAPPOINTED = 'Kecewa',
  LONELY = 'Kesepian',
  SAD = 'Sedih'
}

export interface QuranContent {
  surahName: string;
  surahNumber: number;
  ayahNumber: number;
  arabicText: string;
  translation: string;
  reflection: string;
}

export interface HadithContent {
  source: string;
  text: string;
}

export interface HealingContent {
  mood: string;
  summary: string;
  quran: QuranContent;
  hadith: HadithContent;
  wisdom: string;
  practicalSteps: string[];
  reflectionQuestions: string[];
}

export interface FavoriteItem {
  id: string;
  type: 'quran' | 'hadith';
  content: QuranContent | HadithContent;
  timestamp: number;
  moodContext: string;
}

export interface MoodTheme {
  background: string;
  primaryText: string;
  secondaryText: string;
  accent: string;
  border: string;
  ui: {
    pill: string;
    buttonPrimary: string;
    buttonSecondary: string;
    iconBg: string;
    highlight: string;
  }
}

export interface MoodConfig {
  type: MoodType;
  icon: string;
  color: string;
  description: string;
  theme: MoodTheme;
}

export interface MoodLog {
  id: string;
  timestamp: number;
  mood: MoodType;
  note?: string;
}

export type UserStatus = 'pending' | 'approved' | 'blocked';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  status: UserStatus;
  requestedAt: number;
}
