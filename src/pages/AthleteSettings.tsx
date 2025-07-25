import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Settings, 
  UserPlus, 
  Users, 
  Mail, 
  CheckCircle, 
  XCircle, 
  Clock,
  ArrowLeft,
  Trash2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface Professional {
  full_name: string;
  user_id: string;
}

interface Relationship {
  id: string;
  professional_id: string;
  specialty: string;
  status: string;
  invited_at: string;
  accepted_at?: string;
  professional: Professional;
}

interface Invitation {
  id: string;
  email: string;
  specialty: string;
  status: string;
  message?: string;
  expires_at: string;
  created_at: string;
}

const AthleteSettings = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteSpecialty, setInviteSpecialty] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [showInviteDialog, setShowInviteDialog] = useState(false);

  const specialties = [
    { value: 'nutrition', label: 'Nutricionista' },
    { value: 'physiotherapy', label: 'Fisioterapeuta' },
    { value: 'medical', label: 'Médico' },
    { value: 'training', label: 'Treinador' },
    { value: 'psychology', label: 'Psicólogo' }
  ];

  useEffect(() => {
    if (user) {
      fetchRelationships();
      fetchInvitations();
    }
  }, [user]);

  const fetchRelationships = async () => {
    try {
      const { data, error } = await supabase
        .from('athlete_professional_relationships')
        .select(`
          id,
          professional_id,
          specialty,
          status,
          invited_at,
          accepted_at,
          professional:profiles!athlete_professional_relationships_professional_id_fkey(full_name, user_id)
        `)
        .eq('athlete_id', user?.id);

      if (error) throw error;
      setRelationships(data || []);
    } catch (error) {
      console.error('Error fetching relationships:', error);
    }
  };

  const fetchInvitations = async () => {
    try {
      const { data, error } = await supabase
        .from('professional_invitations')
        .select('*')
        .eq('athlete_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvitations(data || []);
    } catch (error) {
      console.error('Error fetching invitations:', error);
    }
  };

  const sendInvitation = async () => {
    if (!inviteEmail || !inviteSpecialty) {
      toast({
        title: "Erro",
        description: "Email e especialidade são obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      // Check if professional exists
      const { data: existingProfessional } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .ilike('full_name', `%${inviteEmail}%`)
        .eq('user_type', 'professional')
        .maybeSingle();

      if (existingProfessional) {
        // Create direct relationship
        const { error: relationshipError } = await supabase
          .from('athlete_professional_relationships')
          .insert([{
            athlete_id: user?.id,
            professional_id: existingProfessional.user_id,
            specialty: inviteSpecialty,
            status: 'pending'
          }]);

        if (relationshipError) throw relationshipError;
      } else {
        // Create email invitation
        const { error: invitationError } = await supabase
          .from('professional_invitations')
          .insert([{
            athlete_id: user?.id,
            email: inviteEmail,
            specialty: inviteSpecialty,
            message: inviteMessage || null
          }]);

        if (invitationError) throw invitationError;
      }

      toast({
        title: "Convite enviado!",
        description: existingProfessional ? 
          "Notificação enviada ao profissional." : 
          "Email de convite será enviado."
      });

      // Reset form
      setInviteEmail('');
      setInviteSpecialty('');
      setInviteMessage('');
      setShowInviteDialog(false);

      // Refresh data
      fetchRelationships();
      fetchInvitations();

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

  const removeRelationship = async (relationshipId: string) => {
    try {
      const { error } = await supabase
        .from('athlete_professional_relationships')
        .delete()
        .eq('id', relationshipId);

      if (error) throw error;

      toast({
        title: "Relacionamento removido",
        description: "O profissional foi removido da sua equipe."
      });

      fetchRelationships();
    } catch (error) {
      console.error('Error removing relationship:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o relacionamento.",
        variant: "destructive"
      });
    }
  };

  const cancelInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('professional_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) throw error;

      toast({
        title: "Convite cancelado",
        description: "O convite foi cancelado com sucesso."
      });

      fetchInvitations();
    } catch (error) {
      console.error('Error canceling invitation:', error);
      toast({
        title: "Erro",
        description: "Não foi possível cancelar o convite.",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-green-500/10 text-green-700 border-green-200';
      case 'pending': return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
      case 'rejected': return 'bg-red-500/10 text-red-700 border-red-200';
      default: return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'accepted': return 'Aceito';
      case 'pending': return 'Pendente';
      case 'rejected': return 'Rejeitado';
      default: return status;
    }
  };

  const getSpecialtyText = (specialty: string) => {
    return specialties.find(s => s.value === specialty)?.label || specialty;
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="bg-background/80 backdrop-blur-md border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate('/athlete-dashboard')}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-hero rounded-lg flex items-center justify-center">
                  <Settings className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Configurações</h1>
                  <p className="text-sm text-muted-foreground">Gerencie sua equipe de profissionais</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <Tabs defaultValue="professionals" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="professionals" className="gap-2">
              <Users className="w-4 h-4" />
              Minha Equipe
            </TabsTrigger>
            <TabsTrigger value="invitations" className="gap-2">
              <Mail className="w-4 h-4" />
              Convites Enviados
            </TabsTrigger>
          </TabsList>

          {/* Professionals Tab */}
          <TabsContent value="professionals" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Minha Equipe de Profissionais</h2>
                <p className="text-muted-foreground">
                  Profissionais responsáveis pelas diferentes áreas da sua saúde
                </p>
              </div>
              
              <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <UserPlus className="w-4 h-4" />
                    Convidar Profissional
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Convidar Profissional</DialogTitle>
                    <DialogDescription>
                      Convide um profissional para fazer parte da sua equipe
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email do Profissional</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="profissional@exemplo.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                      />
                    </div>

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

                    <div className="space-y-2">
                      <Label htmlFor="message">Mensagem (opcional)</Label>
                      <Textarea
                        id="message"
                        placeholder="Olá! Gostaria de convidá-lo para fazer parte da minha equipe..."
                        value={inviteMessage}
                        onChange={(e) => setInviteMessage(e.target.value)}
                        rows={3}
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={sendInvitation}
                        disabled={loading}
                        className="flex-1"
                      >
                        {loading ? 'Enviando...' : 'Enviar Convite'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowInviteDialog(false)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {relationships.length === 0 ? (
                <Card className="p-8 text-center">
                  <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum profissional na equipe</h3>
                  <p className="text-muted-foreground mb-4">
                    Convide profissionais para acompanhar seu desenvolvimento
                  </p>
                  <Button onClick={() => setShowInviteDialog(true)} className="gap-2">
                    <UserPlus className="w-4 h-4" />
                    Convidar Primeiro Profissional
                  </Button>
                </Card>
              ) : (
                relationships.map((relationship) => (
                  <Card key={relationship.id}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-lg">
                              {(relationship.professional as any)?.full_name || 'Profissional'}
                            </h3>
                            <Badge className={getStatusColor(relationship.status)}>
                              {getStatusText(relationship.status)}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground">
                            {getSpecialtyText(relationship.specialty)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Convidado em {new Date(relationship.invited_at).toLocaleDateString()}
                            {relationship.accepted_at && (
                              <span> • Aceito em {new Date(relationship.accepted_at).toLocaleDateString()}</span>
                            )}
                          </p>
                        </div>
                        
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => removeRelationship(relationship.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Invitations Tab */}
          <TabsContent value="invitations" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Convites Enviados</h2>
              <p className="text-muted-foreground">
                Acompanhe o status dos convites enviados por email
              </p>
            </div>

            <div className="grid gap-4">
              {invitations.length === 0 ? (
                <Card className="p-8 text-center">
                  <Mail className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum convite enviado</h3>
                  <p className="text-muted-foreground">
                    Convites por email aparecerão aqui
                  </p>
                </Card>
              ) : (
                invitations.map((invitation) => (
                  <Card key={invitation.id}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold">{invitation.email}</h3>
                            <Badge className={getStatusColor(invitation.status)}>
                              {getStatusText(invitation.status)}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground">
                            {getSpecialtyText(invitation.specialty)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Enviado em {new Date(invitation.created_at).toLocaleDateString()}
                            {' • '}
                            Expira em {new Date(invitation.expires_at).toLocaleDateString()}
                          </p>
                          {invitation.message && (
                            <p className="text-sm bg-muted p-2 rounded">
                              "{invitation.message}"
                            </p>
                          )}
                        </div>
                        
                        {invitation.status === 'pending' && (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => cancelInvitation(invitation.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AthleteSettings;