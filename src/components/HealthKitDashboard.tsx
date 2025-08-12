import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { 
  Activity, 
  Heart, 
  Moon, 
  Utensils, 
  TrendingUp, 
  Target,
  Clock,
  Zap,
  Smartphone,
  RefreshCw,
  Settings
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useHealthIntegration, HealthDataType } from "@/hooks/useHealthIntegration";
import { toast } from "sonner";

interface AthleteData {
  id: string;
  data_type: string;
  data: any;
  recorded_at: string;
  created_at: string;
}

interface ProcessedMetrics {
  sleep: number;
  heartRate: number;
  calories: number;
  water: number;
  training: number;
  recovery: number;
  steps: number;
}

interface ChartData {
  date: string;
  [key: string]: any;
}

interface HealthKitDashboardProps {
  athleteId: string;
  athleteName: string;
}

const AVAILABLE_METRICS = [
  { key: 'sleep', label: 'Sono (h)', color: '#3b82f6', icon: Moon },
  { key: 'heartRate', label: 'FC Repouso (bpm)', color: '#ef4444', icon: Heart },
  { key: 'calories', label: 'Calorias', color: '#f97316', icon: Utensils },
  { key: 'steps', label: 'Passos', color: '#10b981', icon: Activity },
  { key: 'training', label: 'Treino (min)', color: '#8b5cf6', icon: Clock },
  { key: 'recovery', label: 'Recuperação (%)', color: '#06b6d4', icon: Zap }
];

const HealthKitDashboard = ({ athleteId, athleteName }: HealthKitDashboardProps) => {
  const [athleteData, setAthleteData] = useState<AthleteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['sleep', 'heartRate', 'steps']);
  const [timePeriod, setTimePeriod] = useState<string>('7');
  const [chartType, setChartType] = useState<'area' | 'line'>('area');
  
  const {
    isAvailable,
    isConnected,
    isNative,
    status,
    grantedPermissions,
    requestPermissions,
    syncHealthData,
    enableBackgroundSync,
    getLastSyncInfo
  } = useHealthIntegration();

  const [todaysMetrics, setTodaysMetrics] = useState<ProcessedMetrics>({
    sleep: 0,
    heartRate: 0,
    calories: 0,
    water: 0,
    training: 0,
    recovery: 0,
    steps: 0
  });

  useEffect(() => {
    if (athleteId) {
      fetchAthleteData();

      const channel = supabase
        .channel(`health-dashboard-${athleteId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'athlete_data',
            filter: `athlete_id=eq.${athleteId}`
          },
          (payload) => {
            console.log('Real-time health data update:', payload);
            fetchAthleteData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [athleteId]);

  const fetchAthleteData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('athlete_data')
        .select('*')
        .eq('athlete_id', athleteId)
        .order('recorded_at', { ascending: false });

      if (error) {
        console.error('Error fetching athlete data:', error);
        return;
      }

      setAthleteData(data || []);
      processData(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const processData = (data: AthleteData[]) => {
    const today = new Date();
    const todayString = today.toDateString();
    
    const todayData = data.filter(record => {
      const recordDate = new Date(record.recorded_at);
      return recordDate.toDateString() === todayString;
    });

    const processedToday: ProcessedMetrics = {
      sleep: getLatestValue(todayData, 'sleep') || getLatestValue(data, 'sleep') || 0,
      heartRate: getLatestValue(todayData, 'heart_rate') || getLatestValue(data, 'heart_rate') || 0,
      calories: getLatestValue(todayData, 'calories') || getLatestValue(todayData, 'active-calories') || 0,
      water: getLatestValue(todayData, 'water') || 0,
      training: getLatestValue(todayData, 'training_duration') || 0,
      recovery: getLatestValue(todayData, 'recovery_score') || getLatestValue(data, 'recovery_score') || 0,
      steps: getLatestValue(todayData, 'steps') || 0
    };

    setTodaysMetrics(processedToday);
  };

  const getLatestValue = (data: AthleteData[], type: string): number => {
    const records = data
      .filter(record => record.data_type === type)
      .sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime());
    
    if (records.length === 0) return 0;
    
    const latestRecord = records[0];
    
    if (type === 'sleep' && typeof latestRecord.data === 'object' && latestRecord.data) {
      const sleepHours = latestRecord.data.hours;
      const numericValue = typeof sleepHours === 'string' ? parseFloat(sleepHours) : sleepHours;
      return typeof numericValue === 'number' && !isNaN(numericValue) ? numericValue : 0;
    }
    
    const value = typeof latestRecord.data === 'object' && latestRecord.data 
      ? latestRecord.data.value || 0 
      : latestRecord.data || 0;
    
    return typeof value === 'number' ? value : 0;
  };

  const chartData = useMemo(() => {
    const days = parseInt(timePeriod);
    const processedData: ChartData[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const formattedDate = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
      const dateString = date.toDateString();

      const dayData = athleteData.filter(record => 
        new Date(record.recorded_at).toDateString() === dateString
      );

      const dataPoint: ChartData = { date: formattedDate };
      
      selectedMetrics.forEach(metric => {
        let value = 0;
        switch (metric) {
          case 'sleep':
            value = getLatestValue(dayData, 'sleep');
            break;
          case 'heartRate':
            value = getLatestValue(dayData, 'heart_rate');
            break;
          case 'calories':
            value = getLatestValue(dayData, 'calories') || getLatestValue(dayData, 'active-calories');
            break;
          case 'steps':
            value = getLatestValue(dayData, 'steps');
            break;
          case 'training':
            value = getLatestValue(dayData, 'training_duration');
            break;
          case 'recovery':
            value = getLatestValue(dayData, 'recovery_score');
            break;
          case 'water':
            value = getLatestValue(dayData, 'water');
            break;
        }
        dataPoint[metric] = value;
      });

      processedData.push(dataPoint);
    }

    return processedData;
  }, [athleteData, selectedMetrics, timePeriod]);

  const handleHealthKitConnect = async () => {
    try {
      setSyncing(true);
      const success = await requestPermissions([HealthDataType.STEPS, HealthDataType.CALORIES]);
      if (success) {
        toast.success('HealthKit conectado com sucesso!');
        // Auto sync after connection
        await handleSyncNow();
      }
    } catch (error) {
      console.error('Error connecting to HealthKit:', error);
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncNow = async () => {
    try {
      setSyncing(true);
      await syncHealthData({ days: 7, showProgress: true });
      toast.success('Dados sincronizados com sucesso!');
    } catch (error) {
      console.error('Error syncing data:', error);
      toast.error('Erro ao sincronizar dados');
    } finally {
      setSyncing(false);
    }
  };

  const lastSyncInfo = getLastSyncInfo();

  return (
    <div className="bg-gradient-subtle p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold">Dashboard HealthKit - {athleteName}</h2>
        <p className="text-muted-foreground">Dados de saúde integrados e análise avançada</p>
      </div>

      {/* HealthKit Connection Status */}
      <Card className="border-secondary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-secondary" />
            Status do HealthKit
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <div>
                <p className="font-medium">
                  {isConnected ? 'Conectado' : 'Desconectado'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isNative ? 'Dispositivo móvel' : 'Navegador (dados simulados)'}
                </p>
                {lastSyncInfo && (
                  <p className="text-xs text-muted-foreground">
                    Última sincronização: {new Date(lastSyncInfo.timestamp).toLocaleString()}
                    {' '}({lastSyncInfo.dataPointsCount} pontos de dados)
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {!isConnected && (
                <Button 
                  onClick={handleHealthKitConnect}
                  disabled={syncing}
                  size="sm"
                >
                  {syncing ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Smartphone className="w-4 h-4 mr-2" />
                  )}
                  Conectar
                </Button>
              )}
              {isConnected && (
                <Button 
                  onClick={handleSyncNow}
                  disabled={syncing}
                  size="sm"
                  variant="outline"
                >
                  {syncing ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Sincronizar
                </Button>
              )}
            </div>
          </div>
          {grantedPermissions.length > 0 && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-sm text-muted-foreground mb-2">Permissões concedidas:</p>
              <div className="flex gap-2">
                {grantedPermissions.map(permission => (
                  <Badge key={permission} variant="secondary" className="text-xs">
                    {permission === HealthDataType.STEPS ? 'Passos' : 'Calorias'}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {AVAILABLE_METRICS.map(({ key, label, color, icon: Icon }) => {
          const value = todaysMetrics[key as keyof ProcessedMetrics];
          return (
            <Card key={key} className="p-4">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${color}1a` }}
                >
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="text-lg font-bold">
                    {typeof value === 'number' ? (
                      key === 'sleep' ? value.toFixed(1) :
                      key === 'water' ? value.toFixed(1) :
                      Math.round(value)
                    ) : 0}
                    {key === 'sleep' && 'h'}
                    {key === 'water' && 'L'}
                    {key === 'heartRate' && ' bpm'}
                    {key === 'training' && 'min'}
                    {key === 'recovery' && '%'}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Chart Configuration and Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Gráfico Personalizado
          </CardTitle>
          <CardDescription>
            Selecione as métricas e período para visualização customizada
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Chart Controls */}
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Período</label>
                <Select value={timePeriod} onValueChange={setTimePeriod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Últimos 7 dias</SelectItem>
                    <SelectItem value="14">Últimos 14 dias</SelectItem>
                    <SelectItem value="30">Últimos 30 dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Tipo de Gráfico</label>
                <Select value={chartType} onValueChange={(value) => setChartType(value as 'area' | 'line')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="area">Área</SelectItem>
                    <SelectItem value="line">Linha</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div>
              <label className="text-sm font-medium mb-3 block">Métricas para Visualizar</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {AVAILABLE_METRICS.map(({ key, label, color }) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={key}
                      checked={selectedMetrics.includes(key)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedMetrics(prev => [...prev, key]);
                        } else {
                          setSelectedMetrics(prev => prev.filter(m => m !== key));
                        }
                      }}
                    />
                    <label 
                      htmlFor={key} 
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      <span 
                        className="inline-block w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: color }}
                      />
                      {label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chart */}
          {loading ? (
            <div className="h-[400px] flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Carregando dados...</p>
              </div>
            </div>
          ) : selectedMetrics.length === 0 ? (
            <div className="h-[400px] flex items-center justify-center">
              <div className="text-center">
                <Settings className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">Selecione pelo menos uma métrica</p>
                <p className="text-sm text-muted-foreground">Marque as caixas acima para visualizar os dados</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              {chartType === 'area' ? (
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  {selectedMetrics.map((metric) => {
                    const metricConfig = AVAILABLE_METRICS.find(m => m.key === metric);
                    return (
                      <Area
                        key={metric}
                        type="monotone"
                        dataKey={metric}
                        stroke={metricConfig?.color}
                        fill={metricConfig?.color}
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                    );
                  })}
                </AreaChart>
              ) : (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  {selectedMetrics.map((metric) => {
                    const metricConfig = AVAILABLE_METRICS.find(m => m.key === metric);
                    return (
                      <Line
                        key={metric}
                        type="monotone"
                        dataKey={metric}
                        stroke={metricConfig?.color}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    );
                  })}
                </LineChart>
              )}
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Goals Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-secondary" />
            Metas de Hoje
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Passos</span>
              <span>{todaysMetrics.steps}/10000</span>
            </div>
            <Progress value={Math.min((todaysMetrics.steps / 10000) * 100, 100)} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Calorias</span>
              <span>{todaysMetrics.calories}/2400</span>
            </div>
            <Progress value={Math.min((todaysMetrics.calories / 2400) * 100, 100)} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Tempo de Treino</span>
              <span>{todaysMetrics.training}/150min</span>
            </div>
            <Progress value={Math.min((todaysMetrics.training / 150) * 100, 100)} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Qualidade do Sono</span>
              <span>{todaysMetrics.sleep.toFixed(1)}/8h</span>
            </div>
            <Progress value={Math.min((todaysMetrics.sleep / 8) * 100, 100)} className="h-2" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HealthKitDashboard;