import { useState, useEffect, useCallback } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import PasswordScreen from "./components/PasswordScreen";
import LanguageSelection from "./components/LanguageSelection";
import MainPracticeScreen from "./components/MainPracticeScreen";
import LevelUpModal from "./components/LevelUpModal";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { AppPhase, PlayerStats, LanguageCode, Scenario } from "./types";
import { INITIAL_PLAYER_STATS, LANGUAGE_CONFIG } from "./constants";
import { useToast } from "@/hooks/use-toast";

function App() {
  const { toast } = useToast();
  
  // State management with localStorage persistence
  const [isAuthenticated, setIsAuthenticated] = useLocalStorage("isAuthenticated", false);
  const [selectedLanguage, setSelectedLanguage] = useLocalStorage<LanguageCode | null>("selectedLanguage", null);
  const [playerStats, setPlayerStats] = useLocalStorage<PlayerStats>("playerStats", INITIAL_PLAYER_STATS);
  const [currentScenario, setCurrentScenario] = useLocalStorage<Scenario | null>("currentScenario", null);
  const [previousScenarios, setPreviousScenarios] = useLocalStorage<string[]>("previousScenarios", []);
  const [chosenDifficulty, setChosenDifficulty] = useLocalStorage<'Easy' | 'Medium' | 'Hard'>("chosenDifficulty", 'Easy');
  
  // Local state
  const [currentPhase, setCurrentPhase] = useState<AppPhase>('password');
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [levelUpMessage, setLevelUpMessage] = useState('');

  // Initialize app phase based on stored data
  useEffect(() => {
    if (!isAuthenticated) {
      setCurrentPhase('password');
    } else if (!selectedLanguage) {
      setCurrentPhase('language');
    } else {
      setCurrentPhase('practice');
    }
  }, [isAuthenticated, selectedLanguage]);

  const handleAuthentication = useCallback((success: boolean) => {
    if (success) {
      setIsAuthenticated(true);
      setCurrentPhase('language');
    } else {
      toast({
        title: "Authentication Failed",
        description: "Incorrect access code. Please try again.",
        variant: "destructive",
      });
    }
  }, [setIsAuthenticated, toast]);

  const handleLanguageSelection = useCallback((language: LanguageCode) => {
    setSelectedLanguage(language);
    setCurrentPhase('practice');
  }, [setSelectedLanguage]);

  const handleChangeLanguage = useCallback(() => {
    setSelectedLanguage(null);
    setCurrentPhase('language');
  }, [setSelectedLanguage]);

  const updatePlayerStats = useCallback((newStats: Partial<PlayerStats>) => {
    const currentLevel = playerStats.level;
    const updatedStats = { ...playerStats, ...newStats };
    
    // Check for level up
    if (updatedStats.level > currentLevel) {
      setLevelUpMessage(`Congratulations! You've reached Level ${updatedStats.level}.`);
      setShowLevelUpModal(true);
      
      // Check for difficulty unlocks
      if (updatedStats.level === 3) {
        toast({
          title: "🔓 Medium Difficulty Unlocked!",
          description: "You can now practice with medium difficulty scenarios.",
        });
      } else if (updatedStats.level === 5) {
        toast({
          title: "🔓 Hard Difficulty Unlocked!",
          description: "You can now practice with hard difficulty scenarios.",
        });
      }
    }
    
    setPlayerStats(updatedStats);
  }, [playerStats, setPlayerStats, toast]);

  const updateScenario = useCallback((scenario: Scenario) => {
    // Add current scenario to previous scenarios
    if (currentScenario?.englishText) {
      setPreviousScenarios(prev => {
        const updated = [currentScenario.englishText, ...prev].slice(0, 5);
        return updated;
      });
    }
    setCurrentScenario(scenario);
  }, [currentScenario, setCurrentScenario, setPreviousScenarios]);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-slate-50">
        {currentPhase === 'password' && (
          <PasswordScreen onAuthenticate={handleAuthentication} />
        )}
        
        {currentPhase === 'language' && (
          <LanguageSelection onLanguageSelect={handleLanguageSelection} />
        )}
        
        {currentPhase === 'practice' && selectedLanguage && (
          <MainPracticeScreen
            selectedLanguage={selectedLanguage}
            playerStats={playerStats}
            currentScenario={currentScenario}
            previousScenarios={previousScenarios}
            chosenDifficulty={chosenDifficulty}
            onChangeLanguage={handleChangeLanguage}
            onUpdatePlayerStats={updatePlayerStats}
            onUpdateScenario={updateScenario}
            onDifficultyChange={setChosenDifficulty}
          />
        )}
        
        {showLevelUpModal && (
          <LevelUpModal
            message={levelUpMessage}
            newLevel={playerStats.level}
            onClose={() => setShowLevelUpModal(false)}
          />
        )}
      </div>
      <Toaster />
    </TooltipProvider>
  );
}

export default App;
