import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import { LanguageCode } from '../types';
import { LANGUAGE_CONFIG } from '../constants';

interface LanguageSelectionProps {
  onLanguageSelect: (language: LanguageCode) => void;
}

export default function LanguageSelection({ onLanguageSelect }: LanguageSelectionProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
      <Card className="w-full max-w-2xl mx-4 shadow-xl">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-primary to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Globe className="text-white text-3xl" size={36} />
            </div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">
              Choose Your Practice Language
            </h1>
            <p className="text-slate-600 text-lg">
              Select the language you'd like to practice medical communication in
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {Object.values(LANGUAGE_CONFIG).map((config) => (
              <Button
                key={config.code}
                variant="outline"
                onClick={() => onLanguageSelect(config.code)}
                className={`group bg-gradient-to-br ${config.color} hover:from-opacity-80 hover:to-opacity-80 border-2 rounded-xl p-6 h-auto transition-all duration-300 transform hover:scale-105`}
              >
                <div className="text-center">
                  <div className="text-4xl mb-4">{config.flag}</div>
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">
                    {config.displayName}
                  </h3>
                  <p className="text-slate-600 mb-3">{config.name}</p>
                  <div className={`${config.code === 'zh' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors`}>
                    Start Practice
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
