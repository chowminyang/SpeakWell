import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, StarHalf, Play, Pause, RotateCcw, ArrowRight } from 'lucide-react';
import { EvaluationResult, LanguageCode } from '../types';
import { LANGUAGE_CONFIG } from '../constants';
import { useToast } from '@/hooks/use-toast';

interface FeedbackDisplayProps {
  evaluationResult: EvaluationResult;
  selectedLanguage: LanguageCode;
  onRetry: () => void;
  onNext: () => void;
}

export default function FeedbackDisplay({
  evaluationResult,
  selectedLanguage,
  onRetry,
  onNext
}: FeedbackDisplayProps) {
  const { toast } = useToast();
  const [isPlaying, setIsPlaying] = useState(false);
  const languageConfig = LANGUAGE_CONFIG[selectedLanguage];

  const renderStars = (score: number) => {
    const stars = [];
    const fullStars = Math.floor(score);
    const hasHalfStar = score % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="w-5 h-5 text-yellow-500 fill-yellow-500" />);
    }
    
    if (hasHalfStar) {
      stars.push(<StarHalf key="half" className="w-5 h-5 text-yellow-500 fill-yellow-500" />);
    }
    
    const remainingStars = 5 - Math.ceil(score);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="w-5 h-5 text-slate-300" />);
    }
    
    return stars;
  };

  const handlePlayTTS = async () => {
    if (!('speechSynthesis' in window)) {
      toast({
        title: "TTS Not Supported",
        description: "Text-to-speech is not supported in your browser.",
        variant: "destructive",
      });
      return;
    }

    if (isPlaying) {
      speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    try {
      const utterance = new SpeechSynthesisUtterance(evaluationResult.modelAnswer);
      utterance.lang = languageConfig.ttsCode;
      utterance.rate = 0.8;
      
      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => {
        setIsPlaying(false);
        toast({
          title: "TTS Error",
          description: "Failed to play text-to-speech. Voice might not be available for this language.",
          variant: "destructive",
        });
      };

      speechSynthesis.speak(utterance);
    } catch (error) {
      setIsPlaying(false);
      toast({
        title: "TTS Error",
        description: "Failed to initialize text-to-speech.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="mb-8">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-6">AI Feedback</h3>

        {/* Score Rating */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-700">Your Attempt Rating</span>
            <span className="text-sm text-slate-500">
              {evaluationResult.attemptScore}/5
            </span>
          </div>
          <div className="flex space-x-1">
            {renderStars(evaluationResult.attemptScore)}
          </div>
        </div>

        {/* AI Feedback Text */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-slate-700 mb-2">Feedback</h4>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <p className="text-slate-700 leading-relaxed">{evaluationResult.feedback}</p>
          </div>
        </div>

        {/* Model Answer */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-slate-700">Model Answer</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePlayTTS}
              className="text-primary hover:text-primary-dark"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span className="ml-1">{isPlaying ? 'Stop' : 'Listen'}</span>
            </Button>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-slate-700 font-medium leading-relaxed whitespace-pre-line">
              {evaluationResult.modelAnswer}
            </p>
          </div>
        </div>

        {/* Explanation */}
        {evaluationResult.explanation && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-slate-700 mb-2">Key Grammar Point</h4>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-slate-700 text-sm leading-relaxed">
                {evaluationResult.explanation}
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={onRetry}
            className="flex-1 border-yellow-300 text-yellow-700 hover:bg-yellow-50"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Try This Scenario Again
          </Button>
          <Button onClick={onNext} className="flex-1">
            <ArrowRight className="w-4 h-4 mr-2" />
            Next Scenario
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
