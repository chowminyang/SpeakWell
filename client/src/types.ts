export type LanguageCode = 'zh' | 'ms';

export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';

export type AppPhase = 'password' | 'language' | 'practice';

export interface LanguageConfig {
  code: LanguageCode;
  name: string;
  displayName: string;
  ttsCode: string;
  flag: string;
  color: string;
}

export interface PlayerStats {
  level: number;
  score: number;
  xp: number;
  xpToNext: number;
}

export interface Scenario {
  englishText: string;
  difficulty: DifficultyLevel;
  language: LanguageCode;
}

export interface AIParsedResponse {
  attemptScore: number;
  feedback: string;
  modelAnswer: string;
  explanation?: string;
}

export interface EvaluationResult extends AIParsedResponse {
  userAttempt: string;
  scenario: Scenario;
}
