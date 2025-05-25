import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserCircle, AlertCircle } from 'lucide-react';

interface PasswordScreenProps {
  onAuthenticate: (success: boolean) => void;
}

export default function PasswordScreen({ onAuthenticate }: PasswordScreenProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate a brief loading state
    await new Promise(resolve => setTimeout(resolve, 500));

    if (password === 'humeaine') {
      onAuthenticate(true);
    } else {
      setError('Incorrect access code. Please try again.');
      onAuthenticate(false);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
      <Card className="w-full max-w-md mx-4 shadow-xl">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <UserCircle className="text-primary-foreground text-2xl" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">
              Medical Communication Practice
            </h1>
            <p className="text-slate-600">Enter your access code to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                Access Code
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your access code"
                className="w-full"
                disabled={isLoading}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading || !password.trim()}
            >
              {isLoading ? 'Authenticating...' : 'Enter Application'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
