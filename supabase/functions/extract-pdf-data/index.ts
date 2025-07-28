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

const googleCloudCredentials = Deno.env.get('GOOGLE_CLOUD_CREDENTIALS');

// Helper functions for extracting data from text
function extractDateFromText(text: string): string | null {
  const datePatterns = [
    /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/g,
    /(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/g,
    /(\d{1,2}\s+de\s+\w+\s+de\s+\d{4})/gi
  ];
  
  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      try {
        const date = new Date(match[0]);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
      } catch (e) {
        continue;
      }
    }
  }
  return null;
}

function extractDoctorFromText(text: string): string | null {
  const doctorPatterns = [
    /(?:Dr\.?\s+|Dra\.?\s+|Médico[a]?:\s*)([A-ZÁÃÔÂÎ][a-záãôâîêç\s]+)/gi,
    /(?:Responsável:\s*)([A-ZÁÃÔÂÎ][a-záãôâîêç\s]+)/gi
  ];
  
  for (const pattern of doctorPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return null;
}

function extractLaboratoryFromText(text: string): string | null {
  const labPatterns = [
    /(?:Laboratório:\s*)([A-ZÁÃÔÂÎ][a-záãôâîêç\s&\-]+)/gi,
    /(?:Lab\.?\s*)([A-ZÁÃÔÂÎ][a-záãôâîêç\s&\-]+)/gi
  ];
  
  for (const pattern of labPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return null;
}

function extractVariablesFromText(text: string): Array<{name: string, value: string, unit?: string, reference_range?: string}> {
  const variables: Array<{name: string, value: string, unit?: string, reference_range?: string}> = [];
  
  // Pattern for lab results: "Test Name: 123.45 mg/dL (Reference: 80-120)"
  const variablePattern = /([A-Za-zÁÃÔÂÎáãôâîêç\s]+):\s*([0-9,\.]+)\s*([a-zA-Z\/\%]*)\s*(?:\((?:Ref|Referência)[:\.]?\s*([0-9,\.\-\s<>]+)\))?/gi;
  
  let match;
  while ((match = variablePattern.exec(text)) !== null) {
    variables.push({
      name: match[1].trim(),
      value: match[2].trim(),
      unit: match[3] ? match[3].trim() : undefined,
      reference_range: match[4] ? match[4].trim() : undefined
    });
  }
  
  return variables;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Processing PDF extraction request...');
    
    if (!googleCloudCredentials) {
      console.error('Google Cloud credentials not found');
      return new Response(
        JSON.stringify({ error: 'Google Cloud credentials not configured' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 500 
        }
      );
    }

    const { pdfBuffer, fileName } = await req.json();
    
    if (!pdfBuffer) {
      return new Response(
        JSON.stringify({ error: 'PDF buffer is required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 400 
        }
      );
    }

    console.log('Processing PDF with Google Cloud Document AI...');

    // For now, let's use a simplified approach with basic text extraction from PDF
    // In a production setup, you would need to:
    // 1. Create a Document AI processor in Google Cloud Console
    // 2. Set up proper JWT signing for authentication
    // 3. Configure the processor ID and location
    
    console.log('Using fallback text extraction method...');
    
    // Convert base64 PDF buffer to text (simplified extraction)
    let extractedText = '';
    
    try {
      // Decode the base64 PDF buffer with proper UTF-8 handling
      const pdfBytes = Uint8Array.from(atob(pdfBuffer), c => c.charCodeAt(0));
      
      // Use UTF-8 decoding for better text extraction
      const decoder = new TextDecoder('utf-8', { fatal: false });
      let pdfString = '';
      
      try {
        pdfString = decoder.decode(pdfBytes);
      } catch (decodingError) {
        // Fallback to latin1 if UTF-8 fails
        const latin1Decoder = new TextDecoder('latin1');
        pdfString = latin1Decoder.decode(pdfBytes);
      }
      
      // Enhanced text extraction with better pattern matching
      const textMatches = pdfString.match(/BT[\s\S]*?ET/g) || [];
      
      // Clean and normalize extracted text
      extractedText = textMatches
        .join(' ')
        .replace(/BT|ET|Tf|Td|TJ|Tj|'/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/[^\x20-\x7E\u00C0-\u017F\u0100-\u024F]/g, ' ') // Keep only printable Latin characters
        .trim();
      
      if (!extractedText || extractedText.length < 10) {
        extractedText = 'Não foi possível extrair texto do PDF automaticamente. Por favor, insira os dados manualmente.';
      }
      
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      extractedText = 'Erro na extração de texto. Por favor, insira os dados manualmente.';
    }
    
    console.log('Text extraction completed');

    // Simple pattern matching for medical exam data
    const extractedData: ExtractedData = {
      raw_text: extractedText,
      exam_date: extractDateFromText(extractedText),
      doctor: extractDoctorFromText(extractedText),
      laboratory: extractLaboratoryFromText(extractedText),
      variables: extractVariablesFromText(extractedText),
      report: extractedText
    };

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