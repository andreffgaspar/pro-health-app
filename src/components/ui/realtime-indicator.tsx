import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Activity, CheckCircle2 } from 'lucide-react';

interface RealtimeIndicatorProps {
  isConnected?: boolean;
  lastUpdate?: string;
  className?: string;
}

export const RealtimeIndicator = ({ isConnected = true, lastUpdate, className = "" }: RealtimeIndicatorProps) => {
  const [showUpdate, setShowUpdate] = useState(false);

  useEffect(() => {
    if (lastUpdate) {
      setShowUpdate(true);
      const timer = setTimeout(() => setShowUpdate(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [lastUpdate]);

  if (showUpdate) {
    return (
      <Badge 
        variant="default" 
        className={`gap-1 bg-green-500 text-white animate-pulse ${className}`}
      >
        <CheckCircle2 className="w-3 h-3" />
        Atualizado
      </Badge>
    );
  }

  return (
    <div className={`flex items-center gap-1 text-xs ${isConnected ? 'text-green-600' : 'text-red-600'} ${className}`}>
      <div 
        className={`w-2 h-2 rounded-full ${
          isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
        }`}
      />
      {isConnected ? 'Tempo Real' : 'Desconectado'}
    </div>
  );
};