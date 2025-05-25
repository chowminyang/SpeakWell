import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClipboardList, Globe } from 'lucide-react';
import { Scenario } from '../types';

interface ScenarioDisplayProps {
  scenario: Scenario;
  onTryAnother?: () => void;
  disabled?: boolean;
}

export default function ScenarioDisplay({ scenario, onTryAnother, disabled }: ScenarioDisplayProps) {
  return (
    <Card className="mb-8">
      <CardContent className="p-6">
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <ClipboardList className="text-blue-600" size={20} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              Current Scenario
            </h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-slate-700 leading-relaxed">
                {scenario.englishText}
              </p>
            </div>
            
            {/* Try Another Scenario Button */}
            {onTryAnother && (
              <div className="text-center">
                <Button
                  variant="outline"
                  onClick={onTryAnother}
                  disabled={disabled}
                  className="border-blue-300 text-blue-700 hover:bg-blue-50 w-full sm:w-auto"
                >
                  <Globe className="w-4 h-4 mr-2" />
                  Try Another Scenario
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
