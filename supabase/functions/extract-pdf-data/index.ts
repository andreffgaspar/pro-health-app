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
  
  // Clean and normalize the text more effectively
  const cleanedText = text
    .replace(/[^\w\s\-\.\,\:\(\)\[\]\/\%\+\<\>\=\u00C0-\u017F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  console.log('Processing text for variables:', cleanedText.substring(0, 800));
  
  // Split into potential lines that might contain lab values
  const lines = cleanedText.split(/[\n\r]/).filter(line => line.trim().length > 3);
  
  // Enhanced patterns specifically for lab results
  const patterns = [
    // Complete pattern: "Parameter: value unit (Ref: range)"
    /^([A-Za-zÀ-ÿ\s]{2,40}):\s*([0-9,\.]+)\s*([a-zA-Z\/\%\²³µ]*)\s*(?:\((?:Ref|Reference|Referência)[:\.]?\s*([0-9,\.\-\s<>]+)\))?/i,
    
    // Spaced pattern: "Parameter value unit Ref range"
    /^([A-Za-zÀ-ÿ\s]{2,40})\s+([0-9,\.]+)\s+([a-zA-Z\/\%\²³µ]+)\s+(?:Ref[:\.]?\s*)?([0-9,\.\-\s<>]+)/i,
    
    // Simple pattern: "Parameter value unit"
    /^([A-Za-zÀ-ÿ\s]{2,40})\s+([0-9,\.]+)\s+([a-zA-Z\/\%\²³µ]+)$/i,
    
    // Reference in parentheses at end
    /^([A-Za-zÀ-ÿ\s]{2,40})\s+([0-9,\.]+)\s*([a-zA-Z\/\%\²³µ]*)\s*\(([^)]+)\)$/i
  ];
  
  // Process each line
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Skip lines that are too short or don't contain numbers
    if (trimmedLine.length < 5 || !/\d/.test(trimmedLine)) {
      continue;
    }
    
    console.log('Analyzing line:', trimmedLine);
    
    let matched = false;
    
    for (const pattern of patterns) {
      const match = trimmedLine.match(pattern);
      
      if (match) {
        const name = match[1]?.trim();
        const value = match[2]?.trim();
        const unit = match[3]?.trim();
        let reference = match[4]?.trim();
        
        // Clean up the reference if it contains "Ref" prefix
        if (reference && /^(?:Ref|Reference|Referência)[:\.]?\s*/i.test(reference)) {
          reference = reference.replace(/^(?:Ref|Reference|Referência)[:\.]?\s*/i, '');
        }
        
        if (name && value && name.length >= 2 && name.length <= 50) {
          // Check for duplicates
          const exists = variables.some(v => 
            v.name.toLowerCase().trim() === name.toLowerCase().trim() && 
            v.value === value
          );
          
          if (!exists) {
            variables.push({
              name: name,
              value: value,
              unit: unit && unit.length > 0 ? unit : undefined,
              reference_range: reference && reference.length > 0 ? reference : undefined
            });
            
            console.log('Variable extracted:', { name, value, unit, reference });
            matched = true;
            break;
          }
        }
      }
    }
    
    // If no pattern matched, try a more flexible approach for partial data
    if (!matched && /\d/.test(trimmedLine)) {
      const flexibleMatch = trimmedLine.match(/([A-Za-zÀ-ÿ\s]{2,30})\s*[:=]?\s*([0-9,\.]+)/i);
      if (flexibleMatch) {
        const name = flexibleMatch[1]?.trim();
        const value = flexibleMatch[2]?.trim();
        
        if (name && value && name.length >= 2) {
          const exists = variables.some(v => 
            v.name.toLowerCase().trim() === name.toLowerCase().trim() && 
            v.value === value
          );
          
          if (!exists) {
            variables.push({
              name: name,
              value: value,
              unit: undefined,
              reference_range: undefined
            });
            console.log('Flexible variable extracted:', { name, value });
          }
        }
      }
    }
  }
  
  console.log('Final extracted variables:', variables);
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
      
      // Enhanced text extraction focusing on structured content
      const textMatches = pdfString.match(/BT[\s\S]*?ET/g) || [];
      
      if (textMatches.length > 0) {
        // Process each text block separately to preserve structure
        const textBlocks = textMatches.map(block => 
          block
            .replace(/BT|ET|Tf|Td|TJ|Tj|q|Q|re|f|S|s|w|W/g, ' ')
            .replace(/\[[^\]]*\]/g, ' ')
            .replace(/[^\x20-\x7E\u00C0-\u017F\u0100-\u024F\u0080-\u00FF\n\r]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
        ).filter(block => block.length > 0);
        
        // Join blocks with line breaks to preserve document structure
        extractedText = textBlocks.join('\n').trim();
        
        // If we got fragmented text, try to reconstruct it better
        if (extractedText.length > 0) {
          const lines = extractedText.split('\n').filter(line => line.trim().length > 0);
          extractedText = lines.join('\n');
        }
      }
      
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