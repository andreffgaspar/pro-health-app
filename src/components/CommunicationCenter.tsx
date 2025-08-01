import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Send, MessageCircle, Users, Plus, UsersIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRealtimeCommunication } from '@/hooks/useRealtimeCommunication';
import { useToast } from '@/hooks/use-toast';

interface Professional {
  user_id: string;
  full_name: string | null;
}

interface Athlete {
  user_id: string;
  full_name: string | null;
}

interface GroupConversation {
  id: string;
  name: string;
  description: string | null;
  participants_count: number;
  last_message_at: string;
}

interface GroupMessage {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  sender_name: string;
}

const CommunicationCenter = () => {
  const { user, profile } = useAuth();
  const { conversations, messages, fetchMessages, markConversationAsRead } = useRealtimeCommunication();
  const { toast } = useToast();
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [groupConversations, setGroupConversations] = useState<GroupConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [selectedGroupConversation, setSelectedGroupConversation] = useState<string | null>(null);
  const [groupMessages, setGroupMessages] = useState<GroupMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCreateGroupDialog, setShowCreateGroupDialog] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [selectedProfessionals, setSelectedProfessionals] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isAthlete = profile?.user_type === 'athlete';
  const isProfessional = profile?.user_type === 'professional';

  useEffect(() => {
    if (user && (isAthlete || isProfessional)) {
      if (isAthlete) {
        fetchProfessionals();
      } else {
        fetchAthletes();
      }
      fetchGroupConversations();
    }
  }, [user, profile]);

  useEffect(() => {
    if (selectedConversation) {
      console.log('Selected conversation:', selectedConversation);
      fetchMessages(selectedConversation);
      // Mark conversation as read when selected
      console.log('About to mark conversation as read...');
      markConversationAsRead(selectedConversation);
      setSelectedGroupConversation(null);
    } else if (selectedGroupConversation) {
      console.log('Selected group conversation:', selectedGroupConversation);
      fetchGroupMessages(selectedGroupConversation);
      setSelectedConversation(null);
    }
  }, [selectedConversation, selectedGroupConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, groupMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchProfessionals = async () => {
    try {
      const { data, error } = await supabase
        .from('athlete_professional_relationships')
        .select(`
          professional_id,
          professional:profiles!athlete_professional_relationships_professional_id_fkey(user_id, full_name)
        `)
        .eq('athlete_id', user?.id)
        .eq('status', 'accepted');

      if (error) throw error;
      
      const professionalsList = data?.map(rel => ({
        user_id: (rel.professional as any)?.user_id,
        full_name: (rel.professional as any)?.full_name
      })).filter(professional => professional.user_id) || [];
      
      setProfessionals(professionalsList);
    } catch (error) {
      console.error('Error fetching professionals:', error);
    }
  };

  const fetchAthletes = async () => {
    try {
      const { data, error } = await supabase
        .from('athlete_professional_relationships')
        .select(`
          athlete_id,
          athlete:profiles!athlete_professional_relationships_athlete_id_fkey(user_id, full_name)
        `)
        .eq('professional_id', user?.id)
        .eq('status', 'accepted');

      if (error) throw error;
      
      const athletesList = data?.map(rel => ({
        user_id: (rel.athlete as any)?.user_id,
        full_name: (rel.athlete as any)?.full_name
      })).filter(athlete => athlete.user_id) || [];
      
      setAthletes(athletesList);
    } catch (error) {
      console.error('Error fetching athletes:', error);
    }
  };

  const fetchGroupConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('group_conversations')
        .select(`
          id,
          name,
          description,
          updated_at,
          participants:group_participants(count)
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      
      const formattedGroups = data?.map(group => ({
        id: group.id,
        name: group.name,
        description: group.description,
        participants_count: (group.participants as any)[0]?.count || 0,
        last_message_at: group.updated_at
      })) || [];

      setGroupConversations(formattedGroups);
    } catch (error) {
      console.error('Error fetching group conversations:', error);
    }
  };

  const fetchGroupMessages = async (groupId: string) => {
    try {
      const { data, error } = await supabase
        .from('group_messages')
        .select(`
          id,
          content,
          sender_id,
          created_at,
          sender:profiles!group_messages_sender_id_fkey(full_name)
        `)
        .eq('group_id', groupId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      const formattedMessages = data?.map(msg => ({
        id: msg.id,
        content: msg.content,
        sender_id: msg.sender_id,
        created_at: msg.created_at,
        sender_name: (msg.sender as any)?.full_name || 'Usuário'
      })) || [];

      setGroupMessages(formattedMessages);
    } catch (error) {
      console.error('Error fetching group messages:', error);
    }
  };

  const startConversation = async (otherPartyId: string) => {
    try {
      setLoading(true);
      
      // Check if conversation already exists
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .eq('athlete_id', isAthlete ? user?.id : otherPartyId)
        .eq('professional_id', isAthlete ? otherPartyId : user?.id)
        .single();

      if (existingConv) {
        setSelectedConversation(existingConv.id);
        return;
      }

      // Create new conversation
      const otherPartyList = isAthlete ? professionals : athletes;
      const otherParty = otherPartyList.find(p => p.user_id === otherPartyId);
      
      const { data, error } = await supabase
        .from('conversations')
        .insert([{
          athlete_id: isAthlete ? user?.id : otherPartyId,
          professional_id: isAthlete ? otherPartyId : user?.id,
          title: `Conversa com ${otherParty?.full_name}`
        }])
        .select()
        .single();

      if (error) throw error;

      setSelectedConversation(data.id);
      
      toast({
        title: "Conversa iniciada",
        description: `Você pode começar a conversar com ${isAthlete ? 'o profissional' : 'o atleta'}.`
      });
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast({
        title: "Erro",
        description: "Não foi possível iniciar a conversa.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    try {
      if (selectedConversation) {
        const { error } = await supabase
          .from('messages')
          .insert([{
            conversation_id: selectedConversation,
            sender_id: user.id,
            content: newMessage.trim()
          }]);

        if (error) throw error;

        setNewMessage('');
        await fetchMessages(selectedConversation);
        
        await supabase
          .from('conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', selectedConversation);

      } else if (selectedGroupConversation) {
        const { error } = await supabase
          .from('group_messages')
          .insert([{
            group_id: selectedGroupConversation,
            sender_id: user.id,
            content: newMessage.trim()
          }]);

        if (error) throw error;

        setNewMessage('');
        await fetchGroupMessages(selectedGroupConversation);
        
        await supabase
          .from('group_conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', selectedGroupConversation);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem.",
        variant: "destructive"
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const createGroupConversation = async () => {
    if (!newGroupName.trim() || selectedProfessionals.length === 0) return;

    try {
      setLoading(true);

      const { data: groupData, error: groupError } = await supabase
        .from('group_conversations')
        .insert([{
          name: newGroupName.trim(),
          description: newGroupDescription.trim() || null,
          created_by: user?.id
        }])
        .select()
        .single();

      if (groupError) throw groupError;

      const participants = [
        { group_id: groupData.id, user_id: user?.id, role: 'admin' },
        ...selectedProfessionals.map(profId => ({
          group_id: groupData.id,
          user_id: profId,
          role: 'member'
        }))
      ];

      const { error: participantsError } = await supabase
        .from('group_participants')
        .insert(participants);

      if (participantsError) throw participantsError;

      setNewGroupName('');
      setNewGroupDescription('');
      setSelectedProfessionals([]);
      setShowCreateGroupDialog(false);

      await fetchGroupConversations();

      toast({
        title: "Grupo criado!",
        description: "O grupo de conversa foi criado com sucesso."
      });

    } catch (error) {
      console.error('Error creating group:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o grupo.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isAthlete && !isProfessional) {
    return null;
  }

  const currentConversationMessages = selectedConversation ? messages[selectedConversation] || [] : [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px]">
      {/* Contacts List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {isAthlete ? 'Profissionais' : 'Atletas'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {(isAthlete ? professionals : athletes).map((contact) => (
                <div
                  key={contact.user_id}
                  className="flex items-center justify-between p-2 rounded-lg border hover:bg-accent cursor-pointer"
                  onClick={() => startConversation(contact.user_id)}
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {contact.full_name?.charAt(0).toUpperCase() || (isAthlete ? 'P' : 'A')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">
                      {contact.full_name || (isAthlete ? 'Profissional' : 'Atleta')}
                    </span>
                  </div>
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Conversations List with Unread Indicators */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Conversas</CardTitle>
            {isAthlete && (
              <Dialog open={showCreateGroupDialog} onOpenChange={setShowCreateGroupDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Grupo
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Criar Grupo de Conversa</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="groupName">Nome do Grupo</Label>
                      <Input
                        id="groupName"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        placeholder="Ex: Equipe Médica"
                      />
                    </div>
                    <div>
                      <Label htmlFor="groupDescription">Descrição (opcional)</Label>
                      <Textarea
                        id="groupDescription"
                        value={newGroupDescription}
                        onChange={(e) => setNewGroupDescription(e.target.value)}
                        placeholder="Descreva o propósito do grupo..."
                      />
                    </div>
                    <div>
                      <Label>Selecionar Profissionais</Label>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {professionals.map((professional) => (
                          <div key={professional.user_id} className="flex items-center space-x-2">
                            <Checkbox
                              id={professional.user_id}
                              checked={selectedProfessionals.includes(professional.user_id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedProfessionals([...selectedProfessionals, professional.user_id]);
                                } else {
                                  setSelectedProfessionals(selectedProfessionals.filter(id => id !== professional.user_id));
                                }
                              }}
                            />
                            <Label htmlFor={professional.user_id} className="flex items-center gap-2 cursor-pointer">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs">
                                  {professional.full_name?.charAt(0) || 'P'}
                                </AvatarFallback>
                              </Avatar>
                              {professional.full_name || 'Profissional'}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={createGroupConversation}
                        disabled={loading || !newGroupName.trim() || selectedProfessionals.length === 0}
                        className="flex-1"
                      >
                        {loading ? 'Criando...' : 'Criar Grupo'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowCreateGroupDialog(false)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <div className="space-y-2">
              {/* Group Conversations */}
              {groupConversations.map((group) => (
                <div
                  key={group.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedGroupConversation === group.id
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent'
                  }`}
                  onClick={() => setSelectedGroupConversation(group.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UsersIcon className="h-4 w-4" />
                      <div className="font-medium text-sm">{group.name}</div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {group.participants_count} participantes • {new Date(group.last_message_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
              
              {/* Individual Conversations with Unread Count */}
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedConversation === conversation.id
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent'
                  }`}
                  onClick={() => setSelectedConversation(conversation.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-sm">
                      {conversation.other_party_name}
                    </div>
                    {conversation.unread_count > 0 && (
                      <Badge variant="destructive" className="ml-2 text-xs">
                        {conversation.unread_count}
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(conversation.updated_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Chat Area */}
      <Card>
        <CardHeader>
          <CardTitle>
            {selectedConversation 
              ? conversations.find(c => c.id === selectedConversation)?.other_party_name
              : selectedGroupConversation
              ? groupConversations.find(g => g.id === selectedGroupConversation)?.name
              : 'Selecione uma conversa'
            }
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col h-[500px]">
          {(selectedConversation || selectedGroupConversation) ? (
            <>
              <ScrollArea className="flex-1 mb-4">
                <div className="space-y-4">
                  {(selectedConversation ? currentConversationMessages : groupMessages).map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.sender_id === user?.id ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[70%] p-3 rounded-lg ${
                          message.sender_id === user?.id
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <div className="text-sm">{message.content}</div>
                        <div className="text-xs opacity-70 mt-1">
                          {new Date(message.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Digite sua mensagem..."
                  className="flex-1"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  size="icon"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Selecione uma conversa ou inicie uma nova</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CommunicationCenter;