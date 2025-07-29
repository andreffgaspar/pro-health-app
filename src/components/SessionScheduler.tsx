import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { 
  CalendarDays, 
  Clock, 
  MapPin, 
  DollarSign, 
  Plus,
  Edit,
  Trash2,
  User,
  CheckCircle,
  XCircle
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Session {
  id: string;
  professional_id: string;
  athlete_id: string | null;
  title: string;
  description: string | null;
  session_date: string;
  start_time: string;
  end_time: string;
  session_type: string;
  status: string;
  location: string | null;
  notes: string | null;
  price: number | null;
  athlete?: {
    full_name: string;
  } | null;
  professional?: {
    full_name: string;
  } | null;
}

interface AthleteOption {
  id: string;
  full_name: string;
  user_id: string;
}

interface SessionSchedulerProps {
  userType: 'professional' | 'athlete';
}

const SessionScheduler = ({ userType }: SessionSchedulerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [athletes, setAthletes] = useState<AthleteOption[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    session_date: '',
    start_time: '',
    end_time: '',
    location: '',
    price: '',
    athlete_id: '',
    appointment_type: ''
  });
  const [loading, setLoading] = useState(false);
  const [sessionDates, setSessionDates] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    session_date: format(new Date(), 'yyyy-MM-dd'),
    start_time: '',
    end_time: '',
    location: '',
    price: '',
    athlete_id: '',
    appointment_type: ''
  });

  useEffect(() => {
    if (user) {
      fetchSessions();
      fetchSessionDates();
      if (userType === 'professional') {
        fetchAthletes();
      }
    }
  }, [user, selectedDate]);

  const fetchSessionDates = async () => {
    try {
      const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
      
      let query = supabase
        .from('sessions')
        .select('session_date')
        .gte('session_date', format(startOfMonth, 'yyyy-MM-dd'))
        .lte('session_date', format(endOfMonth, 'yyyy-MM-dd'));

      if (userType === 'professional') {
        query = query.eq('professional_id', user?.id);
      } else {
        query = query.or(`athlete_id.eq.${user?.id},session_type.eq.available`);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      const dates = new Set((data || []).map(item => item.session_date));
      setSessionDates(dates);
    } catch (error) {
      console.error('Error fetching session dates:', error);
    }
  };

  const fetchAthletes = async () => {
    try {
      const { data, error } = await supabase
        .from('athlete_professional_relationships')
        .select(`
          athlete_id,
          athlete:profiles!athlete_professional_relationships_athlete_id_fkey(full_name, user_id)
        `)
        .eq('professional_id', user?.id)
        .eq('status', 'accepted')
        .eq('is_active', true);

      if (error) throw error;

      const athleteOptions: AthleteOption[] = (data || []).map((item: any) => ({
        id: item.athlete_id,
        full_name: item.athlete.full_name,
        user_id: item.athlete.user_id
      }));

      setAthletes(athleteOptions);
    } catch (error) {
      console.error('Error fetching athletes:', error);
    }
  };

  const fetchSessions = async () => {
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
      let query = supabase
        .from('sessions')
        .select(`
          *,
          athlete:profiles!sessions_athlete_id_fkey(full_name),
          professional:profiles!sessions_professional_id_fkey(full_name)
        `)
        .eq('session_date', dateStr);

      if (userType === 'professional') {
        query = query.eq('professional_id', user?.id);
      } else {
        // For athletes, show available sessions and their own bookings
        query = query.or(`athlete_id.eq.${user?.id},session_type.eq.available`);
      }

      const { data, error } = await query.order('start_time');

      if (error) throw error;
      
      // Type-safe data handling
      const typedData: Session[] = (data || []).map((item: any) => ({
        ...item,
        athlete: item.athlete,
        professional: item.professional
      }));
      
      setSessions(typedData);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as sessões.",
        variant: "destructive"
      });
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (userType !== 'professional') return;

    try {
      setLoading(true);

      const sessionData = {
        professional_id: user?.id,
        title: formData.title,
        description: formData.description || null,
        session_date: formData.session_date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        location: formData.location || null,
        price: formData.price ? parseFloat(formData.price) : null,
        athlete_id: (formData.athlete_id && formData.athlete_id !== 'none') ? formData.athlete_id : null,
        session_type: (formData.athlete_id && formData.athlete_id !== 'none') ? 'booked' : 'available',
        status: (formData.athlete_id && formData.athlete_id !== 'none') ? 'confirmed' : 'available'
      };

      const { error } = await supabase
        .from('sessions')
        .insert(sessionData);

      if (error) throw error;

      // Se um atleta foi selecionado, criar notificação para ele
      if (formData.athlete_id && formData.athlete_id !== 'none') {
        await supabase
          .from('notifications')
          .insert({
            user_id: formData.athlete_id,
            title: 'Nova Sessão Agendada',
            message: `Uma nova sessão "${formData.title}" foi agendada para você em ${format(new Date(formData.session_date), 'dd/MM/yyyy', { locale: ptBR })} às ${formData.start_time}.`,
            type: 'success'
          });
      }

      toast({
        title: "Sessão criada!",
        description: formData.athlete_id 
          ? "Sessão agendada com sucesso e atleta notificado."
          : "Horário disponibilizado com sucesso."
      });

      setIsCreateDialogOpen(false);
      setFormData({
        title: '',
        description: '',
        session_date: format(new Date(), 'yyyy-MM-dd'),
        start_time: '',
        end_time: '',
        location: '',
        price: '',
        athlete_id: '',
        appointment_type: ''
      });
      fetchSessions();
    } catch (error) {
      console.error('Error creating session:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a sessão.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBookSession = async (sessionId: string) => {
    if (userType !== 'athlete') return;

    try {
      setLoading(true);

      const { error } = await supabase
        .from('sessions')
        .update({
          athlete_id: user?.id,
          status: 'pending',
          session_type: 'booked'
        })
        .eq('id', sessionId);

      if (error) throw error;

      // Create notification for professional
      const session = sessions.find(s => s.id === sessionId);
      if (session) {
        await supabase
          .from('notifications')
          .insert({
            user_id: session.professional_id,
            title: 'Nova Solicitação de Agendamento',
            message: `Um atleta solicitou agendamento para a sessão "${session.title}" em ${format(new Date(session.session_date), 'dd/MM/yyyy', { locale: ptBR })} às ${session.start_time}.`,
            type: 'info'
          });
      }

      toast({
        title: "Sessão agendada!",
        description: "Sua solicitação foi enviada ao profissional."
      });

      fetchSessions();
    } catch (error) {
      console.error('Error booking session:', error);
      toast({
        title: "Erro",
        description: "Não foi possível agendar a sessão.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSessionAction = async (sessionId: string, action: 'confirm' | 'cancel') => {
    if (userType !== 'professional') return;

    try {
      setLoading(true);

      const newStatus = action === 'confirm' ? 'confirmed' : 'cancelled';
      
      const { error } = await supabase
        .from('sessions')
        .update({ status: newStatus })
        .eq('id', sessionId);

      if (error) throw error;

      // Create notification for athlete
      const session = sessions.find(s => s.id === sessionId);
      if (session && session.athlete_id) {
        await supabase
          .from('notifications')
          .insert({
            user_id: session.athlete_id,
            title: action === 'confirm' ? 'Agendamento Confirmado' : 'Agendamento Cancelado',
            message: action === 'confirm' 
              ? `Sua sessão "${session.title}" foi confirmada para ${format(new Date(session.session_date), 'dd/MM/yyyy', { locale: ptBR })} às ${session.start_time}.`
              : `Sua sessão "${session.title}" foi cancelada.`,
            type: action === 'confirm' ? 'success' : 'warning'
          });
      }

      toast({
        title: action === 'confirm' ? "Sessão confirmada!" : "Sessão cancelada",
        description: action === 'confirm' 
          ? "O atleta foi notificado da confirmação." 
          : "O atleta foi notificado do cancelamento."
      });

      fetchSessions();
    } catch (error) {
      console.error('Error updating session:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a sessão.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    return `${hours}h${minutes}`;
  };

  const handleSessionClick = (session: Session) => {
    setSelectedSession(session);
    setEditFormData({
      title: session.title,
      description: session.description || '',
      session_date: session.session_date,
      start_time: session.start_time,
      end_time: session.end_time,
      location: session.location || '',
      price: session.price ? session.price.toString() : '',
      athlete_id: session.athlete_id || '',
      appointment_type: ''
    });
    setIsEditMode(false);
    setIsManageDialogOpen(true);
  };

  const handleUpdateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSession || userType !== 'professional') return;

    try {
      setLoading(true);

      const updateData = {
        title: editFormData.title,
        description: editFormData.description || null,
        session_date: editFormData.session_date,
        start_time: editFormData.start_time,
        end_time: editFormData.end_time,
        location: editFormData.location || null,
        price: editFormData.price ? parseFloat(editFormData.price) : null,
        athlete_id: (editFormData.athlete_id && editFormData.athlete_id !== 'none') ? editFormData.athlete_id : null,
      };

      const { error } = await supabase
        .from('sessions')
        .update(updateData)
        .eq('id', selectedSession.id);

      if (error) throw error;

      toast({
        title: "Sessão atualizada!",
        description: "As alterações foram salvas com sucesso."
      });

      setIsEditMode(false);
      setIsManageDialogOpen(false);
      fetchSessions();
    } catch (error) {
      console.error('Error updating session:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a sessão.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string, session_type: string) => {
    if (session_type === 'available' && status === 'available') {
      return <Badge variant="outline" className="text-green-600 border-green-600">Disponível</Badge>;
    }
    if (status === 'pending') {
      return <Badge variant="outline" className="text-orange-600 border-orange-600">Pendente</Badge>;
    }
    if (status === 'confirmed') {
      return <Badge variant="outline" className="text-blue-600 border-blue-600">Confirmado</Badge>;
    }
    if (status === 'cancelled') {
      return <Badge variant="outline" className="text-red-600 border-red-600">Cancelado</Badge>;
    }
    if (status === 'completed') {
      return <Badge variant="outline" className="text-purple-600 border-purple-600">Concluído</Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      {userType === 'professional' && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Gerenciar Agenda</h2>
            <p className="text-muted-foreground">
              Crie horários disponíveis e gerencie agendamentos
            </p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Criar Horário
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh]">
              <DialogHeader>
                <DialogTitle>Criar Novo Horário</DialogTitle>
              </DialogHeader>
              <ScrollArea className="max-h-[75vh] pr-4">
                <form onSubmit={handleCreateSession} className="space-y-4">
                  <div>
                    <Label htmlFor="appointment_type">Tipo de Agendamento</Label>
                    <Select 
                      value={formData.appointment_type} 
                      onValueChange={(value) => setFormData({ ...formData, appointment_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo de agendamento" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="consulta-medica">Consulta Médica</SelectItem>
                        <SelectItem value="consulta-nutricao">Consulta de Nutrição</SelectItem>
                        <SelectItem value="treinamento">Treinamento</SelectItem>
                        <SelectItem value="fisioterapia">Atendimento da Fisioterapia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="title">Título da Sessão</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Ex: Consulta Nutricional"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="athlete">Atleta (opcional)</Label>
                    <Select 
                      value={formData.athlete_id} 
                      onValueChange={(value) => setFormData({ ...formData, athlete_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um atleta ou deixe disponível" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Horário livre (disponível para qualquer atleta)</SelectItem>
                        {athletes.map((athlete) => (
                          <SelectItem key={athlete.id} value={athlete.id}>
                            {athlete.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Descrição (opcional)</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Detalhes sobre a sessão..."
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="session_date">Data</Label>
                    <Input
                      id="session_date"
                      type="date"
                      value={formData.session_date}
                      onChange={(e) => setFormData({ ...formData, session_date: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start_time">Início</Label>
                      <Input
                        id="start_time"
                        type="time"
                        value={formData.start_time}
                        onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="end_time">Fim</Label>
                      <Input
                        id="end_time"
                        type="time"
                        value={formData.end_time}
                        onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="location">Local (opcional)</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="Ex: Consultório, Online, etc."
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="price">Preço (opcional)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Criando...' : 'Criar Horário'}
                  </Button>
                </form>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Calendário</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                if (date) {
                  setSelectedDate(date);
                  fetchSessionDates();
                }
              }}
              locale={ptBR}
              className="w-full"
              components={{
                DayContent: ({ date }) => {
                  const dateStr = format(date, 'yyyy-MM-dd');
                  const hasSession = sessionDates.has(dateStr);
                  
                  return (
                    <div className="relative flex flex-col items-center justify-center w-full h-full">
                      <span>{date.getDate()}</span>
                      {hasSession && (
                        <div className="w-1.5 h-1.5 bg-primary rounded-full opacity-80 mt-0.5" />
                      )}
                    </div>
                  );
                }
              }}
              classNames={{
                months: "flex w-full flex-col space-y-4",
                month: "space-y-4 w-full",
                caption: "flex justify-center pt-1 relative items-center",
                caption_label: "text-sm font-medium",
                nav: "space-x-1 flex items-center",
                nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",
                table: "w-full border-collapse",
                head_row: "flex w-full",
                head_cell: "text-muted-foreground rounded-md w-full font-normal text-[0.8rem] flex-1 text-center",
                row: "flex w-full mt-2",
                cell: "h-9 w-full p-0 text-center text-sm relative flex-1 [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                day: "h-9 w-full p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground rounded-md",
                day_range_end: "day-range-end",
                day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                day_today: "bg-accent text-accent-foreground",
                day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                day_disabled: "text-muted-foreground opacity-50",
                day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                day_hidden: "invisible",
              }}
            />
          </CardContent>
        </Card>

        {/* Sessions List */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5" />
              Sessões - {format(selectedDate, 'dd/MM/yyyy', { locale: ptBR })}
            </CardTitle>
            <CardDescription>
              {sessions.length} sessão(ões) encontrada(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sessions.length > 0 ? (
              <div className="space-y-4">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => handleSessionClick(session)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold">{session.title}</h4>
                        {getStatusBadge(session.status, session.session_type)}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatTime(session.start_time)} - {formatTime(session.end_time)}
                        </div>
                        
                        {session.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {session.location}
                          </div>
                        )}
                        
                        {session.price && (
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            R$ {session.price.toFixed(2)}
                          </div>
                        )}
                        
                        {/* Show professional name for athletes, athlete name for professionals */}
                        {userType === 'athlete' && session.professional ? (
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {session.professional.full_name}
                          </div>
                        ) : userType === 'professional' && session.athlete_id && session.athlete ? (
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {session.athlete.full_name}
                          </div>
                        ) : null}
                      </div>
                      
                      {session.description && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {session.description}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      {userType === 'athlete' && session.session_type === 'available' && session.status === 'available' && (
                        <Button
                          size="sm"
                          onClick={() => handleBookSession(session.id)}
                          disabled={loading}
                        >
                          Agendar
                        </Button>
                      )}
                      
                      {userType === 'professional' && session.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSessionAction(session.id, 'confirm')}
                            disabled={loading}
                            className="text-green-600 border-green-600 hover:bg-green-50"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSessionAction(session.id, 'cancel')}
                            disabled={loading}
                            className="text-red-600 border-red-600 hover:bg-red-50"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma sessão encontrada para esta data</p>
                {userType === 'professional' && (
                  <p className="text-sm">Crie novos horários disponíveis</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de gerenciamento de sessão */}
      <Dialog open={isManageDialogOpen} onOpenChange={(open) => {
        setIsManageDialogOpen(open);
        if (!open) {
          setIsEditMode(false);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{isEditMode ? 'Editar Agendamento' : 'Gerenciar Agendamento'}</span>
              {userType === 'professional' && !isEditMode && selectedSession && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditMode(true)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {selectedSession && (
            <ScrollArea className="max-h-[75vh] pr-4">
              {isEditMode ? (
                <form onSubmit={handleUpdateSession} className="space-y-4">
                  <div>
                    <Label htmlFor="edit_appointment_type">Tipo de Agendamento</Label>
                    <Select 
                      value={editFormData.appointment_type} 
                      onValueChange={(value) => setEditFormData({ ...editFormData, appointment_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo de agendamento" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="consulta-medica">Consulta Médica</SelectItem>
                        <SelectItem value="consulta-nutricao">Consulta de Nutrição</SelectItem>
                        <SelectItem value="treinamento">Treinamento</SelectItem>
                        <SelectItem value="fisioterapia">Atendimento da Fisioterapia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="edit_title">Título da Sessão</Label>
                    <Input
                      id="edit_title"
                      value={editFormData.title}
                      onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                      placeholder="Ex: Consulta Nutricional"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="edit_athlete">Atleta</Label>
                    <Select 
                      value={editFormData.athlete_id || 'none'} 
                      onValueChange={(value) => setEditFormData({ ...editFormData, athlete_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um atleta ou deixe disponível" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Horário livre (disponível para qualquer atleta)</SelectItem>
                        {athletes.map((athlete) => (
                          <SelectItem key={athlete.id} value={athlete.id}>
                            {athlete.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="edit_description">Descrição</Label>
                    <Textarea
                      id="edit_description"
                      value={editFormData.description}
                      onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                      placeholder="Detalhes sobre a sessão..."
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="edit_session_date">Data</Label>
                    <Input
                      id="edit_session_date"
                      type="date"
                      value={editFormData.session_date}
                      onChange={(e) => setEditFormData({ ...editFormData, session_date: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit_start_time">Início</Label>
                      <Input
                        id="edit_start_time"
                        type="time"
                        value={editFormData.start_time}
                        onChange={(e) => setEditFormData({ ...editFormData, start_time: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit_end_time">Fim</Label>
                      <Input
                        id="edit_end_time"
                        type="time"
                        value={editFormData.end_time}
                        onChange={(e) => setEditFormData({ ...editFormData, end_time: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="edit_location">Local</Label>
                    <Input
                      id="edit_location"
                      value={editFormData.location}
                      onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                      placeholder="Ex: Consultório, Online, etc."
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="edit_price">Preço</Label>
                    <Input
                      id="edit_price"
                      type="number"
                      step="0.01"
                      value={editFormData.price}
                      onChange={(e) => setEditFormData({ ...editFormData, price: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <Button type="submit" disabled={loading} className="flex-1">
                      {loading ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsEditMode(false)}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg bg-muted/20">
                    <h3 className="font-semibold text-lg">{selectedSession.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatTime(selectedSession.start_time)} - {formatTime(selectedSession.end_time)}
                      </div>
                      {selectedSession.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {selectedSession.location}
                        </div>
                      )}
                      {selectedSession.price && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          R$ {selectedSession.price.toFixed(2)}
                        </div>
                      )}
                    </div>
                    {selectedSession.description && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {selectedSession.description}
                      </p>
                    )}
                    <div className="mt-3">
                      {getStatusBadge(selectedSession.status, selectedSession.session_type)}
                    </div>
                  </div>

                  {userType === 'professional' && selectedSession.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        className="flex-1"
                        onClick={() => {
                          handleSessionAction(selectedSession.id, 'confirm');
                          setIsManageDialogOpen(false);
                        }}
                        disabled={loading}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Confirmar
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          handleSessionAction(selectedSession.id, 'cancel');
                          setIsManageDialogOpen(false);
                        }}
                        disabled={loading}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Cancelar
                      </Button>
                    </div>
                  )}

                  {userType === 'athlete' && selectedSession.session_type === 'available' && selectedSession.status === 'available' && (
                    <Button
                      className="w-full"
                      onClick={() => {
                        handleBookSession(selectedSession.id);
                        setIsManageDialogOpen(false);
                      }}
                      disabled={loading}
                    >
                      Agendar Sessão
                    </Button>
                  )}

                  {selectedSession.athlete_id && selectedSession.athlete && (
                    <div className="p-3 bg-muted/20 rounded-lg">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span className="font-medium">Atleta:</span>
                        <span>{selectedSession.athlete.full_name}</span>
                      </div>
                    </div>
                  )}

                  {userType === 'athlete' && selectedSession.professional && (
                    <div className="p-3 bg-muted/20 rounded-lg">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span className="font-medium">Profissional:</span>
                        <span>{selectedSession.professional.full_name}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SessionScheduler;