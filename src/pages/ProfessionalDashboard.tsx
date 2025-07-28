import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
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
  Target,
  FileText,
  MessageSquare,
  Check,
  X,
  Bell,
  MoreVertical,
  UserMinus,
  Eye,
  Edit
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import CommunicationCenter from "@/components/CommunicationCenter";
import SessionScheduler from "@/components/SessionScheduler";
import ProfileSettings from "@/components/ProfileSettings";
import AthleteEnvironmentView from "@/components/AthleteEnvironmentView";

interface AthleteData {
  id: string;
  athlete_id: string;
  specialty: string;
  status: string;
  accepted_at: string;
  athlete: {
    user_id: string;
    full_name: string;
    email?: string;
  };
}

interface AthleteEnvironmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  athleteId: string;
  athleteName: string;
}

const AthleteEnvironmentModal = ({ isOpen, onClose, athleteId, athleteName }: AthleteEnvironmentModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Ambiente do Atleta - {athleteName}</DialogTitle>
        </DialogHeader>
        <AthleteEnvironmentView athleteId={athleteId} athleteName={athleteName} />
      </DialogContent>
    </Dialog>
  );
};

interface PendingInvitation {
  id: string;
  athlete_id: string;
  specialty: string;
  status: string;
  invited_at: string;
  athlete: {
    full_name: string;
    user_id: string;
  };
}

interface SearchedAthlete {
  user_id: string;
  full_name: string;
}

const ProfessionalDashboard = () => {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [myAthletes, setMyAthletes] = useState<AthleteData[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("athletes");
  const [selectedAthlete, setSelectedAthlete] = useState<AthleteData | null>(null);
  const [showAthleteDetailsDialog, setShowAthleteDetailsDialog] = useState(false);
  
  // States for athlete invitation
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchedAthlete[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedAthlete2, setSelectedAthlete2] = useState<SearchedAthlete | null>(null);
  const [inviteSpecialty, setInviteSpecialty] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  
  // Profile settings state
  const [showProfileSettings, setShowProfileSettings] = useState(false);

  // Athlete environment modal state
  const [showAthleteEnvironment, setShowAthleteEnvironment] = useState(false);
  const [selectedAthleteForEnvironment, setSelectedAthleteForEnvironment] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    if (user) {
      fetchPendingInvitations();
      fetchMyAthletes();
    }
  }, [user]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchAthletes(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const fetchPendingInvitations = async () => {
    try {
      const { data, error } = await supabase
        .from('athlete_professional_relationships')
        .select(`
          id,
          athlete_id,
          specialty,
          status,
          invited_at,
          athlete:profiles!athlete_professional_relationships_athlete_id_fkey(full_name, user_id)
        `)
        .eq('professional_id', user?.id)
        .eq('status', 'pending')
        .order('invited_at', { ascending: false });

      if (error) throw error;
      setPendingInvitations(data || []);
    } catch (error) {
      console.error('Error fetching pending invitations:', error);
    }
  };

  const fetchMyAthletes = async () => {
    try {
      const { data, error } = await supabase
        .from('athlete_professional_relationships')
        .select(`
          id,
          athlete_id,
          specialty,
          status,
          accepted_at,
          athlete:profiles!athlete_professional_relationships_athlete_id_fkey(full_name, user_id)
        `)
        .eq('professional_id', user?.id)
        .eq('status', 'accepted')
        .eq('is_active', true)
        .order('accepted_at', { ascending: false });

      if (error) throw error;
      setMyAthletes(data || []);
    } catch (error) {
      console.error('Error fetching my athletes:', error);
    }
  };

  const handleInvitationResponse = async (invitationId: string, action: 'accept' | 'reject') => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('athlete_professional_relationships')
        .update({
          status: action === 'accept' ? 'accepted' : 'rejected',
          accepted_at: action === 'accept' ? new Date().toISOString() : null
        })
        .eq('id', invitationId);

      if (error) throw error;

      toast({
        title: action === 'accept' ? "Convite aceito!" : "Convite rejeitado",
        description: action === 'accept' ? 
          "Você agora faz parte da equipe do atleta." : 
          "O convite foi rejeitado.",
      });

      fetchPendingInvitations();
      fetchMyAthletes();
    } catch (error) {
      console.error('Error responding to invitation:', error);
      toast({
        title: "Erro",
        description: "Não foi possível processar a resposta.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const removeAthleteRelationship = async (relationshipId: string, athleteName: string) => {
    try {
      setLoading(true);
      
      // Get the relationship details first to get athlete_id
      const { data: relationship, error: fetchError } = await supabase
        .from('athlete_professional_relationships')
        .select('athlete_id, specialty')
        .eq('id', relationshipId)
        .single();

      if (fetchError) throw fetchError;

      // Update relationship to inactive
      const { error: updateError } = await supabase
        .from('athlete_professional_relationships')
        .update({ is_active: false })
        .eq('id', relationshipId);

      if (updateError) throw updateError;

      // Create notification for the athlete
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: relationship.athlete_id,
          title: 'Vínculo Profissional Inativado',
          message: `Seu vínculo com o profissional ${profile?.full_name || 'profissional'} (${getSpecialtyText(relationship.specialty)}) foi inativado.`,
          type: 'warning'
        });

      if (notificationError) {
        console.error('Error creating notification:', notificationError);
        // Don't throw here - the main action succeeded
      }

      toast({
        title: "Atleta marcado como inativo",
        description: `${athleteName} foi marcado como inativo na sua equipe.`
      });

      fetchMyAthletes();
    } catch (error) {
      console.error('Error deactivating athlete relationship:', error);
      toast({
        title: "Erro",
        description: "Não foi possível marcar o atleta como inativo.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const viewAthleteDetails = (athlete: AthleteData) => {
    setSelectedAthlete(athlete);
    setShowAthleteDetailsDialog(true);
  };

  const getSpecialtyText = (specialty: string) => {
    const specialties = {
      'nutrition': 'Nutricionista',
      'physiotherapy': 'Fisioterapeuta',
      'medical': 'Médico',
      'training': 'Treinador',
      'psychology': 'Psicólogo'
    };
    return specialties[specialty as keyof typeof specialties] || specialty;
  };

  const handleChatWithAthlete = (athleteId: string) => {
    setActiveTab("communication");
    // The CommunicationCenter will handle opening the conversation
  };

  const handleLogout = async () => {
    await signOut();
    // Force a hard navigation to clear any cached state
    window.location.href = "/";
  };

  // Search and invite athletes functions
  const searchAthletes = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .eq('user_type', 'athlete')
        .ilike('full_name', `%${query}%`)
        .limit(10);

      if (error) throw error;
      
      // Filter out athletes already in relationships
      const existingAthleteIds = myAthletes.map(r => r.athlete_id);
      const filteredResults = (data || []).filter(
        athlete => !existingAthleteIds.includes(athlete.user_id)
      );
      
      setSearchResults(filteredResults);
    } catch (error) {
      console.error('Error searching athletes:', error);
      toast({
        title: "Erro na busca",
        description: "Não foi possível buscar atletas.",
        variant: "destructive"
      });
    } finally {
      setSearchLoading(false);
    }
  };

  const sendInvitation = async () => {
    if (!selectedAthlete2 || !inviteSpecialty) {
      toast({
        title: "Erro",
        description: "Selecione um atleta e uma especialidade.",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      // Check if relationship already exists
      const { data: existingRelationship } = await supabase
        .from('athlete_professional_relationships')
        .select('id')
        .eq('athlete_id', selectedAthlete2.user_id)
        .eq('professional_id', user?.id)
        .maybeSingle();

      if (existingRelationship) {
        toast({
          title: "Relacionamento já existe",
          description: "Você já possui um relacionamento com este atleta.",
          variant: "destructive"
        });
        return;
      }

      // Create direct relationship
      const { error: relationshipError } = await supabase
        .from('athlete_professional_relationships')
        .insert([{
          athlete_id: selectedAthlete2.user_id,
          professional_id: user?.id,
          specialty: inviteSpecialty,
          status: 'pending'
        }]);

      if (relationshipError) throw relationshipError;

      toast({
        title: "Convite enviado!",
        description: "Notificação enviada ao atleta para aceitar o convite."
      });

      // Reset form
      setSearchQuery('');
      setSearchResults([]);
      setSelectedAthlete2(null);
      setInviteSpecialty('');
      setInviteMessage('');
      setShowInviteDialog(false);

      // Refresh data
      fetchMyAthletes();

    } catch (error) {
      console.error('Error sending invitation:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar o convite.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const openAthleteEnvironment = (athleteId: string, athleteName: string) => {
    setSelectedAthleteForEnvironment({ id: athleteId, name: athleteName });
    setShowAthleteEnvironment(true);
  };

  const specialties = [
    { value: 'nutrition', label: 'Nutricionista' },
    { value: 'physiotherapy', label: 'Fisioterapeuta' },
    { value: 'medical', label: 'Médico' },
    { value: 'training', label: 'Treinador' },
    { value: 'psychology', label: 'Psicólogo' }
  ];

  const filteredAthletes = myAthletes.filter(relationship =>
    (relationship.athlete as any)?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getSpecialtyText(relationship.specialty).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalAthletes = myAthletes.length;
  const activeAthletes = myAthletes.length; // All accepted relationships are considered active
  const totalAlerts = 0; // Can be calculated based on real data later
  const avgPerformance = 85; // Can be calculated based on real data later

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
                {profile?.full_name && <h1 className="text-xl font-bold">Olá, Dr. {profile.full_name}!</h1>}
                <p className="text-sm text-muted-foreground">Dashboard Profissional</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {pendingInvitations.length > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <Bell className="w-3 h-3" />
                  {pendingInvitations.length} convite{pendingInvitations.length > 1 ? 's' : ''}
                </Badge>
              )}
              <Badge variant="outline" className="text-secondary border-secondary">
                Plano Pro
              </Badge>
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
        {/* Pending Invitations Alert */}
        {pendingInvitations.length > 0 && (
          <Card className="mb-8 border-orange-200 bg-orange-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-700">
                <Bell className="w-5 h-5" />
                Convites Pendentes ({pendingInvitations.length})
              </CardTitle>
              <CardDescription className="text-orange-600">
                Você tem convites de atletas aguardando sua resposta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingInvitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="flex items-center justify-between p-4 bg-background border border-orange-200 rounded-lg"
                  >
                    <div>
                      <h4 className="font-semibold">
                        {(invitation.athlete as any)?.full_name || 'Atleta'}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Convite para: {getSpecialtyText(invitation.specialty)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Enviado em {new Date(invitation.invited_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleInvitationResponse(invitation.id, 'accept')}
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Aceitar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleInvitationResponse(invitation.id, 'reject')}
                        disabled={loading}
                        className="border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Rejeitar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="athletes" className="gap-2">
              <Users className="w-4 h-4" />
              Meus Atletas
            </TabsTrigger>
            <TabsTrigger value="sessions" className="gap-2">
              <Calendar className="w-4 h-4" />
              Agenda
            </TabsTrigger>
            <TabsTrigger value="communication" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              Comunicação
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              Análises
            </TabsTrigger>
          </TabsList>

          <TabsContent value="athletes">
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
                    <Button variant="performance" size="sm" onClick={() => setShowInviteDialog(true)}>
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
                    {filteredAthletes.length > 0 ? (
                      filteredAthletes.map((relationship) => {
                        const athlete = relationship.athlete as any;
                        return (
                          <div
                            key={relationship.id}
                            className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                            onClick={() => openAthleteEnvironment(athlete?.user_id, athlete?.full_name || 'Atleta')}
                          >
                            <div className="flex items-center gap-4">
                              <Avatar>
                                <AvatarFallback>
                                  {athlete?.full_name?.split(' ').map((n: string) => n[0]).join('') || 'A'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold">{athlete?.full_name || 'Atleta'}</h4>
                                  <Badge variant="default" className="text-xs">
                                    {getSpecialtyText(relationship.specialty)}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <span>Status: Ativo</span>
                                  <span>Vinculado em {new Date(relationship.accepted_at).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => viewAthleteDetails(relationship)}>
                                    <Eye className="w-4 h-4 mr-2" />
                                    Ver Detalhes
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleChatWithAthlete(athlete?.user_id)}>
                                    <MessageSquare className="w-4 h-4 mr-2" />
                                    Conversar
                                  </DropdownMenuItem>
                                  <Separator />
                                  <DropdownMenuItem 
                                    onClick={() => removeAthleteRelationship(relationship.id, athlete?.full_name || 'Atleta')}
                                    className="text-red-600"
                                  >
                                     <UserMinus className="w-4 h-4 mr-2" />
                                     Inativar Atleta
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Nenhum atleta vinculado ainda</p>
                        <p className="text-sm">Aguarde convites de atletas ou promova seus serviços</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Athletes Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-accent" />
                    Resumo dos Atletas
                  </CardTitle>
                  <CardDescription>
                    Lista dos atletas vinculados
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {myAthletes.length > 0 ? (
                    <div className="space-y-4">
                      {myAthletes.slice(0, 5).map((relationship) => {
                        const athlete = relationship.athlete as any;
                        return (
                          <div key={relationship.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>
                                  {athlete?.full_name?.charAt(0) || 'A'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm">{athlete?.full_name || 'Atleta'}</p>
                                <p className="text-xs text-muted-foreground">{getSpecialtyText(relationship.specialty)}</p>
                              </div>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              Ativo
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhum atleta para análise</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="sessions">
            <SessionScheduler userType="professional" />
          </TabsContent>

          <TabsContent value="communication">
            <CommunicationCenter />
          </TabsContent>

          <TabsContent value="analytics">
            <div className="text-center py-8">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">Análises avançadas em desenvolvimento</p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Athlete Details Dialog */}
        <Dialog open={showAthleteDetailsDialog} onOpenChange={setShowAthleteDetailsDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalhes do Atleta</DialogTitle>
            </DialogHeader>
            {selectedAthlete && (
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="text-lg">
                      {(selectedAthlete.athlete as any)?.full_name?.split(' ').map((n: string) => n[0]).join('') || 'A'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-semibold">
                      {(selectedAthlete.athlete as any)?.full_name || 'Atleta'}
                    </h3>
                    <Badge variant="default" className="mt-1">
                      {getSpecialtyText(selectedAthlete.specialty)}
                    </Badge>
                  </div>
                </div>

                <Separator />

                {/* Relationship Info */}
                <div className="grid grid-cols-2 gap-4">
                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Vinculado em</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(selectedAthlete.accepted_at).toLocaleDateString('pt-BR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Status</span>
                    </div>
                    <Badge variant="default" className="text-xs">
                      Ativo
                    </Badge>
                  </Card>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      setShowAthleteDetailsDialog(false);
                      handleChatWithAthlete((selectedAthlete.athlete as any)?.user_id);
                    }}
                    className="flex-1"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Iniciar Conversa
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAthleteDetailsDialog(false);
                      removeAthleteRelationship(
                        selectedAthlete.id, 
                        (selectedAthlete.athlete as any)?.full_name || 'Atleta'
                      );
                    }}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                     <UserMinus className="w-4 h-4 mr-2" />
                     Inativar Atleta
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Quick Actions */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-6">Ações Rápidas</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="h-24 flex flex-col gap-3 hover-scale animate-fade-in transition-all duration-200 hover:shadow-lg group"
            >
              <FileText className="w-8 h-8 text-primary group-hover:text-black transition-colors" />
              <span className="text-sm font-medium">Criar Relatório</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-24 flex flex-col gap-3 hover-scale animate-fade-in transition-all duration-200 hover:shadow-lg group"
              onClick={() => setActiveTab("sessions")}
              style={{ animationDelay: "0.1s" }}
            >
              <Calendar className="w-8 h-8 text-primary group-hover:text-black transition-colors" />
              <span className="text-sm font-medium">Agendar Sessão</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-24 flex flex-col gap-3 hover-scale animate-fade-in transition-all duration-200 hover:shadow-lg group"
              onClick={() => setActiveTab("communication")}
              style={{ animationDelay: "0.2s" }}
            >
              <MessageSquare className="w-8 h-8 text-primary group-hover:text-black transition-colors" />
              <span className="text-sm font-medium">Mensagens</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-24 flex flex-col gap-3 hover-scale animate-fade-in transition-all duration-200 hover:shadow-lg group"
              onClick={() => setActiveTab("analytics")}
              style={{ animationDelay: "0.3s" }}
            >
              <TrendingUp className="w-8 h-8 text-primary group-hover:text-black transition-colors" />
              <span className="text-sm font-medium">Análises</span>
            </Button>
          </div>
        </div>

        {/* Invite Athlete Dialog */}
        <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Convidar Atleta</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Athlete Search */}
              <div className="space-y-2">
                <Label>Buscar Atleta</Label>
                <Input
                  placeholder="Digite o nome do atleta..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                
                {/* Search Results */}
                {searchQuery && !selectedAthlete2 && (
                  <div className="max-h-40 overflow-y-auto border rounded-md bg-background">
                    {searchLoading ? (
                      <div className="p-3 text-center text-muted-foreground">
                        Buscando...
                      </div>
                    ) : searchResults.length > 0 ? (
                      searchResults.map((athlete) => (
                        <button
                          key={athlete.user_id}
                          onClick={() => {
                            setSelectedAthlete2(athlete);
                            setSearchQuery(athlete.full_name);
                            setSearchResults([]);
                          }}
                          className="w-full text-left p-3 hover:bg-muted border-b last:border-b-0"
                        >
                          <div className="font-medium">{athlete.full_name}</div>
                          <div className="text-sm text-muted-foreground">Atleta</div>
                        </button>
                      ))
                    ) : (
                      <div className="p-3 text-center text-muted-foreground">
                        Nenhum atleta encontrado
                      </div>
                    )}
                  </div>
                )}
                
                {/* Selected Athlete */}
                {selectedAthlete2 && (
                  <div className="p-3 bg-primary/5 border border-primary/20 rounded-md">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{selectedAthlete2.full_name}</div>
                        <div className="text-sm text-muted-foreground">Atleta selecionado</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedAthlete2(null);
                          setSearchQuery('');
                        }}
                      >
                        ✕
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Specialty Selection */}
              <div className="space-y-2">
                <Label>Especialidade</Label>
                <Select value={inviteSpecialty} onValueChange={setInviteSpecialty}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a especialidade" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border z-50">
                    {specialties.map((specialty) => (
                      <SelectItem key={specialty.value} value={specialty.value}>
                        {specialty.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Optional Message */}
              <div className="space-y-2">
                <Label htmlFor="message">Mensagem (opcional)</Label>
                <Textarea
                  id="message"
                  placeholder="Olá! Gostaria de convidá-lo para fazer parte da sua equipe..."
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={sendInvitation}
                  disabled={loading || !selectedAthlete2 || !inviteSpecialty}
                  className="flex-1"
                >
                  {loading ? 'Enviando...' : 'Enviar Convite'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowInviteDialog(false);
                    setSearchQuery('');
                    setSearchResults([]);
                    setSelectedAthlete2(null);
                    setInviteSpecialty('');
                    setInviteMessage('');
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Profile Settings Dialog */}
        <ProfileSettings 
          open={showProfileSettings} 
          onOpenChange={setShowProfileSettings} 
        />

        {/* Athlete Environment Modal */}
        {selectedAthleteForEnvironment && (
          <AthleteEnvironmentModal
            isOpen={showAthleteEnvironment}
            onClose={() => {
              setShowAthleteEnvironment(false);
              setSelectedAthleteForEnvironment(null);
            }}
            athleteId={selectedAthleteForEnvironment.id}
            athleteName={selectedAthleteForEnvironment.name}
          />
        )}
      </div>
    </div>
  );
};

export default ProfessionalDashboard;