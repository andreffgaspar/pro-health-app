import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePdfExtraction } from "@/hooks/usePdfExtraction";
import { 
  Plus, 
  Moon, 
  Utensils, 
  Activity, 
  Heart, 
  Save,
  Stethoscope,
  UserMinus,
  Upload,
  FileText,
  X,
  Zap,
  AlertCircle
} from "lucide-react";

interface DataInputModalProps {
  trigger?: React.ReactNode;
  initialTab?: string;
}

const DataInputModal = ({ trigger, initialTab = "sleep" }: DataInputModalProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab);
  const { toast } = useToast();
  const { user } = useAuth();
  const { extractDataFromFile, populateFormWithExtractedData, isExtracting } = usePdfExtraction();
  
  // Update active tab when initialTab prop changes
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);
  
  // Enhanced state for form data
  const [sleepData, setSleepData] = useState({
    hours: "",
    quality: "",
    bedTime: "",
    wakeTime: "",
    interruptions: "",
    notes: ""
  });

  const [nutritionData, setNutritionData] = useState({
    calories: "",
    protein: "",
    carbs: "",
    fats: "",
    fiber: "",
    water: "",
    meals: "",
    supplements: "",
    allergies: "",
    dietaryRestrictions: "",
    notes: ""
  });

  const [trainingData, setTrainingData] = useState({
    type: "",
    duration: "",
    intensity: "",
    exercises: "",
    sets: "",
    reps: "",
    weight: "",
    calories: "",
    heartRateAvg: "",
    heartRateMax: "",
    perceivedExertion: "",
    location: "",
    equipment: "",
    weather: "",
    injuries: "",
    notes: ""
  });

  const [physiotherapyData, setPhysiotherapyData] = useState({
    therapistName: "",
    sessionType: "",
    duration: "",
    exercises: "",
    painLevel: "",
    mobility: "",
    strength: "",
    recommendations: "",
    nextSession: "",
    notes: ""
  });

  const [medicalData, setMedicalData] = useState({
    doctorName: "",
    appointmentType: "",
    symptoms: "",
    diagnosis: "",
    medications: "",
    dosage: "",
    sideEffects: "",
    recommendations: "",
    followUp: "",
    labResults: "",
    laboratory: "",
    appointmentDate: "",
    extractedVariables: "",
    rawText: "",
    notes: "",
    files: [] as File[]
  });

  const [vitalData, setVitalData] = useState({
    heartRate: "",
    bloodPressure: "",
    weight: "",
    bodyFat: "",
    muscleMass: "",
    temperature: "",
    oxygenSaturation: "",
    glucose: "",
    notes: ""
  });

  const handleSaveData = async (dataType: string, data: any) => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para salvar dados.",
        variant: "destructive"
      });
      return;
    }

    // Validate required fields based on data type
    const validationErrors = validateDataFields(dataType, data);
    if (validationErrors.length > 0) {
      toast({
        title: "Campos obrigatórios",
        description: `Preencha: ${validationErrors.join(', ')}`,
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      let uploadedFiles: string[] = [];

      // Handle file uploads for medical data
      if (dataType === 'medical' && data.files && data.files.length > 0) {
        const uploadPromises = data.files.map(async (file: File) => {
          const fileExtension = file.name.split('.').pop();
          const fileName = `${user.id}/${Date.now()}_${file.name}`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('medical-files')
            .upload(fileName, file);

          if (uploadError) {
            console.error('Error uploading file:', uploadError);
            throw uploadError;
          }

          return uploadData.path;
        });

        uploadedFiles = await Promise.all(uploadPromises);
      }

      // Create a copy of the data without the files property for storage
      const { files, ...dataToSave } = data;
      const finalData = {
        ...dataToSave,
        ...(uploadedFiles.length > 0 && { attachments: uploadedFiles })
      };

      const { error } = await supabase
        .from('athlete_data')
        .insert([{
          athlete_id: user.id,
          data_type: dataType,
          data: finalData,
          recorded_at: new Date().toISOString()
        }]);

      if (error) throw error;

      toast({
        title: "Dados salvos com sucesso!",
        description: `Seus dados de ${getDataTypeLabel(dataType)} foram registrados.${uploadedFiles.length > 0 ? ` ${uploadedFiles.length} arquivo(s) anexado(s).` : ''}`,
      });

      // Reset form data based on type
      resetFormData(dataType);
      
      // Close modal after successful save
      setOpen(false);

    } catch (error) {
      console.error('Error saving data:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar os dados. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const validateDataFields = (dataType: string, data: any): string[] => {
    const errors: string[] = [];
    
    switch (dataType) {
      case 'sleep':
        if (!data.hours) errors.push('Horas de sono');
        if (!data.quality) errors.push('Qualidade do sono');
        break;
      case 'nutrition':
        if (!data.calories) errors.push('Calorias');
        break;
      case 'training':
        if (!data.type) errors.push('Tipo de treino');
        if (!data.duration) errors.push('Duração');
        break;
      case 'physiotherapy':
        if (!data.sessionType) errors.push('Tipo de sessão');
        if (!data.duration) errors.push('Duração');
        break;
      case 'medical':
        if (!data.appointmentType) errors.push('Tipo de consulta');
        break;
      case 'vitals':
        if (!data.heartRate && !data.weight && !data.bloodPressure) {
          errors.push('Pelo menos um dado vital');
        }
        break;
    }
    
    return errors;
  };

  const getDataTypeLabel = (dataType: string): string => {
    const labels = {
      'sleep': 'sono',
      'nutrition': 'nutrição',
      'training': 'treino',
      'physiotherapy': 'fisioterapia',
      'medical': 'consulta médica',
      'vitals': 'dados vitais'
    };
    return labels[dataType as keyof typeof labels] || dataType;
  };

  const resetFormData = (dataType: string) => {
    switch (dataType) {
      case 'sleep':
        setSleepData({ hours: "", quality: "", bedTime: "", wakeTime: "", interruptions: "", notes: "" });
        break;
      case 'nutrition':
        setNutritionData({ calories: "", protein: "", carbs: "", fats: "", fiber: "", water: "", meals: "", supplements: "", allergies: "", dietaryRestrictions: "", notes: "" });
        break;
      case 'training':
        setTrainingData({ type: "", duration: "", intensity: "", exercises: "", sets: "", reps: "", weight: "", calories: "", heartRateAvg: "", heartRateMax: "", perceivedExertion: "", location: "", equipment: "", weather: "", injuries: "", notes: "" });
        break;
      case 'physiotherapy':
        setPhysiotherapyData({ therapistName: "", sessionType: "", duration: "", exercises: "", painLevel: "", mobility: "", strength: "", recommendations: "", nextSession: "", notes: "" });
        break;
      case 'medical':
        setMedicalData({ doctorName: "", appointmentType: "", symptoms: "", diagnosis: "", medications: "", dosage: "", sideEffects: "", recommendations: "", followUp: "", labResults: "", laboratory: "", appointmentDate: "", extractedVariables: "", rawText: "", notes: "", files: [] });
        break;
      case 'vitals':
        setVitalData({ heartRate: "", bloodPressure: "", weight: "", bodyFat: "", muscleMass: "", temperature: "", oxygenSaturation: "", glucose: "", notes: "" });
        break;
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files) return;
    
    const validFiles = Array.from(files).filter(file => {
      // Accept common medical file formats
      const validTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/jpg',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      const maxSize = 10 * 1024 * 1024; // 10MB
      
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Formato não suportado",
          description: `O arquivo ${file.name} não está em um formato válido.`,
          variant: "destructive"
        });
        return false;
      }
      
      if (file.size > maxSize) {
        toast({
          title: "Arquivo muito grande",
          description: `O arquivo ${file.name} é maior que 10MB.`,
          variant: "destructive"
        });
        return false;
      }
      
      return true;
    });

    // Add files to state
    setMedicalData({
      ...medicalData,
      files: [...medicalData.files, ...validFiles]
    });

    // Trigger extraction automatically for supported files (PDF or images)
    const supportedFiles = validFiles.filter(file => 
      file.type === 'application/pdf' || file.type.startsWith('image/')
    );
    
    if (supportedFiles.length > 0) {
      // Extract data from the first supported file automatically
      await handleFileExtraction(supportedFiles[0]);
    }
  };

  const handleFileExtraction = async (file: File) => {
    try {
      const result = await extractDataFromFile(file);
      if (result.success && result.extractedData) {
        const formData = populateFormWithExtractedData(result.extractedData);
        setMedicalData(prev => ({
          ...prev,
          ...formData
        }));
        
        toast({
          title: "Dados extraídos com sucesso!",
          description: `Informações extraídas automaticamente de ${file.name} usando Gemini AI.`,
        });
      }
    } catch (error) {
      console.error('Error in file extraction:', error);
      toast({
        title: "Erro na extração",
        description: "Não foi possível extrair dados automaticamente. Preencha manualmente.",
        variant: "destructive"
      });
    }
  };

  const removeFile = (index: number) => {
    const newFiles = medicalData.files.filter((_, i) => i !== index);
    setMedicalData({ ...medicalData, files: newFiles });
  };

  const defaultTrigger = (
    <Button variant="hero" className="gap-2">
      <Plus className="w-4 h-4" />
      Registrar Dados
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Registrar Dados de Performance e Saúde
          </DialogTitle>
          <DialogDescription>
            Adicione suas métricas detalhadas para acompanhar sua evolução completa
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="sleep" className="gap-1 text-xs">
              <Moon className="w-3 h-3" />
              Sono
            </TabsTrigger>
            <TabsTrigger value="nutrition" className="gap-1 text-xs">
              <Utensils className="w-3 h-3" />
              Nutrição
            </TabsTrigger>
            <TabsTrigger value="training" className="gap-1 text-xs">
              <Activity className="w-3 h-3" />
              Treino
            </TabsTrigger>
            <TabsTrigger value="physiotherapy" className="gap-1 text-xs">
              <UserMinus className="w-3 h-3" />
              Fisioterapia
            </TabsTrigger>
            <TabsTrigger value="medical" className="gap-1 text-xs">
              <Stethoscope className="w-3 h-3" />
              Médico
            </TabsTrigger>
            <TabsTrigger value="vitals" className="gap-1 text-xs">
              <Heart className="w-3 h-3" />
              Vitais
            </TabsTrigger>
          </TabsList>

          {/* Sleep Tab */}
          <TabsContent value="sleep">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Moon className="w-5 h-5 text-blue-500" />
                  Dados do Sono
                </CardTitle>
                <CardDescription>
                  Registre informações detalhadas sobre sua qualidade de sono
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sleep-hours">Horas de Sono</Label>
                    <Input
                      id="sleep-hours"
                      type="number"
                      step="0.5"
                      placeholder="8.5"
                      value={sleepData.hours}
                      onChange={(e) => setSleepData({...sleepData, hours: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Qualidade do Sono</Label>
                    <Select value={sleepData.quality} onValueChange={(value) => setSleepData({...sleepData, quality: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Avalie de 1 a 5" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 - Muito Ruim</SelectItem>
                        <SelectItem value="2">2 - Ruim</SelectItem>
                        <SelectItem value="3">3 - Regular</SelectItem>
                        <SelectItem value="4">4 - Bom</SelectItem>
                        <SelectItem value="5">5 - Excelente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="interruptions">Interrupções</Label>
                    <Input
                      id="interruptions"
                      type="number"
                      placeholder="2"
                      value={sleepData.interruptions}
                      onChange={(e) => setSleepData({...sleepData, interruptions: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bed-time">Hora de Dormir</Label>
                    <Input
                      id="bed-time"
                      type="time"
                      value={sleepData.bedTime}
                      onChange={(e) => setSleepData({...sleepData, bedTime: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="wake-time">Hora de Acordar</Label>
                    <Input
                      id="wake-time"
                      type="time"
                      value={sleepData.wakeTime}
                      onChange={(e) => setSleepData({...sleepData, wakeTime: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sleep-notes">Observações sobre o Sono</Label>
                  <Textarea
                    id="sleep-notes"
                    placeholder="Descreva como foi seu sono, fatores que influenciaram..."
                    value={sleepData.notes}
                    onChange={(e) => setSleepData({...sleepData, notes: e.target.value})}
                  />
                </div>
                
                <Button 
                  onClick={() => handleSaveData("sleep", sleepData)} 
                  className="w-full"
                  disabled={loading}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? "Salvando..." : "Salvar Dados do Sono"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Nutrition Tab */}
          <TabsContent value="nutrition">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-orange-500" />
                  Dados Nutricionais
                </CardTitle>
                <CardDescription>
                  Registre informações detalhadas sobre alimentação e suplementação
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="calories">Calorias (kcal)</Label>
                    <Input
                      id="calories"
                      type="number"
                      placeholder="2250"
                      value={nutritionData.calories}
                      onChange={(e) => setNutritionData({...nutritionData, calories: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="protein">Proteínas (g)</Label>
                    <Input
                      id="protein"
                      type="number"
                      placeholder="150"
                      value={nutritionData.protein}
                      onChange={(e) => setNutritionData({...nutritionData, protein: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="carbs">Carboidratos (g)</Label>
                    <Input
                      id="carbs"
                      type="number"
                      placeholder="300"
                      value={nutritionData.carbs}
                      onChange={(e) => setNutritionData({...nutritionData, carbs: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fats">Gorduras (g)</Label>
                    <Input
                      id="fats"
                      type="number"
                      placeholder="80"
                      value={nutritionData.fats}
                      onChange={(e) => setNutritionData({...nutritionData, fats: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fiber">Fibras (g)</Label>
                    <Input
                      id="fiber"
                      type="number"
                      placeholder="25"
                      value={nutritionData.fiber}
                      onChange={(e) => setNutritionData({...nutritionData, fiber: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="water">Água (Litros)</Label>
                    <Input
                      id="water"
                      type="number"
                      step="0.1"
                      placeholder="3.2"
                      value={nutritionData.water}
                      onChange={(e) => setNutritionData({...nutritionData, water: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="meals">Refeições Principais</Label>
                    <Textarea
                      id="meals"
                      placeholder="Café da manhã: aveia com frutas&#10;Almoço: arroz, feijão, frango..."
                      value={nutritionData.meals}
                      onChange={(e) => setNutritionData({...nutritionData, meals: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="supplements">Suplementos</Label>
                    <Textarea
                      id="supplements"
                      placeholder="Whey protein 30g, Creatina 5g, Vitamina D..."
                      value={nutritionData.supplements}
                      onChange={(e) => setNutritionData({...nutritionData, supplements: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="allergies">Alergias Alimentares</Label>
                    <Input
                      id="allergies"
                      placeholder="Lactose, amendoim..."
                      value={nutritionData.allergies}
                      onChange={(e) => setNutritionData({...nutritionData, allergies: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="restrictions">Restrições Dietéticas</Label>
                    <Input
                      id="restrictions"
                      placeholder="Vegetariano, sem glúten..."
                      value={nutritionData.dietaryRestrictions}
                      onChange={(e) => setNutritionData({...nutritionData, dietaryRestrictions: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nutrition-notes">Observações Nutricionais</Label>
                  <Textarea
                    id="nutrition-notes"
                    placeholder="Como se sentiu após as refeições, digestão, energia..."
                    value={nutritionData.notes}
                    onChange={(e) => setNutritionData({...nutritionData, notes: e.target.value})}
                  />
                </div>
                
                <Button 
                  onClick={() => handleSaveData("nutrition", nutritionData)} 
                  className="w-full"
                  disabled={loading}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? "Salvando..." : "Salvar Dados Nutricionais"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Training Tab */}
          <TabsContent value="training">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-green-500" />
                  Dados do Treino
                </CardTitle>
                <CardDescription>
                  Registre informações detalhadas sobre sua sessão de treino
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="training-type">Tipo de Treino</Label>
                    <Select value={trainingData.type} onValueChange={(value) => setTrainingData({...trainingData, type: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cardio">Cardio</SelectItem>
                        <SelectItem value="forca">Força/Musculação</SelectItem>
                        <SelectItem value="hiit">HIIT</SelectItem>
                        <SelectItem value="funcional">Funcional</SelectItem>
                        <SelectItem value="esporte">Esporte Específico</SelectItem>
                        <SelectItem value="flexibilidade">Flexibilidade/Yoga</SelectItem>
                        <SelectItem value="tecnico">Técnico</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration">Duração (minutos)</Label>
                    <Input
                      id="duration"
                      type="number"
                      placeholder="90"
                      value={trainingData.duration}
                      onChange={(e) => setTrainingData({...trainingData, duration: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Intensidade</Label>
                    <Select value={trainingData.intensity} onValueChange={(value) => setTrainingData({...trainingData, intensity: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Intensidade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="baixa">Baixa (50-60%)</SelectItem>
                        <SelectItem value="moderada">Moderada (60-70%)</SelectItem>
                        <SelectItem value="alta">Alta (70-85%)</SelectItem>
                        <SelectItem value="maxima">Máxima (85%+)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sets">Séries</Label>
                    <Input
                      id="sets"
                      type="number"
                      placeholder="4"
                      value={trainingData.sets}
                      onChange={(e) => setTrainingData({...trainingData, sets: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reps">Repetições</Label>
                    <Input
                      id="reps"
                      placeholder="8-12"
                      value={trainingData.reps}
                      onChange={(e) => setTrainingData({...trainingData, reps: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="training-weight">Peso Total (kg)</Label>
                    <Input
                      id="training-weight"
                      type="number"
                      placeholder="1200"
                      value={trainingData.weight}
                      onChange={(e) => setTrainingData({...trainingData, weight: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="training-calories">Calorias Queimadas</Label>
                    <Input
                      id="training-calories"
                      type="number"
                      placeholder="450"
                      value={trainingData.calories}
                      onChange={(e) => setTrainingData({...trainingData, calories: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hr-avg">FC Média (bpm)</Label>
                    <Input
                      id="hr-avg"
                      type="number"
                      placeholder="145"
                      value={trainingData.heartRateAvg}
                      onChange={(e) => setTrainingData({...trainingData, heartRateAvg: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hr-max">FC Máxima (bpm)</Label>
                    <Input
                      id="hr-max"
                      type="number"
                      placeholder="175"
                      value={trainingData.heartRateMax}
                      onChange={(e) => setTrainingData({...trainingData, heartRateMax: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>RPE (1-10)</Label>
                    <Select value={trainingData.perceivedExertion} onValueChange={(value) => setTrainingData({...trainingData, perceivedExertion: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Esforço percebido" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({length: 10}, (_, i) => (
                          <SelectItem key={i+1} value={String(i+1)}>{i+1} - {
                            i < 2 ? "Muito Fácil" :
                            i < 4 ? "Fácil" :
                            i < 6 ? "Moderado" :
                            i < 8 ? "Difícil" : "Máximo"
                          }</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Local</Label>
                    <Input
                      id="location"
                      placeholder="Academia, casa, parque..."
                      value={trainingData.location}
                      onChange={(e) => setTrainingData({...trainingData, location: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="weather">Clima</Label>
                    <Input
                      id="weather"
                      placeholder="Ensolarado, 25°C..."
                      value={trainingData.weather}
                      onChange={(e) => setTrainingData({...trainingData, weather: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="exercises">Exercícios Realizados</Label>
                    <Textarea
                      id="exercises"
                      placeholder="Agachamento 4x8, Supino 3x10, Corrida 30min..."
                      value={trainingData.exercises}
                      onChange={(e) => setTrainingData({...trainingData, exercises: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="equipment">Equipamentos Utilizados</Label>
                    <Textarea
                      id="equipment"
                      placeholder="Halteres, barras, esteira, TRX..."
                      value={trainingData.equipment}
                      onChange={(e) => setTrainingData({...trainingData, equipment: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="injuries">Lesões/Limitações</Label>
                    <Textarea
                      id="injuries"
                      placeholder="Dor no joelho direito, cuidado com ombro..."
                      value={trainingData.injuries}
                      onChange={(e) => setTrainingData({...trainingData, injuries: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="training-notes">Observações do Treino</Label>
                    <Textarea
                      id="training-notes"
                      placeholder="Como se sentiu, evolução, pontos de atenção..."
                      value={trainingData.notes}
                      onChange={(e) => setTrainingData({...trainingData, notes: e.target.value})}
                    />
                  </div>
                </div>
                
                <Button 
                  onClick={() => handleSaveData("training", trainingData)} 
                  className="w-full"
                  disabled={loading}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? "Salvando..." : "Salvar Dados do Treino"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Physiotherapy Tab */}
          <TabsContent value="physiotherapy">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserMinus className="w-5 h-5 text-purple-500" />
                  Dados de Fisioterapia
                </CardTitle>
                <CardDescription>
                  Registre informações sobre sessões de fisioterapia e reabilitação
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="therapist">Nome do Fisioterapeuta</Label>
                    <Input
                      id="therapist"
                      placeholder="Dr. João Silva"
                      value={physiotherapyData.therapistName}
                      onChange={(e) => setPhysiotherapyData({...physiotherapyData, therapistName: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Tipo de Sessão</Label>
                    <Select value={physiotherapyData.sessionType} onValueChange={(value) => setPhysiotherapyData({...physiotherapyData, sessionType: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tipo de sessão" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="avaliacao">Avaliação</SelectItem>
                        <SelectItem value="tratamento">Tratamento</SelectItem>
                        <SelectItem value="reabilitacao">Reabilitação</SelectItem>
                        <SelectItem value="preventivo">Preventivo</SelectItem>
                        <SelectItem value="massagem">Massagem Terapêutica</SelectItem>
                        <SelectItem value="alongamento">Alongamento</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="physio-duration">Duração (minutos)</Label>
                    <Input
                      id="physio-duration"
                      type="number"
                      placeholder="60"
                      value={physiotherapyData.duration}
                      onChange={(e) => setPhysiotherapyData({...physiotherapyData, duration: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Nível de Dor (0-10)</Label>
                    <Select value={physiotherapyData.painLevel} onValueChange={(value) => setPhysiotherapyData({...physiotherapyData, painLevel: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Intensidade da dor" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({length: 11}, (_, i) => (
                          <SelectItem key={i} value={String(i)}>{i} - {
                            i === 0 ? "Sem dor" :
                            i <= 3 ? "Leve" :
                            i <= 6 ? "Moderada" :
                            i <= 8 ? "Intensa" : "Insuportável"
                          }</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Mobilidade</Label>
                    <Select value={physiotherapyData.mobility} onValueChange={(value) => setPhysiotherapyData({...physiotherapyData, mobility: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Avalie a mobilidade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="limitada">Limitada</SelectItem>
                        <SelectItem value="reduzida">Reduzida</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="boa">Boa</SelectItem>
                        <SelectItem value="excelente">Excelente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Força Muscular</Label>
                    <Select value={physiotherapyData.strength} onValueChange={(value) => setPhysiotherapyData({...physiotherapyData, strength: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Avalie a força" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="muito-fraca">Muito Fraca</SelectItem>
                        <SelectItem value="fraca">Fraca</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="boa">Boa</SelectItem>
                        <SelectItem value="muito-boa">Muito Boa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="next-session">Próxima Sessão</Label>
                    <Input
                      id="next-session"
                      type="date"
                      value={physiotherapyData.nextSession}
                      onChange={(e) => setPhysiotherapyData({...physiotherapyData, nextSession: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="physio-exercises">Exercícios Realizados</Label>
                    <Textarea
                      id="physio-exercises"
                      placeholder="Fortalecimento de quadríceps, alongamento de isquiotibiais..."
                      value={physiotherapyData.exercises}
                      onChange={(e) => setPhysiotherapyData({...physiotherapyData, exercises: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="recommendations">Recomendações</Label>
                    <Textarea
                      id="recommendations"
                      placeholder="Gelo 3x ao dia, evitar corrida por 1 semana..."
                      value={physiotherapyData.recommendations}
                      onChange={(e) => setPhysiotherapyData({...physiotherapyData, recommendations: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="physio-notes">Observações da Sessão</Label>
                  <Textarea
                    id="physio-notes"
                    placeholder="Evolução do tratamento, feedback do paciente..."
                    value={physiotherapyData.notes}
                    onChange={(e) => setPhysiotherapyData({...physiotherapyData, notes: e.target.value})}
                  />
                </div>
                
                <Button 
                  onClick={() => handleSaveData("physiotherapy", physiotherapyData)} 
                  className="w-full"
                  disabled={loading}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? "Salvando..." : "Salvar Dados de Fisioterapia"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Medical Tab */}
          <TabsContent value="medical">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-red-600" />
                  Dados Médicos
                </CardTitle>
                <CardDescription>
                  Registre informações sobre consultas médicas e exames
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* File Upload Section - Moved to top */}
                <div className="space-y-4 bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <Upload className="w-5 h-5 text-primary" />
                    <Label className="text-foreground font-medium">1. Anexar Arquivo Médico (Primeiro)</Label>
                  </div>
                  <div className="border-2 border-dashed border-border rounded-lg p-6">
                    <div className="text-center">
                      <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground mb-2">
                        Clique para anexar ou arraste arquivos aqui
                      </p>
                      <p className="text-xs text-muted-foreground mb-2">
                        PDF, JPG, PNG, DOC, DOCX até 10MB
                      </p>
                      <div className="bg-blue-50 border border-blue-200 rounded p-2 mb-4">
                        <p className="text-xs text-blue-700 flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          Gemini AI extrairá automaticamente todas as informações médicas!
                        </p>
                      </div>
                      <Input
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        onChange={(e) => handleFileUpload(e.target.files)}
                        className="hidden"
                        id="file-upload"
                        disabled={isExtracting}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('file-upload')?.click()}
                        disabled={isExtracting}
                      >
                        {isExtracting ? "Processando com IA..." : "Selecionar Arquivos"}
                      </Button>
                    </div>
                  </div>

                  {/* File List */}
                  {medicalData.files.length > 0 && (
                    <div className="space-y-2">
                      <Label>Arquivos Selecionados ({medicalData.files.length})</Label>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {medicalData.files.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm truncate">{file.name}</span>
                              <span className="text-xs text-muted-foreground">
                                ({(file.size / 1024 / 1024).toFixed(1)}MB)
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(index)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Extraction Status */}
                {isExtracting && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-blue-600 animate-pulse" />
                      <span className="text-blue-800 font-medium">Extraindo dados com Gemini AI...</span>
                    </div>
                    <p className="text-blue-600 text-sm mt-1">
                      Analisando arquivo e extraindo informações médicas automaticamente.
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-2 mb-4">
                  <span className="text-muted-foreground">2.</span>
                  <Label className="text-foreground font-medium">Dados Básicos do Exame</Label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="doctor">Nome do Médico</Label>
                    <Input
                      id="doctor"
                      placeholder="Dr. Maria Santos"
                      value={medicalData.doctorName}
                      onChange={(e) => setMedicalData({...medicalData, doctorName: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="laboratory">Laboratório</Label>
                    <Input
                      id="laboratory"
                      placeholder="Lab Central"
                      value={medicalData.laboratory}
                      onChange={(e) => setMedicalData({...medicalData, laboratory: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="appointment-date">Data do Exame</Label>
                    <Input
                      id="appointment-date"
                      type="date"
                      value={medicalData.appointmentDate}
                      onChange={(e) => setMedicalData({...medicalData, appointmentDate: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Tipo de Consulta</Label>
                    <Select value={medicalData.appointmentType} onValueChange={(value) => setMedicalData({...medicalData, appointmentType: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tipo de consulta" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rotina">Check-up de Rotina</SelectItem>
                        <SelectItem value="emergencia">Emergência</SelectItem>
                        <SelectItem value="especialista">Especialista</SelectItem>
                        <SelectItem value="acompanhamento">Acompanhamento</SelectItem>
                        <SelectItem value="preventiva">Consulta Preventiva</SelectItem>
                        <SelectItem value="exames">Resultado de Exames</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="follow-up">Data do Retorno</Label>
                    <Input
                      id="follow-up"
                      type="date"
                      value={medicalData.followUp}
                      onChange={(e) => setMedicalData({...medicalData, followUp: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="symptoms">Sintomas Relatados</Label>
                    <Textarea
                      id="symptoms"
                      placeholder="Dor de cabeça, fadiga, dor no joelho..."
                      value={medicalData.symptoms}
                      onChange={(e) => setMedicalData({...medicalData, symptoms: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="diagnosis">Diagnóstico</Label>
                    <Textarea
                      id="diagnosis"
                      placeholder="Diagnóstico médico, CID se aplicável..."
                      value={medicalData.diagnosis}
                      onChange={(e) => setMedicalData({...medicalData, diagnosis: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="medications">Medicamentos Prescritos</Label>
                    <Textarea
                      id="medications"
                      placeholder="Paracetamol, Ibuprofeno, Vitamina D..."
                      value={medicalData.medications}
                      onChange={(e) => setMedicalData({...medicalData, medications: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dosage">Dosagem e Frequência</Label>
                    <Textarea
                      id="dosage"
                      placeholder="500mg 2x ao dia, 1 comprimido pela manhã..."
                      value={medicalData.dosage}
                      onChange={(e) => setMedicalData({...medicalData, dosage: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="side-effects">Efeitos Colaterais</Label>
                    <Textarea
                      id="side-effects"
                      placeholder="Sonolência, náusea, dor de estômago..."
                      value={medicalData.sideEffects}
                      onChange={(e) => setMedicalData({...medicalData, sideEffects: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lab-results">Resultados de Exames / Laudo</Label>
                    <Textarea
                      id="lab-results"
                      placeholder="Glicemia: 85mg/dL, Colesterol: 180mg/dL..."
                      value={medicalData.labResults}
                      onChange={(e) => setMedicalData({...medicalData, labResults: e.target.value})}
                      className="min-h-[100px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="medical-recommendations">Recomendações Médicas</Label>
                    <Textarea
                      id="medical-recommendations"
                      placeholder="Repouso, mudanças na dieta, exercícios específicos..."
                      value={medicalData.recommendations}
                      onChange={(e) => setMedicalData({...medicalData, recommendations: e.target.value})}
                    />
                  </div>
                </div>

                {/* Extracted Data Section */}
                {(medicalData.extractedVariables || medicalData.rawText) && (
                  <div className="space-y-4 bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-primary" />
                      <Label className="text-foreground font-medium">Dados Extraídos Automaticamente</Label>
                    </div>
                    
                    {medicalData.extractedVariables && (
                      <div className="space-y-2">
                        <Label htmlFor="extracted-variables" className="text-foreground">Variáveis do Exame</Label>
                        <Textarea
                          id="extracted-variables"
                          value={medicalData.extractedVariables}
                          onChange={(e) => setMedicalData({...medicalData, extractedVariables: e.target.value})}
                          className="bg-background text-foreground border-border min-h-[120px]"
                          placeholder="Variáveis e valores extraídos do PDF..."
                        />
                      </div>
                    )}
                    
                    {medicalData.rawText && (
                      <div className="space-y-2">
                        <Label htmlFor="raw-text" className="text-foreground">Texto Completo Extraído</Label>
                        <Textarea
                          id="raw-text"
                          value={medicalData.rawText}
                          onChange={(e) => setMedicalData({...medicalData, rawText: e.target.value})}
                          className="bg-background text-foreground border-border min-h-[100px] text-xs font-mono"
                          placeholder="Texto completo extraído do PDF..."
                        />
                      </div>
                    )}
                  </div>
                )}


                <div className="space-y-2">
                  <Label htmlFor="medical-notes">Observações Médicas</Label>
                  <Textarea
                    id="medical-notes"
                    placeholder="Observações gerais da consulta, orientações especiais..."
                    value={medicalData.notes}
                    onChange={(e) => setMedicalData({...medicalData, notes: e.target.value})}
                  />
                </div>
                
                <Button 
                  onClick={() => handleSaveData("medical", medicalData)} 
                  className="w-full"
                  disabled={loading}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? "Salvando..." : "Salvar Dados Médicos"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Vitals Tab */}
          <TabsContent value="vitals">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-500" />
                  Dados Vitais
                </CardTitle>
                <CardDescription>
                  Registre seus indicadores vitais e biométricos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="heart-rate">Frequência Cardíaca (bpm)</Label>
                    <Input
                      id="heart-rate"
                      type="number"
                      placeholder="65"
                      value={vitalData.heartRate}
                      onChange={(e) => setVitalData({...vitalData, heartRate: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="blood-pressure">Pressão Arterial (mmHg)</Label>
                    <Input
                      id="blood-pressure"
                      placeholder="120/80"
                      value={vitalData.bloodPressure}
                      onChange={(e) => setVitalData({...vitalData, bloodPressure: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vital-weight">Peso (kg)</Label>
                    <Input
                      id="vital-weight"
                      type="number"
                      step="0.1"
                      placeholder="75.5"
                      value={vitalData.weight}
                      onChange={(e) => setVitalData({...vitalData, weight: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="body-fat">% Gordura Corporal</Label>
                    <Input
                      id="body-fat"
                      type="number"
                      step="0.1"
                      placeholder="12.5"
                      value={vitalData.bodyFat}
                      onChange={(e) => setVitalData({...vitalData, bodyFat: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="muscle-mass">Massa Muscular (kg)</Label>
                    <Input
                      id="muscle-mass"
                      type="number"
                      step="0.1"
                      placeholder="45.2"
                      value={vitalData.muscleMass}
                      onChange={(e) => setVitalData({...vitalData, muscleMass: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="temperature">Temperatura (°C)</Label>
                    <Input
                      id="temperature"
                      type="number"
                      step="0.1"
                      placeholder="36.5"
                      value={vitalData.temperature}
                      onChange={(e) => setVitalData({...vitalData, temperature: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="oxygen">Saturação O₂ (%)</Label>
                    <Input
                      id="oxygen"
                      type="number"
                      placeholder="98"
                      value={vitalData.oxygenSaturation}
                      onChange={(e) => setVitalData({...vitalData, oxygenSaturation: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="glucose">Glicemia (mg/dL)</Label>
                    <Input
                      id="glucose"
                      type="number"
                      placeholder="85"
                      value={vitalData.glucose}
                      onChange={(e) => setVitalData({...vitalData, glucose: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vital-notes">Observações sobre Sinais Vitais</Label>
                  <Textarea
                    id="vital-notes"
                    placeholder="Contexto da medição, como se sentia no momento..."
                    value={vitalData.notes}
                    onChange={(e) => setVitalData({...vitalData, notes: e.target.value})}
                  />
                </div>
                
                <Button 
                  onClick={() => handleSaveData("vitals", vitalData)} 
                  className="w-full"
                  disabled={loading}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? "Salvando..." : "Salvar Dados Vitais"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default DataInputModal;