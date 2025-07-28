import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, MessageCircle, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Professional {
  user_id: string;
  full_name: string | null;
}

interface Athlete {
  user_id: string;
  full_name: string | null;
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  sender_name: string;
}

interface Conversation {
  id: string;
  athlete_id: string;
  professional_id: string;
  other_party_id: string;
  other_party_name: string;
  title: string | null;
  updated_at: string;
}

const CommunicationCenter = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
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
      fetchConversations();
    }
  }, [user, profile]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchProfessionals = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .eq('user_type', 'professional');

      if (error) throw error;
      setProfessionals(data || []);
    } catch (error) {
      console.error('Error fetching professionals:', error);
    }
  };

  const fetchAthletes = async () => {
    try {
      // Fetch athletes that have relationships with this professional
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

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          athlete_id,
          professional_id,
          title,
          updated_at,
          athlete:profiles!conversations_athlete_id_fkey(full_name),
          professional:profiles!conversations_professional_id_fkey(full_name)
        `)
        .or(
          isAthlete 
            ? `athlete_id.eq.${user?.id}` 
            : `professional_id.eq.${user?.id}`
        );

      if (error) throw error;
      
      const formattedConversations = data?.map(conv => {
        const otherPartyId = isAthlete ? conv.professional_id : conv.athlete_id;
        const otherPartyName = isAthlete 
          ? (conv.professional as any)?.full_name 
          : (conv.athlete as any)?.full_name;
        
        return {
          id: conv.id,
          athlete_id: conv.athlete_id,
          professional_id: conv.professional_id,
          other_party_id: otherPartyId,
          other_party_name: otherPartyName || (isAthlete ? 'Profissional' : 'Atleta'),
          title: conv.title,
          updated_at: conv.updated_at
        };
      }) || [];

      setConversations(formattedConversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          sender_id,
          created_at,
          sender:profiles!messages_sender_id_fkey(full_name)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      const formattedMessages = data?.map(msg => ({
        id: msg.id,
        content: msg.content,
        sender_id: msg.sender_id,
        created_at: msg.created_at,
        sender_name: (msg.sender as any)?.full_name || 'Usuário'
      })) || [];

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
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

      await fetchConversations();
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
    if (!newMessage.trim() || !selectedConversation || !user) return;

    try {
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
      
      // Update conversation timestamp
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', selectedConversation);

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

  if (!isAthlete && !isProfessional) {
    return null;
  }

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

      {/* Conversations List */}
      <Card>
        <CardHeader>
          <CardTitle>Conversas</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <div className="space-y-2">
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
                  <div className="font-medium text-sm">
                    {conversation.other_party_name}
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
              : 'Selecione uma conversa'
            }
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col h-[500px]">
          {selectedConversation ? (
            <>
              <ScrollArea className="flex-1 mb-4">
                <div className="space-y-4">
                  {messages.map((message) => (
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