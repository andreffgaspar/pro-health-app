import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, Heart, Moon, Utensils, TrendingUp, Calendar, Plus, Settings, LogOut, Target, Clock, Zap, MessageSquare } from "lucide-react";
import DataInputModal from "@/components/DataInputModal";
import DataVisualization from "@/components/DataVisualization";
import AthleteProfileSettings from "@/components/AthleteProfileSettings";
import CommunicationCenter from "@/components/CommunicationCenter";
import { HealthKitSyncCard } from "@/components/HealthKitSyncCard";
import { HealthDataIndicators } from "@/components/HealthDataIndicators";
import { EnhancedPerformanceChart } from "@/components/EnhancedPerformanceChart";
import SessionScheduler from "@/components/SessionScheduler";
import { Link, useNavigate } from "react-router-dom";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { useAthleteData } from "@/hooks/useAthleteData";
import { useRealtimeCommunication } from "@/hooks/useRealtimeCommunication";
import { useLoginLogger } from "@/hooks/useLoginLogger";
const AthleterDashboard = () => {
  const navigate = useNavigate();
  const {
    user,
    profile,
    signOut
  } = useAuth();
  const {
    todaysMetrics,
    weeklyData,
    performanceData,
    loading
  } = useAthleteData();
  
  const { 
    generateSessionId, 
    logStart, 
    logSuccess, 
    logError, 
    logTimeout 
  } = useLoginLogger();
  
  const [dashboardSessionId] = useState(() => generateSessionId());
  
  // Log dashboard initialization
  useEffect(() => {
    logStart('dashboard_initialization', 'AthleteDashboard component mounted', {
      hasUser: !!user,
      hasProfile: !!profile,
      loading,
      pathname: window.location.pathname
    }, dashboardSessionId, user?.id);
  }, []);
  
  // Log loading state changes
  useEffect(() => {
    logStart('dashboard_loading_state', `Dashboard loading state changed to: ${loading}`, {
      loading,
      hasUser: !!user,
      hasProfile: !!profile,
      todaysMetricsLoaded: !!todaysMetrics,
      weeklyDataLoaded: weeklyData.length > 0,
      performanceDataLoaded: performanceData.length > 0
    }, dashboardSessionId, user?.id);
  }, [loading, user, profile, todaysMetrics, weeklyData, performanceData]);
  
  // Add safety timeout to prevent infinite loading
  const [forceReady, setForceReady] = useState(false);
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (loading) {
        logTimeout('dashboard_loading_timeout', 15000, dashboardSessionId, user?.id);
        console.log('⚠️ Dashboard loading timeout reached, forcing ready state');
        setForceReady(true);
      }
    }, 15000); // 15 second timeout
    
    return () => clearTimeout(timeoutId);
  }, [loading]);
  
  const isActuallyLoading = loading && !forceReady;
  const {
    unreadCount
  } = useRealtimeCommunication();
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [activeTab, setActiveTab] = useState("training");
  const [showCommunication, setShowCommunication] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState("score");
  const [selectedPeriod, setSelectedPeriod] = useState("7");
  const [selectedDataTypes, setSelectedDataTypes] = useState<string[]>(["calories", "heart_rate"]);
  const sleepTriggerRef = useRef<HTMLButtonElement>(null);
  const nutritionTriggerRef = useRef<HTMLButtonElement>(null);
  const trainingTriggerRef = useRef<HTMLButtonElement>(null);
  const vitalsTriggerRef = useRef<HTMLButtonElement>(null);
  const handleLogout = async () => {
    await signOut();
    // Force a hard navigation to clear any cached state
    window.location.href = "/";
  };
  const openModalWithTab = (tab: string) => {
    switch (tab) {
      case "sleep":
        sleepTriggerRef.current?.click();
        break;
      case "nutrition":
        nutritionTriggerRef.current?.click();
        break;
      case "training":
        trainingTriggerRef.current?.click();
        break;
      case "vitals":
        vitalsTriggerRef.current?.click();
        break;
    }
  };

  // Function to get metric label
  const getMetricLabel = (metric: string) => {
    const labels = {
      score: "Score de Performance",
      sleep: "Horas de Sono",
      training: "Tempo de Treino (min)"
    };
    return labels[metric as keyof typeof labels] || "Score de Performance";
  };

  // Function to filter performance data by period
  const getFilteredPerformanceData = () => {
    const days = parseInt(selectedPeriod);
    return performanceData.slice(-days);
  };

  const handleDataTypeSelect = (dataType: string) => {
    setSelectedDataTypes(prev => {
      if (prev.includes(dataType)) {
        return prev.filter(type => type !== dataType);
      } else {
        return [...prev, dataType];
      }
    });
  };

  const handleDataTypeRemove = (dataType: string) => {
    setSelectedDataTypes(prev => prev.filter(type => type !== dataType));
  };
  return <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="bg-background/80 backdrop-blur-md border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-hero rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Olá, {profile?.full_name || user?.email || "Atleta"}!</h1>
                <p className="text-sm text-muted-foreground">Dashboard do Atleta</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {unreadCount > 0}
              <div className="flex items-center gap-1 text-xs text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Tempo Real
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowProfileSettings(true)}>
                <Settings className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Quick Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          {/* Medical Data Highlight Card */}
          {todaysMetrics.lastMedicalData && <Card className="md:col-span-2 p-4 bg-gradient-to-r from-medical-bg to-medical-bg/50 border-medical-border">
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
            </Card>}
          <Card className="p-4 hover:shadow-card-sport transition-shadow cursor-pointer" onClick={() => openModalWithTab("sleep")}>
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

          <Card className="p-4 hover:shadow-card-sport transition-shadow cursor-pointer" onClick={() => openModalWithTab("vitals")}>
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

          <Card className="p-4 hover:shadow-card-sport transition-shadow cursor-pointer" onClick={() => openModalWithTab("nutrition")}>
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

          <Card className="p-4 hover:shadow-card-sport transition-shadow cursor-pointer" onClick={() => openModalWithTab("nutrition")}>
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

          <Card className="p-4 hover:shadow-card-sport transition-shadow cursor-pointer" onClick={() => openModalWithTab("training")}>
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

          <Card className="p-4 hover:shadow-card-sport transition-shadow cursor-pointer" onClick={() => openModalWithTab("vitals")}>
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

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Health Data Indicators */}
          <HealthDataIndicators 
            onDataTypeSelect={handleDataTypeSelect}
            selectedDataTypes={selectedDataTypes}
          />

          {/* Enhanced Performance Chart */}
          <EnhancedPerformanceChart
            selectedDataTypes={selectedDataTypes}
            onDataTypeRemove={handleDataTypeRemove}
          />

          {/* Legacy Performance Chart - keeping as fallback */}
          <Card className="lg:col-span-2" style={{ display: 'none' }}>
            <CardHeader>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Gráfico de Performance
                  </CardTitle>
                  <CardDescription>
                    {getMetricLabel(selectedMetric)} nos últimos {selectedPeriod} dias
                  </CardDescription>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Métrica:</label>
                  <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Selecione a métrica" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="score">Score de Performance</SelectItem>
                      <SelectItem value="sleep">Horas de Sono</SelectItem>
                      <SelectItem value="training">Tempo de Treino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Período:</label>
                  <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 dias</SelectItem>
                      <SelectItem value="7">7 dias</SelectItem>
                      <SelectItem value="14">14 dias</SelectItem>
                      <SelectItem value="30">30 dias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isActuallyLoading ? <div className="h-[300px] flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">Carregando dados...</p>
                  </div>
                </div> : getFilteredPerformanceData().length > 0 ? <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={getFilteredPerformanceData()}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }} />
                    <Area type="monotone" dataKey={selectedMetric} stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer> : <div className="h-[300px] flex items-center justify-center">
                  <div className="text-center">
                    <TrendingUp className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground mb-2">Nenhum dado de performance encontrado</p>
                    <p className="text-sm text-muted-foreground">Comece registrando seus dados de treino, sono e recuperação</p>
                  </div>
                </div>}
            </CardContent>
          </Card>

          {/* HealthKit Sync Card */}
          <HealthKitSyncCard />

          {/* Today's Goals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-secondary" />
                Metas de Hoje
              </CardTitle>
              <CardDescription>
                Acompanhe seu progresso diário
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Hidratação</span>
                  <span>{todaysMetrics.water.toFixed(1)}/3.5L</span>
                </div>
                <Progress value={Math.min(todaysMetrics.water / 3.5 * 100, 100)} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Tempo de Treino</span>
                  <span>{todaysMetrics.training}/150min</span>
                </div>
                <Progress value={Math.min(todaysMetrics.training / 150 * 100, 100)} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Calorias</span>
                  <span>{todaysMetrics.calories}/2400</span>
                </div>
                <Progress value={Math.min(todaysMetrics.calories / 2400 * 100, 100)} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Qualidade do Sono</span>
                  <span>{(todaysMetrics.sleep || 0).toFixed(1)}/8h</span>
                </div>
                <Progress value={Math.min(todaysMetrics.sleep / 8 * 100, 100)} className="h-2" />
              </div>

              <DataInputModal initialTab="sleep" trigger={<Button className="w-full gap-2">
                    <Plus className="w-4 h-4" />
                    Registrar Dados
                  </Button>} />
            </CardContent>
          </Card>
        </div>

        {/* Weekly Overview */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-accent" />
              Visão Semanal
            </CardTitle>
            <CardDescription>
              Comparativo das suas métricas ao longo da semana
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="training" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="training">Treinos</TabsTrigger>
                <TabsTrigger value="nutrition">Nutrição</TabsTrigger>
                <TabsTrigger value="hydration">Hidratação</TabsTrigger>
                <TabsTrigger value="sessions">Sessões</TabsTrigger>
              </TabsList>
              
              <TabsContent value="training" className="mt-6">
                {isActuallyLoading ? <div className="h-[250px] flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                      <p className="text-sm text-muted-foreground">Carregando dados...</p>
                    </div>
                  </div> : weeklyData.some(day => day.training > 0) ? <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} />
                      <Bar dataKey="training" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer> : <div className="h-[250px] flex items-center justify-center">
                    <div className="text-center">
                      <Clock className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                      <p className="text-muted-foreground mb-2">Nenhum dado de treino encontrado</p>
                      <p className="text-sm text-muted-foreground">Registre seus treinos para visualizar o progresso</p>
                    </div>
                  </div>}
              </TabsContent>
              
              <TabsContent value="nutrition" className="mt-6">
                {isActuallyLoading ? <div className="h-[250px] flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                      <p className="text-sm text-muted-foreground">Carregando dados...</p>
                    </div>
                  </div> : weeklyData.some(day => day.calories > 0) ? <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} />
                      <Bar dataKey="calories" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer> : <div className="h-[250px] flex items-center justify-center">
                    <div className="text-center">
                      <Utensils className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                      <p className="text-muted-foreground mb-2">Nenhum dado de nutrição encontrado</p>
                      <p className="text-sm text-muted-foreground">Registre suas refeições para acompanhar as calorias</p>
                    </div>
                  </div>}
              </TabsContent>
              
              <TabsContent value="hydration" className="mt-6">
                {isActuallyLoading ? <div className="h-[250px] flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                      <p className="text-sm text-muted-foreground">Carregando dados...</p>
                    </div>
                  </div> : weeklyData.some(day => day.water > 0) ? <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} />
                      <Bar dataKey="water" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer> : <div className="h-[250px] flex items-center justify-center">
                    <div className="text-center">
                      <Activity className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                      <p className="text-muted-foreground mb-2">Nenhum dado de hidratação encontrado</p>
                      <p className="text-sm text-muted-foreground">Registre seu consumo de água diário</p>
                    </div>
                  </div>}
              </TabsContent>

              <TabsContent value="sessions" className="mt-6">
                <SessionScheduler userType="athlete" />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Communication Center */}
        <Card className="mt-8" id="communication-center">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-primary" />
              Centro de Comunicação com Profissionais
            </CardTitle>
            <CardDescription>
              Converse diretamente com nutricionistas, fisioterapeutas, médicos e outros profissionais
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CommunicationCenter />
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
          <Button variant="outline" className="h-16 flex flex-col gap-1" onClick={() => openModalWithTab("training")}>
            <Plus className="w-5 h-5" />
            <span className="text-xs">Novo Treino</span>
          </Button>
          <Button variant="outline" className="h-16 flex flex-col gap-1" onClick={() => openModalWithTab("nutrition")}>
            <Utensils className="w-5 h-5" />
            <span className="text-xs">Registrar Refeição</span>
          </Button>
          <Button variant="outline" className="h-16 flex flex-col gap-1" onClick={() => openModalWithTab("vitals")}>
            <Heart className="w-5 h-5" />
            <span className="text-xs">Dados Vitais</span>
          </Button>
          <DataVisualization trigger={<Button variant="outline" className="h-16 flex flex-col gap-1">
                <TrendingUp className="w-5 h-5" />
                <span className="text-xs">Ver Dados Salvos</span>
              </Button>} />
        </div>

        {/* Hidden Modal Triggers for Quick Access Cards */}
        <div style={{
        display: 'none'
      }}>
          <DataInputModal initialTab="sleep" trigger={<Button ref={sleepTriggerRef}>Hidden Sleep Trigger</Button>} />
          <DataInputModal initialTab="nutrition" trigger={<Button ref={nutritionTriggerRef}>Hidden Nutrition Trigger</Button>} />
          <DataInputModal initialTab="training" trigger={<Button ref={trainingTriggerRef}>Hidden Training Trigger</Button>} />
          <DataInputModal initialTab="vitals" trigger={<Button ref={vitalsTriggerRef}>Hidden Vitals Trigger</Button>} />
        </div>

        {/* Athlete Profile Settings Modal */}
        <AthleteProfileSettings open={showProfileSettings} onOpenChange={setShowProfileSettings} />
      </div>
    </div>;
};
export default AthleterDashboard;