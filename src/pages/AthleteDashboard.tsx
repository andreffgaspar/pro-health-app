import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Plus,
  Settings,
  LogOut,
  Target,
  Clock,
  Zap
} from "lucide-react";
import DataInputModal from "@/components/DataInputModal";
import DataVisualization from "@/components/DataVisualization";
import AthleteProfileSettings from "@/components/AthleteProfileSettings";
import CommunicationCenter from "@/components/CommunicationCenter";
import SessionScheduler from "@/components/SessionScheduler";
import { Link, useNavigate } from "react-router-dom";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { useAthleteData } from "@/hooks/useAthleteData";

const AthleterDashboard = () => {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const { todaysMetrics, weeklyData, performanceData, loading } = useAthleteData();
  const [showProfileSettings, setShowProfileSettings] = useState(false);
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

  return (
    <div className="min-h-screen bg-gradient-subtle">
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
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setShowProfileSettings(true)}
              >
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
          <Card 
            className="p-4 hover:shadow-card-sport transition-shadow cursor-pointer" 
            onClick={() => openModalWithTab("sleep")}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <Moon className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sono</p>
                <p className="text-lg font-bold">{todaysMetrics.sleep.toFixed(1)}h</p>
              </div>
            </div>
          </Card>

          <Card 
            className="p-4 hover:shadow-card-sport transition-shadow cursor-pointer" 
            onClick={() => openModalWithTab("vitals")}
          >
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

          <Card 
            className="p-4 hover:shadow-card-sport transition-shadow cursor-pointer" 
            onClick={() => openModalWithTab("nutrition")}
          >
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

          <Card 
            className="p-4 hover:shadow-card-sport transition-shadow cursor-pointer" 
            onClick={() => openModalWithTab("nutrition")}
          >
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

          <Card 
            className="p-4 hover:shadow-card-sport transition-shadow cursor-pointer" 
            onClick={() => openModalWithTab("training")}
          >
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

          <Card 
            className="p-4 hover:shadow-card-sport transition-shadow cursor-pointer" 
            onClick={() => openModalWithTab("vitals")}
          >
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
          {/* Performance Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Performance Semanal
                  </CardTitle>
                  <CardDescription>
                    Evolução do seu score de performance nos últimos 7 dias
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-primary border-primary">
                  Última semana
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">Carregando dados...</p>
                  </div>
                </div>
              ) : performanceData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
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
                <div className="h-[300px] flex items-center justify-center">
                  <div className="text-center">
                    <TrendingUp className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground mb-2">Nenhum dado de performance encontrado</p>
                    <p className="text-sm text-muted-foreground">Comece registrando seus dados de treino, sono e recuperação</p>
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
                Acompanhe seu progresso diário
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
                  <span>{todaysMetrics.sleep.toFixed(1)}/8h</span>
                </div>
                <Progress value={Math.min((todaysMetrics.sleep / 8) * 100, 100)} className="h-2" />
              </div>

              <DataInputModal 
                initialTab="sleep"
                trigger={
                  <Button className="w-full gap-2">
                    <Plus className="w-4 h-4" />
                    Registrar Dados
                  </Button>
                }
              />
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
                {loading ? (
                  <div className="h-[250px] flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                      <p className="text-sm text-muted-foreground">Carregando dados...</p>
                    </div>
                  </div>
                ) : weeklyData.some(day => day.training > 0) ? (
                  <ResponsiveContainer width="100%" height={250}>
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
                  <div className="h-[250px] flex items-center justify-center">
                    <div className="text-center">
                      <Clock className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                      <p className="text-muted-foreground mb-2">Nenhum dado de treino encontrado</p>
                      <p className="text-sm text-muted-foreground">Registre seus treinos para visualizar o progresso</p>
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="nutrition" className="mt-6">
                {loading ? (
                  <div className="h-[250px] flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                      <p className="text-sm text-muted-foreground">Carregando dados...</p>
                    </div>
                  </div>
                ) : weeklyData.some(day => day.calories > 0) ? (
                  <ResponsiveContainer width="100%" height={250}>
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
                  <div className="h-[250px] flex items-center justify-center">
                    <div className="text-center">
                      <Utensils className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                      <p className="text-muted-foreground mb-2">Nenhum dado de nutrição encontrado</p>
                      <p className="text-sm text-muted-foreground">Registre suas refeições para acompanhar as calorias</p>
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="hydration" className="mt-6">
                {loading ? (
                  <div className="h-[250px] flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                      <p className="text-sm text-muted-foreground">Carregando dados...</p>
                    </div>
                  </div>
                ) : weeklyData.some(day => day.water > 0) ? (
                  <ResponsiveContainer width="100%" height={250}>
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
                  <div className="h-[250px] flex items-center justify-center">
                    <div className="text-center">
                      <Activity className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                      <p className="text-muted-foreground mb-2">Nenhum dado de hidratação encontrado</p>
                      <p className="text-sm text-muted-foreground">Registre seu consumo de água diário</p>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="sessions" className="mt-6">
                <SessionScheduler userType="athlete" />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Communication Center */}
        <Card className="mt-8">
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
          <Button 
            variant="outline" 
            className="h-16 flex flex-col gap-1"
            onClick={() => openModalWithTab("training")}
          >
            <Plus className="w-5 h-5" />
            <span className="text-xs">Novo Treino</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-16 flex flex-col gap-1"
            onClick={() => openModalWithTab("nutrition")}
          >
            <Utensils className="w-5 h-5" />
            <span className="text-xs">Registrar Refeição</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-16 flex flex-col gap-1"
            onClick={() => openModalWithTab("vitals")}
          >
            <Heart className="w-5 h-5" />
            <span className="text-xs">Dados Vitais</span>
          </Button>
          <DataVisualization 
            trigger={
              <Button variant="outline" className="h-16 flex flex-col gap-1">
                <TrendingUp className="w-5 h-5" />
                <span className="text-xs">Ver Dados Salvos</span>
              </Button>
            }
          />
        </div>

        {/* Hidden Modal Triggers for Quick Access Cards */}
        <div style={{ display: 'none' }}>
          <DataInputModal 
            initialTab="sleep"
            trigger={<Button ref={sleepTriggerRef}>Hidden Sleep Trigger</Button>}
          />
          <DataInputModal 
            initialTab="nutrition"
            trigger={<Button ref={nutritionTriggerRef}>Hidden Nutrition Trigger</Button>}
          />
          <DataInputModal 
            initialTab="training"
            trigger={<Button ref={trainingTriggerRef}>Hidden Training Trigger</Button>}
          />
          <DataInputModal 
            initialTab="vitals"
            trigger={<Button ref={vitalsTriggerRef}>Hidden Vitals Trigger</Button>}
          />
        </div>

        {/* Athlete Profile Settings Modal */}
        <AthleteProfileSettings 
          open={showProfileSettings} 
          onOpenChange={setShowProfileSettings} 
        />
      </div>
    </div>
  );
};

export default AthleterDashboard;