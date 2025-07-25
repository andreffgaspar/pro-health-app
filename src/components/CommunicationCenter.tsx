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

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  sender_name: string;
}

interface Conversation {
  id: string;
  professional_id: string;
  professional_name: string;
  title: string | null;
  updated_at: string;
}

const CommunicationCenter = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user && profile?.user_type === 'athlete') {
      fetchProfessionals();
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

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          professional_id,
          title,
          updated_at,
          professional:profiles!conversations_professional_id_fkey(full_name)
        `)
        .eq('athlete_id', user?.id);

      if (error) throw error;
      
      const formattedConversations = data?.map(conv => ({
        id: conv.id,
        professional_id: conv.professional_id,
        professional_name: (conv.professional as any)?.full_name || 'Profissional',
        title: conv.title,
        updated_at: conv.updated_at
      })) || [];

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

  const startConversation = async (professionalId: string) => {
    try {
      setLoading(true);
      
      // Check if conversation already exists
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .eq('athlete_id', user?.id)
        .eq('professional_id', professionalId)
        .single();

      if (existingConv) {
        setSelectedConversation(existingConv.id);
        return;
      }

      // Create new conversation
      const { data, error } = await supabase
        .from('conversations')
        .insert([{
          athlete_id: user?.id,
          professional_id: professionalId,
          title: `Conversa com ${professionals.find(p => p.user_id === professionalId)?.full_name}`
        }])
        .select()
        .single();

      if (error) throw error;

      await fetchConversations();
      setSelectedConversation(data.id);
      
      toast({
        title: "Conversa iniciada",
        description: "Você pode começar a conversar com o profissional."
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

  if (profile?.user_type !== 'athlete') {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px]">
      {/* Professionals List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Profissionais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {professionals.map((professional) => (
                <div
                  key={professional.user_id}
                  className="flex items-center justify-between p-2 rounded-lg border hover:bg-accent cursor-pointer"
                  onClick={() => startConversation(professional.user_id)}
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {professional.full_name?.charAt(0).toUpperCase() || 'P'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">
                      {professional.full_name || 'Profissional'}
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
                    {conversation.professional_name}
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
              ? conversations.find(c => c.id === selectedConversation)?.professional_name
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