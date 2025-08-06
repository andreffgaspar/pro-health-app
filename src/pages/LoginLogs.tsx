import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";

interface LoginLog {
  id: string;
  user_id: string | null;
  session_id: string | null;
  step: string;
  status: 'started' | 'success' | 'error' | 'timeout';
  message: string | null;
  data: any;
  error_details: string | null;
  timestamp: string;
  user_agent: string | null;
  platform: string | null;
}

const LoginLogs = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<LoginLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('login_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching login logs:', error);
        return;
      }

      setLogs(data as LoginLog[] || []);
    } catch (error) {
      console.error('Error fetching login logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'timeout':
        return 'bg-orange-500';
      case 'started':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('pt-BR');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link to="/athlete-dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Logs de Login</h1>
          </div>
          <Button onClick={fetchLogs} size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>

        <div className="space-y-4">
          {logs.map((log) => (
            <Card key={log.id} className="w-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-medium">
                    {log.step}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge 
                      className={`text-white ${getStatusColor(log.status)}`}
                    >
                      {log.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {formatTimestamp(log.timestamp)}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {log.message && (
                    <p className="text-sm">
                      <strong>Mensagem:</strong> {log.message}
                    </p>
                  )}
                  
                  {log.session_id && (
                    <p className="text-xs text-muted-foreground">
                      <strong>Session ID:</strong> {log.session_id}
                    </p>
                  )}
                  
                  {log.user_id && (
                    <p className="text-xs text-muted-foreground">
                      <strong>User ID:</strong> {log.user_id}
                    </p>
                  )}
                  
                  {log.platform && (
                    <p className="text-xs text-muted-foreground">
                      <strong>Plataforma:</strong> {log.platform}
                    </p>
                  )}
                  
                  {log.data && Object.keys(log.data).length > 0 && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-muted-foreground">
                        <strong>Dados (clique para expandir)</strong>
                      </summary>
                      <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    </details>
                  )}
                  
                  {log.error_details && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-red-600">
                        <strong>Detalhes do Erro (clique para expandir)</strong>
                      </summary>
                      <pre className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs overflow-auto text-red-800">
                        {log.error_details}
                      </pre>
                    </details>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {logs.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">Nenhum log encontrado.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default LoginLogs;