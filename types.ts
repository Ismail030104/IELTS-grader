
export interface IELTSCriteria {
  taskResponse: number;
  coherenceCohesion: number;
  lexicalResource: number;
  grammarAccuracy: number;
}

export interface FeedbackItem {
  type: 'grammar' | 'vocabulary' | 'structure' | 'task-response';
  severity: 'mistake' | 'suggestion' | 'praise';
  originalText?: string;
  explanation: string;
  suggestion?: string;
}

export interface GradingResult {
  overallBand: number;
  criteria: IELTSCriteria;
  detailedFeedback: FeedbackItem[];
  summary: string;
  essayText: string;
}

export enum AppScreen {
  HOME = 'HOME',
  DESCRIPTORS = 'DESCRIPTORS',
  GRADE_UPLOAD = 'GRADE_UPLOAD',
  FEEDBACK = 'FEEDBACK',
  SUBSCRIPTION = 'SUBSCRIPTION',
  APP_INFO = 'APP_INFO'
}

export interface SubscriptionStatus {
  isPremium: boolean;
  essaysRemaining: number;
  essaysUsed: number;
}

export interface DetailedBandDescriptor {
  band: number;
  criterion1: string; // Task Achievement (T1) or Task Response (T2)
  coherenceCohesion: string;
  lexicalResource: string;
  grammarAccuracy: string;
}
