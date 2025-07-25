import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  Search,
  Plus,
  Settings,
  LogOut,
  TrendingUp,
  Calendar,
  AlertCircle,
  Activity,
  Heart,
  Moon,
  Target,
  FileText,
  MessageSquare
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

// Mock data for athletes
const athletes = [
  {
    id: 1,
    name: "João Silva",
    sport: "Futebol",
    level: "Profissional",
    lastUpdate: "2 horas",
    status: "Ativo",
    performance: 88,
    avatar: "",
    alerts: 1,
    nextSession: "Hoje, 16:00"
  },
  {
    id: 2,
    name: "Maria Santos",
    sport: "Atletismo",
    level: "Competitivo",
    lastUpdate: "5 horas",
    status: "Ativo",
    performance: 92,
    avatar: "",
    alerts: 0,
    nextSession: "Amanhã, 14:00"
  },
  {
    id: 3,
    name: "Carlos Oliveira",
    sport: "Natação",
    level: "Intermediário",
    lastUpdate: "1 dia",
    status: "Inativo",
    performance: 76,
    avatar: "",
    alerts: 2,
    nextSession: "Sexta, 09:00"
  },
  {
    id: 4,
    name: "Ana Costa",
    sport: "Crossfit",
    level: "Avançado",
    lastUpdate: "3 horas",
    status: "Ativo",
    performance: 85,
    avatar: "",
    alerts: 0,
    nextSession: "Hoje, 18:30"
  }
];

// Mock chart data
const overviewData = [
  { month: "Jul", athletes: 12, sessions: 48, performance: 82 },
  { month: "Ago", athletes: 15, sessions: 62, performance: 85 },
  { month: "Set", athletes: 18, sessions: 75, performance: 88 },
  { month: "Out", athletes: 22, sessions: 89, performance: 87 },
  { month: "Nov", athletes: 25, sessions: 98, performance: 90 },
  { month: "Dez", athletes: 28, sessions: 112, performance: 89 }
];

const performanceComparison = [
  { athlete: "João", performance: 88, improvement: 8 },
  { athlete: "Maria", performance: 92, improvement: 12 },
  { athlete: "Carlos", performance: 76, improvement: -3 },
  { athlete: "Ana", performance: 85, improvement: 5 }
];

const ProfessionalDashboard = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const userType = localStorage.getItem("userType");
    const storedName = localStorage.getItem("userName");
    
    if (userType !== "professional") {
      navigate("/login");
      return;
    }
    
    setUserName(storedName || "Profissional");
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("userType");
    localStorage.removeItem("userName");
    navigate("/");
  };

  const filteredAthletes = athletes.filter(athlete =>
    athlete.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    athlete.sport.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalAthletes = athletes.length;
  const activeAthletes = athletes.filter(a => a.status === "Ativo").length;
  const totalAlerts = athletes.reduce((sum, a) => sum + a.alerts, 0);
  const avgPerformance = Math.round(athletes.reduce((sum, a) => sum + a.performance, 0) / athletes.length);

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="bg-background/80 backdrop-blur-md border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-performance rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-secondary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Olá, Dr. {userName}!</h1>
                <p className="text-sm text-muted-foreground">Dashboard Profissional</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-secondary border-secondary">
                Plano Pro
              </Badge>
              <Button variant="ghost" size="icon">
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
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 hover:shadow-performance transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Atletas</p>
                <p className="text-2xl font-bold">{totalAthletes}</p>
                <p className="text-xs text-secondary">+3 este mês</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-performance transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Atletas Ativos</p>
                <p className="text-2xl font-bold">{activeAthletes}</p>
                <p className="text-xs text-green-500">75% de engajamento</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-performance transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Alertas</p>
                <p className="text-2xl font-bold">{totalAlerts}</p>
                <p className="text-xs text-orange-500">Requer atenção</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-performance transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Performance Média</p>
                <p className="text-2xl font-bold">{avgPerformance}%</p>
                <p className="text-xs text-primary">+5% vs mês anterior</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Athletes List */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-secondary" />
                    Meus Atletas
                  </CardTitle>
                  <CardDescription>
                    Gerencie e acompanhe seus atletas
                  </CardDescription>
                </div>
                <Button variant="performance" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Atleta
                </Button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar atletas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredAthletes.map((athlete) => (
                  <div
                    key={athlete.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarImage src={athlete.avatar} />
                        <AvatarFallback>
                          {athlete.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{athlete.name}</h4>
                          {athlete.alerts > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {athlete.alerts} alerta{athlete.alerts > 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{athlete.sport}</span>
                          <span>{athlete.level}</span>
                          <Badge variant={athlete.status === "Ativo" ? "default" : "secondary"} className="text-xs">
                            {athlete.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Próxima sessão: {athlete.nextSession}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary">
                        {athlete.performance}%
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Atualizado há {athlete.lastUpdate}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <Button variant="outline" size="sm">
                          <FileText className="w-3 h-3" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <MessageSquare className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Performance Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-accent" />
                Comparativo de Performance
              </CardTitle>
              <CardDescription>
                Performance atual dos atletas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={performanceComparison} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis type="number" />
                  <YAxis dataKey="athlete" type="category" width={60} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="performance" fill="hsl(var(--secondary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Overview */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Visão Geral - Últimos 6 Meses
            </CardTitle>
            <CardDescription>
              Evolução do seu trabalho e dos atletas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="athletes" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="athletes">Crescimento de Atletas</TabsTrigger>
                <TabsTrigger value="sessions">Sessões Realizadas</TabsTrigger>
                <TabsTrigger value="performance">Performance Geral</TabsTrigger>
              </TabsList>
              
              <TabsContent value="athletes" className="mt-6">
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={overviewData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="month" />
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
                      dataKey="athletes" 
                      stroke="hsl(var(--secondary))" 
                      fill="hsl(var(--secondary))" 
                      fillOpacity={0.2}
                      strokeWidth={3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </TabsContent>
              
              <TabsContent value="sessions" className="mt-6">
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={overviewData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="month" />
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
                      dataKey="sessions" 
                      stroke="hsl(var(--accent))" 
                      fill="hsl(var(--accent))" 
                      fillOpacity={0.2}
                      strokeWidth={3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </TabsContent>
              
              <TabsContent value="performance" className="mt-6">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={overviewData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[70, 95]} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="performance" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-8">
          <Button variant="outline" className="h-16 flex flex-col gap-1">
            <Plus className="w-5 h-5" />
            <span className="text-xs">Novo Atleta</span>
          </Button>
          <Button variant="outline" className="h-16 flex flex-col gap-1">
            <FileText className="w-5 h-5" />
            <span className="text-xs">Criar Relatório</span>
          </Button>
          <Button variant="outline" className="h-16 flex flex-col gap-1">
            <Calendar className="w-5 h-5" />
            <span className="text-xs">Agendar Sessão</span>
          </Button>
          <Button variant="outline" className="h-16 flex flex-col gap-1">
            <MessageSquare className="w-5 h-5" />
            <span className="text-xs">Mensagens</span>
          </Button>
          <Button variant="outline" className="h-16 flex flex-col gap-1">
            <TrendingUp className="w-5 h-5" />
            <span className="text-xs">Análises</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalDashboard;