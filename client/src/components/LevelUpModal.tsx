import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trophy } from 'lucide-react';

interface LevelUpModalProps {
  message: string;
  newLevel: number;
  onClose: () => void;
}

export default function LevelUpModal({ message, newLevel, onClose }: LevelUpModalProps) {
  const getUnlockMessage = (level: number) => {
    if (level === 3) {
      return "🔓 Medium difficulty unlocked!";
    }
    if (level === 5) {
      return "🔓 Hard difficulty unlocked!";
    }
    return null;
  };

  const unlockMessage = getUnlockMessage(newLevel);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <div className="text-center p-6">
          <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="text-white text-3xl" size={36} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Level Up!</h2>
          <p className="text-slate-600 mb-4">{message}</p>
          
          {unlockMessage && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-6">
              <p className="text-purple-700 text-sm font-medium">{unlockMessage}</p>
            </div>
          )}
          
          <Button onClick={onClose} className="w-full">
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
