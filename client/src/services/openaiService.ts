import OpenAI from 'openai';
import { 
  LanguageCode, 
  DifficultyLevel, 
  AIParsedResponse, 
  Scenario 
} from '../types';
import { 
  LANGUAGE_CONFIG,
  SCENARIO_GENERATION_PROMPT_TEMPLATE,
  EVALUATION_PROMPT_TEMPLATE,
  TRANSLATION_PROMPT_TEMPLATE
} from '../constants';

// API Key handling
async function getApiKey(): Promise<string> {
  // First try URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const urlApiKey = urlParams.get('OPENAI_API_KEY') || urlParams.get('API_KEY');
  
  if (urlApiKey) {
    return urlApiKey;
  }
  
  // Then try to fetch from server
  try {
    const response = await fetch('/api/config');
    const config = await response.json();
    if (config.openaiApiKey) {
      return config.openaiApiKey;
    }
  } catch (error) {
    console.log('Could not fetch OpenAI API key from server');
  }
  
  throw new Error('OpenAI API key is missing. Please provide a valid API key.');
}

// Initialize OpenAI
let openai: OpenAI;

async function initializeOpenAI() {
  if (!openai) {
    const apiKey = await getApiKey();
    openai = new OpenAI({ 
      apiKey,
      dangerouslyAllowBrowser: true 
    });
  }
  return openai;
}

// Core service functions
export async function generateNewScenario(
  languageCode: LanguageCode,
  difficulty: DifficultyLevel,
  previousScenarios: string[] = []
): Promise<Scenario> {
  try {
    const client = await initializeOpenAI();
    
    const languageConfig = LANGUAGE_CONFIG[languageCode];
    const prompt = SCENARIO_GENERATION_PROMPT_TEMPLATE(
      languageConfig.name,
      difficulty,
      previousScenarios
    );
    
    console.log('Generating scenario with OpenAI GPT-4.1-mini:', prompt);
    
    const response = await client.chat.completions.create({
      model: "gpt-4.1-mini", // Using gpt-4.1-mini as requested
      messages: [{ role: "user", content: prompt }],
      max_tokens: 150,
      temperature: 0.7
    });
    
    const text = response.choices[0].message.content?.trim() || '';
    
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
    const client = await initializeOpenAI();
    
    const languageConfig = LANGUAGE_CONFIG[languageCode];
    const prompt = EVALUATION_PROMPT_TEMPLATE(languageConfig, englishScenario, userAttempt);
    
    console.log('Evaluating with OpenAI GPT-4.1-mini:', prompt);
    
    const response = await client.chat.completions.create({
      model: "gpt-4.1-mini", // Using gpt-4.1-mini as requested
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 500,
      temperature: 0.3
    });
    
    const text = response.choices[0].message.content || '';
    
    console.log('Raw evaluation response:', text);
    
    const parsedResponse = JSON.parse(text);
    
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
    const client = await initializeOpenAI();
    
    const languageConfig = LANGUAGE_CONFIG[languageCode];
    const prompt = TRANSLATION_PROMPT_TEMPLATE(languageConfig, textToTranslate);
    
    console.log('Translating text with OpenAI:', textToTranslate);
    
    const response = await client.chat.completions.create({
      model: "gpt-4.1-mini", // Using gpt-4.1-mini as requested
      messages: [{ role: "user", content: prompt }],
      max_tokens: 200,
      temperature: 0.1
    });
    
    const translation = response.choices[0].message.content?.trim() || '';
    
    console.log('Translation result:', translation);
    
    return translation;
  } catch (error) {
    console.error('Error translating text:', error);
    throw new Error('Failed to translate text. Please try again.');
  }
}

export async function transcribeAudioWithOpenAI(
  languageCode: LanguageCode,
  audioBlob: Blob
): Promise<string> {
  try {
    console.log('Starting transcription with OpenAI Whisper:', {
      languageCode,
      audioBlobSize: audioBlob.size,
      audioBlobType: audioBlob.type
    });
    
    const client = await initializeOpenAI();
    
    const languageConfig = LANGUAGE_CONFIG[languageCode];
    
    // Create a File object from the Blob for OpenAI API
    const audioFile = new File([audioBlob], 'audio.webm', { type: audioBlob.type });
    
    console.log('Transcribing audio with GPT-4o-mini-transcribe in:', languageConfig.name);
    
    const transcription = await client.audio.transcriptions.create({
      file: audioFile,
      model: 'gpt-4o-mini-transcribe',
      prompt: languageCode === 'zh' ? 'Transcribe using only Simplified Chinese characters (简体中文). Do not use Traditional Chinese characters (繁體中文). Medical conversation about patient symptoms and treatment. Examples: 你好, 感冒, 喝水, 休息, 血压, 运动.' : 'Medical conversation in standard Bahasa Melayu about patient symptoms and treatment.',
      response_format: 'text'
    });
    
    console.log('Whisper transcription result:', transcription);
    
    return transcription.trim();
  } catch (error) {
    console.error('Detailed transcription error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw new Error(`Failed to transcribe audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function generateSpeechWithOpenAI(
  text: string,
  languageCode: LanguageCode
): Promise<Blob> {
  try {
    const client = await initializeOpenAI();
    
    // Remove Pinyin in parentheses for Chinese TTS
    let textToSpeak = text;
    if (languageCode === 'zh') {
      textToSpeak = textToSpeak.replace(/\s*\([^)]*\)/g, '');
    }
    
    console.log('Generating speech with OpenAI TTS:', textToSpeak);
    
    const response = await client.audio.speech.create({
      model: 'tts-1', // Using OpenAI's TTS model
      voice: 'alloy', // Good quality voice that works well with multiple languages
      input: textToSpeak,
      response_format: 'mp3'
    });
    
    const audioBlob = new Blob([await response.arrayBuffer()], { type: 'audio/mp3' });
    
    console.log('Generated audio blob size:', audioBlob.size);
    
    return audioBlob;
  } catch (error) {
    console.error('Error generating speech:', error);
    throw new Error('Failed to generate speech. Please try again.');
  }
}