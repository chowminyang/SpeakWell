import { GoogleGenerativeAI } from '@google/generative-ai';
import { 
  LanguageCode, 
  DifficultyLevel, 
  AIParsedResponse, 
  Scenario 
} from '../types';
import { 
  GEMINI_TEXT_MODEL,
  LANGUAGE_CONFIG,
  SCENARIO_GENERATION_PROMPT_TEMPLATE,
  EVALUATION_PROMPT_TEMPLATE,
  TRANSLATION_PROMPT_TEMPLATE,
  TRANSCRIPTION_PROMPT_TEMPLATE
} from '../constants';

// API Key handling
function getApiKey(): string {
  const apiKey = (window as any).process?.env?.API_KEY || 
                 (window as any).process?.env?.GEMINI_API_KEY ||
                 import.meta.env.VITE_API_KEY ||
                 import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey || apiKey === 'your-api-key-here' || apiKey === 'placeholder') {
    throw new Error('Gemini API key is missing. Please provide a valid API key.');
  }
  
  return apiKey;
}

// Initialize Gemini AI
let genAI: GoogleGenerativeAI;

function initializeGenAI() {
  if (!genAI) {
    const apiKey = getApiKey();
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

// Utility function to parse JSON from Gemini response
function parseGeminiJSON(response: string): any {
  try {
    // Remove potential markdown code fences
    const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('Failed to parse Gemini JSON response:', response);
    throw new Error('Failed to parse AI response. Please try again.');
  }
}

// Core service functions
export async function generateNewScenario(
  languageCode: LanguageCode,
  difficulty: DifficultyLevel,
  previousScenarios: string[] = []
): Promise<Scenario> {
  try {
    const ai = initializeGenAI();
    const model = ai.getGenerativeModel({ model: GEMINI_TEXT_MODEL });
    
    const languageConfig = LANGUAGE_CONFIG[languageCode];
    const prompt = SCENARIO_GENERATION_PROMPT_TEMPLATE(
      languageConfig.name,
      difficulty,
      previousScenarios
    );
    
    console.log('Generating scenario with prompt:', prompt);
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    
    console.log('Generated scenario:', text);
    
    return {
      englishText: text,
      difficulty,
      language: languageCode
    };
  } catch (error) {
    console.error('Error generating scenario:', error);
    throw new Error('Failed to generate new scenario. Please check your internet connection and try again.');
  }
}

export async function evaluateAndSuggest(
  languageCode: LanguageCode,
  englishScenario: string,
  userAttempt: string
): Promise<AIParsedResponse> {
  try {
    const ai = initializeGenAI();
    const model = ai.getGenerativeModel({ 
      model: GEMINI_TEXT_MODEL,
      generationConfig: {
        responseMimeType: "application/json"
      }
    });
    
    const languageConfig = LANGUAGE_CONFIG[languageCode];
    const prompt = EVALUATION_PROMPT_TEMPLATE(languageConfig, englishScenario, userAttempt);
    
    console.log('Evaluating with prompt:', prompt);
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('Raw evaluation response:', text);
    
    const parsedResponse = parseGeminiJSON(text);
    
    // Validate response structure
    if (!parsedResponse.attemptScore || !parsedResponse.feedback || !parsedResponse.modelAnswer) {
      throw new Error('Invalid response structure from AI evaluation');
    }
    
    // Ensure attemptScore is within valid range
    if (parsedResponse.attemptScore < 0 || parsedResponse.attemptScore > 5) {
      parsedResponse.attemptScore = Math.max(0, Math.min(5, parsedResponse.attemptScore));
    }
    
    return parsedResponse as AIParsedResponse;
  } catch (error) {
    console.error('Error evaluating attempt:', error);
    throw new Error('Failed to evaluate your attempt. Please try again.');
  }
}

export async function translateTextToEnglish(
  languageCode: LanguageCode,
  textToTranslate: string
): Promise<string> {
  try {
    const ai = initializeGenAI();
    const model = ai.getGenerativeModel({ model: GEMINI_TEXT_MODEL });
    
    const languageConfig = LANGUAGE_CONFIG[languageCode];
    const prompt = TRANSLATION_PROMPT_TEMPLATE(languageConfig, textToTranslate);
    
    console.log('Translating text:', textToTranslate);
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const translation = response.text().trim();
    
    console.log('Translation result:', translation);
    
    return translation;
  } catch (error) {
    console.error('Error translating text:', error);
    throw new Error('Failed to translate text. Please try again.');
  }
}

export async function transcribeAudioWithGemini(
  languageCode: LanguageCode,
  base64Audio: string,
  mimeType: string
): Promise<string> {
  try {
    const ai = initializeGenAI();
    const model = ai.getGenerativeModel({ model: GEMINI_TEXT_MODEL });
    
    const languageConfig = LANGUAGE_CONFIG[languageCode];
    const prompt = TRANSCRIPTION_PROMPT_TEMPLATE(languageConfig);
    
    console.log('Transcribing audio in:', languageConfig.name);
    
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Audio,
          mimeType: mimeType
        }
      }
    ]);
    
    const response = await result.response;
    const transcription = response.text().trim();
    
    console.log('Transcription result:', transcription);
    
    return transcription;
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw new Error('Failed to transcribe audio. Please try again.');
  }
}

// Utility function to convert Blob to base64
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:audio/webm;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
