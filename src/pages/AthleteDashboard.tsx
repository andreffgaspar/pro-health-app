import { useState, useEffect } from "react";
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
import CommunicationCenter from "@/components/CommunicationCenter";
import SessionScheduler from "@/components/SessionScheduler";
import { Link, useNavigate } from "react-router-dom";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { useAuth } from "@/hooks/useAuth";

// Mock data for charts
const performanceData = [
  { date: "01/12", score: 75, sleep: 7.5, training: 8 },
  { date: "02/12", score: 82, sleep: 8.2, training: 9 },
  { date: "03/12", score: 78, sleep: 7.8, training: 7 },
  { date: "04/12", score: 85, sleep: 8.5, training: 9 },
  { date: "05/12", score: 88, sleep: 8.0, training: 8 },
  { date: "06/12", score: 90, sleep: 8.3, training: 9 },
  { date: "07/12", score: 86, sleep: 7.9, training: 8 }
];

const weeklyData = [
  { day: "Seg", calories: 2100, water: 2.5, training: 90 },
  { day: "Ter", calories: 2250, water: 3.0, training: 120 },
  { day: "Qua", calories: 2180, water: 2.8, training: 0 },
  { day: "Qui", calories: 2300, water: 3.2, training: 105 },
  { day: "Sex", calories: 2150, water: 2.7, training: 95 },
  { day: "Sáb", calories: 2400, water: 3.5, training: 150 },
  { day: "Dom", calories: 2200, water: 2.9, training: 60 }
];

const AthleterDashboard = () => {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const todaysMetrics = {
    sleep: 8.2,
    heartRate: 65,
    calories: 2250,
    water: 3.0,
    training: 120,
    recovery: 85
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
                onClick={() => navigate('/athlete-settings')}
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
          <Card className="p-4 hover:shadow-card-sport transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <Moon className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sono</p>
                <p className="text-lg font-bold">{todaysMetrics.sleep}h</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 hover:shadow-card-sport transition-shadow">
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

          <Card className="p-4 hover:shadow-card-sport transition-shadow">
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

          <Card className="p-4 hover:shadow-card-sport transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-cyan-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Água</p>
                <p className="text-lg font-bold">{todaysMetrics.water}L</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 hover:shadow-card-sport transition-shadow">
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

          <Card className="p-4 hover:shadow-card-sport transition-shadow">
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

        {/* Agenda de Consultas */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Agenda de Consultas
            </CardTitle>
            <CardDescription>
              Visualize e agende suas consultas com profissionais
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SessionScheduler userType="athlete" />
          </CardContent>
        </Card>

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
                  <span>{todaysMetrics.water}/3.5L</span>
                </div>
                <Progress value={(todaysMetrics.water / 3.5) * 100} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Tempo de Treino</span>
                  <span>{todaysMetrics.training}/150min</span>
                </div>
                <Progress value={(todaysMetrics.training / 150) * 100} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Calorias</span>
                  <span>{todaysMetrics.calories}/2400</span>
                </div>
                <Progress value={(todaysMetrics.calories / 2400) * 100} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Qualidade do Sono</span>
                  <span>{todaysMetrics.sleep}/8h</span>
                </div>
                <Progress value={(todaysMetrics.sleep / 8) * 100} className="h-2" />
              </div>

              <DataInputModal />
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
              </TabsContent>
              
              <TabsContent value="nutrition" className="mt-6">
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
              </TabsContent>
              
              <TabsContent value="hydration" className="mt-6">
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
          <DataInputModal 
            trigger={
              <Button variant="outline" className="h-16 flex flex-col gap-1">
                <Plus className="w-5 h-5" />
                <span className="text-xs">Novo Treino</span>
              </Button>
            }
          />
          <DataInputModal 
            trigger={
              <Button variant="outline" className="h-16 flex flex-col gap-1">
                <Utensils className="w-5 h-5" />
                <span className="text-xs">Registrar Refeição</span>
              </Button>
            }
          />
          <DataInputModal 
            trigger={
              <Button variant="outline" className="h-16 flex flex-col gap-1">
                <Heart className="w-5 h-5" />
                <span className="text-xs">Dados Vitais</span>
              </Button>
            }
          />
          <DataVisualization 
            trigger={
              <Button variant="outline" className="h-16 flex flex-col gap-1">
                <TrendingUp className="w-5 h-5" />
                <span className="text-xs">Ver Dados Salvos</span>
              </Button>
            }
          />
        </div>
      </div>
    </div>
  );
};

export default AthleterDashboard;