import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserCircle, Trophy, Star, Globe, Leaf, Flame, Lock } from 'lucide-react';
import { LanguageCode, PlayerStats, Scenario, DifficultyLevel, EvaluationResult } from '../types';
import { LANGUAGE_CONFIG, DIFFICULTY_UNLOCK_LEVELS, XP_PER_LEVEL_INCREASE, SCORE_MULTIPLIER, XP_MULTIPLIER, INITIAL_SCENARIOS } from '../constants';
import { generateNewScenario, evaluateAndSuggest } from '../services/geminiService';
import ScenarioDisplay from './ScenarioDisplay';
import UserInput from './UserInput';
import FeedbackDisplay from './FeedbackDisplay';
import LoadingSpinner from './LoadingSpinner';
import { useToast } from '@/hooks/use-toast';

interface MainPracticeScreenProps {
  selectedLanguage: LanguageCode;
  playerStats: PlayerStats;
  currentScenario: Scenario | null;
  previousScenarios: string[];
  chosenDifficulty: DifficultyLevel;
  onChangeLanguage: () => void;
  onUpdatePlayerStats: (stats: Partial<PlayerStats>) => void;
  onUpdateScenario: (scenario: Scenario) => void;
  onDifficultyChange: (difficulty: DifficultyLevel) => void;
}

export default function MainPracticeScreen({
  selectedLanguage,
  playerStats,
  currentScenario,
  previousScenarios,
  chosenDifficulty,
  onChangeLanguage,
  onUpdatePlayerStats,
  onUpdateScenario,
  onDifficultyChange
}: MainPracticeScreenProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);
  const [userAttempt, setUserAttempt] = useState('');
  const [speechTranslation, setSpeechTranslation] = useState('');

  const languageConfig = LANGUAGE_CONFIG[selectedLanguage];
  const xpProgress = (playerStats.xp / playerStats.xpToNext) * 100;

  // Generate initial scenario if none exists
  useEffect(() => {
    if (!currentScenario) {
      generateInitialScenario();
    }
  }, [currentScenario]);

  const generateInitialScenario = useCallback(async () => {
    setIsGenerating(true);
    try {
      // Use initial scenario if no previous scenarios exist
      if (previousScenarios.length === 0) {
        const initialScenario: Scenario = {
          englishText: INITIAL_SCENARIOS[selectedLanguage],
          difficulty: 'Easy',
          language: selectedLanguage
        };
        onUpdateScenario(initialScenario);
      } else {
        const scenario = await generateNewScenario(selectedLanguage, chosenDifficulty, previousScenarios);
        onUpdateScenario(scenario);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate scenario",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  }, [selectedLanguage, chosenDifficulty, previousScenarios, onUpdateScenario, toast]);

  const handleSubmitAttempt = useCallback(async () => {
    if (!currentScenario || !userAttempt.trim()) {
      toast({
        title: "No Response",
        description: "Please enter your response before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsEvaluating(true);
    setEvaluationResult(null);

    try {
      const result = await evaluateAndSuggest(
        selectedLanguage,
        currentScenario.englishText,
        userAttempt.trim()
      );

      const evaluationResult: EvaluationResult = {
        ...result,
        userAttempt: userAttempt.trim(),
        scenario: currentScenario
      };

      setEvaluationResult(evaluationResult);

      // Update player stats
      const earnedScore = result.attemptScore * SCORE_MULTIPLIER;
      const earnedXP = result.attemptScore * XP_MULTIPLIER;
      
      let newXP = playerStats.xp + earnedXP;
      let newLevel = playerStats.level;
      let newXPToNext = playerStats.xpToNext;

      // Check for level up
      while (newXP >= newXPToNext && newLevel < 10) { // Cap at level 10
        newXP -= newXPToNext;
        newLevel++;
        newXPToNext = 100 + (newLevel - 1) * XP_PER_LEVEL_INCREASE;
      }

      onUpdatePlayerStats({
        score: playerStats.score + earnedScore,
        xp: newXP,
        level: newLevel,
        xpToNext: newXPToNext
      });

      if (earnedScore > 0) {
        toast({
          title: "Great job!",
          description: `You earned ${earnedScore} points and ${earnedXP} XP!`,
        });
      }

    } catch (error) {
      toast({
        title: "Evaluation Error",
        description: error instanceof Error ? error.message : "Failed to evaluate your attempt",
        variant: "destructive",
      });
    } finally {
      setIsEvaluating(false);
    }
  }, [currentScenario, userAttempt, selectedLanguage, playerStats, onUpdatePlayerStats, toast]);

  const handleNextScenario = useCallback(async () => {
    setIsGenerating(true);
    setEvaluationResult(null);
    setUserAttempt('');
    setSpeechTranslation('');

    try {
      const scenario = await generateNewScenario(selectedLanguage, chosenDifficulty, previousScenarios);
      onUpdateScenario(scenario);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate new scenario",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  }, [selectedLanguage, chosenDifficulty, previousScenarios, onUpdateScenario, toast]);

  const handleRetryScenario = useCallback(() => {
    setEvaluationResult(null);
    setUserAttempt('');
    setSpeechTranslation('');
  }, []);

  const handleDifficultyChange = useCallback((difficulty: DifficultyLevel) => {
    const requiredLevel = DIFFICULTY_UNLOCK_LEVELS[difficulty];
    if (playerStats.level >= requiredLevel) {
      onDifficultyChange(difficulty);
      toast({
        title: "Difficulty Changed",
        description: `Switched to ${difficulty} difficulty. Your next scenario will reflect this change.`,
      });
    }
  }, [playerStats.level, onDifficultyChange, toast]);

  const isDifficultyUnlocked = (difficulty: DifficultyLevel) => {
    return playerStats.level >= DIFFICULTY_UNLOCK_LEVELS[difficulty];
  };

  const getDifficultyIcon = (difficulty: DifficultyLevel) => {
    switch (difficulty) {
      case 'Easy': return <Leaf className="w-4 h-4" />;
      case 'Medium': return <Flame className="w-4 h-4" />;
      case 'Hard': return <Lock className="w-4 h-4" />;
    }
  };

  const getDifficultyColor = (difficulty: DifficultyLevel) => {
    if (!isDifficultyUnlocked(difficulty)) return 'bg-slate-300 text-slate-500';
    switch (difficulty) {
      case 'Easy': return 'bg-green-500 hover:bg-green-600 text-white';
      case 'Medium': return 'bg-yellow-500 hover:bg-yellow-600 text-white';
      case 'Hard': return 'bg-red-500 hover:bg-red-600 text-white';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Title */}
            <div className="flex items-center">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center mr-3">
                <UserCircle className="text-primary-foreground" size={24} />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-800">
                  {languageConfig.displayName} Practice
                </h1>
                <p className="text-xs text-slate-500">Medical Communication</p>
              </div>
            </div>

            {/* Player Stats */}
            <div className="flex items-center space-x-6">
              {/* Level Badge */}
              <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                <Star className="w-3 h-3 mr-1" />
                Level {playerStats.level}
              </Badge>

              {/* Score */}
              <div className="flex items-center">
                <Trophy className="w-4 h-4 text-yellow-500 mr-2" />
                <span className="text-sm font-medium text-slate-700">
                  {playerStats.score.toLocaleString()} pts
                </span>
              </div>

              {/* XP Progress */}
              <div className="hidden sm:flex items-center space-x-3">
                <span className="text-sm text-slate-600">XP</span>
                <div className="w-24">
                  <Progress value={xpProgress} className="h-2" />
                </div>
                <span className="text-xs text-slate-500">
                  {playerStats.xp}/{playerStats.xpToNext}
                </span>
              </div>

              {/* Change Language Button */}
              <Button variant="ghost" size="sm" onClick={onChangeLanguage}>
                <Globe className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Difficulty Selector */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="mb-4 sm:mb-0">
                <h2 className="text-lg font-semibold text-slate-800 mb-1">
                  Difficulty Level
                </h2>
                <p className="text-sm text-slate-600">Choose your challenge level</p>
              </div>

              <div className="flex space-x-2">
                {(['Easy', 'Medium', 'Hard'] as DifficultyLevel[]).map((difficulty) => (
                  <Button
                    key={difficulty}
                    variant={chosenDifficulty === difficulty ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleDifficultyChange(difficulty)}
                    disabled={!isDifficultyUnlocked(difficulty)}
                    className={`${getDifficultyColor(difficulty)} ${chosenDifficulty === difficulty ? 'ring-2 ring-offset-2 ring-primary' : ''}`}
                  >
                    {getDifficultyIcon(difficulty)}
                    <span className="ml-1">
                      {difficulty}
                      {!isDifficultyUnlocked(difficulty) && 
                        ` (Level ${DIFFICULTY_UNLOCK_LEVELS[difficulty]} Req.)`
                      }
                    </span>
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading State for Scenario Generation */}
        {isGenerating && (
          <Card className="mb-8">
            <CardContent className="p-8">
              <LoadingSpinner message="Generating new scenario..." />
            </CardContent>
          </Card>
        )}

        {/* Scenario Display */}
        {currentScenario && !isGenerating && (
          <ScenarioDisplay scenario={currentScenario} />
        )}

        {/* User Input */}
        {currentScenario && !isGenerating && (
          <UserInput
            selectedLanguage={selectedLanguage}
            userAttempt={userAttempt}
            onUserAttemptChange={setUserAttempt}
            speechTranslation={speechTranslation}
            onSpeechTranslationChange={setSpeechTranslation}
            onSubmit={handleSubmitAttempt}
            disabled={isEvaluating}
          />
        )}

        {/* Loading State for Evaluation */}
        {isEvaluating && (
          <Card className="mb-8">
            <CardContent className="p-8">
              <LoadingSpinner message="Evaluating your response..." />
            </CardContent>
          </Card>
        )}

        {/* Feedback Display */}
        {evaluationResult && !isEvaluating && (
          <FeedbackDisplay
            evaluationResult={evaluationResult}
            selectedLanguage={selectedLanguage}
            onRetry={handleRetryScenario}
            onNext={handleNextScenario}
          />
        )}
      </main>
    </div>
  );
}
