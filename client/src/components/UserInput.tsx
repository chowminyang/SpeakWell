import { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mic, MicOff, Languages } from 'lucide-react';
import { LanguageCode } from '../types';
import { LANGUAGE_CONFIG } from '../constants';
import { useAudioRecording } from '../hooks/useAudioRecording';
import { transcribeAudioWithOpenAI, translateTextToEnglish } from '../services/openaiService';
import { useToast } from '@/hooks/use-toast';

interface UserInputProps {
  selectedLanguage: LanguageCode;
  userAttempt: string;
  onUserAttemptChange: (value: string) => void;
  speechTranslation: string;
  onSpeechTranslationChange: (value: string) => void;
  onSubmit: () => void;
  disabled: boolean;
}

export default function UserInput({
  selectedLanguage,
  userAttempt,
  onUserAttemptChange,
  speechTranslation,
  onSpeechTranslationChange,
  onSubmit,
  disabled
}: UserInputProps) {
  const { toast } = useToast();
  const [isTranscribing, setIsTranscribing] = useState(false);
  const languageConfig = LANGUAGE_CONFIG[selectedLanguage];

  const {
    isRecording,
    startRecording,
    stopRecording,
    error: recordingError
  } = useAudioRecording();

  const handleToggleRecording = useCallback(async () => {
    if (isRecording) {
      try {
        const audioBlob = await stopRecording();
        if (audioBlob) {
          setIsTranscribing(true);
          
          try {
            // Transcribe audio directly with OpenAI Whisper
            const transcription = await transcribeAudioWithOpenAI(
              selectedLanguage,
              audioBlob
            );
            
            // Update user attempt with transcription
            onUserAttemptChange(transcription);
            
            // Translate to English for verification
            if (transcription.trim()) {
              const translation = await translateTextToEnglish(selectedLanguage, transcription);
              onSpeechTranslationChange(translation);
            }
            
          } catch (error) {
            toast({
              title: "Transcription Error",
              description: error instanceof Error ? error.message : "Failed to transcribe audio",
              variant: "destructive",
            });
          } finally {
            setIsTranscribing(false);
          }
        }
      } catch (error) {
        toast({
          title: "Recording Error",
          description: error instanceof Error ? error.message : "Failed to process recording",
          variant: "destructive",
        });
        setIsTranscribing(false);
      }
    } else {
      try {
        await startRecording();
        onSpeechTranslationChange(''); // Clear previous translation
      } catch (error) {
        toast({
          title: "Recording Error",
          description: error instanceof Error ? error.message : "Failed to start recording",
          variant: "destructive",
        });
      }
    }
  }, [isRecording, startRecording, stopRecording, selectedLanguage, onUserAttemptChange, onSpeechTranslationChange, toast]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  }, [onSubmit]);

  return (
    <Card className="mb-8">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Your Response</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Text Input */}
          <div className="space-y-2">
            <Label htmlFor="user-response" className="text-sm font-medium text-slate-700">
              Type your response in{' '}
              <span className="text-primary font-medium">{languageConfig.name}</span>
            </Label>
            <Textarea
              id="user-response"
              value={userAttempt}
              onChange={(e) => onUserAttemptChange(e.target.value)}
              placeholder="Enter your response here..."
              rows={4}
              className="resize-none text-base sm:text-lg"
              disabled={disabled || isTranscribing}
            />
          </div>

          {/* Recording Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-slate-200 pt-4">
            <div className="flex items-center space-x-4 mb-4 sm:mb-0">
              {/* Record Button */}
              <Button
                type="button"
                variant={isRecording ? "destructive" : "secondary"}
                size="sm"
                onClick={handleToggleRecording}
                disabled={disabled || isTranscribing}
                className="flex items-center space-x-2"
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                <span>
                  {isRecording ? 'Stop Recording' : isTranscribing ? 'Transcribing...' : 'Record'}
                </span>
              </Button>

              {/* Recording Status */}
              {isRecording && (
                <div className="flex items-center space-x-2 text-red-600">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Recording...</span>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <Button 
              type="submit"
              disabled={disabled || !userAttempt.trim() || isRecording || isTranscribing}
              className="w-full sm:w-auto"
            >
              {disabled ? 'Evaluating...' : 'Submit Attempt'}
            </Button>
          </div>

          {/* Recording Error */}
          {recordingError && (
            <Alert variant="destructive">
              <AlertDescription>{recordingError}</AlertDescription>
            </Alert>
          )}

          {/* Speech Translation Display */}
          {speechTranslation && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <Languages className="text-blue-600 mt-1" size={16} />
                <div>
                  <p className="text-sm font-medium text-blue-800 mb-1">
                    Your speech (translated to English):
                  </p>
                  <p className="text-blue-700">{speechTranslation}</p>
                </div>
              </div>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
