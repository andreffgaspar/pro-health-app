import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { 
  Send, 
  MessageCircle, 
  Users, 
  Plus, 
  ArrowLeft, 
  Search,
  MoreVertical,
  UserPlus,
  Paperclip
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRealtimeCommunication } from '@/hooks/useRealtimeCommunication';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

interface Professional {
  user_id: string;
  full_name: string | null;
}

interface Athlete {
  user_id: string;
  full_name: string | null;
}

interface ConversationItem {
  id: string;
  name: string;
  type: 'individual' | 'group';
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  avatar?: string;
  isOnline?: boolean;
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
  const { conversations, messages, fetchMessages, markConversationAsRead, refetchConversations } = useRealtimeCommunication();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [groupConversations, setGroupConversations] = useState<GroupConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [selectedGroupConversation, setSelectedGroupConversation] = useState<string | null>(null);
  const [groupMessages, setGroupMessages] = useState<GroupMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCreateGroupDialog, setShowCreateGroupDialog] = useState(false);
  const [showContactsList, setShowContactsList] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [selectedProfessionals, setSelectedProfessionals] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<'list' | 'chat'>('list'); // Mobile navigation state
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isAthlete = profile?.user_type === 'athlete';
  const isProfessional = profile?.user_type === 'professional';

  // Combine conversations for unified list
  const allConversations: ConversationItem[] = [
    // Group conversations
    ...groupConversations.map(group => ({
      id: group.id,
      name: group.name,
      type: 'group' as const,
      lastMessage: 'Grupo de conversa',
      lastMessageTime: new Date(group.last_message_at).toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      unreadCount: 0,
      isOnline: false
    })),
    // Individual conversations
    ...conversations.map(conv => {
      const lastMessages = messages[conv.id] || [];
      const lastMessage = lastMessages.length > 0 ? lastMessages[lastMessages.length - 1] : null;
      
      return {
        id: conv.id,
        name: conv.other_party_name,
        type: 'individual' as const,
        lastMessage: lastMessage ? lastMessage.content : 'Clique para iniciar conversa',
        lastMessageTime: conv.updated_at ? new Date(conv.updated_at).toLocaleTimeString('pt-BR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }) : '',
        unreadCount: conv.unread_count,
        isOnline: Math.random() > 0.5 // Mock online status
      };
    })
  ].sort((a, b) => new Date(b.lastMessageTime || 0).getTime() - new Date(a.lastMessageTime || 0).getTime());

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
      fetchMessages(selectedConversation);
      markConversationAsRead(selectedConversation);
      setSelectedGroupConversation(null);
      if (isMobile) setView('chat');
      setTimeout(() => scrollToBottom(), 100);
    } else if (selectedGroupConversation) {
      fetchGroupMessages(selectedGroupConversation);
      setSelectedConversation(null);
      if (isMobile) setView('chat');
      setTimeout(() => scrollToBottom(), 100);
    }
  }, [selectedConversation, selectedGroupConversation]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
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
      
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .eq('athlete_id', isAthlete ? user?.id : otherPartyId)
        .eq('professional_id', isAthlete ? otherPartyId : user?.id)
        .single();

      if (existingConv) {
        setSelectedConversation(existingConv.id);
        setShowContactsList(false);
        return;
      }

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
      setShowContactsList(false);
      
      toast({
        title: "Conversa iniciada",
        description: `Você pode começar a conversar.`
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
        setTimeout(() => scrollToBottom(), 100);
        
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
        setTimeout(() => scrollToBottom(), 100);
        
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

  const currentConversationMessages = selectedConversation ? messages[selectedConversation] || [] : [];
  const currentConversation = allConversations.find(conv => 
    (conv.type === 'individual' && conv.id === selectedConversation) ||
    (conv.type === 'group' && conv.id === selectedGroupConversation)
  );

  const filteredConversations = allConversations.filter(conv => 
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isAthlete && !isProfessional) {
    return null;
  }

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="h-[calc(100vh-8rem)] flex flex-col bg-background">
        {view === 'list' ? (
          // Conversations List (Mobile)
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b bg-card">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">Conversas</h2>
                <div className="flex gap-2">
                  {isAthlete && (
                    <Dialog open={showCreateGroupDialog} onOpenChange={setShowCreateGroupDialog}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Users className="h-5 w-5" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="mx-4">
                        <DialogHeader>
                          <DialogTitle>Criar Grupo</DialogTitle>
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
                            <ScrollArea className="h-32">
                              <div className="space-y-2">
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
                                    <Label htmlFor={professional.user_id} className="flex items-center gap-2">
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
                            </ScrollArea>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={createGroupConversation}
                              disabled={loading || !newGroupName.trim() || selectedProfessionals.length === 0}
                              className="flex-1"
                            >
                              {loading ? 'Criando...' : 'Criar'}
                            </Button>
                            <Button variant="outline" onClick={() => setShowCreateGroupDialog(false)}>
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                  
                  <Sheet open={showContactsList} onOpenChange={setShowContactsList}>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <UserPlus className="h-5 w-5" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-[300px]">
                      <SheetHeader>
                        <SheetTitle>{isAthlete ? 'Profissionais' : 'Atletas'}</SheetTitle>
                      </SheetHeader>
                      <ScrollArea className="h-[calc(100vh-8rem)] mt-4">
                        <div className="space-y-2">
                          {(isAthlete ? professionals : athletes).map((contact) => (
                            <div
                              key={contact.user_id}
                              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent cursor-pointer"
                              onClick={() => startConversation(contact.user_id)}
                            >
                              <Avatar className="h-10 w-10">
                                <AvatarFallback>
                                  {contact.full_name?.charAt(0).toUpperCase() || (isAthlete ? 'P' : 'A')}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">
                                  {contact.full_name || (isAthlete ? 'Profissional' : 'Atleta')}
                                </p>
                              </div>
                              <MessageCircle className="h-4 w-4 text-muted-foreground" />
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </SheetContent>
                  </Sheet>
                </div>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Pesquisar conversas..."
                  className="pl-10"
                />
              </div>
            </div>

            {/* Conversations List */}
            <ScrollArea className="flex-1">
              <div className="p-2">
                {filteredConversations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma conversa encontrada</p>
                    <p className="text-sm">Inicie uma nova conversa</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredConversations.map((conversation) => (
                      <div
                        key={conversation.id}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent cursor-pointer"
                        onClick={() => {
                          if (conversation.type === 'group') {
                            setSelectedGroupConversation(conversation.id);
                            setSelectedConversation(null);
                          } else {
                            setSelectedConversation(conversation.id);
                            setSelectedGroupConversation(null);
                          }
                        }}
                      >
                        <div className="relative">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback>
                              {conversation.type === 'group' ? (
                                <Users className="h-6 w-6" />
                              ) : (
                                conversation.name.charAt(0).toUpperCase()
                              )}
                            </AvatarFallback>
                          </Avatar>
                          {conversation.type === 'individual' && conversation.isOnline && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium truncate">{conversation.name}</p>
                            <span className="text-xs text-muted-foreground">{conversation.lastMessageTime}</span>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{conversation.lastMessage}</p>
                        </div>
                        {conversation.unreadCount > 0 && (
                          <Badge variant="destructive" className="min-w-[20px] h-5 text-xs">
                            {conversation.unreadCount}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        ) : (
          // Chat View (Mobile)
          <div className="flex flex-col h-full">
            {/* Chat Header */}
            <div className="p-4 border-b bg-card">
              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setView('list')}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {currentConversation?.type === 'group' ? (
                      <Users className="h-4 w-4" />
                    ) : (
                      currentConversation?.name.charAt(0).toUpperCase()
                    )}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{currentConversation?.name}</p>
                  {currentConversation?.type === 'individual' && (
                    <p className="text-xs text-muted-foreground">
                      {currentConversation.isOnline ? 'Online' : 'Visto por último às 15:30'}
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {(selectedConversation ? currentConversationMessages : groupMessages).map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] p-3 rounded-2xl ${
                        message.sender_id === user?.id
                          ? 'bg-primary text-primary-foreground rounded-br-md'
                          : 'bg-muted rounded-bl-md'
                      }`}
                    >
                      {selectedGroupConversation && message.sender_id !== user?.id && (
                        <p className="text-xs font-medium mb-1 opacity-70">
                          {(message as GroupMessage).sender_name}
                        </p>
                      )}
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(message.created_at).toLocaleTimeString('pt-BR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t bg-card">
              <div className="flex items-end gap-2">
                <Button variant="ghost" size="icon">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <div className="flex-1 relative">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Mensagem..."
                    className="min-h-[40px] pr-12"
                  />
                </div>
                <Button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  size="icon"
                  className="h-10 w-10"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="h-[600px] flex bg-card rounded-lg overflow-hidden border">
      {/* Conversations Sidebar */}
      <div className="w-80 border-r flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Conversas</h2>
            <div className="flex gap-2">
              {isAthlete && (
                <Dialog open={showCreateGroupDialog} onOpenChange={setShowCreateGroupDialog}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Users className="h-4 w-4" />
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
                        <ScrollArea className="h-40">
                          <div className="space-y-2">
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
                                <Label htmlFor={professional.user_id} className="flex items-center gap-2">
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
                        </ScrollArea>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={createGroupConversation}
                          disabled={loading || !newGroupName.trim() || selectedProfessionals.length === 0}
                          className="flex-1"
                        >
                          {loading ? 'Criando...' : 'Criar Grupo'}
                        </Button>
                        <Button variant="outline" onClick={() => setShowCreateGroupDialog(false)}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              
              <Dialog open={showContactsList} onOpenChange={setShowContactsList}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <UserPlus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{isAthlete ? 'Profissionais' : 'Atletas'}</DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="h-64">
                    <div className="space-y-2">
                      {(isAthlete ? professionals : athletes).map((contact) => (
                        <div
                          key={contact.user_id}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent cursor-pointer"
                          onClick={() => startConversation(contact.user_id)}
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {contact.full_name?.charAt(0).toUpperCase() || (isAthlete ? 'P' : 'A')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">
                            {contact.full_name || (isAthlete ? 'Profissional' : 'Atleta')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar conversas..."
              className="pl-10"
            />
          </div>
        </div>

        {/* Conversations List */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma conversa encontrada</p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      (conversation.type === 'individual' && conversation.id === selectedConversation) ||
                      (conversation.type === 'group' && conversation.id === selectedGroupConversation)
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-accent'
                    }`}
                    onClick={() => {
                      if (conversation.type === 'group') {
                        setSelectedGroupConversation(conversation.id);
                        setSelectedConversation(null);
                      } else {
                        setSelectedConversation(conversation.id);
                        setSelectedGroupConversation(null);
                      }
                    }}
                  >
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {conversation.type === 'group' ? (
                            <Users className="h-5 w-5" />
                          ) : (
                            conversation.name.charAt(0).toUpperCase()
                          )}
                        </AvatarFallback>
                      </Avatar>
                      {conversation.type === 'individual' && conversation.isOnline && (
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-background rounded-full"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium truncate text-sm">{conversation.name}</p>
                        <span className="text-xs opacity-70">{conversation.lastMessageTime}</span>
                      </div>
                      <p className="text-xs opacity-70 truncate">{conversation.lastMessage}</p>
                    </div>
                    {conversation.unreadCount > 0 && (
                      <Badge variant="destructive" className="min-w-[18px] h-4 text-xs">
                        {conversation.unreadCount}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {(selectedConversation || selectedGroupConversation) ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {currentConversation?.type === 'group' ? (
                      <Users className="h-4 w-4" />
                    ) : (
                      currentConversation?.name.charAt(0).toUpperCase()
                    )}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{currentConversation?.name}</p>
                  {currentConversation?.type === 'individual' && (
                    <p className="text-xs text-muted-foreground">
                      {currentConversation.isOnline ? 'Online' : 'Visto por último às 15:30'}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {(selectedConversation ? currentConversationMessages : groupMessages).map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] p-3 rounded-2xl ${
                        message.sender_id === user?.id
                          ? 'bg-primary text-primary-foreground rounded-br-md'
                          : 'bg-muted rounded-bl-md'
                      }`}
                    >
                      {selectedGroupConversation && message.sender_id !== user?.id && (
                        <p className="text-xs font-medium mb-1 opacity-70">
                          {(message as GroupMessage).sender_name}
                        </p>
                      )}
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(message.created_at).toLocaleTimeString('pt-BR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t">
              <div className="flex items-end gap-2">
                <Button variant="ghost" size="icon">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <div className="flex-1">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Digite sua mensagem..."
                  />
                </div>
                <Button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  size="icon"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Bem-vindo às suas conversas</p>
              <p className="text-sm">Selecione uma conversa para começar a trocar mensagens</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunicationCenter;