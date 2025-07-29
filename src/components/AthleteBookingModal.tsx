import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  CalendarDays, 
  Clock, 
  MapPin, 
  DollarSign, 
  User,
  Stethoscope,
  Apple,
  Dumbbell,
  Heart,
  Plus
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AvailableSession {
  id: string;
  professional_id: string;
  title: string;
  description: string | null;
  session_date: string;
  start_time: string;
  end_time: string;
  appointment_type?: string;
  location: string | null;
  price: number | null;
  professional?: {
    full_name: string;
  } | null;
}

interface Professional {
  id: string;
  full_name: string;
  user_id: string;
}

const AthleteBookingModal = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [availableSessions, setAvailableSessions] = useState<AvailableSession[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      fetchLinkedProfessionals();
      fetchAvailableSessions();
    }
  }, [isOpen, user, selectedDate]);

  const fetchLinkedProfessionals = async () => {
    try {
      const { data, error } = await supabase
        .from('athlete_professional_relationships')
        .select(`
          professional_id,
          professional:profiles!athlete_professional_relationships_professional_id_fkey(full_name, user_id)
        `)
        .eq('athlete_id', user?.id)
        .eq('status', 'accepted')
        .eq('is_active', true);

      if (error) throw error;

      const professionalList: Professional[] = (data || []).map((item: any) => ({
        id: item.professional_id,
        full_name: item.professional.full_name,
        user_id: item.professional.user_id
      }));

      setProfessionals(professionalList);
    } catch (error) {
      console.error('Error fetching linked professionals:', error);
    }
  };

  const fetchAvailableSessions = async () => {
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
      // Get professional IDs from linked professionals
      const professionalIds = professionals.map(p => p.id);
      
      if (professionalIds.length === 0) return;

      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          professional:profiles!sessions_professional_id_fkey(full_name)
        `)
        .eq('session_date', dateStr)
        .eq('session_type', 'available')
        .eq('status', 'available')
        .in('professional_id', professionalIds)
        .order('start_time');

      if (error) throw error;
      
      const typedData: AvailableSession[] = (data || []).map((item: any) => ({
        ...item,
        professional: item.professional
      }));
      
      setAvailableSessions(typedData);
    } catch (error) {
      console.error('Error fetching available sessions:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as sessões disponíveis.",
        variant: "destructive"
      });
    }
  };

  const handleBookSession = async (sessionId: string) => {
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
      const session = availableSessions.find(s => s.id === sessionId);
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

      // Refresh the available sessions
      fetchAvailableSessions();
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

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    return `${hours}h${minutes}`;
  };

  const getAppointmentIcon = (appointmentType?: string) => {
    const iconProps = { className: "w-5 h-5" };
    
    switch (appointmentType) {
      case 'consulta-medica':
        return <Stethoscope {...iconProps} className="w-5 h-5 text-blue-500" />;
      case 'consulta-nutricao':
        return <Apple {...iconProps} className="w-5 h-5 text-green-500" />;
      case 'treinamento':
        return <Dumbbell {...iconProps} className="w-5 h-5 text-orange-500" />;
      case 'fisioterapia':
        return <Heart {...iconProps} className="w-5 h-5 text-red-500" />;
      default:
        return <CalendarDays {...iconProps} className="w-5 h-5 text-muted-foreground" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Agendar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Agendar Sessão</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Selecionar Data</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (date) {
                    setSelectedDate(date);
                  }
                }}
                locale={ptBR}
                className="w-full"
                disabled={(date) => date < new Date()}
              />
            </CardContent>
          </Card>

          {/* Available Sessions */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5" />
                Horários Disponíveis - {format(selectedDate, 'dd/MM/yyyy', { locale: ptBR })}
              </CardTitle>
              <CardDescription>
                {availableSessions.length} horário(s) disponível(is) dos seus profissionais vinculados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {availableSessions.length > 0 ? (
                  <div className="space-y-4">
                    {availableSessions.map((session) => (
                      <div
                        key={session.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="flex items-center gap-2">
                              {getAppointmentIcon(session.appointment_type)}
                              <h4 className="font-semibold">{session.title}</h4>
                            </div>
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              Disponível
                            </Badge>
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
                            
                            {session.professional && (
                              <div className="flex items-center gap-1">
                                <User className="w-4 h-4" />
                                {session.professional.full_name}
                              </div>
                            )}
                          </div>
                          
                          {session.description && (
                            <p className="text-sm text-muted-foreground mt-2">
                              {session.description}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleBookSession(session.id)}
                            disabled={loading}
                          >
                            Agendar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum horário disponível para esta data</p>
                    <p className="text-sm">
                      {professionals.length === 0 
                        ? "Você não possui profissionais vinculados ainda."
                        : "Tente selecionar outra data."}
                    </p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AthleteBookingModal;