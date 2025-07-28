import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExtractedData {
  exam_date?: string;
  doctor?: string;
  laboratory?: string;
  variables?: Array<{
    name: string;
    value: string;
    unit?: string;
    reference_range?: string;
  }>;
  report?: string;
  raw_text?: string;
}

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Processing PDF extraction request...');
    
    if (!openAIApiKey) {
      console.error('OpenAI API key not found');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 500 
        }
      );
    }

    const { pdfText, fileName } = await req.json();
    
    if (!pdfText) {
      return new Response(
        JSON.stringify({ error: 'PDF text is required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 400 
        }
      );
    }

    console.log('Extracting data from PDF text using OpenAI...');

    const prompt = `
Você é um especialista em análise de exames médicos. Analise o seguinte texto extraído de um PDF de exame médico e extraia as seguintes informações em formato JSON:

1. Data do exame (exam_date) - no formato YYYY-MM-DD
2. Nome do médico responsável (doctor)
3. Nome do laboratório (laboratory) 
4. Variáveis do exame (variables) - array com objetos contendo:
   - name: nome da variável/teste
   - value: valor encontrado
   - unit: unidade de medida (se houver)
   - reference_range: valores de referência (se houver)
5. Laudo/relatório (report) - texto completo do laudo médico
6. Texto completo (raw_text) - todo o texto extraído

Se alguma informação não for encontrada, retorne null para esse campo.

Texto do exame:
${pdfText}

Responda APENAS com um JSON válido, sem explicações adicionais:`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { 
            role: 'system', 
            content: 'Você é um especialista em análise de exames médicos que extrai dados estruturados de textos de exames.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to process PDF with AI' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 500 
        }
      );
    }

    const data = await response.json();
    const extractedText = data.choices[0].message.content;
    
    console.log('OpenAI response:', extractedText);

    try {
      // Parse the JSON response from OpenAI
      const extractedData: ExtractedData = JSON.parse(extractedText);
      
      console.log('Successfully extracted data:', extractedData);

      return new Response(
        JSON.stringify({ 
          success: true, 
          extractedData,
          fileName 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', parseError);
      console.error('Raw response:', extractedText);
      
      // Return raw text if JSON parsing fails
      return new Response(
        JSON.stringify({ 
          success: true, 
          extractedData: { 
            raw_text: extractedText,
            exam_date: null,
            doctor: null,
            laboratory: null,
            variables: [],
            report: extractedText
          },
          fileName 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

  } catch (error) {
    console.error('Error in extract-pdf-data function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});