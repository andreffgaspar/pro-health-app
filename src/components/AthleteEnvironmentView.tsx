import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Activity, 
  Heart, 
  Moon, 
  Utensils, 
  TrendingUp, 
  Calendar,
  Target,
  Clock,
  Zap
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { supabase } from "@/integrations/supabase/client";

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
  lastMedicalData?: {
    type: string;
    date: string;
    description: string;
  };
}

interface WeeklyData {
  day: string;
  calories: number;
  water: number;
  training: number;
}

interface PerformanceData {
  date: string;
  score: number;
  sleep: number;
  training: number;
}

interface AthleteEnvironmentViewProps {
  athleteId: string;
  athleteName: string;
}

const AthleteEnvironmentView = ({ athleteId, athleteName }: AthleteEnvironmentViewProps) => {
  const [athleteData, setAthleteData] = useState<AthleteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [todaysMetrics, setTodaysMetrics] = useState<ProcessedMetrics>({
    sleep: 0,
    heartRate: 0,
    calories: 0,
    water: 0,
    training: 0,
    recovery: 0,
    lastMedicalData: undefined
  });
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);

  useEffect(() => {
    fetchAthleteData();
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
    // Process today's metrics
    const today = new Date();
    const todayString = today.toDateString();
    
    const todayData = data.filter(record => {
      const recordDate = new Date(record.recorded_at);
      const recordDateString = recordDate.toDateString();
      return recordDateString === todayString;
    });

    // Get latest medical data (from any day)
    const medicalTypes = ['medical_exam', 'medication', 'injury', 'treatment'];
    const medicalData = data.filter(record => 
      medicalTypes.includes(record.data_type)
    ).sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime());

    const lastMedicalData = medicalData.length > 0 ? {
      type: medicalData[0].data_type,
      date: new Date(medicalData[0].recorded_at).toLocaleDateString('pt-BR'),
      description: typeof medicalData[0].data === 'object' 
        ? medicalData[0].data.description || medicalData[0].data.name || 'Registro médico'
        : 'Registro médico'
    } : undefined;

    const processedToday: ProcessedMetrics = {
      sleep: getLatestValue(todayData, 'sleep') || getLatestValue(data, 'sleep') || 0,
      heartRate: getLatestValue(todayData, 'heart_rate') || getLatestValue(data, 'heart_rate') || 0,
      calories: getLatestValue(todayData, 'calories') || 0,
      water: getLatestValue(todayData, 'water') || 0,
      training: getLatestValue(todayData, 'training_duration') || 0,
      recovery: getLatestValue(todayData, 'recovery_score') || getLatestValue(data, 'recovery_score') || 0,
      lastMedicalData
    };

    setTodaysMetrics(processedToday);

    // Process weekly data
    const weeklyProcessed = processWeeklyData(data);
    setWeeklyData(weeklyProcessed);

    // Process performance data
    const performanceProcessed = processPerformanceData(data);
    setPerformanceData(performanceProcessed);
  };

  const getLatestValue = (data: AthleteData[], type: string): number => {
    const records = data
      .filter(record => record.data_type === type)
      .sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime());
    
    if (records.length === 0) return 0;
    
    const latestRecord = records[0];
    
    // Handle different data structures based on type
    if (type === 'sleep' && typeof latestRecord.data === 'object' && latestRecord.data) {
      const sleepHours = latestRecord.data.hours;
      const numericValue = typeof sleepHours === 'string' ? parseFloat(sleepHours) : sleepHours;
      return typeof numericValue === 'number' && !isNaN(numericValue) ? numericValue : 0;
    }
    
    // Handle other data types
    const value = typeof latestRecord.data === 'object' && latestRecord.data 
      ? latestRecord.data.value || 0 
      : latestRecord.data || 0;
    
    return typeof value === 'number' ? value : 0;
  };

  const processWeeklyData = (data: AthleteData[]): WeeklyData[] => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const weeklyData: WeeklyData[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayName = days[date.getDay()];
      const dateString = date.toDateString();

      const dayData = data.filter(record => 
        new Date(record.recorded_at).toDateString() === dateString
      );

      weeklyData.push({
        day: dayName,
        calories: getLatestValue(dayData, 'calories'),
        water: getLatestValue(dayData, 'water'),
        training: getLatestValue(dayData, 'training_duration')
      });
    }

    return weeklyData;
  };

  const processPerformanceData = (data: AthleteData[]): PerformanceData[] => {
    const performanceData: PerformanceData[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toDateString();
      const formattedDate = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;

      const dayData = data.filter(record => 
        new Date(record.recorded_at).toDateString() === dateString
      );

      const sleep = getLatestValue(dayData, 'sleep');
      const training = getLatestValue(dayData, 'training_duration') / 60; // Convert to hours
      const recovery = getLatestValue(dayData, 'recovery_score');
      
      // Calculate performance score based on available metrics
      let score = 0;
      let factors = 0;
      
      if (sleep > 0) {
        score += (sleep / 8) * 30; // Sleep contributes 30%
        factors++;
      }
      if (training > 0) {
        score += Math.min(training / 2, 1) * 40; // Training contributes 40%
        factors++;
      }
      if (recovery > 0) {
        score += (recovery / 100) * 30; // Recovery contributes 30%
        factors++;
      }
      
      // If no data, show 0, otherwise calculate average
      const finalScore = factors > 0 ? Math.round(score / factors * 100) : 0;

      performanceData.push({
        date: formattedDate,
        score: finalScore,
        sleep: sleep,
        training: training * 10 // Scale for chart display
      });
    }

    return performanceData;
  };

  return (
    <div className="bg-gradient-subtle p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold">Dashboard de {athleteName}</h2>
        <p className="text-muted-foreground">Visualização do ambiente do atleta</p>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {/* Medical Data Highlight Card */}
        {todaysMetrics.lastMedicalData && (
          <Card className="md:col-span-2 p-4 bg-gradient-to-r from-medical-bg to-medical-bg/50 border-medical-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-medical-accent/10 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-medical-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Último Dado Médico</p>
                <p className="text-lg font-bold text-medical-accent">{todaysMetrics.lastMedicalData.type}</p>
                <p className="text-xs text-muted-foreground">{todaysMetrics.lastMedicalData.date}</p>
              </div>
            </div>
          </Card>
        )}
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <Moon className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sono</p>
              <p className="text-lg font-bold">{(todaysMetrics.sleep || 0).toFixed(1)}h</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
              <Heart className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">FC Repouso</p>
              <p className="text-lg font-bold">{todaysMetrics.heartRate} bpm</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center">
              <Utensils className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Calorias</p>
              <p className="text-lg font-bold">{todaysMetrics.calories}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-cyan-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Água</p>
              <p className="text-lg font-bold">{todaysMetrics.water.toFixed(1)}L</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Treino</p>
              <p className="text-lg font-bold">{todaysMetrics.training}min</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Recuperação</p>
              <p className="text-lg font-bold">{todaysMetrics.recovery}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Performance Chart and Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Performance Semanal
            </CardTitle>
            <CardDescription>
              Evolução do score de performance nos últimos 7 dias
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[250px] flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Carregando dados...</p>
                </div>
              </div>
            ) : performanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={performanceData}>
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
                  <Area 
                    type="monotone" 
                    dataKey="score" 
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary))" 
                    fillOpacity={0.2}
                    strokeWidth={3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center">
                <div className="text-center">
                  <TrendingUp className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground mb-2">Nenhum dado de performance encontrado</p>
                  <p className="text-sm text-muted-foreground">Dados serão exibidos quando o atleta registrar informações</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Today's Goals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-secondary" />
              Metas de Hoje
            </CardTitle>
            <CardDescription>
              Progresso diário do atleta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Hidratação</span>
                <span>{todaysMetrics.water.toFixed(1)}/3.5L</span>
              </div>
              <Progress value={Math.min((todaysMetrics.water / 3.5) * 100, 100)} className="h-2" />
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
                <span>Calorias</span>
                <span>{todaysMetrics.calories}/2400</span>
              </div>
              <Progress value={Math.min((todaysMetrics.calories / 2400) * 100, 100)} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Qualidade do Sono</span>
                <span>{(todaysMetrics.sleep || 0).toFixed(1)}/8h</span>
              </div>
              <Progress value={Math.min((todaysMetrics.sleep / 8) * 100, 100)} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-accent" />
            Visão Semanal
          </CardTitle>
          <CardDescription>
            Comparativo das métricas ao longo da semana
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="training" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="training">Treinos</TabsTrigger>
              <TabsTrigger value="nutrition">Nutrição</TabsTrigger>
              <TabsTrigger value="hydration">Hidratação</TabsTrigger>
            </TabsList>
            
            <TabsContent value="training" className="mt-6">
              {loading ? (
                <div className="h-[200px] flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">Carregando dados...</p>
                  </div>
                </div>
              ) : weeklyData.some(day => day.training > 0) ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="training" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center">
                  <div className="text-center">
                    <Clock className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground mb-2">Nenhum dado de treino encontrado</p>
                    <p className="text-sm text-muted-foreground">Dados aparecerão quando o atleta registrar treinos</p>
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="nutrition" className="mt-6">
              {loading ? (
                <div className="h-[200px] flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">Carregando dados...</p>
                  </div>
                </div>
              ) : weeklyData.some(day => day.calories > 0) ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="calories" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center">
                  <div className="text-center">
                    <Utensils className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground mb-2">Nenhum dado nutricional encontrado</p>
                    <p className="text-sm text-muted-foreground">Dados aparecerão quando o atleta registrar nutrição</p>
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="hydration" className="mt-6">
              {loading ? (
                <div className="h-[200px] flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">Carregando dados...</p>
                  </div>
                </div>
              ) : weeklyData.some(day => day.water > 0) ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="water" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center">
                  <div className="text-center">
                    <Activity className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground mb-2">Nenhum dado de hidratação encontrado</p>
                    <p className="text-sm text-muted-foreground">Dados aparecerão quando o atleta registrar hidratação</p>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AthleteEnvironmentView;