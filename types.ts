export interface QuestionData {
  id: number;
  question: string;
  answers: {
    [modelKey: string]: string;
  };
}

export interface Scores {
  accuracy: number; // 1-6
  completeness: number; // 1-3
  readability: number; // 0-100
  detail: number; // 0-100
}

export interface EvaluationData {
  [questionId: number]: {
    [modelKey: string]: Scores;
  };
}

export enum ViewMode {
  EVALUATE = 'EVALUATE',
  DASHBOARD = 'DASHBOARD',
  DATA_ENTRY = 'DATA_ENTRY'
}

export const MODELS = [
  { key: 'deepseek', name: 'Deepseek V3.2', color: '#3b82f6' },
  { key: 'gemini', name: 'Gemini 3 Pro', color: '#8b5cf6' },
  { key: 'qwen', name: 'Qwen 3', color: '#10b981' },
  { key: 'chatgpt', name: 'ChatGPT-5', color: '#f59e0b' },
];
