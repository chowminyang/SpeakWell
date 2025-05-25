import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
}

export default function LoadingSpinner({ message = "Loading..." }: LoadingSpinnerProps) {
  return (
    <div className="text-center">
      <div className="inline-flex items-center space-x-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-slate-600 font-medium">{message}</span>
      </div>
    </div>
  );
}
