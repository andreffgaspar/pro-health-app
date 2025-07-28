import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface ExtractedMedicalData {
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

interface PdfExtractionResult {
  success: boolean;
  extractedData?: ExtractedMedicalData;
  fileName?: string;
  error?: string;
}

export const usePdfExtraction = () => {
  const [isExtracting, setIsExtracting] = useState(false);
  const { toast } = useToast();

  const extractTextFromPdf = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = '';
      
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n';
      }
      
      return fullText;
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      throw new Error('Falha ao extrair texto do PDF');
    }
  };

  const extractDataFromPdf = async (file: File): Promise<PdfExtractionResult> => {
    if (!file) {
      return { success: false, error: 'Nenhum arquivo fornecido' };
    }

    if (file.type !== 'application/pdf') {
      return { success: false, error: 'Apenas arquivos PDF são suportados para extração automática' };
    }

    setIsExtracting(true);

    try {
      toast({
        title: "Extraindo dados...",
        description: "Processando PDF e extraindo informações médicas. Aguarde...",
      });

      // Extract text from PDF
      const pdfText = await extractTextFromPdf(file);
      
      if (!pdfText || pdfText.trim().length === 0) {
        throw new Error('Não foi possível extrair texto do PDF');
      }

      // Call the edge function to process the text with AI
      const { data, error } = await supabase.functions.invoke('extract-pdf-data', {
        body: {
          pdfText: pdfText,
          fileName: file.name
        }
      });

      if (error) {
        console.error('Error from edge function:', error);
        throw new Error(error.message || 'Erro ao processar PDF com IA');
      }

      if (!data.success) {
        throw new Error(data.error || 'Falha no processamento do PDF');
      }

      toast({
        title: "Dados extraídos com sucesso!",
        description: "As informações do exame foram extraídas automaticamente do PDF.",
      });

      return {
        success: true,
        extractedData: data.extractedData,
        fileName: data.fileName
      };

    } catch (error) {
      console.error('Error in PDF extraction:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido na extração';
      
      toast({
        title: "Erro na extração",
        description: errorMessage,
        variant: "destructive"
      });

      return { success: false, error: errorMessage };
    } finally {
      setIsExtracting(false);
    }
  };

  const populateFormWithExtractedData = (extractedData: ExtractedMedicalData) => {
    const formData: any = {};

    // Map extracted data to form fields
    if (extractedData.doctor) {
      formData.doctorName = extractedData.doctor;
    }

    if (extractedData.exam_date) {
      // Try to format the date if it's not already in the correct format
      try {
        const date = new Date(extractedData.exam_date);
        if (!isNaN(date.getTime())) {
          formData.appointmentDate = extractedData.exam_date;
        }
      } catch (e) {
        console.warn('Could not parse exam date:', extractedData.exam_date);
      }
    }

    if (extractedData.laboratory) {
      formData.laboratory = extractedData.laboratory;
    }

    if (extractedData.report) {
      formData.labResults = extractedData.report;
    }

    // Format variables into a readable string
    if (extractedData.variables && extractedData.variables.length > 0) {
      const variablesText = extractedData.variables
        .map(v => {
          let text = `${v.name}: ${v.value}`;
          if (v.unit) text += ` ${v.unit}`;
          if (v.reference_range) text += ` (Ref: ${v.reference_range})`;
          return text;
        })
        .join('\n');
      
      formData.extractedVariables = variablesText;
    }

    if (extractedData.raw_text) {
      formData.rawText = extractedData.raw_text;
    }

    return formData;
  };

  return {
    extractDataFromPdf,
    populateFormWithExtractedData,
    isExtracting
  };
};