import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Shield,
  Bell,
  Eye,
  Save,
  Camera,
  Trash2,
  Activity,
  Target,
  Trophy,
  Heart
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AthleteProfileSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface AthleteProfileData {
  full_name: string;
  email: string;
  phone?: string;
  location?: string;
  bio?: string;
  sport?: string;
  position?: string;
  height?: number;
  weight?: number;
  birth_date?: string;
  experience_level?: string;
  coach?: string;
  goals?: string;
  medical_conditions?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
}

interface AthleteNotificationSettings {
  session_reminders: boolean;
  data_entry_reminders: boolean;
  professional_messages: boolean;
  goal_updates: boolean;
  weekly_reports: boolean;
  marketing_emails: boolean;
}

const AthleteProfileSettings = ({ open, onOpenChange }: AthleteProfileSettingsProps) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  
  // Profile data state
  const [profileData, setProfileData] = useState<AthleteProfileData>({
    full_name: profile?.full_name || "",
    email: user?.email || "",
    phone: "",
    location: "",
    bio: "",
    sport: "",
    position: "",
    height: 0,
    weight: 0,
    birth_date: "",
    experience_level: "",
    coach: "",
    goals: "",
    medical_conditions: "",
    emergency_contact_name: "",
    emergency_contact_phone: ""
  });

  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState<AthleteNotificationSettings>({
    session_reminders: true,
    data_entry_reminders: true,
    professional_messages: true,
    goal_updates: true,
    weekly_reports: false,
    marketing_emails: false
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  useEffect(() => {
    if (profile && user) {
      setProfileData(prev => ({
        ...prev,
        full_name: profile.full_name || "",
        email: user.email || ""
      }));
    }
  }, [profile, user]);

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profileData.full_name,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Perfil atualizado!",
        description: "Suas informações foram salvas com sucesso.",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o perfil.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      toast({
        title: "Senha alterada!",
        description: "Sua senha foi atualizada com sucesso.",
      });

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        title: "Erro",
        description: "Não foi possível alterar a senha.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const sports = [
    { value: 'futebol', label: 'Futebol' },
    { value: 'basquete', label: 'Basquete' },
    { value: 'volei', label: 'Vôlei' },
    { value: 'tenis', label: 'Tênis' },
    { value: 'natacao', label: 'Natação' },
    { value: 'corrida', label: 'Corrida' },
    { value: 'ciclismo', label: 'Ciclismo' },
    { value: 'musculacao', label: 'Musculação' },
    { value: 'crossfit', label: 'CrossFit' },
    { value: 'mma', label: 'MMA/Luta' },
    { value: 'outros', label: 'Outros' }
  ];

  const experienceLevels = [
    { value: 'iniciante', label: 'Iniciante (0-1 ano)' },
    { value: 'intermediario', label: 'Intermediário (1-3 anos)' },
    { value: 'avancado', label: 'Avançado (3-5 anos)' },
    { value: 'expert', label: 'Expert (5+ anos)' },
    { value: 'profissional', label: 'Profissional' }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Configurações do Perfil do Atleta
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Perfil</TabsTrigger>
            <TabsTrigger value="sports">Esporte</TabsTrigger>
            <TabsTrigger value="notifications">Notificações</TabsTrigger>
            <TabsTrigger value="security">Segurança</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Informações Pessoais
                </CardTitle>
                <CardDescription>
                  Atualize suas informações básicas do perfil
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar Section */}
                <div className="flex items-center gap-6">
                  <Avatar className="h-24 w-24">
                    <AvatarFallback className="text-2xl">
                      {profileData.full_name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm">
                      <Camera className="w-4 h-4 mr-2" />
                      Alterar Foto
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-600">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remover
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nome Completo</Label>
                    <Input
                      id="fullName"
                      value={profileData.full_name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, full_name: e.target.value }))}
                      placeholder="Seu nome completo"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      disabled
                      className="bg-muted"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={profileData.phone}
                      onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="(11) 99999-9999"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="birthDate">Data de Nascimento</Label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={profileData.birth_date}
                      onChange={(e) => setProfileData(prev => ({ ...prev, birth_date: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Localização</Label>
                    <Input
                      id="location"
                      value={profileData.location}
                      onChange={(e) => setProfileData(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="Cidade, Estado"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="coach">Treinador/Coach</Label>
                    <Input
                      id="coach"
                      value={profileData.coach}
                      onChange={(e) => setProfileData(prev => ({ ...prev, coach: e.target.value }))}
                      placeholder="Nome do seu treinador"
                    />
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Contato de Emergência</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="emergencyName">Nome</Label>
                      <Input
                        id="emergencyName"
                        value={profileData.emergency_contact_name}
                        onChange={(e) => setProfileData(prev => ({ ...prev, emergency_contact_name: e.target.value }))}
                        placeholder="Nome do contato"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="emergencyPhone">Telefone</Label>
                      <Input
                        id="emergencyPhone"
                        value={profileData.emergency_contact_phone}
                        onChange={(e) => setProfileData(prev => ({ ...prev, emergency_contact_phone: e.target.value }))}
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveProfile} disabled={loading}>
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? "Salvando..." : "Salvar Alterações"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Informações Esportivas
                </CardTitle>
                <CardDescription>
                  Configure informações sobre seu esporte e objetivos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sport">Esporte Principal</Label>
                    <Select 
                      value={profileData.sport} 
                      onValueChange={(value) => setProfileData(prev => ({ ...prev, sport: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione seu esporte" />
                      </SelectTrigger>
                      <SelectContent>
                        {sports.map((sport) => (
                          <SelectItem key={sport.value} value={sport.value}>
                            {sport.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="position">Posição/Especialidade</Label>
                    <Input
                      id="position"
                      value={profileData.position}
                      onChange={(e) => setProfileData(prev => ({ ...prev, position: e.target.value }))}
                      placeholder="Ex: Atacante, Velocista, etc."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="experience">Nível de Experiência</Label>
                    <Select 
                      value={profileData.experience_level} 
                      onValueChange={(value) => setProfileData(prev => ({ ...prev, experience_level: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione seu nível" />
                      </SelectTrigger>
                      <SelectContent>
                        {experienceLevels.map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="height">Altura (cm)</Label>
                    <Input
                      id="height"
                      type="number"
                      value={profileData.height || ''}
                      onChange={(e) => setProfileData(prev => ({ ...prev, height: parseInt(e.target.value) || 0 }))}
                      placeholder="180"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="weight">Peso (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      value={profileData.weight || ''}
                      onChange={(e) => setProfileData(prev => ({ ...prev, weight: parseInt(e.target.value) || 0 }))}
                      placeholder="75"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="goals">Objetivos e Metas</Label>
                  <Textarea
                    id="goals"
                    value={profileData.goals}
                    onChange={(e) => setProfileData(prev => ({ ...prev, goals: e.target.value }))}
                    placeholder="Descreva seus objetivos esportivos, metas para competições, etc."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="medical">Condições Médicas/Lesões</Label>
                  <Textarea
                    id="medical"
                    value={profileData.medical_conditions}
                    onChange={(e) => setProfileData(prev => ({ ...prev, medical_conditions: e.target.value }))}
                    placeholder="Histórico de lesões, alergias, condições médicas relevantes..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveProfile} disabled={loading}>
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? "Salvando..." : "Salvar Informações Esportivas"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Preferências de Notificação
                </CardTitle>
                <CardDescription>
                  Configure como você quer receber notificações
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Lembretes de Sessões</h4>
                      <p className="text-sm text-muted-foreground">
                        Receba lembretes antes de consultas agendadas
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.session_reminders}
                      onCheckedChange={(checked) => 
                        setNotificationSettings(prev => ({ ...prev, session_reminders: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Lembretes de Dados</h4>
                      <p className="text-sm text-muted-foreground">
                        Receba lembretes para registrar treinos e métricas
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.data_entry_reminders}
                      onCheckedChange={(checked) => 
                        setNotificationSettings(prev => ({ ...prev, data_entry_reminders: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Mensagens de Profissionais</h4>
                      <p className="text-sm text-muted-foreground">
                        Notificações de mensagens de treinadores e profissionais
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.professional_messages}
                      onCheckedChange={(checked) => 
                        setNotificationSettings(prev => ({ ...prev, professional_messages: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Atualizações de Metas</h4>
                      <p className="text-sm text-muted-foreground">
                        Notificações sobre progresso de metas e objetivos
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.goal_updates}
                      onCheckedChange={(checked) => 
                        setNotificationSettings(prev => ({ ...prev, goal_updates: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Relatórios Semanais</h4>
                      <p className="text-sm text-muted-foreground">
                        Receba resumos semanais de performance
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.weekly_reports}
                      onCheckedChange={(checked) => 
                        setNotificationSettings(prev => ({ ...prev, weekly_reports: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Emails de Marketing</h4>
                      <p className="text-sm text-muted-foreground">
                        Receba novidades e promoções por email
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.marketing_emails}
                      onCheckedChange={(checked) => 
                        setNotificationSettings(prev => ({ ...prev, marketing_emails: checked }))
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Segurança da Conta
                </CardTitle>
                <CardDescription>
                  Gerencie sua senha e configurações de segurança
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Account Info */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Email da conta</h4>
                      <p className="text-sm text-muted-foreground">{user?.email}</p>
                    </div>
                    <Badge variant="outline">Verificado</Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Tipo de usuário</h4>
                      <p className="text-sm text-muted-foreground">Atleta</p>
                    </div>
                    <Badge variant="secondary">Ativo</Badge>
                  </div>
                </div>

                <Separator />

                {/* Change Password */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Alterar Senha</h3>
                  
                  <div className="grid grid-cols-1 gap-4 max-w-md">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Senha Atual</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                        placeholder="Digite sua senha atual"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword">Nova Senha</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                        placeholder="Digite a nova senha"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        placeholder="Confirme a nova senha"
                      />
                    </div>

                    <Button 
                      onClick={handleChangePassword} 
                      disabled={loading || !passwordData.newPassword || !passwordData.confirmPassword}
                      className="w-fit"
                    >
                      {loading ? "Alterando..." : "Alterar Senha"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AthleteProfileSettings;