// src/types/index.ts

// 'export' 키워드가 반드시 있어야 다른 파일에서 import 할 수 있습니다.
export type Category = 'reading' | 'grammar' | 'literature';

export interface Question {
  id: string;
  passage?: string;
  question: string;
  choices: string[];
  answer: number;
  explanation: string;
}

export interface QuizResult {
  total: number;
  correct: number;
  score: number;
}