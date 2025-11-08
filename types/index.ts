export interface Survey {
  id: string;
  title: string;
  description?: string;
  createdBy: string;
  createdAt: Date | string;
  isActive: boolean;
  responseCount: number;
  settings?: {
    allowAnonymous?: boolean;
    allowMultipleResponses?: boolean;
    showResults?: boolean;
    requireLogin?: boolean;
    expiresAt?: Date | string | null;
  };
}

export enum QuestionType {
  MULTIPLE_CHOICE = "multiple_choice",
  TEXT = "text",
  SCALE = "scale",
  DATE = "date",
}

export interface Question {
  id: string;
  surveyId: string;
  text: string;
  type: QuestionType;
  options?: string[];
  required: boolean;
  order: number;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface Response {
  id: string;
  surveyId: string;
  userId?: string | null;
  answers: Record<string, any>;
  submittedAt: Date | string;
  metadata?: {
    userAgent?: string;
    ip?: string;
  };
}

export interface AnalyticsData {
  totalResponses: number;
  questions: Record<string, QuestionAnalytics>;
}

export interface QuestionAnalytics {
  question: string;
  type: QuestionType;
  totalResponses: number;
  data: any;
}

export interface User {
  uid: string;
  email: string;
  name: string;
  role: string;
}
