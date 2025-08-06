import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { healthKitLogger } from '@/services/healthKitLogger';
import { RefreshCw, Download, Filter } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface HealthKitLog {
  id: string;
  level: string;
  component: string;
  action: string;
  message: string;
  data: any;
  error_details?: string;
  platform?: string;
  is_native: boolean;
  created_at: string;
}

interface HealthKitLogsProps {
  className?: string;
}

export const HealthKitLogs: React.FC<HealthKitLogsProps> = ({ className }) => {
  const [logs, setLogs] = useState<HealthKitLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'error' | 'warning' | 'info'>('all');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const fetchedLogs = await healthKitLogger.getLogs(200);
      setLogs(fetchedLogs);
    } catch (error) {
      console.error('Failed to fetch HealthKit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    return log.level === filter;
  });

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'bg-red-500 text-white';
      case 'warning':
        return 'bg-yellow-500 text-white';
      case 'info':
        return 'bg-blue-500 text-white';
      case 'debug':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const exportLogs = () => {
    const logsText = filteredLogs.map(log => 
      `[${log.created_at}] ${log.level.toUpperCase()} ${log.component}.${log.action}: ${log.message}${log.data ? ' | Data: ' + JSON.stringify(log.data) : ''}${log.error_details ? ' | Error: ' + log.error_details : ''}`
    ).join('\n');
    
    const blob = new Blob([logsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `healthkit-logs-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className={`${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Logs de Integração HealthKit</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchLogs}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportLogs}
              disabled={filteredLogs.length === 0}
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </CardTitle>
        <CardDescription>
          Logs detalhados de todas as operações do HealthKit ({filteredLogs.length} de {logs.length} logs)
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <div className="flex gap-1">
            {['all', 'error', 'warning', 'info'].map((level) => (
              <Button
                key={level}
                variant={filter === level ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(level as any)}
              >
                {level === 'all' ? 'Todos' : level}
              </Button>
            ))}
          </div>
        </div>

        {/* Logs List */}
        <ScrollArea className="h-[400px] w-full">
          <div className="space-y-2">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {loading ? 'Carregando logs...' : 'Nenhum log encontrado'}
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="border rounded-lg p-3 space-y-2 bg-muted/30"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={getLevelColor(log.level)}>
                        {log.level.toUpperCase()}
                      </Badge>
                      <span className="text-sm font-mono">
                        {log.component}.{log.action}
                      </span>
                      {log.platform && (
                        <Badge variant="outline" className="text-xs">
                          {log.platform}
                        </Badge>
                      )}
                      {log.is_native && (
                        <Badge variant="secondary" className="text-xs">
                          Native
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(log.created_at), { 
                        addSuffix: true,
                        locale: ptBR 
                      })}
                    </span>
                  </div>
                  
                  <div className="text-sm">
                    {log.message}
                  </div>
                  
                  {log.data && Object.keys(log.data).length > 0 && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                        Dados adicionais
                      </summary>
                      <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    </details>
                  )}
                  
                  {log.error_details && (
                    <div className="text-xs bg-red-50 border border-red-200 rounded p-2">
                      <strong className="text-red-700">Erro:</strong>
                      <div className="text-red-600 mt-1">{log.error_details}</div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};