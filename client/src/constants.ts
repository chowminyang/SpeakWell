import { LanguageConfig, PlayerStats, DifficultyLevel } from './types';

export const GEMINI_TEXT_MODEL = 'gemini-2.0-flash-exp';

export const LANGUAGE_CONFIG: Record<string, LanguageConfig> = {
  zh: {
    code: 'zh',
    name: 'Simplified Mandarin Chinese',
    displayName: '简体中文',
    ttsCode: 'zh-CN',
    flag: '🇨🇳',
    color: 'from-red-50 to-orange-50 border-red-200 hover:border-red-300'
  },
  ms: {
    code: 'ms',
    name: 'Bahasa Melayu',
    displayName: 'Bahasa Melayu',
    ttsCode: 'ms-MY',
    flag: '🇲🇾',
    color: 'from-green-50 to-blue-50 border-green-200 hover:border-green-300'
  }
};

export const INITIAL_PLAYER_STATS: PlayerStats = {
  level: 1,
  score: 0,
  xp: 0,
  xpToNext: 100
};

export const XP_PER_LEVEL_INCREASE = 50;
export const SCORE_MULTIPLIER = 10;
export const XP_MULTIPLIER = 20;

export const DIFFICULTY_UNLOCK_LEVELS: Record<DifficultyLevel, number> = {
  'Easy': 1,
  'Medium': 3,
  'Hard': 5
};

export const SCENARIO_GENERATION_PROMPT_TEMPLATE = (
  language: string,
  difficulty: DifficultyLevel,
  previousScenarios: string[]
) => {
  const difficultyDescriptions = {
    'Easy': 'simple, basic medical situations with common vocabulary',
    'Medium': 'moderately complex medical scenarios requiring some medical terminology',
    'Hard': 'complex medical situations with advanced medical vocabulary and concepts'
  };

  const avoidText = previousScenarios.length > 0 
    ? `\n\nAvoid repeating these recent scenarios:\n${previousScenarios.map(s => `- ${s}`).join('\n')}`
    : '';

  return `Generate a ${difficulty.toLowerCase()} difficulty medical communication scenario for a doctor to communicate with a patient in ${language}.

The scenario should be ${difficultyDescriptions[difficulty]}.

Provide ONLY the concise English text that describes what the doctor should communicate to the patient. The response should be 1-3 short, clear sentences.

Examples of good responses:
- "Inform the patient they have mild flu and need to rest for 3 days."
- "Explain that the blood test results are normal and no further treatment is needed."
- "Tell the patient they need to take the prescribed medication twice daily with food."

Do NOT include phrases like "Your task is to..." or "You need to tell the patient...". Just provide the direct medical communication content.${avoidText}`;
};

export const EVALUATION_PROMPT_TEMPLATE = (
  languageConfig: LanguageConfig,
  englishScenario: string,
  userAttempt: string
) => {
  const languageSpecificInstructions = languageConfig.code === 'zh' 
    ? ' Use only Simplified Chinese characters in the modelAnswer, never Traditional Chinese. Include Pinyin in parentheses after Chinese characters (e.g., "你好 (Nǐ hǎo)").'
    : '';

  return `You are a language tutor evaluating a medical communication attempt. The user was asked to communicate this medical scenario in ${languageConfig.name}:

"${englishScenario}"

User's attempt in ${languageConfig.name}: "${userAttempt}"

Evaluate this attempt and respond with a JSON object containing:
- attemptScore: Number from 1-5 (1=poor, 5=excellent) based on accuracy, grammar, completeness, and appropriateness
- feedback: 2-3 sentences of constructive feedback in English
- modelAnswer: An ideal response in ${languageConfig.name}.${languageSpecificInstructions}
- explanation: Optional 1 sentence explaining a key grammar point or vocabulary choice

If the attempt is empty or clearly not in ${languageConfig.name}, return attemptScore: 0 with appropriate feedback.

Respond ONLY with the JSON object, no markdown formatting.`;
};

export const TRANSLATION_PROMPT_TEMPLATE = (
  languageConfig: LanguageConfig,
  textToTranslate: string
) => `Translate this ${languageConfig.name} text to English: "${textToTranslate}"

Provide only the English translation, no additional text.`;

export const TRANSCRIPTION_PROMPT_TEMPLATE = (
  languageConfig: LanguageConfig
) => `Transcribe this audio to text. The audio is in ${languageConfig.name}. Provide only the transcribed text, no additional formatting or explanation.`;


