import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MedicalDataExtraction {
  exam_type?: string;
  body_part?: string;
  exam_date?: string;
  doctor?: string;
  laboratory?: string;
  variables?: Array<{
    name: string;
    value: string;
    unit?: string;
    reference_range?: string;
    status?: string;
  }>;
  diagnosis?: string;
  medications?: Array<{
    name: string;
    dosage?: string;
    frequency?: string;
  }>;
  symptoms?: string[];
  recommendations?: string[];
  report?: string;
  raw_text?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileBuffer, fileName, fileType } = await req.json();
    
    if (!fileBuffer || !fileName) {
      throw new Error('File buffer and filename are required');
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    console.log(`Processing file: ${fileName} (${fileType})`);
    
    let extractedData: MedicalDataExtraction = {};
    
    // Determine file type and create appropriate prompt
    const isImage = fileType?.startsWith('image/');
    const isPdf = fileType === 'application/pdf';
    
    let prompt = '';
    let geminiModel = 'gemini-1.5-flash';
    let requestBody: any = {
      contents: [{
        parts: []
      }]
    };

    if (isImage) {
      // For images (X-rays, ultrasounds, etc.)
      prompt = `Analise esta imagem médica em detalhes e extraia todas as informações possíveis em português brasileiro. Identifique:

1. TIPO DE EXAME: Qual tipo de exame é (raio-X, ultrassom, ressonância, tomografia, etc.)
2. SEGMENTO CORPORAL: Qual parte do corpo está sendo examinada
3. ACHADOS: Descreva todos os achados visíveis na imagem
4. ANORMALIDADES: Identifique qualquer anormalidade ou alteração
5. TEXTO VISÍVEL: Extraia todo texto legível da imagem (dados do paciente, hospital, laudos, etc.)
6. VALORES NUMÉRICOS: Extraia qualquer medição ou valor numérico presente

Retorne no formato JSON:
{
  "exam_type": "tipo do exame",
  "body_part": "parte do corpo",
  "findings": "achados detalhados",
  "abnormalities": "anormalidades encontradas",
  "visible_text": "todo texto extraído",
  "measurements": [{"parameter": "nome", "value": "valor", "unit": "unidade"}],
  "raw_text": "texto completo extraído"
}`;

      requestBody.contents[0].parts = [
        { text: prompt },
        {
          inline_data: {
            mime_type: fileType,
            data: fileBuffer
          }
        }
      ];
    } else if (isPdf) {
      // For PDFs (lab reports, medical reports, etc.)
      prompt = `Analise este documento médico em PDF e extraia TODAS as informações estruturadas em português brasileiro. Seja extremamente detalhado e extraia:

1. INFORMAÇÕES BÁSICAS:
   - Tipo de exame/documento
   - Data do exame
   - Nome do médico
   - Laboratório/clínica
   - Dados do paciente (se presentes)

2. RESULTADOS LABORATORIAIS (se aplicável):
   - Para CADA variável encontrada, extraia:
     * Nome do parâmetro
     * Valor encontrado
     * Unidade de medida
     * Faixa de referência
     * Status (normal/alterado/alto/baixo)

3. DIAGNÓSTICOS E LAUDOS:
   - Impressões diagnósticas
   - Conclusões
   - Recomendações médicas

4. MEDICAMENTOS (se presentes):
   - Nomes dos medicamentos
   - Dosagens
   - Frequência de uso

5. SINTOMAS E OBSERVAÇÕES:
   - Sintomas relatados
   - Observações clínicas

Retorne OBRIGATORIAMENTE em formato JSON válido:
{
  "exam_type": "tipo do exame",
  "exam_date": "data (YYYY-MM-DD se possível)",
  "doctor": "nome do médico",
  "laboratory": "nome do laboratório",
  "variables": [
    {
      "name": "nome do parâmetro",
      "value": "valor",
      "unit": "unidade",
      "reference_range": "faixa de referência",
      "status": "normal/alterado/alto/baixo"
    }
  ],
  "diagnosis": "diagnósticos e conclusões",
  "medications": [
    {
      "name": "nome do medicamento",
      "dosage": "dosagem",
      "frequency": "frequência"
    }
  ],
  "symptoms": ["lista de sintomas"],
  "recommendations": ["lista de recomendações"],
  "report": "laudo completo",
  "raw_text": "texto completo extraído"
}`;

      requestBody.contents[0].parts = [
        { text: prompt },
        {
          inline_data: {
            mime_type: fileType,
            data: fileBuffer
          }
        }
      ];
    } else {
      throw new Error('Tipo de arquivo não suportado. Use imagens (JPG, PNG) ou PDFs.');
    }

    // Call Gemini API
    console.log('Calling Gemini API...');
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Gemini response:', result);

    if (!result.candidates || !result.candidates[0] || !result.candidates[0].content) {
      throw new Error('Invalid response from Gemini API');
    }

    const generatedText = result.candidates[0].content.parts[0].text;
    console.log('Generated text:', generatedText);

    // Try to parse JSON from response
    try {
      // Extract JSON from the response (sometimes Gemini wraps it in markdown)
      const jsonMatch = generatedText.match(/```json\n?(.*?)\n?```/s) || generatedText.match(/\{.*\}/s);
      const jsonText = jsonMatch ? jsonMatch[1] || jsonMatch[0] : generatedText;
      
      extractedData = JSON.parse(jsonText);
      console.log('Parsed extracted data:', extractedData);
    } catch (parseError) {
      console.error('Error parsing JSON:', parseError);
      // Fallback: use the raw text as report
      extractedData = {
        raw_text: generatedText,
        report: generatedText
      };
    }

    return new Response(
      JSON.stringify({
        success: true,
        extractedData,
        fileName,
        message: 'Dados extraídos com sucesso usando Gemini AI'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in medical data extraction:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erro ao processar arquivo médico'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});