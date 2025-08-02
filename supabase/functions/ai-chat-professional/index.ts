import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
}

interface RequestBody {
  message: string;
  professionalId: string;
  conversationHistory: Message[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY não configurada');
    }

    const { message, professionalId, conversationHistory }: RequestBody = await req.json();

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Fetch professional data and athlete data
    const [professionalResponse, athletesResponse, athleteDataResponse] = await Promise.all([
      // Get professional profile
      fetch(`${supabaseUrl}/rest/v1/profiles?user_id=eq.${professionalId}&select=*`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      }),
      
      // Get linked athletes
      fetch(`${supabaseUrl}/rest/v1/athlete_professional_relationships?professional_id=eq.${professionalId}&status=eq.accepted&is_active=eq.true&select=*,athlete:profiles!athlete_professional_relationships_athlete_id_fkey(full_name,user_id)`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      }),
      
      // Get recent athlete data (last 30 days)
      fetch(`${supabaseUrl}/rest/v1/athlete_data?recorded_at=gte.${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()}&select=*`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      })
    ]);

    const professionalData = await professionalResponse.json();
    const athletesData = await athletesResponse.json();
    const recentAthleteData = await athleteDataResponse.json();

    // Filter athlete data for only linked athletes
    const linkedAthleteIds = athletesData.map((rel: any) => rel.athlete_id);
    const relevantAthleteData = recentAthleteData.filter((data: any) => 
      linkedAthleteIds.includes(data.athlete_id)
    );

    // Build context for AI
    const professional = professionalData[0];
    const context = {
      professional: {
        name: professional?.full_name || 'Profissional',
        user_type: professional?.user_type
      },
      athletes: athletesData.map((rel: any) => ({
        name: rel.athlete?.full_name || 'Atleta',
        specialty: rel.specialty,
        since: rel.accepted_at
      })),
      recentData: relevantAthleteData.map((data: any) => ({
        athlete_id: data.athlete_id,
        data_type: data.data_type,
        data: data.data,
        recorded_at: data.recorded_at
      }))
    };

    // Build conversation history for context
    const conversationContext = conversationHistory
      .slice(-6) // Last 6 messages for context
      .map(msg => `${msg.role === 'user' ? 'Usuário' : 'Assistente'}: ${msg.content}`)
      .join('\n');

    // Create system prompt
    const systemPrompt = `Você é um assistente de IA especializado em análise de dados esportivos para profissionais da saúde e performance. 

CONTEXTO DO PROFISSIONAL:
- Nome: ${context.professional.name}
- Atletas vinculados: ${context.athletes.length}
- Atletas: ${context.athletes.map(a => `${a.name} (${getSpecialtyText(a.specialty)})`).join(', ')}

DADOS DISPONÍVEIS (últimos 30 dias):
${context.recentData.length > 0 ? 
  context.recentData.slice(0, 50).map(d => 
    `- ${d.data_type}: ${JSON.stringify(d.data).slice(0, 100)}... (${new Date(d.recorded_at).toLocaleDateString('pt-BR')})`
  ).join('\n') 
  : '- Nenhum dado recente disponível'}

${conversationContext ? `\nCONVERSA ANTERIOR:\n${conversationContext}` : ''}

INSTRUÇÕES IMPORTANTES:
1. SEJA EXTREMAMENTE CONCISO - máximo 3-4 frases por resposta
2. Responda apenas o essencial em português brasileiro
3. Cite dados específicos quando disponíveis
4. Forneça 1-2 ações práticas diretas
5. Evite explicações longas ou repetitivas
6. Se não houver dados, diga apenas o que precisa
7. Use bullet points quando necessário para clareza

FORMATO DA RESPOSTA: Seja direto, prático e objetivo. Máximo 150 palavras.`;

    // Call Gemini API
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `${systemPrompt}\n\nPERGUNTA DO USUÁRIO: ${message}`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 300, // Reduced for more concise responses
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      })
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', errorText);
      throw new Error(`Erro da API Gemini: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    
    if (!geminiData.candidates || geminiData.candidates.length === 0) {
      throw new Error('Nenhuma resposta válida do Gemini');
    }

    const response = geminiData.candidates[0].content.parts[0].text;

    console.log('AI response generated successfully for professional:', professionalId);

    return new Response(
      JSON.stringify({ response }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in ai-chat-professional function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        response: 'Desculpe, ocorreu um erro ao processar sua solicitação. Verifique se a API do Gemini está configurada corretamente.'
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});

function getSpecialtyText(specialty: string): string {
  const specialties: Record<string, string> = {
    'nutrition': 'Nutricionista',
    'physiotherapy': 'Fisioterapeuta',
    'medical': 'Médico',
    'training': 'Treinador',
    'psychology': 'Psicólogo'
  };
  return specialties[specialty] || specialty;
}